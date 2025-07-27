/**
 * 🚀 UNIFIED SPENDWISE API - COMPLETE SYSTEM
 * Replaces utils/api.js (820 lines) + services/apiService.js (121 lines)
 * Features: Auth, Admin, Analytics, Performance, Export, Transactions, Categories
 * @version 2.0.0
 */

// ✅ Import all API modules
import { api as apiClient, apiConfig } from './client.js';
import authAPI from './auth.js';
import adminAPI from './admin.js';
import analyticsAPI from './analytics.js';
import performanceAPI from './performance.js';

// ✅ Transactions API Module
const transactionsAPI = {
  // Get all transactions with filters
  async getAll(params = {}) {
    try {
      const response = await apiClient.client.get('/transactions', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // Create single transaction
  async create(transactionData) {
    try {
      const response = await apiClient.client.post('/transactions', transactionData);
      apiClient.clearCache('transactions');
      apiClient.clearCache('dashboard');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // Create multiple transactions (batch)
  async createBatch(transactions) {
    try {
      const response = await apiClient.client.post('/transactions/batch', { transactions });
      apiClient.clearCache('transactions');
      apiClient.clearCache('dashboard');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // Update transaction
  async update(id, updates) {
    try {
      const response = await apiClient.client.put(`/transactions/${id}`, updates);
      apiClient.clearCache('transactions');
      apiClient.clearCache('dashboard');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // Delete transaction
  async delete(id) {
    try {
      await apiClient.client.delete(`/transactions/${id}`);
      apiClient.clearCache('transactions');
      apiClient.clearCache('dashboard');
      return { success: true };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // Get recent transactions
  async getRecent(limit = 10) {
    try {
      const response = await apiClient.client.get(`/transactions?limit=${limit}&sort=date&order=desc`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // Get analytics for transactions
  async getAnalytics(params = {}) {
    try {
      const response = await apiClient.cachedRequest('/transactions/analytics', {
        method: 'GET',
        params
      }, `transaction-analytics-${JSON.stringify(params)}`, 5 * 60 * 1000);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // Recurring templates
  recurring: {
    async getTemplates() {
      try {
        const response = await apiClient.cachedRequest('/transactions/recurring/templates', {
          method: 'GET'
        }, 'recurring-templates', 10 * 60 * 1000);
        return { success: true, data: response.data };
      } catch (error) {
        return { success: false, error: apiClient.normalizeError(error) };
      }
    },

    async create(template) {
      try {
        const response = await apiClient.client.post('/transactions/recurring/templates', template);
        apiClient.clearCache('recurring-templates');
        return { success: true, data: response.data };
      } catch (error) {
        return { success: false, error: apiClient.normalizeError(error) };
      }
    },

    async update(id, updates) {
      try {
        const response = await apiClient.client.put(`/transactions/recurring/templates/${id}`, updates);
        apiClient.clearCache('recurring-templates');
        return { success: true, data: response.data };
      } catch (error) {
        return { success: false, error: apiClient.normalizeError(error) };
      }
    },

    async delete(id) {
      try {
        await apiClient.client.delete(`/transactions/recurring/templates/${id}`);
        apiClient.clearCache('recurring-templates');
        return { success: true };
      } catch (error) {
        return { success: false, error: apiClient.normalizeError(error) };
      }
    },

    async preview(id, count = 5) {
      try {
        const response = await apiClient.client.get(`/transactions/recurring/templates/${id}/preview?count=${count}`);
        return { success: true, data: response.data };
      } catch (error) {
        return { success: false, error: apiClient.normalizeError(error) };
      }
    }
  }
};

// ✅ Categories API Module
const categoriesAPI = {
  // Get all categories
  async getAll() {
    try {
      const response = await apiClient.cachedRequest('/categories', {
        method: 'GET'
      }, 'categories', 30 * 60 * 1000); // 30 minute cache
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // Create category
  async create(categoryData) {
    try {
      const response = await apiClient.client.post('/categories', categoryData);
      apiClient.clearCache('categories');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // Update category
  async update(id, updates) {
    try {
      const response = await apiClient.client.put(`/categories/${id}`, updates);
      apiClient.clearCache('categories');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // Delete category
  async delete(id) {
    try {
      await apiClient.client.delete(`/categories/${id}`);
      apiClient.clearCache('categories');
      return { success: true };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // Get smart category suggestions (mock implementation for now)
  async getSmartSuggestions(userId) {
    try {
      // TODO: Replace with actual smart suggestions API when available
      // For now, return default categories as suggestions
      const defaultSuggestions = [
        { name: 'Food & Dining', icon: 'utensils', color: '#e74c3c' },
        { name: 'Transportation', icon: 'car', color: '#3498db' },
        { name: 'Shopping', icon: 'shopping-bag', color: '#9b59b6' },
        { name: 'Entertainment', icon: 'film', color: '#f39c12' },
        { name: 'Health', icon: 'heart', color: '#27ae60' }
      ];
      
      return { success: true, data: defaultSuggestions };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  }
};

// ✅ Enhanced Export API Module
const exportAPI = {
  // Export data with analytics
  async exportData(format = 'json', options = {}) {
    const {
      includeAnalytics = true,
      dateRange = null,
      categories = null
    } = options;

    try {
      const params = {
        includeAnalytics,
        ...dateRange,
        ...(categories && { categories: categories.join(',') })
      };

      const response = await apiClient.client.get(`/export/${format}`, {
        params,
        responseType: format === 'csv' ? 'blob' : 'json'
      });

      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // Get export history
  async getHistory() {
    try {
      const response = await apiClient.client.get('/export/history');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // Get export quota status
  async getQuota() {
    try {
      const response = await apiClient.client.get('/export/quota');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  }
};

// ✅ Main Unified API Object
const spendWiseAPI = {
  // Core client
  client: apiClient,
  config: apiConfig,

  // Feature modules
  auth: authAPI,
  admin: adminAPI,
  analytics: analyticsAPI,
  performance: performanceAPI,
  transactions: transactionsAPI,
  categories: categoriesAPI,
  export: exportAPI,

  // ✅ Utility methods
  utils: {
    // Clear all caches
    clearAllCaches() {
      apiClient.clearCache();
    },

    // Get API performance stats
    getPerformanceStats() {
      return apiClient.getPerformanceStats();
    },

    // Health check
    async healthCheck() {
      return apiClient.healthCheck();
    },

    // Check authentication status
    isAuthenticated() {
      return authAPI.isAuthenticated();
    },

    // Check admin access
    isAdmin() {
      return authAPI.isAdmin();
    },

    // Get user role
    getUserRole() {
      return authAPI.getUserRole();
    }
  },

  // ✅ Bulk operations
  bulk: {
    // Refresh all cached data
    async refreshAll() {
      const operations = [
        transactionsAPI.getAll(),
        categoriesAPI.getAll(),
        authAPI.getProfile(),
        analyticsAPI.dashboard.getSummary()
      ];

      // Add admin operations if user is admin
      if (authAPI.isAdmin()) {
        operations.push(
          adminAPI.getDashboard(),
          adminAPI.users.getAll({ limit: 20 })
        );
      }

      try {
        const results = await Promise.allSettled(operations);
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.length - successful;

        return {
          success: true,
          data: {
            total: results.length,
            successful,
            failed,
            results
          }
        };
      } catch (error) {
        return {
          success: false,
          error: { message: 'Bulk refresh failed', code: 'BULK_REFRESH_ERROR' }
        };
      }
    }
  }
};

// ✅ Default export - Main API object
export default spendWiseAPI;

// ✅ Named exports for specific modules
export {
  apiClient,
  authAPI,
  adminAPI,
  analyticsAPI,
  performanceAPI,
  transactionsAPI,
  categoriesAPI,
  exportAPI
};

// ✅ Legacy compatibility (gradually remove these)
export const api = spendWiseAPI; 