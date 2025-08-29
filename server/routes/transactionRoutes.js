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

// Get balance panel data - DEDICATED BALANCE ENDPOINT
router.get('/balance',
  getSummaryLimiter,
  transactionController.getBalanceData
);

// Get recent transactions
router.get('/recent',
  getTransactionsLimiter,
  transactionController.getRecentTransactions
);

// Get user statistics
router.get('/stats',
  getSummaryLimiter,
  transactionController.getAnalyticsSummary
);

// Get category breakdown for date range
router.get('/categories/breakdown',
  getTransactionsLimiter,
  transactionController.getUserAnalytics
);

// Get summary data
router.get('/summary',
  getSummaryLimiter,
  transactionController.getMonthlySummary
);

/**
 * Balance & History Routes
 * Financial balance and historical data
 */

// Get balance details for specific date
router.get('/balance/details',
  getSummaryLimiter,
  transactionController.getBalanceData
);

// Get balance history by period
router.get('/balance/history/:period',
  getSummaryLimiter,
  transactionController.getBalanceData
);

// Debug endpoint removed for production security

/**
 * Transaction Query Routes
 * Data retrieval with filtering and search
 */

// Get transactions with comprehensive filters
router.get('/',
  getTransactionsLimiter,
  transactionController.getTransactions
);

// Search transactions by text
router.get('/search',
  getTransactionsLimiter,
  transactionController.getTransactions
);

// Get transactions by time period
router.get('/period/:period',
  getTransactionsLimiter,
  transactionController.getRecentTransactions
);

/**
 * Recurring Transaction Routes
 * Recurring templates and generated transactions
 */

// Get recurring transactions with next occurrence info
router.get('/recurring',
  getTransactionsLimiter,
  transactionController.generateRecurring
);

// Get all recurring templates (list)
router.get('/templates',
  getTransactionsLimiter,
  transactionController.getRecurringTemplates
);

// Create recurring template - CRITICAL FOR ONBOARDING
router.post('/templates',
  createTransactionLimiter,
  transactionController.createRecurringTemplate
);

// ✅ BULK CREATE TEMPLATES - FOR ONBOARDING
router.post('/templates/bulk',
  createTransactionLimiter,
  transactionController.createBulkRecurringTemplates
);

// Update recurring template
router.put('/templates/:id',
  createTransactionLimiter,
  transactionController.update
);

// Delete/deactivate recurring template
router.delete('/templates/:id',
  createTransactionLimiter,
  transactionController.delete
);

// Skip dates for recurring template
router.post('/templates/:id/skip',
  createTransactionLimiter,
  transactionController.generateRecurring
);

// Manual trigger for recurring transaction generation
router.post('/generate-recurring',
  generateRecurringLimiter,
  transactionController.generateRecurring
);

// ✅ UPCOMING TRANSACTIONS MANAGEMENT
// Get upcoming transactions for user
router.get('/upcoming',
  getTransactionsLimiter,
  transactionController.getUpcomingTransactions
);

// Delete specific upcoming transaction
router.delete('/upcoming/:id',
  createTransactionLimiter,
  transactionController.deleteUpcomingTransaction
);

// Stop generating upcoming transactions for a template
router.post('/templates/:id/stop',
  createTransactionLimiter,
  transactionController.stopTemplateGeneration
);

// Regenerate upcoming transactions for a template
router.post('/templates/:id/regenerate',
  createTransactionLimiter,
  transactionController.regenerateTemplateUpcoming
);

/**
 * Transaction CRUD Routes
 * Create, update, delete individual transactions
 */

// Create new transaction (one-time or recurring)
router.post('/:type',
  createTransactionLimiter,
  transactionController.create
);

// Update existing transaction
router.put('/:type/:id',
  createTransactionLimiter,
  transactionController.update
);

// Bulk delete transactions (no rate limit - destructive operations are naturally limited)
// ✅ MOVED BEFORE /:type/:id to avoid route conflicts
router.post('/bulk-delete',
  transactionController.bulkDelete
);

// Delete transaction (soft delete)
router.delete('/:type/:id',
  createTransactionLimiter,
  transactionController.delete
);

// Advanced delete for recurring transactions
router.delete('/recurring/:id',
  createTransactionLimiter,
  transactionController.deleteRecurring
);

/**
 * Legacy Support Routes
 * Maintain compatibility with existing client implementations
 */

// Skip single transaction occurrence (legacy endpoint)
router.post('/:type/:id/skip',
  createTransactionLimiter,
  transactionController.update
);

/**
 * Direct Transaction Creation Routes
 * Simplified endpoints for specific transaction types
 */

// ✅ REMOVED: Redundant routes - use /:type instead
// These endpoints are redundant with /:type route
// router.post('/expense', ...) 
// router.post('/income', ...)

module.exports = router;