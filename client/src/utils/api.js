// src/utils/api.js - Simplified version without caching
import axios from 'axios';
import { toast } from 'react-toastify';

// API Configuration
const api = axios.create({
  baseURL: '/api',
  timeout: 15000, // 15 seconds timeout
  withCredentials: true
});

// Debug flag - only enabled in development
const DEBUG = process.env.NODE_ENV === 'development';

// Simple request deduplication to prevent multiple identical requests
const pendingRequests = new Map();

/**
 * Debug logger for API operations
 * @param {string} message - Log message
 * @param {any} data - Optional data to log
 */
const log = (message, data = null) => {
  if (DEBUG) {
    console.log(`🔍 API: ${message}`, data || '');
  }
};

/**
 * Generate a unique request key for deduplication
 * @param {Object} config - Axios request config
 * @returns {string} Unique request key
 */
const getRequestKey = (config) => {
  return `${config.method}:${config.url}:${JSON.stringify(config.params || {})}:${JSON.stringify(config.data || {})}`;
};

/**
 * Handle authentication failures with redirect
 * @param {string} message - Error message to display
 */
const handleAuthFailure = (message = 'Session expired. Please log in again.') => {
  // Clear auth data
  localStorage.removeItem('token');
  
  // Show message to user
  toast.error(message);
  
  // Store the current path for redirecting back after login
  const currentPath = window.location.pathname;
  if (currentPath !== '/login') {
    sessionStorage.setItem('redirectPath', currentPath);
    window.location.href = '/login';
  }
};

// --------------------- REQUEST INTERCEPTOR ---------------------
api.interceptors.request.use(
  async (config) => {
    const requestKey = getRequestKey(config);
    log('Processing request:', {
      key: requestKey,
      method: config.method,
      url: config.url
    });

    // For GET requests, check if we already have an identical request in progress
    if (config.method.toLowerCase() === 'get' && pendingRequests.has(requestKey)) {
      log('Duplicate request detected - reusing in-flight request:', config.url);
      const pendingRequest = pendingRequests.get(requestKey);
      return {
        ...config,
        adapter: () => pendingRequest
      };
    }

    // Attach authentication token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Track this request for deduplication (for GET requests only)
    if (config.method.toLowerCase() === 'get') {
      const promise = axios(config)
        .then(response => {
          pendingRequests.delete(requestKey);
          return response;
        })
        .catch(error => {
          pendingRequests.delete(requestKey);
          throw error;
        });
      
      pendingRequests.set(requestKey, promise);
      
      if (config.adapter) {
        return config;
      }
    }

    return config;
  },
  (error) => {
    log('Request error:', error);
    return Promise.reject(error);
  }
);

// --------------------- RESPONSE INTERCEPTOR ---------------------
api.interceptors.response.use(
  (response) => {
    log('Response received:', {
      url: response.config.url,
      status: response.status
    });
    return response;
  },
  (error) => {
    // Get error details
    const status = error?.response?.status;
    const errorMessage = error?.response?.data?.message || error.message;
    const errorCode = error?.response?.data?.error;

    log('Response error:', { 
      url: error?.config?.url,
      status, 
      errorCode, 
      message: errorMessage 
    });

    // Handle authentication errors
    if (status === 401) {
      handleAuthFailure(errorMessage);
      return Promise.reject(error);
    } 
    
    // Handle rate limiting
    if (status === 429) {
      toast.warn(errorMessage || 'Too many requests. Please wait and try again.');
      return Promise.reject(error);
    } 
    
    // Handle server errors
    if (status >= 500) {
      toast.error(errorMessage || 'Server error. Please try again later.');
      return Promise.reject(error);
    }
    
    // Handle specific error types based on error code
    if (errorCode && !error.config?.suppressToast) {
      switch (errorCode) {
        case 'validation_error':
          // Don't show toast for validation errors - forms should handle these
          break;
        case 'duplicate_record':
          toast.error(errorMessage || 'This record already exists.');
          break;
        case 'fetch_failed':
        case 'creation_failed':
        case 'update_failed':
        case 'deletion_failed':
          toast.error(errorMessage || 'Operation failed. Please try again.');
          break;
        case 'balance_failed':
          // Special handling for balance calculation errors - show warning but don't block UI
          toast.warn(errorMessage || 'Could not calculate balance. Using default values.');
          break;
        default:
          toast.error(errorMessage || 'An error occurred.');
      }
    }

    return Promise.reject(error);
  }
);

// Authentication API methods
export const authAPI = {
  login: (credentials) => api.post('/users/login', credentials),
  register: (userData) => api.post('/users/register', userData),
  getProfile: () => api.get('/users/profile'),
  refreshToken: (token) => api.post('/users/refresh-token', { token }),
  logout: () => api.post('/users/logout')
};

// Transaction API methods - aligned with backend endpoints
export const transactionAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  getRecent: (limit = 5, date = null) => api.get('/transactions/recent', { 
    params: { 
      limit, 
      date: date ? date.toISOString().split('T')[0] : undefined 
    }
  }),
  getByPeriod: (period, date) => api.get(`/transactions/period/${period}`, {
    params: { date: date.toISOString().split('T')[0] }
  }),
  getRecurring: (type = null) => api.get('/transactions/recurring', {
    params: { type }
  }),
  getBalanceDetails: (date) => api.get('/transactions/balance/details', {
    params: { date: date.toISOString().split('T')[0] }
  }),
  getSummary: () => api.get('/transactions/summary'),
  getBalanceHistory: (period = 'month', limit = 12) => api.get(`/transactions/balance/history/${period}`, {
    params: { limit }
  }),
  create: (type, data) => api.post(`/transactions/${type}`, data),
  update: (type, id, data) => api.put(`/transactions/${type}/${id}`, data),
  delete: (type, id, deleteFuture = false) => api.delete(`/transactions/${type}/${id}`, {
    params: { deleteFuture }
  }),
  skipOccurrence: (type, id, skipDate) => api.post(`/transactions/${type}/${id}/skip`, {
    skipDate
  })
};

/**
 * Force a complete data refresh
 * Clears all pending requests and fetches fresh data
 */
export const forceRefresh = async () => {
  // Clear pending requests
  log('Clearing all pending requests for refresh');
  pendingRequests.clear();
  
  // Force fresh data fetch
  const today = new Date();
  try {
    await Promise.all([
      transactionAPI.getBalanceDetails(today),
      transactionAPI.getRecent(5, today),
      transactionAPI.getByPeriod('day', today)
    ]);
    toast.success('Data refreshed successfully');
    return true;
  } catch (error) {
    toast.error('Failed to refresh data');
    return false;
  }
};

export default api;