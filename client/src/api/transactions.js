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
   * Create a new transaction (one-time or recurring) - TIMEZONE AWARE
   * @param {string} type - 'transaction' or 'recurring'  
   * @param {Object} data - Transaction data with timezone support
   * @returns {Promise<Object>} Created transaction
   */
  async create(type = 'expense', data) {
    try {
      // ✅ FIX: Ensure proper endpoint structure for server routes
      const endpoint = `/transactions/${type}`;
      
      // ✅ NEW: Log timezone-aware data for debugging
      console.log('📤 Creating transaction:', { 
        endpoint, 
        type, 
        data: {
          ...data,
          timezone: data.timezone || 'not provided',
          transaction_datetime: data.transaction_datetime || 'not provided'
        }
      });
      
      const response = await apiClient.client.post(endpoint, data);
      console.log('✅ Transaction created successfully:', {
        id: response.data.data?.id,
        transaction_datetime: response.data.data?.transaction_datetime,
        timezone: data.timezone
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Transaction creation failed:', error);
      return { success: false, error: apiClient.normalizeError ? apiClient.normalizeError(error) : error };
    }
  },

  /**
   * Get balance panel data - DEDICATED BALANCE ENDPOINT
   * @returns {Promise<Object>} Balance data for all periods
   */
  async getBalanceData() {
    try {
      console.log('📊 Fetching balance panel data...');
      
      const response = await apiClient.client.get('/transactions/balance');
      console.log('✅ Balance data fetched successfully:', response.data);
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Balance data fetch failed:', error);
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
   * Bulk delete transactions
   * @param {Array<number>} transactionIds - Array of transaction IDs to delete
   * @returns {Promise<Object>} Bulk deletion result
   */
  async bulkDelete(transactionIds) {
    try {
      const response = await apiClient.client.post('/transactions/bulk-delete', {
        transactionIds
      });
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
      
      // Format each template consistently
      const formattedTemplates = templates.map(template => ({
        name: template.name,
        description: template.description || template.name,
        amount: template.amount,
        type: template.type,
        category_name: template.category_name || template.categoryName || 'General',
        interval_type: template.interval_type || template.intervalType || 'monthly',
        day_of_month: template.day_of_month || template.dayOfMonth || 1,
        day_of_week: template.day_of_week || template.dayOfWeek || null,
        is_active: template.is_active !== undefined ? template.is_active : (template.isActive !== undefined ? template.isActive : true)
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