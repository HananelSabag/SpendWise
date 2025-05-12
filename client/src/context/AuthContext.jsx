// src/context/AuthContext.jsx - Enhanced with better token handling and error management
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { authAPI } from '../utils/api';
import { toast } from 'react-toastify';

// Create the auth context
const AuthContext = createContext(null);

/**
 * Custom hook to access the auth context
 * @returns {Object} Auth context values and methods
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Auth Provider component to manage authentication state
 * Handles token management, user data, and authentication operations
 */
export const AuthProvider = ({ children }) => {
  // Core states
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState(null);
  
  // Refs
  const fetchingUserRef = useRef(false);
  const tokenRefreshTimeoutRef = useRef(null);
  
  // Router
  const navigate = useNavigate();

  /**
   * Parse JWT token to get expiration time and payload
   * @param {string} token - JWT token
   * @returns {Object|null} Decoded token payload or null if invalid
   */
  const parseToken = useCallback((token) => {
    if (!token) return null;
    
    try {
      // Get payload part of JWT
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Error parsing token:', e);
      return null;
    }
  }, []);

  /**
   * Schedule token refresh before it expires
   * @param {string} token - JWT token
   */
  const scheduleTokenRefresh = useCallback((token) => {
    if (tokenRefreshTimeoutRef.current) {
      clearTimeout(tokenRefreshTimeoutRef.current);
    }
    
    const payload = parseToken(token);
    if (!payload || !payload.exp) return;
    
    // Get expiration time in milliseconds
    const expirationTime = payload.exp * 1000;
    
    // Schedule refresh 5 minutes before expiration or halfway through lifetime for short tokens
    const tokenLifetime = expirationTime - Date.now();
    const refreshTime = Math.min(
      tokenLifetime - (5 * 60 * 1000), // 5 minutes before expiry
      tokenLifetime / 2 // or halfway through lifetime, whichever is sooner
    );
    
    if (refreshTime <= 0) {
      // Token already expired or close to expiration, refresh now
      refreshToken();
      return;
    }
    
    console.log(`Token refresh scheduled in ${Math.round(refreshTime / 60000)} minutes`);
    tokenRefreshTimeoutRef.current = setTimeout(refreshToken, refreshTime);
  }, [parseToken]);

  /**
   * Refresh the auth token
   */
  const refreshToken = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await authAPI.refreshToken(token);
      if (response.data?.token) {
        localStorage.setItem('token', response.data.token);
        scheduleTokenRefresh(response.data.token);
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, clear token and user state
      handleLogout(true);
    }
  }, [scheduleTokenRefresh]);

  /**
   * Fetch user profile data
   * @returns {Object|null} User data or null on failure
   */
  const fetchUserProfile = useCallback(async () => {
    if (!localStorage.getItem('token') || fetchingUserRef.current) return null;
    
    fetchingUserRef.current = true;
    setLoading(true);
    
    try {
      const response = await authAPI.getProfile();
      setUser(response.data);
      setError(null);
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load user profile');
      setUser(null);
      
      // Clear token if we get a 401 Unauthorized
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
      }
      
      return null;
    } finally {
      fetchingUserRef.current = false;
      setLoading(false);
      setInitialized(true);
    }
  }, []);

  /**
   * Initialize user from local storage and set up token refresh
   */
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        // Check if token is expired before attempting to use it
        const payload = parseToken(token);
        if (payload && payload.exp && payload.exp * 1000 > Date.now()) {
          // Token is still valid, set up refresh
          scheduleTokenRefresh(token);
          
          // Try to fetch user data
          await fetchUserProfile();
        } else {
          // Token is expired, remove it
          localStorage.removeItem('token');
          setInitialized(true);
          setLoading(false);
        }
      } else {
        setInitialized(true);
        setLoading(false);
      }
    };
    
    if (!initialized) {
      initAuth();
    }
    
    // Clean up token refresh timeout on unmount
    return () => {
      if (tokenRefreshTimeoutRef.current) {
        clearTimeout(tokenRefreshTimeoutRef.current);
      }
    };
  }, [initialized, fetchUserProfile, scheduleTokenRefresh, parseToken]);

  /**
   * Handle user login
   * @param {Object} credentials - User credentials (email, password)
   * @returns {Object} Result of login attempt
   */
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authAPI.login(credentials);
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      scheduleTokenRefresh(token);
      setUser(userData);
      
      return { success: true, user: userData };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      
      // Show toast notification for login failure
      toast.error(errorMessage);
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Object} Result of registration attempt
   */
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authAPI.register(userData);
      
      // Show success toast
      toast.success('Registration successful! Please log in.');
      
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      
      // Show toast notification for registration failure
      toast.error(errorMessage);
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update
   * @returns {Object} Updated user data
   */
  const updateProfile = async (profileData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.put('/users/profile', profileData);
      
      // Update local user state with new data
      setUser(prev => ({
        ...prev,
        ...response.data
      }));
      
      toast.success('Profile updated successfully');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      setError(errorMessage);
      toast.error(errorMessage);
      
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles logout with proper token management and API notification
   * @param {boolean} silent - Whether to skip API call (used for token expiry)
   */
  const handleLogout = useCallback(async (silent = false) => {
    try {
      // Clear token refresh timeout
      if (tokenRefreshTimeoutRef.current) {
        clearTimeout(tokenRefreshTimeoutRef.current);
        tokenRefreshTimeoutRef.current = null;
      }
      
      // Get token before we clear it
      const token = localStorage.getItem('token');
      
      // Only try to call API if we have a token and not in silent mode
      if (token && !silent) {
        try {
          // Try to call logout API before clearing token
          await authAPI.logout();
        } catch (err) {
          // Just log error but continue with client-side logout
          console.error('Logout API notification failed:', err);
        }
      }
      
      // Clear auth data
      localStorage.removeItem('token');
      setUser(null);
      
      // Navigate to login
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      
      // Force client-side logout even if there was an error
      localStorage.removeItem('token');
      setUser(null);
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  // Handle session expiration
  useEffect(() => {
    // Listen for auth errors from API interceptor events
    const handleAuthError = () => {
      // If we get an auth error and have a user, log them out silently
      if (user) {
        handleLogout(true);
      }
    };
    
    // Add the event listener
    window.addEventListener('auth_error', handleAuthError);
    
    // Clean up
    return () => {
      window.removeEventListener('auth_error', handleAuthError);
    };
  }, [user, handleLogout]);

  // Context value
  const contextValue = {
    user,
    login,
    logout: handleLogout,
    register,
    loading,
    error,
    initialized,
    updateProfile,
    refreshToken,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;