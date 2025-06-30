// src/utils/auth.js - Updated authentication utilities
import { authAPI } from './api';

/**
 * Token management
 */
export const tokenManager = {
  getAccessToken: () => localStorage.getItem('accessToken'),
  getRefreshToken: () => localStorage.getItem('refreshToken'),
  
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  },
  
  clearTokens: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
  
  isTokenExpired: (token) => {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
};

/**
 * Authentication functions
 */
export const auth = {
  /**
   * Login user
   * @param {Object} credentials - { email, password }
   * @returns {Promise<Object>} User data and tokens
   */
  login: async (credentials) => {
    try {
      console.log(`🔑 [AUTH-LOGIN] Attempting login for: ${credentials.email}`);
      const response = await authAPI.login(credentials);
      const { data } = response.data;
      
      console.log(`✅ [AUTH-LOGIN] Login response:`, data);
      
      // Store tokens
      if (data.accessToken && data.refreshToken) {
        tokenManager.setTokens(data.accessToken, data.refreshToken);
        console.log(`✅ [AUTH-LOGIN] Tokens stored successfully`);
      }
      
      return {
        success: true,
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken
      };
    } catch (error) {
      console.error(`❌ [AUTH-LOGIN] Login failed:`, error);
      return {
        success: false,
        error: error.response?.data?.error || { 
          message: 'Login failed',
          code: 'LOGIN_ERROR'
        }
      };
    }
  },

  /**
   * Register new user
   * @param {Object} userData - Registration data
   * @returns {Promise<Object>} Result
   */
  register: async (userData) => {
    try {
      const response = await authAPI.register(userData);
      return {
        success: true,
        message: response.data.message || (typeof window !== 'undefined' && window.localStorage?.getItem('app_language') === 'he' 
          ? 'הרשמה הצליחה' 
          : 'Registration successful')
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message: 'Registration failed',
          code: 'REGISTER_ERROR'
        }
      };
    }
  },

  /**
   * Logout user
   * @returns {Promise<void>}
   */
  logout: async () => {
    try {
      // Call logout endpoint
      await authAPI.logout();
    } catch (error) {
      // Log error but continue with local logout
      console.error('Logout API error:', error);
    } finally {
      // Clear local data
      tokenManager.clearTokens();
      // Redirect to login
      window.location.href = '/login';
    }
  },

  /**
   * Get current user profile
   * @returns {Promise<Object|null>} User data or null
   */
  getCurrentUser: async () => {
    try {
      const token = tokenManager.getAccessToken();
      if (!token || tokenManager.isTokenExpired(token)) {
        return null;
      }
      
      const response = await authAPI.getProfile();
      return response.data.data;
    } catch (error) {
      if (error.response?.status === 401) {
        tokenManager.clearTokens();
      }
      return null;
    }
  },

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated: () => {
    const token = tokenManager.getAccessToken();
    return token && !tokenManager.isTokenExpired(token);
  },
  
  /**
   * Get authentication status
   * @returns {Object} { hasToken, isExpired, isAuthenticated }
   */
  getAuthStatus: () => {
    const token = tokenManager.getAccessToken();
    const isExpired = token ? tokenManager.isTokenExpired(token) : true;
    
    return {
      hasToken: !!token,
      isExpired,
      isAuthenticated: !!token && !isExpired
    };
  }
};

export default auth;