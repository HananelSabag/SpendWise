/**
 * 💰 TRANSACTION API - Complete Transaction Management
 * Unified API for transactions, recurring templates, and analytics
 * Features: CRUD operations, Recurring logic, Dashboard integration
 * @version 1.0.0 - FOUNDATION REPAIR
 */

import apiClient from './client.js';

/**
 * 📊 Transaction API Module
 */
const transactionAPI = {
  
  // ==========================================
  // 🔧 CORE CRUD OPERATIONS
  // ==========================================
  
  /**
   * Create a new transaction (one-time or recurring)
   * @param {string} type - 'transaction' or 'recurring'  
   * @param {Object} data - Transaction data
   * @returns {Promise<Object>} Created transaction
   */
  async create(type = 'expense', data) {
    try {
      // ✅ FIX: Ensure proper endpoint structure for server routes
      const endpoint = `/transactions/${type}`;
      console.log('📤 Creating transaction:', { endpoint, type, data });
      
      const response = await apiClient.client.post(endpoint, data);
      console.log('✅ Transaction created successfully:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Transaction creation failed:', error);
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
      const response = await apiClient.client.get('/transactions', { params });
      return { success: true, data: response.data };
    } catch (error) {
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
   * Update an existing transaction
   * @param {string} type - 'transaction' or 'recurring'
   * @param {string} id - Transaction ID
   * @param {Object} data - Updated transaction data
   * @returns {Promise<Object>} Updated transaction
   */
  async update(type, id, data) {
    try {
      const response = await apiClient.client.put(`/transactions/${type}/${id}`, data);
      return { success: true, data: response.data };
    } catch (error) {
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

  // ==========================================
  // ⚡ QUICK ACTIONS (Dashboard Integration)
  // ==========================================

  /**
   * Quick expense creation (for dashboard quick actions)
   * @param {Object} data - Expense data { amount, description, categoryId }
   * @returns {Promise<Object>} Created expense
   */
  async createQuickExpense(data) {
    const expenseData = {
      type: 'expense',
      amount: Math.abs(data.amount), // Ensure positive for expense
      description: data.description || 'Quick Expense',
      categoryId: data.categoryId || null, // Use default expense category if none provided
      date: data.date || new Date().toISOString()
    };
    
    return this.create('transaction', expenseData);
  },

  /**
   * Quick income creation (for dashboard quick actions)
   * @param {Object} data - Income data { amount, description, categoryId }
   * @returns {Promise<Object>} Created income
   */
  async createQuickIncome(data) {
    const incomeData = {
      type: 'income',
      amount: Math.abs(data.amount), // Ensure positive for income
      description: data.description || 'Quick Income',
      categoryId: data.categoryId || null, // Use default income category if none provided
      date: data.date || new Date().toISOString()
    };
    
    return this.create('transaction', incomeData);
  },

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
    // Add recurring-specific fields
    const templateData = {
      ...data,
      intervalType: data.intervalType || 'monthly',
      dayOfMonth: data.dayOfMonth || 1, // Default to 1st of month
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      isActive: data.isActive !== undefined ? data.isActive : true
    };
    
    return this.create('recurring', templateData);
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
   * Delete a recurring template
   * @param {string} id - Template ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteRecurringTemplate(id) {
    try {
      const response = await apiClient.client.delete(`/transactions/templates/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError ? apiClient.normalizeError(error) : error };
    }
  },

  /**
   * Advanced delete for recurring transactions
   * @param {string} transactionId - Transaction ID
   * @param {Object} options - Delete options (deleteType, templateId)
   * @returns {Promise<Object>} Deletion result
   */
  async deleteRecurringAdvanced(transactionId, options = {}) {
    try {
      const { deleteType = 'current', templateId } = options;
      const response = await apiClient.client.delete(`/transactions/recurring/${transactionId}`, {
        data: { deleteType, templateId }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError ? apiClient.normalizeError(error) : error };
    }
  },

  /**
   * Skip dates for a recurring template
   * @param {string} id - Template ID
   * @param {Array} dates - Array of dates to skip
   * @returns {Promise<Object>} Updated template
   */
  async skipRecurringDates(id, dates) {
    try {
      const response = await apiClient.client.post(`/transactions/templates/${id}/skip`, { dates });
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
  // 📊 ANALYTICS & DASHBOARD
  // ==========================================

  /**
   * Get dashboard data (summary for dashboard)
   * @param {Object} params - Date range, filters
   * @returns {Promise<Object>} Dashboard data
   */
  async getDashboardData(params = {}) {
    try {
      const response = await apiClient.client.get('/transactions/dashboard', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError ? apiClient.normalizeError(error) : error };
    }
  },

  /**
   * Get transaction summary
   * @param {Object} params - Date range, period
   * @returns {Promise<Object>} Summary data
   */
  async getSummary(params = {}) {
    try {
      const response = await apiClient.client.get('/transactions/summary', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError ? apiClient.normalizeError(error) : error };
    }
  },

  /**
   * Get category breakdown
   * @param {Object} params - Date range, filters
   * @returns {Promise<Object>} Category breakdown
   */
  async getCategoryBreakdown(params = {}) {
    try {
      const response = await apiClient.client.get('/transactions/categories/breakdown', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError ? apiClient.normalizeError(error) : error };
    }
  },

  /**
   * Search transactions
   * @param {string} query - Search query
   * @param {Object} filters - Additional filters
   * @returns {Promise<Object>} Search results
   */
  async search(query, filters = {}) {
    try {
      const response = await apiClient.client.get('/transactions/search', { 
        params: { q: query, ...filters } 
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError ? apiClient.normalizeError(error) : error };
    }
  },

  // ==========================================
  // 🎯 CONVENIENCE METHODS
  // ==========================================

  /**
   * Get balance details
   * @param {string} date - Specific date (optional)
   * @returns {Promise<Object>} Balance details
   */
  async getBalanceDetails(date) {
    try {
      const params = date ? { date } : {};
      const response = await apiClient.client.get('/transactions/balance/details', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError ? apiClient.normalizeError(error) : error };
    }
  },

  /**
   * Get balance history
   * @param {string} period - 'daily', 'weekly', 'monthly'
   * @returns {Promise<Object>} Balance history
   */
  async getBalanceHistory(period = 'monthly') {
    try {
      const response = await apiClient.client.get(`/transactions/balance/history/${period}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError ? apiClient.normalizeError(error) : error };
    }
  },

  // ==========================================
  // 🔧 CONVENIENCE ALIASES FOR HOOKS
  // ==========================================

  /**
   * Create expense (alias for consistency with hooks)
   * @param {Object} data - Expense data
   * @returns {Promise<Object>} Created expense
   */
  async createExpense(data) {
    const expenseData = {
      ...data,
      type: 'expense',
      amount: Math.abs(data.amount) // Ensure positive for expense
    };
    return this.create('expense', expenseData);
  },

  /**
   * Create income (alias for consistency with hooks)
   * @param {Object} data - Income data
   * @returns {Promise<Object>} Created income
   */
  async createIncome(data) {
    const incomeData = {
      ...data,
      type: 'income',
      amount: Math.abs(data.amount) // Ensure positive for income
    };
    return this.create('income', incomeData);
  }
};

export default transactionAPI; 