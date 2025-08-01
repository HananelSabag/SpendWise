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

module.exports = transactionController;