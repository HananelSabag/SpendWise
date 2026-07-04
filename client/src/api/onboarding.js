/**
 * 🎯 ONBOARDING API MODULE - User Onboarding Management
 * Features: Completion tracking, Preferences management, Status checking
 * @module api/onboarding
 */

import { api } from './client.js';

export const onboardingAPI = {
  /**
   * Complete user onboarding
   */
  async complete(data = {}) {
    try {
      const response = await api.client.post('/onboarding/complete', data);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: api.normalizeError ? api.normalizeError(error) : { message: error.message }
      };
    }
  },

  /**
   * Update user preferences during onboarding
   */
  async updatePreferences(preferences = {}) {
    try {
      const response = await api.client.post('/onboarding/preferences', preferences);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: api.normalizeError ? api.normalizeError(error) : { message: error.message }
      };
    }
  },

  /**
   * Get user onboarding status
   */
  async getStatus() {
    try {
      const response = await api.client.get('/onboarding/status');

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: api.normalizeError ? api.normalizeError(error) : { message: error.message }
      };
    }
  }
};

export default onboardingAPI; 