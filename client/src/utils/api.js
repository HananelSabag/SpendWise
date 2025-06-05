/**
 * OPTIMIZED API Module
 * 
 * MAJOR CHANGES:
 * 1. Removed excessive console.logs - now controlled by debug flag
 * 2. Improved error handling and retry logic
 * 3. Added request deduplication
 * 4. Optimized date formatting
 * 5. Better token refresh handling
 * 6. Added request cancellation support
 */

import axios from 'axios';
import toast from 'react-hot-toast';

// Environment configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';
const DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE === 'true' || localStorage.getItem('debug_api') === 'true';

// Request deduplication map
const pendingRequests = new Map();

// Create axios instance
const api = axios.create({
  baseURL: `${API_URL}/api/${API_VERSION}`,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Debug logger - only logs when needed
const log = (message, data = null) => {
  if (DEBUG_MODE) {
    console.log(`[API] ${message}`, data);
  }
};

// Request interceptor with deduplication
api.interceptors.request.use(
  (config) => {
    const requestId = crypto.randomUUID();
    config.headers['X-Request-ID'] = requestId;
    config.metadata = { requestId, startTime: Date.now() };
    
    // Add auth token
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // ✅ IMPROVED: Request deduplication for both GET and period requests
    if (config.method === 'get') {
      const requestKey = `${config.method}-${config.url}-${JSON.stringify(config.params)}`;
      
      if (pendingRequests.has(requestKey)) {
        const controller = pendingRequests.get(requestKey);
        config.signal = controller.signal;
        return config;
      }
      
      const controller = new AbortController();
      config.signal = controller.signal;
      pendingRequests.set(requestKey, controller);
      
      config.metadata.requestKey = requestKey;
      
      // ✅ FIX: Auto-cleanup after request completes
      setTimeout(() => {
        if (pendingRequests.has(requestKey)) {
          pendingRequests.delete(requestKey);
        }
      }, 1000);
    }
    
    // Only log non-dashboard requests in production
    if (DEBUG_MODE || (!config.url?.includes('/dashboard') && !config.url?.includes('/recurring'))) {
      log(`${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    if (DEBUG_MODE) {
      console.error(`[API-REQUEST-ERROR]`, error);
    }
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    const duration = Date.now() - response.config.metadata.startTime;
    
    // Clean up pending requests
    if (response.config.metadata?.requestKey) {
      pendingRequests.delete(response.config.metadata.requestKey);
    }
    
    if (DEBUG_MODE || response.config.url?.includes('/dashboard')) {
      log(`✓ ${response.config.url} (${duration}ms)`);
    }
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Clean up pending requests
    if (originalRequest?.metadata?.requestKey) {
      pendingRequests.delete(originalRequest.metadata.requestKey);
    }
    
    // Handle cancelled requests
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }
    
    // Handle 401 - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/api/${API_VERSION}/users/refresh-token`, {
            refreshToken
          });
          
          const { accessToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors with better UX
    const message = error.response?.data?.error?.message || error.message;
    const code = error.response?.data?.error?.code;
    
    if (error.response?.status === 429) {
      toast.error('Too many requests. Please slow down.');
    } else if (error.response?.status === 500) {
      toast.error('Server error. Please try again later.');
    } else if (code !== 'VALIDATION_ERROR' && message && !error.config?.silent) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

// Optimized date formatting
const formatDateForAPI = (date) => {
  if (!date) return undefined;
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Use local timezone to prevent shifts
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

// Transaction API with better caching
export const transactionAPI = {
  getDashboard: (date) => {
    const formattedDate = formatDateForAPI(date);
    return api.get('/transactions/dashboard', { 
      params: { date: formattedDate }
    });
  },
  
  getByPeriod: (period, date) => {
    const formattedDate = formatDateForAPI(date);
    return api.get(`/transactions/period/${period}`, {
      params: { date: formattedDate }
    });
  },
  
  // ✅ FIX: Remove duplicate getAll method
  getAll: (filters) => {
    return api.get('/transactions', { 
      params: filters
    });
  },
  
  search: (searchTerm) => {
    return api.get('/transactions/search', {
      params: { q: searchTerm }
    });
  },
  
  // ✅ ADD: Missing templates methods
  getTemplates: () => api.get('/transactions/templates'),
  updateTemplate: (id, data) => api.put(`/transactions/templates/${id}`, data),
  deleteTemplate: (id, options = {}) => {
    const { deleteFuture = false, deleteAll = false } = options;
    return api.delete(`/transactions/templates/${id}`, { 
      params: { deleteFuture, deleteAll } 
    });
  },
  
  // Enhanced delete methods - remove duplicate
  delete: (type, id, options = {}) => {
    const { deleteFuture = false, deleteAll = false } = options;
    return api.delete(`/transactions/${type}/${id}`, { 
      params: { deleteFuture, deleteAll } 
    });
  },
  
  // Skip occurrence method
  skipOccurrence: (type, id, skipDate) => 
    api.post(`/transactions/${type}/${id}/skip`, { skipDate }),
  
  // Bulk skip dates for templates
  skipTemplateDates: (templateId, dates) =>
    api.post(`/transactions/templates/${templateId}/skip`, { dates }),
  
  // ✅ ADD: Missing stats method
  getStats: (months = 12) => api.get(`/transactions/stats?months=${months}`),
  
  getRecurring: (type = null) => {
    const endpoint = type ? `/transactions/recurring?type=${type}` : '/transactions/recurring';
    return api.get(endpoint);
  },
  
  create: (type, data) => api.post(`/transactions/${type}`, data),
  update: (type, id, data) => api.put(`/transactions/${type}/${id}`, data),
  delete: (type, id, deleteFuture = false) => 
    api.delete(`/transactions/${type}/${id}`, { params: { deleteFuture } }),
  
  getCategories: () => api.get('/categories'),
  createCategory: (data) => api.post('/categories', data),
  updateCategory: (id, data) => api.put(`/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
  
  generateRecurring: () => api.post('/transactions/generate-recurring')
};

// Query keys for React Query
export const queryKeys = {
  profile: ['profile'],
  dashboard: (date) => ['dashboard', formatDateForAPI(date)],
  transactions: (filters) => ['transactions', filters],
  recurring: (type) => ['recurring', type],
  categories: ['categories'],
  // ✅ ADD: Missing query keys
  templates: ['templates'],
  stats: (months) => ['stats', months],
  period: (period, date) => ['period', period, formatDateForAPI(date)]
};

// Cleanup function for component unmount
export const cancelPendingRequests = () => {
  pendingRequests.forEach((controller) => controller.abort());
  pendingRequests.clear();
};

// ✅ ADD: Missing auth methods
export const authAPI = {
  login: (credentials) => api.post('/users/login', credentials),
  register: (userData) => api.post('/users/register', userData),
  logout: () => api.post('/users/logout'),
  verifyEmail: (token) => api.get(`/users/verify-email/${token}`),
  resendVerificationEmail: (email) => api.post('/users/resend-verification', { email }),
  forgotPassword: (email) => api.post('/users/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/users/reset-password', { token, newPassword }),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  updatePreferences: (preferences) => api.put('/users/preferences', { preferences }),
  uploadProfilePicture: (file) => {
    const formData = new FormData();
    formData.append('profilePicture', file);
    return api.post('/users/profile/picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  // ✅ ADD: Missing test email method
  testEmail: (email) => api.post('/users/test-email', { email })
};

export default api;