/**
 * Category Model - Production Ready
 * Handles all category-related database operations
 * @module models/Category
 */

const db = require('../config/db');
const errorCodes = require('../utils/errorCodes');
const logger = require('../utils/logger');

class Category {
  /**
   * Get all categories for a user (including defaults)
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Categories
   */
  static async getAll(userId = null) {
    try {
      const query = `
        SELECT DISTINCT
          id, name, description, icon, type, is_default, user_id, created_at
        FROM categories
        WHERE is_default = true 
           OR user_id = $1 
           OR user_id IS NULL
        ORDER BY is_default DESC, type, name;
      `;
      
      const result = await db.query(query, [userId], 'get_all_categories');
      
      logger.debug('Categories retrieved', { 
        count: result.rows.length,
        userId 
      });
      
      return result.rows;
    } catch (error) {
      logger.error('Error fetching categories', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get single category by ID
   * @param {number} id - Category ID
   * @returns {Promise<Object|null>} Category or null
   */
  static async getById(id) {
    try {
      const query = `
        SELECT id, name, description, icon, type, is_default, user_id, created_at
        FROM categories
        WHERE id = $1;
      `;
      
      const result = await db.query(query, [id], 'get_category_by_id');
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error fetching category by ID', { categoryId: id, error: error.message });
      throw error;
    }
  }

  /**
   * Create a new category
   * @param {Object} data - Category data
   * @param {number} userId - User ID creating the category
   * @returns {Promise<Object>} Created category
   */
  static async create(data, userId) {
    const { name, description, icon, type } = data;
    
    try {
      const query = `
        INSERT INTO categories (name, description, icon, type, is_default, user_id)
        VALUES ($1, $2, $3, $4, false, $5)
        RETURNING *;
      `;
      
      const values = [name, description, icon, type, userId];
      const result = await db.query(query, values, 'create_category');
      
      logger.info('Category created', { 
        categoryId: result.rows[0].id,
        name: result.rows[0].name,
        type: result.rows[0].type,
        userId
      });
      
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        throw {
          ...errorCodes.ALREADY_EXISTS,
          details: 'Category name already exists'
        };
      }
      
      logger.error('Error creating category', { data, userId, error: error.message });
      throw error;
    }
  }

  /**
   * Update a category
   * @param {number} id - Category ID
   * @param {Object} data - Update data
   * @param {number} userId - User ID making the update
   * @returns {Promise<Object>} Updated category
   */
  static async update(id, data, userId) {
    const { name, description, icon, type } = data;
    
    try {
      // Check if it's a default category and if user owns it
      const checkQuery = 'SELECT is_default, user_id FROM categories WHERE id = $1';
      const checkResult = await db.query(checkQuery, [id], 'check_category_ownership');
      
      if (!checkResult.rows[0]) {
        throw { ...errorCodes.NOT_FOUND, message: 'Category not found' };
      }
      
      const category = checkResult.rows[0];
      
      if (category.is_default) {
        throw {
          ...errorCodes.VALIDATION_ERROR,
          details: 'Cannot modify default categories'
        };
      }
      
      // Check if user owns this category
      if (category.user_id !== userId) {
        throw {
          ...errorCodes.UNAUTHORIZED,
          details: 'You can only modify your own categories'
        };
      }
      
      const query = `
        UPDATE categories
        SET 
          name = COALESCE($1, name),
          description = COALESCE($2, description),
          icon = COALESCE($3, icon),
          type = COALESCE($4, type)
        WHERE id = $5 AND user_id = $6 AND is_default = false
        RETURNING *;
      `;
      
      const values = [name, description, icon, type, id, userId];
      const result = await db.query(query, values, 'update_category');
      
      if (result.rows.length === 0) {
        throw { ...errorCodes.NOT_FOUND, message: 'Category not found or cannot be updated' };
      }
      
      logger.info('Category updated', { 
        categoryId: id,
        userId,
        updates: Object.keys(data).filter(key => data[key] !== undefined)
      });
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating category', { categoryId: id, userId, data, error: error.message });
      throw error;
    }
  }

  /**
   * Delete a category (only non-default, user-owned)
   * @param {number} id - Category ID
   * @param {number} userId - User ID making the deletion
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id, userId) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if it's a default category, ownership, and usage
      const checkQuery = `
        SELECT 
          c.is_default,
          c.user_id,
          COUNT(DISTINCT e.id) as expense_count,
          COUNT(DISTINCT i.id) as income_count,
          COUNT(DISTINCT rt.id) as recurring_count
        FROM categories c
        LEFT JOIN expenses e ON c.id = e.category_id AND e.deleted_at IS NULL
        LEFT JOIN income i ON c.id = i.category_id AND i.deleted_at IS NULL
        LEFT JOIN recurring_templates rt ON c.id = rt.category_id AND rt.is_active = true AND rt.user_id = $2
        WHERE c.id = $1
        GROUP BY c.id, c.is_default, c.user_id;
      `;
      
      const checkResult = await client.query(checkQuery, [id, userId]);
      const category = checkResult.rows[0];
      
      if (!category) {
        throw { ...errorCodes.NOT_FOUND, message: 'Category not found' };
      }
      
      if (category.is_default) {
        throw {
          ...errorCodes.VALIDATION_ERROR,
          details: 'Cannot delete default categories'
        };
      }
      
      // Check ownership
      if (category.user_id !== userId) {
        throw {
          ...errorCodes.UNAUTHORIZED,
          details: 'You can only delete your own categories'
        };
      }
      
      if (parseInt(category.expense_count) > 0 || parseInt(category.income_count) > 0 || parseInt(category.recurring_count) > 0) {
        throw {
          ...errorCodes.CATEGORY_IN_USE,
          details: 'Category is linked to existing transactions or recurring templates.'
        };
      }
      
      // Delete the category (with user ownership check)
      await client.query('DELETE FROM categories WHERE id = $1 AND user_id = $2', [id, userId]);
      
      await client.query('COMMIT');
      
      logger.info('Category deleted', { categoryId: id });
      
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error deleting category', { categoryId: id, error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get category usage statistics
   * @param {number} categoryId - Category ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Usage statistics
   */
  static async getUsageStats(categoryId, userId) {
    try {
      const query = `
        SELECT 
          c.name,
          c.type,
          COUNT(DISTINCT e.id) as expense_transactions,
          COUNT(DISTINCT i.id) as income_transactions,
          COALESCE(SUM(CASE WHEN e.deleted_at IS NULL THEN e.amount END), 0) as total_expenses,
          COALESCE(SUM(CASE WHEN i.deleted_at IS NULL THEN i.amount END), 0) as total_income,
          MIN(COALESCE(e.date, i.date)) as first_transaction,
          MAX(COALESCE(e.date, i.date)) as last_transaction
        FROM categories c
        LEFT JOIN expenses e ON c.id = e.category_id AND e.user_id = $2
        LEFT JOIN income i ON c.id = i.category_id AND i.user_id = $2
        WHERE c.id = $1
        GROUP BY c.id, c.name, c.type;
      `;
      
      const result = await db.query(query, [categoryId, userId], 'get_category_usage_stats');
      
      if (result.rows.length === 0) {
        throw { ...errorCodes.NOT_FOUND, message: 'Category not found' };
      }
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error getting category usage stats', { 
        categoryId, 
        userId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get categories with transaction counts
   * @param {number} userId - User ID
   * @param {Date} startDate - Start date filter
   * @param {Date} endDate - End date filter
   * @returns {Promise<Array>} Categories with counts
   */
  static async getWithTransactionCounts(userId, startDate = null, endDate = null) {
    try {
      let dateFilter = '';
      const params = [userId];
      
      if (startDate && endDate) {
        dateFilter = 'AND (e.date BETWEEN $2 AND $3 OR i.date BETWEEN $2 AND $3)';
        params.push(startDate, endDate);
      }
      
      const query = `
        SELECT 
          c.id,
          c.name,
          c.description,
          c.icon,
          c.type,
          c.is_default,
          c.user_id,
          COUNT(DISTINCT CASE WHEN e.deleted_at IS NULL THEN e.id END) as expense_count,
          COUNT(DISTINCT CASE WHEN i.deleted_at IS NULL THEN i.id END) as income_count,
          COALESCE(SUM(CASE WHEN e.deleted_at IS NULL THEN e.amount END), 0) as total_expenses,
          COALESCE(SUM(CASE WHEN i.deleted_at IS NULL THEN i.amount END), 0) as total_income
        FROM categories c
        LEFT JOIN expenses e ON c.id = e.category_id AND e.user_id = $1 ${dateFilter}
        LEFT JOIN income i ON c.id = i.category_id AND i.user_id = $1 ${dateFilter}
        WHERE c.is_default = true 
           OR c.user_id = $1 
           OR c.user_id IS NULL
        GROUP BY c.id, c.name, c.description, c.icon, c.type, c.is_default, c.user_id
        ORDER BY c.is_default DESC, c.type, c.name;
      `;
      
      const result = await db.query(query, params, 'get_categories_with_counts');
      
      return result.rows;
    } catch (error) {
      logger.error('Error getting categories with transaction counts', { 
        userId, 
        startDate, 
        endDate, 
        error: error.message 
      });
      throw error;
    }
  }
}

module.exports = Category;