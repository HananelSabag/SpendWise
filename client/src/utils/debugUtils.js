/**
 * Debug utilities for API and data structure testing
 */

import { authAPI } from './api';

export const debugUtils = {
  /**
   * Test profile endpoint and analyze response structure
   */
  testProfileStructure: async () => {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      console.log('❌ No access token found');
      return;
    }
    
    console.log('🧪 Testing profile endpoint structure...');
    
    try {
      const response = await authAPI.getProfile();
      
      console.log('✅ Profile response received');
      console.log('📋 Full response:', response);
      console.log('📋 Response.data:', response.data);
      console.log('📋 Response.data.data:', response.data?.data);
      console.log('📋 Response.data.data.data:', response.data?.data?.data);
      
      // Check for different structures
      if (response.data?.data?.data) {
        console.log('🔍 Triple nested structure detected');
        console.log('👤 User data:', response.data.data.data);
      } else if (response.data?.data) {
        console.log('🔍 Double nested structure detected');
        console.log('👤 User data:', response.data.data);
      } else {
        console.log('🔍 Single nested structure detected');
        console.log('👤 User data:', response.data);
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ Profile test failed:', error);
    }
  },
  
  /**
   * Clear all auth data and reload
   */
  resetAuth: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    if (window.queryClient) {
      window.queryClient.clear();
    }
    window.location.reload();
  },
  
  /**
   * Check current query cache
   */
  checkProfileCache: () => {
    if (window.queryClient) {
      const profileData = window.queryClient.getQueryData(['profile']);
      console.log('📋 Current profile cache:', profileData);
      return profileData;
    }
  }
};

// Make available in console during development
if (import.meta.env.DEV) {
  window.debugUtils = debugUtils;
}

export default debugUtils;
