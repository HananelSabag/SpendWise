// routes/transactionRoutes.js - COMPLETE VERSION WITH ALL ENDPOINTS
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const transactionController = require('../controllers/transactionController');
const {
  createTransactionLimiter,
  getSummaryLimiter,
  getTransactionsLimiter
} = require('../middleware/rateLimiter');

// Apply auth to all routes
router.use(auth);

/**
 * Dashboard & Summary Routes
 */
// Get complete dashboard data (NEW - replaces 3 calls)
router.get('/dashboard',
  getSummaryLimiter,
  transactionController.getDashboardData
);

// Get statistics
router.get('/stats',
  getSummaryLimiter,
  transactionController.getStats
);

// Get category breakdown
router.get('/categories/breakdown',
  getTransactionsLimiter,
  transactionController.getCategoryBreakdown
);

/**
 * Legacy Support Routes (for current client)
 */
// Get recent transactions
router.get('/recent',
  getTransactionsLimiter,
  transactionController.getRecent
);

// Get transactions by period
router.get('/period/:period',
  getTransactionsLimiter,
  transactionController.getByPeriod
);

// Get recurring transactions
router.get('/recurring',
  getTransactionsLimiter,
  transactionController.getRecurring
);

// Get balance details
router.get('/balance/details',
  getSummaryLimiter,
  transactionController.getBalanceDetails
);

// Get summary
router.get('/summary',
  getSummaryLimiter,
  transactionController.getSummary
);

// Get balance history
router.get('/balance/history/:period',
  getSummaryLimiter,
  transactionController.getBalanceHistory
);

/**
 * Transaction CRUD Routes
 */
// Get transactions with filters
router.get('/',
  getTransactionsLimiter,
  transactionController.getTransactions
);

// Search transactions
router.get('/search',
  getTransactionsLimiter,
  transactionController.search
);

// Create transaction
router.post('/:type',
  createTransactionLimiter,
  validate.transaction,
  validate.recurring,
  transactionController.create
);

// Update transaction
router.put('/:type/:id',
  createTransactionLimiter,
  validate.transaction,
  transactionController.update
);

// Delete transaction
router.delete('/:type/:id',
  createTransactionLimiter,
  transactionController.delete
);

// Skip single transaction occurrence (LEGACY)
router.post('/:type/:id/skip',
  createTransactionLimiter,
  transactionController.skipTransactionOccurrence
);

/**
 * Recurring Template Routes
 */
// Get all templates
router.get('/templates',
  getTransactionsLimiter,
  transactionController.getTemplates
);

// Update template
router.put('/templates/:id',
  createTransactionLimiter,
  validate.transaction,
  validate.recurring,
  transactionController.updateTemplate
);

// Delete template
router.delete('/templates/:id',
  createTransactionLimiter,
  transactionController.deleteTemplate
);

// Skip dates for template
router.post('/templates/:id/skip',
  createTransactionLimiter,
  transactionController.skipDates
);

module.exports = router;