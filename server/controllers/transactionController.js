/**
 * Transaction Controller
 * Handles all transaction-related operations with enhanced recurring support
 */

const Transaction = require('../models/Transaction');

const transactionController = {
  /**
   * Get all transactions with filtering support
   * @route GET /api/transactions
   */
  getAll: async (req, res) => {
    try {
      const userId = req.user.id;
      const { type, startDate, endDate, category } = req.query;

      // Validate transaction type if provided
      if (type && !['expense', 'income'].includes(type)) {
        return res.status(400).json({
          error: 'invalid_type',
          message: 'Invalid transaction type. Must be expense or income'
        });
      }

      // Validate dates if provided
      if (startDate && isNaN(new Date(startDate).getTime())) {
        return res.status(400).json({
          error: 'invalid_start_date',
          message: 'Invalid start date format'
        });
      }
      if (endDate && isNaN(new Date(endDate).getTime())) {
        return res.status(400).json({
          error: 'invalid_end_date',
          message: 'Invalid end date format'
        });
      }

      const transactions = await Transaction.getAll(type, userId, { 
        startDate, 
        endDate, 
        category 
      });
      res.status(200).json(transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({
        error: 'fetch_failed',
        message: 'Unable to fetch transactions. Please try again later'
      });
    }
  },

  /**
   * Get recent transactions
   * @route GET /api/transactions/recent
   */
  getRecentTransactions: async (req, res) => {
    try {
      const userId = req.user.id;
      const { limit = 5, date } = req.query;

      if (isNaN(limit) || limit < 1) {
        return res.status(400).json({
          error: 'invalid_limit',
          message: 'Limit must be a positive number'
        });
      }

      let upToDate = null;
      if (date) {
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
          return res.status(400).json({
            error: 'invalid_date',
            message: 'Invalid date format'
          });
        }
        // Optionally normalize to midday
        parsedDate.setHours(12, 0, 0, 0);
        upToDate = parsedDate;
      }

      // Now actually pass upToDate to the model
      const transactions = await Transaction.getRecentTransactions(
        userId,
        parseInt(limit),
        upToDate // <--- we pass the date here
      );

      return res.json(transactions);
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      return res.status(500).json({
        error: 'fetch_failed',
        message: 'Failed to fetch recent transactions'
      });
    }
  },

  /**
   * Get transactions by period
   * @route GET /api/transactions/period/:period
   */
  getByPeriod: async (req, res) => {
    try {
      const userId = req.user.id;
      const { period } = req.params;
      const date = req.query.date ? new Date(req.query.date) : new Date();

      if (!['day', 'week', 'month', 'year'].includes(period)) {
        return res.status(400).json({
          error: 'invalid_period',
          message: 'Invalid period. Must be day, week, month, or year'
        });
      }

      if (isNaN(date.getTime())) {
        return res.status(400).json({
          error: 'invalid_date',
          message: 'Invalid date format'
        });
      }

      date.setHours(0, 0, 0, 0);
      const transactions = await Transaction.getByPeriod(userId, period, date);
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching period transactions:', error);
      res.status(500).json({
        error: 'fetch_failed',
        message: 'Failed to fetch period transactions'
      });
    }
  },

  /**
   * Get all recurring transactions
   * @route GET /api/transactions/recurring
   */
  getRecurring: async (req, res) => {
    try {
      const userId = req.user.id;
      const { type } = req.query;
      
      if (type && !['expense', 'income'].includes(type)) {
        return res.status(400).json({
          error: 'invalid_type',
          message: 'Invalid transaction type. Must be expense or income'
        });
      }

      const transactions = await Transaction.getRecurring(userId, type);
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching recurring transactions:', error);
      res.status(500).json({
        error: 'fetch_failed',
        message: 'Failed to fetch recurring transactions'
      });
    }
  },

  /**
   * Get balance summary
   * @route GET /api/transactions/summary
   */
  getSummary: async (req, res) => {
    try {
      const userId = req.user.id;
      const summary = await Transaction.getSummary(userId);
      res.status(200).json(summary);
    } catch (error) {
      console.error('Error fetching summary:', error);
      res.status(500).json({
        error: 'summary_failed',
        message: 'Unable to fetch balance summary'
      });
    }
  },
  
  /**
   * Get detailed balance calculations
   * @route GET /api/transactions/balance/details
   */
  getBalanceDetails: async (req, res) => {
    try {
      const userId = req.user.id;
      const targetDate = req.query.date ? new Date(req.query.date) : new Date();
      
      if (isNaN(targetDate.getTime())) {
        return res.status(400).json({
          error: 'invalid_date',
          message: 'Invalid date format provided'
        });
      }
      
      // Reset time to start of day for consistent calculations
      targetDate.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      let weekStart = new Date(startOfMonth);
      const currentDay = targetDate.getDate();
      const weekNumber = Math.floor((currentDay - 1) / 7);
      weekStart.setDate(weekNumber * 7 + 1);
      
      try {
        const balanceDetails = await Transaction.getDetailedBalance(userId, targetDate, {
          weekStart,
          monthStart: startOfMonth
        });
        
        res.status(200).json(balanceDetails);
      } catch (detailError) {
        console.error('Error calculating detailed balance:', detailError);
        
        // Return default empty data instead of 500 error
        res.status(200).json({
          daily: { income: 0, expenses: 0, balance: 0 },
          weekly: { income: 0, expenses: 0, balance: 0 },
          monthly: { income: 0, expenses: 0, balance: 0 },
          yearly: { income: 0, expenses: 0, balance: 0 },
          metadata: {
            calculatedAt: new Date().toISOString(),
            nextReset: null,
            timePeriods: {
              daily: { start: targetDate, end: targetDate },
              weekly: { start: weekStart, end: targetDate },
              monthly: { start: startOfMonth, end: targetDate },
              yearly: { start: new Date(targetDate.getFullYear(), 0, 1), end: targetDate }
            }
          }
        });
      }
    } catch (error) {
      console.error('Error in getBalanceDetails:', error);
      res.status(500).json({
        error: 'balance_failed',
        message: 'Unable to calculate balance details'
      });
    }
  },

  /**
   * Get balance history for period
   * @route GET /api/transactions/balance/history/:period?
   */
  getBalanceHistory: async (req, res) => {
    try {
      const userId = req.user.id;
      const { period = 'month' } = req.params;
      const { limit = 12 } = req.query;

      if (!['day', 'week', 'month', 'year'].includes(period)) {
        return res.status(400).json({
          error: 'invalid_period',
          message: 'Invalid period. Must be day, week, month, or year'
        });
      }

      if (isNaN(limit) || limit < 1) {
        return res.status(400).json({
          error: 'invalid_limit',
          message: 'Limit must be a positive number'
        });
      }

      const history = await Transaction.getBalanceHistory(userId, period, parseInt(limit));
      res.json(history);
    } catch (error) {
      console.error('Error fetching balance history:', error);
      res.status(500).json({
        error: 'history_failed',
        message: 'Failed to fetch balance history'
      });
    }
  },

  /**
   * Create new transaction with recurring support
   * @route POST /api/transactions/:type
   */
  create: async (req, res) => {
    try {
      const { type } = req.params;
      if (!['expense', 'income'].includes(type)) {
        return res.status(400).json({
          error: 'invalid_type',
          message: 'Invalid transaction type. Must be expense or income'
        });
      }

      if (!req.body.amount || isNaN(req.body.amount)) {
        return res.status(400).json({
          error: 'invalid_amount',
          message: 'Amount is required and must be a number'
        });
      }

      // Validate recurring transaction data
      if (req.body.is_recurring) {
        if (!req.body.recurring_interval) {
          return res.status(400).json({
            error: 'missing_interval',
            message: 'Recurring interval is required for recurring transactions'
          });
        }

        if (!['daily', 'weekly', 'monthly'].includes(req.body.recurring_interval)) {
          return res.status(400).json({
            error: 'invalid_interval',
            message: 'Invalid recurring interval. Must be daily, weekly, or monthly'
          });
        }
      }

      // Format and validate date
      const date = req.body.date ? new Date(req.body.date) : new Date();
      if (isNaN(date.getTime())) {
        return res.status(400).json({
          error: 'invalid_date',
          message: 'Invalid date format'
        });
      }

      const transaction = await Transaction.create(type, {
        ...req.body,
        user_id: req.user.id,
        date: date.toISOString().split('T')[0]
      });

      res.status(201).json(transaction);
    } catch (error) {
      console.error('Error creating transaction:', error);
      res.status(500).json({
        error: 'creation_failed',
        message: 'Failed to create transaction'
      });
    }
  },

  /**
   * Update transaction with recurring support
   * @route PUT /api/transactions/:type/:id
   */
  update: async (req, res) => {
    try {
      const { type, id } = req.params;
      const { updateFuture } = req.body;

      if (!['expense', 'income'].includes(type)) {
        return res.status(400).json({
          error: 'invalid_type',
          message: 'Invalid transaction type. Must be expense or income'
        });
      }

      if (req.body.amount && isNaN(req.body.amount)) {
        return res.status(400).json({
          error: 'invalid_amount',
          message: 'Amount must be a number'
        });
      }

      // Validate recurring updates
      if (req.body.is_recurring) {
        if (!req.body.recurring_interval) {
          return res.status(400).json({
            error: 'missing_interval',
            message: 'Recurring interval is required for recurring transactions'
          });
        }

        if (!['daily', 'weekly', 'monthly'].includes(req.body.recurring_interval)) {
          return res.status(400).json({
            error: 'invalid_interval',
            message: 'Invalid recurring interval. Must be daily, weekly, or monthly'
          });
        }
      }

      // Format and validate date if provided
      if (req.body.date) {
        const date = new Date(req.body.date);
        if (isNaN(date.getTime())) {
          return res.status(400).json({
            error: 'invalid_date',
            message: 'Invalid date format'
          });
        }
        req.body.date = date.toISOString().split('T')[0];
      }

      const transaction = await Transaction.update(type, id, req.user.id, {
        ...req.body,
        updateFuture
      });

      if (!transaction) {
        return res.status(404).json({
          error: 'not_found',
          message: 'Transaction not found'
        });
      }

      res.status(200).json(transaction);
    } catch (error) {
      console.error('Error updating transaction:', error);
      res.status(500).json({
        error: 'update_failed',
        message: 'Failed to update transaction'
      });
    }
  },

  /**
   * Delete transaction with recurring options
   * @route DELETE /api/transactions/:type/:id
   */
  delete: async (req, res) => {
    try {
      const { type, id } = req.params;
      const { deleteFuture = false } = req.query;

      if (!['expense', 'income'].includes(type)) {
        return res.status(400).json({
          error: 'invalid_type',
          message: 'Invalid transaction type. Must be expense or income'
        });
      }

      const success = await Transaction.delete(type, id, req.user.id, deleteFuture);
      
      if (!success) {
        return res.status(404).json({
          error: 'not_found',
          message: 'Transaction not found'
        });
      }

      res.status(200).json({ 
        message: deleteFuture ? 
          'Transaction and future occurrences deleted successfully' : 
          'Transaction deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      res.status(500).json({
        error: 'deletion_failed',
        message: 'Failed to delete transaction'
      });
    }
  },

  /**
   * Skip specific occurrence of recurring transaction
   * @route POST /api/transactions/:type/:id/skip
   */
  skipOccurrence: async (req, res) => {
    try {
      const { type, id } = req.params;
      const { skipDate } = req.body;

      if (!skipDate) {
        return res.status(400).json({
          error: 'missing_date',
          message: 'Skip date is required'
        });
      }

      const date = new Date(skipDate);
      if (isNaN(date.getTime())) {
        return res.status(400).json({
          error: 'invalid_date',
          message: 'Invalid skip date format'
        });
      }

      const success = await Transaction.skipOccurrence(
        type,
        id,
        req.user.id,
        date.toISOString().split('T')[0]
      );

      if (!success) {
        return res.status(404).json({
          error: 'not_found',
          message: 'Recurring transaction not found'
        });
      }

      res.json({ message: 'Transaction occurrence skipped successfully' });
    } catch (error) {
      console.error('Error skipping transaction:', error);
      res.status(500).json({
        error: 'skip_failed',
        message: 'Failed to skip transaction occurrence'
      });
    }
  }
};

module.exports = transactionController;