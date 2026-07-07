/**
 * Transaction Controller - Clean & Aligned with Database
 * Simple CRUD operations that work with actual database schema
 * @module controllers/transactionController
 */

const { Transaction } = require('../models/Transaction');
const errorCodes = require('../utils/errorCodes');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const db = require('../config/db');
const { INSTITUTIONS, institutionKind } = require('../config/institutions');
const { getUserFinancialCycle } = require('../services/financialCycleService');

const CREDIT_CARD_SOURCES = Object.entries(INSTITUTIONS)
  .filter(([, meta]) => meta.kind === 'credit_card')
  .map(([source]) => source);

const CARD_SETTLEMENT_SOURCE_PATTERNS = {
  isracard: '(\u05d9\u05e9\u05e8\u05d0\u05db\u05e8\u05d8|isracard)',
  amex: '(\u05d0\u05de\u05e7\u05e1|\u05d0\u05de\u05e8\u05d9\u05e7\u05df[\\s-]*\u05d0\u05e7\u05e1\u05e4\u05e8\u05e1|american[\\s-]*express|amex)',
  visa_cal: '(\u05db\u05d0\u05dc|\u05d5\u05d9\u05d6\u05d4[\\s-]*\u05db\u05d0\u05dc|visa[\\s-]*cal|cal)',
  max: '(\u05de\u05e7\u05e1|max)',
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

const transactionController = {
  /**
   * Get dashboard data: financial-period summary, category/pattern
   * breakdown, bank costs, per-institution activity, recent transactions.
   * @route GET /api/v1/transactions/dashboard
   *
   * Rebuilt (2026-07) to use the user's fixed billing_cycle_day instead of
   * a rolling `days` lookback — a rolling window has no relationship to
   * when the user actually gets paid or when major charges land, and drifts
   * a little further every time it's queried. Also folds in the bank
   * description-pattern classifier and bank-costs aggregate that used to
   * live behind the (now-removed) dedicated Analytics page, recomputed
   * against the billing period instead of calendar months.
   */
  getDashboardData: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    let cycleDay = 1;
    let periodStart;
    let periodEnd;

    try {
      const period = await getUserFinancialCycle(userId);
      cycleDay = period.cycleDay;
      periodStart = period.start;
      periodEnd = period.end;

      const [summaryResult, recentTransactions, categoriesResult, bankCostsResult, sourcesResult, balancesResult] = await Promise.all([
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
              AND t.date >= $2 AND t.date < $3
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
          ),
          classified AS (
            SELECT
              scoped.*,
              (
                source_kind = 'bank'
                AND is_card_settlement
                AND (
                  (settlement_card_source IS NOT NULL AND settlement_card_source = ANY((SELECT card_sources FROM flags)))
                  OR (settlement_card_source IS NULL AND (SELECT card_source_count FROM flags) = 1)
                )
              ) AS excluded_card_settlement
            FROM scoped
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
        Transaction.getRecent(userId, 10),
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
              AND t.date >= $2 AND t.date < $3
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
            WHERE true
              AND NOT (
                t.bank_source IS NOT NULL
                AND NOT (t.bank_source = ANY($5::text[]))
                AND t.description ~* $4
                AND (
                  (t.settlement_card_source IS NOT NULL AND t.settlement_card_source = ANY((SELECT card_sources FROM flags)))
                  OR (t.settlement_card_source IS NULL AND (SELECT card_source_count FROM flags) = 1)
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
              AND t.date >= $2 AND t.date < $3
          ) classified
        `, [userId, periodStart, periodEnd]),
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
            AND t.date >= $2 AND t.date < $3
          GROUP BY t.bank_source
        `, [userId, periodStart, periodEnd]),
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

      // Per-source account facts (balance + freshness) keyed by bank_source.
      const acctBySource = Object.fromEntries(
        balancesResult.rows.map(r => [r.bank_source, {
          balance: r.has_balance ? parseFloat(r.balance) : null,
          hasBalance: r.has_balance === true,
          lastSyncedAt: r.last_synced_at || null,
        }])
      );

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
        };
      }).sort((a, b) => b.expenses - a.expenses);

      res.json({
        success: true,
        data: {
          period: { start: periodStart, end: periodEnd, cycleDay, cycleDaySet: true },
          summary,
          categoryBreakdown,
          bankCosts,
          sources,
          recent_transactions: recentTransactions,
          metadata: { generated_at: new Date().toISOString() },
        },
      });
    } catch (error) {
      logger.error('Dashboard data fetch failed', { userId, error: error.message });
      throw error;
    }
  }),

  /**
   * Get filtered transactions with pagination
   * @route GET /api/v1/transactions
   */
  getTransactions: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = (page - 1) * limit;

    const filters = {
      type: req.query.type || null,
      dateFrom: req.query.dateFrom || null,
      dateTo: req.query.dateTo || null,
      search: req.query.search || null
    };

    try {
      const options = {
        limit,
        offset,
        type: filters.type,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        search: filters.search // ✅ CRITICAL FIX: Pass search to model instead of applying after
      };

      logger.info('getTransactions options', { userId, options, filters });

      // ✅ CRITICAL FIX: Get both transactions AND total count
      const [transactions, totalCountResult] = await Promise.all([
        Transaction.findByUser(userId, options),
        Transaction.getTotalCount(userId, options)
      ]);

      const totalTransactions = totalCountResult || 0;

      // Calculate summary
      const summary = {
        total: totalTransactions, // ✅ FIXED: Use actual total count, not page count
        totalIncome: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0),
        totalExpenses: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0),
        count: transactions.length
      };
      summary.netAmount = summary.totalIncome - summary.totalExpenses;

      // ✅ FIXED: Proper hasMore calculation
      const hasMore = (offset + transactions.length) < totalTransactions;

      logger.info('getTransactions pagination debug', {
        userId,
        page,
        limit,
        offset,
        currentPageCount: transactions.length,
        totalInDB: totalTransactions,
        hasMore,
        nextPage: hasMore ? page + 1 : null
      });

      res.json({
        success: true,
        data: {
          transactions,
          summary,
          pagination: {
            page,
            limit,
            offset,
            total: totalTransactions, // ✅ FIXED: Actual total in database
            hasMore: hasMore, // ✅ FIXED: Proper hasMore logic
            currentPageCount: transactions.length
          },
          filters: filters
        }
      });
    } catch (error) {
      logger.error('Get transactions failed', { userId, error: error.message });
      throw error;
    }
  }),

  /**
   * Create a one-time manual transaction (income or expense).
   * @route POST /api/v1/transactions/:type
   */
  create: asyncHandler(async (req, res) => {
    const { type } = req.params;
    const userId = req.user.id;

    if (!['expense', 'income'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid transaction type. Must be "expense" or "income"'
      });
    }

    const { amount, description, notes, date } = req.body;

    // Validate required fields
    if (!amount || isNaN(parseFloat(amount))) {
      return res.status(400).json({
        success: false,
        error: 'Valid amount is required'
      });
    }

    if (!description || description.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Description is required'
      });
    }

    try {
      const transactionData = {
        type,
        amount: parseFloat(amount),
        description: description.trim(),
        notes: notes ? notes.trim() : '',
        date: date || new Date().toISOString().split('T')[0] // Default to current date if not provided
      };

      const transaction = await Transaction.create(transactionData, userId);

      res.status(201).json({
        success: true,
        data: transaction,
        message: 'Transaction created successfully'
      });
    } catch (error) {
      logger.error('Transaction creation failed', { userId, type, error: error.message });
      throw error;
    }
  }),

  /**
   * Update an existing one-time manual transaction.
   * @route PUT /api/v1/transactions/:type/:id
   */
  update: asyncHandler(async (req, res) => {
    const { type, id } = req.params;
    const userId = req.user.id;

    if (!['expense', 'income'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid transaction type'
      });
    }

    const { amount, description, notes, date } = req.body;

    try {
      const updateData = {};

      if (amount !== undefined && !isNaN(parseFloat(amount))) {
        updateData.amount = parseFloat(amount);
      }

      if (description !== undefined) {
        updateData.description = description.trim();
      }

      if (notes !== undefined) {
        updateData.notes = notes ? notes.trim() : '';
      }

      if (date !== undefined) {
        updateData.date = date;
      }

      if (type) {
        updateData.type = type;
      }

      const transaction = await Transaction.update(id, updateData, userId);

      res.json({
        success: true,
        data: transaction,
        message: 'Transaction updated successfully'
      });
    } catch (error) {
      if (error.message === 'Transaction not found') {
        return res.status(404).json({
          success: false,
          error: 'Transaction not found'
        });
      }

      logger.error('Transaction update failed', { transactionId: id, userId, error: error.message });
      throw error;
    }
  }),

  /**
   * Delete transaction (soft delete)
   * @route DELETE /api/v1/transactions/:type/:id
   */
  delete: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
      const success = await Transaction.delete(id, userId);

      if (!success) {
        return res.status(404).json({
          success: false,
          error: 'Transaction not found'
        });
      }

      res.json({
        success: true,
        data: {
          deleted: true,
          id: id
        },
        message: 'Transaction deleted successfully'
      });
    } catch (error) {
      if (error.message === 'Transaction not found') {
        return res.status(404).json({
          success: false,
          error: 'Transaction not found'
        });
      }

      logger.error('Deletion failed', { id, userId, error: error.message });
      throw error;
    }
  }),

  /**
   * Bulk delete transactions
   * @route POST /api/v1/transactions/bulk-delete
   */
  bulkDelete: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { transactionIds } = req.body;

    // Simple validation
    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      logger.error('Invalid transactionIds', { transactionIds });
      return res.status(400).json({
        success: false,
        message: 'transactionIds must be a non-empty array'
      });
    }

    try {
      // Delete transactions in a single query for better performance
      const deleteQuery = `
        DELETE FROM transactions
        WHERE id = ANY($1) AND user_id = $2
        RETURNING id, type, description
      `;

      const result = await db.query(deleteQuery, [transactionIds, userId]);
      const deletedCount = result.rows.length;

      // ✅ Handle case where some/all transactions don't exist or were already deleted
      if (deletedCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'No transactions found or transactions were already deleted',
          data: {
            deleted_count: 0,
            summary: { successful: 0, failed: transactionIds.length },
            deleted_transactions: []
          }
        });
      }

      // Response format that matches client expectations
      res.json({
        success: true,
        data: {
          deleted_count: deletedCount,
          summary: {
            successful: deletedCount,
            failed: transactionIds.length - deletedCount
          },
          deleted_transactions: result.rows
        },
        message: `Successfully deleted ${deletedCount} transactions`
      });

    } catch (error) {
      logger.error('Bulk delete failed', {
        userId,
        transactionIds,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to delete transactions',
        error: error.message
      });
    }
  })
};

module.exports = transactionController;
