/**
 * 💰 TRANSACTION MODEL - CLEAN & ALIGNED WITH DATABASE
 * Simplified model that matches actual database schema
 * Features: Basic CRUD operations, Database schema alignment, Clean code
 * @version 4.0.0 - SIMPLIFIED & FIXED
 */

const db = require('../config/db');
const errorCodes = require('../utils/errorCodes');
const logger = require('../utils/logger');

/**
 * 💰 Transaction Model - Simple & Aligned with Database Schema
 * 
 * Database Schema (ACTUAL):
 * - id (integer, primary key)
 * - user_id (integer, foreign key)
 * - category_id (integer, foreign key, nullable)
 * - amount (numeric, required)
 * - type (varchar: 'income' or 'expense', required)
 * - description (text, nullable)
 * - notes (text, nullable)
 * - date (date, required)
 * - template_id (integer, foreign key, nullable)
 * - created_at (timestamp)
 * - updated_at (timestamp)
 * - deleted_at (timestamp, nullable)
 */
class Transaction {

  /**
   * Create a new transaction - TIMEZONE AWARE VERSION
   * @param {Object} transactionData - Transaction data
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Created transaction
   */
  static async create(transactionData, userId) {
    try {
      // ✅ NEW: Handle timezone-aware transaction datetime
      const transactionDateTime = transactionData.transaction_datetime || 
                                  transactionData.date ? new Date(`${transactionData.date}T12:00:00Z`).toISOString() :
                                  new Date().toISOString();

      const query = `
        INSERT INTO transactions (
          user_id, category_id, amount, type, description, notes, date, transaction_datetime, template_id, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::timestamptz, $9, NOW(), NOW())
        RETURNING id, user_id, category_id, amount, type, description, notes, date, transaction_datetime, template_id, created_at, updated_at
      `;

      const values = [
        userId,
        transactionData.categoryId || null,
        parseFloat(transactionData.amount),
        transactionData.type,
        transactionData.description || '',
        transactionData.notes || '',
        transactionData.date || new Date().toISOString().split('T')[0], // Keep for backward compatibility
        transactionDateTime, // ✅ NEW: User's intended datetime with timezone
        transactionData.templateId || null
      ];

      const result = await db.query(query, values);
      const transaction = result.rows[0];

      logger.info('Transaction created successfully', { 
        transactionId: transaction.id, 
        userId, 
        amount: transaction.amount,
        type: transaction.type,
        datetime: transaction.transaction_datetime,
        timezone: transactionData.timezone || 'unknown'
      });

      return transaction;
    } catch (error) {
      logger.error('Transaction creation failed', { error: error.message, transactionData, userId });
      throw error;
    }
  }

  /**
   * Get transactions for a user with filters
   * @param {number} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Transactions
   */
  static async findByUser(userId, options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        categoryId = null,
        type = null,
        dateFrom = null,
        dateTo = null,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = options;

      // Build dynamic query
      const conditions = ['t.user_id = $1', '(t.deleted_at IS NULL)'];
      const values = [userId];
      let paramCount = 2;

      if (categoryId) {
        conditions.push(`t.category_id = $${paramCount}`);
        values.push(categoryId);
        paramCount++;
      }

      if (type) {
        conditions.push(`t.type = $${paramCount}`);
        values.push(type);
        paramCount++;
      }

      if (dateFrom) {
        conditions.push(`t.date >= $${paramCount}`);
        values.push(dateFrom);
        paramCount++;
      }

      if (dateTo) {
        conditions.push(`t.date <= $${paramCount}`);
        values.push(dateTo);
        paramCount++;
      }

      const whereClause = conditions.join(' AND ');
      const orderClause = `ORDER BY t.${sortBy} ${sortOrder}`;
      const limitClause = `LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      
      values.push(limit, offset);

      // ✅ FIXED: Use current database schema (income/expenses tables)
      const incomeQuery = `
        SELECT 
          i.id,
          i.user_id,
          i.category_id,
          i.amount,
          'income' as type,
          i.description,
          i.notes,
          i.date,
          i.created_at as transaction_datetime,
          i.template_id,
          i.created_at,
          i.updated_at,
          c.name as category_name,
          c.icon as category_icon,
          c.color as category_color
        FROM income i
        LEFT JOIN categories c ON i.category_id = c.id
        WHERE ${whereClause.replace(/t\./g, 'i.')}
      `;

      const expensesQuery = `
        SELECT 
          e.id,
          e.user_id,
          e.category_id,
          e.amount,
          'expense' as type,
          e.description,
          e.notes,
          e.date,
          e.created_at as transaction_datetime,
          e.template_id,
          e.created_at,
          e.updated_at,
          c.name as category_name,
          c.icon as category_icon,
          c.color as category_color
        FROM expenses e
        LEFT JOIN categories c ON e.category_id = c.id
        WHERE ${whereClause.replace(/t\./g, 'e.')}
      `;

      const query = `
        (${incomeQuery})
        UNION ALL
        (${expensesQuery})
        ${orderClause.replace(/t\./g, '')}
        ${limitClause}
      `;

      const result = await db.query(query, values);
      return result.rows;
    } catch (error) {
      logger.error('Transaction retrieval failed', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get recent transactions for dashboard
   * @param {number} userId - User ID
   * @param {number} limit - Number of transactions
   * @returns {Promise<Array>} Recent transactions
   */
  static async getRecent(userId, limit = 10) {
    try {
      // ✅ FIXED: Use current database schema (income/expenses tables)
      const query = `
        (
          SELECT 
            i.id,
            i.amount,
            'income' as type,
            i.description,
            i.date,
            i.created_at,
            c.name as category_name,
            c.icon as category_icon,
            c.color as category_color
          FROM income i
          LEFT JOIN categories c ON i.category_id = c.id
          WHERE i.user_id = $1 AND (i.deleted_at IS NULL)
        )
        UNION ALL
        (
          SELECT 
            e.id,
            e.amount,
            'expense' as type,
            e.description,
            e.date,
            e.created_at,
            c.name as category_name,
            c.icon as category_icon,
            c.color as category_color
          FROM expenses e
          LEFT JOIN categories c ON e.category_id = c.id
          WHERE e.user_id = $1 AND (e.deleted_at IS NULL)
        )
        ORDER BY created_at DESC
        LIMIT $2
      `;

      const result = await db.query(query, [userId, limit]);
      return result.rows;
    } catch (error) {
      logger.error('Recent transactions retrieval failed', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Find transaction by ID
   * @param {number} transactionId - Transaction ID
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} Transaction or null
   */
  static async findById(transactionId, userId) {
    try {
      const query = `
        SELECT 
          t.id,
          t.user_id,
          t.category_id,
          t.amount,
          t.type,
          t.description,
          t.notes,
          t.date,
          t.template_id,
          t.created_at,
          t.updated_at,
          c.name as category_name,
          c.icon as category_icon,
          c.color as category_color
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.id = $1 AND t.user_id = $2 AND (t.deleted_at IS NULL)
      `;
      
      const result = await db.query(query, [transactionId, userId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Transaction find by ID failed', { transactionId, userId, error: error.message });
      throw error;
    }
  }

  /**
   * Update transaction
   * @param {number} transactionId - Transaction ID
   * @param {Object} updateData - Data to update
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Updated transaction
   */
  static async update(transactionId, updateData, userId) {
    try {
      // First check if transaction exists and belongs to user
      const existing = await this.findById(transactionId, userId);
      if (!existing) {
        throw new Error('Transaction not found');
      }

      const allowedFields = ['category_id', 'amount', 'description', 'type', 'notes', 'date'];
      const updates = {};
      const values = [];
      let paramCount = 1;

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key) && value !== undefined) {
          updates[key] = `$${paramCount}`;
            values.push(value);
          paramCount++;
        }
      }

      if (Object.keys(updates).length === 0) {
        throw new Error('No valid fields to update');
      }

      updates.updated_at = 'NOW()';

      const setClause = Object.entries(updates)
        .map(([key, placeholder]) => `${key} = ${placeholder}`)
        .join(', ');

      const query = `
        UPDATE transactions 
        SET ${setClause}
        WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
        RETURNING id, user_id, category_id, amount, type, description, notes, date, template_id, created_at, updated_at
      `;

      values.push(transactionId, userId);
      const result = await db.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('Transaction not found');
      }

      logger.info('Transaction updated successfully', { 
        transactionId, 
        userId,
        updatedFields: Object.keys(updates)
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Transaction update failed', { transactionId, userId, error: error.message });
      throw error;
    }
  }

  /**
   * Soft delete transaction
   * @param {number} transactionId - Transaction ID
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(transactionId, userId) {
    try {
      // First check if transaction exists and belongs to user
      const existing = await this.findById(transactionId, userId);
      if (!existing) {
        throw new Error('Transaction not found');
      }

      const query = `
        UPDATE transactions 
        SET deleted_at = NOW(), updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING id
      `;

      const result = await db.query(query, [transactionId, userId]);
      const success = result.rows.length > 0;

      if (success) {
        logger.info('Transaction soft deleted successfully', { transactionId, userId });
      }

      return success;
    } catch (error) {
      logger.error('Transaction deletion failed', { transactionId, userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get transaction counts and totals for dashboard
   * @param {number} userId - User ID
   * @param {number} days - Number of days to look back
   * @returns {Promise<Object>} Summary data
   */
  static async getSummary(userId, days = 30) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_transactions,
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
          AVG(CASE WHEN type = 'expense' THEN amount END) as avg_expense,
          COUNT(DISTINCT category_id) as categories_used
        FROM transactions
        WHERE user_id = $1 
          AND (deleted_at IS NULL)
          AND date >= CURRENT_DATE - INTERVAL '${days} days'
      `;

      const result = await db.query(query, [userId]);
      const summary = result.rows[0] || {};

      // Calculate net balance
      summary.net_balance = (summary.total_income || 0) - (summary.total_expenses || 0);

      return summary;
    } catch (error) {
      logger.error('Transaction summary failed', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Create batch transactions (for recurring, imports, etc.)
   * @param {Array} transactionsData - Array of transaction data
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Created transactions
   */
  static async createBatch(transactionsData, userId) {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      const createdTransactions = [];

      for (const transactionData of transactionsData) {
        const query = `
          INSERT INTO transactions (
            user_id, category_id, amount, type, description, notes, date, template_id, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
          RETURNING id, user_id, category_id, amount, type, description, notes, date, template_id, created_at, updated_at
        `;

        const values = [
          userId,
          transactionData.categoryId || null,
          parseFloat(transactionData.amount),
          transactionData.type,
          transactionData.description || '',
          transactionData.notes || '',
          transactionData.date || new Date().toISOString().split('T')[0],
          transactionData.templateId || null
        ];

        const result = await client.query(query, values);
        createdTransactions.push(result.rows[0]);
      }

      await client.query('COMMIT');

      logger.info('Batch transactions created successfully', { 
        count: createdTransactions.length,
        userId
      });

      return createdTransactions;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Batch transaction creation failed', { 
        error: error.message, 
        count: transactionsData.length, 
        userId 
      });
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = {
  Transaction
};