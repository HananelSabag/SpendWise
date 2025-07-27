/**
 * 🛡️ ADMIN CONTROLLER - Super Admin Dashboard
 * Complete admin functionality for user management and system settings
 * Only accessible by admin/super_admin users
 * @module controllers/adminController
 */

const db = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const errorCodes = require('../utils/errorCodes');

class AdminController {
  /**
   * 📊 Get admin dashboard overview
   */
  static getDashboard = asyncHandler(async (req, res) => {
    const adminId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;
    
    try {
      // Get comprehensive users overview
      const usersResult = await db.query(
        'SELECT get_admin_users_overview($1, $2, $3) as overview',
        [adminId, parseInt(limit), parseInt(offset)],
        'admin_users_overview'
      );
      
      const overview = usersResult.rows[0]?.overview;
      
      // Get recent admin activity
      const activityResult = await db.query(
        'SELECT get_admin_activity_log($1, 10, 0) as activity',
        [adminId],
        'admin_recent_activity'
      );
      
      const recentActivity = activityResult.rows[0]?.activity;
      
      // Get system settings summary
      const settingsResult = await db.query(
        'SELECT admin_manage_settings($1, $2) as settings',
        [adminId, 'get'],
        'admin_settings_summary'
      );
      
      const systemSettings = settingsResult.rows[0]?.settings;
      
      logger.info('📊 Admin dashboard accessed', {
        adminId,
        userCount: overview?.summary?.total_users,
        timestamp: new Date().toISOString()
      });
      
      res.json({
        success: true,
        data: {
          users: overview,
          recentActivity,
          systemSettings,
          adminInfo: {
            id: req.user.id,
            username: req.user.username,
            email: req.user.email,
            role: req.user.role
          }
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('❌ Admin dashboard error', {
        adminId,
        error: error.message
      });
      throw error;
    }
  });

  /**
   * 👥 Get all users with admin details
   */
  static getUsers = asyncHandler(async (req, res) => {
    const adminId = req.user.id;
    const { 
      limit = 50, 
      offset = 0,
      search = '',
      role = '',
      verified = '',
      blocked = ''
    } = req.query;
    
    try {
      // Get users overview
      const result = await db.query(
        'SELECT get_admin_users_overview($1, $2, $3) as overview',
        [adminId, parseInt(limit), parseInt(offset)],
        'admin_get_users'
      );
      
      const overview = result.rows[0]?.overview;
      
      // Apply client-side filters if needed (for now, database handles basic pagination)
      // TODO: Add search and filter parameters to database function if needed
      
      logger.info('👥 Admin users list accessed', {
        adminId,
        limit,
        offset,
        totalUsers: overview?.total_count
      });
      
      res.json({
        success: true,
        data: overview,
        filters: { search, role, verified, blocked },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('❌ Admin get users error', {
        adminId,
        error: error.message
      });
      throw error;
    }
  });

  /**
   * 🔒 Manage user (block, unblock, delete, verify)
   */
  static manageUser = asyncHandler(async (req, res) => {
    const adminId = req.user.id;
    const { userId } = req.params;
    const { action, reason, expiresHours } = req.body;
    
    // Validate action
    const validActions = ['block', 'unblock', 'delete', 'verify_email'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ACTION',
          message: `Invalid action. Must be one of: ${validActions.join(', ')}`
        }
      });
    }
    
    // Validate required fields
    if (['block', 'delete'].includes(action) && !reason) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'REASON_REQUIRED',
          message: 'Reason is required for block and delete actions'
        }
      });
    }
    
    try {
      // Execute admin action
      const result = await db.query(
        'SELECT admin_manage_user($1, $2, $3, $4, $5) as result',
        [adminId, parseInt(userId), action, reason, expiresHours ? parseInt(expiresHours) : null],
        'admin_manage_user'
      );
      
      const actionResult = result.rows[0]?.result;
      
      logger.info(`🔒 Admin user management: ${action}`, {
        adminId,
        targetUserId: userId,
        action,
        reason,
        expiresHours,
        result: actionResult
      });
      
      res.json({
        success: true,
        data: actionResult,
        message: `User ${action} action completed successfully`,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('❌ Admin manage user error', {
        adminId,
        targetUserId: userId,
        action,
        error: error.message
      });
      
      // Handle specific error cases
      if (error.message.includes('Access denied')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: error.message
          }
        });
      }
      
      throw error;
    }
  });

  /**
   * ⚙️ Get system settings
   */
  static getSettings = asyncHandler(async (req, res) => {
    const adminId = req.user.id;
    const { category, key } = req.query;
    
    try {
      const result = await db.query(
        'SELECT admin_manage_settings($1, $2, $3) as settings',
        [adminId, 'get', key || null],
        'admin_get_settings'
      );
      
      const settings = result.rows[0]?.settings;
      
      // Filter by category if provided
      let filteredSettings = settings;
      if (category && Array.isArray(settings)) {
        filteredSettings = settings.filter(setting => setting.category === category);
      }
      
      logger.info('⚙️ Admin settings accessed', {
        adminId,
        category,
        key,
        settingsCount: Array.isArray(filteredSettings) ? filteredSettings.length : 1
      });
      
      res.json({
        success: true,
        data: filteredSettings,
        categories: ['general', 'limits', 'system', 'auth', 'defaults', 'info', 'contact', 'legal'],
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('❌ Admin get settings error', {
        adminId,
        error: error.message
      });
      throw error;
    }
  });

  /**
   * ⚙️ Update system setting
   */
  static updateSetting = asyncHandler(async (req, res) => {
    const adminId = req.user.id;
    const { key, value, description, category = 'general' } = req.body;
    
    // Validate required fields
    if (!key || value === undefined) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Setting key and value are required'
        }
      });
    }
    
    try {
      // Convert value to JSONB format
      const jsonValue = typeof value === 'string' ? JSON.stringify(value) : JSON.stringify(value);
      
      const result = await db.query(
        'SELECT admin_manage_settings($1, $2, $3, $4, $5, $6) as result',
        [adminId, 'set', key, jsonValue, description, category],
        'admin_update_setting'
      );
      
      const updateResult = result.rows[0]?.result;
      
      logger.info('⚙️ Admin setting updated', {
        adminId,
        key,
        category,
        description: description ? 'provided' : 'none'
      });
      
      res.json({
        success: true,
        data: updateResult,
        message: `Setting '${key}' updated successfully`,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('❌ Admin update setting error', {
        adminId,
        key,
        error: error.message
      });
      throw error;
    }
  });

  /**
   * 🗑️ Delete system setting
   */
  static deleteSetting = asyncHandler(async (req, res) => {
    const adminId = req.user.id;
    const { key } = req.params;
    
    try {
      const result = await db.query(
        'SELECT admin_manage_settings($1, $2, $3) as result',
        [adminId, 'delete', key],
        'admin_delete_setting'
      );
      
      const deleteResult = result.rows[0]?.result;
      
      logger.info('🗑️ Admin setting deleted', {
        adminId,
        key
      });
      
      res.json({
        success: true,
        data: deleteResult,
        message: `Setting '${key}' deleted successfully`,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('❌ Admin delete setting error', {
        adminId,
        key,
        error: error.message
      });
      throw error;
    }
  });

  /**
   * 📋 Get admin activity log
   */
  static getActivityLog = asyncHandler(async (req, res) => {
    const adminId = req.user.id;
    const { limit = 100, offset = 0 } = req.query;
    
    try {
      const result = await db.query(
        'SELECT get_admin_activity_log($1, $2, $3) as activity',
        [adminId, parseInt(limit), parseInt(offset)],
        'admin_activity_log'
      );
      
      const activity = result.rows[0]?.activity;
      
      logger.info('📋 Admin activity log accessed', {
        adminId,
        limit,
        offset,
        totalActivities: activity?.total_count
      });
      
      res.json({
        success: true,
        data: activity,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('❌ Admin activity log error', {
        adminId,
        error: error.message
      });
      throw error;
    }
  });

  /**
   * 📊 Get admin statistics
   */
  static getStatistics = asyncHandler(async (req, res) => {
    const adminId = req.user.id;
    
    try {
      // Get various statistics
      const stats = await Promise.all([
        // User statistics
        db.query(`
          SELECT 
            COUNT(*) as total_users,
            COUNT(*) FILTER (WHERE email_verified = true) as verified_users,
            COUNT(*) FILTER (WHERE role = 'admin') as admin_users,
            COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as new_users_24h,
            COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as new_users_7d,
            COUNT(*) FILTER (WHERE last_login >= NOW() - INTERVAL '7 days') as active_users_7d
          FROM users
        `, [], 'admin_user_stats'),
        
        // Transaction statistics
        db.query(`
          SELECT 
            COUNT(*) as total_transactions,
            SUM(amount) as total_amount,
            COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as transactions_24h,
            COUNT(DISTINCT user_id) as users_with_transactions
          FROM transactions
          WHERE deleted_at IS NULL
        `, [], 'admin_transaction_stats'),
        
        // System statistics
        db.query(`
          SELECT 
            COUNT(*) as blocked_users,
            COUNT(*) FILTER (WHERE restriction_type = 'deleted') as deleted_users
          FROM user_restrictions 
          WHERE is_active = true 
            AND (expires_at IS NULL OR expires_at > NOW())
        `, [], 'admin_system_stats')
      ]);
      
      const [userStats, transactionStats, systemStats] = stats;
      
      const statistics = {
        users: userStats.rows[0],
        transactions: transactionStats.rows[0],
        system: systemStats.rows[0],
        generated_at: new Date().toISOString()
      };
      
      logger.info('📊 Admin statistics generated', {
        adminId,
        totalUsers: statistics.users.total_users,
        totalTransactions: statistics.transactions.total_transactions
      });
      
      res.json({
        success: true,
        data: statistics,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('❌ Admin statistics error', {
        adminId,
        error: error.message
      });
      throw error;
    }
  });
}

module.exports = AdminController; 