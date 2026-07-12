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
  t.bank_sync_id,
  t.bank_processed_date,
  t.bank_status,
  t.original_amount,
  t.original_currency,
  t.charged_currency,
  t.txn_kind,
  t.installment_number,
  t.installment_total
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

  // Shared WHERE builder for list + count + summary so filters can never drift.
  static buildFilters(userId, options = {}) {
    const {
      type = null, dateFrom = null, dateTo = null, search = null,
      bankSource = null, bankAccountNumber = null,
      amountMin = null, amountMax = null,
      financialPeriodStart = null, financialPeriodEnd = null,
    } = options;

    const conditions = ['t.user_id = $1', 't.deleted_at IS NULL'];
    const values = [userId];
    let paramCount = 2;

    if (type) {
      conditions.push(`t.type = $${paramCount}`);
      values.push(type);
      paramCount++;
    }
    if (financialPeriodStart && financialPeriodEnd) {
      const startParam = paramCount;
      const endParam = paramCount + 1;
      // Calendar performance follows the factual transaction/purchase date for
      // every source. Provider processed dates belong to card reconciliation;
      // using them here made the list disagree with the dashboard totals.
      conditions.push(`t.date >= $${startParam}`);
      conditions.push(`t.date < $${endParam}`);
      values.push(financialPeriodStart, financialPeriodEnd);
      paramCount += 2;
    } else if (dateFrom) {
      conditions.push(`t.date >= $${paramCount}`);
      values.push(dateFrom);
      paramCount++;
    }
    if (dateTo) {
      conditions.push(`t.date <= $${paramCount}`);
      values.push(dateTo);
      paramCount++;
    }
    // 'manual' selects rows a human typed (no bank_source); a source id
    // selects that institution's rows, optionally narrowed to one account.
    if (bankSource === 'manual') {
      conditions.push('t.bank_source IS NULL');
    } else if (bankSource) {
      conditions.push(`t.bank_source = $${paramCount}`);
      values.push(bankSource);
      paramCount++;
      if (bankAccountNumber) {
        conditions.push(`t.bank_account_number = $${paramCount}`);
        values.push(bankAccountNumber);
        paramCount++;
      }
    }
    if (amountMin !== null && amountMin !== undefined) {
      conditions.push(`t.amount >= $${paramCount}`);
      values.push(amountMin);
      paramCount++;
    }
    if (amountMax !== null && amountMax !== undefined) {
      conditions.push(`t.amount <= $${paramCount}`);
      values.push(amountMax);
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
   * Income/expense totals over the WHOLE filtered set (not one page) —
   * what the stats tiles must show while the list itself is paginated.
   */
  static async getFilteredSummary(userId, options = {}) {
    try {
      const { conditions, values } = this.buildFilters(userId, options);
      const result = await db.query(
        `SELECT
           COUNT(*)::int AS count,
           COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0) AS total_income,
           COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) AS total_expenses
         FROM transactions t
         WHERE ${conditions.join(' AND ')}`,
        values,
      );
      const row = result.rows[0] || {};
      return {
        count: parseInt(row.count) || 0,
        totalIncome: parseFloat(row.total_income) || 0,
        totalExpenses: parseFloat(row.total_expenses) || 0,
      };
    } catch (error) {
      logger.error('Transaction filtered summary failed', { userId, error: error.message });
      throw error;
    }
  }

  /** Distinct YYYY-MM months that have (non-deleted) transactions. */
  static async getAvailableMonths(userId, limit = 36) {
    try {
      const result = await db.query(
        `SELECT DISTINCT TO_CHAR(t.date, 'YYYY-MM') AS month
         FROM transactions t
         WHERE t.user_id = $1 AND t.deleted_at IS NULL
           AND (t.bank_source IS NULL OR NOT EXISTS (
             SELECT 1
               FROM bank_accounts ba_filter
              WHERE ba_filter.user_id = t.user_id
                AND ba_filter.bank_source = t.bank_source
                AND ba_filter.account_number = COALESCE(t.bank_account_number, '')
                AND ba_filter.enabled = false
           ))
         ORDER BY month DESC
         LIMIT $2`,
        [userId, limit],
      );
      return result.rows.map((r) => r.month);
    } catch (error) {
      logger.error('Transaction months lookup failed', { userId, error: error.message });
      throw error;
    }
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
   * Recent transactions for the dashboard.
   */
  static async getRecent(userId, limit = 10) {
    try {
      const query = `
        SELECT ${SELECT_COLUMNS}
        FROM transactions t
        LEFT JOIN bank_accounts ba_filter
          ON ba_filter.user_id = t.user_id
         AND ba_filter.bank_source = t.bank_source
         AND ba_filter.account_number = COALESCE(t.bank_account_number, '')
        WHERE t.user_id = $1 AND t.deleted_at IS NULL
          AND (t.bank_source IS NULL OR COALESCE(ba_filter.enabled, true) = true)
        ORDER BY t.transaction_datetime DESC NULLS LAST, t.created_at DESC
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
   * Recent rows inside one calendar period. Every source is scoped and ordered
   * by its factual transaction date; provider processing dates are reserved for
   * independent card-statement reconciliation.
   */
  static async getRecentForPeriod(userId, periodStart, periodEnd, limit = 10) {
    try {
      const query = `
        SELECT ${SELECT_COLUMNS},
          t.date AS financial_period_date
        FROM transactions t
        LEFT JOIN bank_accounts ba_filter
          ON ba_filter.user_id = t.user_id
         AND ba_filter.bank_source = t.bank_source
         AND ba_filter.account_number = COALESCE(t.bank_account_number, '')
        WHERE t.user_id = $1 AND t.deleted_at IS NULL
          AND (t.bank_source IS NULL OR COALESCE(ba_filter.enabled, true) = true)
          AND t.date >= $2
          AND t.date < $3
        ORDER BY financial_period_date DESC, t.transaction_datetime DESC NULLS LAST, t.created_at DESC
        LIMIT $4
      `;
      const result = await db.query(query, [userId, periodStart, periodEnd, limit]);
      return result.rows;
    } catch (error) {
      logger.error('Period transaction retrieval failed', { userId, error: error.message });
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
      // Bank-synced rows are facts reported by the bank — the UI never offers
      // editing them, and the API must not either.
      if (existing.bank_source) {
        throw new Error('Bank-synced transactions cannot be edited');
      }

      const allowedFields = ['amount', 'type', 'description', 'notes', 'date'];
      if (updateData.type !== undefined && !['income', 'expense'].includes(updateData.type)) {
        delete updateData.type;
      }
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
   * Delete a transaction.
   *
   * Bank-synced rows are TOMBSTONED (deleted_at set), never hard-deleted:
   * the row must keep occupying the (user_id, bank_sync_id) unique index —
   * and stay findable by the soft-dedup lookup — otherwise the next sync
   * (banks re-send the last months on every scrape) re-imports exactly what
   * the user deleted. Manual rows have no re-import source, so they are
   * really deleted.
   */
  static async delete(transactionId, userId) {
    try {
      const existing = await this.findById(transactionId, userId);
      if (!existing) {
        throw new Error('Transaction not found');
      }

      const result = existing.bank_source
        ? await db.query(
            `UPDATE transactions SET deleted_at = NOW(), updated_at = NOW()
             WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
             RETURNING id, type`,
            [transactionId, userId],
          )
        : await db.query(
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

  /**
   * Income/expense summary for a half-open date range [startDate, endDate).
   * Callers compute the range (financial-period or calendar month) — this
   * method never assumes a rolling day-count window.
   */
  static async getSummary(userId, { startDate, endDate }) {
    try {
      const query = `
        SELECT
          t.type,
          COUNT(*) as transaction_count,
          COALESCE(SUM(amount), 0) as total_amount,
          COALESCE(AVG(amount), 0) as avg_amount
        FROM transactions t
        LEFT JOIN bank_accounts ba_filter
          ON ba_filter.user_id = t.user_id
         AND ba_filter.bank_source = t.bank_source
         AND ba_filter.account_number = COALESCE(t.bank_account_number, '')
        WHERE t.user_id = $1
          AND t.date >= $2 AND t.date < $3
          AND t.deleted_at IS NULL
          AND (t.bank_source IS NULL OR COALESCE(ba_filter.enabled, true) = true)
        GROUP BY t.type
      `;

      const result = await db.query(query, [userId, startDate, endDate]);

      const incomeData = result.rows.find(row => row.type === 'income') || {};
      const expenseData = result.rows.find(row => row.type === 'expense') || {};

      const summary = {
        total_transactions: (parseInt(incomeData.transaction_count) || 0) + (parseInt(expenseData.transaction_count) || 0),
        total_income: parseFloat(incomeData.total_amount) || 0,
        total_expenses: parseFloat(expenseData.total_amount) || 0,
        avg_expense: parseFloat(expenseData.avg_amount) || 0,
        avg_income: parseFloat(incomeData.avg_amount) || 0,
      };
      summary.net_balance = summary.total_income - summary.total_expenses;

      return summary;
    } catch (error) {
      logger.error('Transaction summary failed', { userId, error: error.message });
      throw error;
    }
  }
}

module.exports = {
  Transaction
};
