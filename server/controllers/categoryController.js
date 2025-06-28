/**
 * Category Controller - Production Ready
 * Handles all category-related HTTP requests
 * @module controllers/categoryController
 */

const Category = require('../models/Category');
const errorCodes = require('../utils/errorCodes');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const categoryController = {
  /**
   * Get all categories
   * @route GET /api/v1/categories
   */
  getAll: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { type } = req.query;
    
    let categories = await Category.getAll(userId);
    
    // Filter by type if specified
    if (type && ['income', 'expense'].includes(type)) {
      categories = categories.filter(cat => cat.type === type || cat.type === null);
    }
    
    logger.info('Categories retrieved', { 
      userId, 
      count: categories.length,
      type: type || 'all'
    });
    
    res.json({
      success: true,
      data: categories,
      timestamp: new Date().toISOString()
    });
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
   * Delete category
   * @route DELETE /api/v1/categories/:id
   */
  delete: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    
    if (!id || isNaN(parseInt(id))) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Invalid category ID' };
    }
    
    const categoryId = parseInt(id);
    
    // Check if category exists and user owns it
    const category = await Category.getById(categoryId);
    
    if (!category) {
      throw { ...errorCodes.NOT_FOUND, message: 'Category not found' };
    }
    
    if (category.is_default) {
      throw { 
        ...errorCodes.VALIDATION_ERROR, 
        details: 'Cannot delete default categories' 
      };
    }
    
    if (category.user_id !== userId) {
      throw { 
        ...errorCodes.UNAUTHORIZED, 
        details: 'You can only delete your own categories' 
      };
    }
    
    await Category.delete(categoryId, userId);
    
    logger.info('Category deleted', { 
      userId, 
      categoryId, 
      categoryName: category.name
    });
    
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
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