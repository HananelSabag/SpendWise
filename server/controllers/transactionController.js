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
   */
  getUserAnalytics: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const months = parseInt(req.query.months) || 1;

    try {
      const summary = await Transaction.getSummary(userId, months * 30);
      const transactions = await Transaction.findByUser(userId, { limit: 100 });

      res.json({
        success: true,
        data: {
          insights: [],
          trends: [],
          categories: [],
          transactions: transactions,
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

      const transactions = await Transaction.findByUser(userId, options);

      // ✅ NO MORE POST-PROCESSING: Search is now applied in SQL query

      // Calculate summary
      const summary = {
        total: transactions.length,
        totalIncome: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0),
        totalExpenses: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0),
        count: transactions.length
      };
      summary.netAmount = summary.totalIncome - summary.totalExpenses;

      res.json({
        success: true,
        data: {
          transactions,
          summary,
          pagination: {
            page,
            limit,
            total: transactions.length,
            hasMore: transactions.length === limit
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
      // ✅ IMPROVED: Get or create category from categoryId or category_name
      let finalCategoryId = null;
      
      // If categoryId is provided, use it directly
      if (categoryId) {
        finalCategoryId = categoryId;
      } else if (category_name) {
        // Try to find existing category by name (exact match first, then case-insensitive)
        const categoryQuery = `
          SELECT id FROM categories 
          WHERE name = $1 AND (user_id = $2 OR user_id IS NULL)
          ORDER BY user_id DESC NULLS LAST
          LIMIT 1
        `;
        let categoryResult = await db.query(categoryQuery, [category_name, userId]);
        
        // If exact match not found, try case-insensitive
        if (categoryResult.rows.length === 0) {
          const categoryQueryInsensitive = `
            SELECT id FROM categories 
            WHERE name ILIKE $1 AND (user_id = $2 OR user_id IS NULL)
            ORDER BY user_id DESC NULLS LAST
            LIMIT 1
          `;
          categoryResult = await db.query(categoryQueryInsensitive, [category_name, userId]);
        }
        
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
          
          logger.info('Created new category for transaction', {
            userId,
            categoryName: category_name,
            categoryId: finalCategoryId
          });
        }
      }

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
   */
  delete: asyncHandler(async (req, res) => {
    const { type, id } = req.params;
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
      
      logger.error('Transaction deletion failed', { transactionId: id, userId, error: error.message });
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
            
            // Delete from income table
            const incomeResult = await db.query(
              'DELETE FROM income WHERE template_id = $1 AND user_id = $2 RETURNING id',
              [templateId, userId]
            );
            deletedTransactionsCount += incomeResult.rows.length;
            
            // Delete from expenses table
            const expensesResult = await db.query(
              'DELETE FROM expenses WHERE template_id = $1 AND user_id = $2 RETURNING id',
              [templateId, userId]
            );
            deletedTransactionsCount += expensesResult.rows.length;
            
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

      // Process each template
      for (const templateData of templates) {
        try {
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
          } = templateData;

          // ✅ Get or create category (same logic as single template)
          let finalCategoryId = null;
          
          if (categoryId) {
            finalCategoryId = categoryId;
          } else if (category_name) {
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
              const createCategoryQuery = `
                INSERT INTO categories (name, user_id, created_at, updated_at)
                VALUES ($1, $2, NOW(), NOW())
                RETURNING id
              `;
              const createResult = await db.query(createCategoryQuery, [category_name, userId]);
              finalCategoryId = createResult.rows[0].id;
            }
          }

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

          // ✅ Generate transactions for this template
          const today = new Date();
          const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          
          const currentTransactions = await generateCurrentMonthTransactions(template, startOfCurrentMonth, today);
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
   * Bulk delete transactions - BACKWARD COMPATIBLE VERSION
   * @route POST /api/v1/transactions/bulk-delete
   */
  bulkDelete: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { transactionIds } = req.body;

    logger.info('Bulk delete request received', {
      userId,
      body: req.body,
      transactionIds,
      transactionIdsType: typeof transactionIds,
      isArray: Array.isArray(transactionIds),
      length: transactionIds?.length,
      rawBody: JSON.stringify(req.body),
      contentType: req.headers['content-type']
    });

    // ✅ ENHANCED VALIDATION: More detailed error messages
    if (!req.body) {
      logger.error('Bulk delete failed - no body', { headers: req.headers });
      return res.status(400).json({
        success: false,
        message: 'Request body is required',
        error: 'NO_BODY'
      });
    }

    if (!transactionIds) {
      logger.error('Bulk delete failed - no transactionIds', { body: req.body });
      return res.status(400).json({
        success: false,
        message: 'transactionIds field is required',
        error: 'NO_TRANSACTION_IDS'
      });
    }

    if (!Array.isArray(transactionIds)) {
      logger.error('Bulk delete failed - transactionIds not array', { 
        transactionIds, 
        type: typeof transactionIds 
      });
      return res.status(400).json({
        success: false,
        message: 'transactionIds must be an array',
        error: 'INVALID_ARRAY',
        received: typeof transactionIds
      });
    }

    if (transactionIds.length === 0) {
      logger.error('Bulk delete failed - empty array', { transactionIds });
      return res.status(400).json({
        success: false,
        message: 'transactionIds array cannot be empty',
        error: 'EMPTY_ARRAY'
      });
    }

    try {
      const results = {
        successful: 0,
        failed: 0,
        errors: []
      };

      // ✅ CRITICAL FIX: Work with unified transactions table
      for (const transactionId of transactionIds) {
        try {
          // Delete from unified transactions table
          const deleteQuery = `
            DELETE FROM transactions 
            WHERE id = $1 AND user_id = $2
            RETURNING id, type
          `;
          const result = await db.query(deleteQuery, [transactionId, userId]);
          
          if (result.rows.length > 0) {
            const deletedTransaction = result.rows[0];
            results.successful++;
            logger.info(`Bulk deleted ${deletedTransaction.type} transaction ${transactionId} for user ${userId}`);
          } else {
            results.failed++;
            results.errors.push(`Transaction ${transactionId} not found or not accessible`);
          }
          
        } catch (error) {
          results.failed++;
          results.errors.push(`Failed to delete transaction ${transactionId}: ${error.message}`);
          logger.error(`Bulk delete failed for transaction ${transactionId}`, {
            userId,
            transactionId,
            error: error.message
          });
        }
      }

      res.json({
        success: results.successful > 0,
        data: {
          summary: results,
          deleted_count: results.successful,
          failed_count: results.failed
        },
        message: `Bulk delete completed: ${results.successful} successful, ${results.failed} failed`
      });
    } catch (error) {
      logger.error('Bulk delete operation failed', {
        userId,
        transactionIds,
        error: error.message
      });
      throw error;
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
      
      // Try to delete from income table first
      const deleteIncomeQuery = `
        DELETE FROM income 
        WHERE id = $1 AND user_id = $2
        RETURNING id
      `;
      const incomeResult = await db.query(deleteIncomeQuery, [id, userId]);
      
      if (incomeResult.rows.length > 0) {
        deleted = true;
      } else {
        // Try to delete from expenses table
        const deleteExpenseQuery = `
          DELETE FROM expenses 
          WHERE id = $1 AND user_id = $2
          RETURNING id
        `;
        const expenseResult = await db.query(deleteExpenseQuery, [id, userId]);
        deleted = expenseResult.rows.length > 0;
      }

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

      // Delete all future upcoming transactions for this template - FIXED for current schema
      let deletedCount = 0;
      
      // Delete from income table
      const deleteIncomeQuery = `
        DELETE FROM income 
        WHERE template_id = $1 AND user_id = $2 AND date > CURRENT_DATE
        RETURNING id
      `;
      const incomeResult = await db.query(deleteIncomeQuery, [id, userId]);
      deletedCount += incomeResult.rows.length;
      
      // Delete from expenses table
      const deleteExpensesQuery = `
        DELETE FROM expenses 
        WHERE template_id = $1 AND user_id = $2 AND date > CURRENT_DATE
        RETURNING id
      `;
      const expensesResult = await db.query(deleteExpensesQuery, [id, userId]);
      deletedCount += expensesResult.rows.length;

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

      // Remove existing upcoming transactions for this template - FIXED for current schema
      let deletedCount = 0;
      
      // Delete from income table
      const deleteIncomeQuery = `
        DELETE FROM income 
        WHERE template_id = $1 AND user_id = $2 AND date > CURRENT_DATE
        RETURNING id
      `;
      const incomeResult = await db.query(deleteIncomeQuery, [id, userId]);
      deletedCount += incomeResult.rows.length;
      
      // Delete from expenses table
      const deleteExpensesQuery = `
        DELETE FROM expenses 
        WHERE template_id = $1 AND user_id = $2 AND date > CURRENT_DATE
        RETURNING id
      `;
      const expensesResult = await db.query(deleteExpensesQuery, [id, userId]);
      deletedCount += expensesResult.rows.length;

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
 * 🔄 CORE RECURRING TRANSACTIONS ENGINE
 * Generates actual transactions from recurring templates
 */
async function generateTransactionsFromTemplate(template) {
  const generated = [];
  const today = new Date();
  const maxDaysLookAhead = 60; // Generate up to 2 months ahead
  
  try {
    // Calculate next due dates
    const dueDates = calculateRecurringDates(template, today, maxDaysLookAhead);
    
    for (const dueDate of dueDates) {
      // Check if transaction already exists for this date and template - UNIFIED TABLE
      const dateStr = dueDate.toISOString().split('T')[0];
      const existsQuery = `SELECT id FROM transactions WHERE template_id = $1 AND date = $2 AND deleted_at IS NULL`;
      const existsResult = await db.query(existsQuery, [template.id, dateStr]);
      
      if (existsResult.rows.length === 0) {
        // Create new transaction using Transaction model
        const transactionData = {
          categoryId: template.category_id,
          amount: template.amount,
          type: template.type,
          description: template.description || template.name,
          notes: template.notes || `Generated from recurring template: ${template.name || 'Unnamed'}`,
          date: dateStr,
          templateId: template.id
        };

        // Use Transaction model's create method for backward compatibility
        logger.info('Creating transaction from template', {
          templateId: template.id,
          userId: template.user_id,
          transactionData: {
            type: transactionData.type,
            amount: transactionData.amount,
            date: transactionData.date,
            description: transactionData.description
          }
        });
        
        const created = await Transaction.create(transactionData, template.user_id);
        logger.info('Transaction created successfully from template', {
          templateId: template.id,
          transactionId: created.id,
          type: created.type
        });
        generated.push(created);
      }
    }
    
    return generated;
  } catch (error) {
    logger.error('Failed to generate transactions from template', { 
      templateId: template.id, 
      error: error.message 
    });
    throw error;
  }
}

/**
 * Calculate recurring dates for a template
 */
function calculateRecurringDates(template, fromDate, daysLookAhead) {
  const dates = [];
  const { interval_type, day_of_month, day_of_week, start_date, end_date, skip_dates } = template;
  const skipDatesSet = new Set(skip_dates || []);
  
  let currentDate = new Date(Math.max(new Date(start_date), fromDate));
  const endTime = new Date(fromDate.getTime() + (daysLookAhead * 24 * 60 * 60 * 1000));
  const finalEndDate = end_date ? new Date(Math.min(new Date(end_date), endTime)) : endTime;

  while (currentDate <= finalEndDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    
    // Check if this date should be skipped
    if (!skipDatesSet.has(dateStr)) {
      if (interval_type === 'daily') {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (interval_type === 'weekly') {
        if (day_of_week === null || currentDate.getDay() === day_of_week) {
          dates.push(new Date(currentDate));
        }
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (interval_type === 'monthly') {
        if (day_of_month === null || currentDate.getDate() === day_of_month) {
          dates.push(new Date(currentDate));
          // Move to next month
          currentDate.setMonth(currentDate.getMonth() + 1);
          if (day_of_month) {
            currentDate.setDate(day_of_month);
          }
        } else {
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    } else {
      // Skip this date
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Safety check to prevent infinite loops
    if (dates.length > 100) break;
  }
  
  return dates;
}

/**
 * 🏠 GENERATE CURRENT MONTH TRANSACTIONS
 * Generate actual transactions for current month (not upcoming status)
 */
async function generateCurrentMonthTransactions(template, startDate, endDate) {
  const currentTransactions = [];
  
  try {
    // Calculate current month dates based on template settings
    const currentDates = calculateRecurringDatesInRange(template, startDate, endDate);
    
    for (const dueDate of currentDates) {
      // Check if transaction already exists for this date and template - BACKWARD COMPATIBLE
      const dateStr = dueDate.toISOString().split('T')[0];
      let existsResult;
      
      if (template.type === 'income') {
        const existsQuery = `SELECT id FROM income WHERE template_id = $1 AND date = $2`;
        existsResult = await db.query(existsQuery, [template.id, dateStr]);
      } else {
        const existsQuery = `SELECT id FROM expenses WHERE template_id = $1 AND date = $2`;
        existsResult = await db.query(existsQuery, [template.id, dateStr]);
      }
      
      if (existsResult.rows.length === 0) {
        // Create new current transaction (normal status) using Transaction model
        const transactionData = {
          categoryId: template.category_id,
          amount: template.amount,
          type: template.type,
          description: template.description || template.name,
          notes: `Generated from recurring template: ${template.name}`,
          date: dateStr,
          templateId: template.id
          // No status field = normal confirmed transaction
        };

        // Use Transaction model's create method for backward compatibility
        const created = await Transaction.create(transactionData, template.user_id);
        currentTransactions.push(created);
      }
    }
    
    return currentTransactions;
  } catch (error) {
    logger.error('Failed to generate current month transactions', { 
      templateId: template.id, 
      error: error.message 
    });
    return [];
  }
}

/**
 * ✅ SMART 3-MONTH UPCOMING GENERATION SYSTEM
 * Generate upcoming transactions for next 3 months from template
 */
async function generateUpcomingTransactions(template) {
  const upcomingTransactions = [];
  const today = new Date();
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
  
  try {
    // Calculate upcoming dates based on interval_type
    const upcomingDates = calculateUpcomingDates(template, today, threeMonthsFromNow);
    
    for (const dueDate of upcomingDates) {
      // For upcoming transactions, we'll create them as virtual data (not stored in DB)
      // Since income/expenses tables don't have status field, we'll return them as virtual objects
      const dateStr = dueDate.toISOString().split('T')[0];
      
      // Check if real transaction already exists for this date and template
      let existsResult;
      if (template.type === 'income') {
        const existsQuery = `SELECT id FROM income WHERE template_id = $1 AND date = $2`;
        existsResult = await db.query(existsQuery, [template.id, dateStr]);
      } else {
        const existsQuery = `SELECT id FROM expenses WHERE template_id = $1 AND date = $2`;
        existsResult = await db.query(existsQuery, [template.id, dateStr]);
      }
      
      if (existsResult.rows.length === 0) {
        // Create virtual upcoming transaction (not stored in DB, used for UI display)
        const upcomingTransaction = {
          id: `upcoming_${template.id}_${dateStr}`, // Virtual ID for frontend
          user_id: template.user_id,
          category_id: template.category_id,
          amount: template.amount,
          type: template.type,
          description: template.description || template.name,
          notes: `Upcoming: ${template.name || 'Recurring Transaction'}`,
          date: dateStr,
          template_id: template.id,
          status: 'upcoming', // Mark as upcoming
          created_at: new Date().toISOString(),
          is_virtual: true // Flag to indicate this is not stored in DB
        };

        upcomingTransactions.push(upcomingTransaction);
      }
    }
    
    return upcomingTransactions;
  } catch (error) {
    logger.error('Failed to generate upcoming transactions', { 
      templateId: template.id, 
      error: error.message 
    });
    return [];
  }
}

/**
 * Calculate recurring dates within a specific date range
 */
function calculateRecurringDatesInRange(template, startDate, endDate) {
  const dates = [];
  const { interval_type, day_of_month, day_of_week } = template;
  
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    let shouldAdd = false;
    
    if (interval_type === 'daily') {
      shouldAdd = true;
    } else if (interval_type === 'weekly') {
      shouldAdd = (day_of_week === null || currentDate.getDay() === day_of_week);
    } else if (interval_type === 'monthly') {
      shouldAdd = (day_of_month === null || currentDate.getDate() === day_of_month);
    }
    
    if (shouldAdd) {
      dates.push(new Date(currentDate));
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
    
    // Safety check
    if (dates.length > 50) break;
  }
  
  return dates;
}

/**
 * Calculate upcoming dates for 3 months based on recurring template settings
 */
function calculateUpcomingDates(template, startDate, endDate) {
  const dates = [];
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  
  // Set to template start date if it's in the future
  if (template.start_date) {
    const templateStart = new Date(template.start_date);
    if (templateStart > current) {
      current.setTime(templateStart.getTime());
    }
  }
  
  // Adjust to proper day for monthly/weekly intervals
  if (template.interval_type === 'monthly' && template.day_of_month) {
    current.setDate(template.day_of_month);
    // If day is past this month, move to next month
    if (current < startDate) {
      current.setMonth(current.getMonth() + 1);
    }
  } else if (template.interval_type === 'weekly' && template.day_of_week !== null) {
    // Adjust to the correct day of week (0 = Sunday, 1 = Monday, etc.)
    const targetDay = template.day_of_week;
    const currentDay = current.getDay();
    const daysToAdd = (targetDay - currentDay + 7) % 7;
    current.setDate(current.getDate() + daysToAdd);
  }
  
  // Generate dates within 3-month window
  while (current <= endDate) {
    // Skip if date is in skip_dates array
    const dateString = current.toISOString().split('T')[0];
    if (!template.skip_dates || !template.skip_dates.includes(dateString)) {
      dates.push(new Date(current));
    }
    
    // Move to next occurrence
    switch (template.interval_type) {
      case 'daily':
        current.setDate(current.getDate() + 1);
        break;
      case 'weekly':
        current.setDate(current.getDate() + 7);
        break;
      case 'monthly':
        current.setMonth(current.getMonth() + 1);
        // Handle month-end dates (e.g., Jan 31 -> Feb 28)
        if (template.day_of_month > 28) {
          const lastDayOfMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
          current.setDate(Math.min(template.day_of_month, lastDayOfMonth));
        }
        break;
      default:
        // Invalid interval type, break to avoid infinite loop
        break;
    }
  }
  
  return dates;
}

module.exports = transactionController;
module.exports = transactionController;