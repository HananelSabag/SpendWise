/**
 * OPTIMIZED Database Queries Utility
 * Simplified queries using optimized database functions and smart caching
 * @module utils/dbQueries_optimized
 */

const db = require('../config/db');
const logger = require('./logger');

// 🚀 Smart caching for dashboard data
class DashboardCache {
  static cache = new Map();
  static TTL = 2 * 60 * 1000; // 2 minutes for dashboard data
  static maxSize = 500; // Maximum cache entries

  static generateKey(userId, date = null) {
    const dateStr = date ? new Date(date).toISOString().split('T')[0] : 'today';
    return `dashboard:${userId}:${dateStr}`;
  }

  static get(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  static set(key, data) {
    // LRU eviction
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  static invalidateUser(userId) {
    for (const [key] of this.cache) {
      if (key.includes(`:${userId}:`)) {
        this.cache.delete(key);
      }
    }
  }

  static getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      utilization: Math.round((this.cache.size / this.maxSize) * 100)
    };
  }
}

class DBQueries {
  /**
   * 🚀 OPTIMIZED: Get dashboard data using new simplified approach
   */
  static async getDashboardData(userId, targetDate = new Date()) {
    const start = Date.now();
    const dateStr = targetDate instanceof Date ? 
      targetDate.toISOString().split('T')[0] : 
      new Date(targetDate).toISOString().split('T')[0];

    // Check cache first
    const cacheKey = DashboardCache.generateKey(userId, dateStr);
    const cached = DashboardCache.get(cacheKey);
    if (cached) {
      logger.debug('✅ Dashboard cache hit', { userId, date: dateStr });
      return cached;
    }

    try {
      logger.info('🔄 Fetching OPTIMIZED dashboard data...', { userId, date: dateStr });

      // Use our new optimized database function
      const summaryResult = await db.query(
        'SELECT * FROM get_dashboard_summary($1, $2)',
        [userId, dateStr],
        'get_dashboard_summary_optimized'
      );

      // Get recent transactions with optimized query
      const recentResult = await db.query(`
        SELECT 
          t.id, t.type, t.amount, t.description, t.date,
          COALESCE(c.name, 'General') as category_name,
          COALESCE(c.icon, 'tag') as category_icon,
          t.template_id, t.created_at
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = $1 AND t.deleted_at IS NULL
        ORDER BY t.date DESC, t.created_at DESC
        LIMIT 10
      `, [userId], 'get_recent_transactions_optimized');

      // Get user categories (cached query)
      const categoriesResult = await db.query(`
        SELECT id, name, icon, type
        FROM categories
        WHERE user_id = $1 OR user_id IS NULL
        ORDER BY is_default DESC, name ASC
      `, [userId], 'get_user_categories_optimized');

      const summary = summaryResult.rows[0] || {
        total_income: 0,
        total_expenses: 0,
        net_balance: 0,
        transaction_count: 0
      };

      const dashboardData = {
        // Main balance data
        daily_balance: {
          income: parseFloat(summary.total_income) || 0,
          expenses: parseFloat(summary.total_expenses) || 0,
          net: parseFloat(summary.net_balance) || 0
        },
        
        // Recent transactions
        recent_transactions: recentResult.rows || [],
        
        // User categories
        categories: categoriesResult.rows || [],
        
        // Metadata
        metadata: {
          date: dateStr,
          transaction_count: summary.transaction_count || 0,
          cached: false,
          query_time: Date.now() - start
        }
      };

      // Cache the result
      DashboardCache.set(cacheKey, dashboardData);

      const duration = Date.now() - start;
      logger.info('✅ OPTIMIZED dashboard data fetched', {
        userId,
        date: dateStr,
        duration: `${duration}ms`,
        transactions: dashboardData.recent_transactions.length,
        categories: dashboardData.categories.length,
        performance: duration < 100 ? 'excellent' : duration < 500 ? 'good' : 'slow'
      });

      return dashboardData;

    } catch (error) {
      const duration = Date.now() - start;
      logger.error('❌ OPTIMIZED dashboard data fetch failed', {
        userId,
        date: dateStr,
        duration: `${duration}ms`,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 🚀 OPTIMIZED: Get monthly summary using new database function
   */
  static async getMonthlySummary(userId, year, month) {
    const start = Date.now();

    try {
      const result = await db.query(
        'SELECT * FROM get_monthly_summary($1, $2, $3)',
        [userId, year, month],
        'get_monthly_summary_optimized'
      );

      const duration = Date.now() - start;
      logger.info('✅ OPTIMIZED monthly summary fetched', {
        userId, year, month,
        duration: `${duration}ms`,
        performance: duration < 50 ? 'excellent' : duration < 200 ? 'good' : 'slow'
      });

      return result.rows[0] || {
        total_income: 0,
        total_expenses: 0,
        net_balance: 0,
        avg_daily_balance: 0
      };

    } catch (error) {
      const duration = Date.now() - start;
      logger.error('❌ OPTIMIZED monthly summary fetch failed', {
        userId, year, month,
        duration: `${duration}ms`,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 🚀 OPTIMIZED: Simple user balance check
   */
  static async getUserBalance(userId, date = new Date()) {
    const dateStr = date instanceof Date ? 
      date.toISOString().split('T')[0] : 
      new Date(date).toISOString().split('T')[0];

    try {
      const result = await db.query(`
        SELECT 
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses
        FROM transactions
        WHERE user_id = $1
        AND date = $2
        AND deleted_at IS NULL
      `, [userId, dateStr], 'get_user_balance_optimized');

      const row = result.rows[0] || { total_income: 0, total_expenses: 0 };
      return {
        income: parseFloat(row.total_income) || 0,
        expenses: parseFloat(row.total_expenses) || 0,
        net: (parseFloat(row.total_income) || 0) - (parseFloat(row.total_expenses) || 0)
      };

    } catch (error) {
      logger.error('❌ User balance fetch failed', {
        userId, date: dateStr, error: error.message
      });
      throw error;
    }
  }

  /**
   * 📊 Get performance statistics
   */
  static getPerformanceStats() {
    return {
      dashboardCache: DashboardCache.getStats(),
      database: db.getPerformanceStats()
    };
  }

  /**
   * 🧹 Clear dashboard cache
   */
  static clearCache() {
    DashboardCache.cache.clear();
    logger.info('🧹 Dashboard cache cleared');
  }

  /**
   * 🔄 Invalidate cache for specific user
   */
  static invalidateUserCache(userId) {
    DashboardCache.invalidateUser(userId);
    logger.info('🔄 Dashboard cache invalidated for user', { userId });
  }
}

module.exports = { 
  DBQueries,
  DashboardCache
}; 