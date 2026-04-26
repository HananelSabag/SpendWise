/**
 * Transaction Controller - Clean & Aligned with Database
 * Simple CRUD operations that work with actual database schema
 * @module controllers/transactionController
 */

const { Transaction } = require('../models/Transaction');
const { RecurringTemplate } = require('../models/RecurringTemplate');
const errorCodes = require('../utils/errorCodes');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const db = require('../config/db');
const { findOrCreateCategory } = require('../utils/categoryHelper');
const {
  generateTransactionsFromTemplate,
  generateCurrentMonthTransactions,
  generateUpcomingTransactions
} = require('../services/recurringService');

const transactionController = {
  /**
   * Get dashboard data with transactions summary
   * @route GET /api/v1/transactions/dashboard
   */
  getDashboardData: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const days = parseInt(req.query.days) || 30;

    try {
      // ✅ PERFORMANCE FIX: Get all dashboard data in parallel
      const [summary, recentTransactions] = await Promise.all([
        Transaction.getSummary(userId, days),
        Transaction.getRecent(userId, 10)
      ]);

      res.json({
        success: true,
        data: {
          summary,
          recent_transactions: recentTransactions,
          metadata: {
            period_days: days,
            generated_at: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      logger.error('Dashboard data fetch failed', { userId, error: error.message });
      throw error;
    }
  }),

  /**
   * Get balance panel data - DEDICATED ENDPOINT FOR BALANCE CALCULATIONS
   * @route GET /api/v1/transactions/balance
   */
  getBalanceData: asyncHandler(async (req, res) => {
    const userId = req.user.id;

    try {
      // Get current date info
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // 1-12
      const currentDay = now.getDate();
      const currentDayOfWeek = now.getDay(); // 0 = Sunday
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
      
      // Calculate periods
      const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
      const startOfYear = new Date(currentYear, 0, 1);
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - currentDayOfWeek); // Go to Sunday
      const startOfToday = new Date(currentYear, currentMonth - 1, currentDay);

      // Get completed one-time transactions for each period
      const getOneTimeTransactions = async (startDate, endDate = now) => {
        const query = `
          SELECT type, SUM(amount) as total
          FROM transactions 
          WHERE user_id = $1 
            AND template_id IS NULL 
            AND status = 'completed'
            AND deleted_at IS NULL
            AND date >= $2::date 
            AND date <= $3::date
          GROUP BY type
        `;
        const result = await db.query(query, [userId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]);
        
        const income = result.rows.find(r => r.type === 'income')?.total || 0;
        const expenses = result.rows.find(r => r.type === 'expense')?.total || 0;
        
        return {
          income: parseFloat(income),
          expenses: parseFloat(expenses),
          total: parseFloat(income) - parseFloat(expenses)
        };
      };

      // Get monthly recurring totals from recurring_templates
      const getRecurringMonthlyTotals = async () => {
        const query = `
          SELECT type, SUM(amount) as total
          FROM recurring_templates 
          WHERE user_id = $1 AND is_active = true
          GROUP BY type
        `;
        const result = await db.query(query, [userId]);
        
        const income = result.rows.find(r => r.type === 'income')?.total || 0;
        const expenses = result.rows.find(r => r.type === 'expense')?.total || 0;
        
        return {
          monthlyIncome: parseFloat(income),
          monthlyExpenses: parseFloat(expenses),
          monthlyNet: parseFloat(income) - parseFloat(expenses)
        };
      };

      // ✅ PERFORMANCE FIX: Get all data in parallel instead of sequential
      const [recurring, todayOneTime, weekOneTime, monthOneTime, yearOneTime] = await Promise.all([
        getRecurringMonthlyTotals(),
        getOneTimeTransactions(startOfToday),
        getOneTimeTransactions(startOfWeek),
        getOneTimeTransactions(startOfMonth),
        getOneTimeTransactions(startOfYear)
      ]);

      // Calculate daily recurring rate
      const dailyRecurringIncome = recurring.monthlyIncome / daysInMonth;
      const dailyRecurringExpenses = recurring.monthlyExpenses / daysInMonth;
      const dailyRecurringNet = dailyRecurringIncome - dailyRecurringExpenses;

      // Calculate days elapsed in week (Sunday = 0, so if Wednesday = 3, elapsed = 4 days)
      const daysElapsedInWeek = currentDayOfWeek + 1;

      // Calculate balance data according to user requirements
      const balanceData = {
        daily: {
          income: dailyRecurringIncome + todayOneTime.income,
          expenses: dailyRecurringExpenses + todayOneTime.expenses,
          total: dailyRecurringNet + todayOneTime.total
        },
        weekly: {
          income: (dailyRecurringIncome * daysElapsedInWeek) + weekOneTime.income,
          expenses: (dailyRecurringExpenses * daysElapsedInWeek) + weekOneTime.expenses,
          total: (dailyRecurringNet * daysElapsedInWeek) + weekOneTime.total
        },
        monthly: {
          income: recurring.monthlyIncome + monthOneTime.income,
          expenses: recurring.monthlyExpenses + monthOneTime.expenses,
          total: recurring.monthlyNet + monthOneTime.total
        },
        yearly: {
          income: (recurring.monthlyIncome * currentMonth) + yearOneTime.income,
          expenses: (recurring.monthlyExpenses * currentMonth) + yearOneTime.expenses,
          total: (recurring.monthlyNet * currentMonth) + yearOneTime.total
        }
      };

      // Add metadata
      const metadata = {
        currentDate: now.toISOString(),
        currentDay,
        currentDayOfWeek,
        daysInMonth,
        daysElapsedInWeek,
        currentMonth,
        currentYear,
        recurringMonthly: recurring,
        oneTimeTransactions: {
          today: todayOneTime,
          week: weekOneTime,
          month: monthOneTime,
          year: yearOneTime
        }
      };

      res.json({
        success: true,
        data: {
          balance: balanceData,
          metadata
        }
      });

    } catch (error) {
      logger.error('Balance data fetch failed', { userId, error: error.message });
      throw error;
    }
  }),

  /**
   * Get user's recurring templates list
   * @route GET /api/v1/transactions/templates
   */
  getRecurringTemplates: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    try {
      const query = `
        SELECT rt.*, c.name AS category_name
        FROM recurring_templates rt
        LEFT JOIN categories c ON rt.category_id = c.id
        WHERE rt.user_id = $1
        ORDER BY rt.created_at DESC
      `;
      const result = await db.query(query, [userId]);

      // Compute simple derived fields expected by client
      const now = new Date();
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

      const templates = (result.rows || []).map((row) => {
        // Compute next_run_date using existing helper
        let nextRun = null;
        try {
          const dates = calculateUpcomingDates(row, now, threeMonthsFromNow);
          nextRun = dates && dates.length > 0 ? dates[0].toISOString().split('T')[0] : null;
        } catch (e) {
          nextRun = null;
        }

        return {
          ...row,
          status: row.is_active ? 'active' : 'paused',
          frequency: row.interval_type,
          next_run_date: nextRun
        };
      });

      res.json({ success: true, data: templates, count: templates.length });
    } catch (error) {
      logger.error('Get recurring templates failed', { userId, error: error.message });
      throw error;
    }
  }),

  /**
   * Get analytics summary for analytics page
   * @route GET /api/v1/analytics/dashboard/summary
   */
  getAnalyticsSummary: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const period = parseInt(req.query.period) || 30;

    try {
      const summary = await Transaction.getSummary(userId, period);
      const recentTransactions = await Transaction.getRecent(userId, 10);

      res.json({
        success: true,
        data: {
          balance: {
            current: summary.net_balance || 0,
            currency: 'USD'
          },
          monthlyStats: {
            income: summary.total_income || 0,
            expenses: summary.total_expenses || 0,
            net: summary.net_balance || 0,
            transactionCount: summary.total_transactions || 0
          },
          recentTransactions: recentTransactions,
          summary: {
            totalTransactions: summary.total_transactions || 0,
            categoriesUsed: summary.categories_used || 0,
            avgTransactionAmount: summary.avg_expense || 0,
            savingsRate: summary.total_income > 0 
              ? Math.round(((summary.total_income - summary.total_expenses) / summary.total_income) * 100)
              : 0
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
   * Get user analytics data
   * @route GET /api/v1/analytics/user
   * ✅ FIXED: Now calls SQL analytics function instead of returning empty arrays
   */
  getUserAnalytics: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const months = parseInt(req.query.months) || 12;

    try {
      // Monthly income vs expenses trends
      const trendsResult = await db.query(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', date), 'YYYY-MM') AS month,
          COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS income,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expenses
        FROM transactions
        WHERE user_id = $1
          AND date >= DATE_TRUNC('month', NOW() - ($2 - 1) * INTERVAL '1 month')
        GROUP BY DATE_TRUNC('month', date)
        ORDER BY DATE_TRUNC('month', date)
      `, [userId, months]);

      const trends = trendsResult.rows.map(r => ({
        month: r.month,
        income: parseFloat(r.income),
        expenses: parseFloat(r.expenses),
        savings: parseFloat(r.income) - parseFloat(r.expenses),
        savingsRate: parseFloat(r.income) > 0
          ? ((parseFloat(r.income) - parseFloat(r.expenses)) / parseFloat(r.income)) * 100
          : 0
      }));

      // Spending by category
      const categoriesResult = await db.query(`
        SELECT
          COALESCE(c.name, 'General') AS name,
          SUM(t.amount) AS amount,
          COUNT(*) AS count
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = $1
          AND t.type = 'expense'
          AND t.date >= NOW() - $2 * INTERVAL '1 month'
        GROUP BY c.name
        ORDER BY amount DESC
        LIMIT 10
      `, [userId, months]);

      const categories = categoriesResult.rows.map(r => ({
        name: r.name,
        amount: parseFloat(r.amount),
        count: parseInt(r.count)
      }));

      // Summary insights
      const summaryResult = await db.query(`
        SELECT
          COALESCE(AVG(monthly_expense), 0) AS avg_monthly_spending,
          COALESCE(AVG(monthly_expense) / 30.0, 0) AS avg_daily_spending,
          COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS total_income,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expenses
        FROM (
          SELECT
            DATE_TRUNC('month', date) AS month,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS monthly_expense,
            type,
            amount
          FROM transactions
          WHERE user_id = $1
            AND date >= NOW() - $2 * INTERVAL '1 month'
          GROUP BY DATE_TRUNC('month', date), type, amount
        ) sub
      `, [userId, months]);

      const summary = summaryResult.rows[0] || {};

      const insights = [
        {
          type: 'spending',
          title: 'Average Monthly Spending',
          value: parseFloat(summary.avg_monthly_spending || 0)
        },
        {
          type: 'spending',
          title: 'Average Daily Spending',
          value: parseFloat(summary.avg_daily_spending || 0)
        },
        {
          type: 'info',
          title: 'Total Income',
          value: parseFloat(summary.total_income || 0)
        },
        {
          type: 'info',
          title: 'Total Expenses',
          value: parseFloat(summary.total_expenses || 0)
        }
      ];

      // Recent transactions for context
      const transactions = await Transaction.findByUser(userId, { limit: 50 });

      res.json({
        success: true,
        data: {
          insights,
          trends,
          categories,
          transactions,
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
   * Get recent transactions
   * @route GET /api/v1/transactions/recent
   */
  getRecentTransactions: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    try {
      const transactions = await Transaction.getRecent(userId, limit);

      res.json({
        success: true,
        data: {
          transactions: transactions,
          total: transactions.length
        }
      });
    } catch (error) {
      logger.error('Recent transactions failed', { userId, error: error.message });
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
      categoryId: req.query.category || null,
      dateFrom: req.query.dateFrom || null,
      dateTo: req.query.dateTo || null,
      search: req.query.search || null
    };

    try {
      const options = {
        limit,
        offset,
        categoryId: filters.categoryId,
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
   * Create new transaction
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

    const { amount, description, categoryId, category_name, notes, date } = req.body;

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
      const finalCategoryId = await findOrCreateCategory(userId, categoryId, category_name);

      const transactionData = {
        type,
        amount: parseFloat(amount),
        description: description.trim(),
        categoryId: finalCategoryId,
        notes: notes ? notes.trim() : '',
        date: date || new Date().toISOString().split('T')[0] // Default to current date if not provided
      };

      const transaction = await Transaction.create(transactionData, userId);

      // Get category info if category_id exists
      if (transaction.category_id) {
        const categoryQuery = `
          SELECT name, icon, color FROM categories WHERE id = $1
        `;
        const categoryResult = await db.query(categoryQuery, [transaction.category_id]);
        if (categoryResult.rows.length > 0) {
          transaction.category = categoryResult.rows[0];
        }
      }

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
   * Update existing transaction
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

    const { amount, description, categoryId, notes, date } = req.body;

    try {
      const updateData = {};
      
      if (amount !== undefined && !isNaN(parseFloat(amount))) {
        updateData.amount = parseFloat(amount);
      }
      
      if (description !== undefined) {
        updateData.description = description.trim();
      }
      
      if (categoryId !== undefined) {
        updateData.category_id = categoryId || null;
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

      // Get category info if category_id exists
      if (transaction.category_id) {
        const categoryQuery = `
          SELECT name, icon, color FROM categories WHERE id = $1
        `;
        const categoryResult = await db.query(categoryQuery, [transaction.category_id]);
        if (categoryResult.rows.length > 0) {
          transaction.category = categoryResult.rows[0];
        }
      }

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
   * @route DELETE /api/v1/transactions/templates/:id
   */
  delete: asyncHandler(async (req, res) => {
    const { type, id } = req.params;
    const userId = req.user.id;

    try {
      // Check if this is a template deletion (from /templates/:id route)
      if (req.path.includes('/templates/')) {
        logger.info('Template deletion request', { templateId: id, userId });
        
        // First verify the template exists and belongs to the user
        const templateCheck = await db.query(
          'SELECT id, name FROM recurring_templates WHERE id = $1 AND user_id = $2',
          [id, userId]
        );

        if (templateCheck.rows.length === 0) {
          logger.warn('Template not found for deletion', { templateId: id, userId });
          return res.status(404).json({
            success: false,
            error: 'Recurring template not found'
          });
        }

        // ✅ ENHANCED: Smart delete based on query parameter
        const deleteScope = req.query.scope || 'template_only'; // Default to template only
        
        let deletedTransactions = 0;
        const today = new Date().toISOString().split('T')[0];
        
        switch (deleteScope) {
          case 'all':
            // Delete template and ALL transactions (past, current, future)
            const allResult = await db.query(`
              UPDATE transactions 
              SET deleted_at = NOW(), 
                  notes = COALESCE(notes, '') || ' [Template deleted: all occurrences]'
              WHERE template_id = $1 AND user_id = $2 AND deleted_at IS NULL
              RETURNING id
            `, [id, userId]);
            deletedTransactions = allResult.rows.length;
            break;
            
          case 'future':
            // Delete template and only FUTURE transactions
            const futureResult = await db.query(`
              UPDATE transactions 
              SET deleted_at = NOW(), 
                  notes = COALESCE(notes, '') || ' [Template deleted: future only]'
              WHERE template_id = $1 AND user_id = $2 AND date > $3 AND deleted_at IS NULL
              RETURNING id
            `, [id, userId, today]);
            deletedTransactions = futureResult.rows.length;
            break;
            
          case 'current_and_future':
            // Delete template and CURRENT MONTH + FUTURE transactions
            const currentMonthStart = new Date();
            currentMonthStart.setDate(1);
            const currentMonthStartStr = currentMonthStart.toISOString().split('T')[0];
            
            const currentFutureResult = await db.query(`
              UPDATE transactions 
              SET deleted_at = NOW(), 
                  notes = COALESCE(notes, '') || ' [Template deleted: current month and future]'
              WHERE template_id = $1 AND user_id = $2 AND date >= $3 AND deleted_at IS NULL
              RETURNING id
            `, [id, userId, currentMonthStartStr]);
            deletedTransactions = currentFutureResult.rows.length;
            break;
            
          case 'template_only':
          default:
            // Only deactivate template, keep all transactions
            deletedTransactions = 0;
            break;
        }

        // Always deactivate the template
        const updateResult = await db.query(
          'UPDATE recurring_templates SET is_active = false, updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING id, name',
          [id, userId]
        );

        logger.info('Template deletion completed', { 
          templateId: id, 
          templateName: updateResult.rows[0].name, 
          userId,
          deleteScope,
          deletedTransactions
        });

        const message = deletedTransactions > 0 
          ? `Template deleted with ${deletedTransactions} transactions (${deleteScope})`
          : 'Template deactivated successfully';

        return res.json({
          success: true,
          data: { 
            deleted: true,
            deactivated: true,
            id: id,
            name: updateResult.rows[0].name,
            deleteScope,
            deletedTransactions
          },
          message
        });
      }

      // Regular transaction deletion
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
      
      logger.error('Deletion failed', { 
        type: req.path.includes('/templates/') ? 'template' : 'transaction',
        id, 
        userId, 
        error: error.message 
      });
      throw error;
    }
  }),

  /**
   * Advanced delete for recurring transactions
   * @route DELETE /api/v1/transactions/recurring/:id
   */
  deleteRecurring: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { deleteType, templateId } = req.body; // current, future, all
    const userId = req.user.id;

    try {
      let result;
      let message;

      switch (deleteType) {
        case 'current':
          // Delete only this transaction instance
          const currentDeleted = await Transaction.delete(id, userId);
          if (!currentDeleted) {
            return res.status(404).json({
              success: false,
              error: 'Transaction not found'
            });
          }
          result = { deletedCurrent: true };
          message = 'Current transaction deleted successfully';
          break;

        case 'future':
          // Delete current transaction and stop future ones
          const currentDeleted2 = await Transaction.delete(id, userId);
          if (!currentDeleted2) {
            return res.status(404).json({
              success: false,
              error: 'Transaction not found'
            });
          }
          
          if (templateId) {
            // Deactivate the template to stop future generations
            const templateResult = await db.query(
              'UPDATE recurring_templates SET is_active = false, updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING id',
              [templateId, userId]
            );
            result = { 
              deletedCurrent: true, 
              templateDeactivated: templateResult.rows.length > 0 
            };
          } else {
            result = { deletedCurrent: true, templateDeactivated: false };
          }
          message = 'Current transaction deleted and future recurring stopped';
          break;

        case 'all':
          // Delete all transactions for this template and the template itself
          if (templateId) {
            // Delete all transactions created from this template - FIXED for current schema
            let deletedTransactionsCount = 0;
            
            // Delete from unified transactions table
            const transactionsResult = await db.query(
              'DELETE FROM transactions WHERE template_id = $1 AND user_id = $2 RETURNING id',
              [templateId, userId]
            );
            deletedTransactionsCount += transactionsResult.rows.length;
            
            // Delete the template
            const templateResult = await db.query(
              'DELETE FROM recurring_templates WHERE id = $1 AND user_id = $2 RETURNING id',
              [templateId, userId]
            );
            
            result = { 
              templateDeleted: templateResult.rows.length > 0,
              transactionsDeleted: deletedTransactionsCount
            };
            message = `Recurring template and ${deletedTransactionsCount} related transactions deleted`;
          } else {
            // Just delete the single transaction if no template
            const singleDeleted = await Transaction.delete(id, userId);
            if (!singleDeleted) {
              return res.status(404).json({
                success: false,
                error: 'Transaction not found'
              });
            }
            result = { deletedSingle: true };
            message = 'Transaction deleted successfully';
          }
          break;

        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid delete type. Must be one of: current, future, all'
          });
      }

      logger.info('Recurring transaction deletion completed', {
        userId,
        transactionId: id,
        templateId,
        deleteType,
        result
      });

      res.json({
        success: true,
        data: result,
        message
      });
    } catch (error) {
      logger.error('Recurring transaction deletion failed', { 
        userId, 
        transactionId: id, 
        templateId, 
        deleteType, 
        error: error.message 
      });
      throw error;
    }
  }),

  /**
   * Get monthly summary
   * @route GET /api/v1/transactions/summary/monthly
   */
  getMonthlySummary: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    
    // Calculate days in the specified month
    const daysInMonth = new Date(year, month, 0).getDate();

    try {
      const summary = await Transaction.getSummary(userId, daysInMonth);

      res.json({
        success: true,
        data: {
          ...summary,
          year,
          month,
          period: `${year}-${month.toString().padStart(2, '0')}`
        }
      });
    } catch (error) {
      logger.error('Monthly summary failed', { userId, year, month, error: error.message });
      throw error;
    }
  }),

  /**
   * Update recurring template - ENHANCED WITH PAUSE/RESUME LOGIC
   * @route PUT /api/v1/transactions/templates/:id
   */
  updateRecurringTemplate: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const updateData = req.body;

    try {
      // Verify the template belongs to the user
      const templateCheck = await db.query(
        'SELECT id, user_id, is_active FROM recurring_templates WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (templateCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Recurring template not found'
        });
      }

      const currentTemplate = templateCheck.rows[0];

      // ✅ ENHANCED: Handle pause/resume logic
      if ('is_active' in updateData) {
        const newActiveStatus = updateData.is_active;
        const wasActive = currentTemplate.is_active;

        if (wasActive && !newActiveStatus) {
          // PAUSING: Remove future generated transactions
          logger.info('Pausing template - removing future transactions', {
            templateId: id,
            userId
          });

          const today = new Date().toISOString().split('T')[0];
          const deletedCount = await db.query(`
            UPDATE transactions 
            SET deleted_at = NOW(), 
                notes = COALESCE(notes, '') || ' [Paused at ${new Date().toISOString()}]'
            WHERE template_id = $1 
              AND user_id = $2 
              AND date > $3
              AND deleted_at IS NULL
            RETURNING id
          `, [id, userId, today]);

          logger.info('Future transactions removed due to pause', {
            templateId: id,
            userId,
            deletedCount: deletedCount.rows.length
          });
        } else if (!wasActive && newActiveStatus) {
          // RESUMING: Regenerate future transactions for next 3 months
          logger.info('Resuming template - regenerating future transactions', {
            templateId: id,
            userId
          });

          // Get the updated template data
          const templateResult = await db.query(
            'SELECT * FROM recurring_templates WHERE id = $1',
            [id]
          );
          
          if (templateResult.rows.length > 0) {
            // Generate new transactions using RecurringEngine
            const RecurringEngine = require('../utils/RecurringEngine');
            const template = templateResult.rows[0];
            
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 3);
            
            await RecurringEngine.generateTransactionsForTemplate(template, endDate);
          }
        }
      }

      // Use the RecurringTemplate model's update method
      const updatedTemplate = await RecurringTemplate.update(id, updateData);

      logger.info('Template updated successfully', {
        templateId: id,
        userId,
        updatedFields: Object.keys(updateData)
      });

      res.json({
        success: true,
        data: updatedTemplate,
        message: 'Recurring template updated successfully'
      });

    } catch (error) {
      logger.error('Template update failed', {
        templateId: id,
        userId,
        error: error.message
      });
      
      if (error.details === 'Template not found') {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }
      
      throw error;
    }
  }),

  /**
   * Create recurring template - WITH AUTOMATIC 3-MONTH GENERATION
   * @route POST /api/v1/transactions/templates
   */
  createRecurringTemplate: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const {
      name,
      description,
      amount,
      type,
      category_name,
      categoryId,
      interval_type,
      day_of_month,
      day_of_week,
      is_active
    } = req.body;

    try {
      // Validate required fields
      if (!name || !amount || !type || !interval_type) {
        return res.status(400).json({
          success: false,
          error: 'Name, amount, type, and interval_type are required'
        });
      }

      // ✅ IMPROVED: Get or create category with better logic
      let finalCategoryId = null;
      
      // If categoryId is provided, use it directly
      if (categoryId) {
        finalCategoryId = categoryId;
      } else if (category_name) {
        // Try to find existing category by name
        const categoryQuery = `
          SELECT id FROM categories 
          WHERE name ILIKE $1 AND (user_id = $2 OR user_id IS NULL)
          ORDER BY user_id DESC NULLS LAST
          LIMIT 1
        `;
        const categoryResult = await db.query(categoryQuery, [category_name, userId]);
        
        if (categoryResult.rows.length > 0) {
          finalCategoryId = categoryResult.rows[0].id;
        } else {
          // Create new category if not found
          const createCategoryQuery = `
            INSERT INTO categories (name, user_id, created_at, updated_at)
            VALUES ($1, $2, NOW(), NOW())
            RETURNING id
          `;
          const createResult = await db.query(createCategoryQuery, [category_name, userId]);
          finalCategoryId = createResult.rows[0].id;

          logger.info('Created new category for recurring template', {
            userId,
            categoryName: category_name,
            categoryId: finalCategoryId
          });
        }
      }

      // Fallback to General category if none provided
      if (!finalCategoryId) {
        const generalResult = await db.query(
          `SELECT id FROM categories WHERE name = 'General' AND user_id IS NULL LIMIT 1`
        );
        if (generalResult.rows.length > 0) {
          finalCategoryId = generalResult.rows[0].id;
        }
      }

      // Create recurring template
      const insertQuery = `
        INSERT INTO recurring_templates (
          user_id, name, description, amount, type, category_id,
          interval_type, day_of_month, day_of_week, is_active,
          start_date, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_DATE, NOW(), NOW())
        RETURNING *
      `;

      const values = [
        userId,
        name,
        description || null,
        amount,
        type,
        finalCategoryId,
        interval_type,
        day_of_month || null,
        day_of_week || null,
        is_active !== false // Default to true
      ];

      const result = await db.query(insertQuery, values);
      const template = result.rows[0];

      // ✅ GENERATE BOTH CURRENT AND UPCOMING TRANSACTIONS
      const today = new Date();
      const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      // Generate current month transactions (actual transactions)
      const currentTransactions = await generateCurrentMonthTransactions(template, startOfCurrentMonth, today);
      
      // Generate upcoming transactions (status: 'upcoming')
      const upcomingTransactions = await generateUpcomingTransactions(template);

      logger.info('Recurring template created with current and upcoming transactions', {
        userId,
        templateId: template.id,
        name: template.name,
        currentCount: currentTransactions.length,
        upcomingCount: upcomingTransactions.length
      });

      res.status(201).json({
        success: true,
        data: {
          template,
          currentTransactions,
          upcomingTransactions
        },
        message: `Recurring template created with ${currentTransactions.length} current and ${upcomingTransactions.length} upcoming transactions`
      });
    } catch (error) {
      logger.error('Failed to create recurring template', {
        userId,
        error: error.message
      });
      throw error;
    }
  }),

  /**
   * ✅ BULK CREATE RECURRING TEMPLATES - FOR ONBOARDING
   * Creates multiple templates efficiently without triggering individual refreshes
   * @route POST /api/v1/transactions/templates/bulk
   */
  createBulkRecurringTemplates: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { templates } = req.body;

    try {
      // Validate input
      if (!templates || !Array.isArray(templates) || templates.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Templates array is required'
        });
      }

      // Validate each template
      for (const template of templates) {
        if (!template.name || !template.amount || !template.type || !template.interval_type) {
          return res.status(400).json({
            success: false,
            error: 'Each template must have name, amount, type, and interval_type'
          });
        }
      }

      const createdTemplates = [];
      const results = {
        totalRequested: templates.length,
        successful: 0,
        failed: 0,
        errors: []
      };

      // 🟢 PERF: resolve all category IDs in parallel BEFORE the insert loop.
      // The previous code did `await findOrCreateCategory(...)` inside the
      // loop — N templates = N sequential DB round-trips just to find/create
      // categories. With Render us-east → Supabase eu-north (~150ms RTT each),
      // 8 onboarding templates spent ~1.2s in this step alone. Promise.all
      // pipelines them to a single round-trip-equivalent of latency.
      const resolvedCategoryIds = await Promise.all(
        templates.map(t =>
          findOrCreateCategory(userId, t.categoryId, t.category_name)
            .catch(() => null) // failures handled per-template below
        )
      );

      // Process each template — inserts must remain sequential because the
      // recurring transaction generation downstream depends on template.id.
      for (let idx = 0; idx < templates.length; idx++) {
        const templateData = templates[idx];
        try {
          const {
            name,
            description,
            amount,
            type,
            interval_type,
            day_of_month,
            day_of_week,
            is_active
          } = templateData;

          const finalCategoryId = resolvedCategoryIds[idx];

          // Create template
          const insertQuery = `
            INSERT INTO recurring_templates (
              user_id, name, description, amount, type, category_id,
              interval_type, day_of_month, day_of_week, is_active,
              start_date, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_DATE, NOW(), NOW())
            RETURNING *
          `;

          const values = [
            userId,
            name,
            description || null,
            amount,
            type,
            finalCategoryId,
            interval_type,
            day_of_month || null,
            day_of_week || null,
            is_active !== false
          ];

          const result = await db.query(insertQuery, values);
          const template = result.rows[0];

          // ✅ ONBOARDING FIX: Generate transactions for this template
          const today = new Date();
          const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          
          // 🔧 ONBOARDING FIX: For monthly templates, always generate current month transaction
          let currentTransactions = await generateCurrentMonthTransactions(template, startOfCurrentMonth, today);
          
          // 🔧 If no current month transactions generated and it's a monthly template, force create one
          if (currentTransactions.length === 0 && template.interval_type === 'monthly') {
            try {
              const transactionData = {
                categoryId: template.category_id,
                amount: template.amount,
                type: template.type,
                description: template.description || template.name,
                notes: `Current month transaction for onboarding template: ${template.name}`,
                date: today.toISOString().split('T')[0], // Today's date
                templateId: template.id
              };
              
              const created = await Transaction.create(transactionData, userId);
              currentTransactions = [created];
              
              logger.info('🔧 ONBOARDING FIX: Generated missing current month transaction', {
                userId,
                templateId: template.id,
                templateName: template.name,
                transactionId: created.id
              });
            } catch (currentError) {
              logger.error('Failed to generate onboarding current month transaction', {
                userId,
                templateId: template.id,
                error: currentError.message
              });
            }
          }
          
          const upcomingTransactions = await generateUpcomingTransactions(template);

          createdTemplates.push({
            template,
            currentTransactions,
            upcomingTransactions
          });

          results.successful++;

          logger.info('Bulk template created successfully', {
            userId,
            templateId: template.id,
            name: template.name,
            currentCount: currentTransactions.length,
            upcomingCount: upcomingTransactions.length
          });

        } catch (error) {
          results.failed++;
          results.errors.push({
            templateName: templateData.name,
            error: error.message
          });
          
          logger.error('Failed to create template in bulk', {
            userId,
            templateName: templateData.name,
            error: error.message
          });
        }
      }

      // Return comprehensive results
      res.status(results.successful > 0 ? 201 : 400).json({
        success: results.successful > 0,
        data: {
          templates: createdTemplates,
          summary: results
        },
        message: `Bulk operation completed: ${results.successful} successful, ${results.failed} failed`
      });

    } catch (error) {
      logger.error('Bulk template creation failed', {
        userId,
        error: error.message
      });
      throw error;
    }
  }),

  /**
   * 🔥 FRESH BULK DELETE - Simple and clean implementation matching client expectations
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
  }),

  /**
   * Generate 3 months of upcoming transactions for a template
   */
  
  /**
   * Generate recurring transactions - REAL IMPLEMENTATION
   * @route POST /api/v1/transactions/generate-recurring
   */
  generateRecurring: asyncHandler(async (req, res) => {
    const userId = req.user.id;

    try {
      // Get active recurring templates for user
      const templatesQuery = `
        SELECT * FROM recurring_templates 
        WHERE user_id = $1 AND is_active = true
          AND (end_date IS NULL OR end_date >= CURRENT_DATE)
        ORDER BY created_at DESC
      `;
      
      const templatesResult = await db.query(templatesQuery, [userId]);
      const templates = templatesResult.rows;

      let totalGenerated = 0;
      const generatedTransactions = [];

      for (const template of templates) {
        const newTransactions = await generateTransactionsFromTemplate(template);
        generatedTransactions.push(...newTransactions);
        totalGenerated += newTransactions.length;
      }

      logger.info(`Generated ${totalGenerated} recurring transactions for user ${userId}`);

      res.json({
        success: true,
        data: {
          templates_processed: templates.length,
          transactions_generated: totalGenerated,
          generated_transactions: generatedTransactions,
          templates: templates
        },
        message: `Successfully generated ${totalGenerated} recurring transactions`
      });
    } catch (error) {
      logger.error('Recurring generation failed', { userId, error: error.message });
      throw error;
    }
  }),



  /**
   * Get upcoming transactions for user
   * @route GET /api/v1/transactions/upcoming
   */
  getUpcomingTransactions: asyncHandler(async (req, res) => {
    const userId = req.user.id;

    try {
      const query = `
        SELECT t.*, c.name as category_name, rt.name as template_name
        FROM transactions t 
        LEFT JOIN categories c ON t.category_id = c.id
        LEFT JOIN recurring_templates rt ON t.template_id = rt.id
        WHERE t.user_id = $1 AND t.status = 'upcoming' AND t.deleted_at IS NULL
        ORDER BY t.date ASC, t.created_at ASC
      `;
      
      const result = await db.query(query, [userId]);
      
      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    } catch (error) {
      logger.error('Get upcoming transactions failed', { userId, error: error.message });
      throw error;
    }
  }),

  /**
   * Delete specific upcoming transaction
   * @route DELETE /api/v1/transactions/upcoming/:id
   */
  deleteUpcomingTransaction: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    try {
      // Verify the upcoming transaction belongs to the user
      const checkQuery = `
        SELECT id FROM transactions 
        WHERE id = $1 AND user_id = $2 AND status = 'upcoming' AND deleted_at IS NULL
      `;
      const checkResult = await db.query(checkQuery, [id, userId]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Upcoming transaction not found'
        });
      }

      // Delete the upcoming transaction - FIXED for current schema
      let deleted = false;
      
      // Delete from unified transactions table
      const deleteQuery = `
        DELETE FROM transactions 
        WHERE id = $1 AND user_id = $2
        RETURNING id
      `;
      const result = await db.query(deleteQuery, [id, userId]);
      deleted = result.rows.length > 0;

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Upcoming transaction not found'
        });
      }

      logger.info('Upcoming transaction deleted', { userId, transactionId: id });

      res.json({
        success: true,
        message: 'Upcoming transaction deleted successfully'
      });
    } catch (error) {
      logger.error('Delete upcoming transaction failed', { userId, transactionId: id, error: error.message });
      throw error;
    }
  }),

  /**
   * Stop generating upcoming transactions for a template
   * @route POST /api/v1/transactions/templates/:id/stop
   */
  stopTemplateGeneration: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    try {
      // Verify the template belongs to the user
      const checkQuery = `
        SELECT id, name FROM recurring_templates 
        WHERE id = $1 AND user_id = $2
      `;
      const checkResult = await db.query(checkQuery, [id, userId]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Recurring template not found'
        });
      }

      const template = checkResult.rows[0];

      // Deactivate the template
      const updateQuery = `
        UPDATE recurring_templates 
        SET is_active = false, updated_at = NOW() 
        WHERE id = $1 AND user_id = $2
        RETURNING id, name, is_active
      `;
      const updateResult = await db.query(updateQuery, [id, userId]);

      // Delete all future upcoming transactions for this template - FIXED for unified table
      let deletedCount = 0;
      
      // Delete from unified transactions table
      const deleteQuery = `
        DELETE FROM transactions 
        WHERE template_id = $1 AND user_id = $2 AND date > CURRENT_DATE
        RETURNING id
      `;
      const result = await db.query(deleteQuery, [id, userId]);
      deletedCount += result.rows.length;

      logger.info('Template generation stopped', { 
        userId, 
        templateId: id, 
        templateName: template.name,
        deletedUpcomingCount: deletedCount 
      });

      res.json({
        success: true,
        data: updateResult.rows[0],
        deletedUpcomingCount: deletedCount,
        message: `Template generation stopped. ${deletedCount} upcoming transactions removed.`
      });
    } catch (error) {
      logger.error('Stop template generation failed', { userId, templateId: id, error: error.message });
      throw error;
    }
  }),

  /**
   * Regenerate upcoming transactions for a specific template
   * @route POST /api/v1/transactions/templates/:id/regenerate
   */
  regenerateTemplateUpcoming: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    try {
      // Verify the template belongs to the user and is active
      const templateQuery = `
        SELECT * FROM recurring_templates 
        WHERE id = $1 AND user_id = $2 AND is_active = true
      `;
      const templateResult = await db.query(templateQuery, [id, userId]);

      if (templateResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Active recurring template not found'
        });
      }

      const template = templateResult.rows[0];

      // Remove existing upcoming transactions for this template - FIXED for unified table
      let deletedCount = 0;
      
      // Delete from unified transactions table
      const deleteQuery = `
        DELETE FROM transactions 
        WHERE template_id = $1 AND user_id = $2 AND date > CURRENT_DATE
        RETURNING id
      `;
      const result = await db.query(deleteQuery, [id, userId]);
      deletedCount += result.rows.length;

      // Generate new 3-month upcoming transactions
      const upcomingTransactions = await generateUpcomingTransactions(template);

      logger.info('Template upcoming transactions regenerated', { 
        userId, 
        templateId: id, 
        templateName: template.name,
        deletedCount: deletedCount,
        generatedCount: upcomingTransactions.length
      });

      res.json({
        success: true,
        data: {
          template: {
            id: template.id,
            name: template.name
          },
          deletedCount: deletedCount,
          generatedCount: upcomingTransactions.length,
          upcomingTransactions
        },
        message: `Regenerated ${upcomingTransactions.length} upcoming transactions for "${template.name}"`
      });
    } catch (error) {
      logger.error('Regenerate template upcoming failed', { userId, templateId: id, error: error.message });
      throw error;
    }
  })
};

/**
 * 🔧 ONBOARDING FIX: Generate missing current month transactions
 * For templates created during onboarding that need current month transactions
 */
transactionController.generateMissingCurrentMonthTransactions = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  try {
    logger.info('Generating missing current month transactions for onboarding templates', { userId });
    
    // Get all active templates for this user
    const templatesQuery = `
      SELECT id, name, description, amount, type, category_id, user_id, start_date, day_of_month, interval_type
      FROM recurring_templates 
      WHERE user_id = $1 AND is_active = true
    `;
    const templateResult = await db.query(templatesQuery, [userId]);
    const templates = templateResult.rows;
    
    let totalGenerated = 0;
    const results = [];
    
    for (const template of templates) {
      // Check if current month transaction already exists for this template
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const existsQuery = `
        SELECT COUNT(*) as count 
        FROM transactions 
        WHERE template_id = $1 
          AND user_id = $2 
          AND date >= $3 
          AND date < $4
          AND deleted_at IS NULL
      `;
      
      const startOfMonth = `${currentMonth}-01`;
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const startOfNextMonth = nextMonth.toISOString().slice(0, 7) + '-01';
      
      const existsResult = await db.query(existsQuery, [
        template.id, 
        userId, 
        startOfMonth, 
        startOfNextMonth
      ]);
      
      const existingCount = parseInt(existsResult.rows[0].count);
      
      if (existingCount === 0) {
        // Generate current month transaction
        const transactionData = {
          categoryId: template.category_id,
          amount: template.amount,
          type: template.type,
          description: template.description || template.name,
          notes: `Current month transaction for onboarding template: ${template.name}`,
          date: new Date().toISOString().split('T')[0], // Today's date
          templateId: template.id
        };
        
        try {
          const created = await Transaction.create(transactionData, userId);
          totalGenerated++;
          results.push({
            templateId: template.id,
            templateName: template.name,
            transactionId: created.id,
            amount: template.amount,
            type: template.type,
            success: true
          });
          
          logger.info('Generated missing current month transaction', {
            userId,
            templateId: template.id,
            templateName: template.name,
            transactionId: created.id,
            amount: template.amount
          });
        } catch (createError) {
          logger.error('Failed to create current month transaction', {
            userId,
            templateId: template.id,
            templateName: template.name,
            error: createError.message
          });
          
          results.push({
            templateId: template.id,
            templateName: template.name,
            error: createError.message,
            success: false
          });
        }
      } else {
        results.push({
          templateId: template.id,
          templateName: template.name,
          skipped: true,
          reason: `${existingCount} transaction(s) already exist for current month`
        });
      }
    }
    
    logger.info('Completed generating missing current month transactions', {
      userId,
      totalTemplates: templates.length,
      totalGenerated,
      results
    });
    
    res.json({
      success: true,
      data: {
        totalTemplates: templates.length,
        totalGenerated,
        results
      },
      message: `Generated ${totalGenerated} missing current month transactions`
    });
    
  } catch (error) {
    logger.error('Failed to generate missing current month transactions', {
      userId,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      error: {
        code: 'GENERATION_FAILED',
        message: 'Failed to generate missing current month transactions',
        details: error.message
      }
    });
  }
});

module.exports = transactionController;ransactions', {
      userId,
      totalTemplates: templates.length,
      totalGenerated,
      results
    });

    res.json({
      success: true,
      data: {
        totalTemplates: templates.length,
        totalGenerated,
        results
      },
      message: `Generated ${totalGenerated} missing current month transactions`
    });

  } catch (error) {
    logger.error('Failed to generate missing current month transactions', {
      userId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'GENERATION_FAILED',
        message: 'Failed to generate missing current month transactions',
        details: error.message
      }
    });
  }
});

module.exports = transactionController;
