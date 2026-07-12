/**
 * Transaction Routes - Production Ready
 * Complete transaction management endpoints with rate limiting and validation
 * @module routes/transactionRoutes
 */

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const transactionController = require('../controllers/transactionController');
const {
  transactionLogger,
  routeLogger,
  bulkOperationLogger,
  analyticsLogger
} = require('../middleware/routeLogger');
const {
  createTransactionLimiter,
  getSummaryLimiter,
  getTransactionsLimiter
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
  routeLogger('TRANSACTION_DASHBOARD'),
  analyticsLogger('dashboard'),
  transactionController.getDashboardData
);

router.get('/calendar-month-summary',
  getSummaryLimiter,
  routeLogger('CALENDAR_MONTH_SUMMARY'),
  transactionController.getCalendarMonthSummary
);

router.get('/monthly-accounting',
  getSummaryLimiter,
  routeLogger('MONTHLY_ACCOUNTING'),
  transactionController.getMonthlyAccounting
);

// Salary-anchored spending cycle + real checking balance (the "runway" view).
router.get('/cycle',
  getSummaryLimiter,
  routeLogger('CYCLE_RUNWAY'),
  transactionController.getCycleRunway
);

router.put('/cycle/projection',
  createTransactionLimiter,
  routeLogger('CYCLE_PROJECTION'),
  transactionController.updateCycleProjection
);

router.get('/salary-candidates',
  getSummaryLimiter,
  transactionController.getSalaryCandidates
);

router.post('/salary-signatures',
  createTransactionLimiter,
  transactionController.createSalarySignature
);

router.get('/salary-review',
  getSummaryLimiter,
  transactionController.getSalaryReview
);

router.put('/salary-review',
  createTransactionLimiter,
  transactionController.updateSalaryReview
);

router.get('/merchant-watches',
  getSummaryLimiter,
  transactionController.getMerchantWatches
);

router.post('/merchant-watches',
  createTransactionLimiter,
  transactionController.createMerchantWatch
);

router.delete('/merchant-watches/:id',
  createTransactionLimiter,
  transactionController.deleteMerchantWatch
);


/**
 * Transaction Query Routes
 */

// Get transactions with comprehensive filters
router.get('/',
  getTransactionsLimiter,
  transactionController.getTransactions
);

// Distinct months that have transactions (populates the month filter without
// depending on which pages happen to be loaded client-side)
router.get('/months',
  getSummaryLimiter,
  transactionController.getMonths
);

/**
 * Transaction CRUD Routes
 * Create, update, delete individual one-time transactions
 */

// Bulk delete transactions — rate limited to prevent mass-deletion abuse
// MOVED BEFORE /:type to avoid route conflicts - SPECIFIC ROUTES FIRST!
router.post('/bulk-delete',
  createTransactionLimiter,
  bulkOperationLogger('DELETE_TRANSACTIONS'),
  transactionController.bulkDelete
);

// Create new one-time transaction (income or expense)
router.post('/:type',
  createTransactionLimiter,
  transactionLogger('CREATE'),
  transactionController.create
);

// Update existing transaction
router.put('/:type/:id',
  createTransactionLimiter,
  transactionController.update
);

// Delete transaction (soft delete)
router.delete('/:type/:id',
  createTransactionLimiter,
  transactionController.delete
);

module.exports = router;
