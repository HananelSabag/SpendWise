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
const { INSTITUTIONS } = require('../config/institutions');
const { buildDashboardData, invalidateDashboardCache } = require('../services/dashboardService');
const { invalidateCycleCache } = require('../services/cycleService');
const { buildSalaryReview, saveSalaryReview } = require('../services/salaryReviewService');
const { createWatch, removeWatch, getWatched } = require('../services/merchantWatchService');
const { classifyTransaction } = require('../services/financialClassificationService');
const { getCalendarPeriod } = require('../utils/calendarPeriod');

const CREDIT_CARD_SOURCES = Object.entries(INSTITUTIONS)
  .filter(([, meta]) => meta.kind === 'credit_card')
  .map(([source]) => source);

function invalidateHomeCaches(userId) {
  invalidateDashboardCache(userId);
  invalidateCycleCache(userId);
}

const transactionController = {
  getMerchantWatches: asyncHandler(async (req, res) => {
    const data = await getWatched(req.user.id);
    res.json({ success: true, data });
  }),

  createMerchantWatch: asyncHandler(async (req, res) => {
    const data = await createWatch(req.user.id, req.body);
    res.status(201).json({ success: true, data });
  }),

  deleteMerchantWatch: asyncHandler(async (req, res) => {
    const data = await removeWatch(req.user.id, req.params.id);
    res.json({ success: true, data });
  }),

  getSalaryCandidates: asyncHandler(async (req, res) => {
    const [result, signatures] = await Promise.all([
      db.query(`
        SELECT * FROM (
          SELECT DISTINCT ON (
            t.bank_source,
            COALESCE(t.bank_account_number, ''),
            LOWER(REGEXP_REPLACE(TRIM(t.description), '\\s+', ' ', 'g'))
          )
            t.id, t.amount, t.type, t.description, t.notes, t.date,
            t.bank_source, t.bank_account_number, t.bank_status, t.ledger_class,
            t.settlement_card_source, t.settlement_card_account
          FROM transactions t
          WHERE t.user_id=$1
            AND t.deleted_at IS NULL
            AND t.type='income'
            AND t.bank_source IS NOT NULL
            AND NOT (t.bank_source = ANY($2::text[]))
            AND NOT EXISTS (
              SELECT 1
                FROM salary_signatures ss
               WHERE ss.user_id = t.user_id
                 AND ss.active = true
                 AND ss.bank_source = t.bank_source
                 AND COALESCE(ss.bank_account_number, '') = COALESCE(t.bank_account_number, '')
                 AND ss.normalized_description = LOWER(REGEXP_REPLACE(TRIM(t.description), '\\s+', ' ', 'g'))
            )
            AND NOT EXISTS (
              SELECT 1
                FROM bank_accounts ba_filter
               WHERE ba_filter.user_id = t.user_id
                 AND ba_filter.bank_source = t.bank_source
                 AND ba_filter.account_number = COALESCE(t.bank_account_number, '')
                 AND ba_filter.enabled = false
            )
            AND t.date >= CURRENT_DATE - INTERVAL '90 days'
          ORDER BY
            t.bank_source,
            COALESCE(t.bank_account_number, ''),
            LOWER(REGEXP_REPLACE(TRIM(t.description), '\\s+', ' ', 'g')),
            t.date DESC
        ) candidates
        ORDER BY amount DESC, date DESC
        LIMIT 50
      `, [req.user.id, CREDIT_CARD_SOURCES]),
      db.query('SELECT * FROM salary_signatures WHERE user_id=$1 AND active=true', [req.user.id]),
    ]);
    const context = { salarySignatures: signatures.rows };
    const candidates = result.rows.map((row) => {
      const classification = classifyTransaction(row, context);
      return {
        ...row,
        suggested_salary: classification.salary === true,
        eligible: classification.economicRole === 'income'
        && classification.calendarInclusion === 'include'
      };
    })
      .filter((row) => row.eligible)
      .sort((a, b) => Number(b.suggested_salary) - Number(a.suggested_salary)
        || Number(b.amount) - Number(a.amount))
      .slice(0, 12)
      .map(({ eligible, ...row }) => row);
    res.json({ success: true, data: candidates });
  }),

  createSalarySignature: asyncHandler(async (req, res) => {
    const transactionId = Number(req.body?.transactionId);
    const cycleAnchor = req.body?.cycleAnchor !== false;
    if (!Number.isInteger(transactionId) || transactionId <= 0) {
      return res.status(400).json({ success: false, error: { message: 'Valid transactionId is required' } });
    }
    const [candidate, signatures] = await Promise.all([db.query(`
      SELECT id, amount, type, bank_source, bank_account_number, description, notes,
        bank_status, ledger_class, settlement_card_source, settlement_card_account,
        LOWER(REGEXP_REPLACE(TRIM(description), '\\s+', ' ', 'g')) AS normalized_description
      FROM transactions t
      WHERE t.id=$1 AND t.user_id=$2 AND t.deleted_at IS NULL AND t.type='income'
        AND t.bank_source IS NOT NULL AND NOT (t.bank_source = ANY($3::text[]))
        AND NOT EXISTS (
          SELECT 1
            FROM bank_accounts ba_filter
           WHERE ba_filter.user_id = t.user_id
             AND ba_filter.bank_source = t.bank_source
             AND ba_filter.account_number = COALESCE(t.bank_account_number, '')
             AND ba_filter.enabled = false
        )
      LIMIT 1
    `, [transactionId, req.user.id, CREDIT_CARD_SOURCES]),
    db.query('SELECT * FROM salary_signatures WHERE user_id=$1 AND active=true', [req.user.id])]);
    if (!candidate.rows[0]) {
      return res.status(404).json({ success: false, error: { message: 'Salary candidate not found' } });
    }
    const row = candidate.rows[0];
    const classification = classifyTransaction(row, { salarySignatures: signatures.rows });
    if (classification.economicRole !== 'income' || classification.calendarInclusion !== 'include') {
      return res.status(400).json({ success: false, error: { message: 'Transaction is not eligible as salary' } });
    }
    const saved = await db.query(`
      INSERT INTO salary_signatures (
        user_id, bank_source, bank_account_number, normalized_description,
        display_description, month_offset, created_from_transaction_id, cycle_anchor
      ) VALUES ($1,$2,$3,$4,$5,-1,$6,$7)
      ON CONFLICT (
        user_id, bank_source, COALESCE(bank_account_number, ''), normalized_description
      ) WHERE active=true
      DO UPDATE SET display_description=EXCLUDED.display_description,
                    cycle_anchor=EXCLUDED.cycle_anchor,
                    updated_at=NOW()
      RETURNING id, bank_source, bank_account_number, display_description, month_offset, cycle_anchor
    `, [req.user.id, row.bank_source, row.bank_account_number, row.normalized_description, row.description, row.id, cycleAnchor]);
    invalidateCycleCache(req.user.id);
    res.status(201).json({ success: true, data: saved.rows[0] });
  }),

  getSalaryReview: asyncHandler(async (req, res) => {
    const data = await buildSalaryReview(req.user.id);
    res.json({ success: true, data });
  }),

  updateSalaryReview: asyncHandler(async (req, res) => {
    const data = await saveSalaryReview(req.user.id, req.body?.decisions);
    invalidateCycleCache(req.user.id);
    res.json({ success: true, data });
  }),

  /**
   * Get the dashboard shell's recent transactions. Balance and the current
   * financial cycle use their dedicated cached endpoints.
   * @route GET /api/v1/transactions/dashboard
   */
  getDashboardData: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    try {
      const data = await buildDashboardData(userId, req.query.periodOffset);
      res.json({ success: true, data });
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

    // Source filter: 'manual' or a known institution id — anything else is ignored.
    const rawSource = req.query.source || null;
    const bankSource = rawSource === 'manual' || (rawSource && INSTITUTIONS[rawSource])
      ? rawSource
      : null;
    const bankAccountNumber = bankSource && bankSource !== 'manual' && req.query.account
      ? String(req.query.account).slice(0, 64)
      : null;
    const amountMin = Number.isFinite(parseFloat(req.query.amountMin)) ? parseFloat(req.query.amountMin) : null;
    const amountMax = Number.isFinite(parseFloat(req.query.amountMax)) ? parseFloat(req.query.amountMax) : null;

    const financialPeriod = req.query.periodOffset !== undefined
      ? getCalendarPeriod(req.query.periodOffset)
      : null;
    const filters = {
      type: req.query.type || null,
      dateFrom: req.query.dateFrom || null,
      dateTo: req.query.dateTo || null,
      search: req.query.search || null,
      source: bankSource,
      account: bankAccountNumber,
      amountMin,
      amountMax,
      financialPeriodStart: financialPeriod?.start || null,
      financialPeriodEnd: financialPeriod?.end || null,
      creditCardSources: CREDIT_CARD_SOURCES
    };

    try {
      const options = {
        limit,
        offset,
        type: filters.type,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        search: filters.search, // ✅ CRITICAL FIX: Pass search to model instead of applying after
        bankSource,
        bankAccountNumber,
        amountMin,
        amountMax,
        financialPeriodStart: filters.financialPeriodStart,
        financialPeriodEnd: filters.financialPeriodEnd,
        creditCardSources: filters.creditCardSources
      };

      logger.info('getTransactions options', { userId, options, filters });

      // List page + total count + whole-set totals (the stats tiles must
      // reflect the full filtered set, not whichever pages happen to be loaded)
      const [transactions, totalCountResult, filteredSummary] = await Promise.all([
        Transaction.findByUser(userId, options),
        Transaction.getTotalCount(userId, options),
        Transaction.getFilteredSummary(userId, options)
      ]);

      const totalTransactions = totalCountResult || 0;

      const summary = {
        total: totalTransactions,
        totalIncome: filteredSummary.totalIncome,
        totalExpenses: filteredSummary.totalExpenses,
        count: filteredSummary.count
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
          filters: filters,
          period: financialPeriod
        }
      });
    } catch (error) {
      logger.error('Get transactions failed', { userId, error: error.message });
      throw error;
    }
  }),

  /**
   * Distinct months (YYYY-MM) that have transactions — feeds the month
   * filter dropdown regardless of which pages the client has loaded.
   * @route GET /api/v1/transactions/months
   */
  getMonths: asyncHandler(async (req, res) => {
    const months = await Transaction.getAvailableMonths(req.user.id);
    res.json({ success: true, data: { months } });
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
      invalidateHomeCaches(userId);

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
      invalidateHomeCaches(userId);

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
      if (error.message === 'Bank-synced transactions cannot be edited') {
        return res.status(400).json({
          success: false,
          error: 'Bank-synced transactions cannot be edited'
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
      invalidateHomeCaches(userId);

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
      // Bank-synced rows are tombstoned so the dedup index keeps blocking
      // re-import on the next sync; manual rows are really deleted (they
      // have no re-import source). Same rule as Transaction.delete.
      const [tombstoned, hardDeleted] = await Promise.all([
        db.query(
          `UPDATE transactions SET deleted_at = NOW(), updated_at = NOW()
           WHERE id = ANY($1) AND user_id = $2 AND bank_source IS NOT NULL AND deleted_at IS NULL
           RETURNING id, type, description`,
          [transactionIds, userId],
        ),
        db.query(
          `DELETE FROM transactions
           WHERE id = ANY($1) AND user_id = $2 AND bank_source IS NULL
           RETURNING id, type, description`,
          [transactionIds, userId],
        ),
      ]);
      const result = { rows: [...tombstoned.rows, ...hardDeleted.rows] };
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
      invalidateHomeCaches(userId);

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
