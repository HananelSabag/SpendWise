// utils/api.js
import axios from 'axios';
import { auth } from './auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = auth.getAccessToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error details for debugging
    console.error('API Error:', {
      message: error.message,
      code: error.code,
      config: error.config,
      response: error.response?.data || null,
    });
    
    // NEW: Handle specific error codes for development
    if (import.meta.env.MODE === 'development' && error.response) {
      if (error.response.status === 401) {
        console.error('🔑 [API-ERROR] Unauthorized - Invalid or expired token');
      } else if (error.response.status === 403) {
        console.error('🚫 [API-ERROR] Forbidden - Insufficient permissions');
      } else if (error.response.status === 404) {
        console.error('🔍 [API-ERROR] Not found - Invalid endpoint or resource');
      } else if (error.response.status === 500) {
        console.error('💥 [API-ERROR] Server error - Something went wrong on the server');
      }
    }
    
    return Promise.reject(error);
  }
);

export const authAPI = {
  // ...existing methods...

  // NEW: Email verification methods
  verifyEmail: (token) => api.get(`/users/verify-email/${token}`),
  resendVerificationEmail: (email) => api.post('/users/resend-verification', { email }),

  // NEW: Email service health check
  checkEmailHealth: () => api.get('/users/email-health'),

  // NEW: Test email endpoint (development only)
  testEmail: (email) => api.post('/users/test-email', { email })
};

export default api;