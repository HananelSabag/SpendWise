/**
 * 🛡️ ADMIN ROUTES - Super Admin Dashboard
 * Secure admin routes for user management and system settings
 * Only accessible by admin/super_admin users
 * @module routes/adminRoutes
 */

const express = require('express');
const router = express.Router();
const { auth, requireAdmin, requireSuperAdmin } = require('../middleware/auth');
const adminUsersController = require('../controllers/admin/adminUsersController');
const adminSettingsController = require('../controllers/admin/adminSettingsController');
const adminOverviewController = require('../controllers/admin/adminOverviewController');
const { securityMiddleware } = require('../middleware/security');
const { apiLimiter } = require('../middleware/rateLimiter');
const logger = require('../utils/logger');
const db = require('../config/db'); // Fixed db import path

// ✅ BULLETPROOF SECURITY: Using centralized auth middleware from auth.js
// - requireAdmin: Ensures admin or super_admin role
// - requireSuperAdmin: Ensures super_admin role only
// - All middleware includes comprehensive logging and security checks

// Apply authentication and bulletproof admin authorization to all admin routes
router.use(auth);
router.use(requireAdmin);
router.use(securityMiddleware.api);

/**
 * @route   GET /api/v1/admin/dashboard
 * @desc    Get admin dashboard overview with users, activity, and settings
 * @access  Admin/Super Admin
 */
router.get('/dashboard', adminOverviewController.getDashboard);

/**
 * @route   GET /api/v1/admin/users
 * @desc    Get all users with admin details, pagination, and filters
 * @access  Admin/Super Admin
 */
router.get('/users', adminUsersController.getUsers);

/**
 * @route   POST /api/v1/admin/users/bulk-manage
 * @desc    Bulk manage users (block, unblock, delete multiple users)
 * @access  Admin/Super Admin (super admin required for admin users and delete)
 */
router.post('/users/bulk-manage', adminUsersController.bulkManageUsers);

/**
 * @route   POST /api/v1/admin/users/:userId/manage
 * @desc    Manage user (block, unblock, delete, verify email)
 * @access  Admin/Super Admin (super admin required for admin users)
 */
router.post('/users/:userId/manage', adminUsersController.manageUser);

/**
 * @route   GET /api/v1/admin/settings
 * @desc    Get system settings (all or filtered by category/key)
 * @access  Admin/Super Admin
 */
router.get('/settings', adminSettingsController.getSettings);

/**
 * @route   PUT /api/v1/admin/settings
 * @desc    Update system setting
 * @access  Admin/Super Admin
 */
router.put('/settings', adminSettingsController.updateSetting);

/**
 * @route   DELETE /api/v1/admin/settings/:key
 * @desc    Delete system setting
 * @access  Super Admin only
 */
router.delete('/settings/:key', requireSuperAdmin, adminSettingsController.deleteSetting);

/**
 * @route   GET /api/v1/admin/activity
 * @desc    Get admin activity log with pagination
 * @access  Admin/Super Admin
 */
router.get('/activity', adminOverviewController.getActivityLog);

/**
 * @route   GET /api/v1/admin/statistics
 * @desc    Get comprehensive admin statistics
 * @access  Admin/Super Admin
 */
router.get('/statistics', adminOverviewController.getStatistics);

/**
 * @route   GET /api/v1/admin/bank-sync
 * @desc    Bank-sync visibility: connection health + recent worker jobs
 * @access  Admin/Super Admin
 */
router.get('/bank-sync', adminOverviewController.getBankSync);

/**
 * @route   GET /api/v1/admin/health
 * @desc    Admin-specific health check with enhanced details
 * @access  Admin/Super Admin
 */
router.get('/health', (req, res) => {
  logger.info('🏥 Admin health check accessed', {
    adminId: req.user.id,
    adminRole: req.user.role
  });
  
  res.json({
    success: true,
    status: 'healthy',
    admin: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
      access_level: req.user.role === 'super_admin' ? 'full' : 'standard'
    },
    server: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    },
    database: 'connected',
    security: 'active',
    admin_features: [
      'user_management',
      'system_settings',
      'activity_logging',
      'statistics_dashboard'
    ]
  });
});

module.exports = router; 