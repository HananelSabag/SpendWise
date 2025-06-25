/**
 * Recurring Template Model - Production Ready
 * Handles all recurring transaction template operations
 * @module models/RecurringTemplate
 */

const db = require('../config/db');
const errorCodes = require('../utils/errorCodes');
const logger = require('../utils/logger');

class RecurringTemplate {
  /**
   * Create a new recurring template
   * @param {Object} data - Template data
   * @returns {Promise<Object>} Created template
   */
  static async create(data) {
    const {
      user_id,
      type,
      amount,
      description,
      category_id,
      interval_type,
      day_of_month,
      day_of_week,
      start_date,
      end_date
    } = data;

    // Validation
    if (!user_id || !type || !amount || !description || !interval_type || !start_date) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Missing required fields' };
    }

    if (!['income', 'expense'].includes(type)) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Type must be income or expense' };
    }

    if (!['daily', 'weekly', 'monthly'].includes(interval_type)) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Invalid interval type' };
    }

    if (amount <= 0) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Amount must be positive' };
    }

    if (interval_type === 'monthly' && day_of_month && (day_of_month < 1 || day_of_month > 31)) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Day of month must be between 1 and 31' };
    }

    if (interval_type === 'weekly' && day_of_week && (day_of_week < 0 || day_of_week > 6)) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Day of week must be between 0 and 6' };
    }

    if (end_date && new Date(start_date) >= new Date(end_date)) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'End date must be after start date' };
    }

    try {
      const query = `
        INSERT INTO recurring_templates (
          user_id, type, amount, description, category_id,
          interval_type, day_of_month, day_of_week,
          start_date, end_date, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
        RETURNING *;
      `;

      const values = [
        user_id,
        type,
        amount,
        description,
        category_id,
        interval_type,
        day_of_month,
        day_of_week,
        start_date,
        end_date
      ];

      const result = await db.query(query, values, 'create_recurring_template');
      
      logger.info('Recurring template created', {
        templateId: result.rows[0].id,
        userId: user_id,
        type,
        amount,
        interval: interval_type
      });

      // Generate initial transactions
      await db.query('SELECT generate_recurring_transactions()', [], 'generate_initial_transactions');
      
      logger.info('Initial transactions generated for template', {
        templateId: result.rows[0].id
      });
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating recurring template', {
        userId: user_id,
        type,
        error: error.message
      });

      if (error.code === '23505') {
        throw { ...errorCodes.ALREADY_EXISTS, details: 'Duplicate template detected' };
      }

      if (error.code === '23503') {
        throw { ...errorCodes.VALIDATION_ERROR, details: 'Invalid category or user reference' };
      }

      throw { ...errorCodes.SQL_ERROR, details: 'Failed to create recurring template' };
    }
  }

  /**
   * Get all active templates for a user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Active templates
   */
  static async getByUser(userId) {
    if (!userId) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'User ID is required' };
    }

    try {
      const query = `
        SELECT 
          rt.*,
          c.name as category_name,
          c.icon as category_icon,
          COUNT(CASE WHEN e.deleted_at IS NULL THEN 1 END) as occurrence_count
        FROM recurring_templates rt
        LEFT JOIN categories c ON rt.category_id = c.id
        LEFT JOIN (
          SELECT template_id, deleted_at FROM expenses WHERE template_id IS NOT NULL
          UNION ALL
          SELECT template_id, deleted_at FROM income WHERE template_id IS NOT NULL
        ) e ON e.template_id = rt.id
        WHERE rt.user_id = $1 AND rt.is_active = true
        GROUP BY rt.id, c.name, c.icon
        ORDER BY rt.created_at DESC;
      `;

      const result = await db.query(query, [userId], 'get_templates_by_user');
      
      logger.debug('Templates retrieved for user', {
        userId,
        count: result.rows.length
      });

      return result.rows;
    } catch (error) {
      logger.error('Error fetching templates', {
        userId,
        error: error.message
      });

      throw { ...errorCodes.FETCH_FAILED, details: 'Failed to fetch recurring templates' };
    }
  }

  /**
   * Get template by ID
   * @param {number} id - Template ID
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} Template or null
   */
  static async getById(id, userId) {
    if (!id || !userId) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Template ID and User ID are required' };
    }

    try {
      const query = `
        SELECT 
          rt.*,
          c.name as category_name,
          c.icon as category_icon
        FROM recurring_templates rt
        LEFT JOIN categories c ON rt.category_id = c.id
        WHERE rt.id = $1 AND rt.user_id = $2;
      `;

      const result = await db.query(query, [id, userId], 'get_template_by_id');
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error fetching template by ID', {
        templateId: id,
        userId,
        error: error.message
      });

      throw { ...errorCodes.FETCH_FAILED, details: 'Failed to fetch template' };
    }
  }

  /**
   * Update a recurring template
   * @param {number} id - Template ID
   * @param {number} userId - User ID
   * @param {Object} data - Update data
   * @param {boolean} updateFuture - Update future transactions
   * @returns {Promise<Object>} Updated template
   */
  static async update(id, userId, data, updateFuture = false) {
    if (!id || !userId) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Template ID and User ID are required' };
    }

    // Validate update data
    if (data.amount !== undefined && data.amount <= 0) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Amount must be positive' };
    }

    if (data.interval_type && !['daily', 'weekly', 'monthly'].includes(data.interval_type)) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Invalid interval type' };
    }

    if (data.day_of_month !== undefined && (data.day_of_month < 1 || data.day_of_month > 31)) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Day of month must be between 1 and 31' };
    }

    if (data.day_of_week !== undefined && (data.day_of_week < 0 || data.day_of_week > 6)) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Day of week must be between 0 and 6' };
    }

    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Update template
      const updateQuery = `
        UPDATE recurring_templates
        SET 
          amount = COALESCE($1, amount),
          description = COALESCE($2, description),
          category_id = COALESCE($3, category_id),
          interval_type = COALESCE($4, interval_type),
          day_of_month = COALESCE($5, day_of_month),
          day_of_week = COALESCE($6, day_of_week),
          end_date = COALESCE($7, end_date),
          updated_at = NOW()
        WHERE id = $8 AND user_id = $9
        RETURNING *;
      `;

      const values = [
        data.amount,
        data.description,
        data.category_id,
        data.interval_type,
        data.day_of_month,
        data.day_of_week,
        data.end_date,
        id,
        userId
      ];

      const result = await client.query(updateQuery, values);

      if (result.rows.length === 0) {
        throw { ...errorCodes.NOT_FOUND, message: 'Template not found' };
      }

      // Update future transactions if requested
      if (updateFuture) {
        const updateFields = [];
        if (data.amount !== undefined) updateFields.push('amount');
        if (data.description !== undefined) updateFields.push('description');
        if (data.category_id !== undefined) updateFields.push('category');

        if (updateFields.length > 0) {
          await client.query(
            'SELECT update_future_transactions($1, $2, $3, $4, $5)',
            [id, new Date(), data.amount, data.description, data.category_id]
          );

          logger.info('Future transactions updated', {
            templateId: id,
            userId,
            updatedFields: updateFields
          });
        }
      }

      await client.query('COMMIT');
      
      logger.info('Recurring template updated', {
        templateId: id,
        userId,
        updateFuture,
        updates: Object.keys(data).filter(key => data[key] !== undefined)
      });

      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      
      if (error.code === 'NOT_FOUND') throw error;

      logger.error('Error updating template', {
        templateId: id,
        userId,
        error: error.message
      });

      if (error.code === '23503') {
        throw { ...errorCodes.VALIDATION_ERROR, details: 'Invalid category reference' };
      }

      throw { ...errorCodes.SQL_ERROR, details: 'Failed to update template' };
    } finally {
      client.release();
    }
  }

  /**
   * Delete (deactivate) a recurring template
   * @param {number} id - Template ID
   * @param {number} userId - User ID
   * @param {boolean} deleteFuture - Delete future transactions
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id, userId, deleteFuture = false) {
    if (!id || !userId) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Template ID and User ID are required' };
    }

    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check if template exists
      const checkQuery = 'SELECT type FROM recurring_templates WHERE id = $1 AND user_id = $2';
      const checkResult = await client.query(checkQuery, [id, userId]);

      if (checkResult.rows.length === 0) {
        throw { ...errorCodes.NOT_FOUND, message: 'Template not found' };
      }

      // Deactivate template
      const result = await client.query(
        `UPDATE recurring_templates 
         SET is_active = false, end_date = CURRENT_DATE, updated_at = NOW()
         WHERE id = $1 AND user_id = $2
         RETURNING type;`,
        [id, userId]
      );

      // Delete future transactions if requested
      if (deleteFuture) {
        await client.query(
          'SELECT delete_future_transactions($1, $2, $3)',
          [id, userId, new Date()]
        );

        logger.info('Future transactions deleted', {
          templateId: id,
          userId
        });
      }

      await client.query('COMMIT');
      
      logger.info('Recurring template deleted', {
        templateId: id,
        userId,
        deleteFuture
      });

      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      
      if (error.code === 'NOT_FOUND') throw error;

      logger.error('Error deleting template', {
        templateId: id,
        userId,
        error: error.message
      });

      throw { ...errorCodes.SQL_ERROR, details: 'Failed to delete template' };
    } finally {
      client.release();
    }
  }

  /**
   * Skip specific dates for a template
   * @param {number} id - Template ID
   * @param {number} userId - User ID
   * @param {Array<string>} dates - Dates to skip (YYYY-MM-DD format)
   * @returns {Promise<boolean>} Success status
   */
  static async skipDates(id, userId, dates) {
    if (!id || !userId) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Template ID and User ID are required' };
    }

    if (!Array.isArray(dates) || dates.length === 0) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Dates array is required and cannot be empty' };
    }

    // Validate date formats
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    for (const date of dates) {
      if (!dateRegex.test(date)) {
        throw { ...errorCodes.VALIDATION_ERROR, details: 'Invalid date format. Use YYYY-MM-DD' };
      }
    }

    try {
      const query = `
        UPDATE recurring_templates
        SET skip_dates = array_cat(COALESCE(skip_dates, '{}'), $1::date[]),
            updated_at = NOW()
        WHERE id = $2 AND user_id = $3
        RETURNING id, skip_dates;
      `;

      const result = await db.query(query, [dates, id, userId], 'skip_template_dates');
      
      if (result.rows.length === 0) {
        throw { ...errorCodes.NOT_FOUND, message: 'Template not found' };
      }

      // Regenerate transactions to apply skip dates
      await db.query('SELECT generate_recurring_transactions()', [], 'regenerate_after_skip');
      
      logger.info('Dates skipped for template', {
        templateId: id,
        userId,
        skippedDates: dates,
        totalSkippedDates: result.rows[0].skip_dates.length
      });
      
      return true;
    } catch (error) {
      if (error.code === 'NOT_FOUND') throw error;

      logger.error('Error skipping dates', {
        templateId: id,
        userId,
        dates,
        error: error.message
      });

      throw { ...errorCodes.SQL_ERROR, details: 'Failed to skip dates' };
    }
  }

  /**
   * Get template statistics
   * @param {number} id - Template ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Template statistics
   */
  static async getStats(id, userId) {
    if (!id || !userId) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Template ID and User ID are required' };
    }

    try {
      const query = `
        WITH template_info AS (
          SELECT type, amount, start_date, created_at
          FROM recurring_templates
          WHERE id = $1 AND user_id = $2
        ),
        transaction_stats AS (
          SELECT 
            COUNT(*) as total_transactions,
            SUM(amount) as total_amount,
            MIN(date) as first_transaction,
            MAX(date) as last_transaction
          FROM (
            SELECT amount, date FROM expenses 
            WHERE template_id = $1 AND deleted_at IS NULL
            UNION ALL
            SELECT amount, date FROM income 
            WHERE template_id = $1 AND deleted_at IS NULL
          ) t
        )
        SELECT 
          ti.*,
          COALESCE(ts.total_transactions, 0) as occurrence_count,
          COALESCE(ts.total_amount, 0) as total_generated,
          ts.first_transaction,
          ts.last_transaction
        FROM template_info ti
        CROSS JOIN transaction_stats ts;
      `;

      const result = await db.query(query, [id, userId], 'get_template_stats');
      
      if (result.rows.length === 0) {
        throw { ...errorCodes.NOT_FOUND, message: 'Template not found' };
      }

      return result.rows[0];
    } catch (error) {
      if (error.code === 'NOT_FOUND') throw error;

      logger.error('Error fetching template statistics', {
        templateId: id,
        userId,
        error: error.message
      });

      throw { ...errorCodes.FETCH_FAILED, details: 'Failed to fetch template statistics' };
    }
  }
}

module.exports = RecurringTemplate;