/**
 * 🏷️ CATEGORIES API MODULE - Complete Category Management
 * Features: CRUD operations, user/default categories, analytics integration
 * @module api/categories
 */

import { api } from './client.js';

export const categoriesAPI = {
  /**
   * Get all categories (both default and user-specific)
   * @param {string} type - Filter by type: 'income', 'expense', or null for all
   * @returns {Promise<Object>} Categories list
   */
  async getAll(type = null) {
    try {
      const params = {};
      if (type) {
        params.type = type;
      }

      const response = await api.get('/categories', { params });
      
      return {
        success: true,
        data: response.data?.data || response.data || []
      };
    } catch (error) {
      return {
        success: false,
        error: api.normalizeError ? api.normalizeError(error) : error
      };
    }
  },

  /**
   * Create a new user category
   * @param {Object} categoryData - Category data
   * @returns {Promise<Object>} Created category
   */
  async create(categoryData) {
    try {
      const response = await api.post('/categories', categoryData);
      
      return {
        success: true,
        data: response.data?.data || response.data
      };
    } catch (error) {
      return {
        success: false,
        error: api.normalizeError ? api.normalizeError(error) : error
      };
    }
  },

  /**
   * Update an existing category
   * @param {number} id - Category ID
   * @param {Object} updateData - Updated category data
   * @returns {Promise<Object>} Updated category
   */
  async update(id, updateData) {
    try {
      const response = await api.put(`/categories/${id}`, updateData);
      
      return {
        success: true,
        data: response.data?.data || response.data
      };
    } catch (error) {
      return {
        success: false,
        error: api.normalizeError ? api.normalizeError(error) : error
      };
    }
  },

  /**
   * Delete a category (soft delete)
   * @param {number} id - Category ID
   * @returns {Promise<Object>} Delete result
   */
  async delete(id) {
    try {
      const response = await api.delete(`/categories/${id}`);
      
      return {
        success: true,
        data: response.data?.data || response.data
      };
    } catch (error) {
      return {
        success: false,
        error: api.normalizeError ? api.normalizeError(error) : error
      };
    }
  },

  /**
   * Get category by ID
   * @param {number} id - Category ID
   * @returns {Promise<Object>} Category details
   */
  async getById(id) {
    try {
      const response = await api.get(`/categories/${id}`);
      
      return {
        success: true,
        data: response.data?.data || response.data
      };
    } catch (error) {
      return {
        success: false,
        error: api.normalizeError ? api.normalizeError(error) : error
      };
    }
  },

  /**
   * Get default categories only
   * @param {string} type - Filter by type: 'income', 'expense', or null for all
   * @returns {Promise<Object>} Default categories list
   */
  async getDefaults(type = null) {
    try {
      const params = { defaults_only: true };
      if (type) {
        params.type = type;
      }

      const response = await api.get('/categories', { params });
      
      return {
        success: true,
        data: response.data?.data || response.data || []
      };
    } catch (error) {
      return {
        success: false,
        error: api.normalizeError ? api.normalizeError(error) : error
      };
    }
  },

  /**
   * Get user-specific categories only
   * @param {string} type - Filter by type: 'income', 'expense', or null for all
   * @returns {Promise<Object>} User categories list
   */
  async getUserCategories(type = null) {
    try {
      const params = { user_only: true };
      if (type) {
        params.type = type;
      }

      const response = await api.get('/categories', { params });
      
      return {
        success: true,
        data: response.data?.data || response.data || []
      };
    } catch (error) {
      return {
        success: false,
        error: api.normalizeError ? api.normalizeError(error) : error
      };
    }
  },

  /**
   * Search categories
   * @param {string} query - Search query
   * @param {Object} filters - Additional filters
   * @returns {Promise<Object>} Search results
   */
  async search(query, filters = {}) {
    try {
      const params = { search: query, ...filters };
      const response = await api.get('/categories/search', { params });
      
      return {
        success: true,
        data: response.data?.data || response.data || []
      };
    } catch (error) {
      return {
        success: false,
        error: api.normalizeError ? api.normalizeError(error) : error
      };
    }
  },

  /**
   * Get category analytics
   * @param {number} categoryId - Category ID (optional)
   * @returns {Promise<Object>} Category analytics
   */
  async getAnalytics(categoryId = null) {
    try {
      const endpoint = categoryId 
        ? `/categories/${categoryId}/analytics` 
        : '/categories/analytics';
      
      const response = await api.get(endpoint);
      
      return {
        success: true,
        data: response.data?.data || response.data || {}
      };
    } catch (error) {
      return {
        success: false,
        error: api.normalizeError ? api.normalizeError(error) : error
      };
    }
  },

  /**
   * Get smart category suggestions based on transaction description
   * @param {string} description - Transaction description
   * @param {number} amount - Transaction amount
   * @param {string} type - Transaction type ('income' or 'expense')
   * @returns {Promise<Object>} Suggested categories
   */
  async getSuggestions(description, amount = null, type = null) {
    try {
      const params = { description };
      if (amount) params.amount = amount;
      if (type) params.type = type;

      const response = await api.get('/categories/suggestions', { params });
      
      return {
        success: true,
        data: response.data?.data || response.data || []
      };
    } catch (error) {
      return {
        success: false,
        error: api.normalizeError ? api.normalizeError(error) : error
      };
    }
  }
};

export default categoriesAPI; 