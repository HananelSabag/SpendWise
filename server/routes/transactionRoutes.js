/**
 * Transaction Routes - Production Ready
 * Complete transaction management endpoints with rate limiting and validation
 * @module routes/transactionRoutes
 */

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const transactionController = require('../controllers/transactionController');
const {
  createTransactionLimiter,
  getSummaryLimiter,
  getTransactionsLimiter,
  generateRecurringLimiter
} = require('../middleware/rateLimiter');

// Apply authentication to all routes
router.use(auth);

/**
 * Dashboard & Summary Routes
 * High-level data aggregation endpoints
 */

// Get complete dashboard data (optimized single request)
router.get('/dashboard',
  getSummaryLimiter,
  transactionController.getDashboardData
);

// Get user statistics
router.get('/stats',
  getSummaryLimiter,
  transactionController.getStats
);

// Get category breakdown for date range
router.get('/categories/breakdown',
  getTransactionsLimiter,
  validate.dateRange,
  transactionController.getCategoryBreakdown
);

// Get summary data
router.get('/summary',
  getSummaryLimiter,
  transactionController.getSummary
);

/**
 * Balance & History Routes
 * Financial balance and historical data
 */

// Get balance details for specific date
router.get('/balance/details',
  getSummaryLimiter,
  transactionController.getBalanceDetails
);

// Get balance history by period
router.get('/balance/history/:period',
  getSummaryLimiter,
  validate.periodParam,
  transactionController.getBalanceHistory
);

/**
 * 🔍 DEBUGGING ENDPOINTS (REMOVE IN PRODUCTION)
 */

// Debug endpoint to test template delete route
router.get('/debug/templates/:id',
  (req, res) => {
    const logger = require('../utils/logger');
    logger.info('🔍 DEBUG TEMPLATE ENDPOINT HIT', {
      templateId: req.params.id,
      userId: req.user?.id,
      method: req.method,
      url: req.originalUrl,
      query: req.query,
      headers: req.headers,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Debug endpoint working',
      data: {
        templateId: req.params.id,
        userId: req.user?.id,
        timestamp: new Date().toISOString(),
        receivedQuery: req.query,
        receivedHeaders: req.headers
      }
    });
  }
);

/**
 * Transaction Query Routes
 * Data retrieval with filtering and search
 */

// Get transactions with comprehensive filters
router.get('/',
  getTransactionsLimiter,
  validate.transactionFilters,
  transactionController.getTransactions
);

// Search transactions by text
router.get('/search',
  getTransactionsLimiter,
  validate.searchQuery,
  transactionController.search
);

// Get recent transactions
router.get('/recent',
  getTransactionsLimiter,
  transactionController.getRecent
);

// Get transactions by time period
router.get('/period/:period',
  getTransactionsLimiter,
  validate.periodParam,
  transactionController.getByPeriod
);

/**
 * Recurring Transaction Routes
 * Recurring templates and generated transactions
 */

// Get recurring transactions with next occurrence info
router.get('/recurring',
  getTransactionsLimiter,
  transactionController.getRecurring
);

// Get all recurring templates
router.get('/templates',
  getTransactionsLimiter,
  transactionController.getTemplates
);

// Update recurring template
router.put('/templates/:id',
  createTransactionLimiter,
  validate.templateId,
  validate.transaction,
  validate.recurring,
  transactionController.updateTemplate
);

// Delete/deactivate recurring template
router.delete('/templates/:id',
  createTransactionLimiter,
  validate.templateId,
  // 🔍 DEBUGGING: Add route-level logging
  (req, res, next) => {
    const logger = require('../utils/logger');
    logger.info('🛣️ DELETE TEMPLATE ROUTE HIT', {
      templateId: req.params.id,
      userId: req.user?.id,
      query: req.query,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      origin: req.headers.origin,
      timestamp: new Date().toISOString()
    });
    next();
  },
  transactionController.deleteTemplate
);

// Skip dates for recurring template
router.post('/templates/:id/skip',
  createTransactionLimiter,
  validate.templateId,
  validate.skipDates,
  transactionController.skipDates
);

// Manual trigger for recurring transaction generation
router.post('/generate-recurring',
  generateRecurringLimiter,
  transactionController.generateRecurring
);

/**
 * Transaction CRUD Routes
 * Create, update, delete individual transactions
 */

// Create new transaction (one-time or recurring)
router.post('/:type',
  createTransactionLimiter,
  validate.transactionType,
  validate.transaction,
  validate.recurring,
  transactionController.create
);

// Update existing transaction
router.put('/:type/:id',
  createTransactionLimiter,
  validate.transactionType,
  validate.transactionId,
  validate.transaction,
  transactionController.update
);

// Delete transaction (soft delete)
router.delete('/:type/:id',
  createTransactionLimiter,
  validate.transactionType,
  validate.transactionId,
  transactionController.delete
);

/**
 * Legacy Support Routes
 * Maintain compatibility with existing client implementations
 */

// Skip single transaction occurrence (legacy endpoint)
router.post('/:type/:id/skip',
  createTransactionLimiter,
  validate.transactionType,
  validate.transactionId,
  validate.skipDate,
  transactionController.skipTransactionOccurrence
);

/**
 * Direct Transaction Creation Routes
 * Simplified endpoints for specific transaction types
 */

// Add expense directly
router.post('/expense',
  createTransactionLimiter,
  validate.transaction,
  transactionController.addExpense
);

// Add income directly
router.post('/income',
  createTransactionLimiter,
  validate.transaction,
  transactionController.addIncome
);

module.exports = router;