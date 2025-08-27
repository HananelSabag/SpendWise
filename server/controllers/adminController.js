/**
 * 🛡️ ADMIN CONTROLLER - Super Admin Dashboard
 * Complete admin functionality for user management and system settings
 * Only accessible by admin/super_admin users
 * @module controllers/adminController
 */

const db = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');
const { hasRole, canManageUser } = require('../middleware/auth');
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
      // ✅ SIMPLIFIED: Direct database queries instead of calling potentially missing functions
      
      // Get users summary
      const usersResult = await db.query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(*) FILTER (WHERE email_verified = true) as verified_users,
          COUNT(*) FILTER (WHERE role IN ('admin', 'super_admin')) as admin_users,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_month
        FROM users
        WHERE email NOT LIKE '%_deleted_%'
      `, [], 'admin_dashboard_users_summary');
      
      // Get recent users
      const recentUsersResult = await db.query(`
        SELECT id, email, username, role, created_at, email_verified
        FROM users 
        WHERE email NOT LIKE '%_deleted_%'
        ORDER BY created_at DESC 
        LIMIT 10
      `, [], 'admin_dashboard_recent_users');
      
      // Get transactions summary  
      const transactionsResult = await db.query(`
        SELECT 
          COUNT(*) as total_transactions,
          COALESCE(SUM(amount), 0) as total_amount,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as transactions_month
        FROM transactions
      `, [], 'admin_dashboard_transactions_summary');
      
      // Get categories summary
      const categoriesResult = await db.query(`
        SELECT COUNT(*) as total_categories
        FROM categories
      `, [], 'admin_dashboard_categories_summary');
      
      // Get recent admin activity
      const activityResult = await db.query(`
        SELECT 
          aal.action_type,
          aal.action_details,
          aal.created_at,
          u.username as admin_username
        FROM admin_activity_log aal
        LEFT JOIN users u ON aal.admin_id = u.id
        ORDER BY aal.created_at DESC
        LIMIT 10
      `, [], 'admin_dashboard_recent_activity');
      
      const overview = {
        summary: {
          total_users: parseInt(usersResult.rows[0]?.total_users || 0),
          verified_users: parseInt(usersResult.rows[0]?.verified_users || 0),
          admin_users: parseInt(usersResult.rows[0]?.admin_users || 0),
          new_users_month: parseInt(usersResult.rows[0]?.new_users_month || 0),
          total_transactions: parseInt(transactionsResult.rows[0]?.total_transactions || 0),
          total_amount: parseFloat(transactionsResult.rows[0]?.total_amount || 0),
          transactions_month: parseInt(transactionsResult.rows[0]?.transactions_month || 0),
          total_categories: parseInt(categoriesResult.rows[0]?.total_categories || 0)
        },
        recent_users: recentUsersResult.rows || [],
        recent_activity: activityResult.rows || []
      };
      
      logger.info('📊 Admin dashboard accessed', {
        adminId,
        userCount: overview.summary.total_users,
        timestamp: new Date().toISOString()
      });
      
      res.json({
        success: true,
        data: {
          users: overview,
          recentActivity: overview.recent_activity,
          systemSettings: {
            version: '2.0.0',
            uptime: process.uptime(),
            memory: process.memoryUsage()
          },
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
      // ✅ SIMPLIFIED: Direct database query with proper user data
      let whereClause = `WHERE u.email NOT LIKE '%_deleted_%'`;
      let queryParams = [];
      let paramCount = 0;
      
      // Add search filter
      if (search) {
        paramCount++;
        whereClause += ` AND (u.email ILIKE $${paramCount} OR u.username ILIKE $${paramCount} OR u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount})`;
        queryParams.push(`%${search}%`);
      }
      
      // Add role filter
      if (role && role !== 'all') {
        paramCount++;
        whereClause += ` AND u.role = $${paramCount}`;
        queryParams.push(role);
      }
      
      // Add limit and offset
      paramCount++;
      const limitParam = paramCount;
      queryParams.push(parseInt(limit));
      
      paramCount++;
      const offsetParam = paramCount;
      queryParams.push(parseInt(offset));
      
      // Get users with stats
      const usersQuery = `
        SELECT 
          u.id,
          u.email,
          u.username,
          u.first_name,
          u.last_name,
          u.role,
          u.email_verified,
          u.onboarding_completed,
          u.created_at,
          u.last_login,
          u.language_preference,
          u.currency_preference,
          u.avatar,
          COALESCE(t_stats.transaction_count, 0) as total_transactions,
          COALESCE(t_stats.total_amount, 0) as total_amount,
          COALESCE(r_stats.restriction_count, 0) as active_restrictions,
          CASE 
            WHEN r_stats.restriction_count > 0 THEN 'blocked'
            WHEN NOT u.email_verified THEN 'pending'
            ELSE 'active'
          END as status
        FROM users u
        LEFT JOIN (
          SELECT 
            user_id,
            COUNT(*) as transaction_count,
            SUM(amount) as total_amount
          FROM transactions 
          GROUP BY user_id
        ) t_stats ON u.id = t_stats.user_id
        LEFT JOIN (
          SELECT 
            user_id,
            COUNT(*) as restriction_count
          FROM user_restrictions
          WHERE is_active = true AND (expires_at IS NULL OR expires_at > NOW())
          GROUP BY user_id
        ) r_stats ON u.id = r_stats.user_id
        ${whereClause}
        ORDER BY u.created_at DESC 
        LIMIT $${limitParam} OFFSET $${offsetParam}
      `;
      
      const usersResult = await db.query(usersQuery, queryParams, 'admin_get_users');
      
      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total_count
        FROM users u
        ${whereClause.replace(/LIMIT.*$/, '').replace(/\$${limitParam}.*$/, '')}
      `;
      const countParams = queryParams.slice(0, -2); // Remove limit and offset
      const countResult = await db.query(countQuery, countParams, 'admin_get_users_count');
      
      // Get summary stats
      const summaryResult = await db.query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(*) FILTER (WHERE email_verified = true) as verified_users,
          COUNT(*) FILTER (WHERE role IN ('admin', 'super_admin')) as admin_users
        FROM users
        WHERE email NOT LIKE '%_deleted_%'
      `, [], 'admin_get_users_summary');
      
      const overview = {
        users: usersResult.rows || [],
        summary: {
          total_users: parseInt(countResult.rows[0]?.total_count || 0),
          verified_users: parseInt(summaryResult.rows[0]?.verified_users || 0),
          admin_users: parseInt(summaryResult.rows[0]?.admin_users || 0),
          active_users: usersResult.rows?.filter(u => u.status === 'active').length || 0,
          blocked_users: usersResult.rows?.filter(u => u.status === 'blocked').length || 0,
          pending_users: usersResult.rows?.filter(u => u.status === 'pending').length || 0
        },
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total_count: parseInt(countResult.rows[0]?.total_count || 0)
        }
      };
      
      logger.info('👥 Admin users list accessed', {
        adminId,
        limit,
        offset,
        totalUsers: overview.summary.total_users,
        returnedUsers: overview.users.length
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
   * 🔒 Bulk manage users (block, unblock, delete multiple users)
   */
  static bulkManageUsers = asyncHandler(async (req, res) => {
    const adminId = req.user.id;
    const { userIds, action, reason } = req.body;
    
    // Validate action
    const validActions = ['block', 'unblock', 'delete'];
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
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_USER_IDS',
          message: 'User IDs array is required and cannot be empty'
        }
      });
    }
    
    // Limit bulk operations to reasonable size
    if (userIds.length > 50) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'TOO_MANY_USERS',
          message: 'Bulk operations are limited to 50 users at a time'
        }
      });
    }

    try {
      const results = {
        successful: 0,
        failed: 0,
        errors: []
      };

      // ✅ BULLETPROOF: Use the admin user from auth middleware (already validated)
      const adminUser = req.user;
      const isSuperAdmin = hasRole(adminUser, 'super_admin');

      // Process each user
      for (const userId of userIds) {
        try {
          // Load target user and check permissions
          const userQuery = `SELECT id, role, status FROM users WHERE id = $1 AND email NOT LIKE '%_deleted_%'`;
          const userResult = await db.query(userQuery, [userId]);
          
          if (userResult.rows.length === 0) {
            results.failed++;
            results.errors.push(`User ${userId} not found`);
            continue;
          }

          const targetUser = userResult.rows[0];

          // ✅ BULLETPROOF: Use centralized permission checking
          if (!canManageUser(adminUser, targetUser)) {
            results.failed++;
            if (targetUser.id === adminUser.id) {
              results.errors.push(`Cannot perform action on yourself`);
            } else if (targetUser.role === 'super_admin') {
              results.errors.push(`Cannot perform action on super admin users`);
            } else if (targetUser.role === 'admin' && !isSuperAdmin) {
              results.errors.push(`Only super admins can manage admin users`);
            } else {
              results.errors.push(`Insufficient permissions to manage user ${userId}`);
            }
            continue;
          }

          // Perform the action
          let query, params;
          let actionType;

          switch (action) {
            case 'block':
              if (targetUser.status === 'blocked') {
                results.failed++;
                results.errors.push(`User ${userId} is already blocked`);
                continue;
              }
              query = `UPDATE users SET status = 'blocked', updated_at = NOW() WHERE id = $1`;
              params = [userId];
              actionType = 'user_blocked';
              break;

            case 'unblock':
              if (targetUser.status !== 'blocked') {
                results.failed++;
                results.errors.push(`User ${userId} is not blocked`);
                continue;
              }
              query = `UPDATE users SET status = 'active', updated_at = NOW() WHERE id = $1`;
              params = [userId];
              actionType = 'user_unblocked';
              break;

            case 'delete':
              if (!isSuperAdmin) {
                results.failed++;
                results.errors.push(`Only super admins can delete users`);
                continue;
              }
              // Soft delete by updating email and marking as deleted
              const timestamp = Date.now();
              query = `
                UPDATE users 
                SET 
                  email = CONCAT(email, '_deleted_', $2),
                  status = 'deleted',
                  updated_at = NOW()
                WHERE id = $1
              `;
              params = [userId, timestamp];
              actionType = 'user_deleted';
              break;
          }

          await db.query(query, params);

          // Log admin activity
          const activityQuery = `
            INSERT INTO admin_activity_log (admin_id, admin_username, action_type, target_user_id, details, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
          `;
          const adminUsername = req.user.username || req.user.email;
          const details = reason ? JSON.stringify({ reason, bulk: true }) : JSON.stringify({ bulk: true });
          
          await db.query(activityQuery, [adminId, adminUsername, actionType, userId, details]);

          results.successful++;
          
        } catch (error) {
          results.failed++;
          results.errors.push(`Failed to ${action} user ${userId}: ${error.message}`);
          logger.error(`Bulk ${action} failed for user ${userId}`, {
            adminId,
            userId,
            error: error.message
          });
        }
      }

      logger.info(`Bulk ${action} completed`, {
        adminId,
        successful: results.successful,
        failed: results.failed,
        total: userIds.length
      });

      res.json({
        success: true,
        data: {
          action,
          total: userIds.length,
          successful: results.successful,
          failed: results.failed,
          errors: results.errors
        }
      });

    } catch (error) {
      logger.error('Bulk user management failed', {
        adminId,
        action,
        userIds: userIds.length,
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        error: {
          code: 'BULK_OPERATION_FAILED',
          message: 'Bulk operation failed'
        }
      });
    }
  });

  /**
   * 🔒 Manage user (block, unblock, delete, verify)
   */
  static manageUser = asyncHandler(async (req, res) => {
    const adminId = req.user.id;
    const { userId } = req.params;
    const { action, reason, expiresHours, role } = req.body;
    
    // Validate action
    const validActions = ['block', 'unblock', 'delete', 'verify_email', 'change_role'];
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
    if (!userId || !action) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'User ID and action are required'
        }
      });
    }

    try {
      // ✅ BULLETPROOF: Load target user and validate permissions
      const targetRes = await db.query(
        'SELECT id, role FROM users WHERE id = $1',
        [userId],
        'admin_target_user_lookup'
      );
      if (targetRes.rowCount === 0) {
        return res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'User not found' }
        });
      }
      const targetUser = targetRes.rows[0];

      // ✅ Use bulletproof permission checking
      if (!canManageUser(req.user, targetUser)) {
        logger.warn('🚫 Unauthorized user management attempt', {
          adminId: req.user.id,
          adminRole: req.user.role,
          targetUserId: userId,
          targetUserRole: targetUser.role,
          action,
          ip: req.ip
        });

        return res.status(403).json({
          success: false,
          error: { 
            code: 'PERMISSION_DENIED', 
            message: 'Insufficient permissions to manage this user' 
          }
        });
      }

      // ✅ SIMPLIFIED: Direct database operations instead of calling missing functions
      let result;
      
      switch (action) {
        case 'block':
          // Insert or reactivate active block (aligned with partial unique index on (user_id, restriction_type) WHERE is_active)
          await db.query(`
            INSERT INTO user_restrictions (user_id, restriction_type, reason, applied_by, is_active, created_at)
            VALUES ($1, 'blocked', $2, $3, true, NOW())
            ON CONFLICT (user_id, restriction_type) WHERE (is_active)
            DO UPDATE SET is_active = true, updated_at = NOW(), reason = EXCLUDED.reason
          `, [userId, reason || 'Blocked by admin', adminId], 'admin_block_user');
          
          result = { action: 'blocked', userId, reason };
          break;
          
        case 'unblock':
          // Remove user restrictions
          await db.query(`
            UPDATE user_restrictions 
            SET is_active = false, updated_at = NOW()
            WHERE user_id = $1 AND restriction_type = 'blocked'
          `, [userId], 'admin_unblock_user');
          
          result = { action: 'unblocked', userId };
          break;
          
        case 'delete':
          // Allow: super admin can delete any user; admin can delete only regular users
          if (!(req.user.role === 'super_admin' || (req.user.role === 'admin' && targetRole === 'user'))) {
            return res.status(403).json({
              success: false,
              error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'Not allowed to delete this user' }
            });
          }

          // Hard delete user and all related data in a single transaction
          const client = await db.pool.connect();
          try {
            await client.query('BEGIN');

            // Remove activity logs referencing the user (as target or as admin)
            await client.query('DELETE FROM admin_activity_log WHERE target_user_id = $1', [userId]);
            await client.query('DELETE FROM admin_activity_log WHERE admin_id = $1', [userId]);

            // Remove tokens
            await client.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [userId]);
            await client.query('DELETE FROM email_verification_tokens WHERE user_id = $1', [userId]);

            // Remove restrictions created by or applied to the user
            await client.query('DELETE FROM user_restrictions WHERE user_id = $1', [userId]);
            await client.query('DELETE FROM user_restrictions WHERE applied_by = $1', [userId]);

            // Remove transactional data
            await client.query('DELETE FROM transactions WHERE user_id = $1', [userId]);
            await client.query('DELETE FROM recurring_templates WHERE user_id = $1', [userId]);

            // Remove categories owned by the user (user-specific)
            await client.query('DELETE FROM categories WHERE user_id = $1', [userId]);

            // Null out references in settings to avoid FK violations
            await client.query('UPDATE system_settings SET updated_by = NULL WHERE updated_by = $1', [userId]);

            // Finally, remove the user row
            await client.query('DELETE FROM users WHERE id = $1', [userId]);

            await client.query('COMMIT');
          } catch (txError) {
            try { await client.query('ROLLBACK'); } catch (_) {}
            throw txError;
          } finally {
            client.release();
          }

          result = { action: 'deleted', userId };
          break;
          
        case 'verify_email':
          await db.query(`
            UPDATE users 
            SET email_verified = true, updated_at = NOW()
            WHERE id = $1
          `, [userId], 'admin_verify_email');
          
          result = { action: 'email_verified', userId };
          break;
          
        case 'change_role':
          // Only super admin can change roles
          if (req.user.role !== 'super_admin') {
            return res.status(403).json({
              success: false,
              error: { code: 'SUPER_ADMIN_REQUIRED', message: 'Only super admin can change user roles' }
            });
          }
          if (!role || !['user', 'admin', 'super_admin'].includes(role)) {
            return res.status(400).json({
              success: false,
              error: { code: 'INVALID_ROLE', message: 'Invalid role specified' }
            });
          }
          // Prevent demoting or promoting super_admin via this endpoint unless caller is super_admin (already checked)
          await db.query(`
            UPDATE users 
            SET role = $1, updated_at = NOW()
            WHERE id = $2
          `, [role, userId], 'admin_change_role');
          
          result = { action: 'role_changed', userId, newRole: role };
          break;
      }

      // Log admin activity
      // For delete action, the target user no longer exists; avoid FK violation by logging with NULL target_user_id
      const targetUserIdForLog = action === 'delete' ? null : userId;
      await db.query(`
        INSERT INTO admin_activity_log (admin_id, action_type, target_user_id, action_details, created_at)
        VALUES ($1, $2, $3, $4, NOW())
      `, [
        adminId,
        `user_${action}`,
        targetUserIdForLog,
        JSON.stringify(result)
      ], 'admin_log_activity');

      logger.info(`🛡️ Admin user action completed`, {
        adminId,
        action,
        targetUserId: userId,
        result
      });

      res.json({
        success: true,
        data: result,
        message: `User ${action} completed successfully`,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('❌ Admin manage user error', {
        adminId,
        action,
        userId,
        error: error.message
      });
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
      // Convert to JSON text; cast to jsonb in SQL to preserve native types (bool/number/object)
      const jsonValue = JSON.stringify(value);
      
      const result = await db.query(
        'SELECT admin_manage_settings($1, $2, $3, $4::jsonb, $5, $6) as result',
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
   * 📋 Get admin activity log - UNIFIED VERSION
   */
  static getActivityLog = asyncHandler(async (req, res) => {
    const adminId = req.user.id;
    const { limit = 100, offset = 0 } = req.query;
    
    try {
      // ✅ Use the same unified query as dashboard for consistency
      const activityResult = await db.query(`
        SELECT 
          aal.id,
          aal.admin_id,
          aal.action_type,
          aal.target_user_id,
          aal.action_details,
          aal.created_at,
          u.username as admin_username,
          u.email as admin_email,
          tu.username as target_username,
          tu.email as target_email,
          CASE 
            WHEN tu.id IS NOT NULL THEN 
              json_build_object(
                'id', tu.id,
                'username', tu.username,
                'email', tu.email
              )
            ELSE NULL
          END as target_user
        FROM admin_activity_log aal
        LEFT JOIN users u ON aal.admin_id = u.id
        LEFT JOIN users tu ON aal.target_user_id = tu.id
        ORDER BY aal.created_at DESC
        LIMIT $1 OFFSET $2
      `, [parseInt(limit), parseInt(offset)], 'admin_activity_log');
      
      // Get total count
      const countResult = await db.query(
        'SELECT COUNT(*) as total FROM admin_activity_log',
        [],
        'admin_activity_log_count'
      );
      
      const activities = activityResult.rows || [];
      const totalCount = parseInt(countResult.rows[0]?.total || 0);
      
      logger.info('📋 Admin activity log accessed', {
        adminId,
        limit,
        offset,
        totalActivities: totalCount,
        returnedActivities: activities.length
      });
      
      res.json({
        success: true,
        data: {
          activities,
          total_count: totalCount,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            total: totalCount,
            hasMore: (parseInt(offset) + activities.length) < totalCount
          }
        },
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