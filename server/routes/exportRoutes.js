/**
 * Export Routes - Production Ready
 * Handles data export endpoints with authentication and rate limiting
 * @module routes/exportRoutes
 */

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const exportController = require('../controllers/exportController');
const { apiLimiter } = require('../middleware/rateLimiter');
const { asyncHandler } = require('../middleware/errorHandler');

// Apply authentication to all export routes
router.use(auth);

// Apply rate limiting to all export routes
router.use(apiLimiter);

/**
 * @route   GET /api/v1/export/options
 * @desc    Get available export options and metadata
 * @access  Private
 * @limit   Standard API rate limit
 */
router.get('/options', exportController.getExportOptions);

/**
 * @route   GET /api/v1/export/csv
 * @desc    Export user data as CSV file
 * @access  Private
 * @limit   Export rate limit (stricter)
 */
router.get('/csv', exportController.exportAsCSV);

/**
 * @route   GET /api/v1/export/json
 * @desc    Export user data as JSON file
 * @access  Private
 * @limit   Export rate limit (stricter)
 */
router.get('/json', exportController.exportAsJSON);

/**
 * @route   GET /api/v1/export/pdf
 * @desc    Export user data as PDF (placeholder - returns 501)
 * @access  Private
 * @limit   Export rate limit (stricter)
 */
router.get('/pdf', exportController.exportAsPDF);

module.exports = router;
