/**
 * 📡 UNIFIED API CLIENT - SpendWise API Integration
 * Centralized API client with authentication, caching, and error handling
 * @module api
 */

import apiClient from './client.js';
import authAPI from './auth.js';
import adminAPI from './admin.js';
import analyticsAPI from './analytics.js';
import performanceAPI from './performance.js';

/**
 * 🎯 Unified API Export
 * Single source of truth for all API operations
 */
export const api = {
  // Core API Client
  client: apiClient,
  
  // Authentication & Users
  auth: authAPI,
  users: authAPI, // Alias for backward compatibility
  
  // Data Management  
  transactions: apiClient.transactions,
  categories: apiClient.categories,
  
  // Analytics & Reports
  analytics: analyticsAPI,
  reports: analyticsAPI, // Alias
  
  // Admin Operations
  admin: adminAPI,
  
  // Performance & Monitoring
  performance: performanceAPI,
  
  // Cache Management
  clearCache: apiClient.clearCache.bind(apiClient),
  clearAllCache: () => apiClient.clearCache(),
  
  // Health & Status
  healthCheck: apiClient.healthCheck.bind(apiClient),
  getStatus: apiClient.getStatus.bind(apiClient),
  
  // Configuration
  setBaseURL: apiClient.setBaseURL.bind(apiClient),
  setAuthToken: apiClient.setAuthToken.bind(apiClient),
  
  // Error Handling
  onError: apiClient.onError.bind(apiClient),
  onRetry: apiClient.onRetry.bind(apiClient),
  
  // Request Interceptors
  addRequestInterceptor: apiClient.addRequestInterceptor.bind(apiClient),
  addResponseInterceptor: apiClient.addResponseInterceptor.bind(apiClient)
};

// Set default configuration
api.setBaseURL(import.meta.env.VITE_API_URL || 'https://spendwise-dx8g.onrender.com/api/v1');

export default api; 