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

// ✅ Transactions API Module - ALIGNED WITH SERVER ROUTES
const transactionsAPI = {
  // 🏠 DASHBOARD ROUTES
  // Get complete dashboard data (matches: GET /transactions/dashboard)
  async getDashboard(date = null) {
    try {
      const endpoint = date ? `/transactions/dashboard?date=${date}` : '/transactions/dashboard';
      const response = await apiClient.client.get(endpoint);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // Get recent transactions (matches: GET /transactions/recent)
  async getRecent(limit = 10) {
    try {
      const response = await apiClient.client.get(`/transactions/recent?limit=${limit}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // Get statistics (matches: GET /transactions/stats)
  async getStats(params = {}) {
    try {
      const response = await apiClient.client.get('/transactions/stats', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // Get category breakdown (matches: GET /transactions/categories/breakdown)
  async getCategoryBreakdown(params = {}) {
    try {
      const response = await apiClient.client.get('/transactions/categories/breakdown', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // Get summary (matches: GET /transactions/summary)
  async getSummary(params = {}) {
    try {
      const response = await apiClient.client.get('/transactions/summary', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // 💰 BALANCE ROUTES
  // Get balance details (matches: GET /transactions/balance/details)
  async getBalanceDetails(params = {}) {
    try {
      const response = await apiClient.client.get('/transactions/balance/details', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // Get balance history (matches: GET /transactions/balance/history/:period)
  async getBalanceHistory(period, params = {}) {
    try {
      const response = await apiClient.client.get(`/transactions/balance/history/${period}`, { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // 🔍 QUERY ROUTES
  // Get all transactions with filters (matches: GET /transactions)
  async getAll(params = {}) {
    try {
      const response = await apiClient.client.get('/transactions', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // Search transactions (matches: GET /transactions/search)
  async search(query, params = {}) {
    try {
      const response = await apiClient.client.get('/transactions/search', { 
        params: { q: query, ...params } 
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // Get by period (matches: GET /transactions/period/:period)
  async getByPeriod(period, params = {}) {
    try {
      const response = await apiClient.client.get(`/transactions/period/${period}`, { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // 🔄 RECURRING ROUTES
  // Get recurring transactions (matches: GET /transactions/recurring)
  async getRecurring(params = {}) {
    try {
      const response = await apiClient.client.get('/transactions/recurring', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // Get templates (matches: GET /transactions/templates)
  async getTemplates(params = {}) {
    try {
      const response = await apiClient.client.get('/transactions/templates', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // Generate recurring (matches: POST /transactions/generate-recurring)
  async generateRecurring() {
    try {
      const response = await apiClient.client.post('/transactions/generate-recurring');
      apiClient.clearCache('transactions');
      apiClient.clearCache('dashboard');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // ✏️ CRUD ROUTES
  // Create transaction with type (matches: POST /transactions/:type)
  async create(type, transactionData) {
    try {
      const response = await apiClient.client.post(`/transactions/${type}`, transactionData);
      apiClient.clearCache('transactions');
      apiClient.clearCache('dashboard');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // Create expense directly (matches: POST /transactions/expense)
  async createExpense(transactionData) {
    try {
      const response = await apiClient.client.post('/transactions/expense', transactionData);
      apiClient.clearCache('transactions');
      apiClient.clearCache('dashboard');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // Create income directly (matches: POST /transactions/income)
  async createIncome(transactionData) {
    try {
      const response = await apiClient.client.post('/transactions/income', transactionData);
      apiClient.clearCache('transactions');
      apiClient.clearCache('dashboard');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // Update transaction with type (matches: PUT /transactions/:type/:id)
  async update(type, id, updates) {
    try {
      const response = await apiClient.client.put(`/transactions/${type}/${id}`, updates);
      apiClient.clearCache('transactions');
      apiClient.clearCache('dashboard');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // Delete transaction with type (matches: DELETE /transactions/:type/:id)
  async delete(type, id) {
    try {
      await apiClient.client.delete(`/transactions/${type}/${id}`);
      apiClient.clearCache('transactions');
      apiClient.clearCache('dashboard');
      return { success: true };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // Skip transaction occurrence (matches: POST /transactions/:type/:id/skip)
  async skipOccurrence(type, id, skipData) {
    try {
      const response = await apiClient.client.post(`/transactions/${type}/${id}/skip`, skipData);
      apiClient.clearCache('transactions');
      apiClient.clearCache('dashboard');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // 🔄 TEMPLATE MANAGEMENT
  templates: {
    // Update template (matches: PUT /transactions/templates/:id)
    async update(id, updates) {
      try {
        const response = await apiClient.client.put(`/transactions/templates/${id}`, updates);
        apiClient.clearCache('transactions');
        apiClient.clearCache('templates');
        return { success: true, data: response.data };
      } catch (error) {
        return { success: false, error: apiClient.normalizeError(error) };
      }
    },

    // Delete template (matches: DELETE /transactions/templates/:id)
    async delete(id) {
      try {
        await apiClient.client.delete(`/transactions/templates/${id}`);
        apiClient.clearCache('transactions');
        apiClient.clearCache('templates');
        return { success: true };
      } catch (error) {
        return { success: false, error: apiClient.normalizeError(error) };
      }
    },

    // Skip dates for template (matches: POST /transactions/templates/:id/skip)
    async skip(id, skipDates) {
      try {
        const response = await apiClient.client.post(`/transactions/templates/${id}/skip`, { skipDates });
        apiClient.clearCache('transactions');
        apiClient.clearCache('templates');
        return { success: true, data: response.data };
      } catch (error) {
        return { success: false, error: apiClient.normalizeError(error) };
      }
    }
  },

  // 📊 LEGACY COMPATIBILITY (remove old functions)
  // Recurring templates (DEPRECATED - use getTemplates() instead)
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

// ✅ Categories API Module - ALIGNED WITH SERVER ROUTES
const categoriesAPI = {
  // Get all categories (matches: GET /categories)
  async getAll(params = {}) {
    try {
      const response = await apiClient.client.get('/categories', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // Get single category (matches: GET /categories/:id)
  async getById(id) {
    try {
      const response = await apiClient.client.get(`/categories/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // Get categories with transaction counts (matches: GET /categories/with-counts)
  async getWithCounts(params = {}) {
    try {
      const response = await apiClient.client.get('/categories/with-counts', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // Get category statistics (matches: GET /categories/:id/stats)
  async getStats(id) {
    try {
      const response = await apiClient.client.get(`/categories/${id}/stats`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // Create category (matches: POST /categories)
  async create(categoryData) {
    try {
      const response = await apiClient.client.post('/categories', categoryData);
      apiClient.clearCache('categories');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // Update category (matches: PUT /categories/:id)
  async update(id, updates) {
    try {
      const response = await apiClient.client.put(`/categories/${id}`, updates);
      apiClient.clearCache('categories');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // Delete category (matches: DELETE /categories/:id)
  async delete(id) {
    try {
      await apiClient.client.delete(`/categories/${id}`);
      apiClient.clearCache('categories');
      return { success: true };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  }
};

// ✅ Users API Module - ALIGNED WITH SERVER ROUTES  
const usersAPI = {
  // Register user (matches: POST /users/register)
  async register(userData) {
    try {
      const response = await apiClient.client.post('/users/register', userData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // Login user (matches: POST /users/login)
  async login(email, password) {
    try {
      const response = await apiClient.client.post('/users/login', { email, password });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // Google OAuth (matches: POST /users/auth/google)
  async googleAuth(authData) {
    try {
      const response = await apiClient.client.post('/users/auth/google', authData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // Verify email (matches: POST /users/verify-email)
  async verifyEmail(token) {
    try {
      const response = await apiClient.client.post('/users/verify-email', { token });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // Verify email via link (matches: GET /users/verify-email/:token)
  async verifyEmailLink(token) {
    try {
      const response = await apiClient.client.get(`/users/verify-email/${token}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // Get profile (matches: GET /users/profile)
  async getProfile() {
    try {
      const response = await apiClient.cachedRequest('/users/profile', {
        method: 'GET'
      }, 'user-profile', 5 * 60 * 1000);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // Update profile (matches: PUT /users/profile)
  async updateProfile(updates) {
    try {
      const response = await apiClient.client.put('/users/profile', updates);
      apiClient.clearCache('user-profile');
      apiClient.clearCache('users');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  }
};

// ✅ Export API Module - ALIGNED WITH SERVER ROUTES
const exportAPI = {
  // Get export options (matches: GET /export/options)
  async getOptions() {
    try {
      const response = await apiClient.client.get('/export/options');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // Export as CSV (matches: GET /export/csv)
  async exportCSV(params = {}) {
    try {
      const response = await apiClient.client.get('/export/csv', {
        params,
        responseType: 'blob'
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // Export as JSON (matches: GET /export/json)
  async exportJSON(params = {}) {
    try {
      const response = await apiClient.client.get('/export/json', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // Export as PDF (matches: GET /export/pdf)
  async exportPDF(params = {}) {
    try {
      const response = await apiClient.client.get('/export/pdf', {
        params,
        responseType: 'blob'
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  }
};

// ✅ Onboarding API Module - ALIGNED WITH SERVER ROUTES
const onboardingAPI = {
  // Test onboarding routes (matches: GET /onboarding/test)
  async test() {
    try {
      const response = await apiClient.client.get('/onboarding/test');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // Get onboarding status (matches: GET /onboarding/status)
  async getStatus() {
    try {
      const response = await apiClient.client.get('/onboarding/status');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // Complete onboarding (matches: POST /onboarding/complete)
  async complete(data = {}) {
    try {
      const response = await apiClient.client.post('/onboarding/complete', data);
      apiClient.clearCache('user-profile');
      apiClient.clearCache('users');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError(error) };
    }
  },

  // Update preferences (matches: POST /onboarding/preferences)
  async updatePreferences(preferences) {
    try {
      const response = await apiClient.client.post('/onboarding/preferences', preferences);
      apiClient.clearCache('user-profile');
      apiClient.clearCache('users');
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
  onboarding: onboardingAPI,

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
  exportAPI,
  onboardingAPI
};

// ✅ Legacy compatibility (gradually remove these)
export const api = {
  // Core API client
  client: apiClient.client,
  config: apiConfig,
  
  // Clear cache methods
  clearCache: apiClient.clearCache.bind(apiClient),
  clearAllCache: apiClient.clearAllCache.bind(apiClient),
  
  // 🔐 Authentication & Users (matches server/routes/userRoutes.js)
  auth: authAPI,
  users: usersAPI,
  
  // 💰 Transactions (matches server/routes/transactionRoutes.js) 
  transactions: transactionsAPI,
  
  // 🏷️ Categories (matches server/routes/categoryRoutes.js)
  categories: categoriesAPI,
  
  // 🛡️ Admin (matches server/routes/adminRoutes.js)
  admin: adminAPI,
  
  // 📊 Analytics (matches server/routes/analyticsRoutes.js)
  analytics: analyticsAPI,
  
  // 📤 Export (matches server/routes/exportRoutes.js)
  export: exportAPI,
  
  // 🚀 Onboarding (matches server/routes/onboarding.js)
  onboarding: onboardingAPI,
  
  // ⚡ Performance (matches server/routes/performance.js)
  performance: performanceAPI
};

// ✅ Individual module exports for backwards compatibility
export { 
  authAPI as auth,
  usersAPI as users, 
  transactionsAPI as transactions,
  categoriesAPI as categories,
  adminAPI as admin,
  analyticsAPI as analytics,
  exportAPI as exportModule,
  onboardingAPI as onboarding,
  performanceAPI as performance
}; 