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
   * Create a new transaction - BACKWARD COMPATIBLE VERSION
   * @param {Object} transactionData - Transaction data
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Created transaction
   */
  static async create(transactionData, userId) {
    try {
      // ✅ FIXED: Insert into appropriate table based on transaction type
      let query;
      const values = [
        userId,
        transactionData.categoryId || null,
        parseFloat(transactionData.amount),
        transactionData.description || '',
        transactionData.notes || '',
        transactionData.date || new Date().toISOString().split('T')[0],
        transactionData.templateId || null
      ];

      // ✅ CRITICAL FIX: Use unified transactions table with type column AND transaction_datetime
      const transactionDate = transactionData.date || new Date().toISOString().split('T')[0];
      const transactionDateTime = new Date(transactionDate + 'T12:00:00Z').toISOString(); // Set to noon UTC
      
      query = `
        INSERT INTO transactions (
          user_id, category_id, amount, type, description, notes, date, transaction_datetime, template_id, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING id, user_id, category_id, amount, type, description, notes, date, transaction_datetime, template_id, created_at, updated_at
      `;
      
      // ✅ CRITICAL: Add type AND transaction_datetime to values array
      const finalValues = [
        userId,
        transactionData.categoryId || null,
        parseFloat(transactionData.amount),
        transactionData.type || 'expense', // ✅ MUST provide type!
        transactionData.description || '',
        transactionData.notes || '',
        transactionDate, // Date field
        transactionDateTime, // DateTime field for constraint
        transactionData.templateId || null
      ];

      const result = await db.query(query, finalValues);
      const transaction = result.rows[0];
      
      // Type is already included in the result from the unified table

      logger.info('Transaction created successfully', { 
        transactionId: transaction.id, 
        userId, 
        amount: transaction.amount,
        type: transaction.type,
        table: transactionData.type === 'income' ? 'income' : 'expenses'
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
        search = null, // ✅ NEW: Add search support
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = options;

      // ✅ UNIFIED TRANSACTIONS TABLE: Build WHERE conditions
      const conditions = ['t.user_id = $1'];
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

      // ✅ CRITICAL FIX: Add search filtering in SQL query, not after
      if (search) {
        conditions.push(`(
          LOWER(t.description) LIKE LOWER($${paramCount}) OR 
          LOWER(t.notes) LIKE LOWER($${paramCount}) OR 
          LOWER(c.name) LIKE LOWER($${paramCount})
        )`);
        values.push(`%${search}%`);
        paramCount++;
      }

      // Add LIMIT and OFFSET parameters
      values.push(limit, offset);

      // ✅ UNIFIED TRANSACTIONS TABLE QUERY
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
          t.transaction_datetime,
          t.template_id,
          t.created_at,
          t.updated_at,
          c.name as category_name,
          c.icon as category_icon,
          c.color as category_color
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE ${conditions.join(' AND ')}
        ORDER BY ${sortBy === 'amount' ? 't.amount' : 't.transaction_datetime'} ${sortOrder}
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;

      logger.info('findByUser query', { userId, options, query, values });
      
      const result = await db.query(query, values);
      
      logger.info('findByUser results', { 
        userId, 
        resultCount: result.rows.length,
        totalRequested: limit 
      });
      
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
      // ✅ FIXED: Use current database schema (income/expenses tables) - corrected query
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
          WHERE i.user_id = $1
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
          WHERE e.user_id = $1
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
   * Find transaction by ID - BACKWARD COMPATIBLE VERSION
   * @param {number} transactionId - Transaction ID
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} Transaction or null
   */
  static async findById(transactionId, userId) {
    try {
      // ✅ FIXED: Try both income and expenses tables
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
          i.template_id,
          i.created_at,
          i.updated_at,
          c.name as category_name,
          c.icon as category_icon,
          c.color as category_color
        FROM income i
        LEFT JOIN categories c ON i.category_id = c.id
        WHERE i.id = $1 AND i.user_id = $2
      `;
      
      const expenseQuery = `
        SELECT 
          e.id,
          e.user_id,
          e.category_id,
          e.amount,
          'expense' as type,
          e.description,
          e.notes,
          e.date,
          e.template_id,
          e.created_at,
          e.updated_at,
          c.name as category_name,
          c.icon as category_icon,
          c.color as category_color
        FROM expenses e
        LEFT JOIN categories c ON e.category_id = c.id
        WHERE e.id = $1 AND e.user_id = $2
      `;

      // Try income first, then expenses
      let result = await db.query(incomeQuery, [transactionId, userId]);
      if (result.rows.length > 0) {
        return result.rows[0];
      }

      result = await db.query(expenseQuery, [transactionId, userId]);
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

      // ✅ FIXED: Don't allow type changes in current schema, remove type from allowed fields
      const allowedFields = ['category_id', 'amount', 'description', 'notes', 'date'];
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

      // ✅ FIXED: Update appropriate table based on existing transaction type
      let query;
      if (existing.type === 'income') {
        query = `
          UPDATE income 
          SET ${setClause}
          WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
          RETURNING id, user_id, category_id, amount, description, notes, date, template_id, created_at, updated_at
        `;
      } else {
        query = `
          UPDATE expenses 
          SET ${setClause}
          WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
          RETURNING id, user_id, category_id, amount, description, notes, date, template_id, created_at, updated_at
        `;
      }

      values.push(transactionId, userId);
      const result = await db.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('Transaction not found');
      }

      // Add type field for consistency
      const updated = result.rows[0];
      updated.type = existing.type;

      logger.info('Transaction updated successfully', { 
        transactionId, 
        userId,
        updatedFields: Object.keys(updates)
      });

      return updated;
    } catch (error) {
      logger.error('Transaction update failed', { transactionId, userId, error: error.message });
      throw error;
    }
  }

  /**
   * Soft delete transaction - BACKWARD COMPATIBLE VERSION
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

      // ✅ FIXED: Delete from appropriate table based on transaction type
      let query;
      if (existing.type === 'income') {
        query = `
          DELETE FROM income 
          WHERE id = $1 AND user_id = $2
          RETURNING id
        `;
      } else {
        query = `
          DELETE FROM expenses 
          WHERE id = $1 AND user_id = $2
          RETURNING id
        `;
      }

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
   * Get transaction counts and totals for dashboard - BACKWARD COMPATIBLE VERSION
   * @param {number} userId - User ID
   * @param {number} days - Number of days to look back
   * @returns {Promise<Object>} Summary data
   */
  static async getSummary(userId, days = 30) {
    try {
      // ✅ FIXED: Query both income and expenses tables separately
      const incomeQuery = `
        SELECT 
          COUNT(*) as income_transactions,
          COALESCE(SUM(amount), 0) as total_income,
          COALESCE(AVG(amount), 0) as avg_income,
          COUNT(DISTINCT category_id) as income_categories
        FROM income
        WHERE user_id = $1 
          AND date >= CURRENT_DATE - INTERVAL '${days} days'
      `;

      const expensesQuery = `
        SELECT 
          COUNT(*) as expense_transactions,
          COALESCE(SUM(amount), 0) as total_expenses,
          COALESCE(AVG(amount), 0) as avg_expense,
          COUNT(DISTINCT category_id) as expense_categories
        FROM expenses
        WHERE user_id = $1 
          AND date >= CURRENT_DATE - INTERVAL '${days} days'
      `;

      const [incomeResult, expensesResult] = await Promise.all([
        db.query(incomeQuery, [userId]),
        db.query(expensesQuery, [userId])
      ]);

      const incomeData = incomeResult.rows[0] || {};
      const expenseData = expensesResult.rows[0] || {};

      const summary = {
        total_transactions: (parseInt(incomeData.income_transactions) || 0) + (parseInt(expenseData.expense_transactions) || 0),
        total_income: parseFloat(incomeData.total_income) || 0,
        total_expenses: parseFloat(expenseData.total_expenses) || 0,
        avg_expense: parseFloat(expenseData.avg_expense) || 0,
        avg_income: parseFloat(incomeData.avg_income) || 0,
        categories_used: Math.max((parseInt(incomeData.income_categories) || 0), (parseInt(expenseData.expense_categories) || 0))
      };

      // Calculate net balance
      summary.net_balance = summary.total_income - summary.total_expenses;

      return summary;
    } catch (error) {
      logger.error('Transaction summary failed', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Create batch transactions (for recurring, imports, etc.) - BACKWARD COMPATIBLE VERSION
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
        // ✅ CRITICAL FIX: Use unified transactions table with type column AND transaction_datetime
        const transactionDate = transactionData.date || new Date().toISOString().split('T')[0];
        const transactionDateTime = new Date(transactionDate + 'T12:00:00Z').toISOString(); // Set to noon UTC
        
        const query = `
          INSERT INTO transactions (
            user_id, category_id, amount, type, description, notes, date, transaction_datetime, template_id, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
          RETURNING id, user_id, category_id, amount, type, description, notes, date, transaction_datetime, template_id, created_at, updated_at
        `;

        const values = [
          userId,
          transactionData.categoryId || null,
          parseFloat(transactionData.amount),
          transactionData.type || 'expense', // ✅ CRITICAL: Must provide type!
          transactionData.description || '',
          transactionData.notes || '',
          transactionDate, // Date field
          transactionDateTime, // DateTime field for constraint
          transactionData.templateId || null
        ];

        const result = await client.query(query, values);
        const created = result.rows[0];
        createdTransactions.push(created);
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