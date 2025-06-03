/**
 * Category Model
 * Handles all category-related database operations
 * @module models/Category
 * ADDRESSES GAP #4: Category management CRUD operations
 */

const db = require('../config/db');
const errorCodes = require('../utils/errorCodes');

class Category {
  /**
   * Get all categories for a user (including defaults)
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Categories
   */
  static async getAll(userId = null) {
    try {
      // ✅ FIXED: Based on actual schema - all categories are shared
      // Only default categories exist in the current schema
      const query = `
        SELECT DISTINCT
          id, name, description, icon, type, is_default, created_at
        FROM categories
        ORDER BY is_default DESC, type, name;
      `;
      
      const result = await db.query(query);
      
      console.log(`[CATEGORY-DEBUG] Retrieved ${result.rows.length} categories`);
      
      return result.rows;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  /**
   * Create a new category - DISABLED until schema supports user categories
   * @param {Object} data - Category data
   * @returns {Promise<Object>} Created category
   */
  static async create(data) {
    const { name, description, icon, type } = data;
    
    try {
      // ✅ FIXED: Create category without user_id (shared categories)
      const query = `
        INSERT INTO categories (name, description, icon, type, is_default)
        VALUES ($1, $2, $3, $4, false)
        RETURNING *;
      `;
      
      const values = [name, description, icon, type];
      const result = await db.query(query, values);
      
      console.log(`[CATEGORY-DEBUG] Created category:`, result.rows[0]);
      
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        throw {
          ...errorCodes.ALREADY_EXISTS,
          details: 'Category name already exists'
        };
      }
      throw error;
    }
  }

  /**
   * Update a category
   * @param {number} id - Category ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Updated category
   */
  static async update(id, data) {
    const { name, description, icon, type } = data;
    
    try {
      // Check if it's a default category
      const checkQuery = 'SELECT is_default FROM categories WHERE id = $1';
      const checkResult = await db.query(checkQuery, [id]);
      
      if (checkResult.rows[0]?.is_default) {
        throw {
          ...errorCodes.FORBIDDEN,
          message: 'Cannot modify default categories'
        };
      }
      
      const query = `
        UPDATE categories
        SET 
          name = COALESCE($1, name),
          description = COALESCE($2, description),
          icon = COALESCE($3, icon),
          type = COALESCE($4, type)
        WHERE id = $5 AND is_default = false
        RETURNING *;
      `;
      
      const values = [name, description, icon, type, id];
      const result = await db.query(query, values);
      
      if (result.rows.length === 0) {
        throw { ...errorCodes.NOT_FOUND, message: 'Category not found' };
      }
      
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a category (only non-default)
   * @param {number} id - Category ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if it's a default category or in use
      const checkQuery = `
        SELECT 
          c.is_default,
          COUNT(DISTINCT e.id) as expense_count,
          COUNT(DISTINCT i.id) as income_count
        FROM categories c
        LEFT JOIN expenses e ON c.id = e.category_id AND e.deleted_at IS NULL
        LEFT JOIN income i ON c.id = i.category_id AND i.deleted_at IS NULL
        WHERE c.id = $1
        GROUP BY c.id, c.is_default;
      `;
      
      const checkResult = await client.query(checkQuery, [id]);
      const category = checkResult.rows[0];
      
      if (!category) {
        throw { ...errorCodes.NOT_FOUND, message: 'Category not found' };
      }
      
      if (category.is_default) {
        throw {
          ...errorCodes.FORBIDDEN,
          message: 'Cannot delete default categories'
        };
      }
      
      if (category.expense_count > 0 || category.income_count > 0) {
        throw {
          ...errorCodes.VALIDATION_ERROR,
          details: 'Category is in use. Update transactions first.'
        };
      }
      
      // Delete the category
      await client.query('DELETE FROM categories WHERE id = $1', [id]);
      
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = Category;