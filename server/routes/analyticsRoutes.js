/**
 * 📊 ANALYTICS ROUTES - Dashboard Analytics & User Insights
 * Provides analytics endpoints for dashboard and user data
 * @module routes/analyticsRoutes
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const transactionController = require('../controllers/transactionController');

// ✅ Dashboard Analytics Routes
router.get('/dashboard/summary', authenticate, transactionController.getAnalyticsSummary);

// ✅ User Analytics Routes  
router.get('/user', authenticate, transactionController.getUserAnalytics);

module.exports = router; 