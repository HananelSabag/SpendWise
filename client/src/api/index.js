/**
 * 📡 UNIFIED API CLIENT - SpendWise API Integration
 * Centralized API client with authentication, caching, and error handling
 * @module api
 */

import apiClient from './client.js';
import { authAPI } from './auth.js';
import adminAPI from './admin.js';
import analyticsAPI from './analytics.js';
import categoriesAPI from './categories.js'; // ✅ ADD: Import categories API
import performanceAPI from './performance.js';
import onboardingAPI from './onboarding.js'; // ✅ ADD: Import onboarding API
import transactionAPI from './transactions.js'; // ✅ ADD: Import transaction API

/**
 * 🎯 Unified API Export
 * Single source of truth for all API operations
 */
export const api = {
  // Core API Client
  client: apiClient,
  
  // Authentication & Users
  auth: authAPI,
  users: {
    // Backward-compatibility wrapper
    async getProfile() { return authAPI.getProfile(); },
    async updateProfile(updates) { return authAPI.updateProfile(updates); },
    async verifyEmail(data) { return authAPI.verifyEmail?.(data?.token || data); },
    async resendVerificationEmail(data) { return authAPI.resendVerification?.(data?.email || data); }
  },
  
  // Data Management  
  transactions: transactionAPI, // ✅ FIXED: Use proper transaction API
  categories: categoriesAPI, // ✅ FIXED: Use proper categories API
  
  // Analytics & Reports
  analytics: analyticsAPI,
  reports: analyticsAPI, // Alias
  
  // Admin Operations
  admin: adminAPI,
  
  // Performance & Monitoring
  performance: performanceAPI,
  
  // ✅ ADD: Onboarding Management
  onboarding: onboardingAPI,
  
  // ✅ ENHANCED: Export functionality with PDF support
  export: {
    async exportAsCSV() {
      try {
        const response = await apiClient.get('/export/csv');
        return { success: true, data: response.data };
      } catch (error) {
        return { success: false, error: apiClient.normalizeError ? apiClient.normalizeError(error) : error };
      }
    },
    async exportAsJSON() {
      try {
        const response = await apiClient.get('/export/json');
        return { success: true, data: response.data };
      } catch (error) {
        return { success: false, error: apiClient.normalizeError ? apiClient.normalizeError(error) : error };
      }
    },
    async exportAsPDF() {
      try {
        const response = await apiClient.get('/export/pdf', {
          responseType: 'blob' // ✅ Important for PDF binary data
        });
        return { success: true, data: response.data };
      } catch (error) {
        // ✅ ENHANCED: Handle blob response errors properly
        if (error.response?.data instanceof Blob && error.response.data.type === 'application/json') {
          // Server returned JSON error in blob format
          const text = await error.response.data.text();
          try {
            const jsonError = JSON.parse(text);
            return { success: false, error: { message: jsonError.error?.message || jsonError.message || 'PDF export failed' } };
          } catch {
            return { success: false, error: { message: 'PDF export failed' } };
          }
        }
        return { success: false, error: apiClient.normalizeError ? apiClient.normalizeError(error) : error };
      }
    },
    async getExportOptions() {
      try {
        const response = await apiClient.get('/export/options');
        return { success: true, data: response.data };
      } catch (error) {
        return { success: false, error: apiClient.normalizeError ? apiClient.normalizeError(error) : error };
      }
    }
  },
  
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

// Expose globally in dev for debugging (used by recovery/cache)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  try { window.spendWiseAPI = api; } catch (_) {}
}

// Default export for backward compatibility
const spendWiseAPI = api;
export default spendWiseAPI;

// Individual module exports for backward compatibility
export { authAPI };
export { adminAPI };
export { analyticsAPI };
export { performanceAPI };
export { transactionAPI }; // ✅ ADD: Export transaction API
export { apiClient };

// Additional backward compatibility exports
export const auth = authAPI;
export const admin = adminAPI;
export const analytics = analyticsAPI;
export const performance = performanceAPI;
export const transactions = transactionAPI; // ✅ ADD: Transaction alias 