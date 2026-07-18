import { api } from './client.js';

export const authStatusAPI = {
  async getAuthStatus() {
    try {
      const response = await api.client.get('/auth-status');
      if (!response?.data?.success || !response?.data?.data) {
        throw new Error('Invalid authentication status response');
      }
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error?.message || 'Failed to load authentication status',
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
  }
};
