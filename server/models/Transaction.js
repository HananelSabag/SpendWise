/**
 * Transaction.js
 * Core transaction model handling CRUD operations, data retrieval, and balance calculations
 * Enhanced with improved recurring transaction support and balance calculations
 */

const db = require('../config/db');

class Transaction {
  /**
   * Get all transactions with filtering support
   * @param {string} type - Transaction type ('expense' or 'income')
   * @param {number} userId - User ID
   * @param {Object} filters - Filter options (startDate, endDate, category)
   * @returns {Promise<Array>} Filtered transactions
   */
  static async getAll(type, userId, filters = {}) {
    try {
      const table = type === 'expense' ? 'expenses' : 'income';
      const conditions = ['user_id = $1'];
      const values = [userId];
      let paramCount = 1;

      if (filters.startDate) {
        paramCount++;
        conditions.push(`date >= $${paramCount}`);
        values.push(filters.startDate);
      }
      if (filters.endDate) {
        paramCount++;
        conditions.push(`date <= $${paramCount}`);
        values.push(filters.endDate);
      }
      if (filters.category) {
        paramCount++;
        conditions.push(`category_id = $${paramCount}`);
        values.push(filters.category);
      }

      const query = `
        SELECT 
          t.*,
          c.name as category_name,
          c.icon as category_icon
        FROM ${table} t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE ${conditions.join(' AND ')}
          AND (t.recurring_status = 'active' OR t.recurring_status IS NULL)
          AND t.deleted_at IS NULL
        ORDER BY date DESC, created_at DESC
      `;
      
      const result = await db.query(query, values);
      return result.rows;
    } catch (error) {
      console.error(`Error getting ${type}:`, error);
      throw error;
    }
  }

  /**
   * Get transactions by period
   * @param {number} userId - User ID
   * @param {string} period - Time period ('day', 'week', 'month', 'year')
   * @param {Date} date - Target date
   * @returns {Promise<Array>} Period transactions
   */
  static async getByPeriod(userId, period, date = new Date()) {
    try {
      const startDate = new Date(date);
      let endDate = new Date(date);
      
      startDate.setHours(0,0,0,0);
      endDate.setHours(23,59,59,999);
      
      const query = `
        WITH combined_transactions AS (
          SELECT 
            t.*, 
            'expense' as transaction_type,
            c.name as category_name, 
            c.icon as category_icon,
            COALESCE(t.daily_amount, t.amount) as effective_amount
          FROM expenses t
          LEFT JOIN categories c ON t.category_id = c.id
          WHERE t.user_id = $1 
            AND t.date BETWEEN $2 AND $3
            AND (t.recurring_status = 'active' OR t.recurring_status IS NULL)
            AND t.deleted_at IS NULL
  
          UNION ALL
  
          SELECT 
            t.*, 
            'income' as transaction_type,
            c.name as category_name, 
            c.icon as category_icon,
            COALESCE(t.daily_amount, t.amount) as effective_amount
          FROM income t
          LEFT JOIN categories c ON t.category_id = c.id
          WHERE t.user_id = $1 
            AND t.date BETWEEN $2 AND $3
            AND (t.recurring_status = 'active' OR t.recurring_status IS NULL)
            AND t.deleted_at IS NULL
        )
        SELECT 
          *,
          CASE 
            WHEN is_recurring THEN
              CASE recurring_interval
                WHEN 'daily' THEN effective_amount
                WHEN 'weekly' THEN effective_amount / 7
                WHEN 'monthly' THEN effective_amount / EXTRACT(days FROM DATE_TRUNC('month', date) + INTERVAL '1 month - 1 day')
              END
            ELSE amount
          END as calculated_amount
        FROM combined_transactions
        ORDER BY date DESC, created_at DESC;
      `;
  
      const result = await db.query(query, [userId, startDate, endDate]);
      return result.rows;
    } catch (error) {
      console.error('Error getting period transactions:', error);
      throw error;
    }
  }

  /**
   * Get recent transactions up to a specific date
   * @param {number} userId - User ID
   * @param {number} limit - Maximum number of transactions to return
   * @param {Date} upToDate - Upper date limit
   * @returns {Promise<Array>} Recent transactions
   */
  static async getRecentTransactions(userId, limit = 5, upToDate = null) {
    try {
      let dateCondition = '';
      let values = [userId, limit];
  
      if (upToDate) {
        dateCondition = 'AND t.date <= $3';
        values = [userId, limit, upToDate];
      }
  
      const query = `
        WITH combined_recent AS (
          SELECT 
            t.*,
            'expense' as transaction_type,
            c.name as category_name,
            c.icon as category_icon,
            COALESCE(t.daily_amount, t.amount) as effective_amount
          FROM expenses t
          LEFT JOIN categories c ON t.category_id = c.id
          WHERE t.user_id = $1
            ${dateCondition}
            AND (t.recurring_status = 'active' OR t.recurring_status IS NULL)
            AND t.deleted_at IS NULL
          
          UNION ALL
          
          SELECT 
            t.*,
            'income' as transaction_type,
            c.name as category_name,
            c.icon as category_icon,
            COALESCE(t.daily_amount, t.amount) as effective_amount
          FROM income t
          LEFT JOIN categories c ON t.category_id = c.id
          WHERE t.user_id = $1
            ${dateCondition}
            AND (t.recurring_status = 'active' OR t.recurring_status IS NULL)
            AND t.deleted_at IS NULL
        )
        SELECT 
          *,
          CASE 
            WHEN is_recurring THEN
              CASE recurring_interval
                WHEN 'daily' THEN effective_amount
                WHEN 'weekly' THEN effective_amount / 7
                WHEN 'monthly' THEN effective_amount / EXTRACT(days FROM DATE_TRUNC('month', date) + INTERVAL '1 month - 1 day')
              END
            ELSE amount
          END as calculated_amount
        FROM combined_recent
        ORDER BY date DESC, created_at DESC
        LIMIT $2
      `;
  
      const result = await db.query(query, values);
      return result.rows;
    } catch (err) {
      console.error('Error in getRecentTransactions:', err);
      throw err;
    }
  }

  /**
   * Create new transaction with recurring support
   * @param {string} type - Transaction type ('expense' or 'income')
   * @param {Object} data - Transaction data
   * @returns {Promise<Object>} Created transaction
   */
  static async create(type, data) {
    const table = type === 'expense' ? 'expenses' : 'income';
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      const {
        user_id, amount, description, date,
        category_id = null,
        is_recurring = false,
        recurring_interval = null,
        recurring_end_date = null,
        custom_start_date = null
      } = data;

      // If recurring, use first day of month as default start date
const recurring_start_date = is_recurring
? custom_start_date || (() => {
    const firstOfMonth = new Date(date);
    firstOfMonth.setDate(1);
    return firstOfMonth.toISOString().split('T')[0]; // Returns YYYY-MM-DD
  })()
: null;

      const query = `
        INSERT INTO ${table} (
          user_id, amount, description, date,
          category_id, is_recurring, recurring_interval,
          recurring_amount, recurring_start_date,
          recurring_end_date, recurring_status,
          last_occurrence_date, last_processed_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *;
      `;

      const values = [
        user_id,
        amount,
        description,
        date,
        category_id,
        is_recurring,
        is_recurring ? recurring_interval : null,
        is_recurring ? amount : null,
        recurring_start_date,
        recurring_end_date,
        'active',
        is_recurring ? date : null,
        is_recurring ? new Date() : null
      ];

      const result = await client.query(query, values);
      
      // If recurring, generate first occurrence if needed
      if (is_recurring) {
        await client.query('SELECT generate_recurring_transactions()');
      }

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`Error creating ${type}:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update transaction with recurring support
   * @param {string} type - Transaction type ('expense' or 'income')
   * @param {number} id - Transaction ID
   * @param {number} userId - User ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Updated transaction
   */
  static async update(type, id, userId, data) {
    const table = type === 'expense' ? 'expenses' : 'income';
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      // Get current transaction
      const currentTxn = await client.query(
        `SELECT * FROM ${table} WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
        [id, userId]
      );

      if (!currentTxn.rows[0]) {
        throw new Error('Transaction not found');
      }

      const updateQuery = `
        UPDATE ${table}
        SET amount = $1,
            description = $2,
            date = $3,
            category_id = $4,
            is_recurring = $5,
            recurring_interval = $6,
            recurring_amount = $7,
            recurring_end_date = $8,
            recurring_start_date = $9,
            last_processed_date = $10,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $11 AND user_id = $12
        RETURNING *;
      `;

      const updateValues = [
        data.amount,
        data.description,
        data.date,
        data.category_id,
        data.is_recurring || false,
        data.is_recurring ? data.recurring_interval : null,
        data.is_recurring ? data.amount : null,
        data.recurring_end_date,
        data.custom_start_date || (data.is_recurring ? new Date(data.date).setDate(1) : null),
        data.is_recurring ? new Date() : null,
        id,
        userId
      ];

      const result = await client.query(updateQuery, updateValues);

      // Update future occurrences if requested
      if (data.updateFuture && currentTxn.rows[0].is_recurring) {
        await client.query(
          `UPDATE ${table}
           SET amount = $1,
               description = $2,
               category_id = $3,
               recurring_amount = $4,
               recurring_end_date = $5,
               recurring_start_date = $6,
               last_processed_date = $7
           WHERE (id = $8 OR parent_transaction_id = $8)
             AND date > $9
             AND recurring_status = 'active'
             AND deleted_at IS NULL`,
          [
            data.amount,
            data.description,
            data.category_id,
            data.amount,
            data.recurring_end_date,
            data.custom_start_date || new Date(data.date).setDate(1),
            new Date(),
            id,
            data.date
          ]
        );

        // Regenerate future occurrences
        await client.query('SELECT generate_recurring_transactions()');
      }

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get recurring transactions
   * @param {number} userId - User ID
   * @param {string} type - Optional transaction type filter
   * @returns {Promise<Array>} Recurring transactions
   */
  static async getRecurring(userId, type = null) {
    try {
      const baseQuery = `
        WITH recurring_transactions AS (
          SELECT 
            t.*,
            'expense' as transaction_type,
            c.name as category_name,
            c.icon as category_icon,
            COALESCE(t.daily_amount, t.amount) as effective_amount
          FROM expenses t
          LEFT JOIN categories c ON t.category_id = c.id
          WHERE t.user_id = $1 
            AND t.is_recurring = true
            AND t.recurring_status = 'active'
            AND t.deleted_at IS NULL
  
          UNION ALL
  
          SELECT 
            t.*,
            'income' as transaction_type,
            c.name as category_name,
            c.icon as category_icon,
            COALESCE(t.daily_amount, t.amount) as effective_amount
          FROM income t
          LEFT JOIN categories c ON t.category_id = c.id
          WHERE t.user_id = $1 
            AND t.is_recurring = true
            AND t.recurring_status = 'active'
            AND t.deleted_at IS NULL
        )
        SELECT 
          *,
          CASE recurring_interval
            WHEN 'daily' THEN effective_amount
            WHEN 'weekly' THEN effective_amount / 7
            WHEN 'monthly' THEN effective_amount / EXTRACT(days FROM DATE_TRUNC('month', date) + INTERVAL '1 month - 1 day')
          END as calculated_daily_amount
        FROM recurring_transactions
        ${type ? 'WHERE transaction_type = $2' : ''}
        ORDER BY next_recurrence_date ASC, date DESC
      `;
  
      const values = type ? [userId, type] : [userId];
      const result = await db.query(baseQuery, values);
      return result.rows;
    } catch (error) {
      console.error('Error getting recurring transactions:', error);
      throw error;
    }
  }

  /**
   * Skip specific occurrence of recurring transaction
   * @param {string} type - Transaction type
   * @param {number} id - Transaction ID
   * @param {number} userId - User ID
   * @param {string} skipDate - Date to skip
   * @returns {Promise<boolean>} Success status
   */
  static async skipOccurrence(type, id, userId, skipDate) {
    const table = type === 'expense' ? 'expenses' : 'income';
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const transaction = await client.query(
        `SELECT * FROM ${table} 
         WHERE id = $1 AND user_id = $2 
           AND is_recurring = true 
           AND recurring_status = 'active'
           AND deleted_at IS NULL`,
        [id, userId]
      );

      if (!transaction.rows[0]) {
        throw new Error('Recurring transaction not found');
      }

      await client.query(
        `UPDATE ${table}
         SET skip_dates = array_append(COALESCE(skip_dates, ARRAY[]::date[]), $1::date)
         WHERE id = $2 AND user_id = $3`,
        [skipDate, id, userId]
      );

      // Regenerate future occurrences
      await client.query('SELECT generate_recurring_transactions()');

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete transaction with recurring support
   * @param {string} type - Transaction type
   * @param {number} id - Transaction ID
   * @param {number} userId - User ID
   * @param {boolean} deleteFuture - Whether to delete future occurrences
   * @returns {Promise<boolean>} Success status
   */
  static async delete(type, id, userId, deleteFuture = false) {
    const table = type === 'expense' ? 'expenses' : 'income';
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      const currentTxn = await client.query(
        `SELECT * FROM ${table} WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
        [id, userId]
      );

      if (!currentTxn.rows[0]) {
        throw new Error('Transaction not found');
      }

      if (currentTxn.rows[0].is_recurring) {
        if (deleteFuture) {
          // Soft delete future occurrences
          await client.query(
            `UPDATE ${table}
             SET deleted_at = CURRENT_TIMESTAMP
             WHERE (id = $1 OR parent_transaction_id = $1)
               AND user_id = $2
               AND date > $3`,
            [id, userId, currentTxn.rows[0].date]
          );

          // Mark current as cancelled
          await client.query(
            `UPDATE ${table}
             SET recurring_status = 'cancelled',
                 recurring_end_date = $3,
                 deleted_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND user_id = $2`,
            [id, userId, currentTxn.rows[0].date]
          );
        } else {
          // Just mark as cancelled
          await client.query(
            `UPDATE ${table}
             SET recurring_status = 'cancelled',
                 recurring_end_date = CURRENT_DATE,
                 deleted_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND user_id = $2`,
            [id, userId]
          );
        }
      } else {
        // Soft delete for non-recurring
        await client.query(
          `UPDATE ${table}
           SET deleted_at = CURRENT_TIMESTAMP
           WHERE id = $1 AND user_id = $2`,
          [id, userId]
        );
      }

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get detailed balance calculations for all time periods
   * @param {number} userId - User ID
   * @param {Date} date - Target date
   * @param {Object} options - Additional options (weekStart, monthStart)
   * @returns {Promise<Object>} Detailed balance information
   */
  static async getDetailedBalance(userId, date, options = {}) {
    const client = await db.pool.connect();
    
    try {
      // Normalize the date
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      
      // Extract or calculate period start dates
      const weekStart = options.weekStart || new Date(targetDate);
      weekStart.setDate(targetDate.getDate() - targetDate.getDay()); // Start of week (Sunday)
      
      const monthStart = options.monthStart || new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      const yearStart = new Date(targetDate.getFullYear(), 0, 1);
      
      // Build calls to database functions
      const dailyQuery = 'SELECT * FROM get_daily_balance($1, $2)';
      const weeklyQuery = 'SELECT * FROM get_weekly_balance($1, $2)';
      const monthlyQuery = 'SELECT * FROM get_monthly_balance($1, $2)';
      const yearlyQuery = 'SELECT * FROM get_yearly_balance($1, $2)';
      
      // Execute all queries in parallel for better performance
      const [dailyResult, weeklyResult, monthlyResult, yearlyResult] = await Promise.all([
        client.query(dailyQuery, [userId, targetDate]),
        client.query(weeklyQuery, [userId, targetDate]),
        client.query(monthlyQuery, [userId, targetDate]),
        client.query(yearlyQuery, [userId, targetDate])
      ]);
      
      // Process and format the results
      const daily = dailyResult.rows[0] || { total_income: 0, total_expenses: 0, net_amount: 0 };
      const weekly = weeklyResult.rows[0] || { total_income: 0, total_expenses: 0, net_amount: 0 };
      const monthly = monthlyResult.rows[0] || { total_income: 0, total_expenses: 0, net_amount: 0 };
      const yearly = yearlyResult.rows[0] || { total_income: 0, total_expenses: 0, net_amount: 0 };
      
      // Format the response
      return {
        daily: {
          income: parseFloat(daily.total_income) || 0,
          expenses: parseFloat(daily.total_expenses) || 0,
          balance: parseFloat(daily.net_amount) || 0
        },
        weekly: {
          income: parseFloat(weekly.total_income) || 0,
          expenses: parseFloat(weekly.total_expenses) || 0,
          balance: parseFloat(weekly.net_amount) || 0
        },
        monthly: {
          income: parseFloat(monthly.total_income) || 0,
          expenses: parseFloat(monthly.total_expenses) || 0,
          balance: parseFloat(monthly.net_amount) || 0
        },
        yearly: {
          income: parseFloat(yearly.total_income) || 0,
          expenses: parseFloat(yearly.total_expenses) || 0,
          balance: parseFloat(yearly.net_amount) || 0
        },
        metadata: {
          calculatedAt: new Date().toISOString(),
          nextReset: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1).toISOString(),
          timePeriods: {
            daily: { start: targetDate, end: targetDate },
            weekly: { start: weekStart, end: targetDate },
            monthly: { start: monthStart, end: targetDate },
            yearly: { start: yearStart, end: targetDate }
          }
        }
      };
    } catch (error) {
      console.error('Error calculating detailed balance:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get balance history for a specific period
   * @param {number} userId - User ID
   * @param {string} period - Time period ('day', 'week', 'month', 'year')
   * @param {number} limit - Maximum number of periods to return
   * @returns {Promise<Array>} Balance history
   */
  static async getBalanceHistory(userId, period = 'month', limit = 12) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Calculate date range based on period
      const periods = [];
      
      // Generate the appropriate date ranges based on period type
      switch(period) {
        case 'day':
          // Last N days
          for (let i = 0; i < limit; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            periods.push(date);
          }
          break;
          
        case 'week':
          // Last N weeks
          for (let i = 0; i < limit; i++) {
            const date = new Date(today);
            // Get to the start of the current week (Sunday) and go back i weeks
            date.setDate(today.getDate() - (today.getDay() + i * 7));
            periods.push(date);
          }
          break;
          
        case 'month':
          // Last N months
          for (let i = 0; i < limit; i++) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            periods.push(date);
          }
          break;
          
        case 'year':
          // Last N years
          for (let i = 0; i < limit; i++) {
            const date = new Date(today.getFullYear() - i, 0, 1);
            periods.push(date);
          }
          break;
          
        default:
          throw new Error(`Invalid period: ${period}`);
      }
      
      // Get balance for each period - execute in parallel for better performance
      const results = await Promise.all(
        periods.map(async (date) => {
          try {
            // Choose appropriate SQL function based on period
            let query;
            switch(period) {
              case 'day':
                query = 'SELECT * FROM get_daily_balance($1, $2)';
                break;
              case 'week':
                query = 'SELECT * FROM get_weekly_balance($1, $2)';
                break;
              case 'month':
                query = 'SELECT * FROM get_monthly_balance($1, $2)';
                break;
              case 'year':
                query = 'SELECT * FROM get_yearly_balance($1, $2)';
                break;
            }
            
            const result = await db.query(query, [userId, date]);
            const data = result.rows[0] || { total_income: 0, total_expenses: 0, net_amount: 0 };
            
            // Format the result
            return {
              period: date.toISOString(),
              label: formatPeriodLabel(date, period),
              income: parseFloat(data.total_income) || 0,
              expenses: parseFloat(data.total_expenses) || 0,
              balance: parseFloat(data.net_amount) || 0
            };
          } catch (err) {
            console.error(`Error getting balance for period ${date.toISOString()}:`, err);
            // Return fallback data for this period
            return {
              period: date.toISOString(),
              label: formatPeriodLabel(date, period),
              income: 0,
              expenses: 0,
              balance: 0
            };
          }
        })
      );
      
      return results;
    } catch (error) {
      console.error('Error getting balance history:', error);
      throw error;
    }
  }

  /**
   * Get summary balance information
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Summary information
   */
  static async getSummary(userId) {
    try {
      // Get balance details for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get detailed balance information
      const balanceDetails = await this.getDetailedBalance(userId, today);
      
      // Get recurring transactions to calculate their impact
      const recurring = await this.getRecurring(userId);
      
      // Calculate the daily impact of all recurring transactions
      const recurringDailyImpact = recurring.reduce((acc, tx) => {
        const amount = Number(tx.calculated_daily_amount || 0);
        
        if (tx.transaction_type === 'income') {
          acc.income += amount;
        } else {
          acc.expense += amount;
        }
        
        acc.total = acc.income - acc.expense;
        return acc;
      }, { total: 0, income: 0, expense: 0 });
      
      return {
        balances: balanceDetails,
        recurring: {
          daily: recurringDailyImpact,
          count: recurring.length
        },
        lastCalculated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting summary:', error);
      throw error;
    }
  }
}

// Helper function to format period labels
function formatPeriodLabel(date, period) {
  const options = {};
  
  switch(period) {
    case 'day':
      options.weekday = 'short';
      options.day = 'numeric';
      break;
    case 'week':
      return `Week ${getWeekNumber(date)}`;
    case 'month':
      options.month = 'short';
      options.year = 'numeric';
      break;
    case 'year':
      options.year = 'numeric';
      break;
  }
  
  return date.toLocaleDateString('en-US', options);
}

// Helper function to get ISO week number
function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

module.exports = Transaction;