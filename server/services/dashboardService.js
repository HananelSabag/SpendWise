/**
 * Dashboard Service — builds the full dashboard payload for a user:
 * financial-period summary (billing_cycle_day based), category/pattern
 * breakdown, bank costs, per-institution + per-account activity, and
 * recent transactions. Extracted from transactionController so the
 * controller stays a thin HTTP layer and the SQL lives in one place.
 *
 * Model notes (the whole app rests on this):
 *  - A bank account and a credit-card company are different kinds of source.
 *  - Card purchases are counted by statement/payment date for financial-cycle
 *    cash-flow views; the original purchase date remains on each transaction.
 *    The bank's summarized
 *    card-payment withdrawal is EXCLUDED when the matching card's purchase
 *    detail is connected (no double counting), and counted otherwise.
 */

const db = require('../config/db');
const { Transaction } = require('../models/Transaction');
const { INSTITUTIONS, institutionKind } = require('../config/institutions');
const { getUserFinancialCycle } = require('./financialCycleService');

const CREDIT_CARD_SOURCES = Object.entries(INSTITUTIONS)
  .filter(([, meta]) => meta.kind === 'credit_card')
  .map(([source]) => source);

const CARD_SETTLEMENT_SOURCE_PATTERNS = {
  isracard: '(ישראכרט|isracard)',
  amex: '(אמקס|אמריקן[\\s-]*אקספרס|american[\\s-]*express|amex)',
  visa_cal: '(כאל|ויזה[\\s-]*כאל|visa[\\s-]*cal|cal)',
  max: '(מקס|max)',
};

// Auto-classification for bank transactions with no source-provided
// raw_category. Israeli banks report checking-account cash-flow EVENTS, not
// itemized purchases — a "לאומי ויזה" line is one month's entire credit-card
// bill settling, not a single purchase. Real "categories" (Food, Transport,
// ...) don't map onto that; these patterns group by what the event actually
// IS instead. Matched against live Leumi/Yahav sync data. Static, not user
// input — safe to interpolate directly (no SQL injection surface).
const BANK_PATTERN_CASE = `
  WHEN t.description ~* '(דביט|ויזה|מקס|ישראכרט|כאל|אמקס|אמריקן אקספרס|אשראי)' THEN 'Card Spending'
  WHEN t.description ~* '(משיכת מזומן|משיכה עם קוד)' THEN 'Cash Withdrawals'
  WHEN t.description ~* '(פרעון הלוואה|הלוואה)' THEN 'Loan Payments'
  WHEN t.description ~* '(ריבית|עמלה|עמל\\.)' THEN 'Bank Fees & Interest'
  WHEN t.description ~* 'מס הכנסה' THEN 'Tax'
  WHEN t.description ~* '(ביט|פייבוקס|העברה)' THEN 'Transfers'
`.trim();

const BANK_CARD_SETTLEMENT_PATTERN =
  '(דביט|ויזה|מקס|ישראכרט|כאל|אמקס|אמריקן אקספרס|אשראי|max|visa|isracard|cal|amex|american express)';

/**
 * Build the dashboard payload for a user.
 * @param {number} userId
 * @returns {Promise<object>} the `data` object for GET /transactions/dashboard
 */
async function buildDashboardData(userId, requestedOffset = 0) {
  const period = await getUserFinancialCycle(userId, requestedOffset);
  const { cycleDay, start: periodStart, end: periodEnd } = period;

  const [summaryResult, recentTransactions, categoriesResult, bankCostsResult, sourcesResult, balancesResult, perAccountResult, recurringResult] = await Promise.all([
    db.query(`
      WITH scoped AS (
        SELECT
          t.amount,
          t.type,
          t.bank_source,
          CASE
            WHEN t.bank_source = ANY($5::text[]) THEN 'credit_card'
            WHEN t.bank_source IS NULL THEN 'manual'
            ELSE 'bank'
          END AS source_kind,
          CASE
            WHEN t.description ~* $6 THEN 'isracard'
            WHEN t.description ~* $7 THEN 'amex'
            WHEN t.description ~* $8 THEN 'visa_cal'
            WHEN t.description ~* $9 THEN 'max'
            ELSE NULL
          END AS settlement_card_source,
          (t.bank_source IS NOT NULL
           AND NOT (t.bank_source = ANY($5::text[]))
           AND t.type = 'expense'
           AND t.description ~* $4) AS is_card_settlement
        FROM transactions t
        LEFT JOIN bank_accounts ba_filter
          ON ba_filter.user_id = t.user_id
         AND ba_filter.bank_source = t.bank_source
         AND ba_filter.account_number = COALESCE(t.bank_account_number, '')
        WHERE t.user_id = $1
          AND (CASE
            WHEN t.bank_source = ANY($5::text[])
              THEN COALESCE(t.bank_processed_date, t.date)
            ELSE t.date
          END) >= $2
          AND (CASE
            WHEN t.bank_source = ANY($5::text[])
              THEN COALESCE(t.bank_processed_date, t.date)
            ELSE t.date
          END) < $3
          AND t.deleted_at IS NULL
          AND (t.bank_source IS NULL OR COALESCE(ba_filter.enabled, true) = true)
      ),
      flags AS (
        SELECT
          COALESCE(
            ARRAY_AGG(DISTINCT bank_source) FILTER (WHERE source_kind = 'credit_card' AND type = 'expense'),
            ARRAY[]::text[]
          ) AS card_sources,
          (COUNT(DISTINCT bank_source) FILTER (WHERE source_kind = 'credit_card' AND type = 'expense'))::int AS card_source_count,
          EXISTS (
            SELECT 1 FROM scoped WHERE source_kind = 'credit_card' AND type = 'expense'
          ) AS has_card_detail
        FROM scoped
      ),
      classified AS (
        SELECT
          scoped.*,
          (
            source_kind = 'bank'
            AND is_card_settlement
            AND (
              (settlement_card_source IS NOT NULL AND settlement_card_source = ANY(flags.card_sources))
              OR (settlement_card_source IS NULL AND flags.card_source_count = 1)
            )
          ) AS excluded_card_settlement
        FROM scoped
        CROSS JOIN flags
      )
      SELECT
        COUNT(*)::int AS total_transactions,
        COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0) AS total_income,
        COALESCE(SUM(amount) FILTER (
          WHERE type = 'expense'
            AND NOT excluded_card_settlement
        ), 0) AS total_expenses,
        COALESCE(SUM(amount) FILTER (WHERE source_kind = 'bank' AND type = 'income'), 0) AS bank_income,
        COALESCE(SUM(amount) FILTER (WHERE source_kind = 'bank' AND type = 'expense' AND NOT is_card_settlement), 0) AS bank_direct_expenses,
        COALESCE(SUM(amount) FILTER (WHERE source_kind = 'bank' AND is_card_settlement), 0) AS bank_card_settlements,
        COALESCE(SUM(amount) FILTER (WHERE excluded_card_settlement), 0) AS excluded_bank_card_settlements,
        COALESCE(SUM(amount) FILTER (WHERE source_kind = 'credit_card' AND type = 'expense'), 0) AS card_charges,
        COALESCE(SUM(amount) FILTER (WHERE source_kind = 'manual' AND type = 'expense'), 0) AS manual_expenses,
        (SELECT has_card_detail FROM flags) AS has_card_detail
      FROM classified
    `, [
      userId,
      periodStart,
      periodEnd,
      BANK_CARD_SETTLEMENT_PATTERN,
      CREDIT_CARD_SOURCES,
      CARD_SETTLEMENT_SOURCE_PATTERNS.isracard,
      CARD_SETTLEMENT_SOURCE_PATTERNS.amex,
      CARD_SETTLEMENT_SOURCE_PATTERNS.visa_cal,
      CARD_SETTLEMENT_SOURCE_PATTERNS.max,
    ]),
    Transaction.getRecentForPeriod(userId, periodStart, periodEnd, CREDIT_CARD_SOURCES, 10),
    db.query(`
      WITH scoped AS (
        SELECT
          t.*,
          CASE
            WHEN t.description ~* $6 THEN 'isracard'
            WHEN t.description ~* $7 THEN 'amex'
            WHEN t.description ~* $8 THEN 'visa_cal'
            WHEN t.description ~* $9 THEN 'max'
            ELSE NULL
          END AS settlement_card_source
        FROM transactions t
        LEFT JOIN bank_accounts ba_filter
          ON ba_filter.user_id = t.user_id
         AND ba_filter.bank_source = t.bank_source
         AND ba_filter.account_number = COALESCE(t.bank_account_number, '')
        WHERE t.user_id = $1 AND t.deleted_at IS NULL AND t.type = 'expense'
          AND (t.bank_source IS NULL OR COALESCE(ba_filter.enabled, true) = true)
          AND (CASE
            WHEN t.bank_source = ANY($5::text[])
              THEN COALESCE(t.bank_processed_date, t.date)
            ELSE t.date
          END) >= $2
          AND (CASE
            WHEN t.bank_source = ANY($5::text[])
              THEN COALESCE(t.bank_processed_date, t.date)
            ELSE t.date
          END) < $3
      ),
      flags AS (
        SELECT
          COALESCE(ARRAY_AGG(DISTINCT bank_source), ARRAY[]::text[]) AS card_sources,
          COUNT(DISTINCT bank_source)::int AS card_source_count
        FROM scoped
        WHERE bank_source = ANY($5::text[])
      ),
      classified AS (
        SELECT
          t.amount,
          CASE
            WHEN t.raw_category IS NOT NULL AND t.raw_category <> '' THEN t.raw_category
            ${BANK_PATTERN_CASE}
            ELSE 'Other'
          END AS bucket,
          -- 'source' tells the client how honest each bucket is:
          -- 'source' = the merchant/source labelled it; 'auto' = we guessed
          -- from the bank description via BANK_PATTERN_CASE.
          CASE WHEN t.raw_category IS NOT NULL AND t.raw_category <> '' THEN 'source' ELSE 'auto' END AS source
        FROM scoped t
        CROSS JOIN flags
        WHERE true
          AND NOT (
            t.bank_source IS NOT NULL
            AND NOT (t.bank_source = ANY($5::text[]))
            AND t.description ~* $4
            AND (
              (t.settlement_card_source IS NOT NULL AND t.settlement_card_source = ANY(flags.card_sources))
              OR (t.settlement_card_source IS NULL AND flags.card_source_count = 1)
            )
          )
      )
      SELECT bucket AS name, source, SUM(amount) AS amount, COUNT(*) AS count
      FROM classified
      GROUP BY bucket, source
      ORDER BY amount DESC
      LIMIT 12
    `, [
      userId,
      periodStart,
      periodEnd,
      BANK_CARD_SETTLEMENT_PATTERN,
      CREDIT_CARD_SOURCES,
      CARD_SETTLEMENT_SOURCE_PATTERNS.isracard,
      CARD_SETTLEMENT_SOURCE_PATTERNS.amex,
      CARD_SETTLEMENT_SOURCE_PATTERNS.visa_cal,
      CARD_SETTLEMENT_SOURCE_PATTERNS.max,
    ]),
    db.query(`
      SELECT
        COALESCE(SUM(amount) FILTER (WHERE bucket = 'fees'), 0)  AS fees_interest,
        COALESCE(SUM(amount) FILTER (WHERE bucket = 'loan'),  0) AS loan_payments,
        COALESCE(SUM(amount) FILTER (WHERE bucket = 'cash'),  0) AS cash_withdrawn,
        COALESCE(COUNT(*)    FILTER (WHERE bucket = 'cash'),  0) AS cash_withdrawal_count
      FROM (
        SELECT
          t.amount,
          CASE
            WHEN t.description ~* '(ריבית|עמלה|עמל\\.)' THEN 'fees'
            WHEN t.description ~* '(פרעון הלוואה|הלוואה)' AND t.type = 'expense' THEN 'loan'
            WHEN t.description ~* '(משיכת מזומן|משיכה עם קוד)' THEN 'cash'
            ELSE 'other'
          END AS bucket
        FROM transactions t
        LEFT JOIN bank_accounts ba_filter
          ON ba_filter.user_id = t.user_id
         AND ba_filter.bank_source = t.bank_source
         AND ba_filter.account_number = COALESCE(t.bank_account_number, '')
        WHERE t.user_id = $1 AND t.deleted_at IS NULL
          AND t.type = 'expense' AND t.bank_source IS NOT NULL
          AND COALESCE(ba_filter.enabled, true) = true
          AND (CASE
            WHEN t.bank_source = ANY($4::text[])
              THEN COALESCE(t.bank_processed_date, t.date)
            ELSE t.date
          END) >= $2
          AND (CASE
            WHEN t.bank_source = ANY($4::text[])
              THEN COALESCE(t.bank_processed_date, t.date)
            ELSE t.date
          END) < $3
      ) classified
    `, [userId, periodStart, periodEnd, CREDIT_CARD_SOURCES]),
    db.query(`
      SELECT
        t.bank_source,
        COALESCE(SUM(CASE WHEN t.type = 'income'  THEN t.amount ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) AS expenses,
        COUNT(*) AS count
      FROM transactions t
      LEFT JOIN bank_accounts ba_filter
        ON ba_filter.user_id = t.user_id
       AND ba_filter.bank_source = t.bank_source
       AND ba_filter.account_number = COALESCE(t.bank_account_number, '')
      WHERE t.user_id = $1 AND t.deleted_at IS NULL AND t.bank_source IS NOT NULL
        AND COALESCE(ba_filter.enabled, true) = true
        AND (CASE
          WHEN t.bank_source = ANY($4::text[])
            THEN COALESCE(t.bank_processed_date, t.date)
          ELSE t.date
        END) >= $2
        AND (CASE
          WHEN t.bank_source = ANY($4::text[])
            THEN COALESCE(t.bank_processed_date, t.date)
          ELSE t.date
        END) < $3
      GROUP BY t.bank_source
    `, [userId, periodStart, periodEnd, CREDIT_CARD_SOURCES]),
    db.query(`
      SELECT
        bank_source,
        SUM(balance) FILTER (WHERE balance IS NOT NULL) AS balance,
        bool_or(balance IS NOT NULL)                    AS has_balance,
        MAX(last_synced_at)                             AS last_synced_at
      FROM bank_accounts
      WHERE user_id = $1 AND enabled = true
      GROUP BY bank_source
    `, [userId]),
    // Per-account/card breakdown — a bank login or card company can expose
    // more than one account/card (bank_accounts is keyed on account_number);
    // the institution-level aggregates would silently sum them into one
    // number. Includes disabled accounts (greyed out client-side).
    db.query(`
      SELECT
        ba.bank_source,
        ba.account_number,
        ba.account_type,
        ba.balance,
        ba.enabled,
        ba.last_synced_at,
        COALESCE(act.income, 0)   AS income,
        COALESCE(act.expenses, 0) AS expenses,
        COALESCE(act.count, 0)::int AS count,
        act.last_transaction_at
      FROM bank_accounts ba
      LEFT JOIN (
        SELECT
          bank_source,
          COALESCE(bank_account_number, '') AS account_number,
          COALESCE(SUM(CASE WHEN type='income'  THEN amount ELSE 0 END), 0) AS income,
          COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) AS expenses,
          COUNT(*) AS count,
          MAX(CASE
            WHEN bank_source = ANY($4::text[])
              THEN COALESCE(bank_processed_date, date)
            ELSE date
          END) AS last_transaction_at
        FROM transactions
        WHERE user_id = $1 AND deleted_at IS NULL AND bank_source IS NOT NULL
          AND (CASE
            WHEN bank_source = ANY($4::text[])
              THEN COALESCE(bank_processed_date, date)
            ELSE date
          END) >= $2
          AND (CASE
            WHEN bank_source = ANY($4::text[])
              THEN COALESCE(bank_processed_date, date)
            ELSE date
          END) < $3
        GROUP BY bank_source, COALESCE(bank_account_number, '')
      ) act ON act.bank_source = ba.bank_source AND act.account_number = ba.account_number
      WHERE ba.user_id = $1
      ORDER BY ba.bank_source, ba.account_number
    `, [userId, periodStart, periodEnd, CREDIT_CARD_SOURCES]),
    // Repeated merchant patterns across multiple calendar months. This is
    // intentionally presented as a detected pattern, not a guaranteed bill.
    db.query(`
      SELECT MIN(t.description) AS description,
             MIN(t.raw_category) FILTER (WHERE t.raw_category IS NOT NULL AND t.raw_category <> '') AS category,
             MIN(t.bank_source) AS bank_source,
             COUNT(*)::int AS occurrences,
             COUNT(DISTINCT DATE_TRUNC('month', COALESCE(t.bank_processed_date, t.date)))::int AS active_months,
             ROUND(AVG(t.amount)::numeric, 2) AS average_amount,
             MAX(COALESCE(t.bank_processed_date, t.date)) AS last_seen
      FROM transactions t
      LEFT JOIN bank_accounts ba_filter
        ON ba_filter.user_id = t.user_id
       AND ba_filter.bank_source = t.bank_source
       AND ba_filter.account_number = COALESCE(t.bank_account_number, '')
      WHERE t.user_id = $1 AND t.deleted_at IS NULL AND t.type = 'expense'
        AND COALESCE(ba_filter.enabled, true) = true
        AND COALESCE(t.bank_processed_date, t.date) >= CURRENT_DATE - INTERVAL '7 months'
        AND LENGTH(TRIM(t.description)) > 2
      GROUP BY LOWER(REGEXP_REPLACE(TRIM(t.description), '\\s+', ' ', 'g'))
      HAVING COUNT(DISTINCT DATE_TRUNC('month', COALESCE(t.bank_processed_date, t.date))) >= 2
      ORDER BY active_months DESC, occurrences DESC, average_amount DESC
      LIMIT 12
    `, [userId]),
  ]);

  const categoryBreakdown = categoriesResult.rows.map(r => ({
    name: r.name,
    source: r.source,
    amount: parseFloat(r.amount),
    count: parseInt(r.count),
  }));

  const sr = summaryResult.rows[0] || {};
  const totalIncome = parseFloat(sr.total_income || 0);
  const totalExpenses = parseFloat(sr.total_expenses || 0);
  const summary = {
    total_transactions: parseInt(sr.total_transactions || 0),
    total_income: totalIncome,
    total_expenses: totalExpenses,
    net_balance: totalIncome - totalExpenses,
    bank_income: parseFloat(sr.bank_income || 0),
    bank_direct_expenses: parseFloat(sr.bank_direct_expenses || 0),
    bank_card_settlements: parseFloat(sr.bank_card_settlements || 0),
    card_charges: parseFloat(sr.card_charges || 0),
    manual_expenses: parseFloat(sr.manual_expenses || 0),
    excluded_bank_card_settlements: parseFloat(sr.excluded_bank_card_settlements || 0),
    has_card_detail: sr.has_card_detail === true,
  };

  const bc = bankCostsResult.rows[0] || {};
  const bankCosts = {
    feesInterest: parseFloat(bc.fees_interest || 0),
    loanPayments: parseFloat(bc.loan_payments || 0),
    cashWithdrawn: parseFloat(bc.cash_withdrawn || 0),
    cashWithdrawalCount: parseInt(bc.cash_withdrawal_count || 0),
  };

  const recurringPatterns = recurringResult.rows.map((row) => ({
    description: row.description,
    category: row.category,
    bank_source: row.bank_source,
    occurrences: parseInt(row.occurrences) || 0,
    active_months: parseInt(row.active_months) || 0,
    average_amount: parseFloat(row.average_amount) || 0,
    last_seen: row.last_seen,
  }));

  // Per-source account facts (balance + freshness) keyed by bank_source.
  const acctBySource = Object.fromEntries(
    balancesResult.rows.map(r => [r.bank_source, {
      balance: r.has_balance ? parseFloat(r.balance) : null,
      hasBalance: r.has_balance === true,
      lastSyncedAt: r.last_synced_at || null,
    }])
  );

  // Per-account/card breakdown, grouped by bank_source.
  const accountsBySource = {};
  for (const r of perAccountResult.rows) {
    const isBank = institutionKind(r.bank_source) === 'bank';
    (accountsBySource[r.bank_source] ??= []).push({
      accountNumber: r.account_number,
      accountType: r.account_type,
      enabled: r.enabled,
      balance: isBank && r.balance !== null ? parseFloat(r.balance) : null,
      income: parseFloat(r.income || 0),
      expenses: parseFloat(r.expenses || 0),
      count: parseInt(r.count || 0),
      lastTransactionAt: r.last_transaction_at || null,
      lastSyncedAt: r.last_synced_at || null,
    });
  }

  // Union of sources that have activity this period AND sources with a
  // connected account but no transactions yet — the dashboard should list
  // every connected source, not only ones with rows in the window.
  const sourceKeys = new Set([
    ...sourcesResult.rows.map(r => r.bank_source),
    ...Object.keys(acctBySource),
  ]);
  const activityBySource = Object.fromEntries(
    sourcesResult.rows.map(r => [r.bank_source, r])
  );
  const sources = [...sourceKeys].map(key => {
    const act = activityBySource[key] || {};
    const acct = acctBySource[key] || {};
    const kind = institutionKind(key);
    // Only real bank accounts have a balance. A credit company (max/
    // isracard/cal) never does — it only has charges — so we never expose
    // a balance for it, guarding against any stale/legacy data.
    const isBank = kind === 'bank';
    return {
      bankSource: key,
      kind,
      label: INSTITUTIONS[key]?.label || key,
      income: parseFloat(act.income || 0),
      expenses: parseFloat(act.expenses || 0),
      count: parseInt(act.count || 0),
      balance: isBank && acct.hasBalance ? acct.balance : null,
      hasBalance: isBank ? (acct.hasBalance || false) : false,
      lastSyncedAt: acct.lastSyncedAt || null,
      accounts: accountsBySource[key] || [],
    };
  }).sort((a, b) => b.expenses - a.expenses);

  return {
    period: {
      start: periodStart,
      end: periodEnd,
      cycleDay,
      cycleDaySet: true,
      offset: period.offset,
      isCurrent: period.isCurrent,
    },
    summary,
    categoryBreakdown,
    bankCosts,
    recurringPatterns,
    sources,
    recent_transactions: recentTransactions,
    metadata: { generated_at: new Date().toISOString() },
  };
}

module.exports = { buildDashboardData };
