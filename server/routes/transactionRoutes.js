const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const transactionController = require('../controllers/transactionController');
const { createTransactionLimiter, getSummaryLimiter, getTransactionsLimiter } = require('../middleware/rateLimiter');
const { addTimezone, calculatePeriods, balanceRateLimit } = require('../middleware/timeManager');
const Transaction = require('../models/Transaction');

// Apply timezone middleware to all routes
router.use(addTimezone);

// Balance details route (with rate limiting and time calculations)
router.get('/balance/details', 
  auth,
  balanceRateLimit,
  calculatePeriods,
  transactionController.getBalanceDetails
);

// Get all transactions with rate limiting
router.get('/', 
  auth, 
  getTransactionsLimiter,
  transactionController.getAll
);

router.get('/recent', 
  auth, 
  getTransactionsLimiter,
  async (req, res) => {
    try {
      const { limit = 5 } = req.query;
      const transactions = await Transaction.getRecentTransactions(req.user.id, limit);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch recent transactions' });
    }
  }
);

// Get transactions by period with rate limiting
router.get('/period/:period', 
  auth, 
  getTransactionsLimiter,
  async (req, res) => {
    try {
      const { period } = req.params;
      const { date } = req.query;
      const transactions = await Transaction.getByPeriod(
        req.user.id, 
        period,
        date ? new Date(date) : new Date()
      );
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  }
);
router.put('/transactions/:type/:id', 
  auth,
  async (req, res) => {
    try {
      const { type, id } = req.params;
      const userId = req.user.id;
      const data = {
        ...req.body,
        date: req.body.date || undefined
      };
      const updated = await Transaction.update(type, id, userId, data);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Transaction mutations with rate limiting
router.post('/:type', 
  auth, 
  createTransactionLimiter,
  transactionController.create
);

router.put('/:type/:id', 
  auth,
  createTransactionLimiter, 
  transactionController.update
);

router.delete('/:type/:id', 
  auth,
  createTransactionLimiter,
  transactionController.delete
);

// Summary route with rate limiting
router.get('/summary', 
  auth, 
  getSummaryLimiter,
  transactionController.getSummary
);

// Balance history with rate limiting
router.get('/balance/history/:period?', 
  auth,
  getTransactionsLimiter,
  async (req, res) => {
    try {
      const { period = 'month' } = req.params;
      const { limit = 12 } = req.query;
      const history = await Transaction.getBalanceHistory(req.user.id, period, limit);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch balance history' });
    }
  }
);


module.exports = router;