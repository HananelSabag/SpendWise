/**
 * Category Routes - Production Ready
 * Complete category management endpoints with rate limiting and validation
 * @module routes/categoryRoutes
 */

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const categoryController = require('../controllers/categoryController');
const {
  createTransactionLimiter,
  getTransactionsLimiter,
  getSummaryLimiter
} = require('../middleware/rateLimiter');

// Apply authentication to all routes
router.use(auth);

/**
 * Category Query Routes
 * Read operations with filtering and statistics
 */

// Get all categories with optional type filtering
router.get('/',
  getTransactionsLimiter,
  validate.categoryFilters,
  categoryController.getAll
);

// Get single category by ID
router.get('/:id',
  getTransactionsLimiter,
  validate.categoryId,
  categoryController.getById
);

// Get categories with transaction counts for date range
router.get('/with-counts',
  getSummaryLimiter,
  validate.dateRange,
  categoryController.getWithCounts
);

// Get category usage statistics
router.get('/:id/stats',
  getSummaryLimiter,
  validate.categoryId,
  categoryController.getStats
);

/**
 * Category Management Routes
 * Create, update, delete operations with enhanced validation
 */

// Create new category
router.post('/',
  createTransactionLimiter,
  validate.categoryCreate,
  categoryController.create
);

// Update existing category
router.put('/:id',
  createTransactionLimiter,
  validate.categoryId,
  validate.categoryUpdate,
  categoryController.update
);

// Delete category (with usage validation)
router.delete('/:id',
  createTransactionLimiter,
  validate.categoryId,
  categoryController.delete
);

module.exports = router;