// src/utils/api.js - Updated for new backend with React Query support
import axios from 'axios';
import toast from 'react-hot-toast';

// Get environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';
const DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE === 'true';

// Create axios instance with dynamic base URL
const api = axios.create({
  baseURL: `${API_URL}/api/${API_VERSION}`,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Debug logger
const log = (message, data = null) => {
  if (DEBUG_MODE) {
    console.log(`[API] ${message}`, data);
  }
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request ID
    config.headers['X-Request-ID'] = crypto.randomUUID();

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post('/api/v1/users/refresh-token', {
            refreshToken
          });
          
          const { accessToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);
          
          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    const message = error.response?.data?.error?.message || error.message;
    const code = error.response?.data?.error?.code;
    
    // Show toast for specific errors
    switch (error.response?.status) {
      case 429:
        toast.error('Too many requests. Please slow down.');
        break;
      case 500:
        toast.error('Server error. Please try again later.');
        break;
      default:
        if (code !== 'VALIDATION_ERROR' && message) {
          toast.error(message);
        }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/users/login', credentials),
  register: (userData) => api.post('/users/register', userData),
  logout: () => api.post('/users/logout'),
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
};

// Transaction API - All endpoints including new dashboard
export const transactionAPI = {
  // NEW - Single dashboard call instead of 3!
  getDashboard: (date) => api.get('/transactions/dashboard', { 
    params: { date: date?.toISOString().split('T')[0] }
  }),
  
  // Legacy endpoints (still supported)
  getRecent: (limit = 5, date) => api.get('/transactions/recent', { 
    params: { 
      limit, 
      date: date?.toISOString().split('T')[0]
    }
  }),
  
  getByPeriod: (period, date) => api.get(`/transactions/period/${period}`, {
    params: { date: date.toISOString().split('T')[0] }
  }),
  
  getRecurring: (type) => api.get('/transactions/recurring', {
    params: type ? { type } : {}
  }),
  
  getBalanceDetails: (date) => api.get('/transactions/balance/details', {
    params: { date: date.toISOString().split('T')[0] }
  }),
  
  getSummary: () => api.get('/transactions/summary'),
  
  getBalanceHistory: (period = 'month', limit = 12) => 
    api.get(`/transactions/balance/history/${period}`, { params: { limit } }),
  
  // CRUD operations
  create: (type, data) => api.post(`/transactions/${type}`, data),
  update: (type, id, data) => api.put(`/transactions/${type}/${id}`, data),
  delete: (type, id, deleteFuture = false) => 
    api.delete(`/transactions/${type}/${id}`, { params: { deleteFuture } }),
  
  // Search
  search: (query, limit = 50) => api.get('/transactions/search', {
    params: { q: query, limit }
  }),
  
  // Skip occurrence
  skipOccurrence: (type, id, skipDate) => 
    api.post(`/transactions/${type}/${id}/skip`, { skipDate }),
  
  // Templates (recurring)
  getTemplates: () => api.get('/transactions/templates'),
  updateTemplate: (id, data) => api.put(`/transactions/templates/${id}`, data),
  deleteTemplate: (id, deleteFuture = false) => 
    api.delete(`/transactions/templates/${id}`, { params: { deleteFuture } }),
  skipTemplateDates: (id, dates) => 
    api.post(`/transactions/templates/${id}/skip`, { dates }),
  
  // Categories & Stats
  getCategoryBreakdown: (startDate, endDate) => 
    api.get('/transactions/categories/breakdown', {
      params: { 
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      }
    }),
  
  getStats: (months = 12) => api.get('/transactions/stats', { params: { months } }),
};

// Utility function to handle API errors
export const handleAPIError = (error) => {
  const errorData = error.response?.data?.error || {};
  return {
    code: errorData.code || 'UNKNOWN_ERROR',
    message: errorData.message || 'An unexpected error occurred',
    status: error.response?.status || 500,
    timestamp: errorData.timestamp || new Date().toISOString()
  };
};

// Export for React Query
export const queryKeys = {
  // Auth
  profile: ['profile'],
  
  // Transactions
  dashboard: (date) => ['dashboard', date?.toISOString().split('T')[0]],
  transactions: (filters) => ['transactions', filters],
  recurring: (type) => ['recurring', type],
  templates: ['templates'],
  stats: (months) => ['stats', months],
  categoryBreakdown: (start, end) => ['categoryBreakdown', start, end],
  balanceHistory: (period) => ['balanceHistory', period],
  
  // Invalidation helpers
  allTransactions: ['transactions'],
  allDashboard: ['dashboard'],
};

export default api;