/**
 * Transaction Model - Production Ready
 * Handles all transaction-related database operations
 * @module models/Transaction
 */

const db = require('../config/db');
const DBQueries = require('../utils/dbQueries');
const errorCodes = require('../utils/errorCodes');
const logger = require('../utils/logger');

class Transaction {
  /**
   * Create a new transaction
   * @param {string} type - 'expense' or 'income'
   * @param {Object} data - Transaction data
   * @returns {Promise<Object>} Created transaction
   */
  static async create(type, data) {
    // Validate transaction type
    if (!['expense', 'income'].includes(type)) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Invalid transaction type' };
    }

    const {
      user_id,
      amount,
      description,
      date,
      category_id = null,
      template_id = null,
      notes = null
    } = data;

    // Validate required fields
    if (!user_id || !amount || !description || !date) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Missing required fields' };
    }

    if (amount <= 0) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Amount must be positive' };
    }

    try {
      const table = type === 'expense' ? 'expenses' : 'income';
      const query = `
        INSERT INTO ${table} (
          user_id, amount, description, date, 
          category_id, template_id, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING 
          id, amount, description, date,
          category_id, template_id, notes,
          created_at;
      `;

      const values = [
        user_id,
        amount,
        description,
        date,
        category_id,
        template_id,
        notes
      ];

      const result = await db.query(query, values, `create_${type}`);
      
      logger.info('Transaction created', {
        type,
        transactionId: result.rows[0].id,
        userId: user_id,
        amount
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Error creating transaction', {
        type,
        userId: user_id,
        error: error.message
      });

      if (error.code === '23505') {
        throw { ...errorCodes.ALREADY_EXISTS, details: 'Duplicate transaction detected' };
      }

      if (error.code === '23503') {
        if (error.constraint && error.constraint.includes('category')) {
          throw { ...errorCodes.VALIDATION_ERROR, details: 'Category not found or not accessible to user' };
        }
        throw { ...errorCodes.VALIDATION_ERROR, details: 'Invalid category or user reference' };
      }

      throw { ...errorCodes.SQL_ERROR, details: `Failed to create ${type}` };
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
    // Validate transaction type
    if (!['expense', 'income'].includes(type)) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Invalid transaction type' };
    }

    if (!id || !userId) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Transaction ID and User ID are required' };
    }

    const {
      amount,
      description,
      date,
      category_id,
      notes
    } = data;

    // Validate amount if provided
    if (amount !== undefined && amount <= 0) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Amount must be positive' };
    }

    try {
      const table = type === 'expense' ? 'expenses' : 'income';
      const query = `
        UPDATE ${table}
        SET 
          amount = COALESCE($1, amount),
          description = COALESCE($2, description),
          date = COALESCE($3, date),
          category_id = COALESCE($4, category_id),
          notes = COALESCE($5, notes),
          updated_at = NOW()
        WHERE id = $6 AND user_id = $7 AND deleted_at IS NULL
        RETURNING *;
      `;

      const values = [
        amount,
        description,
        date,
        category_id,
        notes,
        id,
        userId
      ];

      const result = await db.query(query, values, `update_${type}`);
      
      if (result.rows.length === 0) {
        throw { ...errorCodes.NOT_FOUND, message: 'Transaction not found or already deleted' };
      }

      logger.info('Transaction updated', {
        type,
        transactionId: id,
        userId,
        updates: Object.keys(data).filter(key => data[key] !== undefined)
      });

      return result.rows[0];
    } catch (error) {
      if (error.code === 'NOT_FOUND') throw error;
      
      logger.error('Error updating transaction', {
        type,
        transactionId: id,
        userId,
        error: error.message
      });

      if (error.code === '23503') {
        throw { ...errorCodes.VALIDATION_ERROR, details: 'Invalid category reference' };
      }

      throw { ...errorCodes.SQL_ERROR, details: `Failed to update ${type}` };
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
    // Validate transaction type
    if (!['expense', 'income'].includes(type)) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Invalid transaction type' };
    }

    if (!id || !userId) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Transaction ID and User ID are required' };
    }

    try {
      const table = type === 'expense' ? 'expenses' : 'income';
      const query = `
        UPDATE ${table}
        SET deleted_at = NOW()
        WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
        RETURNING id;
      `;

      const result = await db.query(query, [id, userId], `delete_${type}`);
      
      if (result.rows.length === 0) {
        throw { ...errorCodes.NOT_FOUND, message: 'Transaction not found or already deleted' };
      }

      logger.info('Transaction deleted', {
        type,
        transactionId: id,
        userId
      });

      return true;
    } catch (error) {
      if (error.code === 'NOT_FOUND') throw error;
      
      logger.error('Error deleting transaction', {
        type,
        transactionId: id,
        userId,
        error: error.message
      });

      throw { ...errorCodes.SQL_ERROR, details: `Failed to delete ${type}` };
    }
  }

  /**
   * Get dashboard data (replaces multiple methods)
   * @param {number} userId - User ID
   * @param {Date} date - Target date
   * @returns {Promise<Object>} Complete dashboard data
   */
  static async getDashboardData(userId, date = new Date()) {
    if (!userId) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'User ID is required' };
    }

    try {
      const dashboardData = await DBQueries.getDashboardData(userId, date);
      
      logger.debug('Dashboard data retrieved', {
        userId,
        targetDate: date,
        transactionCount: dashboardData.recent_transactions?.length || 0
      });

      return dashboardData;
    } catch (error) {
      logger.error('Error fetching dashboard data', {
        userId,
        targetDate: date,
        error: error.message
      });

      throw { ...errorCodes.FETCH_FAILED, details: 'Failed to fetch dashboard data' };
    }
  }

  /**
   * Get transactions with filters
   * @param {number} userId - User ID
   * @param {Object} options - Filter options
   * @returns {Promise<Object>} Transactions with pagination
   */
  static async getTransactions(userId, options = {}) {
    if (!userId) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'User ID is required' };
    }

    try {
      const result = await DBQueries.getTransactions(userId, options);
      
      logger.debug('Transactions retrieved', {
        userId,
        count: result.transactions?.length || 0,
        totalCount: result.totalCount || 0,
        filters: options
      });

      return result;
    } catch (error) {
      logger.error('Error fetching transactions', {
        userId,
        options,
        error: error.message
      });
      
      // Handle specific database errors
      if (error.code === '42702') {
        throw {
          ...errorCodes.SQL_ERROR,
          details: 'Database query contains ambiguous column references'
        };
      }
      
      throw { ...errorCodes.FETCH_FAILED, details: 'Failed to fetch transactions' };
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
    if (!userId) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'User ID is required' };
    }

    if (!searchTerm || searchTerm.trim().length < 2) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Search term must be at least 2 characters' };
    }

    try {
      const query = `SELECT * FROM search_transactions($1, $2, $3)`;
      const result = await db.query(query, [userId, searchTerm, limit], 'search_transactions');
      
      logger.debug('Transaction search completed', {
        userId,
        searchTerm,
        resultCount: result.rows.length
      });

      return result.rows;
    } catch (error) {
      logger.error('Error searching transactions', {
        userId,
        searchTerm,
        error: error.message
      });

      throw { ...errorCodes.SEARCH_FAILED, details: 'Failed to search transactions' };
    }
  }

  /**
   * Get statistics
   * @param {number} userId - User ID
   * @returns {Promise<Object>} User statistics
   */
  static async getStats(userId) {
    if (!userId) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'User ID is required' };
    }

    try {
      const query = `SELECT * FROM get_user_stats($1)`;
      const result = await db.query(query, [userId], 'get_user_stats');
      
      if (result.rows.length === 0) {
        // Return default stats if no data
        return {
          total_income: 0,
          total_expenses: 0,
          net_balance: 0,
          active_templates: 0,
          avg_daily_expense: 0,
          avg_daily_income: 0
        };
      }

      logger.debug('User statistics retrieved', {
        userId,
        netBalance: result.rows[0].net_balance
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Error fetching statistics', {
        userId,
        error: error.message
      });

      throw { ...errorCodes.STATS_FAILED, details: 'Failed to fetch statistics' };
    }
  }

  /**
   * Get transaction by ID
   * @param {string} type - 'expense' or 'income'
   * @param {number} id - Transaction ID
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} Transaction or null
   */
  static async getById(type, id, userId) {
    if (!['expense', 'income'].includes(type)) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Invalid transaction type' };
    }

    if (!id || !userId) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Transaction ID and User ID are required' };
    }

    try {
      const table = type === 'expense' ? 'expenses' : 'income';
      const query = `
        SELECT 
          t.*,
          c.name as category_name,
          c.icon as category_icon
        FROM ${table} t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.id = $1 AND t.user_id = $2 AND t.deleted_at IS NULL;
      `;

      const result = await db.query(query, [id, userId], `get_${type}_by_id`);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error fetching transaction by ID', {
        type,
        transactionId: id,
        userId,
        error: error.message
      });

      throw { ...errorCodes.FETCH_FAILED, details: `Failed to fetch ${type}` };
    }
  }

  /**
   * Get transactions by template ID
   * @param {number} templateId - Template ID
   * @param {number} userId - User ID
   * @param {number} limit - Result limit
   * @returns {Promise<Array>} Template transactions
   */
  static async getByTemplate(templateId, userId, limit = 10) {
    if (!templateId || !userId) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Template ID and User ID are required' };
    }

    try {
      const query = `
        SELECT 
          'expense' as type, e.id, e.amount, e.description, e.date, e.created_at,
          c.name as category_name, c.icon as category_icon
        FROM expenses e
        LEFT JOIN categories c ON e.category_id = c.id
        WHERE e.template_id = $1 AND e.user_id = $2 AND e.deleted_at IS NULL
        
        UNION ALL
        
        SELECT 
          'income' as type, i.id, i.amount, i.description, i.date, i.created_at,
          c.name as category_name, c.icon as category_icon
        FROM income i
        LEFT JOIN categories c ON i.category_id = c.id
        WHERE i.template_id = $1 AND i.user_id = $2 AND i.deleted_at IS NULL
        
        ORDER BY date DESC, created_at DESC
        LIMIT $3;
      `;

      const result = await db.query(query, [templateId, userId, limit], 'get_transactions_by_template');
      
      logger.debug('Template transactions retrieved', {
        templateId,
        userId,
        count: result.rows.length
      });

      return result.rows;
    } catch (error) {
      logger.error('Error fetching transactions by template', {
        templateId,
        userId,
        error: error.message
      });

      throw { ...errorCodes.FETCH_FAILED, details: 'Failed to fetch template transactions' };
    }
  }
}

module.exports = Transaction;