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
const {
  classifyTransaction,
  summarizeCalendar,
  spendingBreakdown,
  withoutSupersededPendingBankRows,
} = require('./financialClassificationService');
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
 * Daily economic flow for a salary cycle. This deliberately uses the same
 * classifier as the headline totals: settlements and debit enrichment copies
 * disappear, pending spend is committed but not actual, and salary stays
 * visible without inflating income-since-salary.
 */
function buildDailyHistory(rows, context, cycleStart, cycleEndExclusive) {
  const byDate = new Map();
  let cursor = cycleStart;
  let guard = 0;
  while (cursor < cycleEndExclusive && guard < 370) {
    byDate.set(cursor, {
      date: cursor,
      spentActual: 0,
      spentCommitted: 0,
      spentPending: 0,
      incomeExSalary: 0,
      salaryIncome: 0,
      netExSalaryActual: 0,
      netExSalaryCommitted: 0,
      transactionCount: 0,
      needsReviewCount: 0,
    });
    cursor = nextDay(cursor);
    guard += 1;
  }

  for (const row of withoutSupersededPendingBankRows(rows)) {
    const key = dateKey(row.date);
    const day = key ? byDate.get(key) : null;
    if (!day) continue;
    const classification = classifyTransaction(row, context);
    const amount = Math.abs(Number(row.amount) || 0);
    if (classification.calendarInclusion === 'needs_review') {
      day.needsReviewCount += 1;
      continue;
    }
    if (classification.calendarInclusion !== 'include') continue;

    day.transactionCount += 1;
    if (classification.direction === 'spend') {
      day.spentCommitted += amount;
      if (!classification.pending) day.spentActual += amount;
    } else if (classification.direction === 'refund') {
      day.spentCommitted -= amount;
      if (!classification.pending) day.spentActual -= amount;
    } else if (classification.direction === 'income') {
      if (classification.salary) day.salaryIncome += amount;
      else day.incomeExSalary += amount;
    }
  }

  let cumulativeSpent = 0;
  let cumulativeIncome = 0;
  let cumulativeTotalIncome = 0;
  return [...byDate.values()].map((day) => {
    day.spentActual = round2(day.spentActual);
    day.spentCommitted = round2(day.spentCommitted);
    day.spentPending = round2(day.spentCommitted - day.spentActual);
    day.incomeExSalary = round2(day.incomeExSalary);
    day.salaryIncome = round2(day.salaryIncome);
    day.totalIncome = round2(day.salaryIncome + day.incomeExSalary);
    day.netExSalaryActual = round2(day.incomeExSalary - day.spentActual);
    day.netExSalaryCommitted = round2(day.incomeExSalary - day.spentCommitted);
    cumulativeSpent = round2(cumulativeSpent + day.spentCommitted);
    cumulativeIncome = round2(cumulativeIncome + day.incomeExSalary);
    cumulativeTotalIncome = round2(cumulativeTotalIncome + day.totalIncome);
    return {
      ...day,
      cumulativeSpent,
      cumulativeIncome,
      cumulativeTotalIncome,
      cumulativeNetIncludingSalary: round2(cumulativeTotalIncome - cumulativeSpent),
      cumulativeNetExSalary: round2(cumulativeIncome - cumulativeSpent),
    };
  });
}

function buildCardBillingCycles(rows, context) {
  const groups = new Map();
  for (const row of withoutSupersededPendingBankRows(rows)) {
    const classification = classifyTransaction(row, context);
    if (classification.sourceRole !== 'card_itemized') continue;
    if (classification.direction !== 'spend' && classification.direction !== 'refund') continue;
    const billingDate = dateKey(row.bank_processed_date) || null;
    const source = String(row.bank_source || 'unknown');
    const account = String(row.bank_account_number || '');
    const key = `${source}|${account}|${billingDate || 'unassigned'}`;
    const group = groups.get(key) || {
      bankSource: source,
      accountNumber: account,
      billingDate,
      posted: 0,
      pending: 0,
      refunds: 0,
      count: 0,
    };
    const amount = Math.abs(Number(row.amount) || 0);
    if (classification.direction === 'refund') group.refunds += amount;
    else group[classification.pending ? 'pending' : 'posted'] += amount;
    group.count += 1;
    groups.set(key, group);
  }
  return [...groups.values()]
    .map((group) => ({
      ...group,
      posted: round2(group.posted),
      pending: round2(group.pending),
      refunds: round2(group.refunds),
      total: round2(Math.max(0, group.posted + group.pending - group.refunds)),
    }))
    .sort((a, b) => String(a.billingDate || '9999').localeCompare(String(b.billingDate || '9999'))
      || a.bankSource.localeCompare(b.bankSource)
      || a.accountNumber.localeCompare(b.accountNumber));
}

/**
 * Build a salary-anchored cycle for a user.
 *
 * @param {number} userId
 * @param {number} [offset=0] 0 = current cycle (last salary → today),
 *   -1 = previous cycle (prior salary → last salary), etc.
 * @returns {Promise<object>}
 */
async function loadCycleData(userId) {
  const [txnResult, signatureResult, balanceResult, overridesResult] = await Promise.all([
    // 150 days is enough to hold the last few salary cycles for anchoring.
    db.query(
      `SELECT ${SELECT_COLUMNS}
         FROM transactions t
        WHERE t.user_id = $1 AND t.deleted_at IS NULL
          AND t.date >= (CURRENT_DATE - INTERVAL '150 days')
          AND (t.bank_source IS NULL OR NOT EXISTS (
            SELECT 1
              FROM bank_accounts ba_filter
             WHERE ba_filter.user_id = t.user_id
               AND ba_filter.bank_source = t.bank_source
               AND ba_filter.account_number = COALESCE(t.bank_account_number, '')
               AND ba_filter.enabled = false
          ))
        ORDER BY t.date, t.id`,
      [userId],
    ),
    db.query('SELECT * FROM salary_signatures WHERE user_id = $1 AND active = true', [userId]),
    db.query(
      `SELECT bank_source, account_number, balance, enabled
         FROM bank_accounts WHERE user_id = $1`,
      [userId],
    ),
    db.query('SELECT * FROM transaction_month_overrides WHERE user_id=$1', [userId]),
  ]);

  return {
    rows: txnResult.rows,
    salarySignatures: signatureResult.rows,
    accounts: balanceResult.rows,
    transactionOverrides: overridesResult.rows,
  };
}

function buildCycleFromData(data, offset = 0) {
  const rows = data.rows;
  const connectedCardSources = [...new Set(
    data.accounts.filter((a) => a.enabled && institutionKind(a.bank_source) === 'credit_card')
      .map((a) => a.bank_source),
  )];
  const context = {
    salarySignatures: data.salarySignatures,
    debitCardAccounts: deriveDebitCardAccounts(rows),
    connectedCardSources,
    transactionOverrides: data.transactionOverrides,
  };

  // Real checking balance = enabled bank-kind accounts only (cards never have one).
  const bankAccounts = data.accounts.filter((a) => a.enabled && institutionKind(a.bank_source) === 'bank');
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
    needsSalarySetup = data.salarySignatures.length === 0;
    const period = getCalendarPeriod(offset);
    cycleStart = period.start;
    cycleEnd = offset === 0 ? nextDay(today) : period.end;
  }

  const windowRows = rows.filter((r) => {
    const k = dateKey(r.date);
    return k && k >= cycleStart && k < cycleEnd;
  });
  const { totals } = summarizeCalendar(windowRows, context);
  const dailyHistory = buildDailyHistory(windowRows, context, cycleStart, cycleEnd);

  const lastDay = offset === 0 ? today : prevDay(cycleEnd);
  const daysElapsed = daysBetween(cycleStart, offset === 0 ? nextDay(today) : cycleEnd);

  const spentActual = totals.spendActual;
  const spentCommitted = totals.spendCommitted;
  const incomeExSalary = totals.otherIncome;
  const totalIncome = totals.earnedIncome;
  const cardBillingCycles = buildCardBillingCycles(windowRows, context);
  const remainingCardCharges = offset === 0 ? round2(cardBillingCycles.reduce((sum, group) => {
    if (group.billingDate && group.billingDate > today) return sum + group.total;
    return sum + group.pending;
  }, 0)) : 0;
  const remainingKnown = offset === 0
    ? round2(totals.bankDirectPending + remainingCardCharges)
    : 0;

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
      totalIncome,
      netIncludingSalaryActual: round2(totalIncome - spentActual),
      netIncludingSalaryCommitted: round2(totalIncome - spentCommitted),
      netExSalaryActual: round2(incomeExSalary - spentActual),
      netExSalaryCommitted: round2(incomeExSalary - spentCommitted),
    },
    dailyAverage: {
      spent: round2(spentCommitted / daysElapsed),
      income: round2(incomeExSalary / daysElapsed),
    },
    expected: {
      bankPending: offset === 0 ? totals.bankDirectPending : 0,
      cardChargesNotYetSettled: remainingCardCharges,
      remainingKnown,
    },
    dailyHistory,
    cardBillingCycles,
    spendingBreakdown: spendingBreakdown(windowRows, context),
    needsReview: totals.needsReview,
  };
}

async function buildCycle(userId, offset = 0) {
  return buildCycleFromData(await loadCycleData(userId), offset);
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

function addMonth(key) {
  if (!key) return null;
  const [year, month, day] = key.split('-').map(Number);
  const target = new Date(Date.UTC(year, month, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target.toISOString().slice(0, 10);
}

function buildProjection(current, rawSettings = {}) {
  const settings = {
    enabled: rawSettings?.enabled === true,
    expectedSalary: Number(rawSettings?.expectedSalary) > 0 ? round2(rawSettings.expectedSalary) : null,
    expectedSalaryDate: dateKey(rawSettings?.expectedSalaryDate),
    expectedCharge: Number(rawSettings?.expectedCharge) > 0 ? round2(rawSettings.expectedCharge) : null,
    expectedChargeDate: dateKey(rawSettings?.expectedChargeDate),
    expectedChargeLabel: String(rawSettings?.expectedChargeLabel || '').trim().slice(0, 80),
  };
  const suggestedSalary = current.money.salaryInWindow > 0
    ? { amount: current.money.salaryInWindow, date: addMonth(current.salaryDate) }
    : null;
  const expectedSalary = settings.enabled
    ? {
      amount: settings.expectedSalary || suggestedSalary?.amount || 0,
      date: settings.expectedSalaryDate || suggestedSalary?.date || null,
      source: settings.expectedSalary ? 'manual' : 'last_salary',
    }
    : null;
  const expectedCharge = settings.enabled && settings.expectedCharge
    ? {
      amount: settings.expectedCharge,
      date: settings.expectedChargeDate,
      label: settings.expectedChargeLabel || 'Expected charge',
    }
    : null;
  const knownPending = current.expected?.remainingKnown ?? current.money.spentPending ?? 0;
  const plannedExpenses = settings.enabled ? (expectedCharge?.amount || 0) : 0;
  const expectedRemainingExpenses = round2(knownPending + plannedExpenses);
  const canProject = current.checkingBalance !== null;
  const projectedCheckingBalance = canProject
    ? round2(current.checkingBalance - expectedRemainingExpenses)
    : null;
  return {
    settings,
    suggestedSalary,
    expectedSalary,
    expectedCharge,
    knownPending,
    plannedExpenses,
    expectedRemainingExpenses,
    projectedCheckingBalance,
    factsAsOf: current.lastDay,
    isPlanningOnly: true,
  };
}

async function buildRunwayOverview(userId) {
  // Load ledger/context once, then derive both cycles from the same immutable
  // snapshot. The previous implementation loaded four query groups per cycle
  // in parallel, needlessly doubling DB connections on every dashboard visit.
  const [cycleData, preferencesResult] = await Promise.all([
    loadCycleData(userId),
    db.query('SELECT preferences FROM users WHERE id=$1', [userId]),
  ]);
  const current = buildCycleFromData(cycleData, 0);
  const previous = buildCycleFromData(cycleData, -1);
  const settings = preferencesResult.rows[0]?.preferences?.runway_projection || {};
  return { current, previous, projection: buildProjection(current, settings), timezone: TZ };
}

module.exports = {
  buildCycle,
  buildCycleFromData,
  buildRunwayOverview,
  buildDailyHistory,
  buildCardBillingCycles,
  buildProjection,
};
