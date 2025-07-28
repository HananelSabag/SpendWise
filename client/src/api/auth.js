/**
 * 🔐 AUTH API MODULE - Complete Authentication System
 * Features: Email/Password, Google OAuth, Role-based access, Enhanced security
 * @module api/auth
 */

import { api } from './client.js';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-hot-toast';

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
  }

  // Initialize Google Identity Services
  async initialize() {
    if (this.isInitialized || this.isLoading) return;
    
    this.isLoading = true;
    
    try {
      // Load Google Identity Services script
      await this.loadGoogleScript();
      
      // Initialize Google OAuth
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CONFIG.CLIENT_ID,
          callback: this.handleCredentialResponse.bind(this),
          auto_select: false,
          cancel_on_tap_outside: true
        });
        
        this.isInitialized = true;
      } else {
        throw new Error('Google Identity Services failed to load');
      }
    } catch (error) {
      console.error('Failed to initialize Google OAuth:', error);
      throw new Error('Google Sign-In is currently unavailable');
    } finally {
      this.isLoading = false;
    }
  }

  // Load Google Script dynamically
  loadGoogleScript() {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }

      // Check if script already exists
      const existingScript = document.querySelector(`script[src="${GOOGLE_CONFIG.SCRIPT_URL}"]`);
      if (existingScript) {
        existingScript.addEventListener('load', resolve);
        existingScript.addEventListener('error', reject);
        return;
      }

      // Create and load script
      const script = document.createElement('script');
      script.src = GOOGLE_CONFIG.SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Failed to load Google OAuth script'));
      
      document.head.appendChild(script);
    });
  }

  // Handle Google credential response
  handleCredentialResponse(response) {
    if (this.credentialResolver) {
      this.credentialResolver(response.credential);
      this.credentialResolver = null;
    }
  }

  // Trigger Google Sign-In
  async signIn() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      try {
        // Store resolver for callback
        this.credentialResolver = resolve;
        
        // ✅ Only use ID token method - no access token fallback
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed()) {
            reject(new Error('Google Sign-In popup was blocked or dismissed'));
          } else if (notification.isSkippedMoment()) {
            reject(new Error('Google Sign-In was skipped - please try again'));
          }
          // If successful, handleCredentialResponse will be called
        });
        
        // Timeout after 30 seconds
        setTimeout(() => {
          if (this.credentialResolver) {
            this.credentialResolver = null;
            reject(new Error('Google Sign-In timed out - please try again'));
          }
        }, 30000);
        
      } catch (error) {
        reject(error);
      }
    });
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
      
      // Normalize user object to match expected structure
      const normalizedUser = {
        id: user.id,
        email: user.email,
        username: user.username || user.name || user.display_name || user.first_name || 'User',
        firstName: user.first_name || user.firstName || user.username || '',
        lastName: user.last_name || user.lastName || '',
        role: user.role || 'user',
        email_verified: user.email_verified || user.emailVerified || false,
        language_preference: user.language_preference || user.languagePreference || 'en',
        theme_preference: user.theme_preference || user.themePreference || 'light',
        currency_preference: user.currency_preference || user.currencyPreference || 'USD',
        onboarding_completed: user.onboarding_completed || user.onboardingCompleted || false,
        preferences: user.preferences || {},
        created_at: user.created_at || user.createdAt || new Date().toISOString(),
        createdAt: user.created_at || user.createdAt || new Date().toISOString(),
        updated_at: user.updated_at || user.updatedAt || new Date().toISOString(),
        last_login: user.last_login || user.lastLogin || new Date().toISOString(),
        avatar: user.avatar || null,
        phone: user.phone || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        birthday: user.birthday || null,
        isPremium: user.isPremium || false
      };
      
      // Store token if provided
      if (token) {
        localStorage.setItem('accessToken', token);
      }
      
      // Clear any auth-related cache
      api.clearCache('users');
      api.clearCache('auth');
      
      return {
        success: true,
        user: normalizedUser,
        token
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
          errorMessage = 'Invalid email or password';
          errorCode = 'INVALID_CREDENTIALS';
        } else if (status === 403) {
          errorMessage = 'Account is locked or suspended';
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
      console.log('🔍 DEBUG: Starting Google OAuth flow...');
      console.log('🔍 DEBUG: Google Client ID:', GOOGLE_CONFIG.CLIENT_ID);
      
      // Initialize Google OAuth if needed
      if (!googleOAuth.isInitialized) {
        await googleOAuth.initialize();
      }
      
      // Get Google credential
      const credential = await googleOAuth.signIn();
      console.log('🔍 DEBUG: Raw Google credential:', credential);
      console.log('🔍 DEBUG: Credential type:', typeof credential);
      console.log('🔍 DEBUG: Credential length:', credential?.length);
      
      // ✅ Validate that we received a proper JWT token
      if (!credential || typeof credential !== 'string') {
        throw new Error('Invalid Google credential received');
      }
      
      // ✅ Check if it's a JWT (has 3 parts separated by dots)
      const parts = credential.split('.');
      if (parts.length !== 3) {
        console.error('🔍 DEBUG: Not a JWT token - has', parts.length, 'parts instead of 3');
        console.error('🔍 DEBUG: Token preview:', credential.substring(0, 50) + '...');
        throw new Error('Invalid token format - expected JWT ID token');
      }
      
      // ✅ Extract user info from JWT credential
      let userInfo = { email: '', name: '', picture: '' };
      
      try {
        console.log('🔍 DEBUG: Attempting to decode JWT...');
        const decoded = jwtDecode(credential);
        console.log('🔍 DEBUG: Decoded JWT payload:', decoded);
        userInfo = {
          email: decoded.email || '',
          name: decoded.name || '',
          picture: decoded.picture || ''
        };
        console.log('🔍 DEBUG: Extracted user info:', userInfo);
      } catch (decodeError) {
        console.error('🔍 DEBUG: Failed to decode credential:', decodeError);
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
      
      console.log('🔍 DEBUG: Payload being sent to server:', payload);
      
      // Send credential to our backend with extracted user info
      const response = await api.client.post('/users/auth/google', payload);

      // ✅ FIX: Properly extract user and token from server response
      console.log('🔍 DEBUG: Server response:', response.data);
      
      let user, token;
      if (response.data.success && response.data.data) {
        user = response.data.data.user;
        token = response.data.data.accessToken || response.data.data.token;
      } else {
        throw new Error('Invalid server response structure');
      }
      
      // ✅ Add safety check for user object
      if (!user) {
        throw new Error('No user data in server response');
      }
      
      console.log('🔍 DEBUG: Extracted user:', user);
      console.log('🔍 DEBUG: Extracted token:', token);
      
      // Store token
      localStorage.setItem('accessToken', token);
      
      // Clear auth cache
      api.clearCache('users');
      api.clearCache('auth');
      
      return {
        success: true,
        user: {
          ...user,
          isAdmin: ['admin', 'super_admin'].includes(user.role || 'user'),
          isSuperAdmin: (user.role || 'user') === 'super_admin',
          loginMethod: 'google'
        },
        token
      };
    } catch (error) {
      console.error('🔍 DEBUG: Google OAuth error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
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
      
      const user = response.data;
      
      // Normalize user object for consistency
      const normalizedUser = {
        id: user.id,
        email: user.email,
        username: user.username || user.name || user.display_name || user.first_name || 'User',
        firstName: user.first_name || user.firstName || user.username || '',
        lastName: user.last_name || user.lastName || '',
        role: user.role || 'user',
        email_verified: user.email_verified || user.emailVerified || false,
        language_preference: user.language_preference || user.languagePreference || 'en',
        theme_preference: user.theme_preference || user.themePreference || 'light',
        currency_preference: user.currency_preference || user.currencyPreference || 'USD',
        onboarding_completed: user.onboarding_completed || user.onboardingCompleted || false,
        preferences: user.preferences || {},
        created_at: user.created_at || user.createdAt || new Date().toISOString(),
        createdAt: user.created_at || user.createdAt || new Date().toISOString(),
        updated_at: user.updated_at || user.updatedAt || new Date().toISOString(),
        last_login: user.last_login || user.lastLogin || new Date().toISOString(),
        avatar: user.avatar || null,
        phone: user.phone || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        birthday: user.birthday || null,
        isPremium: user.isPremium || false,
        isAdmin: ['admin', 'super_admin'].includes(user.role || 'user'),
        isSuperAdmin: (user.role || 'user') === 'super_admin'
      };

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
      
      return {
        success: true,
        user: response.data
      };
    } catch (error) {
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

  // ✅ Validate Token
  async validateToken(token) {
    try {
      // First do a quick local validation
      const decoded = jwtDecode(token);
      const now = Date.now() / 1000;
      
      if (decoded.exp < now) {
        localStorage.removeItem('accessToken');
        return { success: false, error: 'Token expired' };
      }
      
      // Then validate with server and get fresh user data
      const response = await api.client.get('/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        const user = response.data;
        
        // Normalize user object
        const normalizedUser = {
          id: user.id,
          email: user.email,
          username: user.username || user.name || user.display_name || user.first_name || 'User',
          firstName: user.first_name || user.firstName || user.username || '',
          lastName: user.last_name || user.lastName || '',
          role: user.role || 'user',
          email_verified: user.email_verified || user.emailVerified || false,
          language_preference: user.language_preference || user.languagePreference || 'en',
          theme_preference: user.theme_preference || user.themePreference || 'light',
          currency_preference: user.currency_preference || user.currencyPreference || 'USD',
          onboarding_completed: user.onboarding_completed || user.onboardingCompleted || false,
          preferences: user.preferences || {},
          created_at: user.created_at || user.createdAt || new Date().toISOString(),
          createdAt: user.created_at || user.createdAt || new Date().toISOString(),
          updated_at: user.updated_at || user.updatedAt || new Date().toISOString(),
          last_login: user.last_login || user.lastLogin || new Date().toISOString(),
          avatar: user.avatar || null,
          phone: user.phone || '',
          bio: user.bio || '',
          location: user.location || '',
          website: user.website || '',
          birthday: user.birthday || null,
          isPremium: user.isPremium || false
        };
        
        return {
          success: true,
          data: normalizedUser
        };
      }
      
      return { success: false, error: 'Invalid token' };
      
    } catch (error) {
      console.warn('Token validation failed:', error);
      localStorage.removeItem('accessToken');
      return {
        success: false,
        error: 'Token validation failed'
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
  }
};

// ✅ Export Google OAuth utilities
export { googleOAuth };

export default authAPI; 