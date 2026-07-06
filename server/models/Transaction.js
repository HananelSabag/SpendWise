/**
 * 💰 TRANSACTION MODEL — bank-sync era
 *
 * Rows come from two sources:
 *   - bank/credit-card sync (bank_source, bank_account_number, bank_sync_id,
 *     raw_category set by the scraper pipeline — read-only facts)
 *   - one-time manual entries (no bank_source)
 *
 * Schema (actual):
 *   id, user_id, amount, type ('income'|'expense'), description, notes,
 *   date, transaction_datetime, raw_category, bank_sync_id, bank_source,
 *   bank_account_number, created_at, updated_at, deleted_at
 *
 * The category system and recurring templates were removed — see the
 * financial-model refactor. raw_category is the SOURCE-provided label
 * (e.g. Max supplies one per charge), not a user-managed taxonomy.
 */

const db = require('../config/db');
const logger = require('../utils/logger');

const SELECT_COLUMNS = `
  t.id,
  t.user_id,
  t.amount,
  t.type,
  t.description,
  t.notes,
  t.date,
  t.transaction_datetime,
  t.raw_category,
  t.created_at,
  t.updated_at,
  t.bank_source,
  t.bank_account_number,
  t.bank_sync_id
`;

// Resolve the timezone-aware datetime for a manual entry.
function resolveDateTime(transactionData, transactionDate) {
  if (transactionData.transaction_datetime) {
    return new Date(transactionData.transaction_datetime).toISOString();
  }
  if (transactionData.time && transactionData.timezone) {
    try {
      return new Date(`${transactionDate}T${transactionData.time}:00`).toISOString();
    } catch (error) {
      logger.warn('Failed to parse timezone data, using current time:', error.message);
    }
  }
  return new Date().toISOString();
}

class Transaction {

  /**
   * Create a one-time manual transaction.
   */
  static async create(transactionData, userId) {
    try {
      const transactionDate = transactionData.date || new Date().toISOString().split('T')[0];
      const transactionDateTime = resolveDateTime(transactionData, transactionDate);

      const query = `
        INSERT INTO transactions (
          user_id, amount, type, description, notes, date, transaction_datetime, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING id, user_id, amount, type, description, notes, date, transaction_datetime, created_at, updated_at
      `;

      const result = await db.query(query, [
        userId,
        parseFloat(transactionData.amount),
        transactionData.type || 'expense',
        transactionData.description || '',
        transactionData.notes || '',
        transactionDate,
        transactionDateTime,
      ]);
      const transaction = result.rows[0];

      logger.info('Transaction created successfully', {
        transactionId: transaction.id,
        userId,
        amount: transaction.amount,
        type: transaction.type,
      });

      return transaction;
    } catch (error) {
      logger.error('Transaction creation failed', { error: error.message, userId });
      throw error;
    }
  }

  // Shared WHERE builder for list + count so their filters can never drift.
  static buildFilters(userId, options = {}) {
    const { type = null, dateFrom = null, dateTo = null, search = null } = options;

    const conditions = ['t.user_id = $1', 't.deleted_at IS NULL'];
    const values = [userId];
    let paramCount = 2;

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
    if (search) {
      conditions.push(`(
        LOWER(t.description) LIKE LOWER($${paramCount}) OR
        LOWER(t.notes) LIKE LOWER($${paramCount}) OR
        LOWER(t.raw_category) LIKE LOWER($${paramCount})
      )`);
      values.push(`%${search}%`);
      paramCount++;
    }

    return { conditions, values, paramCount };
  }

  /**
   * Total row count for the given filters (pagination).
   */
  static async getTotalCount(userId, options = {}) {
    try {
      const { conditions, values } = this.buildFilters(userId, options);
      const result = await db.query(
        `SELECT COUNT(*) as total FROM transactions t WHERE ${conditions.join(' AND ')}`,
        values,
      );
      return parseInt(result.rows[0].total) || 0;
    } catch (error) {
      logger.error('Transaction count failed', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Filtered, paginated transaction list.
   */
  static async findByUser(userId, options = {}) {
    try {
      const { limit = 50, offset = 0, sortBy = 'created_at', sortOrder = 'DESC' } = options;
      const { conditions, values, paramCount } = this.buildFilters(userId, options);
      values.push(limit, offset);

      const query = `
        SELECT ${SELECT_COLUMNS}
        FROM transactions t
        WHERE ${conditions.join(' AND ')}
        ORDER BY ${sortBy === 'amount' ? 't.amount' : 't.transaction_datetime'} ${sortOrder === 'ASC' ? 'ASC' : 'DESC'}
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;

      const result = await db.query(query, values);
      return result.rows;
    } catch (error) {
      logger.error('Transaction retrieval failed', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Single transaction by id (owner-scoped).
   */
  static async findById(transactionId, userId) {
    try {
      const query = `
        SELECT ${SELECT_COLUMNS}
        FROM transactions t
        WHERE t.id = $1 AND t.user_id = $2 AND t.deleted_at IS NULL
      `;
      const result = await db.query(query, [transactionId, userId]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error('Transaction find by ID failed', { transactionId, userId, error: error.message });
      throw error;
    }
  }

  /**
   * Update a manual transaction's editable fields.
   */
  static async update(transactionId, updateData, userId) {
    try {
      const existing = await this.findById(transactionId, userId);
      if (!existing) {
        throw new Error('Transaction not found');
      }

      const allowedFields = ['amount', 'description', 'notes', 'date'];
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
        WHERE id = $${paramCount} AND user_id = $${paramCount + 1} AND deleted_at IS NULL
        RETURNING id, user_id, amount, type, description, notes, date, created_at, updated_at
      `;

      values.push(transactionId, userId);
      const result = await db.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('Transaction not found');
      }

      logger.info('Transaction updated successfully', {
        transactionId,
        userId,
        updatedFields: Object.keys(updates),
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Transaction update failed', { transactionId, userId, error: error.message });
      throw error;
    }
  }

  /**
   * Delete a transaction (bank rows: dedup via bank_sync_id prevents
   * re-import of the same row on the next sync).
   */
  static async delete(transactionId, userId) {
    try {
      const existing = await this.findById(transactionId, userId);
      if (!existing) {
        throw new Error('Transaction not found');
      }

      const result = await db.query(
        `DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id, type`,
        [transactionId, userId],
      );
      const success = result.rows.length > 0;

      if (success) {
        logger.info('Transaction deleted successfully', {
          transactionId,
          userId,
          type: result.rows[0].type,
        });
      }
      return success;
    } catch (error) {
      logger.error('Transaction deletion failed', { transactionId, userId, error: error.message });
      throw error;
    }
  }

}

module.exports = {
  Transaction
};
