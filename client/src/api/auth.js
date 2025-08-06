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

// ✅ Google OAuth Manager
class GoogleOAuthManager {
  constructor() {
    this.isInitialized = false;
    this.isLoading = false;
    this.credentialResolver = null;
  }

  // Initialize Google Identity Services
  async initialize() {
    if (this.isInitialized || this.isLoading) return;
    
    this.isLoading = true;
    
    try {
      // 🔍 PRODUCTION DEBUG: Enhanced Google OAuth debugging
      console.log('🔍 Google OAuth Environment Debug:', {
        clientId: GOOGLE_CONFIG.CLIENT_ID ? 'SET' : 'MISSING',
        clientIdValue: GOOGLE_CONFIG.CLIENT_ID?.substring(0, 20) + '...',
        rawEnvValue: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        environment: import.meta.env.MODE,
        isDev: import.meta.env.DEV,
        isProd: import.meta.env.PROD,
        domain: window.location.hostname,
        protocol: window.location.protocol,
        allEnvVars: Object.keys(import.meta.env).filter(key => key.includes('GOOGLE')),
        allViteEnvVars: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'))
      });
      
      // Check if Client ID is configured
      if (!GOOGLE_CONFIG.CLIENT_ID || GOOGLE_CONFIG.CLIENT_ID === 'undefined') {
        console.error('❌ Google Client ID not configured');
        throw new Error('Google Client ID not configured. Please set VITE_GOOGLE_CLIENT_ID environment variable.');
      }
      
      console.log('✅ Google Client ID configured, proceeding with initialization');
      
      // Load Google Identity Services script
      console.log('🔍 Loading Google script...');
      await this.loadGoogleScript();
      console.log('✅ Google script loaded');
      
      // Initialize Google OAuth
      if (window.google?.accounts?.id) {
        console.log('✅ Google Identity Services available');
        
        const initConfig = {
          client_id: GOOGLE_CONFIG.CLIENT_ID,
          callback: this.handleCredentialResponse.bind(this),
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: true, // Enable FedCM for compliance with Google's new requirements
          itp_support: true
        };
        
        console.log('🔍 Google OAuth init config:', {
          ...initConfig,
          client_id: initConfig.client_id?.substring(0, 20) + '...' // Hide full client ID
        });
        
        window.google.accounts.id.initialize(initConfig);
        
        this.isInitialized = true;
        console.log('✅ Google OAuth initialized successfully');
      } else {
        console.error('❌ Google Identity Services not available after script load');
        console.error('Window.google:', window.google);
        throw new Error('Google Identity Services failed to load');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Google OAuth:', error);
      throw new Error(`Google Sign-In is currently unavailable: ${error.message}`);
    } finally {
      this.isLoading = false;
    }
  }

  // Load Google Script dynamically
  loadGoogleScript() {
    return new Promise((resolve, reject) => {
      console.log('🔍 Loading Google script from:', GOOGLE_CONFIG.SCRIPT_URL);
      
      // Check if already loaded
      if (window.google?.accounts?.id) {
        console.log('✅ Google script already loaded');
        resolve();
        return;
      }

      // Check if script already exists
      const existingScript = document.querySelector(`script[src="${GOOGLE_CONFIG.SCRIPT_URL}"]`);
      if (existingScript) {
        console.log('🔍 Google script exists but not loaded yet, waiting...');
        existingScript.addEventListener('load', () => {
          console.log('✅ Existing Google script loaded');
          resolve();
        });
        existingScript.addEventListener('error', (error) => {
          console.error('❌ Existing Google script failed to load:', error);
          reject(error);
        });
        return;
      }

      // Create and load script
      console.log('🔍 Creating new Google script element');
      const script = document.createElement('script');
      script.src = GOOGLE_CONFIG.SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('✅ New Google script loaded successfully');
        // Wait a bit for Google to initialize
        setTimeout(() => {
          if (window.google?.accounts?.id) {
            console.log('✅ Google Identity Services ready');
            resolve();
          } else {
            console.error('❌ Google Identity Services not available after script load');
            reject(new Error('Google Identity Services not available after script load'));
          }
        }, 100);
      };
      script.onerror = (error) => {
        console.error('❌ Failed to load Google OAuth script:', error);
        reject(new Error('Failed to load Google OAuth script'));
      };
      
      document.head.appendChild(script);
      console.log('🔍 Google script appended to head');
    });
  }

  // Handle Google credential response
  handleCredentialResponse(response) {
    console.log('🔍 Google credential response received:', response);
    
    if (this.credentialResolver) {
      if (response && response.credential) {
        console.log('✅ Valid Google credential received');
        this.credentialResolver(response.credential);
      } else {
        console.error('❌ Invalid Google credential response:', response);
        this.credentialResolver(null);
      }
      this.credentialResolver = null;
    } else {
      console.warn('⚠️ Google credential response received but no resolver available');
    }
  }

  // Trigger Google Sign-In
  async signIn() {
    try {
      console.log('🔍 Google Sign-In requested');
      
      if (!this.isInitialized) {
        console.log('🔍 Google OAuth not initialized, initializing now...');
        await this.initialize();
      }

      console.log('🔍 Google OAuth initialization status:', {
        isInitialized: this.isInitialized,
        windowGoogle: !!window.google,
        accountsId: !!window.google?.accounts?.id,
        prompt: !!window.google?.accounts?.id?.prompt
      });

      return new Promise((resolve, reject) => {
        try {
          console.log('🔍 Starting Google Sign-In process...');
          
          // Store resolver for callback
          this.credentialResolver = resolve;
          
          // ✅ Use prompt method with better error handling
          window.google.accounts.id.prompt((notification) => {
            console.log('🔍 Google Sign-In notification:', {
              type: notification.getMomentType(),
              reason: notification.getNotDisplayedReason(),
              skippedReason: notification.getSkippedReason(),
              dismissedReason: notification.getDismissedReason()
            });
            
            if (notification.isNotDisplayed()) {
              console.error('❌ Google Sign-In popup was blocked or dismissed:', notification.getNotDisplayedReason());
              this.credentialResolver = null;
              reject(new Error(`Google Sign-In popup was blocked: ${notification.getNotDisplayedReason()}`));
            } else if (notification.isSkippedMoment()) {
              console.error('❌ Google Sign-In was skipped:', notification.getSkippedReason());
              this.credentialResolver = null;
              reject(new Error(`Google Sign-In was skipped: ${notification.getSkippedReason()}`));
            } else if (notification.isDismissedMoment()) {
              console.error('❌ Google Sign-In was dismissed:', notification.getDismissedReason());
              this.credentialResolver = null;
              reject(new Error(`Google Sign-In was dismissed: ${notification.getDismissedReason()}`));
            }
            // If successful, handleCredentialResponse will be called
          });
        
        // Timeout after 60 seconds
        setTimeout(() => {
          if (this.credentialResolver) {
            console.error('❌ Google Sign-In timed out after 60 seconds');
            this.credentialResolver = null;
            reject(new Error('Google Sign-In timed out. Please check your internet connection and try again.'));
          }
        }, 60000);
        
      } catch (error) {
        console.error('❌ Google Sign-In error:', error);
        this.credentialResolver = null;
        reject(new Error(`Google Sign-In failed: ${error.message}`));
      }
    });
    } catch (error) {
      console.error('❌ Google Sign-In outer error:', error);
      throw new Error(`Google Sign-In initialization failed: ${error.message}`);
    }
  }

  // ✅ Simplified popup method - no longer needed but keeping for compatibility
  async showPopup() {
    throw new Error('Please try Google Sign-In again - popup method disabled');
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
      const credential = await googleOAuth.signIn();
      
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
  async resetPassword(token, newPassword) {
    try {
      await api.client.post('/users/password-reset/confirm', {
        token,
        password: newPassword
      });
      
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
  async verifyEmail(token) {
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
  async resendVerification(email) {
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