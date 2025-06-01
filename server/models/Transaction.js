/**
 * Transaction Model - Simplified Version
 * Works with new database structure and SQL functions
 * @module models/Transaction
 */

const db = require('../config/db');
const DBQueries = require('../utils/dbQueries');

class Transaction {
  /**
   * Create a new transaction
   * @param {string} type - 'expense' or 'income'
   * @param {Object} data - Transaction data
   * @returns {Promise<Object>} Created transaction
   */
  static async create(type, data) {
    const {
      user_id,
      amount,
      description,
      date,
      category_id = null,
      template_id = null
    } = data;

    try {
      const table = type === 'expense' ? 'expenses' : 'income';
      const query = `
        INSERT INTO ${table} (
          user_id, amount, description, date, 
          category_id, template_id
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING 
          id, amount, description, date,
          category_id, template_id,
          created_at;
      `;

      const values = [
        user_id,
        amount,
        description,
        date,
        category_id,
        template_id
      ];

      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error(`Error creating ${type}:`, error);
      throw {
        code: 'CREATE_FAILED',
        message: `Failed to create ${type}`,
        details: error.message
      };
    }
  }

  /**
   * Update a transaction
   * @param {string} type - 'expense' or 'income'
   * @param {number} id - Transaction ID
   * @param {number} userId - User ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Updated transaction
   */
  static async update(type, id, userId, data) {
    const {
      amount,
      description,
      date,
      category_id
    } = data;

    try {
      const table = type === 'expense' ? 'expenses' : 'income';
      const query = `
        UPDATE ${table}
        SET 
          amount = COALESCE($1, amount),
          description = COALESCE($2, description),
          date = COALESCE($3, date),
          category_id = COALESCE($4, category_id),
          updated_at = NOW()
        WHERE id = $5 AND user_id = $6 AND deleted_at IS NULL
        RETURNING *;
      `;

      const values = [
        amount,
        description,
        date,
        category_id,
        id,
        userId
      ];

      const result = await db.query(query, values);
      
      if (result.rows.length === 0) {
        throw {
          code: 'NOT_FOUND',
          message: 'Transaction not found'
        };
      }

      return result.rows[0];
    } catch (error) {
      if (error.code === 'NOT_FOUND') throw error;
      
      console.error(`Error updating ${type}:`, error);
      throw {
        code: 'UPDATE_FAILED',
        message: `Failed to update ${type}`,
        details: error.message
      };
    }
  }

  /**
   * Delete (soft delete) a transaction
   * @param {string} type - 'expense' or 'income'
   * @param {number} id - Transaction ID
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(type, id, userId) {
    try {
      const table = type === 'expense' ? 'expenses' : 'income';
      const query = `
        UPDATE ${table}
        SET deleted_at = NOW()
        WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
        RETURNING id;
      `;

      const result = await db.query(query, [id, userId]);
      
      if (result.rows.length === 0) {
        throw {
          code: 'NOT_FOUND',
          message: 'Transaction not found'
        };
      }

      return true;
    } catch (error) {
      if (error.code === 'NOT_FOUND') throw error;
      
      console.error(`Error deleting ${type}:`, error);
      throw {
        code: 'DELETE_FAILED',
        message: `Failed to delete ${type}`,
        details: error.message
      };
    }
  }

  /**
   * Get dashboard data (replaces multiple methods)
   * @param {number} userId - User ID
   * @param {Date} date - Target date
   * @returns {Promise<Object>} Complete dashboard data
   */
  static async getDashboardData(userId, date = new Date()) {
    try {
      return await DBQueries.getDashboardData(userId, date);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch dashboard data',
        details: error.message
      };
    }
  }

  /**
   * Get transactions with filters
   * @param {number} userId - User ID
   * @param {Object} options - Filter options
   * @returns {Promise<Object>} Transactions with pagination
   */
  static async getTransactions(userId, options = {}) {
    try {
      return await DBQueries.getTransactions(userId, options);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      
      // Handle specific database errors
      if (error.code === '42702') {
        throw {
          code: 'SQL_AMBIGUOUS_COLUMN',
          message: 'Database query contains ambiguous column references',
          details: error.message
        };
      }
      
      throw {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch transactions',
        details: error.message
      };
    }
  }

  /**
   * Search transactions
   * @param {number} userId - User ID
   * @param {string} searchTerm - Search term
   * @param {number} limit - Result limit
   * @returns {Promise<Array>} Search results
   */
  static async search(userId, searchTerm, limit = 50) {
    try {
      const query = `SELECT * FROM search_transactions($1, $2, $3)`;
      const result = await db.query(query, [userId, searchTerm, limit]);
      return result.rows;
    } catch (error) {
      console.error('Error searching transactions:', error);
      throw {
        code: 'SEARCH_FAILED',
        message: 'Failed to search transactions',
        details: error.message
      };
    }
  }

  /**
   * Get statistics
   * @param {number} userId - User ID
   * @returns {Promise<Object>} User statistics
   */
  static async getStats(userId) {
    try {
      const query = `SELECT * FROM get_user_stats($1)`;
      const result = await db.query(query, [userId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw {
        code: 'STATS_FAILED',
        message: 'Failed to fetch statistics',
        details: error.message
      };
    }
  }
}

module.exports = Transaction;