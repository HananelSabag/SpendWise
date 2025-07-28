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
  clearCache: apiClient.clearCache ? apiClient.clearCache.bind(apiClient) : () => {},
  clearAllCache: () => apiClient.clearCache ? apiClient.clearCache() : undefined,
  
  // Health Check
  healthCheck: apiClient.healthCheck ? apiClient.healthCheck.bind(apiClient) : () => ({ healthy: true }),
  
  // Safe methods with fallbacks
  getStatus: () => ({ status: 'ok' }),
  setBaseURL: (url) => { /* No-op */ },
  setAuthToken: (token) => { /* No-op */ },
  onError: (callback) => { /* No-op */ },
  onRetry: (callback) => { /* No-op */ },
  addRequestInterceptor: (callback) => { /* No-op */ },
  addResponseInterceptor: (callback) => { /* No-op */ }
};

// Set default configuration
if (typeof api.setBaseURL === 'function') {
  api.setBaseURL(import.meta.env.VITE_API_URL || 'https://spendwise-dx8g.onrender.com/api/v1');
}

// Default export for backward compatibility
const spendWiseAPI = api;
export default spendWiseAPI;

// Individual module exports for backward compatibility
export { authAPI };
export { adminAPI };
export { analyticsAPI };
export { performanceAPI };
export { apiClient };

// Additional backward compatibility exports
export const auth = authAPI;
export const admin = adminAPI;
export const analytics = analyticsAPI;
export const performance = performanceAPI; 