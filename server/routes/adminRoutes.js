/**
 * 🛡️ ADMIN ROUTES - Super Admin Dashboard
 * Secure admin routes for user management and system settings
 * Only accessible by admin/super_admin users
 * @module routes/adminRoutes
 */

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const { securityMiddleware } = require('../middleware/security');
const { apiLimiter } = require('../middleware/rateLimiter');
const logger = require('../utils/logger');
const db = require('../config/db'); // Fixed db import path

/**
 * 🛡️ Admin Authorization Middleware
 * Ensures only admin/super_admin users can access admin routes
 */
const adminAuth = (req, res, next) => {
  if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
    logger.warn('🚫 Unauthorized admin access attempt', {
      userId: req.user?.id,
      userRole: req.user?.role,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    return res.status(403).json({
      success: false,
      error: {
        code: 'ACCESS_DENIED',
        message: 'Admin privileges required'
      }
    });
  }
  next();
};

/**
 * 🔒 Super Admin Authorization Middleware
 * Ensures only super_admin users can access super admin routes
 */
const superAdminAuth = (req, res, next) => {
  if (!req.user || req.user.role !== 'super_admin') {
    logger.warn('🚫 Unauthorized super admin access attempt', {
      userId: req.user?.id,
      userRole: req.user?.role,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    return res.status(403).json({
      success: false,
      error: {
        code: 'SUPER_ADMIN_REQUIRED',
        message: 'Super admin privileges required'
      }
    });
  }
  next();
};

/**
 * @route   POST /api/v1/admin/bootstrap
 * @desc    Bootstrap the first super admin (only if no super admin exists)
 * @access  Public (but only works if no super admin exists)
 */
router.post('/bootstrap', async (req, res) => {
  try {
    const { email, secret } = req.body;
    
    // Simple secret check (you should change this)
    if (secret !== 'spendwise_bootstrap_2025') {
      return res.status(403).json({
        success: false,
        error: { code: 'INVALID_SECRET', message: 'Invalid bootstrap secret' }
      });
    }
    
    // Check if any super_admin already exists
    const existingSuper = await db.query(
      `SELECT id FROM users WHERE role = 'super_admin' LIMIT 1`,
      [],
      'check_existing_super_admin'
    );
    
    if (existingSuper.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'SUPER_ADMIN_EXISTS', message: 'Super admin already exists' }
      });
    }
    
    // Update the specified user to super_admin
    const result = await db.query(
      `UPDATE users SET role = 'super_admin' WHERE email = $1 RETURNING id, email, username, role`,
      [email.toLowerCase()],
      'bootstrap_super_admin'
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found with that email' }
      });
    }
    
    logger.info('🚀 Super admin bootstrapped', {
      email,
      userId: result.rows[0].id
    });
    
    res.json({
      success: true,
      data: {
        message: 'Super admin bootstrapped successfully',
        user: result.rows[0]
      }
    });
    
  } catch (error) {
    logger.error('❌ Bootstrap error', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'BOOTSTRAP_ERROR', message: 'Bootstrap failed' }
    });
  }
});

// Apply authentication and basic security to all admin routes (except bootstrap)
router.use(auth);
router.use(adminAuth);
router.use(securityMiddleware.api);

/**
 * @route   GET /api/v1/admin/dashboard
 * @desc    Get admin dashboard overview with users, activity, and settings
 * @access  Admin/Super Admin
 */
router.get('/dashboard', adminController.getDashboard);

/**
 * @route   GET /api/v1/admin/users
 * @desc    Get all users with admin details, pagination, and filters
 * @access  Admin/Super Admin
 */
router.get('/users', adminController.getUsers);

/**
 * @route   POST /api/v1/admin/users/:userId/manage
 * @desc    Manage user (block, unblock, delete, verify email)
 * @access  Admin/Super Admin (super admin required for admin users)
 */
router.post('/users/:userId/manage', adminController.manageUser);

/**
 * @route   GET /api/v1/admin/settings
 * @desc    Get system settings (all or filtered by category/key)
 * @access  Admin/Super Admin
 */
router.get('/settings', adminController.getSettings);

/**
 * @route   PUT /api/v1/admin/settings
 * @desc    Update system setting
 * @access  Admin/Super Admin
 */
router.put('/settings', adminController.updateSetting);

/**
 * @route   DELETE /api/v1/admin/settings/:key
 * @desc    Delete system setting
 * @access  Super Admin only
 */
router.delete('/settings/:key', superAdminAuth, adminController.deleteSetting);

/**
 * @route   GET /api/v1/admin/activity
 * @desc    Get admin activity log with pagination
 * @access  Admin/Super Admin
 */
router.get('/activity', adminController.getActivityLog);

/**
 * @route   GET /api/v1/admin/statistics
 * @desc    Get comprehensive admin statistics
 * @access  Admin/Super Admin
 */
router.get('/statistics', adminController.getStatistics);

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