const Transaction = require('../models/Transaction');

const transactionController = {
  // Get all transactions
  getAll: async (req, res) => {
    try {
      const userId = req.user.id;
      const { type, startDate, endDate, category } = req.query;
      const transactions = await Transaction.getAll(type, userId, { startDate, endDate, category });
      res.status(200).json(transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ error: 'Error fetching transactions' });
    }
  },

  // Get balance summary
  getSummary: async (req, res) => {
    try {
      const userId = req.user.id;
      const summary = await Transaction.getSummary(userId);
      res.status(200).json(summary);
    } catch (error) {
      console.error('Error fetching summary:', error);
      res.status(500).json({ error: 'Error fetching summary' });
    }
  },

  // Get detailed balance calculations
  getBalanceDetails: async (req, res) => {
    try {
      const userId = req.user.id;
      const targetDate = req.query.date ? new Date(req.query.date) : new Date();
      
      // Reset time to start of day to ensure consistent calculations
      targetDate.setHours(0, 0, 0, 0);

      // Get the first day of the month
      const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      
      // Calculate week start (always from start of month)
      let weekStart = new Date(startOfMonth);
      const currentDay = targetDate.getDate();
      const weekNumber = Math.floor((currentDay - 1) / 7);
      weekStart.setDate(weekNumber * 7 + 1);
      
      const balanceDetails = await Transaction.getDetailedBalance(userId, targetDate, {
        weekStart,
        monthStart: startOfMonth
      });
      
      res.status(200).json(balanceDetails);
    } catch (error) {
      console.error('Error in getBalanceDetails:', error);
      res.status(500).json({ 
        error: 'Error calculating balance details',
        details: error.message
      });
    }
  },

  // Create new transaction
  create: async (req, res) => {
    try {
      const { type } = req.params;
      if (!['expense', 'income'].includes(type)) {
        return res.status(400).json({ error: 'Invalid transaction type' });
      }

      // Ensure date is properly formatted
      if (req.body.date) {
        req.body.date = new Date(req.body.date).toISOString().split('T')[0];
      }

      const transaction = await Transaction.create(type, {
        ...req.body,
        user_id: req.user.id
      });

      res.status(201).json(transaction);
    } catch (error) {
      console.error('Error creating transaction:', error);
      res.status(500).json({ error: 'Error creating transaction' });
    }
  },

  // Update transaction
  update: async (req, res) => {
    try {
      const { type, id } = req.params;
      if (!['expense', 'income'].includes(type)) {
        return res.status(400).json({ error: 'Invalid transaction type' });
      }

      // Ensure date is properly formatted
      if (req.body.date) {
        req.body.date = new Date(req.body.date).toISOString().split('T')[0];
      }

      const transaction = await Transaction.update(type, id, req.user.id, req.body);
      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      res.status(200).json(transaction);
    } catch (error) {
      console.error('Error updating transaction:', error);
      res.status(500).json({ error: 'Error updating transaction' });
    }
  },

  // Delete transaction
  delete: async (req, res) => {
    try {
      const { type, id } = req.params;
      if (!['expense', 'income'].includes(type)) {
        return res.status(400).json({ error: 'Invalid transaction type' });
      }

      const success = await Transaction.delete(type, id, req.user.id);
      if (!success) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      res.status(200).json({ message: 'Transaction deleted successfully' });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      res.status(500).json({ error: 'Error deleting transaction' });
    }
  },

  // Get transactions by period
  getByPeriod: async (req, res) => {
    try {
      const { period } = req.params;
      const date = req.query.date ? new Date(req.query.date) : new Date();
      
      if (isNaN(date.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }

      // Reset time to start of day
      date.setHours(0, 0, 0, 0);
      
      const transactions = await Transaction.getByPeriod(req.user.id, period, date);
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching period transactions:', error);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  }
};

module.exports = transactionController;