/**
 * Admin Overview Controller — dashboard summary, activity log, statistics,
 * and bank-sync visibility (read-only reporting endpoints)
 * @module controllers/admin/adminOverviewController
 */

const db = require('../../config/db');
const { asyncHandler } = require('../../middleware/errorHandler');
const logger = require('../../utils/logger');

const adminOverviewController = {
  /**
   * 📊 Get admin dashboard overview
   */
  getDashboard: asyncHandler(async (req, res) => {
    const adminId = req.user.id;

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

      // Bank-sync health — the new model's core signal (replaces the dead
      // categories count).
      const syncResult = await db.query(`
        SELECT
          (SELECT COUNT(*) FROM bank_connections) AS total_connections,
          (SELECT COUNT(*) FROM bank_connections WHERE status = 'active') AS active_connections,
          (SELECT COUNT(*) FROM bank_connections WHERE status = 'error')  AS error_connections,
          (SELECT COUNT(*) FROM bank_sync_jobs
             WHERE status = 'failed' AND finished_at >= NOW() - INTERVAL '24 hours') AS failed_jobs_24h,
          (SELECT COUNT(*) FROM bank_sync_jobs
             WHERE status IN ('pending','running')) AS in_flight_jobs
      `, [], 'admin_dashboard_sync_summary');

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
          total_connections: parseInt(syncResult.rows[0]?.total_connections || 0),
          active_connections: parseInt(syncResult.rows[0]?.active_connections || 0),
          error_connections: parseInt(syncResult.rows[0]?.error_connections || 0),
          failed_jobs_24h: parseInt(syncResult.rows[0]?.failed_jobs_24h || 0),
          in_flight_jobs: parseInt(syncResult.rows[0]?.in_flight_jobs || 0)
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
  }),

  /**
   * 📋 Get admin activity log - UNIFIED VERSION
   */
  getActivityLog: asyncHandler(async (req, res) => {
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
  }),

  /**
   * 📊 Get admin statistics
   */
  getStatistics: asyncHandler(async (req, res) => {
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
            COUNT(*) FILTER (WHERE last_login_at >= NOW() - INTERVAL '7 days') as active_users_7d
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
  }),

  /**
   * 🔌 GET /api/v1/admin/bank-sync
   * Bank-sync visibility: every connection with its live health, plus the
   * most recent sync jobs across all users (for debugging the worker flow).
   */
  getBankSync: asyncHandler(async (req, res) => {
    const adminId = req.user.id;

    const [connectionsResult, jobsResult] = await Promise.all([
      db.query(`
        SELECT
          bc.id,
          bc.user_id,
          u.email               AS user_email,
          u.first_name          AS user_first_name,
          u.last_name           AS user_last_name,
          bc.bank_source,
          bc.display_name,
          bc.status,
          bc.consecutive_failures,
          bc.last_sync_at,
          bc.last_error,
          bc.created_at,
          acc.accounts_count,
          acc.balance,
          acc.has_balance,
          acc.last_synced_at
        FROM bank_connections bc
        JOIN users u ON u.id = bc.user_id
        LEFT JOIN (
          SELECT
            user_id,
            bank_source,
            COUNT(*)                                             AS accounts_count,
            SUM(balance) FILTER (WHERE balance IS NOT NULL)      AS balance,
            bool_or(balance IS NOT NULL)                         AS has_balance,
            MAX(last_synced_at)                                  AS last_synced_at
          FROM bank_accounts
          GROUP BY user_id, bank_source
        ) acc ON acc.user_id = bc.user_id AND acc.bank_source = bc.bank_source
        ORDER BY bc.consecutive_failures DESC, bc.last_sync_at DESC NULLS LAST
      `, [], 'admin_bank_sync_connections'),
      db.query(`
        SELECT
          j.id,
          j.user_id,
          u.email      AS user_email,
          j.connection_id,
          bc.bank_source,
          j.status,
          j.trigger,
          j.requested_at,
          j.started_at,
          j.finished_at,
          CASE
            WHEN j.started_at IS NOT NULL AND j.finished_at IS NOT NULL
            THEN EXTRACT(EPOCH FROM (j.finished_at - j.started_at))
            ELSE NULL
          END          AS duration_seconds,
          j.result
        FROM bank_sync_jobs j
        LEFT JOIN users u ON u.id = j.user_id
        LEFT JOIN bank_connections bc ON bc.id = j.connection_id
        ORDER BY j.requested_at DESC
        LIMIT 50
      `, [], 'admin_bank_sync_jobs')
    ]);

    logger.info('🔌 Admin bank-sync visibility accessed', {
      adminId,
      connections: connectionsResult.rows.length,
      jobs: jobsResult.rows.length
    });

    res.json({
      success: true,
      data: {
        connections: connectionsResult.rows,
        jobs: jobsResult.rows
      },
      timestamp: new Date().toISOString()
    });
  })
};

module.exports = adminOverviewController;
