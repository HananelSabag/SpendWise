/**
 * OPTIMIZED Recurring Template Model - Enhanced Performance Version
 * Simplified for use with the new RecurringEngine
 * @module models/RecurringTemplate_optimized
 */

const db = require('../config/db');
const errorCodes = require('../utils/errorCodes');
const logger = require('../utils/logger');

// 🚀 Smart caching for recurring templates
class RecurringTemplateCache {
  static cache = new Map();
  static TTL = 5 * 60 * 1000; // 5 minutes (templates change more frequently)
  static maxSize = 500; // Maximum cache entries

  static generateKey(userId, active = true) {
    return `templates:${userId}:${active ? 'active' : 'all'}`;
  }

  static get(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  static set(key, data) {
    // LRU eviction
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  static invalidateUser(userId) {
    for (const [key] of this.cache) {
      if (key.includes(`:${userId}:`)) {
        this.cache.delete(key);
      }
    }
  }

  static getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      utilization: Math.round((this.cache.size / this.maxSize) * 100)
    };
  }
}

class RecurringTemplate {
  /**
   * 🚀 OPTIMIZED: Create recurring template with enhanced validation
   */
  static async create(data) {
    const start = Date.now();
    
    const {
      user_id, type, amount, description, category_id, interval_type,
      day_of_month, day_of_week, start_date, end_date, notes
    } = data;

    // Enhanced validation
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

    // Date validations
    const startDateObj = new Date(start_date);
    if (isNaN(startDateObj.getTime())) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Invalid start date' };
    }

    if (end_date) {
      const endDateObj = new Date(end_date);
      if (isNaN(endDateObj.getTime()) || endDateObj <= startDateObj) {
        throw { ...errorCodes.VALIDATION_ERROR, details: 'End date must be after start date' };
      }
    }

    try {
      const query = `
        INSERT INTO recurring_templates (
          user_id, type, amount, name, description, category_id, interval_type,
          day_of_month, day_of_week, start_date, end_date, notes,
          is_active, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, NOW())
        RETURNING 
          id, user_id, type, amount, name, description, category_id, interval_type,
          day_of_month, day_of_week, start_date, end_date, notes,
          is_active, created_at
      `;

      const result = await db.query(query, [
        user_id, type, amount, description.trim() || 'Recurring Transaction', description.trim(), category_id,
        interval_type, day_of_month, day_of_week,
        start_date, end_date, notes?.trim() || null
      ], 'create_recurring_template_optimized');

      const template = result.rows[0];

      // Invalidate cache for this user
      RecurringTemplateCache.invalidateUser(user_id);

      const duration = Date.now() - start;
      logger.info('✅ Recurring template created', {
        templateId: template.id,
        userId: user_id,
        type,
        intervalType: interval_type,
        amount,
        duration: `${duration}ms`,
        performance: duration < 50 ? 'excellent' : duration < 200 ? 'good' : 'slow'
      });

      return template;

    } catch (error) {
      const duration = Date.now() - start;

      if (error.code === '23503') {
        logger.warn('Template creation failed - invalid category', {
          userId: user_id, categoryId: category_id, duration: `${duration}ms`
        });
        throw { ...errorCodes.VALIDATION_ERROR, details: 'Invalid category' };
      }

      logger.error('❌ Recurring template creation failed', {
        userId: user_id, error: error.message, duration: `${duration}ms`
      });
      throw { ...errorCodes.SQL_ERROR, details: 'Failed to create recurring template' };
    }
  }

  /**
   * 🚀 OPTIMIZED: Get user templates with smart caching
   */
  static async getUserTemplates(userId, activeOnly = true) {
    const cacheKey = RecurringTemplateCache.generateKey(userId, activeOnly);
    const cached = RecurringTemplateCache.get(cacheKey);
    if (cached) {
      logger.debug('✅ Templates cache hit', { userId, activeOnly });
      return cached;
    }

    try {
      const query = `
        SELECT 
          rt.id, rt.user_id, rt.type, rt.amount, rt.name, rt.description, rt.category_id,
          rt.interval_type, rt.day_of_month, rt.day_of_week, rt.start_date, rt.end_date,
          rt.notes, rt.is_active, rt.created_at, rt.updated_at,
          c.name as category_name, c.icon as category_icon
        FROM recurring_templates rt
        LEFT JOIN categories c ON rt.category_id = c.id
        WHERE rt.user_id = $1 
          ${activeOnly ? 'AND rt.is_active = true' : ''}
          AND (rt.end_date IS NULL OR rt.end_date >= CURRENT_DATE)
        ORDER BY rt.created_at DESC
      `;

      const result = await db.query(query, [userId], 'get_user_templates_optimized');
      const templates = result.rows;

      // Cache the result
      RecurringTemplateCache.set(cacheKey, templates);

      logger.debug('✅ Templates fetched and cached', {
        userId, activeOnly, count: templates.length
      });

      return templates;

    } catch (error) {
      logger.error('❌ Error fetching user templates', {
        userId, activeOnly, error: error.message
      });
      throw { ...errorCodes.SQL_ERROR, details: 'Failed to fetch templates' };
    }
  }

  /**
   * 🚀 OPTIMIZED: Get template by ID
   */
  static async getById(id) {
    try {
      const query = `
        SELECT 
          rt.*, c.name as category_name, c.icon as category_icon
        FROM recurring_templates rt
        LEFT JOIN categories c ON rt.category_id = c.id
        WHERE rt.id = $1
      `;

      const result = await db.query(query, [id], 'get_template_by_id_optimized');
      return result.rows[0] || null;

    } catch (error) {
      logger.error('❌ Error fetching template by ID', {
        templateId: id, error: error.message
      });
      throw { ...errorCodes.SQL_ERROR, details: 'Failed to fetch template' };
    }
  }

  /**
   * 🚀 OPTIMIZED: Update template with cache invalidation
   */
  static async update(id, updates) {
    const start = Date.now();

    const allowedFields = [
      'amount', 'description', 'category_id', 'interval_type',
      'day_of_month', 'day_of_week', 'end_date', 'notes', 'is_active'
    ];

    const fields = Object.keys(updates).filter(field => allowedFields.includes(field));
    if (fields.length === 0) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'No valid fields to update' };
    }

    // Validate updates
    if (updates.amount !== undefined && updates.amount <= 0) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Amount must be positive' };
    }

    try {
      const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
      const values = [id, ...fields.map(field => updates[field])];

      const query = `
        UPDATE recurring_templates 
        SET ${setClause}, updated_at = NOW()
        WHERE id = $1
        RETURNING user_id, type, amount, description, interval_type
      `;

      const result = await db.query(query, values, 'update_template_optimized');
      
      if (result.rows.length === 0) {
        throw { ...errorCodes.NOT_FOUND, details: 'Template not found' };
      }

      const template = result.rows[0];

      // Invalidate cache for this user
      RecurringTemplateCache.invalidateUser(template.user_id);

      const duration = Date.now() - start;
      logger.info('✅ Template updated', {
        templateId: id,
        userId: template.user_id,
        fields,
        duration: `${duration}ms`,
        performance: duration < 50 ? 'excellent' : duration < 200 ? 'good' : 'slow'
      });

      return await this.getById(id); // Return full updated template

    } catch (error) {
      if (error.code && error.message) {
        throw error;
      }

      const duration = Date.now() - start;
      logger.error('❌ Template update failed', {
        templateId: id, error: error.message, duration: `${duration}ms`
      });
      throw { ...errorCodes.SQL_ERROR, details: 'Failed to update template' };
    }
  }

  /**
   * 🚀 OPTIMIZED: Delete template with cache invalidation
   */
  static async delete(id) {
    try {
      const query = `
        DELETE FROM recurring_templates 
        WHERE id = $1
        RETURNING user_id
      `;

      const result = await db.query(query, [id], 'delete_template_optimized');
      
      if (result.rows.length === 0) {
        throw { ...errorCodes.NOT_FOUND, details: 'Template not found' };
      }

      const userId = result.rows[0].user_id;

      // Invalidate cache for this user
      RecurringTemplateCache.invalidateUser(userId);

      logger.info('✅ Template deleted', { templateId: id, userId });
      return true;

    } catch (error) {
      if (error.code && error.message) {
        throw error;
      }

      logger.error('❌ Template deletion failed', {
        templateId: id, error: error.message
      });
      throw { ...errorCodes.SQL_ERROR, details: 'Failed to delete template' };
    }
  }

  /**
   * 🚀 NEW: Add skip date to template
   */
  static async addSkipDate(id, skipDate) {
    try {
      const dateStr = skipDate instanceof Date ? 
        skipDate.toISOString().split('T')[0] : 
        new Date(skipDate).toISOString().split('T')[0];

      const query = `
        UPDATE recurring_templates 
        SET skip_dates = COALESCE(skip_dates, '[]'::jsonb) || $2::jsonb,
            updated_at = NOW()
        WHERE id = $1
        RETURNING user_id
      `;

      const result = await db.query(query, [id, JSON.stringify([dateStr])], 'add_skip_date_optimized');
      
      if (result.rows.length === 0) {
        throw { ...errorCodes.NOT_FOUND, details: 'Template not found' };
      }

      const userId = result.rows[0].user_id;
      RecurringTemplateCache.invalidateUser(userId);

      logger.info('✅ Skip date added', { templateId: id, skipDate: dateStr, userId });
      return true;

    } catch (error) {
      logger.error('❌ Add skip date failed', {
        templateId: id, skipDate, error: error.message
      });
      throw { ...errorCodes.SQL_ERROR, details: 'Failed to add skip date' };
    }
  }

  /**
   * 📊 Get performance statistics
   */
  static getPerformanceStats() {
    return {
      cache: RecurringTemplateCache.getStats(),
      database: db.getPerformanceStats()
    };
  }

  /**
   * 🧹 Clear cache
   */
  static clearCache() {
    RecurringTemplateCache.cache.clear();
    logger.info('🧹 RecurringTemplate cache cleared');
  }
}

module.exports = { 
  RecurringTemplate,
  RecurringTemplateCache
}; 