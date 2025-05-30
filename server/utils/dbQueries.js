/**
 * Database Queries Utility
 * Centralized location for all complex SQL queries
 * Optimized for single request architecture
 * @module utils/dbQueries
 */

const db = require('../config/db');

class DBQueries {
  /**
   * Get all dashboard data in a single query
   * Replaces 3 separate API calls with 1 optimized call
   * @param {number} userId - User ID
   * @param {Date} targetDate - Target date for calculations
   * @returns {Promise<Object>} Complete dashboard data
   */
  static async getDashboardData(userId, targetDate = new Date()) {
    const client = await db.pool.connect();
    
    try {
      // Normalize date to midnight
      targetDate.setHours(0, 0, 0, 0);
      
      const result = await client.query(`
        WITH date_params AS (
          SELECT 
            $2::date as target_date,
            DATE_TRUNC('week', $2::date) as week_start,
            DATE_TRUNC('month', $2::date) as month_start,
            DATE_TRUNC('year', $2::date) as year_start
        ),
        -- Recent transactions with smart limits
        recent_transactions AS (
          SELECT * FROM (
            SELECT 
              e.id,
              'expense' as type,
              e.amount,
              e.description,
              e.date,
              c.name as category_name,
              c.icon as category_icon,
              e.template_id,
              e.created_at
            FROM expenses e
            LEFT JOIN categories c ON e.category_id = c.id
            WHERE e.user_id = $1 
              AND e.deleted_at IS NULL
              AND e.date <= (SELECT target_date FROM date_params)
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
              c.name as category_name,
              c.icon as category_icon,
              i.template_id,
              i.created_at
            FROM income i
            LEFT JOIN categories c ON i.category_id = c.id
            WHERE i.user_id = $1 
              AND i.deleted_at IS NULL
              AND i.date <= (SELECT target_date FROM date_params)
            ORDER BY i.date DESC, i.created_at DESC
            LIMIT 10
          ) income_recent
        ),
        -- Balance calculations for all periods
        balance_data AS (
          SELECT 
            -- Daily
            (SELECT * FROM get_period_balance($1, 
              (SELECT target_date FROM date_params), 
              (SELECT target_date FROM date_params)
            )) as daily,
            -- Weekly
            (SELECT * FROM get_period_balance($1, 
              (SELECT week_start FROM date_params), 
              (SELECT target_date FROM date_params)
            )) as weekly,
            -- Monthly
            (SELECT * FROM get_period_balance($1, 
              (SELECT month_start FROM date_params), 
              (SELECT target_date FROM date_params)
            )) as monthly,
            -- Yearly
            (SELECT * FROM get_period_balance($1, 
              (SELECT year_start FROM date_params), 
              (SELECT target_date FROM date_params)
            )) as yearly
        ),
        -- Active recurring templates
        recurring_summary AS (
          SELECT 
            COUNT(*) FILTER (WHERE type = 'income') as income_count,
            COUNT(*) FILTER (WHERE type = 'expense') as expense_count,
            COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0) as recurring_income,
            COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) as recurring_expense
          FROM recurring_templates
          WHERE user_id = $1 AND is_active = true
        ),
        -- User stats
        user_stats AS (
          SELECT * FROM get_user_stats($1)
        ),
        -- Categories for quick expense
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
        -- Combine all results
        SELECT 
          -- Recent transactions
          (SELECT json_agg(t.* ORDER BY t.date DESC, t.created_at DESC) 
           FROM recent_transactions t) as recent_transactions,
          
          -- Balance data
          (SELECT row_to_json(daily) FROM balance_data) as daily_balance,
          (SELECT row_to_json(weekly) FROM balance_data) as weekly_balance,
          (SELECT row_to_json(monthly) FROM balance_data) as monthly_balance,
          (SELECT row_to_json(yearly) FROM balance_data) as yearly_balance,
          
          -- Recurring info
          (SELECT row_to_json(recurring_summary)) as recurring_info,
          
          -- User stats
          (SELECT row_to_json(user_stats)) as statistics,
          
          -- Categories
          (SELECT json_agg(c.*) FROM user_categories c) as categories,
          
          -- Metadata
          json_build_object(
            'calculated_at', NOW(),
            'target_date', (SELECT target_date FROM date_params),
            'periods', json_build_object(
              'week_start', (SELECT week_start FROM date_params),
              'month_start', (SELECT month_start FROM date_params),
              'year_start', (SELECT year_start FROM date_params)
            )
          ) as metadata;
      `, [userId, targetDate]);

      return result.rows[0];
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
      const conditions = ['user_id = $1', 'deleted_at IS NULL'];
      const values = [userId];
      let paramCount = 1;

      // Build dynamic conditions
      if (startDate) {
        paramCount++;
        conditions.push(`date >= $${paramCount}`);
        values.push(startDate);
      }
      
      if (endDate) {
        paramCount++;
        conditions.push(`date <= $${paramCount}`);
        values.push(endDate);
      }
      
      if (categoryId) {
        paramCount++;
        conditions.push(`category_id = $${paramCount}`);
        values.push(categoryId);
      }
      
      if (templateId !== null) {
        paramCount++;
        if (templateId === 0) {
          conditions.push('template_id IS NULL');
        } else {
          conditions.push(`template_id = $${paramCount}`);
          values.push(templateId);
        }
      }
      
      if (searchTerm) {
        paramCount++;
        conditions.push(`description ILIKE $${paramCount}`);
        values.push(`%${searchTerm}%`);
      }

      // Build queries for both tables
      const buildQuery = (table) => `
        SELECT 
          t.id,
          '${table.slice(0, -1)}' as type,
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