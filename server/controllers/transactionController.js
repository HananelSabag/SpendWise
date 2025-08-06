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
      // Get summary data
      const summary = await Transaction.getSummary(userId, days);
      
      // Get recent transactions
      const recentTransactions = await Transaction.getRecent(userId, 10);

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

      // Get recurring and one-time data
      const recurring = await getRecurringMonthlyTotals();
      const todayOneTime = await getOneTimeTransactions(startOfToday);
      const weekOneTime = await getOneTimeTransactions(startOfWeek);
      const monthOneTime = await getOneTimeTransactions(startOfMonth);
      const yearOneTime = await getOneTimeTransactions(startOfYear);

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
        dateTo: filters.dateTo
      };

      let transactions = await Transaction.findByUser(userId, options);

      // Apply search filter if provided
      if (filters.search) {
        const search = filters.search.toLowerCase();
        transactions = transactions.filter(t => 
          t.description?.toLowerCase().includes(search) ||
          t.notes?.toLowerCase().includes(search) ||
          t.category_name?.toLowerCase().includes(search)
        );
      }

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

    const { amount, description, categoryId, notes, date } = req.body;

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
        categoryId: categoryId || null,
        notes: notes ? notes.trim() : '',
        date: date || new Date().toISOString().split('T')[0]
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
            // Delete all transactions created from this template
            const transactionsResult = await db.query(
              'UPDATE transactions SET deleted_at = NOW() WHERE template_id = $1 AND user_id = $2 AND deleted_at IS NULL RETURNING id',
              [templateId, userId]
            );
            
            // Delete the template
            const templateResult = await db.query(
              'DELETE FROM recurring_templates WHERE id = $1 AND user_id = $2 RETURNING id',
              [templateId, userId]
            );
            
            result = { 
              templateDeleted: templateResult.rows.length > 0,
              transactionsDeleted: transactionsResult.rows.length
            };
            message = `Recurring template and ${transactionsResult.rows.length} related transactions deleted`;
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
   * Get recent for specific type (legacy compatibility)
   * @route GET /api/v1/transactions/:type/recent
   */
  getRecent: asyncHandler(async (req, res) => {
    const { type } = req.params;
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    try {
      const transactions = await Transaction.findByUser(userId, { type, limit });

      res.json({
        success: true,
        data: transactions,
        metadata: {
          count: transactions.length,
          type,
          limit
        }
      });
    } catch (error) {
      logger.error('Get recent by type failed', { userId, type, error: error.message });
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

      // Soft delete the upcoming transaction
      const deleteQuery = `
        UPDATE transactions 
        SET deleted_at = NOW(), updated_at = NOW() 
        WHERE id = $1 AND user_id = $2 AND status = 'upcoming'
        RETURNING id
      `;
      const deleteResult = await db.query(deleteQuery, [id, userId]);

      if (deleteResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Failed to delete upcoming transaction'
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

      // Delete all future upcoming transactions for this template
      const deleteUpcomingQuery = `
        UPDATE transactions 
        SET deleted_at = NOW(), updated_at = NOW() 
        WHERE template_id = $1 AND user_id = $2 AND status = 'upcoming' AND date > CURRENT_DATE
        RETURNING id
      `;
      const deletedResult = await db.query(deleteUpcomingQuery, [id, userId]);

      logger.info('Template generation stopped', { 
        userId, 
        templateId: id, 
        templateName: template.name,
        deletedUpcomingCount: deletedResult.rows.length 
      });

      res.json({
        success: true,
        data: updateResult.rows[0],
        deletedUpcomingCount: deletedResult.rows.length,
        message: `Template generation stopped. ${deletedResult.rows.length} upcoming transactions removed.`
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

      // Remove existing upcoming transactions for this template
      const deleteExistingQuery = `
        UPDATE transactions 
        SET deleted_at = NOW(), updated_at = NOW() 
        WHERE template_id = $1 AND user_id = $2 AND status = 'upcoming'
        RETURNING id
      `;
      const deletedResult = await db.query(deleteExistingQuery, [id, userId]);

      // Generate new 3-month upcoming transactions
      const upcomingTransactions = await generateUpcomingTransactions(template);

      logger.info('Template upcoming transactions regenerated', { 
        userId, 
        templateId: id, 
        templateName: template.name,
        deletedCount: deletedResult.rows.length,
        generatedCount: upcomingTransactions.length
      });

      res.json({
        success: true,
        data: {
          template: {
            id: template.id,
            name: template.name
          },
          deletedCount: deletedResult.rows.length,
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
      // Check if transaction already exists for this date and template
      const existsQuery = `
        SELECT id FROM transactions 
        WHERE template_id = $1 AND date = $2 AND deleted_at IS NULL
      `;
      const existsResult = await db.query(existsQuery, [template.id, dueDate.toISOString().split('T')[0]]);
      
      if (existsResult.rows.length === 0) {
        // Create new transaction
        const transactionData = {
          user_id: template.user_id,
          category_id: template.category_id,
          amount: template.amount,
          type: template.type,
          description: template.description,
          notes: template.notes || `Generated from recurring template: ${template.name || 'Unnamed'}`,
          date: dueDate.toISOString().split('T')[0],
          template_id: template.id
        };

        const insertQuery = `
          INSERT INTO transactions (
            user_id, category_id, amount, type, description, notes, date, template_id, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
          RETURNING id, user_id, category_id, amount, type, description, notes, date, template_id, created_at
        `;

        const values = [
          transactionData.user_id,
          transactionData.category_id,
          transactionData.amount,
          transactionData.type,
          transactionData.description,
          transactionData.notes,
          transactionData.date,
          transactionData.template_id
        ];

        const result = await db.query(insertQuery, values);
        generated.push(result.rows[0]);
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
      // Check if transaction already exists for this date and template
      const existsQuery = `
        SELECT id FROM transactions 
        WHERE template_id = $1 AND date = $2 AND deleted_at IS NULL
      `;
      const existsResult = await db.query(existsQuery, [template.id, dueDate.toISOString().split('T')[0]]);
      
      if (existsResult.rows.length === 0) {
        // Create new current transaction (normal status)
        const transactionData = {
          user_id: template.user_id,
          category_id: template.category_id,
          amount: template.amount,
          type: template.type,
          description: template.description || template.name,
          notes: `Generated from recurring template: ${template.name}`,
          date: dueDate.toISOString().split('T')[0],
          template_id: template.id
          // No status field = normal confirmed transaction
        };

        const insertQuery = `
          INSERT INTO transactions (
            user_id, category_id, amount, type, description, notes, date, template_id, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
          RETURNING id, user_id, category_id, amount, type, description, notes, date, template_id, created_at
        `;

        const values = [
          transactionData.user_id,
          transactionData.category_id,
          transactionData.amount,
          transactionData.type,
          transactionData.description,
          transactionData.notes,
          transactionData.date,
          transactionData.template_id
        ];

        const result = await db.query(insertQuery, values);
        currentTransactions.push(result.rows[0]);
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
      // Check if upcoming transaction already exists for this date and template
      const existsQuery = `
        SELECT id FROM transactions 
        WHERE template_id = $1 AND date = $2 AND status = 'upcoming' AND deleted_at IS NULL
      `;
      const existsResult = await db.query(existsQuery, [template.id, dueDate.toISOString().split('T')[0]]);
      
      if (existsResult.rows.length === 0) {
        // Create new upcoming transaction
        const transactionData = {
          user_id: template.user_id,
          category_id: template.category_id,
          amount: template.amount,
          type: template.type,
          description: template.description || template.name,
          notes: `Upcoming: ${template.name || 'Recurring Transaction'}`,
          date: dueDate.toISOString().split('T')[0],
          template_id: template.id,
          status: 'upcoming' // ✅ Mark as upcoming
        };

        const insertQuery = `
          INSERT INTO transactions (
            user_id, category_id, amount, type, description, notes, date, template_id, status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
          RETURNING id, user_id, category_id, amount, type, description, notes, date, template_id, status, created_at
        `;

        const values = [
          transactionData.user_id,
          transactionData.category_id,
          transactionData.amount,
          transactionData.type,
          transactionData.description,
          transactionData.notes,
          transactionData.date,
          transactionData.template_id,
          transactionData.status
        ];

        const result = await db.query(insertQuery, values);
        upcomingTransactions.push(result.rows[0]);
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