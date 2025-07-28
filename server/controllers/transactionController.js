/**
 * OPTIMIZED Transaction Controller - Enhanced Performance Version
 * Uses optimized models, smart caching, and batch operations
 * @module controllers/transactionController_optimized
 */

const { Transaction } = require('../models/Transaction');
const { RecurringTemplate } = require('../models/RecurringTemplate');
const { DBQueries } = require('../utils/dbQueries');
const RecurringEngine = require('../utils/RecurringEngine');
const errorCodes = require('../utils/errorCodes');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const db = require('../config/db');

const transactionController = {
  /**
   * 🚀 OPTIMIZED: Get dashboard data with smart caching
   * @route GET /api/v1/transactions/dashboard
   */
  getDashboardData: asyncHandler(async (req, res) => {
    const start = Date.now();
    const userId = req.user.id;
    
    // Parse date parameter more carefully to avoid NaN-NaN-NaN
    let targetDate = new Date();
    if (req.query?.date) {
      const dateParam = req.query.date;
      // If it's a number (days back), calculate from today
      if (!isNaN(dateParam) && !isNaN(parseFloat(dateParam))) {
        const daysBack = parseInt(dateParam);
        targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - daysBack);
      } else {
        // Try to parse as regular date
        const parsedDate = new Date(dateParam);
        if (!isNaN(parsedDate.getTime())) {
          targetDate = parsedDate;
        }
        // If invalid, use current date (already set)
      }
    }

    try {
      // Use optimized dashboard query with caching
      const result = await DBQueries.getDashboardData(userId, targetDate);

      const duration = Date.now() - start;
      logger.info('✅ Dashboard data served', {
        userId,
        duration: `${duration}ms`,
        cached: result.metadata?.cached || false,
        transactionCount: result.metadata?.transaction_count || 0,
        performance: duration < 100 ? 'excellent' : duration < 300 ? 'good' : 'slow'
      });

      res.json({
        success: true,
        data: {
          daily: result.daily_balance,
          recent_transactions: result.recent_transactions,
          categories: result.categories,
          metadata: {
            ...result.metadata,
            server_duration: `${duration}ms`,
            optimized: true
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const duration = Date.now() - start;
      logger.error('❌ Dashboard data fetch failed', {
        userId,
        error: error.message,
        duration: `${duration}ms`
      });
      throw error;
    }
  }),

  /**
   * ✅ NEW: Analytics Dashboard Summary - What client is calling
   * @route GET /api/v1/analytics/dashboard/summary
   */
  getAnalyticsSummary: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const period = req.query.period || '30'; // Default 30 days

    try {
      // Get analytics summary data
      const query = `
        WITH date_range AS (
          SELECT 
            NOW() - INTERVAL '${parseInt(period)} days' as start_date,
            NOW() as end_date
        ),
        transaction_summary AS (
          SELECT 
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses,
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) as net_balance,
            COUNT(*) as transaction_count,
            COUNT(DISTINCT category_id) as categories_used
          FROM transactions t, date_range dr
          WHERE t.user_id = $1 
            AND t.created_at >= dr.start_date 
            AND t.created_at <= dr.end_date
        ),
        previous_period AS (
          SELECT 
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as prev_income,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as prev_expenses
          FROM transactions t, date_range dr
          WHERE t.user_id = $1 
            AND t.created_at >= (dr.start_date - INTERVAL '${parseInt(period)} days')
            AND t.created_at < dr.start_date
        )
        SELECT 
          ts.total_income,
          ts.total_expenses, 
          ts.net_balance,
          ts.transaction_count,
          ts.categories_used,
          pp.prev_income,
          pp.prev_expenses,
          CASE 
            WHEN pp.prev_income > 0 THEN ((ts.total_income - pp.prev_income) / pp.prev_income * 100)
            ELSE 0 
          END as income_change_percent,
          CASE 
            WHEN pp.prev_expenses > 0 THEN ((ts.total_expenses - pp.prev_expenses) / pp.prev_expenses * 100)
            ELSE 0 
          END as expense_change_percent
        FROM transaction_summary ts, previous_period pp
      `;

      const result = await db.query(query, [userId]);
      const summary = result.rows[0] || {};

      // Calculate savings rate
      const savingsRate = summary.total_income > 0 
        ? ((summary.total_income - summary.total_expenses) / summary.total_income * 100) 
        : 0;

      // ✅ FIXED: Add recent transactions to analytics summary
      const recentTransactionsQuery = `
        SELECT 
          t.id, t.type, t.amount, t.description, t.date,
          c.name as category_name, c.icon as category_icon, c.color as category_color
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = $1
        ORDER BY t.created_at DESC
        LIMIT 10
      `;
      
      const recentResult = await db.query(recentTransactionsQuery, [userId]);
      const recentTransactions = recentResult.rows.map(tx => ({
        ...tx,
        formattedAmount: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(tx.amount)
      }));

      res.json({
        success: true,
        data: {
          // ✅ FIXED: Structure data to match client expectations
          balance: {
            current: summary.net_balance || 0,
            previous: summary.net_balance || 0, // TODO: Calculate previous period balance
            change: 0, // TODO: Calculate change
            currency: 'USD'
          },
          monthlyStats: {
            income: summary.total_income || 0,
            expenses: summary.total_expenses || 0,
            net: summary.net_balance || 0,
            transactionCount: summary.transaction_count || 0
          },
          recentTransactions: recentTransactions, // ✅ FIXED: Add real recent transactions
          chartData: [], // TODO: Add chart data
          summary: {
            totalTransactions: summary.transaction_count || 0,
            categoriesUsed: summary.categories_used || 0,
            avgTransactionAmount: summary.transaction_count > 0 
              ? (summary.total_income + summary.total_expenses) / summary.transaction_count 
              : 0,
            savingsRate: Math.round(savingsRate),
            changes: {
              income: summary.income_change_percent || 0,
              expenses: summary.expense_change_percent || 0
            }
          },
          period: period,
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Analytics summary failed', { userId, error: error.message });
      throw error;
    }
  }),

  /**
   * ✅ NEW: User Analytics - What client is calling  
   * @route GET /api/v1/analytics/user
   */
  getUserAnalytics: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const months = parseInt(req.query.months) || 1;

    try {
      // Get user analytics data
      const query = `
        WITH monthly_data AS (
          SELECT 
            DATE_TRUNC('month', created_at) as month,
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as monthly_income,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as monthly_expenses,
            COUNT(*) as monthly_transactions
          FROM transactions 
          WHERE user_id = $1 
            AND created_at >= NOW() - INTERVAL '${months} months'
          GROUP BY DATE_TRUNC('month', created_at)
          ORDER BY month DESC
        ),
        category_breakdown AS (
          SELECT 
            c.name as category_name,
            c.icon as category_icon,
            SUM(t.amount) as total_amount,
            COUNT(t.id) as transaction_count,
            AVG(t.amount) as avg_amount
          FROM transactions t
          LEFT JOIN categories c ON t.category_id = c.id
          WHERE t.user_id = $1 
            AND t.type = 'expense'
            AND t.created_at >= NOW() - INTERVAL '${months} months'
          GROUP BY c.id, c.name, c.icon
          ORDER BY total_amount DESC
          LIMIT 10
        )
        SELECT 
          (SELECT json_agg(md.*) FROM monthly_data md) as monthly_trends,
          (SELECT json_agg(cb.*) FROM category_breakdown cb) as top_categories,
          (
            SELECT 
              AVG(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as avg_expense,
              MAX(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as max_expense,
              MIN(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as min_expense
            FROM transactions 
            WHERE user_id = $1 AND type = 'expense'
              AND created_at >= NOW() - INTERVAL '${months} months'
          ) as expense_stats
      `;

      const result = await db.query(query, [userId]);
      const analytics = result.rows[0] || {};

      res.json({
        success: true,
        data: {
          insights: analytics.monthly_trends || [],
          trends: analytics.monthly_trends || [],
          categories: analytics.top_categories || [],
          expenseStats: analytics.expense_stats || {},
          period: `${months} months`,
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('User analytics failed', { userId, error: error.message });
      throw error;
    }
  }),

  /**
   * ✅ NEW: Get Recent Transactions - What client is calling
   * @route GET /api/v1/transactions/recent
   */
  getRecentTransactions: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    try {
      const query = `
        SELECT 
          t.id,
          t.type,
          t.amount,
          t.description,
          t.created_at,
          t.updated_at,
          c.name as category_name,
          c.icon as category_icon,
          c.color as category_color
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = $1
        ORDER BY t.created_at DESC
        LIMIT $2
      `;

      const result = await db.query(query, [userId, limit]);

      res.json({
        success: true,
        data: {
          transactions: result.rows,
          total: result.rows.length
        }
      });

    } catch (error) {
      logger.error('Recent transactions failed', { userId, error: error.message });
      throw error;
    }
  }),

  /**
   * 🚀 OPTIMIZED: Create transaction with cache invalidation
   * @route POST /api/v1/transactions/:type
   */
  create: asyncHandler(async (req, res) => {
    const start = Date.now();
    const { type } = req.params;
    const userId = req.user.id;

    if (!['expense', 'income'].includes(type)) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Invalid transaction type' };
    }

    const transactionData = {
      user_id: userId,
      ...req.body,
      amount: parseFloat(req.body.amount)
    };

    try {
      const transaction = await Transaction.create(type, transactionData);

      const duration = Date.now() - start;
      logger.info('✅ Transaction created', {
        transactionId: transaction.id,
        userId,
        type,
        amount: transaction.amount,
        duration: `${duration}ms`,
        performance: duration < 50 ? 'excellent' : duration < 200 ? 'good' : 'slow'
      });

      res.status(201).json({
        success: true,
        data: transaction,
        metadata: {
          created: true,
          duration: `${duration}ms`,
          optimized: true
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const duration = Date.now() - start;
      logger.error('❌ Transaction creation failed', {
        userId,
        type,
        error: error.message,
        duration: `${duration}ms`
      });
      throw error;
    }
  }),

  /**
   * 🚀 NEW: Batch create transactions for high performance
   * @route POST /api/v1/transactions/:type/batch
   */
  createBatch: asyncHandler(async (req, res) => {
    const start = Date.now();
    const { type } = req.params;
    const userId = req.user.id;
    const { transactions } = req.body;

    if (!['expense', 'income'].includes(type)) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Invalid transaction type' };
    }

    if (!Array.isArray(transactions) || transactions.length === 0) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Transactions array is required' };
    }

    if (transactions.length > 100) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Maximum 100 transactions per batch' };
    }

    try {
      // Add user_id to all transactions and validate amounts
      const transactionsWithUser = transactions.map(tx => ({
        ...tx,
        user_id: userId,
        amount: parseFloat(tx.amount)
      }));

      const createdTransactions = await Transaction.createBatch(type, transactionsWithUser);

      const duration = Date.now() - start;
      logger.info('✅ Batch transactions created', {
        userId,
        type,
        count: createdTransactions.length,
        duration: `${duration}ms`,
        avgPerTransaction: Math.round(duration / createdTransactions.length),
        performance: duration < 200 ? 'excellent' : duration < 1000 ? 'good' : 'slow'
      });

      res.status(201).json({
        success: true,
        data: {
          transactions: createdTransactions,
          count: createdTransactions.length
        },
        metadata: {
          batch_created: true,
          duration: `${duration}ms`,
          avg_per_transaction: `${Math.round(duration / createdTransactions.length)}ms`,
          optimized: true
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const duration = Date.now() - start;
      logger.error('❌ Batch transaction creation failed', {
        userId,
        type,
        count: transactions?.length || 0,
        error: error.message,
        duration: `${duration}ms`
      });
      throw error;
    }
  }),

  /**
   * 🚀 OPTIMIZED: Get recent transactions with smart caching
   * @route GET /api/v1/transactions/:type/recent
   */
  getRecent: asyncHandler(async (req, res) => {
    const start = Date.now();
    const { type } = req.params;
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50); // Max 50

    try {
      const transactions = await Transaction.getRecent(userId, type, limit);

      const duration = Date.now() - start;
      logger.debug('✅ Recent transactions served', {
        userId,
        type,
        count: transactions.length,
        duration: `${duration}ms`,
        performance: duration < 50 ? 'excellent' : duration < 200 ? 'good' : 'slow'
      });

      res.json({
        success: true,
        data: transactions,
        metadata: {
          count: transactions.length,
          type,
          limit,
          duration: `${duration}ms`,
          cached: true, // This endpoint uses caching
          optimized: true
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const duration = Date.now() - start;
      logger.error('❌ Recent transactions fetch failed', {
        userId,
        type,
        error: error.message,
        duration: `${duration}ms`
      });
      throw error;
    }
  }),

  /**
   * 🚀 OPTIMIZED: Update transaction with cache invalidation
   * @route PUT /api/v1/transactions/:type/:id
   */
  update: asyncHandler(async (req, res) => {
    const start = Date.now();
    const { type, id } = req.params;
    const userId = req.user.id;
    const updates = { ...req.body };

    if (updates.amount) {
      updates.amount = parseFloat(updates.amount);
    }

    try {
      const transaction = await Transaction.update(type, id, updates, userId);

      const duration = Date.now() - start;
      logger.info('✅ Transaction updated', {
        transactionId: id,
        userId,
        type,
        fields: Object.keys(updates),
        duration: `${duration}ms`,
        performance: duration < 50 ? 'excellent' : duration < 200 ? 'good' : 'slow'
      });

      res.json({
        success: true,
        data: transaction,
        metadata: {
          updated: true,
          fields: Object.keys(updates),
          duration: `${duration}ms`,
          optimized: true
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const duration = Date.now() - start;
      logger.error('❌ Transaction update failed', {
        transactionId: id,
        userId,
        type,
        error: error.message,
        duration: `${duration}ms`
      });
      throw error;
    }
  }),

  /**
   * 🚀 OPTIMIZED: Delete transaction with cache invalidation
   * @route DELETE /api/v1/transactions/:type/:id
   */
  delete: asyncHandler(async (req, res) => {
    const start = Date.now();
    const { type, id } = req.params;
    const userId = req.user.id;

    try {
      const success = await Transaction.delete(type, id, userId);

      const duration = Date.now() - start;
      logger.info('✅ Transaction deleted', {
        transactionId: id,
        userId,
        type,
        duration: `${duration}ms`,
        performance: duration < 50 ? 'excellent' : duration < 200 ? 'good' : 'slow'
      });

      res.json({
        success: true,
        data: { deleted: success },
        metadata: {
          deleted: true,
          duration: `${duration}ms`,
          optimized: true
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const duration = Date.now() - start;
      logger.error('❌ Transaction deletion failed', {
        transactionId: id,
        userId,
        type,
        error: error.message,
        duration: `${duration}ms`
      });
      throw error;
    }
  }),

  /**
   * 🚀 NEW: Get monthly summary with optimized queries
   * @route GET /api/v1/transactions/summary/monthly
   */
  getMonthlySummary: asyncHandler(async (req, res) => {
    const start = Date.now();
    const userId = req.user.id;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;

    try {
      const summary = await DBQueries.getMonthlySummary(userId, year, month);

      const duration = Date.now() - start;
      logger.info('✅ Monthly summary served', {
        userId,
        year,
        month,
        duration: `${duration}ms`,
        performance: duration < 100 ? 'excellent' : duration < 300 ? 'good' : 'slow'
      });

      res.json({
        success: true,
        data: {
          ...summary,
          year,
          month
        },
        metadata: {
          duration: `${duration}ms`,
          optimized: true,
          cached: true
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const duration = Date.now() - start;
      logger.error('❌ Monthly summary fetch failed', {
        userId,
        year,
        month,
        error: error.message,
        duration: `${duration}ms`
      });
      throw error;
    }
  }),

  /**
   * 🚀 NEW: Generate recurring transactions manually
   * @route POST /api/v1/transactions/recurring/generate
   */
  generateRecurring: asyncHandler(async (req, res) => {
    const start = Date.now();
    const userId = req.user.id;

    try {
      const result = await RecurringEngine.generateAllRecurringTransactions();

      const duration = Date.now() - start;
      logger.info('✅ Manual recurring generation completed', {
        userId,
        templatesProcessed: result.processed,
        transactionsGenerated: result.generated,
        duration: `${duration}ms`,
        trigger: 'manual_api_call'
      });

      res.json({
        success: true,
        data: {
          templates_processed: result.processed,
          transactions_generated: result.generated
        },
        metadata: {
          duration: `${duration}ms`,
          engine_duration: `${result.duration}ms`,
          trigger: 'manual',
          optimized: true
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const duration = Date.now() - start;
      logger.error('❌ Manual recurring generation failed', {
        userId,
        error: error.message,
        duration: `${duration}ms`
      });
      throw error;
    }
  }),

  /**
   * 📊 Get performance statistics
   * @route GET /api/v1/transactions/performance
   */
  getPerformanceStats: asyncHandler(async (req, res) => {
    try {
      const stats = {
        transaction_model: Transaction.getPerformanceStats(),
        db_queries: DBQueries.getPerformanceStats(),
        recurring_engine: RecurringEngine.getEngineStats()
      };

      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('❌ Performance stats fetch failed', {
        error: error.message
      });
      throw error;
    }
  })
};

module.exports = transactionController; 