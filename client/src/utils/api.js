import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
  withCredentials: true
});

// Request logging
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  console.log(`🚀 Request: ${config.method?.toUpperCase()} ${config.url}`, {
    cached: config.cached || false,
    params: config.params
  });
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response logging with cache status
api.interceptors.response.use(
  (response) => {
    console.log(`✅ Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      cached: response.config.cached || false,
      size: JSON.stringify(response.data).length
    });
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      console.warn('Unauthorized: Token may have expired or is invalid.');
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/users/login', credentials),
  register: (userData) => api.post('/users/register', userData),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data)
};

export const transactionAPI = {
  getAllTransactions: (params) => api.get('/transactions', { params }),
  addExpense: (data) => api.post('/transactions/expense', data),
  addIncome: (data) => api.post('/transactions/income', data),
  getDailySummary: () => api.get('/transactions/summary/daily'),
  getWeeklySummary: () => api.get('/transactions/summary/weekly'),
  getMonthlySummary: () => api.get('/transactions/summary/monthly'),
  getRecentTransactions: (limit = 5) => api.get('/transactions/recent', { 
    params: { limit },
    cached: true // Mark cacheable endpoints
  }),
  getRecurring: (type) => api.get(`/transactions/recurring/${type}`),
  addRecurring: (type, data) => api.post(`/transactions/recurring/${type}`, data)
};

export default api;