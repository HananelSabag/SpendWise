/**
 * Transaction Controller - Production Ready
 * Handles all transaction-related HTTP requests
 * @module controllers/transactionController
 */

const Transaction = require('../models/Transaction');
const RecurringTemplate = require('../models/RecurringTemplate');
const DBQueries = require('../utils/dbQueries');
const TimeManager = require('../utils/TimeManager');
const errorCodes = require('../utils/errorCodes');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const db = require('../config/db');

const transactionController = {
  /**
   * Get dashboard data - optimized single request
   * @route GET /api/v1/transactions/dashboard
   */
  getDashboardData: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const targetDate = req.query?.date ? new Date(req.query.date) : new Date();

    const result = await DBQueries.getDashboardData(userId, targetDate);

    const ensureNumeric = (value) => {
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
    };

    const processBalance = (balance) => {
      if (balance && typeof balance === 'object' && 'income' in balance) {
        return {
          income: ensureNumeric(balance.income),
          expenses: ensureNumeric(balance.expenses),
          total: ensureNumeric(balance.income - balance.expenses)
        };
      }
      
      logger.warn('Unexpected balance format', { balance, userId });
      return {
        income: 0,
        expenses: 0,
        total: 0
      };
    };

    const responseData = {
      daily: processBalance(result.daily_balance),
      weekly: processBalance(result.weekly_balance),
      monthly: processBalance(result.monthly_balance),
      yearly: processBalance(result.yearly_balance),
      recent_transactions: result.recent_transactions || [],
      recurring_info: result.recurring_info || {},
      statistics: result.statistics || {},
      categories: result.categories || [],
      metadata: result.metadata || {}
    };

    res.json({
      success: true,
      data: responseData
    });
  }),

  /**
   * Get recent transactions
   * @route GET /api/v1/transactions/recent
   */
  getRecent: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { limit = 5, date } = req.query;
    
    const targetDate = date ? new Date(date) : new Date();
    
    const result = await Transaction.getTransactions(userId, {
      endDate: TimeManager.formatForDB(targetDate),
      limit: parseInt(limit),
      sortBy: 'date',
      sortOrder: 'DESC'
    });
    
    res.json({
      success: true,
      data: result.transactions,
      timestamp: new Date().toISOString()
    });
  }),

  /**
   * Get transactions by period
   * @route GET /api/v1/transactions/period/:period
   */
  getByPeriod: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { period } = req.params;
    const { date } = req.query;
    
    if (!['day', 'week', 'month', 'year', '3months'].includes(period)) {
      throw { ...errorCodes.INVALID_INPUT, details: 'Invalid period' };
    }
    
    const targetDate = date ? new Date(date) : new Date();
    
    try {
      const dateRanges = TimeManager.getDateRanges(targetDate);
      
      let range;
      if (period === '3months') {
        const endDate = new Date(targetDate);
        const startDate = new Date(targetDate);
        startDate.setDate(startDate.getDate() - 90);
        
        range = {
          start: startDate,
          end: endDate
        };
      } else {
        range = dateRanges[period === 'day' ? 'daily' : period + 'ly'];
      }
      
      const result = await Transaction.getTransactions(userId, {
        startDate: TimeManager.formatForDB(range.start),
        endDate: TimeManager.formatForDB(range.end),
        sortBy: 'date',
        sortOrder: 'DESC'
      });
      
      res.json({
        success: true,
        data: {
          transactions: result.transactions,
          period,
          startDate: range.start,
          endDate: range.end
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error in getByPeriod', { userId, period, error: error.message });
      
      if (error.code === '42702') {
        throw { 
          ...errorCodes.SQL_AMBIGUOUS_COLUMN, 
          details: 'Database query needs column disambiguation' 
        };
      }
      
      throw { 
        ...errorCodes.FETCH_FAILED, 
        details: error.message || 'Failed to fetch period transactions' 
      };
    }
  }),

  /**
   * Get recurring transactions
   * @route GET /api/v1/transactions/recurring
   */
  getRecurring: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { type } = req.query;
    
    let templates = await RecurringTemplate.getByUser(userId);
    
    if (type && ['expense', 'income'].includes(type)) {
      templates = templates.filter(t => t.type === type);
    }
    
    const recurringWithOccurrences = await Promise.all(
      templates.map(async (template) => {
        const occurrences = await Transaction.getTransactions(userId, {
          templateId: template.id,
          limit: 5,
          sortBy: 'date',
          sortOrder: 'DESC'
        });
        
        return {
          ...template,
          recentOccurrences: occurrences.transactions,
          nextOccurrence: TimeManager.getNextOccurrence(
            occurrences.transactions[0]?.date || template.start_date,
            template.interval_type,
            template.day_of_month
          )
        };
      })
    );
    
    res.json({
      success: true,
      data: recurringWithOccurrences,
      timestamp: new Date().toISOString()
    });
  }),

  /**
   * Get balance details
   * @route GET /api/v1/transactions/balance/details
   */
  getBalanceDetails: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { date } = req.query;
    
    const targetDate = date ? new Date(date) : new Date();
    const dashboardData = await DBQueries.getDashboardData(userId, targetDate); // Fixed: use DBQueries
    
    const balanceDetails = {
      daily: dashboardData.daily_balance,
      weekly: dashboardData.weekly_balance,
      monthly: dashboardData.monthly_balance,
      yearly: dashboardData.yearly_balance,
      calculated_at: dashboardData.metadata.calculated_at,
      target_date: dashboardData.metadata.target_date
    };
    
    res.json({
      success: true,
      data: balanceDetails,
      timestamp: new Date().toISOString()
    });
  }),

  /**
   * Get summary
   * @route GET /api/v1/transactions/summary
   */
  getSummary: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    const [stats, monthlyData] = await Promise.all([
      Transaction.getStats(userId),
      DBQueries.getMonthlyStats(userId, 1)
    ]);
    
    const summary = {
      totalIncome: stats.total_income,
      totalExpenses: stats.total_expenses,
      netBalance: stats.net_balance,
      activeTemplates: stats.active_templates,
      currentMonth: {
        income: monthlyData[0]?.income || 0,
        expenses: monthlyData[0]?.expenses || 0,
        balance: monthlyData[0]?.balance || 0
      },
      averages: {
        dailyExpense: stats.avg_daily_expense,
        dailyIncome: stats.avg_daily_income
      }
    };
    
    res.json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString()
    });
  }),

  /**
   * Get balance history
   * @route GET /api/v1/transactions/balance/history/:period
   */
  getBalanceHistory: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { period } = req.params;
    const { limit = 12 } = req.query;
    
    if (!['month', 'year'].includes(period)) {
      throw { ...errorCodes.INVALID_INPUT, details: 'Invalid period. Use month or year' };
    }
    
    if (period === 'month') {
      const history = await DBQueries.getMonthlyStats(userId, parseInt(limit));
      
      res.json({
        success: true,
        data: history.map(item => ({
          period: item.month,
          income: item.income,
          expenses: item.expenses,
          balance: item.balance
        })),
        timestamp: new Date().toISOString()
      });
    } else {
      const monthlyData = await DBQueries.getMonthlyStats(userId, parseInt(limit) * 12);
      
      const yearlyData = monthlyData.reduce((acc, month) => {
        const year = new Date(month.month).getFullYear();
        if (!acc[year]) {
          acc[year] = { income: 0, expenses: 0, balance: 0 };
        }
        acc[year].income += parseFloat(month.income);
        acc[year].expenses += parseFloat(month.expenses);
        acc[year].balance += parseFloat(month.balance);
        return acc;
      }, {});
      
      const history = Object.entries(yearlyData)
        .map(([year, data]) => ({
          period: `${year}-01-01`,
          income: data.income,
          expenses: data.expenses,
          balance: data.balance
        }))
        .sort((a, b) => new Date(b.period) - new Date(a.period))
        .slice(0, parseInt(limit));
      
      res.json({
        success: true,
        data: history,
        timestamp: new Date().toISOString()
      });
    }
  }),

  /**
   * Skip single transaction occurrence
   * @route POST /api/v1/transactions/:type/:id/skip
   */
  skipTransactionOccurrence: asyncHandler(async (req, res) => {
    const { type, id } = req.params;
    const { skipDate } = req.body;
    const userId = req.user.id;
    
    if (!['expense', 'income'].includes(type)) {
      throw { ...errorCodes.INVALID_INPUT, details: 'Invalid transaction type' };
    }
    
    if (!skipDate) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Skip date is required' };
    }
    
    const transactions = await Transaction.getTransactions(userId, {
      type,
      limit: 1
    });
    
    const transaction = transactions.transactions.find(t => t.id === parseInt(id));
    
    if (!transaction) {
      throw { ...errorCodes.NOT_FOUND, message: 'Transaction not found' };
    }
    
    if (!transaction.template_id) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Cannot skip non-recurring transaction' };
    }
    
    await RecurringTemplate.skipDates(
      transaction.template_id, 
      userId, 
      [TimeManager.formatForDB(skipDate)]
    );
    
    res.json({
      success: true,
      message: 'Transaction occurrence skipped successfully',
      timestamp: new Date().toISOString()
    });
  }),

  /**
   * Get transactions with filters
   * @route GET /api/v1/transactions
   */
  getTransactions: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const {
      type,
      startDate,
      endDate,
      categoryId,
      templateId,
      searchTerm,
      page = 1,
      limit = 50,
      sortBy = 'date',
      sortOrder = 'DESC'
    } = req.query;

    if (type && !['expense', 'income'].includes(type)) {
      throw { ...errorCodes.INVALID_INPUT, details: 'Invalid transaction type' };
    }

    const options = {
      type,
      startDate: startDate ? TimeManager.formatForDB(startDate) : null,
      endDate: endDate ? TimeManager.formatForDB(endDate) : null,
      categoryId: categoryId ? parseInt(categoryId) : null,
      templateId: templateId !== undefined ? parseInt(templateId) : null,
      searchTerm,
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    };

    const result = await Transaction.getTransactions(userId, options);
    
    res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });
  }),

  /**
   * Create new transaction
   * @route POST /api/v1/transactions/:type
   */
  create: asyncHandler(async (req, res) => {
    const { type } = req.params;
    const userId = req.user.id;
    
    if (!['expense', 'income'].includes(type)) {
      throw { ...errorCodes.INVALID_INPUT, details: 'Invalid transaction type' };
    }

    const {
      amount,
      description,
      date,
      category_id, // Will be resolved dynamically if not provided
      is_recurring,
      recurring_interval,
      day_of_month,
      recurring_end_date
    } = req.body;

    // ✅ FIX: Get valid category for user if not provided
    let finalCategoryId = category_id;
    if (!finalCategoryId) {
      try {
        const Category = require('../models/Category');
        const userCategories = await Category.getAll(userId);
        const validCategory = userCategories.find(cat => 
          cat.type === type || 
          (cat.name && (cat.name.toLowerCase().includes('general') || cat.name.toLowerCase().includes('כללי')))
        ) || userCategories[0];
        
        if (!validCategory) {
          throw { ...errorCodes.VALIDATION_ERROR, details: 'No valid category found for user' };
        }
        
        finalCategoryId = validCategory.id;
      } catch (error) {
        logger.error('Error finding default category', { userId, type, error: error.message });
        throw { ...errorCodes.VALIDATION_ERROR, details: 'Unable to determine category for transaction' };
      }
    }

    if (!amount || amount <= 0) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Amount must be positive' };
    }

    if (!description?.trim()) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Description is required' };
    }

    if (is_recurring) {
      if (!recurring_interval) {
        throw { ...errorCodes.VALIDATION_ERROR, details: 'Recurring interval is required' };
      }

      if (!['daily', 'weekly', 'monthly'].includes(recurring_interval)) {
        throw { ...errorCodes.VALIDATION_ERROR, details: 'Invalid recurring interval' };
      }

      // ✅ ENHANCED: Smart defaults for missing day values
      let finalDayOfMonth = day_of_month;
      let finalDayOfWeek = req.body.day_of_week;
      
      if (recurring_interval === 'monthly' && !finalDayOfMonth) {
        // Default to the day of the start date
        const startDate = new Date(date || new Date());
        finalDayOfMonth = startDate.getDate();
      }
      
      if (recurring_interval === 'weekly' && finalDayOfWeek === undefined) {
        // Default to the day of week of the start date
        const startDate = new Date(date || new Date());
        finalDayOfWeek = startDate.getDay();
      }

      // ✅ FIX: Always start recurring transactions from the beginning of the current month
      // Unless user specifically chose a different start date in the future
      const requestedDate = new Date(date || new Date());
      const currentMonth = new Date();
      currentMonth.setDate(1); // First day of current month
      currentMonth.setHours(0, 0, 0, 0);
      
      // If requested date is in current month or past, start from beginning of current month
      // If requested date is in future month, start from beginning of that month
      let startDate;
      if (requestedDate >= currentMonth) {
        // Future date - start from beginning of that month
        startDate = new Date(requestedDate.getFullYear(), requestedDate.getMonth(), 1);
      } else {
        // Current or past date - start from beginning of current month
        startDate = currentMonth;
      }

      const template = await RecurringTemplate.create({
        user_id: userId,
        type,
        amount,
        description,
        category_id: finalCategoryId,
        interval_type: recurring_interval,
        day_of_month: recurring_interval === 'monthly' ? finalDayOfMonth : null,
        day_of_week: recurring_interval === 'weekly' ? finalDayOfWeek : null,
        start_date: TimeManager.formatForDB(startDate),
        end_date: recurring_end_date ? TimeManager.formatForDB(recurring_end_date) : null
      });

      res.status(201).json({
        success: true,
        data: {
          template,
          message: 'Recurring transaction created successfully'
        }
      });
    } else {
      const transaction = await Transaction.create(type, {
        user_id: userId,
        amount,
        description,
        date: TimeManager.formatForDB(date || new Date()),
        category_id: finalCategoryId
      });

      res.status(201).json({
        success: true,
        data: transaction
      });
    }
  }),

  /**
   * Update transaction
   * @route PUT /api/v1/transactions/:type/:id
   */
  update: asyncHandler(async (req, res) => {
    const { type, id } = req.params;
    const userId = req.user.id;
    const { updateFuture, day_of_month, day_of_week, ...updateData } = req.body; // ✅ FIX: Extract day fields

    if (!['expense', 'income'].includes(type)) {
      throw { ...errorCodes.INVALID_INPUT, details: 'Invalid transaction type' };
    }

    if (updateData.date) {
      updateData.date = TimeManager.formatForDB(updateData.date);
    }

    // ✅ FIX: Include day fields in update data for recurring transactions
    if (updateData.is_recurring) {
      updateData.day_of_month = updateData.recurring_interval === 'monthly' ? day_of_month : null;
      updateData.day_of_week = updateData.recurring_interval === 'weekly' ? day_of_week : null;
      
      // ✅ FIX: Apply same start date logic as create - start from beginning of month
      if (updateData.date) {
        const requestedDate = new Date(updateData.date);
        const currentMonth = new Date();
        currentMonth.setDate(1);
        currentMonth.setHours(0, 0, 0, 0);
        
        let startDate;
        if (requestedDate >= currentMonth) {
          startDate = new Date(requestedDate.getFullYear(), requestedDate.getMonth(), 1);
        } else {
          startDate = currentMonth;
        }
        updateData.date = TimeManager.formatForDB(startDate);
      }
    }

    const transaction = await Transaction.update(type, id, userId, updateData);

    res.json({
      success: true,
      data: transaction
    });
  }),

  /**
   * Delete transaction
   * @route DELETE /api/v1/transactions/:type/:id
   */
  delete: asyncHandler(async (req, res) => {
    const { type, id } = req.params;
    const userId = req.user.id;
    const { deleteAll, deleteFuture, deleteSingle } = req.query; // ✅ FIX: Extract delete options from query

    if (!['expense', 'income'].includes(type)) {
      throw { ...errorCodes.INVALID_INPUT, details: 'Invalid transaction type' };
    }

    // ✅ FIX: Pass delete options to the model
    const deleteOptions = {
      deleteAll: deleteAll === 'true',
      deleteFuture: deleteFuture === 'true', 
      deleteSingle: deleteSingle === 'true'
    };

    await Transaction.delete(type, id, userId, deleteOptions);

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  }),

  /**
   * Get recurring templates
   * @route GET /api/v1/transactions/templates
   */
  getTemplates: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const templates = await RecurringTemplate.getByUser(userId);

    res.json({
      success: true,
      data: templates
    });
  }),

  /**
   * Update recurring template
   * @route PUT /api/v1/transactions/templates/:id
   */
  updateTemplate: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const { updateFuture = false, ...updateData } = req.body;

    const template = await RecurringTemplate.update(id, userId, updateData, updateFuture);

    res.json({
      success: true,
      data: template,
      message: updateFuture ? 'Template and future transactions updated' : 'Template updated'
    });
  }),

  /**
   * Delete recurring template
   * @route DELETE /api/v1/transactions/templates/:id
   */
  deleteTemplate: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const { deleteFuture = false } = req.query;

    // 🔍 DEBUGGING: Log incoming delete request
    logger.info('🗑️ DELETE TEMPLATE REQUEST RECEIVED', {
      templateId: id,
      userId: userId,
      deleteFuture: deleteFuture,
      query: req.query,
      headers: {
        origin: req.headers.origin,
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type']
      },
      timestamp: new Date().toISOString()
    });

    try {
      // 🔍 DEBUGGING: Log before calling delete
      logger.info('🗑️ CALLING RecurringTemplate.delete', {
        templateId: id,
        userId: userId,
        deleteFutureBoolean: deleteFuture === 'true'
      });

      const result = await RecurringTemplate.delete(id, userId, deleteFuture === 'true');

      // 🔍 DEBUGGING: Log successful deletion
      logger.info('✅ TEMPLATE DELETE SUCCESS', {
        templateId: id,
        userId: userId,
        deleteFuture: deleteFuture === 'true',
        result: result,
        timestamp: new Date().toISOString()
      });

    res.json({
      success: true,
      message: deleteFuture === 'true' 
        ? 'Template and future transactions deleted' 
          : 'Template deactivated',
        data: {
          templateId: id,
          deleteFuture: deleteFuture === 'true'
        }
      });

    } catch (error) {
      // 🔍 DEBUGGING: Log deletion error
      logger.error('❌ TEMPLATE DELETE FAILED', {
        templateId: id,
        userId: userId,
        deleteFuture: deleteFuture,
        error: error.message,
        errorCode: error.code,
        errorStack: error.stack,
        timestamp: new Date().toISOString()
      });

      throw error;
    }
  }),

  /**
   * Skip dates for recurring template
   * @route POST /api/v1/transactions/templates/:id/skip
   */
  skipDates: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const { dates } = req.body;

    if (!Array.isArray(dates) || dates.length === 0) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Dates array is required' };
    }

    const formattedDates = dates.map(date => TimeManager.formatForDB(date));
    
    await RecurringTemplate.skipDates(id, userId, formattedDates);

    res.json({
      success: true,
      message: 'Dates skipped successfully'
    });
  }),

  /**
   * Get statistics
   * @route GET /api/v1/transactions/stats
   */
  getStats: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { months = 12 } = req.query;

    const [userStats, monthlyStats] = await Promise.all([
      Transaction.getStats(userId),
      DBQueries.getMonthlyStats(userId, parseInt(months))
    ]);

    res.json({
      success: true,
      data: {
        current: userStats,
        monthly: monthlyStats
      }
    });
  }),

  /**
   * Get category breakdown
   * @route GET /api/v1/transactions/categories/breakdown
   */
  getCategoryBreakdown: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Start and end dates are required' };
    }

    const breakdown = await DBQueries.getCategoryBreakdown(
      userId,
      TimeManager.formatForDB(startDate),
      TimeManager.formatForDB(endDate)
    );

    res.json({
      success: true,
      data: breakdown
    });
  }),

  /**
   * Search transactions
   * @route GET /api/v1/transactions/search
   */
  search: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { q, limit = 50 } = req.query;

    if (!q || q.trim().length < 2) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Search term must be at least 2 characters' };
    }

    const results = await Transaction.search(userId, q, parseInt(limit));

    res.json({
      success: true,
      data: results,
      query: q
    });
  }),

  /**
   * Add new expense
   * @route POST /api/v1/transactions/expense
   */
  addExpense: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { amount, description, date, category_id = 8, notes } = req.body;
    
    const formattedDate = date ? TimeManager.formatForDB(date) : TimeManager.formatForDB(new Date());
    
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const result = await client.query(`
        INSERT INTO expenses (user_id, amount, description, date, category_id, notes)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [userId, amount, description, formattedDate, category_id, notes]);
      
      await client.query('COMMIT');
      
      logger.info('Expense created', { userId, amount, date: formattedDate });
      
      res.status(201).json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      
      if (error.code === '23505') {
        throw { ...errorCodes.UNIQUE_VIOLATION, details: 'Expense with the same details already exists' };
      }
      
      throw { ...errorCodes.SQL_ERROR, details: error.message || 'Failed to add expense' };
    } finally {
      client.release();
    }
  }),

  /**
   * Add new income
   * @route POST /api/v1/transactions/income
   */
  addIncome: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { amount, description, date, category_id = 8, notes } = req.body;
    
    const formattedDate = date ? TimeManager.formatForDB(date) : TimeManager.formatForDB(new Date());
    
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const result = await client.query(`
        INSERT INTO income (user_id, amount, description, date, category_id, notes)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [userId, amount, description, formattedDate, category_id, notes]);
      
      await client.query('COMMIT');
      
      logger.info('Income created', { userId, amount, date: formattedDate });
      
      res.status(201).json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      
      if (error.code === '23505') {
        throw { ...errorCodes.UNIQUE_VIOLATION, details: 'Income with the same details already exists' };
      }
      
      throw { ...errorCodes.SQL_ERROR, details: error.message || 'Failed to add income' };
    } finally {
      client.release();
    }
  }),

  /**
   * Generate recurring transactions manually
   * @route POST /api/v1/transactions/generate-recurring
   */
  generateRecurring: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    try {
      await db.query('SELECT generate_recurring_transactions()');
      
      logger.info('Manual recurring generation triggered', { userId });
      
      res.json({
        success: true,
        message: 'Recurring transactions generated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Manual recurring generation failed', { userId, error: error.message });
      throw { 
        ...errorCodes.SQL_ERROR, 
        details: 'Failed to generate recurring transactions' 
      };
    }
  })
};

module.exports = transactionController;