/**
 * 🔐 AUTH API MODULE - Complete Authentication System
 * Features: Email/Password, Google One Tap, Role-based access, Enhanced security
 * @module api/auth
 * @version 2.0.0 - Google One Tap Integration
 */

import { api } from './client.js';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-hot-toast';
import { normalizeUserData } from '../utils/userNormalizer';
import { simpleGoogleAuth } from '../services/simpleGoogleAuth.js';

// Quiet noisy debug logs in production; keep minimal in dev
if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_MODE === 'true') {
  // silent
}

// ✅ Auth API Module
export const authAPI = {
  // ✅ Regular Email/Password Login
  async login(email, password) {
    try {
      const response = await api.client.post('/users/login', {
        email: email.trim().toLowerCase(),
        password
      });

      // ✅ Extract user and token data
      let user, token;

      const d = response?.data || {};
      const dd = d?.data || {};

      // Prefer server's unified shape: { success, data: { user, accessToken, tokens } }
      if (dd?.user && (dd?.accessToken || dd?.token || dd?.tokens?.accessToken)) {
        user = dd.user;
        token = dd.accessToken || dd.token || dd.tokens?.accessToken;
      } else if (d?.user && (d?.accessToken || d?.token)) {
        // Top-level fallback
        user = d.user;
        token = d.accessToken || d.token;
      } else if (dd && (dd.id || dd.email)) {
        // If data is already user-like
        user = dd;
        token = d.accessToken || d.token || dd.accessToken || dd.token || dd.tokens?.accessToken;
      }

      if (!user || !token) {
        throw new Error('Invalid response format from server');
      }

      // ✅ Normalize user data
      const normalizedUser = normalizeUserData(user);
      
      // Store tokens in both keys for compatibility
      localStorage.setItem('accessToken', token);
      localStorage.setItem('authToken', token);
      const rt = dd?.tokens?.refreshToken || dd?.refreshToken || d?.refreshToken || '';
      if (rt) localStorage.setItem('refreshToken', rt);

      return {
        success: true,
        user: normalizedUser,
        token,
        refreshToken: response.data.refreshToken
      };

    } catch (error) {
      console.error('Login error:', error);
      
      return {
        success: false,
        error: {
          message: error.response?.data?.message || error.message || 'Login failed',
          code: error.response?.data?.code || 'LOGIN_ERROR',
          status: error.response?.status || 0
        }
      };
    }
  },

  // ✅ Get Profile (shared by stores and hooks)
  async getProfile() {
    try {
      const response = await api.client.get('/users/profile');
      const payload = response?.data || {};
      const rawUser = payload?.data || payload?.user || payload; // server uses data: normalizedUser
      const normalizedUser = normalizeUserData(rawUser);
      return { success: true, user: normalizedUser, data: normalizedUser };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error.response?.data?.message || error.message || 'Failed to load profile',
          code: error.response?.data?.error?.code || 'PROFILE_ERROR',
          status: error.response?.status || 0
        }
      };
    }
  },

  // ✅ Update Profile
  async updateProfile(updates) {
    try {
      const response = await api.client.put('/users/profile', updates);
      const payload = response?.data || {};
      const rawUser = payload?.data || payload?.user || updates;
      const normalizedUser = normalizeUserData(rawUser);
      return { success: true, user: normalizedUser, data: normalizedUser };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error.response?.data?.message || error.message || 'Profile update failed',
          code: error.response?.data?.error?.code || 'PROFILE_UPDATE_ERROR',
          status: error.response?.status || 0
        }
      };
    }
  },

  // ✅ Validate Token (used by recovery manager)
  async validateToken() {
    try {
      const res = await this.getProfile();
      return { success: !!res.success };
    } catch {
      return { success: false };
    }
  },

  // ✅ Simple Google Login (processes credential from button)
  async processGoogleCredential(credential) {
    try {
      console.log('🔍 Processing Google credential...');

      if (!credential) {
        throw new Error('No Google credential provided');
      }

      // Parse the JWT credential
      const userInfo = simpleGoogleAuth.parseCredential(credential);
      console.log('🔍 Parsed Google user info:', userInfo);

      // Send to backend for processing
      const response = await api.client.post('/users/google-auth', {
        credential: credential,
        userInfo: userInfo
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Google authentication failed');
      }

      const userData = normalizeUserData(response.data.user);
      console.log('✅ Google authentication successful:', userData);

      return {
        success: true,
        user: userData,
        token: response.data.token,
        refreshToken: response.data.refreshToken
      };

    } catch (error) {
      console.error('❌ Google credential processing error:', error);
      
      return {
        success: false,
        error: {
          message: error.message || 'Google authentication failed',
          code: 'GOOGLE_AUTH_ERROR',
          status: error.response?.status || 0
        }
      };
    }
  },

  // Removed deprecated googleButtonLogin – use SimpleGoogleButton component

  // ✅ Process Google credential (shared logic)
  async processGoogleCredential(credential) {
    // ✅ Validate credential
    if (!credential || typeof credential !== 'string') {
      throw new Error('Invalid Google credential received');
    }

    // ✅ Check JWT format
    const parts = credential.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format - expected JWT ID token');
    }

    // ✅ Extract user info
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

    if (!userInfo.email) {
      throw new Error('No email found in Google credential');
    }

    // ✅ Send to backend
    const payload = {
      idToken: credential,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture
    };

    const response = await api.client.post('/users/auth/google', payload);

    // ✅ Extract response data (server returns data.user and data.accessToken)
    let user, token;
    const d = response?.data || {};
    if (d?.data?.user && (d?.data?.accessToken || d?.data?.token)) {
      user = d.data.user;
      token = d.data.accessToken || d.data.token;
    } else if (d?.user && (d?.accessToken || d?.token)) {
      user = d.user;
      token = d.accessToken || d.token;
    }

    if (!user || !token) {
      console.error('❌ Server response debug:', {
        fullResponse: response,
        responseData: response.data,
        userFound: !!user,
        tokenFound: !!token,
        responseStatus: response?.status,
        responseHeaders: response?.headers
      });
      throw new Error('Invalid response format from server');
    }

    // ✅ Normalize and store
    const normalizedUser = normalizeUserData(user);
    
    localStorage.setItem('accessToken', token);
    localStorage.setItem('authToken', token);
    const rt = response.data.data?.tokens?.refreshToken || response.data.refreshToken || '';
    if (rt) localStorage.setItem('refreshToken', rt);

    return {
      success: true,
      user: normalizedUser,
      token,
      refreshToken: response.data.refreshToken
    };
  },

  // ✅ Register
  async register(userData) {
    try {
      const response = await api.client.post('/users/register', {
        firstName: userData.firstName?.trim(),
        lastName: userData.lastName?.trim(),
        email: userData.email?.trim().toLowerCase(),
        password: userData.password,
        acceptedTerms: userData.acceptedTerms
      });

      // ✅ Handle registration response
      let user, message;
      
      if (response.data?.data?.user) {
        user = response.data.data.user;
        message = response.data.message || 'Registration successful';
      } else if (response.data?.user) {
        user = response.data.user;
        message = response.data.message || 'Registration successful';
      } else {
        message = response.data?.message || 'Registration successful';
      }

      return {
        success: true,
        user: user ? normalizeUserData(user) : null,
        message,
        requiresVerification: !user?.email_verified
      };

    } catch (error) {
      console.error('Registration error:', error);
      
      return {
        success: false,
        error: {
          message: error.response?.data?.message || error.message || 'Registration failed',
          code: error.response?.data?.code || 'REGISTRATION_ERROR',
          status: error.response?.status || 0
        }
      };
    }
  },

  // ✅ Logout
  async logout() {
    try {
      // Sign out from Google (if available)
      if (window.google?.accounts?.id) {
        window.google.accounts.id.disableAutoSelect();
      }
      
      // Clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // Optional: Call backend logout endpoint
      try {
        await api.client.post('/users/logout');
      } catch (e) {
        // Ignore logout errors
        console.warn('Backend logout failed (ignored):', e.message);
      }

      return { success: true };

    } catch (error) {
      console.error('Logout error:', error);
      
      // Still clear local storage even if API call fails
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      return { success: true }; // Always succeed for logout
    }
  },

  // ✅ Token Refresh
  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        return { success: false, requiresLogin: true, error: { code: 'NO_REFRESH_TOKEN', message: 'No refresh token available' } };
      }

      const response = await api.client.post('/users/refresh-token', { refreshToken });

      // Accept server format: { success, data: { accessToken, refreshToken } }
      const d = response?.data || {};
      const newToken = d?.data?.accessToken || d?.accessToken || d?.token;
      const newRefreshToken = d?.data?.refreshToken || d?.refreshToken;

      if (newToken) {
        localStorage.setItem('accessToken', newToken);
        localStorage.setItem('authToken', newToken);
      }
      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken);
      }

      return { success: true, token: newToken, refreshToken: newRefreshToken };

    } catch (error) {
      // Clear invalid tokens on 401
      if (error?.response?.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        return { success: false, requiresLogin: true, error: { code: 'TOKEN_REFRESH_ERROR', message: 'Token refresh failed' } };
      }
      return { success: false, error: { code: 'TOKEN_REFRESH_ERROR', message: error.response?.data?.message || 'Token refresh failed' } };
    }
  },

  // ✅ Verify Email
  async verifyEmail(token) {
    try {
      const response = await api.client.post('/users/verify-email', { token });
      
      return {
        success: true,
        message: response.data?.message || 'Email verified successfully'
      };

    } catch (error) {
      console.error('Email verification error:', error);
      
      return {
        success: false,
        error: {
          message: error.response?.data?.message || 'Email verification failed',
          code: error.response?.data?.code || 'EMAIL_VERIFICATION_ERROR'
        }
      };
    }
  },

  // ✅ Resend Verification
  async resendVerification(email) {
    try {
      const response = await api.client.post('/users/resend-verification', {
        email: email.trim().toLowerCase()
      });
      
      return {
        success: true,
        message: response.data?.message || 'Verification email sent'
      };

    } catch (error) {
      console.error('Resend verification error:', error);
      
      return {
        success: false,
        error: {
          message: error.response?.data?.message || 'Failed to resend verification',
          code: error.response?.data?.code || 'RESEND_VERIFICATION_ERROR'
        }
      };
    }
  },

  // ✅ Password Reset Request
  async requestPasswordReset(email) {
    try {
      const response = await api.client.post('/users/password-reset-request', {
        email: email.trim().toLowerCase()
      });
      
      return {
        success: true,
        message: response.data?.message || 'Password reset email sent'
      };

    } catch (error) {
      console.error('Password reset request error:', error);
      
      return {
        success: false,
        error: {
          message: error.response?.data?.message || 'Password reset request failed',
          code: error.response?.data?.code || 'PASSWORD_RESET_REQUEST_ERROR'
        }
      };
    }
  },

  // ✅ Password Reset
  async resetPassword(token, newPassword) {
    try {
      const response = await api.client.post('/users/password-reset', {
        token,
        newPassword
      });
      
      return {
        success: true,
        message: response.data?.message || 'Password reset successful'
      };

    } catch (error) {
      console.error('Password reset error:', error);
      
      return {
        success: false,
        error: {
          message: error.response?.data?.message || 'Password reset failed',
          code: error.response?.data?.code || 'PASSWORD_RESET_ERROR'
        }
      };
    }
  }
};

// ✅ Export Simple Google Auth service for UI components
export { simpleGoogleAuth };