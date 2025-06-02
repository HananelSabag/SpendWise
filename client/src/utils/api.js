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

// Request interceptor - ✅ לוגים קונציזיים יותר
api.interceptors.request.use(
  (config) => {
    const requestId = crypto.randomUUID();
    
    // ✅ לוג רק אם לא recurring/templates או אם debug מפורש
    const isDashboardRequest = config.url?.includes('/dashboard');
    const isRecurringRequest = config.url?.includes('/recurring') || config.url?.includes('/templates');
    const debugMode = localStorage.getItem('debug_api') === 'true';
    
    if (isDashboardRequest || debugMode || (!isRecurringRequest)) {
      console.log(`🌐 [API] ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    // Add auth token
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers['X-Request-ID'] = requestId;
    config.metadata = { requestId, startTime: Date.now() };

    return config;
  },
  (error) => {
    console.error(`❌ [API-REQUEST-ERROR]`, error);
    return Promise.reject(error);
  }
);

// Response interceptor - ✅ לוגים קונציזיים יותר
api.interceptors.response.use(
  (response) => {
    const duration = Date.now() - response.config.metadata.startTime;
    
    // ✅ לוג רק בקריאות חשובות או debug
    const isDashboardRequest = response.config.url?.includes('/dashboard');
    const isRecurringRequest = response.config.url?.includes('/recurring') || response.config.url?.includes('/templates');
    const isProfileRequest = response.config.url?.includes('/profile');
    const debugMode = localStorage.getItem('debug_api') === 'true';
    
    if (isDashboardRequest || isProfileRequest || debugMode || (!isRecurringRequest)) {
      console.log(`✅ [API] ${response.config.url} (${duration}ms)`);
    }
    
    return response;
  },
  async (error) => {
    const duration = error.config?.metadata ? Date.now() - error.config.metadata.startTime : 'unknown';
    console.error(`❌ [API] ${error.config?.url} failed (${duration}ms)`);
    
    const originalRequest = error.config;
    
    // Handle 401 - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log(`🔄 [API-RETRY] Attempting token refresh for request: ${requestId}`);
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          console.log(`🔄 [API-RETRY] Refreshing token...`);
          const response = await axios.post('/api/v1/users/refresh-token', {
            refreshToken
          });
          
          const { accessToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);
          console.log(`✅ [API-RETRY] Token refreshed successfully`);
          
          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          console.log(`🔄 [API-RETRY] Retrying original request: ${requestId}`);
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error(`❌ [API-RETRY] Token refresh failed:`, refreshError);
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

// Helper function to format dates consistently for API calls
const formatDateForAPI = (date) => {
  if (!date) return undefined;
  
  // Make sure we have a Date object
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Always send YYYY-MM-DD format to the server
  return dateObj.toISOString().split('T')[0];
};

// ✅ Helper function לטיפול ב-URLs של תמונות
const getFullImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  return `${API_URL}${imagePath}`;
};

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/users/login', credentials),
  register: (userData) => api.post('/users/register', userData),
  logout: () => api.post('/users/logout'),
  // ✅ תיקון העלאת תמונת פרופיל - נתיב תקין
  uploadProfilePicture: async (file) => {
    const formData = new FormData();
    formData.append('profilePicture', file);
    
    const response = await api.post('/users/profile/picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    // ✅ המר נתיב יחסי ל-URL מלא
    if (response.data?.data?.path) {
      response.data.data.path = getFullImageUrl(response.data.data.path);
    }
    
    return response;
  },
  
  // ✅ עדכון פרופיל - רק שדות קיימים בדטאבייס
  updateProfile: async (data) => {
    // ✅ רק username ו-email מותרים לעדכון בפרופיל הבסיסי
    const allowedFields = ['username', 'email'];
    const profileData = {};
    
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        profileData[field] = data[field];
      }
    });
    
    if (Object.keys(profileData).length === 0) {
      throw new Error('No valid profile fields to update');
    }
    
    return api.put('/users/profile', profileData);
  },

  // ✅ עדכון preferences - רק תמונת פרופיל ו-settings
  updatePreferences: async (preferences) => {
    return api.put('/users/preferences', { preferences });
  },

  // ✅ קבלת פרופיל משתמש - נתיב תקין
  getProfile: async () => {
    const response = await api.get('/users/profile');
    
    // ✅ המר נתיבי תמונות יחסיים ל-URLs מלאים
    if (response.data?.data?.preferences?.profilePicture) {
      response.data.data.preferences.profilePicture = getFullImageUrl(
        response.data.data.preferences.profilePicture
      );
    }
    
    return response;
  }
};

// Helper function to trigger dashboard refresh without direct queryClient dependency
const invalidateAndRefreshQueries = async (queryKey) => {
  // Instead of accessing queryClient directly, dispatch a custom event
  // that will be caught by the appropriate components
  const event = new CustomEvent('dashboard-refresh-requested', { 
    detail: { queryKey }
  });
  window.dispatchEvent(event);
  
  console.log(`[API] Refresh requested for: ${queryKey}`);
  return true;
};

// Transaction API - All endpoints including new dashboard
export const transactionAPI = {
  // NEW - Single dashboard call instead of 3!
  getDashboard: (date) => {
    const formattedDate = formatDateForAPI(date);
    console.log(`📊 [TRANSACTION-API] getDashboard called with date: ${formattedDate}`);
    console.log(`📊 [TRANSACTION-API] Original date object:`, date);
    
    return api.get('/transactions/dashboard', { 
      params: { date: formattedDate }
    });
  },
  
  // Legacy endpoints (still supported)
  getRecent: (limit = 5, date) => api.get('/transactions/recent', { 
    params: { 
      limit, 
      date: formatDateForAPI(date)
    }
  }),
  
  // ✅ תיקון getAll לעבוד עם השרת הקיים
  getAll: async (params = {}) => {
    // אם יש period, השתמש ב-getByPeriod במקום
    if (params.period) {
      console.log(`📊 [API] Using getByPeriod instead of getAll for period: ${params.period}`);
      return transactionAPI.getByPeriod(params.period, params.date);
    }
    
    // אחרת השתמש ב-dashboard
    console.log(`📊 [API] Using getDashboard as fallback for getAll`);
    const response = await transactionAPI.getDashboard(params.date);
    
    // המר לפורמט שהקלינט מצפה לו
    return {
      data: {
        transactions: response.data.data.recent_transactions || [],
        pagination: {
          total: response.data.data.recent_transactions?.length || 0,
          page: 1,
          limit: response.data.data.recent_transactions?.length || 0
        }
      }
    };
  },

  // ✅ שיפור getByPeriod
  getByPeriod: async (period, date) => {
    const formattedDate = formatDateForAPI(date);
    console.log(`📊 [API] getByPeriod: ${period} for date: ${formattedDate}`);
    
    try {
      const response = await api.get(`/transactions/period/${period}`, {
        params: { date: formattedDate }
      });
      
      console.log(`📊 [API] getByPeriod response:`, response.data);
      
      // ✅ וודא שהתשובה במבנה הנכון
      if (response.data?.success && response.data?.data) {
        return response;
      } else {
        // ✅ תקן את המבנה אם צריך
        return {
          data: {
            success: true,
            data: {
              transactions: Array.isArray(response.data) ? response.data : []
            }
          }
        };
      }
    } catch (error) {
      console.error('🚨 [API] getByPeriod failed:', error);
      
      // ✅ החזר response ריק במקרה של שגיאה
      return {
        data: {
          success: false,
          data: {
            transactions: []
          },
          error: error.message
        }
      };
    }
  },
  
  // ✅ הוספת פונקציות חדשות ל-transactionAPI
  getCategories: () => api.get('/categories'),
  
  // ✅ פונקציה משופרת לעסקאות חוזרות
  getRecurring: async (type = null) => {
    const endpoint = type ? `/transactions/recurring?type=${type}` : '/transactions/recurring';
    log(`Fetching recurring transactions from: ${endpoint}`);
    
    const response = await api.get(endpoint);
    return response.data;
  },
  
  getBalanceDetails: (date) => api.get('/transactions/balance/details', {
    params: { date: formatDateForAPI(date) }
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
  search: async (searchTerm, limit = 50) => {
    const response = await api.get(`/transactions/search?q=${encodeURIComponent(searchTerm)}&limit=${limit}`);
    return response.data;
  },
  
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
        startDate: formatDateForAPI(startDate),
        endDate: formatDateForAPI(endDate)
      }
    }),
  
  getStats: (months = 12) => api.get('/transactions/stats', { params: { months } }),
  
  // Function to force refresh dashboard data
  forceRefreshDashboard: async () => {
    return invalidateAndRefreshQueries('dashboard');
  },
  
  // Convenience method for dashboard refresh
  refreshDashboard: () => transactionAPI.forceRefreshDashboard(),
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
  dashboard: (date) => ['dashboard', formatDateForAPI(date)],
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

// ✅ ייצוא הפונקציה לשימוש במקומות אחרים
export { getFullImageUrl };