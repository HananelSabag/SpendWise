const db = require('../config/db');

class Transaction {
  // Get all transactions by type and filters
  static async getAll(type, userId, filters = {}) {
    try {
      const table = type === 'expense' ? 'expenses' : 'income';
      const conditions = ['user_id = $1'];
      const values = [userId];

      if (filters.startDate) {
        conditions.push('date >= $2');
        values.push(filters.startDate);
      }
      if (filters.endDate) {
        conditions.push('date <= $3');
        values.push(filters.endDate);
      }
      if (filters.category) {
        conditions.push('category_id = $4');
        values.push(filters.category);
      }

      const query = `
        SELECT * FROM ${table}
        WHERE ${conditions.join(' AND ')}
        ORDER BY date DESC, created_at DESC
      `;
      const result = await db.query(query, values);
      return result.rows;
    } catch (error) {
      console.error(`Error getting ${type}:`, error);
      throw error;
    }
  }

  // Get summary of transactions
  static async getSummary(userId) {
    try {
      const query = `
        SELECT 
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expenses
        FROM (
          SELECT 'income' AS type, amount, date FROM income WHERE user_id = $1
          UNION ALL
          SELECT 'expense' AS type, amount, date FROM expenses WHERE user_id = $1
        ) AS transactions;
      `;
      const result = await db.query(query, [userId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting summary:', error);
      throw error;
    }
  }

  // Get detailed balance calculations
  static async getDetailedBalance(userId, targetDate = new Date()) {
    try {
      const dailyBalance = await db.query(
        'SELECT * FROM get_daily_balance($1, $2::date)',
        [userId, targetDate]
      );
  
      const weeklyBalance = await db.query(
        'SELECT * FROM get_weekly_balance($1, $2::date)',
        [userId, targetDate]
      );
  
      const monthlyBalance = await db.query(
        'SELECT * FROM get_monthly_balance($1, $2::date)',
        [userId, targetDate]
      );
  
      const yearlyBalance = await db.query(
        'SELECT * FROM get_yearly_balance($1, $2::date)',
        [userId, targetDate]
      );
  
      const now = new Date(targetDate);
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay(), 0, 0, 0, 0);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
  
      return {
        daily: {
          income: Number(dailyBalance.rows[0]?.total_income || 0),
          expenses: Number(dailyBalance.rows[0]?.total_expenses || 0),
          balance: Number(dailyBalance.rows[0]?.net_amount || 0)
        },
        weekly: {
          income: Number(weeklyBalance.rows[0]?.total_income || 0),
          expenses: Number(weeklyBalance.rows[0]?.total_expenses || 0),
          balance: Number(weeklyBalance.rows[0]?.net_amount || 0)
        },
        monthly: {
          income: Number(monthlyBalance.rows[0]?.total_income || 0),
          expenses: Number(monthlyBalance.rows[0]?.total_expenses || 0),
          balance: Number(monthlyBalance.rows[0]?.net_amount || 0)
        },
        yearly: {
          income: Number(yearlyBalance.rows[0]?.total_income || 0),
          expenses: Number(yearlyBalance.rows[0]?.total_expenses || 0),
          balance: Number(yearlyBalance.rows[0]?.net_amount || 0)
        },
        metadata: {
          calculatedAt: new Date(targetDate).toISOString(),
          nextReset: new Date(
            targetDate.getFullYear(),
            targetDate.getMonth(), 
            targetDate.getDate() + 1,
            0, 0, 0, 0
          ).toISOString(),
          timePeriods: {
            daily: {
              start: startOfDay.toISOString(),
              end: new Date(targetDate).toISOString()
            },
            weekly: {
              start: startOfWeek.toISOString(),
              end: new Date(targetDate).toISOString()
            },
            monthly: {
              start: startOfMonth.toISOString(),
              end: new Date(targetDate).toISOString()
            },
            yearly: {
              start: startOfYear.toISOString(),
              end: new Date(targetDate).toISOString()
            }
          }
        }
      };
    } catch (error) {
      console.error('Error calculating detailed balance:', error);
      throw error;
    }
  }

  static async create(type, data) {
    const table = type === 'expense' ? 'expenses' : 'income';
    const {
      user_id, amount, description, date,
      category_id = null,
      is_recurring = false,
      recurring_interval = null,
      recurring_amount = null
    } = data;
  
    try {
      const query = `
        INSERT INTO ${table} (
          user_id, amount, description, date, category_id,
          is_recurring, recurring_interval, recurring_amount
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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
        is_recurring ? recurring_amount : null
      ];
  
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error(`Error creating ${type}:`, error);
      throw error;
    }
  }

  // Update transaction
  static async update(type, id, userId, data) {
    const table = type === 'expense' ? 'expenses' : 'income';
    const { amount, description, date, category_id, is_recurring, recurring_interval, recurring_amount } = data;

    try {
      const query = `
        UPDATE ${table}
        SET amount = $1, description = $2, date = $3, category_id = $4,
            is_recurring = $5, recurring_interval = $6, recurring_amount = $7,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $8 AND user_id = $9
        RETURNING *;
      `;
      const values = [
        amount, description, date, category_id,
        is_recurring, recurring_interval, recurring_amount,
        id, userId
      ];
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error(`Error updating ${type}:`, error);
      throw error;
    }
  }

  // Delete transaction
  static async delete(type, id, userId) {
    const table = type === 'expense' ? 'expenses' : 'income';

    try {
      const query = `DELETE FROM ${table} WHERE id = $1 AND user_id = $2 RETURNING *;`;
      const result = await db.query(query, [id, userId]);
      return result.rowCount > 0;
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      throw error;
    }
  }

  // Get transactions by period
  static async getByPeriod(userId, period, date = new Date()) {
    try {
      const startDate = new Date(date);
      let endDate = new Date(date);
      
      startDate.setHours(0,0,0,0);
      endDate.setHours(23,59,59,999);
      
      const query = `
        SELECT 
          t.*, 
          'expense' as transaction_type,
          c.name as category_name, 
          c.icon as category_icon
        FROM expenses t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = $1 AND t.date BETWEEN $2 AND $3
  
        UNION ALL
  
        SELECT 
          t.*, 
          'income' as transaction_type,
          c.name as category_name, 
          c.icon as category_icon
        FROM income t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = $1 AND t.date BETWEEN $2 AND $3
        
        ORDER BY date DESC, created_at DESC;
      `;
  
      const result = await db.query(query, [userId, startDate, endDate]);
      return result.rows;
    } catch (error) {
      console.error('Error getting period transactions:', error);
      throw error;
    }
  }
  
// Get balance history
static async getBalanceHistory(userId, period = 'month', limit = 12) {
  try {
    const query = `
      WITH dates AS (
        SELECT generate_series(
          date_trunc($1, CURRENT_DATE) - ($2 || ' ' || $1)::interval,
          date_trunc($1, CURRENT_DATE),
          '1 ' || $1
        )::date as date
      )
      SELECT 
        d.date,
        COALESCE(b.total_income, 0) as income,
        COALESCE(b.total_expenses, 0) as expenses,
        COALESCE(b.net_amount, 0) as balance
      FROM dates d
      LEFT JOIN LATERAL (
        SELECT * FROM get_monthly_balance($3, d.date)
      ) b ON true
      ORDER BY d.date DESC;
    `;
    
    const result = await db.query(query, [period, limit - 1, userId]);
    return result.rows;
  } catch (error) {
    console.error('Error getting balance history:', error);
    throw error;
  }
}
static async getRecentTransactions(userId, limit = 5) {
  try {
    const query = `
      (
        SELECT 
          t.id,
          t.amount,
          t.description,
          t.date,
          t.created_at,
          t.category_id,
          t.is_recurring,
          t.recurring_interval,
          'expense' as transaction_type,
          c.name as category_name, 
          c.icon as category_icon
        FROM expenses t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = $1
      )
      UNION ALL
      (
        SELECT 
          t.id,
          t.amount,
          t.description,
          t.date,
          t.created_at,
          t.category_id,
          t.is_recurring,
          t.recurring_interval,
          'income' as transaction_type,
          c.name as category_name, 
          c.icon as category_icon
        FROM income t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = $1
      )
      ORDER BY date DESC, created_at DESC
      LIMIT $2;
    `;

    const result = await db.query(query, [userId, limit]);
    return result.rows;
  } catch (error) {
    console.error('Error getting recent transactions:', error);
    throw error;
  }
}
  
}

module.exports = Transaction;