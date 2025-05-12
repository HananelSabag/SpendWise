/**
 * transactionRoutes.js
 * Enhanced routing with better middleware handling and validation
 */

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const transactionController = require('../controllers/transactionController');
const { 
  createTransactionLimiter, 
  getSummaryLimiter, 
  getTransactionsLimiter 
} = require('../middleware/rateLimiter');
const { 
  addTimezone, 
  calculatePeriods, 
  balanceRateLimit 
} = require('../middleware/timeManager');

// Apply timezone middleware globally
router.use(addTimezone);

/**
 * Balance & Summary Routes
 */
router.get('/balance/details', 
  auth,
  balanceRateLimit,
  calculatePeriods,
  transactionController.getBalanceDetails
);

router.get('/summary', 
  auth, 
  getSummaryLimiter,
  transactionController.getSummary
);

router.get('/balance/history/:period?', 
  auth,
  getTransactionsLimiter,
  transactionController.getBalanceHistory
);

/**
 * Transaction List Routes
 */
router.get('/', 
  auth, 
  getTransactionsLimiter,
  transactionController.getAll
);

router.get('/recent', 
  auth, 
  getTransactionsLimiter,
  transactionController.getRecentTransactions
);

router.get('/period/:period', 
  auth, 
  getTransactionsLimiter,
  transactionController.getByPeriod
);

/**
 * Recurring Transaction Routes
 */
router.get('/recurring',
  auth,
  getTransactionsLimiter,
  transactionController.getRecurring
);

router.post('/:type/:id/skip',
  auth,
  createTransactionLimiter,
  validateTransactionType,
  transactionController.skipOccurrence
);

/**
 * Core Transaction Operations
 */
router.post('/:type',
  auth,
  createTransactionLimiter,
  validateTransactionType,
  transactionController.create
);

router.put('/:type/:id',
  auth,
  createTransactionLimiter,
  validateTransactionType,
  transactionController.update
);

router.delete('/:type/:id',
  auth,
  createTransactionLimiter,
  validateTransactionType,
  transactionController.delete
);

// Type validation middleware
function validateTransactionType(req, res, next) {
  const { type } = req.params;
  if (!['expense', 'income'].includes(type)) {
    return res.status(400).json({
      error: 'invalid_type',
      message: 'Invalid transaction type. Must be expense or income'
    });
  }
  next();
}

module.exports = router;