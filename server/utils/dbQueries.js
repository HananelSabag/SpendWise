/**
 * Database Queries Utility
 * Centralized location for all complex SQL queries
 * Optimized for single request architecture
 * @module utils/dbQueries
 */

const db = require('../config/db');
const TimeManager = require('./TimeManager');

class DBQueries {
  /**
   * Get all dashboard data in a single query - FIXED DATE LOGIC
   * Replaces 3 separate API calls with 1 optimized call
   * @param {number} userId - User ID
   * @param {Date} targetDate - Target date for calculations
   * @returns {Promise<Object>} Complete dashboard data
   */
  static async getDashboardData(userId, targetDate = new Date()) {
    const client = await db.pool.connect();

    try {
      // ✅ FIXED: Use TimeManager for consistent date formatting
      let dateStr;
      
      // Handle different date input formats using TimeManager
      if (targetDate instanceof Date) {
        dateStr = TimeManager.formatForDB(targetDate);
      } else if (typeof targetDate === 'string') {
        // Parse string and format consistently
        const parsedDate = new Date(targetDate);
        dateStr = TimeManager.formatForDB(parsedDate);
      } else {
        dateStr = TimeManager.formatForDB(new Date());
      }
      
      // ✅ CRITICAL FIX: Find the best date to use based on actual data
      const dataCheckResult = await client.query(`
        SELECT 
          COALESCE(
            CASE 
              WHEN EXISTS (
                SELECT 1 FROM daily_balances 
                WHERE user_id = $1 AND date = $2::date
              ) THEN $2::date
              ELSE COALESCE(
                (SELECT MAX(date) 
                 FROM daily_balances 
                 WHERE user_id = $1),
                $2::date
              )
            END,
            $2::date
          ) as effective_date,
          (SELECT MAX(date) FROM daily_balances WHERE user_id = $1) as latest_data_date,
          (SELECT MIN(date) FROM daily_balances WHERE user_id = $1) as earliest_data_date
      `, [userId, dateStr]);
      
      const effectiveDate = dataCheckResult.rows[0].effective_date;
      const latestDataDate = dataCheckResult.rows[0].latest_data_date;
      const earliestDataDate = dataCheckResult.rows[0].earliest_data_date;
      
      console.log(`📊 [DASHBOARD] User ${userId}: requested=${dateStr}, effective=${effectiveDate}, latest=${latestDataDate}`);
      
      const result = await client.query(`
      WITH date_params AS (
        SELECT 
          $2::date as target_date,
          $3::date as effective_date,
          DATE_TRUNC('week', $3::date) as week_start,
          DATE_TRUNC('month', $3::date) as month_start,
          DATE_TRUNC('year', $3::date) as year_start
      ),
      recent_transactions AS (
        SELECT * FROM (
          SELECT 
            e.id,
            'expense' as type,
            e.amount,
            e.description,
            e.date,
            COALESCE(c.name, 'General') as category_name,
            COALESCE(c.icon, 'tag') as category_icon,
            e.template_id,
            e.created_at
          FROM expenses e
          LEFT JOIN categories c ON e.category_id = c.id
          WHERE e.user_id = $1 
            AND e.deleted_at IS NULL
          ORDER BY e.date DESC, e.created_at DESC
          LIMIT 10
        ) expenses_recent
        
        UNION ALL
        
        SELECT * FROM (
          SELECT 
            i.id,
            'income' as type,
            i.amount,
            i.description,
            i.date,
            COALESCE(c.name, 'General') as category_name,
            COALESCE(c.icon, 'tag') as category_icon,
            i.template_id,
            i.created_at
          FROM income i
          LEFT JOIN categories c ON i.category_id = c.id
          WHERE i.user_id = $1 
            AND i.deleted_at IS NULL
          ORDER BY i.date DESC, i.created_at DESC
          LIMIT 10
        ) income_recent
      ),
      balance_data AS (
        SELECT 
          get_period_balance($1, (SELECT effective_date FROM date_params), (SELECT effective_date FROM date_params)) as daily,
          get_period_balance($1, (SELECT week_start FROM date_params), (SELECT week_start FROM date_params) + INTERVAL '6 days') as weekly,
          get_period_balance($1, (SELECT month_start FROM date_params), (SELECT month_start FROM date_params) + INTERVAL '1 month' - INTERVAL '1 day') as monthly,
          get_period_balance($1, (SELECT year_start FROM date_params), (SELECT year_start FROM date_params) + INTERVAL '1 year' - INTERVAL '1 day') as yearly
      ),
      daily_average_data AS (
        -- For daily average calculation: divide monthly recurring by 30
        SELECT 
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) / 30.0 as avg_income,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) / 30.0 as avg_expenses,
          (COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) - 
           COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)) / 30.0 as avg_balance
        FROM recurring_templates 
        WHERE user_id = $1 AND is_active = true AND interval_type = 'monthly'
      ),
      recurring_summary AS (
        SELECT 
          COUNT(*) FILTER (WHERE type = 'income') as income_count,
          COUNT(*) FILTER (WHERE type = 'expense') as expense_count,
          COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0) as recurring_income,
          COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) as recurring_expense
        FROM recurring_templates
        WHERE user_id = $1 AND is_active = true
      ),
      user_stats AS (
        SELECT 0 as placeholder
      ),
      user_categories AS (
        SELECT 
          id,
          name,
          icon,
          type
        FROM categories
        WHERE type = 'expense' OR type IS NULL
        ORDER BY is_default DESC, name ASC
      )
      SELECT 
        (SELECT json_agg(t.* ORDER BY t.date DESC, t.created_at DESC) 
         FROM recent_transactions t) as recent_transactions,
        -- Daily balance (use averages if available, otherwise actual balance)
        bd.daily as daily_balance,
        bd.weekly as weekly_balance,
        bd.monthly as monthly_balance,
        bd.yearly as yearly_balance,
        (SELECT row_to_json(r) FROM recurring_summary r) as recurring_info,
        (SELECT json_build_object('placeholder', u.placeholder) FROM user_stats u) as statistics,
        (SELECT json_agg(c.*) FROM user_categories c) as categories,
        (SELECT row_to_json(d) FROM daily_average_data d) as daily_averages,
        json_build_object(
          'calculated_at', NOW(),
          'target_date', (SELECT target_date FROM date_params),
          'effective_date', (SELECT effective_date FROM date_params),
          'data_available', $4::date IS NOT NULL,
          'periods', json_build_object(
            'week_start', (SELECT week_start FROM date_params),
            'month_start', (SELECT month_start FROM date_params),
            'year_start', (SELECT year_start FROM date_params)
          )
        ) as metadata
      FROM balance_data bd, daily_average_data dad`, [userId, dateStr, effectiveDate, latestDataDate]);

      // Process the balance data - convert from string tuple to JSON object
      const processBalanceData = (balanceStr) => {
        // Check if the balance is already an object
        if (typeof balanceStr === 'object' && balanceStr !== null) {
          return balanceStr;
        }
        
        // Handle string tuple format "(income,expenses,balance)"
        if (typeof balanceStr === 'string' && balanceStr.startsWith('(') && balanceStr.endsWith(')')) {
          const values = balanceStr.substring(1, balanceStr.length - 1).split(',').map(Number);
          return {
            income: values[0] || 0,
            expenses: values[1] || 0,
            balance: values[2] || 0
          };
        }
        
        // Default fallback
        return { income: 0, expenses: 0, balance: 0 };
      };

      const dashboardData = result.rows[0];
      
      // Process all balance data
      // Use daily averages if available, otherwise use actual daily balance
      const dailyAverages = dashboardData.daily_averages;
      if (dailyAverages && (dailyAverages.avg_income > 0 || dailyAverages.avg_expenses > 0)) {
        dashboardData.daily_balance = {
          income: Math.round(dailyAverages.avg_income * 100) / 100,
          expenses: Math.round(dailyAverages.avg_expenses * 100) / 100,
          balance: Math.round(dailyAverages.avg_balance * 100) / 100
        };
      } else {
        dashboardData.daily_balance = processBalanceData(dashboardData.daily_balance);
      }
      
      dashboardData.weekly_balance = processBalanceData(dashboardData.weekly_balance);
      dashboardData.monthly_balance = processBalanceData(dashboardData.monthly_balance);
      dashboardData.yearly_balance = processBalanceData(dashboardData.yearly_balance);
      
      // Remove internal data
      delete dashboardData.daily_averages;
      
      return dashboardData;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get transactions for a specific period with pagination
   * @param {number} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Transactions with metadata
   */
  static async getTransactions(userId, options = {}) {
    const {
      type = null,
      startDate = null,
      endDate = null,
      categoryId = null,
      templateId = null,
      searchTerm = null,
      page = 1,
      limit = 50,
      sortBy = 'date',
      sortOrder = 'DESC'
    } = options;

    try {
      const offset = (page - 1) * limit;
      const conditions = ['t.user_id = $1', 't.deleted_at IS NULL']; // ✅ Fix: specify table alias
      const values = [userId];
      let paramCount = 1;

      // Build dynamic conditions - ✅ All with table aliases
      if (startDate) {
        paramCount++;
        conditions.push(`t.date >= $${paramCount}`);
        values.push(startDate);
      }

      if (endDate) {
        paramCount++;
        conditions.push(`t.date <= $${paramCount}`);
        values.push(endDate);
      }

      if (categoryId) {
        paramCount++;
        conditions.push(`t.category_id = $${paramCount}`);
        values.push(categoryId);
      }

      if (templateId !== null) {
        paramCount++;
        if (templateId === 0) {
          conditions.push('t.template_id IS NULL');
        } else {
          conditions.push(`t.template_id = $${paramCount}`);
          values.push(templateId);
        }
      }

      if (searchTerm) {
        paramCount++;
        conditions.push(`t.description ILIKE $${paramCount}`);
        values.push(`%${searchTerm}%`);
      }

      // Build queries for both tables - ✅ Fix table aliases throughout
      const buildQuery = (table) => `
        SELECT 
          t.id,
          '${table === 'expenses' ? 'expense' : 'income'}' as transaction_type,
          t.amount,
          t.description,
          t.date,
          t.category_id,
          c.name as category_name,
          c.icon as category_icon,
          t.template_id,
          rt.interval_type as recurring_interval,
          t.created_at,
          t.updated_at
        FROM ${table} t
        LEFT JOIN categories c ON t.category_id = c.id
        LEFT JOIN recurring_templates rt ON t.template_id = rt.id
        WHERE ${conditions.join(' AND ')}
      `;

      // Get transactions based on type
      let query;
      if (type === 'expense') {
        query = buildQuery('expenses');
      } else if (type === 'income') {
        query = buildQuery('income');
      } else {
        query = `
          ${buildQuery('expenses')}
          UNION ALL
          ${buildQuery('income')}
        `;
      }

      // Add sorting and pagination
      const finalQuery = `
        WITH transactions AS (${query})
        SELECT 
          *,
          COUNT(*) OVER() as total_count
        FROM transactions
        ORDER BY ${sortBy} ${sortOrder}, created_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;

      values.push(limit, offset);

      const result = await db.query(finalQuery, values);

      const totalCount = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
      const transactions = result.rows.map(row => {
        const { total_count, ...transaction } = row;
        return transaction;
      });

      return {
        transactions,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  /**
   * Get monthly statistics for charts
   * @param {number} userId - User ID
   * @param {number} months - Number of months to fetch
   * @returns {Promise<Array>} Monthly statistics
   */
  static async getMonthlyStats(userId, months = 12) {
    try {
      const query = `
        WITH months AS (
          SELECT 
            DATE_TRUNC('month', CURRENT_DATE - (n || ' months')::interval) as month_start,
            DATE_TRUNC('month', CURRENT_DATE - (n || ' months')::interval) + INTERVAL '1 month - 1 day' as month_end
          FROM generate_series(0, $2 - 1) as n
        )
        SELECT 
          m.month_start as month,
          COALESCE(SUM(e.amount), 0) as expenses,
          COALESCE(SUM(i.amount), 0) as income,
          COALESCE(SUM(i.amount), 0) - COALESCE(SUM(e.amount), 0) as balance
        FROM months m
        LEFT JOIN expenses e ON 
          e.user_id = $1 
          AND e.date BETWEEN m.month_start AND m.month_end
          AND e.deleted_at IS NULL
        LEFT JOIN income i ON 
          i.user_id = $1 
          AND i.date BETWEEN m.month_start AND m.month_end
          AND i.deleted_at IS NULL
        GROUP BY m.month_start
        ORDER BY m.month_start DESC;
      `;

      const result = await db.query(query, [userId, months]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching monthly stats:', error);
      throw error;
    }
  }

  /**
   * Get category breakdown for a period
   * @param {number} userId - User ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Category breakdown
   */
  static async getCategoryBreakdown(userId, startDate, endDate) {
    try {
      const query = `
        SELECT 
          c.id,
          c.name,
          c.icon,
          c.type,
          COALESCE(SUM(e.amount), 0) as expense_amount,
          COALESCE(SUM(i.amount), 0) as income_amount,
          COUNT(DISTINCT e.id) as expense_count,
          COUNT(DISTINCT i.id) as income_count
        FROM categories c
        LEFT JOIN expenses e ON 
          c.id = e.category_id 
          AND e.user_id = $1 
          AND e.date BETWEEN $2 AND $3
          AND e.deleted_at IS NULL
        LEFT JOIN income i ON 
          c.id = i.category_id 
          AND i.user_id = $1 
          AND i.date BETWEEN $2 AND $3
          AND i.deleted_at IS NULL
        GROUP BY c.id, c.name, c.icon, c.type
        HAVING COALESCE(SUM(e.amount), 0) > 0 OR COALESCE(SUM(i.amount), 0) > 0
        ORDER BY 
          CASE c.type 
            WHEN 'expense' THEN COALESCE(SUM(e.amount), 0)
            WHEN 'income' THEN COALESCE(SUM(i.amount), 0)
            ELSE COALESCE(SUM(e.amount), 0) + COALESCE(SUM(i.amount), 0)
          END DESC;
      `;

      const result = await db.query(query, [userId, startDate, endDate]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching category breakdown:', error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = DBQueries;