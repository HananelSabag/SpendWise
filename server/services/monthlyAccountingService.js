/**
 * Monthly Accounting Service — the calendar-month financial performance model.
 *
 * As of the 2026-07 classification rebuild this service is a thin orchestration
 * layer over the proven, pure engine:
 *   - `financialClassificationService` decides, per row, the economic role and
 *     whether it counts in the calendar month (counting every economic expense
 *     exactly once — itemized card purchases count; monthly/immediate card
 *     settlements and debit-card *card copies* do not; the debit bank row is the
 *     primary fact; loans/securities/internal transfers are not earned income).
 *   - `cardReconciliationService` reconciles provider statements INDEPENDENTLY
 *     from the calendar total (statement/processed-date grouping, never a
 *     calendar month), so a pending settlement can never fabricate a mismatch.
 *
 * This replaces the previous broad `SETTLEMENT`/`FINANCING` regex + the
 * month-M-versus-month-(M+1) `difference` that produced an artificial
 * `needs_review` (the audited ₪2,951.47). Ledger facts are never mutated and
 * transaction dates are never rewritten; salary is attributed to its economic
 * month only through a confirmed signature offset.
 *
 * The returned shape is unchanged so the dashboard and MonthlyAccountingSummary
 * client keep working.
 */

const db = require('../config/db');
const { INSTITUTIONS } = require('../config/institutions');
const { getCalendarPeriod, TZ } = require('../utils/calendarPeriod');
const { classifyTransaction, summarizeCalendar, spendingBreakdown } = require('./financialClassificationService');
const { reconcile, deriveDebitCardAccounts, dateKey } = require('./cardReconciliationService');

const CARD_SOURCES = Object.entries(INSTITUTIONS).filter(([, x]) => x.kind === 'credit_card').map(([x]) => x);

const SELECT_COLUMNS = `id, bank_source, bank_account_number, amount, type, description, notes,
  date, transaction_datetime, bank_processed_date, bank_status, bank_sync_id, raw_category,
  original_amount, original_currency, charged_currency, txn_kind,
  installment_number, installment_total, ledger_class,
  settlement_card_source, settlement_card_account`;

function monthForOffset(offset = 0, now = new Date()) {
  return getCalendarPeriod(offset, now);
}

/** Shift a `YYYY-MM` key by whole months (calendar math, TZ-agnostic on keys). */
function addMonthKey(ym, n) {
  const d = new Date(`${ym}-01T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 7);
}

/** Economic month a row belongs to: salary is attributed by its signature offset. */
function economicMonthKey(row, classification) {
  if (classification.economicMonth) return classification.economicMonth;
  const key = dateKey(row.date);
  const ym = key ? key.slice(0, 7) : 'unknown';
  if (classification.salary) return addMonthKey(ym, Number.isInteger(classification.monthOffset) ? classification.monthOffset : -1);
  return ym;
}

async function loadAccountingData(userId, windowStart, windowEnd) {
  const [txnResult, signatureResult, cardAccountResult, debitScopeResult, overridesResult] = await Promise.all([
    db.query(
      `SELECT ${SELECT_COLUMNS}
         FROM transactions t
        WHERE t.user_id = $1 AND t.deleted_at IS NULL
          AND t.date >= $2 AND t.date < $3
          AND (t.bank_source IS NULL OR NOT EXISTS (
            SELECT 1
              FROM bank_accounts ba_filter
             WHERE ba_filter.user_id = t.user_id
               AND ba_filter.bank_source = t.bank_source
               AND ba_filter.account_number = COALESCE(t.bank_account_number, '')
               AND ba_filter.enabled = false
          ))
        ORDER BY t.date, t.id`,
      [userId, windowStart, windowEnd],
    ),
    db.query('SELECT * FROM salary_signatures WHERE user_id = $1 AND active = true', [userId]),
    db.query(
      'SELECT DISTINCT bank_source FROM bank_accounts WHERE user_id = $1 AND enabled = true AND bank_source = ANY($2::text[])',
      [userId, CARD_SOURCES],
    ),
    // Debit-card identity is derived from ALL history, not just this window: a
    // Max/debit card is only recognised when a bank `כרטיס דביט` row names its
    // last-4 in the memo, and that memo may fall in a different month than the one
    // being viewed. Deriving it globally keeps classification stable per month.
    db.query(
      `SELECT t.bank_source, t.bank_account_number, t.type, t.description, t.notes
         FROM transactions t
        WHERE t.user_id = $1 AND t.deleted_at IS NULL
          AND (t.bank_source = ANY($2::text[]) OR t.description LIKE '%דביט%')
          AND (t.bank_source IS NULL OR NOT EXISTS (
            SELECT 1
              FROM bank_accounts ba_filter
             WHERE ba_filter.user_id = t.user_id
               AND ba_filter.bank_source = t.bank_source
               AND ba_filter.account_number = COALESCE(t.bank_account_number, '')
               AND ba_filter.enabled = false
          ))`,
      [userId, CARD_SOURCES],
    ),
    db.query('SELECT * FROM transaction_month_overrides WHERE user_id=$1', [userId]),
  ]);

  return {
    rows: txnResult.rows,
    salarySignatures: signatureResult.rows,
    connectedCardSources: cardAccountResult.rows.map((row) => row.bank_source),
    debitScopeRows: debitScopeResult.rows,
    transactionOverrides: overridesResult.rows,
  };
}

function buildMonthFromData(data, offset = 0) {
  const period = monthForOffset(offset);
  const nextMonth = addMonthKey(period.month, 1);
  // Window: the month itself, one before (debit/statement context) and up to two
  // after (salary attributed back from a later month, and its settlement).
  const windowStart = `${addMonthKey(period.month, -1)}-01`;
  const windowEnd = `${addMonthKey(period.month, 3)}-01`;

  const windowRows = data.rows.filter((row) => {
    const key = dateKey(row.date);
    return key && key >= windowStart && key < windowEnd;
  });
  const context = {
    salarySignatures: data.salarySignatures,
    debitCardAccounts: deriveDebitCardAccounts(data.debitScopeRows),
    transactionOverrides: data.transactionOverrides,
  };

  // Rows whose ECONOMIC month is this period (salary shifted by its offset).
  const monthRows = windowRows.filter((row) => economicMonthKey(row, classifyTransaction(row, context)) === period.month);
  const { totals } = summarizeCalendar(monthRows, context);

  // Independent statement reconciliation (never feeds the calendar total).
  const cardReport = reconcile(windowRows, context);
  const settlingStatements = cardReport.cards
    .flatMap((card) => card.statements || [])
    .filter((s) => s.statementDate && s.statementDate.slice(0, 7) === nextMonth);
  const anyPendingSettlement = settlingStatements.some((s) => s.bankSettlement?.pending === true || s.status === 'partial');
  const mismatchStatements = settlingStatements.filter((s) => s.status === 'mismatch');
  const allMatched = settlingStatements.length > 0 && settlingStatements.every((s) => s.status === 'matched');
  const reconciliationStatus = mismatchStatements.length ? 'mismatch' : allMatched ? 'matched' : 'unavailable';
  const reconciliationDifference = mismatchStatements.reduce((sum, s) => sum + Math.abs(Number(s.delta) || 0), 0);

  // Card spend: itemized when a card of that company is connected, else a
  // clearly-labelled bank-settlement fallback (spec §2.3), never both.
  const connectedCardSources = new Set(data.connectedCardSources);
  const fallbackCardSpend = !period.isCurrent ? round2(windowRows
    .filter((row) => {
      const key = dateKey(row.date);
      if (!key || key.slice(0, 7) !== nextMonth) return false;
      const classification = classifyTransaction(row, context);
      return classification.settlementRole === 'card_settlement'
        && classification.reconciliation.cardSource
        && !connectedCardSources.has(classification.reconciliation.cardSource);
    })
    .reduce((sum, row) => sum + Math.abs(Number(row.amount) || 0), 0)) : 0;

  const itemizedCardPosted = Math.max(0, round2(totals.cardSpendPosted - totals.cardRefunds));
  const cardPosted = round2(itemizedCardPosted + fallbackCardSpend);
  const cardPending = totals.cardSpendPending;
  const bankDirect = totals.bankDirectSpend;
  const manual = totals.manualSpend;

  const actualSpend = round2(cardPosted + bankDirect + manual);
  const committed = round2(actualSpend + cardPending + totals.bankDirectPending);
  const actualIncome = totals.earnedIncome;

  const status = period.isCurrent
    ? 'open'
    : totals.salaryIncome === 0
      ? 'awaiting_salary'
      : anyPendingSettlement
        ? 'awaiting_settlement'
        : (totals.needsReview.length > 0 || mismatchStatements.length > 0)
          ? 'needs_review'
          : 'closed';

  const dailyDivisor = Math.max(1, period.daysElapsed);
  const transactionCount = windowRows.filter((row) => {
    const key = dateKey(row.date);
    return key && key >= period.start && key < period.end;
  }).length;

  return {
    ...period,
    status,
    income: { actual: actualIncome, salaryActual: totals.salaryIncome, other: totals.otherIncome },
    spending: {
      bankDirect,
      bankDirectPending: totals.bankDirectPending,
      cardPosted,
      cardPending,
      manual,
      actual: actualSpend,
      committed,
      cardDataMode: itemizedCardPosted > 0 && fallbackCardSpend > 0
        ? 'mixed'
        : itemizedCardPosted > 0 || cardPending > 0
          ? 'itemized'
          : fallbackCardSpend > 0 ? 'settlement_fallback' : 'unavailable',
    },
    net: { actual: round2(actualIncome - committed) },
    dailyAverage: {
      income: round2(actualIncome / dailyDivisor),
      spending: round2(committed / dailyDivisor),
    },
    reconciliation: {
      status: reconciliationStatus,
      itemizedTotal: round2(settlingStatements.reduce((sum, s) => sum + (Number(s.observedTotal) || 0), 0)),
      settlementTotal: round2(settlingStatements.reduce((sum, s) => sum + (Number(s.bankSettlement?.amount) || 0), 0)),
      difference: round2(reconciliationDifference),
    },
    transactionCount,
    needsReview: totals.needsReview,
    breakdown: spendingBreakdown(monthRows, context),
  };
}

async function buildMonth(userId, offset = 0) {
  const period = monthForOffset(offset);
  const windowStart = `${addMonthKey(period.month, -1)}-01`;
  const windowEnd = `${addMonthKey(period.month, 3)}-01`;
  return buildMonthFromData(await loadAccountingData(userId, windowStart, windowEnd), offset);
}

function round2(value) {
  return Math.round(((Number(value) || 0) + Number.EPSILON) * 100) / 100;
}

async function buildOverview(userId) {
  const currentPeriod = monthForOffset(0);
  // Previous and current windows overlap almost completely. Load one immutable
  // snapshot instead of opening two identical five-query groups in parallel.
  const windowStart = `${addMonthKey(currentPeriod.month, -2)}-01`;
  const windowEnd = `${addMonthKey(currentPeriod.month, 3)}-01`;
  const data = await loadAccountingData(userId, windowStart, windowEnd);
  const previous = buildMonthFromData(data, -1);
  const current = buildMonthFromData(data, 0);
  return { previous, current, timezone: TZ };
}

module.exports = { buildMonth, buildMonthFromData, buildOverview, monthForOffset };
