/**
 * PRODUCTION-READY API Module - Complete Server Coverage
 * All endpoints with proper error handling, caching, and request optimization
 */

import axios from 'axios';
import toast from 'react-hot-toast';

// Environment configuration
const config = {
  API_URL: import.meta.env.VITE_API_URL,
  API_VERSION: import.meta.env.VITE_API_VERSION || 'v1',
  CLIENT_URL: import.meta.env.VITE_CLIENT_URL,
  DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === 'true',
  REQUEST_TIMEOUT: parseInt(import.meta.env.VITE_REQUEST_TIMEOUT) || 15000,
  RETRY_ATTEMPTS: parseInt(import.meta.env.VITE_RETRY_ATTEMPTS) || 3,
  MAX_FILE_SIZE: parseInt(import.meta.env.VITE_MAX_FILE_SIZE) || 5242880,
  ENVIRONMENT: import.meta.env.VITE_ENVIRONMENT || 'development',
  // ✅ NEW: Server health monitoring
  COLD_START_THRESHOLD: 10000, // 10 seconds
  MAX_COLD_START_WAIT: 60000, // 60 seconds
};

// ✅ NEW: Server state tracking
let serverState = {
  isWakingUp: false,
  lastSuccessfulRequest: Date.now(),
  consecutiveFailures: 0
};

// Validate required environment variables
if (!config.API_URL) {
  throw new Error('VITE_API_URL is required but not defined in environment variables');
}

// Request deduplication and cancellation
const pendingRequests = new Map();
const requestQueue = new Map();

// Create axios instance
const api = axios.create({
  baseURL: `${config.API_URL}/api/${config.API_VERSION}`,
  timeout: config.REQUEST_TIMEOUT,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Production-safe logger - only for critical issues
const log = (message, data = null) => {
  // Reserved for critical production debugging if needed
};

// Request queue management
const queueRequest = (key, requestFn) => {
  if (requestQueue.has(key)) {
    return requestQueue.get(key);
  }
  
  const promise = requestFn().finally(() => {
    requestQueue.delete(key);
  });
  
  requestQueue.set(key, promise);
  return promise;
};

// Enhanced request interceptor
api.interceptors.request.use(
  (config) => {
    const requestId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    config.headers['X-Request-ID'] = requestId;
    config.metadata = { requestId, startTime: Date.now() };
    
    // Add auth token (skip for auth endpoints)
    const authEndpoints = ['/users/login', '/users/register', '/users/verify-email', '/users/resend-verification', '/users/forgot-password', '/users/reset-password'];
    const isAuthEndpoint = authEndpoints.some(endpoint => config.url?.includes(endpoint));
    
    const token = localStorage.getItem('accessToken');
    if (token && !isAuthEndpoint) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Request deduplication for GET requests
    if (config.method === 'get') {
      const requestKey = `${config.method}-${config.url}-${JSON.stringify(config.params)}`;
      
      if (pendingRequests.has(requestKey)) {
        const existingController = pendingRequests.get(requestKey);
        config.signal = existingController.signal;
        return config;
      }
      
      const controller = new AbortController();
      config.signal = controller.signal;
      pendingRequests.set(requestKey, controller);
      config.metadata.requestKey = requestKey;
      
      // Auto-cleanup
      setTimeout(() => {
        if (pendingRequests.has(requestKey)) {
          pendingRequests.delete(requestKey);
        }
      }, 2000);
    }
    
    log(`${config.method?.toUpperCase()} ${config.url}`, config.params);
    return config;
  },
  (error) => {
    // Request errors are handled by response interceptor
    return Promise.reject(error);
  }
);

// ✅ NEW: Cold start detection and user feedback
const detectColdStart = (duration) => {
  return duration > config.COLD_START_THRESHOLD;
};

const showColdStartNotification = () => {
  if (!serverState.isWakingUp) {
    serverState.isWakingUp = true;
    
    // Use translation system for cold start message
    const getTranslation = window.getTranslation;
    const message = getTranslation ? 
      getTranslation('errors.serverStarting') : 
      'Server is starting up, please wait...';
      
    toast.loading(message, {
      id: 'cold-start',
      duration: 60000, // Keep it longer but will be dismissed on success
      style: {
        background: '#3B82F6',
        color: 'white',
      }
    });
  }
};

const hideColdStartNotification = () => {
  if (serverState.isWakingUp) {
    serverState.isWakingUp = false;
    toast.dismiss('cold-start');
    
    // Use translation system for success message
    const getTranslation = window.getTranslation;
    const successMessage = getTranslation ? 
      getTranslation('errors.serverReady') : 
      'Server is ready!';
      
    // Show success message briefly, then auto-dismiss
    toast.success(successMessage, { duration: 1500 });
  }
};

// Enhanced response interceptor with CORS error handling
api.interceptors.response.use(
  (response) => {
    serverState.consecutiveFailures = 0;
    serverState.lastSuccessfulRequest = Date.now();
    
    // Clean up pending requests
    if (response.config.metadata?.requestKey) {
      pendingRequests.delete(response.config.metadata.requestKey);
    }
    
    // Hide cold start notification on any successful response if it was showing
    if (serverState.isWakingUp) {
      hideColdStartNotification();
    }
    
    return response;
  },
  async (error) => {
    const { config, response } = error;
    
    // Clean up pending requests
    if (config?.metadata?.requestKey) {
      pendingRequests.delete(config.metadata.requestKey);
    }
    
    // Track failures
    serverState.consecutiveFailures++;
    
    // Handle cancelled requests
    if (axios.isCancel(error)) {
      log('Request cancelled', config?.url);
      return Promise.reject(error);
    }
    
    // ✅ CORS ERROR DETECTION
    if (error.message?.includes('CORS') || 
        error.message?.includes('Network Error') ||
        error.code === 'ERR_NETWORK' ||
        !response) {
      console.error('🚫 CORS or Network Error detected:', error.message);
      
      // Don't retry for CORS errors, fail fast
      throw {
        ...error,
        isCorsError: true,
        userMessage: 'Connection blocked. Please check your network or try refreshing the page.'
      };
    }
    
    // ✅ HEALTH CHECK FAILURE HANDLING
    if (config.url?.includes('/health')) {
      console.warn('🏥 Health check failed, but continuing with request');
      
      // Don't block the actual API call if health check fails
      return Promise.resolve({
        data: { status: 'unknown' },
        status: 200
      });
    }
    
    // ✅ DELETE ENDPOINT SPECIFIC HANDLING
    if (config.url?.includes('templates') && config.method?.toLowerCase() === 'delete') {
      console.error('🗑️ Template delete failed:', error.response?.data || error.message);
      
      // Provide specific error for delete operations
      throw {
        ...error,
        userMessage: 'Failed to delete recurring transaction. Please try again or contact support.'
      };
    }
    
    // Handle auth errors
    if (response?.status === 401) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
      return;
    }
    
    // ✅ RETRY LOGIC (but not for CORS errors)
    if (config && !config._retry && !error.isCorsError) {
      config._retryCount = (config._retryCount || 0) + 1;
      
      if (config._retryCount <= (config.RETRY_ATTEMPTS || 3)) {
        const delay = Math.min(1000 * Math.pow(2, config._retryCount), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return api(config);
      }
    }
    
    return Promise.reject(error);
  }
);

// Utility functions
const formatDateForAPI = (date) => {
  if (!date) return undefined;
  
  const dateObj = date instanceof Date ? date : new Date(date);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

// Authentication API - Complete coverage
export const authAPI = {
  // User authentication
  login: (credentials) => api.post('/users/login', credentials),
  register: (userData) => api.post('/users/register', userData),
  logout: () => api.post('/users/logout'),
  refreshToken: (refreshToken) => api.post('/users/refresh-token', { refreshToken }),
  
  // Email verification
  verifyEmail: (token) => api.get(`/users/verify-email/${token}`),
  resendVerificationEmail: (email) => api.post('/users/resend-verification', { email }),
  
  // Password management
  forgotPassword: (email) => api.post('/users/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/users/reset-password', { token, newPassword }),
  
  // Profile management
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  updatePreferences: (preferences) => api.put('/users/preferences', preferences),
  
  // Profile picture with progress tracking
  uploadProfilePicture: (file, onProgress) => {
    const formData = new FormData();
    formData.append('profilePicture', file);
    return api.post('/users/profile/picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress ? (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      } : undefined
    });
  },
  
  // ✅ ADD: Preference-specific update that bypasses profile validation
  updateUserPreference: (preference, value) => {
    // Use the preferences endpoint but structure it correctly for database columns
    return api.put('/users/preferences', {
      preferences: {
        [`${preference}_preference`]: value // Map to database column format
      }
    });
  },
  
  // ✅ ADD: Onboarding completion
  completeOnboarding: () => api.post('/onboarding/complete'),
  
  // Utility
  testEmail: (email) => api.post('/users/test-email', { email })
};

// Transaction API - Complete coverage with optimizations
export const transactionAPI = {
  // Dashboard and summary - with request deduplication
  getDashboard: (date) => {
    const formattedDate = formatDateForAPI(date);
    const key = `dashboard-${formattedDate}`;
    return queueRequest(key, () => 
      api.get('/transactions/dashboard', { 
        params: { date: formattedDate }
      })
    );
  },
  
  getRecent: (limit = 5, date) => {
    const formattedDate = formatDateForAPI(date);
    return api.get('/transactions/recent', {
      params: { limit, date: formattedDate }
    });
  },
  
  getSummary: () => api.get('/transactions/summary'),
  getStats: (months = 12) => api.get('/transactions/stats', { params: { months } }),
  
  // Period-based queries
  getByPeriod: (period, date) => {
    const formattedDate = formatDateForAPI(date);
    return api.get(`/transactions/period/${period}`, {
      params: { date: formattedDate }
    });
  },
  
  // Balance information
  getBalanceDetails: (date) => {
    const formattedDate = formatDateForAPI(date);
    return api.get('/transactions/balance/details', {
      params: { date: formattedDate }
    });
  },
  
  getBalanceHistory: (period, limit = 12) => 
    api.get(`/transactions/balance/history/${period}`, { params: { limit } }),
  
  // Transaction CRUD
  getAll: (filters) => api.get('/transactions', { params: filters }),
  create: (type, data) => api.post(`/transactions/${type}`, data),
  update: (type, id, data) => api.put(`/transactions/${type}/${id}`, data),
  delete: (type, id, options = {}) => {
    // ✅ FIX: Build query parameters correctly
    const { deleteAll, deleteFuture, deleteSingle } = options;
    const queryParams = {};
    if (deleteAll) queryParams.deleteAll = 'true';
    if (deleteFuture) queryParams.deleteFuture = 'true';
    if (deleteSingle) queryParams.deleteSingle = 'true';
    
    return api.delete(`/transactions/${type}/${id}`, { params: queryParams });
  },
  
  // Direct expense/income creation
  addExpense: (data) => api.post('/transactions/expense', data),
  addIncome: (data) => api.post('/transactions/income', data),
  
  // Recurring transactions
  getRecurring: (type = null) => {
    const params = type ? { type } : {};
    return api.get('/transactions/recurring', { params });
  },
  
  generateRecurring: () => api.post('/transactions/generate-recurring'),
  
  // Skip functionality
  skipTransactionOccurrence: (type, id, skipDate) => 
    api.post(`/transactions/${type}/${id}/skip`, { skipDate }),
  
  // Template management
  getTemplates: () => api.get('/transactions/templates'),
  updateTemplate: (id, data) => api.put(`/transactions/templates/${id}`, data),
  deleteTemplate: (id, deleteFuture = false) => 
    api.delete(`/transactions/templates/${id}`, { params: { deleteFuture: deleteFuture.toString() } }),
  skipDates: (templateId, dates) =>
    api.post(`/transactions/templates/${templateId}/skip`, { dates }),
  
  // Search and filtering
  search: (searchTerm, limit = 50) => api.get('/transactions/search', {
    params: { q: searchTerm, limit }
  }),
  
  getCategoryBreakdown: (startDate, endDate) => 
    api.get('/transactions/categories/breakdown', {
      params: { 
        startDate: formatDateForAPI(startDate), 
        endDate: formatDateForAPI(endDate) 
      }
    })
};

// Category API - Complete coverage
export const categoryAPI = {
  getAll: (type) => queueRequest(`categories-${type || 'all'}`, () => 
    api.get('/categories', { params: { type } })
  ),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
  getStats: (id) => api.get(`/categories/${id}/stats`),
  getWithCounts: (startDate, endDate) => 
    api.get('/categories/with-counts', {
      params: { 
        startDate: formatDateForAPI(startDate), 
        endDate: formatDateForAPI(endDate) 
      }
    })
};

// Export API - Complete coverage with download handling
export const exportAPI = {
  getOptions: () => api.get('/export/options'),
  
  exportAsCSV: async () => {
    try {
      const response = await api.get('/export/csv', { 
        responseType: 'blob',
        timeout: 60000 // 60 seconds for large exports
      });
      
      // ✅ FIX: Better filename generation and download handling
      const contentDisposition = response.headers['content-disposition'];
      let filename = `spendwise_export_${new Date().toISOString().split('T')[0]}.csv`;
      
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) {
          filename = match[1];
        }
      }
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  exportAsJSON: async () => {
    try {
      const response = await api.get('/export/json', {
        timeout: 60000 // 60 seconds for large exports
      });
      
      // ✅ FIX: Handle JSON response properly
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `spendwise_export_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  exportAsPDF: async () => {
    try {
      const response = await api.get('/export/pdf', { 
        responseType: 'blob',
        timeout: 120000 // 2 minutes for PDF generation
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `spendwise_export_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return response;
    } catch (error) {
      if (error.response?.status === 501) {
        // PDF export not implemented yet - error will be handled by UI
      }
      throw error;
    }
  }
};

// Query keys for React Query
export const queryKeys = {
  // Auth
  profile: ['profile'],
  
  // Dashboard
  dashboard: (date) => ['dashboard', formatDateForAPI(date)],
  
  // Transactions
  transactions: (filters) => ['transactions', filters],
  transactionsPeriod: (period, date) => ['transactions', 'period', period, formatDateForAPI(date)],
  transactionsRecent: (limit, date) => ['transactions', 'recent', limit, formatDateForAPI(date)],
  transactionsRecurring: (type) => ['transactions', 'recurring', type],
  transactionsStats: (months) => ['transactions', 'stats', months],
  transactionsSummary: ['transactions', 'summary'],
  transactionsSearch: (term) => ['transactions', 'search', term],
  
  // Balance
  balanceDetails: (date) => ['balance', 'details', formatDateForAPI(date)],
  balanceHistory: (period, limit) => ['balance', 'history', period, limit],
  
  // Templates
  templates: ['templates'],
  template: (id) => ['templates', id],
  
  // Categories
  categories: (type) => ['categories', type],
  category: (id) => ['categories', id],
  categoriesWithCounts: (startDate, endDate) => ['categories', 'counts', formatDateForAPI(startDate), formatDateForAPI(endDate)],
  categoryStats: (id) => ['categories', 'stats', id],
  categoryBreakdown: (startDate, endDate) => ['transactions', 'breakdown', formatDateForAPI(startDate), formatDateForAPI(endDate)],
  
  // Exchange rates
  exchangeRates: (currency) => ['exchange-rates', currency],
  
  // Export
  exportOptions: ['export', 'options']
};

// Mutation keys for React Query
export const mutationKeys = {
  // Auth
  login: ['auth', 'login'],
  register: ['auth', 'register'],
  logout: ['auth', 'logout'],
  updateProfile: ['auth', 'updateProfile'],
  updatePreferences: ['auth', 'updatePreferences'],
  uploadProfilePicture: ['auth', 'uploadProfilePicture'],
  forgotPassword: ['auth', 'forgotPassword'],
  resetPassword: ['auth', 'resetPassword'],
  verifyEmail: ['auth', 'verifyEmail'],
  resendVerification: ['auth', 'resendVerification'],
  
  // Transactions
  createTransaction: ['transactions', 'create'],
  updateTransaction: ['transactions', 'update'],
  deleteTransaction: ['transactions', 'delete'],
  skipTransaction: ['transactions', 'skip'],
  generateRecurring: ['transactions', 'generateRecurring'],
  
  // Templates
  updateTemplate: ['templates', 'update'],
  deleteTemplate: ['templates', 'delete'],
  skipTemplateDates: ['templates', 'skipDates'],
  
  // Categories
  createCategory: ['categories', 'create'],
  updateCategory: ['categories', 'update'],
  deleteCategory: ['categories', 'delete']
};

// Cleanup and utility functions
export const cancelPendingRequests = () => {
  pendingRequests.forEach((controller) => controller.abort());
  pendingRequests.clear();
};

export const clearRequestQueue = () => {
  requestQueue.clear();
};

export const getApiConfig = () => config;

// ✅ ENHANCED TEMPLATES API WITH BETTER ERROR HANDLING
export const templatesAPI = {
  delete: async (id, deleteFuture = false) => {
    const startTime = Date.now();
    
    try {
      // 🔍 DEBUGGING: Enhanced client-side logging
      console.group('🗑️ TEMPLATE DELETE REQUEST');
      console.log('📝 Request Details:', {
        templateId: id,
        deleteFuture: deleteFuture,
        timestamp: new Date().toISOString(),
        apiUrl: config.API_URL,
        requestUrl: `/transactions/templates/${id}`,
        params: { deleteFuture: deleteFuture.toString() }
      });
      
      // 🔍 DEBUGGING: Log environment info
      console.log('🌍 Environment:', {
        apiUrl: config.API_URL,
        environment: config.ENVIRONMENT,
        userAgent: navigator.userAgent,
        currentUrl: window.location.href
      });
      
      console.log('⏳ Making DELETE request...');
      
      const response = await api.delete(`/transactions/templates/${id}`, {
        params: { deleteFuture: deleteFuture.toString() },
        timeout: 30000, // Longer timeout for delete operations
      });
      
      const duration = Date.now() - startTime;
      
      // 🔍 DEBUGGING: Log successful response
      console.log('✅ DELETE REQUEST SUCCESS:', {
        status: response.status,
        statusText: response.statusText,
        duration: `${duration}ms`,
        responseData: response.data,
        headers: response.headers,
        timestamp: new Date().toISOString()
      });
      console.groupEnd();
      
      return response.data;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // 🔍 DEBUGGING: Enhanced error logging
      console.group('❌ TEMPLATE DELETE ERROR');
      console.error('📊 Error Details:', {
        templateId: id,
        deleteFuture: deleteFuture,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
        errorMessage: error.message,
        errorCode: error.code,
        errorName: error.name
      });
      
      if (error.response) {
        console.error('🔴 Server Response Error:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
      } else if (error.request) {
        console.error('🔴 Network Request Error:', {
          request: error.request,
          message: 'No response received from server'
        });
      } else {
        console.error('🔴 Request Setup Error:', {
          message: error.message,
          stack: error.stack
        });
      }
      
      // 🔍 DEBUGGING: Log axios config
      if (error.config) {
        console.error('⚙️ Request Config:', {
          method: error.config.method,
          url: error.config.url,
          baseURL: error.config.baseURL,
          params: error.config.params,
          headers: error.config.headers,
          timeout: error.config.timeout
        });
      }
      
      console.groupEnd();
      
      if (error.isCorsError) {
        throw new Error('Unable to connect to server. Please check your internet connection and try again.');
      }
      
      if (error.response?.status === 404) {
        throw new Error('This recurring transaction no longer exists.');
      }
      
      if (error.response?.status === 403) {
        throw new Error('You do not have permission to delete this transaction.');
      }
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again.');
      }
      
      throw new Error(error.userMessage || error.response?.data?.message || 'Failed to delete recurring transaction. Please try again.');
    }
  },
  
  pause: async (id) => {
    try {
      const response = await api.put(`/transactions/templates/${id}`, {
        is_active: false
      });
      return response.data;
    } catch (error) {
      console.error('Pause template failed:', error);
      throw new Error('Failed to pause recurring transaction. Please try again.');
    }
  },

  // 🔍 DEBUGGING: Test connectivity to template endpoints
  testConnection: async (id = 'test') => {
    try {
      console.log('🧪 Testing template endpoint connectivity...');
      
      const response = await api.get(`/transactions/debug/templates/${id}`);
      
      console.log('✅ Template endpoint connectivity test SUCCESS:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Template endpoint connectivity test FAILED:', error);
      throw error;
    }
  }
};

// Performance monitoring
export const getApiStats = () => {
  return {
    pendingRequests: pendingRequests.size,
    queuedRequests: requestQueue.size,
    config
  };
};

// Default export
export default api;