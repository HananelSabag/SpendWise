/**
 * Category Controller - Production Ready + Enhanced Debugging
 * Handles all category-related HTTP requests with comprehensive failure tracking
 * @module controllers/categoryController
 */

const Category = require('../models/Category');
const errorCodes = require('../utils/errorCodes');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// 🔍 Enhanced debugging utilities
const debugCategory = {
  logRequest: (action, userId, params = {}) => {
    const requestId = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    logger.info(`🏷️ [${requestId}] Category ${action} initiated`, {
      userId,
      action,
      params,
      timestamp: new Date().toISOString(),
      requestId
    });
    return requestId;
  },
  
  logSuccess: (requestId, action, result, duration) => {
    logger.info(`✅ [${requestId}] Category ${action} succeeded`, {
      action,
      resultType: typeof result,
      hasData: !!result,
      dataCount: Array.isArray(result) ? result.length : (result?.id ? 1 : 0),
      duration: `${duration}ms`,
      requestId
    });
  },
  
  logError: (requestId, action, error, context = {}) => {
    logger.error(`❌ [${requestId}] Category ${action} failed`, {
      action,
      error: {
        message: error.message,
        code: error.code,
        stack: error.stack?.split('\n').slice(0, 3)
      },
      context,
      requestId,
      timestamp: new Date().toISOString()
    });
  },
  
  logValidation: (requestId, action, validationErrors) => {
    logger.warn(`⚠️ [${requestId}] Category ${action} validation failed`, {
      action,
      validationErrors,
      requestId
    });
  }
};

const categoryController = {
  /**
   * Get all categories
   * @route GET /api/v1/categories
   */
  getAll: asyncHandler(async (req, res) => {
    const start = Date.now();
    const userId = req.user.id;
    const { type, defaults_only, user_only } = req.query;
    const requestId = debugCategory.logRequest('getAll', userId, { type, defaults_only, user_only });
    
    try {
      // Determine what categories to include
      let includeDefaults = true;
      if (user_only === 'true') {
        includeDefaults = false;
      }
      
      logger.debug(`🔍 [${requestId}] Fetching categories`, {
        userId,
        includeDefaults,
        type,
        defaults_only,
        user_only
      });
      
      let categories = await Category.findAllByUser(userId, false, includeDefaults);
      
      logger.debug(`🔍 [${requestId}] Raw categories fetched`, {
        totalCount: categories.length,
        defaultCount: categories.filter(c => c.is_default).length,
        userCount: categories.filter(c => c.user_id === userId).length
      });
      
      // If only defaults requested, filter to only default categories
      if (defaults_only === 'true') {
        categories = categories.filter(cat => cat.is_default === true);
        logger.debug(`🔍 [${requestId}] Filtered to defaults only`, { count: categories.length });
      }
      
      // If only user categories requested, filter to only user categories
      if (user_only === 'true') {
        categories = categories.filter(cat => cat.user_id === userId);
        logger.debug(`🔍 [${requestId}] Filtered to user categories only`, { count: categories.length });
      }
      
      // Filter by type if specified
      if (type && ['income', 'expense'].includes(type)) {
        const beforeCount = categories.length;
        categories = categories.filter(cat => cat.type === type || cat.type === null);
        logger.debug(`🔍 [${requestId}] Filtered by type ${type}`, { 
          beforeCount, 
          afterCount: categories.length 
        });
      }
      
      const duration = Date.now() - start;
      debugCategory.logSuccess(requestId, 'getAll', categories, duration);
      
      res.json({
        success: true,
        data: categories,
        metadata: {
          count: categories.length,
          filters: { type, defaults_only, user_only },
          duration: `${duration}ms`
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      debugCategory.logError(requestId, 'getAll', error, { type, defaults_only, user_only });
      throw error;
    }
  }),

  /**
   * Get single category
   * @route GET /api/v1/categories/:id
   */
  getById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    
    if (!id || isNaN(parseInt(id))) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Invalid category ID' };
    }
    
    const category = await Category.getById(parseInt(id));
    
    if (!category) {
      throw { ...errorCodes.NOT_FOUND, message: 'Category not found' };
    }
    
    // Check if user can access this category (default or owns it)
    if (!category.is_default && category.user_id !== userId) {
      throw { ...errorCodes.UNAUTHORIZED, message: 'Access denied to this category' };
    }
    
    res.json({
      success: true,
      data: category,
      timestamp: new Date().toISOString()
    });
  }),

  /**
   * Create new category
   * @route POST /api/v1/categories
   */
  create: asyncHandler(async (req, res) => {
    const { name, description, icon, type } = req.body;
    const userId = req.user.id;
    
    // Validation
    if (!name?.trim()) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Category name is required' };
    }
    
    if (!type || !['income', 'expense'].includes(type)) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Type must be income or expense' };
    }
    
    if (name.length > 100) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Category name must be less than 100 characters' };
    }
    
    const category = await Category.create({
      name: name.trim(),
      description: description?.trim() || null,
      icon: icon?.trim() || 'tag',
      type
    }, userId);
    
    logger.info('Category created', { 
      userId, 
      categoryId: category.id, 
      name: category.name,
      type: category.type
    });
    
    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully'
    });
  }),

  /**
   * Update category
   * @route PUT /api/v1/categories/:id
   */
  update: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, icon, type } = req.body;
    const userId = req.user.id;
    
    if (!id || isNaN(parseInt(id))) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Invalid category ID' };
    }
    
    // Validation
    if (name && (!name.trim() || name.length > 100)) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Invalid category name' };
    }
    
    if (type && !['income', 'expense'].includes(type)) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Type must be income or expense' };
    }
    
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (icon) updateData.icon = icon.trim();
    if (type) updateData.type = type;
    
    if (Object.keys(updateData).length === 0) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'No valid updates provided' };
    }
    
    const category = await Category.update(parseInt(id), updateData, userId);
    
    if (!category) {
      throw { ...errorCodes.NOT_FOUND, message: 'Category not found' };
    }
    
    logger.info('Category updated', { 
      userId, 
      categoryId: category.id, 
      updates: Object.keys(updateData)
    });
    
    res.json({
      success: true,
      data: category,
      message: 'Category updated successfully'
    });
  }),

  /**
   * Delete category with transaction safety checks
   * @route DELETE /api/v1/categories/:id
   */
  delete: asyncHandler(async (req, res) => {
    const start = Date.now();
    const { id } = req.params;
    const userId = req.user.id;
    const requestId = debugCategory.logRequest('delete', userId, { categoryId: id });
    
    try {
      if (!id || isNaN(parseInt(id))) {
        debugCategory.logValidation(requestId, 'delete', { issue: 'Invalid category ID', providedId: id });
        throw { ...errorCodes.VALIDATION_ERROR, details: 'Invalid category ID' };
      }
      
      const categoryId = parseInt(id);
      
      // Check if category exists and user owns it
      logger.debug(`🔍 [${requestId}] Checking category existence`, { categoryId });
      const category = await Category.getById(categoryId);
      
      if (!category) {
        debugCategory.logError(requestId, 'delete', new Error('Category not found'), { categoryId });
        throw { ...errorCodes.NOT_FOUND, message: 'Category not found' };
      }
      
      logger.debug(`🔍 [${requestId}] Category found`, {
        categoryId,
        categoryName: category.name,
        isDefault: category.is_default,
        ownerId: category.user_id
      });
      
      if (category.is_default) {
        debugCategory.logValidation(requestId, 'delete', { 
          issue: 'Cannot delete default category',
          categoryName: category.name 
        });
        throw { 
          ...errorCodes.VALIDATION_ERROR, 
          details: 'Cannot delete default categories' 
        };
      }
      
      if (category.user_id !== userId) {
        debugCategory.logValidation(requestId, 'delete', { 
          issue: 'User does not own category',
          categoryUserId: category.user_id,
          requestUserId: userId 
        });
        throw { 
          ...errorCodes.UNAUTHORIZED, 
          details: 'You can only delete your own categories' 
        };
      }
      
      // Check transaction usage before deletion
      logger.debug(`🔍 [${requestId}] Checking transaction usage`, { categoryId });
      const db = require('../config/db');
      const transactionCheck = await db.query(`
        SELECT COUNT(*) as count FROM transactions 
        WHERE category_id = $1 AND user_id = $2 AND deleted_at IS NULL
      `, [categoryId, userId]);
      
      const transactionCount = parseInt(transactionCheck.rows[0].count);
      logger.debug(`🔍 [${requestId}] Transaction usage check`, { 
        categoryId,
        transactionCount,
        deletionType: transactionCount > 0 ? 'soft' : 'hard'
      });
      
      await Category.delete(categoryId, userId);
      
      const duration = Date.now() - start;
      debugCategory.logSuccess(requestId, 'delete', { 
        categoryId, 
        categoryName: category.name,
        deletionType: transactionCount > 0 ? 'soft' : 'hard',
        transactionCount
      }, duration);
      
      res.json({
        success: true,
        message: 'Category deleted successfully',
        metadata: {
          categoryId,
          categoryName: category.name,
          deletionType: transactionCount > 0 ? 'soft' : 'hard',
          transactionCount,
          duration: `${duration}ms`
        }
      });
    } catch (error) {
      debugCategory.logError(requestId, 'delete', error, { categoryId: id });
      throw error;
    }
  }),

  /**
   * Get category usage statistics
   * @route GET /api/v1/categories/:id/stats
   */
  getStats: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    
    if (!id || isNaN(parseInt(id))) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Invalid category ID' };
    }
    
    const stats = await Category.getUsageStats(parseInt(id), userId);
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  }),

  /**
   * Get categories with transaction counts
   * @route GET /api/v1/categories/with-counts
   */
  getWithCounts: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;
    
    const categories = await Category.getWithTransactionCounts(
      userId, 
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );
    
    res.json({
      success: true,
      data: categories,
      timestamp: new Date().toISOString()
    });
  })
};

module.exports = categoryController;