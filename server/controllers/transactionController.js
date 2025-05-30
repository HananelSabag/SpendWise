/**
 * Transaction Controller - Extended Version with Legacy Support
 * Includes all endpoints expected by current client
 * @module controllers/transactionController
 */

const Transaction = require('../models/Transaction');
const RecurringTemplate = require('../models/RecurringTemplate');
const DBQueries = require('../utils/dbQueries');
const TimeManager = require('../utils/TimeManager');
const errorCodes = require('../utils/errorCodes');
const { asyncHandler } = require('../middleware/errorHandler');

const transactionController = {
  /**
   * Get dashboard data - ONE REQUEST instead of 3!
   * @route GET /api/v1/transactions/dashboard
   */
  getDashboardData: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { date } = req.query;
    
    const targetDate = date ? TimeManager.normalize(new Date(date)) : new Date();
    const dashboardData = await Transaction.getDashboardData(userId, targetDate);
    
    res.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString()
    });
  }),

  /**
   * Get recent transactions - LEGACY SUPPORT
   * @route GET /api/v1/transactions/recent
   */
  getRecent: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { limit = 5, date } = req.query;
    
    const targetDate = date ? new Date(date) : new Date();
    
    // Use the optimized query to get recent transactions
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
   * Get transactions by period - LEGACY SUPPORT
   * @route GET /api/v1/transactions/period/:period
   */
  getByPeriod: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { period } = req.params;
    const { date } = req.query;
    
    if (!['day', 'week', 'month', 'year'].includes(period)) {
      throw { ...errorCodes.INVALID_INPUT, details: 'Invalid period' };
    }
    
    const targetDate = date ? new Date(date) : new Date();
    const dateRanges = TimeManager.getDateRanges(targetDate);
    const range = dateRanges[period === 'day' ? 'daily' : period + 'ly'];
    
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
  }),

  /**
   * Get recurring transactions - LEGACY SUPPORT
   * @route GET /api/v1/transactions/recurring
   */
  getRecurring: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { type } = req.query;
    
    // Get templates
    let templates = await RecurringTemplate.getByUser(userId);
    
    // Filter by type if specified
    if (type && ['expense', 'income'].includes(type)) {
      templates = templates.filter(t => t.type === type);
    }
    
    // Get recent occurrences for each template
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
   * Get balance details - LEGACY SUPPORT
   * @route GET /api/v1/transactions/balance/details
   */
  getBalanceDetails: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { date } = req.query;
    
    const targetDate = date ? new Date(date) : new Date();
    const dashboardData = await Transaction.getDashboardData(userId, targetDate);
    
    // Extract balance information
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
   * Get summary - LEGACY SUPPORT
   * @route GET /api/v1/transactions/summary
   */
  getSummary: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    // Get user statistics and current month data
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
   * Get balance history - LEGACY SUPPORT
   * @route GET /api/v1/transactions/balance/history/:period
   */
  getBalanceHistory: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { period } = req.params;
    const { limit = 12 } = req.query;
    
    if (!['month', 'year'].includes(period)) {
      throw { ...errorCodes.INVALID_INPUT, details: 'Invalid period. Use month or year' };
    }
    
    // For now, we only have monthly stats implementation
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
      // For yearly, aggregate monthly data
      const monthlyData = await DBQueries.getMonthlyStats(userId, parseInt(limit) * 12);
      
      // Group by year
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
   * Skip single transaction occurrence - LEGACY SUPPORT
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
    
    // Get the transaction to find its template
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
    
    // Add skip date to template
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

  // ============ EXISTING METHODS (NO CHANGES) ============

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
      category_id,
      is_recurring,
      recurring_interval,
      day_of_month,
      recurring_end_date
    } = req.body;

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

      const template = await RecurringTemplate.create({
        user_id: userId,
        type,
        amount,
        description,
        category_id,
        interval_type: recurring_interval,
        day_of_month: recurring_interval === 'monthly' ? day_of_month : null,
        start_date: TimeManager.formatForDB(date || new Date()),
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
        category_id
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
    const { updateFuture, ...updateData } = req.body;

    if (!['expense', 'income'].includes(type)) {
      throw { ...errorCodes.INVALID_INPUT, details: 'Invalid transaction type' };
    }

    if (updateData.date) {
      updateData.date = TimeManager.formatForDB(updateData.date);
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

    if (!['expense', 'income'].includes(type)) {
      throw { ...errorCodes.INVALID_INPUT, details: 'Invalid transaction type' };
    }

    await Transaction.delete(type, id, userId);

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

    await RecurringTemplate.delete(id, userId, deleteFuture === 'true');

    res.json({
      success: true,
      message: deleteFuture === 'true' 
        ? 'Template and future transactions deleted' 
        : 'Template deactivated'
    });
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
  })
};

module.exports = transactionController;