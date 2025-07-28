/**
 * 📊 ANALYTICS ROUTES - Dashboard Analytics & User Insights  
 * Fixed auth middleware import that was causing route loading failures
 * @module routes/analyticsRoutes
 */

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth'); // ✅ FIXED: Use auth (not authenticate)
const transactionController = require('../controllers/transactionController');

// ✅ Dashboard Analytics Routes (Primary route used by dashboard)
router.get('/dashboard/summary', auth, transactionController.getAnalyticsSummary);

// ✅ User Analytics Routes (Used by client analytics API)
router.get('/user', auth, transactionController.getUserAnalytics);

module.exports = router; 