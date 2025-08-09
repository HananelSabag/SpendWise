/**
 * 🔐 AUTH API MODULE - Complete Authentication System
 * Features: Email/Password, Google OAuth, Role-based access, Enhanced security
 * @module api/auth
 */

import { api } from './client.js';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-hot-toast';
import { normalizeUserData } from '../utils/userNormalizer';

// ✅ Google OAuth Configuration
const GOOGLE_CONFIG = {
  CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  SCRIPT_URL: 'https://accounts.google.com/gsi/client'
};

// ✅ Google OAuth Manager - CLEAN SIMPLE VERSION
class GoogleOAuthManager {
  constructor() {
    this.isReady = false;
  }

  // Simple Google script loading
  async loadScript() {
    if (window.google?.accounts?.id) return;
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = () => {
        setTimeout(() => {
          if (window.google?.accounts?.id) {
            resolve();
          } else {
            reject(new Error('Google services not available'));
          }
        }, 100);
      };
      script.onerror = () => reject(new Error('Failed to load Google script'));
      document.head.appendChild(script);
    });
  }

  // Simple initialization
  async initialize() {
    if (this.isReady) return;

    if (!GOOGLE_CONFIG.CLIENT_ID) {
      throw new Error('Google Client ID not configured');
    }

    await this.loadScript();

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CONFIG.CLIENT_ID,
      callback: this.handleResponse.bind(this)
    });

    this.isReady = true;
    console.log('✅ Google OAuth ready');
  }

  // Handle Google response
  handleResponse(response) {
    console.log('🎯 Google response received:', response);
    if (this.resolver) {
      console.log('✅ Resolving with response');
      this.resolver(response);
      this.resolver = null;
    } else {
      console.log('⚠️ No resolver available');
    }
  }

  // Simple sign-in - Direct popup approach
  async signIn() {
    if (!this.isReady) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      // Set the main resolver
      this.resolver = resolve;
      let timeoutId;

      console.log('🚀 Using direct popup approach (skipping One Tap)');
      
      // Go directly to popup - skip One Tap completely
      this.renderButton().catch(reject);

      // Extended timeout to allow for user interaction
      timeoutId = setTimeout(() => {
        if (this.resolver) {
          console.log('⏰ OAuth timeout reached');
          this.resolver = null;
          reject(new Error('Google sign-in timeout'));
        }
      }, 60000); // 60 seconds

      // Wrap original resolver to clear timeout
      const originalResolver = this.resolver;
      this.resolver = (response) => {
        clearTimeout(timeoutId);
        if (originalResolver) {
          originalResolver(response);
        }
      };
    });
  }

  // Render button approach - simplified
  async renderButton() {
    console.log('🔍 Creating invisible button...');
    
    // Create invisible button container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '-9999px';
    container.style.visibility = 'hidden';
    document.body.appendChild(container);

    // Render Google button
    window.google.accounts.id.renderButton(container, {
      theme: 'outline',
      size: 'large',
      type: 'standard'
    });

    console.log('🔍 Button rendered, attempting auto-click...');
    
    // Auto-click after short delay
    setTimeout(() => {
      const button = container.querySelector('[role="button"]');
      if (button) {
        console.log('✅ Button found, clicking...');
        button.click();
      } else {
        console.log('❌ Button not found');
      }
    }, 500);
    
    // Cleanup after delay
    setTimeout(() => {
      if (document.body.contains(container)) {
        console.log('🧹 Cleaning up button container');
        document.body.removeChild(container);
      }
    }, 5000);
  }
}

// ✅ Initialize Google OAuth Manager
const googleOAuth = new GoogleOAuthManager();

// ✅ Auth API Module
export const authAPI = {
  // ✅ Regular Email/Password Login
  async login(email, password) {
    try {
      const response = await api.client.post('/users/login', {
        email,
        password
      });

      // Handle your server's response structure with comprehensive fallbacks
      let user, token;
      
      // Try multiple extraction patterns
      if (response.data.success && response.data.data) {
        // Primary server format: { success: true, data: { user: {...}, accessToken: "..." } }
        user = response.data.data.user;
        token = response.data.data.accessToken ||           // ← MAIN PATH (actual server format)
                response.data.data.tokens?.accessToken || 
                response.data.data.tokens?.access_token || 
                response.data.data.token;
      } else if (response.data.data && response.data.data.tokens) {
        // Alternative: data.tokens directly
        user = response.data.data.user || response.data.user;
        token = response.data.data.tokens.accessToken || response.data.data.tokens.access_token;
      } else if (response.data.user && response.data.token) {
        // Direct user/token structure
        user = response.data.user;
        token = response.data.token;
      } else if (response.data.accessToken || response.data.token) {
        // Legacy structure: user data directly + token
        user = response.data;
        token = response.data.accessToken || response.data.token;
      } else {
        // Last resort: check all possible token locations
        user = response.data.user || response.data.data?.user || response.data;
        token = response.data.token || 
                response.data.accessToken ||
                response.data.data?.token ||
                response.data.data?.accessToken ||
                response.data.data?.tokens?.accessToken ||
                response.data.data?.tokens?.access_token;
      }
      
      // Ensure user has required properties
      if (!user) {
        throw new Error('Invalid server response: no user data');
      }
      
      // ✅ Use centralized user normalization
      const normalizedUser = normalizeUserData(user);
      
      // Store tokens if provided
      if (token) {
        localStorage.setItem('accessToken', token);
      }

      // ✅ FIX: Store refresh token if provided  
      const refreshToken = response.data.data?.tokens?.refreshToken || 
                          response.data.data?.refreshToken ||
                          response.data.tokens?.refreshToken ||
                          response.data.refreshToken;
      
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
        console.log('✅ Refresh token stored for login');
      }
      
      // Clear any auth-related cache
      api.clearCache('users');
      api.clearCache('auth');
      
      return {
        success: true,
        user: normalizedUser,
        token,
        refreshToken
      };
    } catch (error) {
      console.error('🔑 Auth API login error:', error);
      
      // Provide more specific error information
      let errorMessage = 'Login failed';
      let errorCode = 'LOGIN_FAILED';
      
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 401) {
          // ✅ FIXED: Preserve server's specific error messages (e.g., hybrid auth guidance)
          errorMessage = data.message || data.error || 'Invalid email or password';
          errorCode = 'INVALID_CREDENTIALS';
        } else if (status === 403) {
          errorMessage = data.message || data.error || 'Account is locked or suspended';
          errorCode = 'ACCOUNT_LOCKED';
        } else if (status === 422) {
          errorMessage = data.message || 'Invalid input data';
          errorCode = 'VALIDATION_ERROR';
        } else if (status >= 500) {
          errorMessage = 'Server error. Please try again later.';
          errorCode = 'SERVER_ERROR';
        } else {
          errorMessage = data.message || data.error || 'Login failed';
        }
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your connection.';
        errorCode = 'NETWORK_ERROR';
      }
      
      return {
        success: false,
        error: {
          message: errorMessage,
          code: errorCode,
          status: error.response?.status || 0
        }
      };
    }
  },

  // ✅ Google OAuth Login
  async googleLogin() {
    try {
      // Initialize Google OAuth if needed
      if (!googleOAuth.isInitialized) {
        await googleOAuth.initialize();
      }
      
      // Get Google credential
      const googleResponse = await googleOAuth.signIn();
      
      // ✅ Extract credential from Google response object
      const credential = googleResponse?.credential || googleResponse;
      
      // ✅ Validate that we received a proper JWT token
      if (!credential || typeof credential !== 'string') {
        throw new Error('Invalid Google credential received');
      }
      
      // ✅ Check if it's a JWT (has 3 parts separated by dots)
      const parts = credential.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format - expected JWT ID token');
      }
      
      // ✅ Extract user info from JWT credential
      let userInfo = { email: '', name: '', picture: '' };
      
      try {
        const decoded = jwtDecode(credential);
        userInfo = {
          email: decoded.email || '',
          name: decoded.name || '',
          picture: decoded.picture || ''
        };
      } catch (decodeError) {
        throw new Error('Failed to decode Google ID token');
      }
      
      // ✅ Ensure we have an email
      if (!userInfo.email) {
        throw new Error('No email found in Google credential');
      }
      
      // ✅ Final payload to send
      const payload = {
        idToken: credential,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture
      };
      
      // Send credential to our backend with extracted user info
      const response = await api.client.post('/users/auth/google', payload);

      // ✅ FIX: Use EXACT same extraction logic as regular login
      let user, token;
      
      // Try multiple extraction patterns (same as regular login)
      if (response.data.success && response.data.data) {
        // Primary server format: { success: true, data: { user: {...}, accessToken: "..." } }
        user = response.data.data.user;
        token = response.data.data.accessToken ||           // ← MAIN PATH (actual server format)
                response.data.data.tokens?.accessToken || 
                response.data.data.tokens?.access_token || 
                response.data.data.token;
      } else if (response.data.data && response.data.data.tokens) {
        // Alternative: data.tokens directly
        user = response.data.data.user || response.data.user;
        token = response.data.data.tokens.accessToken || response.data.data.tokens.access_token;
      } else if (response.data.user && response.data.token) {
        // Direct user/token structure
        user = response.data.user;
        token = response.data.token;
      } else if (response.data.accessToken || response.data.token) {
        // Legacy structure: user data directly + token
        user = response.data;
        token = response.data.accessToken || response.data.token;
      } else {
        // Last resort: check all possible token locations
        user = response.data.user || response.data.data?.user || response.data;
        token = response.data.token || 
                response.data.accessToken ||
                response.data.data?.token ||
                response.data.data?.accessToken ||
                response.data.data?.tokens?.accessToken ||
                response.data.data?.tokens?.access_token;
      }
      
      // Ensure user has required properties
      if (!user) {
        throw new Error('Invalid server response: no user data');
      }
      
      // ✅ CLEANED: Use centralized user normalization
      const normalizedUser = normalizeUserData(user);
      
      // Store tokens if provided
      if (token) {
        localStorage.setItem('accessToken', token);
      }

      // ✅ FIX: Store refresh token for Google Auth too
      const refreshToken = response.data.data?.tokens?.refreshToken || 
                          response.data.data?.refreshToken ||
                          response.data.tokens?.refreshToken ||
                          response.data.refreshToken;
      
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
        console.log('✅ Refresh token stored for Google login');
      }
      
      // Clear any auth-related cache
      api.clearCache('users');
      api.clearCache('auth');
      
      // ✅ Return EXACT same structure as regular login
      return {
        success: true,
        user: normalizedUser,
        token,
        refreshToken
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || error.message || 'Google Sign-In failed',
          code: 'GOOGLE_AUTH_ERROR'
        }
      };
    }
  },

  // ✅ User Registration
  async register(userData) {
    try {
      const response = await api.client.post('/users/register', userData);
      
      const { user, token } = response.data;
      
      // Store token if provided (auto-login after registration)
      if (token) {
        localStorage.setItem('accessToken', token);
      }
      
      return {
        success: true,
        user: {
          ...user,
          isAdmin: ['admin', 'super_admin'].includes(user.role || 'user'),
          isSuperAdmin: (user.role || 'user') === 'super_admin'
        },
        token,
        message: 'Registration successful! Please check your email to verify your account.'
      };
    } catch (error) {
      return {
        success: false,
        error: api.normalizeError(error)
      };
    }
  },

  // ✅ Logout
  async logout() {
    try {
      // Call server logout endpoint
      await api.client.post('/users/logout');
    } catch (error) {
      // Continue with logout even if server call fails
      console.warn('Server logout failed:', error);
    } finally {
      // Clear local data
      localStorage.removeItem('accessToken');
      api.clearCache();
      
      // Google Sign-Out if available
      if (window.google?.accounts?.id) {
        window.google.accounts.id.disableAutoSelect();
      }
      
      return { success: true };
    }
  },

  // ✅ Get Current User Profile
  async getProfile() {
    try {
      const response = await api.cachedRequest('/users/profile', {
        method: 'GET'
      }, 'user-profile', 10 * 60 * 1000); // 10 minute cache
      
      // ✅ FIXED: Handle server response structure correctly
      const user = response.data?.data || response.data;
      
      // ✅ CLEANED: Use centralized user normalization
      const normalizedUser = normalizeUserData(user);

      return {
        success: true,
        user: normalizedUser
      };
    } catch (error) {
      return {
        success: false,
        error: api.normalizeError(error)
      };
    }
  },

  // ✅ Update Profile
  async updateProfile(updates) {
    try {
      const response = await api.client.put('/users/profile', updates);
      
      // Clear profile cache
      api.clearCache('user-profile');
      api.clearCache('users');
      
      // ✅ FIXED: Handle server response format correctly
      const userData = response.data?.data || response.data || response;
      
      console.log('🔍 updateProfile server response:', {
        fullResponse: response,
        extractedUserData: userData,
        hasOnboardingCompleted: userData?.onboarding_completed
      });
      
      return {
        success: true,
        user: userData  // ✅ FIXED: Extract user data correctly
      };
    } catch (error) {
      console.error('❌ updateProfile error:', error);
      return {
        success: false,
        error: api.normalizeError(error)
      };
    }
  },

  // ✅ Upload Avatar
  async uploadAvatar(formData) {
    try {
      const response = await api.client.post('/users/upload-profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Clear profile cache
      api.clearCache('user-profile');
      api.clearCache('users');
      
      // ✅ FIX: Return the server response directly, not double-wrapped
      return response.data;
    } catch (error) {
      console.error('❌ uploadAvatar error:', error);
      return {
        success: false,
        error: api.normalizeError(error)
      };
    }
  },

  // ✅ Password Reset Request
  async requestPasswordReset(email) {
    try {
      await api.client.post('/users/password-reset', { email });
      
      return {
        success: true,
        message: 'Password reset instructions sent to your email.'
      };
    } catch (error) {
      return {
        success: false,
        error: api.normalizeError(error)
      };
    }
  },

  // ✅ Password Reset Confirm
  async resetPassword({ token, password, passwordStrength }) {
    try {
      await api.client.post('/users/password-reset/confirm', { token, password });
      
      return {
        success: true,
        message: 'Password reset successful. You can now log in with your new password.'
      };
    } catch (error) {
      return {
        success: false,
        error: api.normalizeError(error)
      };
    }
  },

  // ✅ Email Verification
  async verifyEmail({ token }) {
    try {
      const response = await api.client.post('/users/verify-email', { token });
      
      return {
        success: true,
        message: 'Email verified successfully!',
        user: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: api.normalizeError(error)
      };
    }
  },

  // ✅ Resend Verification Email
  async resendVerificationEmail({ email }) {
    try {
      await api.client.post('/users/resend-verification', { email });
      
      return {
        success: true,
        message: 'Verification email sent!'
      };
    } catch (error) {
      return {
        success: false,
        error: api.normalizeError(error)
      };
    }
  },

  // ✅ Validate Token with AUTO-REFRESH
  async validateToken(token) {
    try {
      // First do a quick local validation
      const decoded = jwtDecode(token);
      const now = Date.now() / 1000;
      
      // ✅ FIX: Check if token will expire soon (within 2 minutes)
      const willExpireSoon = decoded.exp - now < 120; // 2 minutes
      
      if (decoded.exp < now) {
        // Token already expired - try to refresh
        console.log('🔄 Token expired, attempting refresh...');
        return await this.refreshToken();
      }
      
      if (willExpireSoon) {
        // Token expires soon - refresh proactively
        console.log('🔄 Token expires soon, refreshing proactively...');
        const refreshResult = await this.refreshToken();
        if (refreshResult.success) {
          return refreshResult;
        }
        // If refresh fails, continue with current token
      }
      
      // Then validate with server and get fresh user data
      const response = await api.client.get('/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        // ✅ FIXED: Handle server response structure correctly
        const user = response.data?.data || response.data;
        
        // ✅ CLEANED: Use centralized user normalization
        const normalizedUser = normalizeUserData(user);
        
        return {
          success: true,
          data: normalizedUser
        };
      }
      
      return { success: false, error: 'Invalid token' };
      
    } catch (error) {
      console.warn('Token validation failed:', error);
      
      // ✅ FIX: If 401, try refresh before giving up
      if (error.response?.status === 401) {
        console.log('🔄 Got 401, attempting token refresh...');
        return await this.refreshToken();
      }
      
      localStorage.removeItem('accessToken');
      return {
        success: false,
        error: 'Token validation failed'
      };
    }
  },

  // ✅ NEW: Automatic Token Refresh
  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        console.log('❌ No refresh token available');
        return { success: false, error: 'No refresh token', requiresLogin: true };
      }

      console.log('🔄 Refreshing access token...');
      const response = await api.client.post('/users/refresh-token', {
        refreshToken: refreshToken
      });

      if (response.data?.success && response.data?.data) {
        const { accessToken, refreshToken: newRefreshToken, user } = response.data.data;
        
        // Update stored tokens
        localStorage.setItem('accessToken', accessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }
        
        console.log('✅ Token refreshed successfully');
        return { 
          success: true, 
          data: user,
          token: accessToken,
          refreshed: true
        };
      }
      
      throw new Error('Invalid refresh response');
      
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      
      // Clear invalid tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      return { 
        success: false, 
        error: 'Token refresh failed',
        requiresLogin: true
      };
    }
  },

  // ✅ Check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem('accessToken');
    if (!token) return false;
    
    const validation = this.validateToken(token);
    return validation.valid;
  },

  // ✅ Get user role from token
  getUserRole() {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    
    const validation = this.validateToken(token);
    if (!validation.valid) return null;
    
    return validation.payload.role || 'user';
  },

  // ✅ Check if user has admin access
  isAdmin() {
    const role = this.getUserRole();
    return ['admin', 'super_admin'].includes(role);
  },

  // ✅ Check if user is super admin
  isSuperAdmin() {
    const role = this.getUserRole();
    return role === 'super_admin';
  },

  // ✅ Upload profile picture
  async uploadProfilePicture(formData) {
    try {
      const response = await api.client.post('/users/upload-profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: api.normalizeError(error)
      };
    }
  },

  // ✅ Change Password
  async changePassword(passwordData) {
    try {
      const response = await api.client.post('/users/change-password', passwordData);
      
      return {
        success: true,
        data: response.data,
        message: response.data?.message || 'Password changed successfully'
      };
    } catch (error) {
      console.error('❌ changePassword error:', error);
      return {
        success: false,
        error: api.normalizeError(error)
      };
    }
  },

  // ✅ Set Password (for OAuth users setting first password)
  async setPassword(passwordData) {
    try {
      const response = await api.client.post('/users/set-password', passwordData);
      
      return {
        success: true,
        data: response.data,
        message: response.data?.message || 'Password set successfully. You can now use both OAuth and email/password login.'
      };
    } catch (error) {
      console.error('❌ setPassword error:', error);
      return {
        success: false,
        error: api.normalizeError(error)
      };
    }
  }
};

// ✅ Export Google OAuth utilities
export { googleOAuth };

export default authAPI; 