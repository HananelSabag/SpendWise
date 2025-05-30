/**
 * Recurring Template Model
 * Handles all recurring transaction template operations
 * @module models/RecurringTemplate
 */

const db = require('../config/db');

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

      const result = await db.query(query, values);
      
      // Generate initial transactions
      await db.query('SELECT generate_recurring_transactions()');
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating recurring template:', error);
      throw error;
    }
  }

  /**
   * Get all active templates for a user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Active templates
   */
  static async getByUser(userId) {
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

      const result = await db.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw error;
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
        throw new Error('Template not found');
      }

      // Update future transactions if requested
      if (updateFuture && data.amount !== undefined) {
        await client.query(
          'SELECT update_future_transactions($1, $2, $3, $4, $5)',
          [id, new Date(), data.amount, data.description, data.category_id]
        );
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
   * Delete (deactivate) a recurring template
   * @param {number} id - Template ID
   * @param {number} userId - User ID
   * @param {boolean} deleteFuture - Delete future transactions
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id, userId, deleteFuture = false) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Deactivate template
      const result = await client.query(
        `UPDATE recurring_templates 
         SET is_active = false, end_date = CURRENT_DATE
         WHERE id = $1 AND user_id = $2
         RETURNING type;`,
        [id, userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Template not found');
      }

      // Delete future transactions if requested
      if (deleteFuture) {
        await client.query(
          'SELECT delete_future_transactions($1, $2)',
          [id, new Date()]
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
   * Skip specific dates for a template
   * @param {number} id - Template ID
   * @param {number} userId - User ID
   * @param {Array<string>} dates - Dates to skip
   * @returns {Promise<boolean>} Success status
   */
  static async skipDates(id, userId, dates) {
    try {
      const query = `
        UPDATE recurring_templates
        SET skip_dates = array_cat(skip_dates, $1::date[])
        WHERE id = $2 AND user_id = $3
        RETURNING id;
      `;

      const result = await db.query(query, [dates, id, userId]);
      
      if (result.rows.length === 0) {
        throw new Error('Template not found');
      }

      // Regenerate transactions
      await db.query('SELECT generate_recurring_transactions()');
      
      return true;
    } catch (error) {
      console.error('Error skipping dates:', error);
      throw error;
    }
  }
}

module.exports = RecurringTemplate;