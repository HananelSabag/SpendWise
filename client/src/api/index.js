/**
 * 📡 UNIFIED API CLIENT - SpendWise API Integration
 * Centralized API client with authentication, caching, and error handling
 * @module api
 */

import apiClient from './client.js';
import { authAPI } from './auth.js';
import { authStatusAPI } from './authStatus.js'; // 🔐 NEW: Bulletproof auth detection
import adminAPI from './admin.js';
import onboardingAPI from './onboarding.js'; // ✅ ADD: Import onboarding API
import transactionAPI from './transactions.js'; // ✅ ADD: Import transaction API
import shoppingAPI from './shopping.js';
import notificationsAPI from './notifications.js';

/**
 * 🎯 Unified API Export
 * Single source of truth for all API operations
 */
export const api = {
  // Core API Client
  client: apiClient,
  
  // Authentication & Users
  auth: authAPI,
  authStatus: authStatusAPI, // 🔐 NEW: Bulletproof auth detection
  users: {
    // Backward-compatibility wrapper
    async getProfile() { return authAPI.getProfile(); },
    async updateProfile(updates) { return authAPI.updateProfile(updates); },
    async verifyEmail(data) { return authAPI.verifyEmail?.(data?.token || data); },
    async resendVerificationEmail(data) { return authAPI.resendVerification?.(data?.email || data); },
    
    // ✅ Profile picture upload
    async uploadAvatar(formData) {
      try {
        const response = await apiClient.post('/users/upload-profile-picture', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        return {
          success: true,
          data: response.data,
          // ✅ Extract avatar URL from different possible response formats
          avatar_url: response.data?.data?.publicUrl || response.data?.data?.url || response.data?.avatar || response.data?.avatar_url
        };
      } catch (error) {
        // Error logging handled by apiClient
        return {
          success: false,
          error: {
            message: error.response?.data?.message || 'Failed to upload profile picture',
            code: error.response?.data?.code || 'AVATAR_UPLOAD_ERROR'
          }
        };
      }
    }
  },
  
  // Data Management
  transactions: transactionAPI, // ✅ FIXED: Use proper transaction API

  // Admin Operations
  admin: adminAPI,

  // ✅ ADD: Onboarding Management
  onboarding: onboardingAPI,

  // Shopping Wishlist
  shopping: shoppingAPI,

  // Notifications
  notifications: notificationsAPI,
  
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
  },

  // Cache Management
  clearCache: apiClient.clearCache ? apiClient.clearCache.bind(apiClient) : () => {},
  clearAllCache: () => apiClient.clearCache ? apiClient.clearCache() : undefined,

  // Health Check
  healthCheck: apiClient.healthCheck ? apiClient.healthCheck.bind(apiClient) : () => ({ healthy: true }),
};

// Expose globally in dev for debugging (used by recovery/cache)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  try { window.spendWiseAPI = api; } catch (_) {}
}

// Default export for backward compatibility
const spendWiseAPI = api;
export default spendWiseAPI;

// Individual module exports for backward compatibility
export { authAPI };
export { authStatusAPI }; // 🔐 NEW: Bulletproof auth detection
export { adminAPI };
export { transactionAPI }; // ✅ ADD: Export transaction API
export { apiClient };

// Additional backward compatibility exports
export const auth = authAPI;
export const admin = adminAPI;
export const transactions = transactionAPI; // ✅ ADD: Transaction alias 