// API service for making HTTP requests
import axios from 'axios';
import { getStoredToken } from '../utils/helpers';

const api = axios.create({
  baseURL: 'http://localhost:5000/api'
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (credentials) => api.post('/users/login', credentials),
  register: (userData) => api.post('/users/register', userData),
  getProfile: () => api.get('/users/profile')
};

export const transactionAPI = {
  
  getDailyBalance: () => api.get('/transactions/daily'),
  

  quickAdd: (data) => api.post('/transactions/quick', data),
  

  getRecent: (limit = 5) => api.get(`/transactions/recent?limit=${limit}`),

  getSummary: (period = 'daily') => api.get(`/transactions/summary/${period}`)
};

export const expenseAPI = {
  getAll: () => api.get('/expenses'),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`)
};

export const incomeAPI = {

  addRecurring: (data) => api.post('/income/recurring', data),
  getRecurring: () => api.get('/income/recurring'),
  
 
  addOneTime: (data) => api.post('/income/one-time', data),
  getOneTime: () => api.get('/income/one-time')
};

export default api;