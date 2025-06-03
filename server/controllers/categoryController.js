/**
 * Category Controller
 * Handles all category-related HTTP requests
 * @module controllers/categoryController
 * ADDRESSES GAP #4: Category management endpoints
 */

const Category = require('../models/Category');
const { asyncHandler } = require('../middleware/errorHandler');

const categoryController = {
  /**
   * Get all categories
   * @route GET /api/v1/categories
   */
  getAll: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const categories = await Category.getAll(userId);
    
    res.json({
      success: true,
      data: categories,
      timestamp: new Date().toISOString()
    });
  }),

  /**
   * Create new category
   * @route POST /api/v1/categories
   */
  create: asyncHandler(async (req, res) => {
    const { name, description, icon, type } = req.body;
    
    if (!name || !type) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Name and type are required'
        }
      });
    }
    
    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Type must be income or expense'
        }
      });
    }
    
    const category = await Category.create({
      name,
      description,
      icon: icon || 'tag',
      type
    });
    
    console.log(`[CATEGORY-DEBUG] Category created:`, category);
    
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
    
    const category = await Category.update(parseInt(id), {
      name,
      description,
      icon,
      type
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
    
    await Category.delete(parseInt(id));
    
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  })
};

module.exports = categoryController;