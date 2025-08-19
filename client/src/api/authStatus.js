/**
 * 🔐 AUTHENTICATION STATUS API
 * Simple, bulletproof authentication detection
 * @version 1.0.0 - CLEAN SLATE
 */

import { api } from './client.js';

export const authStatusAPI = {
  /**
   * Get user's authentication status - BULLETPROOF
   * @returns {Object} - { authType, hasPassword, hasGoogle, isHybrid, needsPassword, canLinkGoogle }
   */
  async getAuthStatus() {
    try {
      const response = await api.client.get('/auth-status');
      
      if (response?.data?.success && response?.data?.data) {
        const status = response.data.data;
        
        // 🔍 DEBUG: Log what we received from server
        if (import.meta.env.DEV) {
          console.log('🔐 NEW AUTH STATUS API - Received from server:', {
            authType: status.authType,
            hasPassword: status.hasPassword,
            hasGoogle: status.hasGoogle,
            isHybrid: status.isHybrid,
            needsPassword: status.needsPassword,
            canLinkGoogle: status.canLinkGoogle
          });
        }
        
        return {
          success: true,
          data: status
        };
      } else {
        throw new Error('Invalid response format from auth status API');
      }
    } catch (error) {
      console.error('❌ Auth status API failed:', error);
      
      // Return a fallback status
      return {
        success: false,
        error: error.message,
        data: {
          authType: 'UNKNOWN',
          hasPassword: false,
          hasGoogle: false,
          isHybrid: false,
          needsPassword: false,
          canLinkGoogle: false,
          error: true
        }
      };
    }
  },

  /**
   * Verify authentication status consistency - DEBUG
   * @returns {Object} - Verification result
   */
  async verifyAuthStatus() {
    try {
      const response = await api.client.get('/auth-status/verify');
      
      if (response?.data?.success && response?.data?.data) {
        return {
          success: true,
          data: response.data.data
        };
      } else {
        throw new Error('Invalid response format from auth status verify API');
      }
    } catch (error) {
      console.error('❌ Auth status verify API failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};
