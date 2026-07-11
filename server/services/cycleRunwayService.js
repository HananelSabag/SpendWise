/**
 * Cycle / Runway Service — the "how am I doing since my last paycheck" view.
 *
 * This is Hananel's original coveted number ("מאזן יומי"): a cycle is anchored on
 * the SALARY (the refill), not the calendar 1st. The current cycle runs from the
 * most recent salary deposit up to today; the previous cycle runs salary-to-salary.
 * Within the window we simply SUM — money out (every economic expense counted
 * once) and money in EXCLUDING salary — and pair it with the real checking balance.
 * No per-day allowance formula: just honest cumulative totals since the reset,
 * plus daily averages for retrospection.
 *
 * Reuses the proven `summarizeCalendar` engine so a shekel is never double-counted:
 * itemized card purchases count; monthly/immediate settlements don't; debit is the
 * bank-primary fact. Edge case handled: when a card company is NOT connected, its
 * bank charge is the real spend (no itemized detail) rather than mere reconciliation.
 *
 * Projection (expected next salary / expected manual charge) is a separate, opt-in
 * layer built on top of this — this service reports only actual facts + balance.
 *
 * @module services/cycleRunwayService
 */

const db = require('../config/db');
const { INSTITUTIONS, institutionKind } = require('../config/institutions');
const { getCalendarPeriod, TZ } = require('../utils/calendarPeriod');
const { classifyTransaction, summarizeCalendar } = require('./financialClassificationService');
const { deriveDebitCardAccounts, dateKey } = require('./cardReconciliationService');

const CARD_SOURCES = Object.entries(INSTITUTIONS).filter(([, x]) => x.kind === 'credit_card').map(([x]) => x);
const SELECT_COLUMNS = `id, bank_source, bank_account_number, amount, type, description, notes,
  date, transaction_datetime, bank_processed_date, bank_status, bank_sync_id, raw_category,
  original_amount, original_currency, charged_currency, txn_kind,
  installment_number, installment_total, ledger_class,
  settlement_card_source, settlement_card_account`;

const round2 = (v) => Math.round(((Number(v) || 0) + Number.EPSILON) * 100) / 100;

function todayKey() {
  return dateKey(new Date());
}

function daysBetween(startKey, endKey) {
  const ms = Date.parse(`${endKey}T00:00:00Z`) - Date.parse(`${startKey}T00:00:00Z`);
  return Math.max(1, Math.round(ms / 86400000));
}

/**
 * Build a salary-anchored cycle for a user.
 *
 * @param {number} userId
 * @param {number} [offset=0] 0 = current cycle (last salary → today),
 *   -1 = previous cycle (prior salary → last salary), etc.
 * @returns {Promise<object>}
 */
async function buildCycle(userId, offset = 0) {
  const [txnResult, signatureResult, balanceResult] = await Promise.all([
    // 150 days is enough to hold the last few salary cycles for anchoring.
    db.query(
      `SELECT ${SELECT_COLUMNS}
         FROM transactions
        WHERE user_id = $1 AND deleted_at IS NULL
          AND date >= (CURRENT_DATE - INTERVAL '150 days')
        ORDER BY date, id`,
      [userId],
    ),
    db.query('SELECT * FROM salary_signatures WHERE user_id = $1 AND active = true', [userId]),
    db.query(
      `SELECT bank_source, account_number, balance, enabled
         FROM bank_accounts WHERE user_id = $1`,
      [userId],
    ),
  ]);

  const rows = txnResult.rows;
  const connectedCardSources = [...new Set(
    balanceResult.rows.filter((a) => a.enabled && institutionKind(a.bank_source) === 'credit_card')
      .map((a) => a.bank_source),
  )];
  const context = {
    salarySignatures: signatureResult.rows,
    debitCardAccounts: deriveDebitCardAccounts(rows),
    connectedCardSources,
  };

  // Real checking balance = enabled bank-kind accounts only (cards never have one).
  const bankAccounts = balanceResult.rows.filter((a) => a.enabled && institutionKind(a.bank_source) === 'bank');
  const knownBalances = bankAccounts.filter((a) => a.balance !== null && a.balance !== undefined);
  const checkingBalance = knownBalances.length
    ? round2(knownBalances.reduce((s, a) => s + Number(a.balance), 0)) : null;

  // Salary deposit dates, newest first (distinct calendar days).
  const salaryDates = [...new Set(
    rows.filter((r) => classifyTransaction(r, context).salary)
      .map((r) => dateKey(r.date)).filter(Boolean),
  )].sort().reverse();

  const today = todayKey();
  let anchor = 'salary';
  let cycleStart;
  let cycleEnd;
  let needsSalarySetup = false;

  const idx = -offset; // offset 0 → most recent (index 0)
  if (salaryDates.length > idx) {
    cycleStart = salaryDates[idx];
    cycleEnd = idx === 0 ? nextDay(today) : salaryDates[idx - 1];
  } else {
    // Not enough salary history to anchor this cycle → calendar-month fallback.
    anchor = 'calendar_fallback';
    needsSalarySetup = signatureResult.rows.length === 0;
    const period = getCalendarPeriod(offset);
    cycleStart = period.start;
    cycleEnd = offset === 0 ? nextDay(today) : period.end;
  }

  const windowRows = rows.filter((r) => {
    const k = dateKey(r.date);
    return k && k >= cycleStart && k < cycleEnd;
  });
  const { totals } = summarizeCalendar(windowRows, context);

  const lastDay = offset === 0 ? today : prevDay(cycleEnd);
  const daysElapsed = daysBetween(cycleStart, offset === 0 ? nextDay(today) : cycleEnd);

  const spentActual = totals.spendActual;
  const spentCommitted = totals.spendCommitted;
  const incomeExSalary = totals.otherIncome;

  return {
    offset,
    anchor,
    isCurrent: offset === 0,
    needsSalarySetup,
    cycleStart,
    cycleEndExclusive: cycleEnd,
    lastDay,
    daysElapsed,
    timezone: TZ,
    // The live checking balance is a "now" fact — only meaningful for the current
    // cycle. A closed cycle reports what moved, not today's balance.
    checkingBalance: offset === 0 ? checkingBalance : null,
    salaryDate: anchor === 'salary' ? cycleStart : null,
    money: {
      spentActual,
      spentCommitted,
      spentPending: round2(spentCommitted - spentActual),
      incomeExSalary,
      salaryInWindow: totals.salaryIncome,
      netExSalaryActual: round2(incomeExSalary - spentActual),
      netExSalaryCommitted: round2(incomeExSalary - spentCommitted),
    },
    dailyAverage: {
      spent: round2(spentCommitted / daysElapsed),
      income: round2(incomeExSalary / daysElapsed),
    },
    needsReview: totals.needsReview,
  };
}

function nextDay(key) {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
function prevDay(key) {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

async function buildRunwayOverview(userId) {
  const [current, previous] = await Promise.all([buildCycle(userId, 0), buildCycle(userId, -1)]);
  return { current, previous, timezone: TZ };
}

module.exports = { buildCycle, buildRunwayOverview };
