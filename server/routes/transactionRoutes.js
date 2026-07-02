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
  transactionLogger,
  routeLogger,
  bulkOperationLogger,
  analyticsLogger
} = require('../middleware/routeLogger');
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
  routeLogger('TRANSACTION_DASHBOARD'),
  analyticsLogger('dashboard'),
  transactionController.getDashboardData
);

// Get recent transactions
router.get('/recent',
  getTransactionsLimiter,
  transactionController.getRecentTransactions
);

// Get summary data
router.get('/summary',
  getSummaryLimiter,
  transactionController.getMonthlySummary
);

// NOTE: removed dead routes (0 client callers, verified 2026-07-03):
//   /balance, /balance/details, /balance/history/:period  (old balance panel —
//     replaced by /bank-sync/stats), /stats and /categories/breakdown
//     (duplicates of /analytics/dashboard/summary and /analytics/user),
//   /search (duplicate of GET /), /period/:period.

/**
 * Transaction Query Routes
 */

// Get transactions with comprehensive filters
router.get('/',
  getTransactionsLimiter,
  transactionController.getTransactions
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
  routeLogger('UPDATE_TEMPLATE'),
  transactionLogger('UPDATE_TEMPLATE'),
  transactionController.updateRecurringTemplate
);

// Delete/deactivate recurring template
router.delete('/templates/:id',
  createTransactionLimiter,
  routeLogger('DELETE_TEMPLATE'),
  transactionLogger('DELETE_TEMPLATE'),
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

// 🧪 TEST: Onboarding template creation — development only
if (process.env.NODE_ENV !== 'production') {
  router.post('/test-onboarding-templates',
    createTransactionLimiter,
    routeLogger('TEST_ONBOARDING_TEMPLATES'),
    async (req, res) => {
      try {
        const preparedTemplates = [
          // Income templates
          { name: 'Monthly Salary', type: 'income', amount: 5000, category_name: 'Salary' },
          { name: 'Freelance Work', type: 'income', amount: 2000, category_name: 'Freelance' },

          // Expense templates
          { name: 'Rent/Mortgage', type: 'expense', amount: 1200, category_name: 'Housing' },
          { name: 'Phone & Internet', type: 'expense', amount: 80, category_name: 'Utilities' },
          { name: 'Groceries', type: 'expense', amount: 400, category_name: 'Food' },
          { name: 'Insurance', type: 'expense', amount: 200, category_name: 'Insurance' },
          { name: 'Gym Membership', type: 'expense', amount: 50, category_name: 'Health' },
          { name: 'Streaming Services', type: 'expense', amount: 25, category_name: 'Entertainment' }
        ];

        const formattedTemplates = preparedTemplates.map(template => ({
          ...template,
          description: template.name,
          interval_type: 'monthly',
          day_of_month: 1,
          is_active: true
        }));

        // Inject into req.body and call controller normally so it owns the response
        req.body = { templates: formattedTemplates };
        return transactionController.createBulkRecurringTemplates(req, res);

      } catch (error) {
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: {
              code: 'TEST_ONBOARDING_ERROR',
              message: 'Failed to test onboarding templates',
              details: process.env.NODE_ENV === 'development' ? error.message : undefined
            }
          });
        }
      }
    }
  );
}

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

// Bulk delete transactions — rate limited to prevent mass-deletion abuse
// ✅ MOVED BEFORE /:type to avoid route conflicts - SPECIFIC ROUTES FIRST!
router.post('/bulk-delete',
  createTransactionLimiter,
  bulkOperationLogger('DELETE_TRANSACTIONS'),
  transactionController.bulkDelete
);

// Create new transaction (one-time or recurring)
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