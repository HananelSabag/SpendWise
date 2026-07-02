/**
 * 💰 TRANSACTION API - Complete Transaction Management
 * Unified API for transactions, recurring templates, and analytics
 * Features: CRUD operations, Recurring logic, Dashboard integration
 * @version 1.0.0 - FOUNDATION REPAIR
 */

import apiClient from './client.js';
import { createLogger } from '../utils/logger';

// Create logger instance
const logger = createLogger('TransactionAPI');

/**
 * 📊 Transaction API Module
 */
const transactionAPI = {
  
  // ==========================================
  // 🔧 CORE CRUD OPERATIONS
  // ==========================================
  
  /**
   * Create a new transaction (one-time or recurring) - TIMEZONE AWARE
   * @param {string} type - 'transaction' or 'recurring'  
   * @param {Object} data - Transaction data with timezone support
   * @returns {Promise<Object>} Created transaction
   */
  async create(type = 'expense', data) {
    try {
      // ✅ FIX: Ensure proper endpoint structure for server routes
      const endpoint = `/transactions/${type}`;
      
      logger.debug(`Creating ${type} transaction`, { endpoint });
      
      const response = await apiClient.client.post(endpoint, data);
      logger.success('Transaction created successfully');
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Transaction creation failed:', error.message);
      return { success: false, error: apiClient.normalizeError ? apiClient.normalizeError(error) : error };
    }
  },

  /**
   * Get transactions with filtering and pagination
   * @param {Object} params - Query parameters (filters, pagination)
   * @returns {Promise<Object>} Transactions list
   */
  async getAll(params = {}) {
    try {
      console.log('🌐 Transactions API Call:', {
        url: '/transactions',
        params,
        fullUrl: `/transactions?${new URLSearchParams(params).toString()}`,
        timestamp: new Date().toISOString()
      });

      const response = await apiClient.client.get('/transactions', { params });
      
      console.log('🌐 Transactions API Response:', {
        url: '/transactions',
        params,
        responseSuccess: response?.data?.success,
        transactionCount: response?.data?.data?.transactions?.length || 0,
        firstTransactionDate: response?.data?.data?.transactions?.[0]?.date,
        lastTransactionDate: response?.data?.data?.transactions?.[response?.data?.data?.transactions?.length - 1]?.date,
        allDates: response?.data?.data?.transactions?.map(t => t.date).slice(0, 5), // First 5 dates
        timestamp: new Date().toISOString()
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error('🌐 Transactions API Error:', {
        url: '/transactions',
        params,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      console.error('TransactionAPI.getAll error:', error);
      return { success: false, error: apiClient.normalizeError ? apiClient.normalizeError(error) : error };
    }
  },

  /**
   * Get recent transactions (dashboard/quick view)
   * @param {number} limit - Number of transactions to fetch
   * @returns {Promise<Object>} Recent transactions
   */
  async getRecent(limit = 10) {
    try {
      const response = await apiClient.client.get('/transactions/recent', { 
        params: { limit } 
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError ? apiClient.normalizeError(error) : error };
    }
  },

  /**
   * Update an existing transaction - TIMEZONE AWARE
   * @param {string} type - 'transaction' or 'recurring'
   * @param {string} id - Transaction ID
   * @param {Object} data - Updated transaction data with timezone support
   * @returns {Promise<Object>} Updated transaction
   */
  async update(type, id, data) {
    try {
      console.log('📝 Updating transaction:', { 
        type, 
        id,
        timezone: data.timezone || 'not provided',
        transaction_datetime: data.transaction_datetime || 'not provided'
      });
      
      const response = await apiClient.client.put(`/transactions/${type}/${id}`, data);
      console.log('✅ Transaction updated successfully:', {
        id: response.data.data?.id,
        transaction_datetime: response.data.data?.transaction_datetime
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Transaction update failed:', error);
      return { success: false, error: apiClient.normalizeError ? apiClient.normalizeError(error) : error };
    }
  },

  /**
   * Delete a transaction (soft delete)
   * @param {string} type - 'transaction' or 'recurring'
   * @param {string} id - Transaction ID
   * @returns {Promise<Object>} Deletion result
   */
  async delete(type, id) {
    try {
      const response = await apiClient.client.delete(`/transactions/${type}/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError ? apiClient.normalizeError(error) : error };
    }
  },

  /**
   * 🔥 FRESH BULK DELETE - Simple and clean implementation
   * @param {Array<number>} transactionIds - Array of transaction IDs to delete
   * @returns {Promise<Object>} Bulk deletion result
   */
  async freshBulkDelete(transactionIds) {
    if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
      throw new Error('Transaction IDs must be a non-empty array');
    }

    try {
      console.log('🔥 FRESH BULK DELETE: Starting...', {
        transactionIds,
        count: transactionIds.length,
        token: localStorage.getItem('accessToken') ? 'TOKEN_PRESENT' : 'NO_TOKEN',
        apiUrl: apiClient.client.defaults.baseURL,
        headers: apiClient.client.defaults.headers
      });

      const response = await apiClient.client.post('/transactions/bulk-delete', {
        transactionIds
      });

      console.log('✅ FRESH BULK DELETE: Success!', response.data);
      return response.data;

    } catch (error) {
      console.error('❌ FRESH BULK DELETE: Failed!', error);
      console.error('❌ FRESH BULK DELETE: Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
        request: error.request,
        message: error.message
      });
      throw error;
    }
  },

  // ==========================================
  // ⚡ QUICK ACTIONS (Dashboard Integration)
  // ==========================================

  // ==========================================
  // 🔄 RECURRING TRANSACTIONS
  // ==========================================

  /**
   * Get all recurring templates
   * @returns {Promise<Object>} Recurring templates
   */
  async getRecurringTemplates() {
    try {
      const response = await apiClient.client.get('/transactions/templates');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError ? apiClient.normalizeError(error) : error };
    }
  },

  /**
   * Create a recurring template
   * @param {Object} data - Recurring template data
   * @returns {Promise<Object>} Created template
   */
  async createRecurringTemplate(data) {
    try {
      // ✅ FIX: Use correct server endpoint for recurring templates
      const endpoint = `/transactions/templates`;
      console.log('📤 Creating recurring template:', { endpoint, data });
      
      // Add recurring-specific fields
      const templateData = {
        ...data,
        interval_type: data.interval_type || data.intervalType || 'monthly',
        day_of_month: data.day_of_month || data.dayOfMonth || 1,
        day_of_week: data.day_of_week || data.dayOfWeek || null,
        start_date: data.start_date || data.startDate || new Date().toISOString().split('T')[0],
        is_active: data.is_active !== undefined ? data.is_active : (data.isActive !== undefined ? data.isActive : true)
      };
      
      const response = await apiClient.client.post(endpoint, templateData);
      console.log('✅ Recurring template created successfully:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Recurring template creation failed:', error);
      return { success: false, error: apiClient.normalizeError ? apiClient.normalizeError(error) : error };
    }
  },

  /**
   * ✅ BULK CREATE RECURRING TEMPLATES - FOR ONBOARDING
   * Creates multiple templates in one request to avoid rate limits
   * @param {Array} templates - Array of template data objects
   * @returns {Promise<Object>} Bulk creation result
   */
  async createBulkRecurringTemplates(templates) {
    try {
      const endpoint = `/transactions/templates/bulk`;
      console.log('📤 Creating bulk recurring templates:', { endpoint, count: templates.length });
      
      // ✅ TIMEZONE FIX: Format each template consistently with timezone support
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      const formattedTemplates = templates.map(template => ({
        name: template.name,
        description: template.description || template.name,
        amount: template.amount,
        type: template.type,
        category_name: template.category_name || template.categoryName || 'General',
        interval_type: template.interval_type || template.intervalType || 'monthly',
        day_of_month: template.day_of_month || template.dayOfMonth || 1,
        day_of_week: template.day_of_week || template.dayOfWeek || null,
        is_active: template.is_active !== undefined ? template.is_active : (template.isActive !== undefined ? template.isActive : true),
        // ✅ NEW: Add timezone support for onboarding templates
        timezone: template.timezone || userTimezone,
        preferred_time: template.preferred_time || '09:00' // Default to 9 AM for onboarding templates
      }));
      
      const response = await apiClient.client.post(endpoint, { templates: formattedTemplates });
      console.log('✅ Bulk recurring templates created successfully:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Bulk recurring template creation failed:', error);
      return { success: false, error: apiClient.normalizeError ? apiClient.normalizeError(error) : error };
    }
  },

  /**
   * Update a recurring template
   * @param {string} id - Template ID
   * @param {Object} data - Updated template data
   * @returns {Promise<Object>} Updated template
   */
  async updateRecurringTemplate(id, data) {
    try {
      const response = await apiClient.client.put(`/transactions/templates/${id}`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError ? apiClient.normalizeError(error) : error };
    }
  },

  /**
   * Delete a recurring template - ENHANCED WITH SMART DELETE OPTIONS
   * @param {string} id - Template ID
   * @param {Object} options - Delete options with scope
   * @returns {Promise<Object>} Deletion result
   */
  async deleteRecurringTemplate(id, options = {}) {
    try {
      const params = {};
      if (options.scope) {
        params.scope = options.scope;
      }
      
      const response = await apiClient.client.delete(`/transactions/templates/${id}`, { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError ? apiClient.normalizeError(error) : error };
    }
  },

  /**
   * Generate recurring transactions manually
   * @returns {Promise<Object>} Generated transactions
   */
  async generateRecurring() {
    try {
      const response = await apiClient.client.post('/transactions/generate-recurring');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError ? apiClient.normalizeError(error) : error };
    }
  },

  // ==========================================
  // 📅 UPCOMING TRANSACTIONS MANAGEMENT
  // ==========================================

  /**
   * Get upcoming transactions for user
   * @returns {Promise<Object>} Upcoming transactions
   */
  async getUpcomingTransactions() {
    try {
      const response = await apiClient.client.get('/transactions/upcoming');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError ? apiClient.normalizeError(error) : error };
    }
  },

  /**
   * Delete specific upcoming transaction
   * @param {string} id - Upcoming transaction ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteUpcomingTransaction(id) {
    try {
      const response = await apiClient.client.delete(`/transactions/upcoming/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError ? apiClient.normalizeError(error) : error };
    }
  },

  /**
   * Stop generating upcoming transactions for a template
   * @param {string} templateId - Template ID
   * @returns {Promise<Object>} Stop result
   */
  async stopTemplateGeneration(templateId) {
    try {
      const response = await apiClient.client.post(`/transactions/templates/${templateId}/stop`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError ? apiClient.normalizeError(error) : error };
    }
  },

  /**
   * Regenerate upcoming transactions for a specific template
   * @param {string} templateId - Template ID
   * @returns {Promise<Object>} Regeneration result
   */
  async regenerateUpcomingForTemplate(templateId) {
    try {
      const response = await apiClient.client.post(`/transactions/templates/${templateId}/regenerate`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError ? apiClient.normalizeError(error) : error };
    }
  },

  // ==========================================
  // 📊 ANALYTICS & DASHBOARD
  // ==========================================

  /**
   * Get dashboard data (summary for dashboard)
   * @param {Object} params - Date range, filters
   * @returns {Promise<Object>} Dashboard data
   */
  async getDashboardData(params = {}) {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('authToken');
      if (!token) return { success: false, error: { code: 'NO_TOKEN' }, data: null };
      const response = await apiClient.client.get('/transactions/dashboard', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError ? apiClient.normalizeError(error) : error };
    }
  },

  // NOTE: removed dead methods (0 callers, verified 2026-07-03):
  //   getSummary, getCategoryBreakdown, search, getBalanceDetails,
  //   getBalanceHistory, createExpense, createIncome — their server routes
  //   were removed in the same cleanup.
};

export default transactionAPI; 