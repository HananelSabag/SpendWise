// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auth, tokenManager } from '../utils/auth';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';
import api from '../utils/api'; // NEW: Import for direct API calls

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [initialized, setInitialized] = useState(false);
  
  // ✅ לוג רק פעם אחת בלבד
  useEffect(() => {
    if (!window._authProviderInitialized) {
      console.log(`🔐 [AUTH-PROVIDER] Provider initialized, isAuthenticated: ${auth.isAuthenticated()}`);
      window._authProviderInitialized = true;
    }
  }, []);
  
  // User profile query - Enhanced with better data handling
  const { 
    data: user, 
    isLoading: loading, 
    error,
    refetch: refetchProfile 
  } = useQuery({
    queryKey: ['profile'],
    queryFn: () => {
      console.log(`🌐 [AUTH-API] Profile request starting`);
      const startTime = Date.now();
      
      return authAPI.getProfile().then(res => {
        const endTime = Date.now();
        console.log(`✅ [AUTH-API] Profile completed in ${endTime - startTime}ms`);
        
        // Ensure profile picture URL is properly formatted
        const userData = res.data.data;
        if (userData.preferences?.profilePicture && !userData.preferences.profilePicture.startsWith('http')) {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
          userData.preferences.profilePicture = `${apiUrl}${userData.preferences.profilePicture}`;
        }
        
        return userData;
      }).catch(error => {
        const endTime = Date.now();
        console.error(`❌ [AUTH-API] Profile failed after ${endTime - startTime}ms:`, error);
        throw error;
      });
    },
    enabled: !!auth.isAuthenticated(),
    retry: 1,
    staleTime: 5 * 60 * 1000, // Reduced to 5 minutes for faster image updates
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    onError: (error) => {
      if (error.response?.status === 401) {
        console.log(`🔓 [AUTH-ERROR] 401 error - clearing tokens`);
        tokenManager.clearTokens();
      }
    }
  });
  
  // Login mutation - UPDATED: Now handles email verification errors
  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      console.log(`🔑 [LOGIN] 🔥 ATTEMPTING LOGIN 🔥 for user:`, credentials.email);
      const startTime = Date.now();
      
      try {
        const response = await api.post('/users/login', credentials);
        const endTime = Date.now();
        console.log(`✅ [LOGIN] Login completed in ${endTime - startTime}ms`);
        
        // Handle successful login
        if (response.data.data?.accessToken) {
          tokenManager.setTokens(response.data.data.accessToken, response.data.data.refreshToken);
          return { success: true, user: response.data.data.user };
        }
        
        return { success: false, error: 'No token received' };
      } catch (error) {
        const endTime = Date.now();
        console.error(`❌ [LOGIN] Login failed after ${endTime - startTime}ms:`, error);
        
        // NEW: Check for email verification error
        if (error.response?.data?.error?.code === 'EMAIL_NOT_VERIFIED') {
          console.log(`📧 [LOGIN] Email verification required for:`, credentials.email);
          // Let the component handle this specific error
          throw error;
        }
        
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log(`🎉 [LOGIN-SUCCESS] Login successful, invalidating profile query`);
      if (data.success) {
        queryClient.invalidateQueries(['profile']);
        
        // ✅ FIX: Dispatch auth state change event
        window.dispatchEvent(new Event('authStateChanged'));
        
        // Check if user needs onboarding
        if (data.user?.needsOnboarding) {
          console.log(`🚀 [LOGIN-SUCCESS] User needs onboarding, navigating to /onboarding`);
          navigate('/onboarding');
        } else {
          console.log(`🏠 [LOGIN-SUCCESS] User authenticated, navigating to /`);
          navigate('/');
        }
        
        toast.success('Welcome back!');
      }
    },
    onError: (error) => {
      console.error(`❌ [LOGIN-ERROR] Login mutation error:`, error);
      // NEW: Don't show toast here for email verification - let the component handle it
      if (error.response?.data?.error?.code !== 'EMAIL_NOT_VERIFIED') {
        toast.error(error.message || 'Login failed');
      }
    }
  });
  
  // Register mutation - UPDATED: Now handles email verification flow like password reset
  const registerMutation = useMutation({
    mutationFn: async (userData) => {
      console.log(`📝 [REGISTER] Attempting registration for:`, userData.email);
      
      try {
        const response = await authAPI.register(userData);
        console.log(`✅ [REGISTER] Registration response:`, response.data);
        
        return response.data; // Return the full response for email verification handling
      } catch (error) {
        console.error(`❌ [REGISTER] Registration failed:`, error);
        
        // Handle existing unverified user case
        if (error.response?.data?.error?.code === 'EMAIL_NOT_VERIFIED') {
          console.log(`📧 [REGISTER] Email already exists but unverified:`, userData.email);
          // Return special response for existing unverified user
          return {
            requiresVerification: true,
            email: userData.email,
            isExistingUser: true,
            message: error.response.data.error.message
          };
        }
        
        throw error;
      }
    },
    // Don't handle success/error here - let components handle the email verification flow
    onSuccess: (data) => {
      console.log(`📧 [REGISTER-SUCCESS] Registration completed:`, data);
    },
    onError: (error) => {
      console.error(`❌ [REGISTER-ERROR] Registration mutation error:`, error);
    }
  });
  
  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => auth.logout(),
    onSuccess: () => {
      queryClient.clear();
      
      // ✅ FIX: Dispatch auth state change event
      window.dispatchEvent(new Event('authStateChanged'));
      
      navigate('/login', { replace: true });
    }
  });
  
  // Update profile mutation - Enhanced
  const updateProfileMutation = useMutation({
    mutationFn: (data) => authAPI.updateProfile(data),
    onSuccess: (response) => {
      // Properly merge updated data with existing user data
      queryClient.setQueryData(['profile'], (oldData) => {
        const updatedData = response.data.data;
        
        // Preserve profile picture URL formatting
        if (updatedData.preferences?.profilePicture && !updatedData.preferences.profilePicture.startsWith('http')) {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
          updatedData.preferences.profilePicture = `${apiUrl}${updatedData.preferences.profilePicture}`;
        }
        
        return {
          ...oldData,
          ...updatedData,
          preferences: {
            ...oldData?.preferences,
            ...updatedData.preferences
          }
        };
      });
      
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.error?.message || 'Failed to update profile';
      toast.error(message);
    }
  });
  
  // Initialize auth state - ✅ לוג רק פעם אחת
  useEffect(() => {
    const initAuth = async () => {
      const token = tokenManager.getAccessToken();
      
      if (token && !tokenManager.isTokenExpired(token)) {
        if (!window._authInitLogged) {
          console.log(`✅ [AUTH-INIT] Valid token exists`);
          window._authInitLogged = true;
        }
      } else {
        tokenManager.clearTokens();
      }
      
      setInitialized(true);
    };
    
    if (!initialized) {
      initAuth();
    }
  }, [initialized]);
  
  // Token refresh effect
  useEffect(() => {
    if (!user) return;
    
    const token = tokenManager.getAccessToken();
    if (!token) return;
    
    // Calculate when to refresh (5 minutes before expiry)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiryTime = payload.exp * 1000;
    const refreshTime = expiryTime - Date.now() - (5 * 60 * 1000);
    
    if (refreshTime <= 0) {
      // Token already expired or about to expire
      refetchProfile();
      return;
    }
    
    // Schedule refresh
    const timeout = setTimeout(() => {
      refetchProfile();
    }, refreshTime);
    
    return () => clearTimeout(timeout);
  }, [user, refetchProfile]);
  
  // NEW: Email verification mutations
  const verifyEmailMutation = useMutation({
    mutationFn: async (token) => {
      console.log(`📧 [VERIFY-EMAIL] Attempting to verify email with token:`, token);
      
      try {
        const response = await authAPI.verifyEmail(token);
        console.log(`✅ [VERIFY-EMAIL] Email verification successful:`, response.data);
        
        // Auto-login user after successful verification
        if (response.data.data?.accessToken) {
          tokenManager.setTokens(response.data.data.accessToken, response.data.data.refreshToken);
        }
        
        return response.data;
      } catch (error) {
        console.error(`❌ [VERIFY-EMAIL] Email verification failed:`, error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log(`🎉 [VERIFY-EMAIL-SUCCESS] Email verified, user logged in`);
      queryClient.invalidateQueries(['profile']);
      window.dispatchEvent(new Event('authStateChanged'));
      
      toast.success('Email verified successfully! Welcome to SpendWise!');
      navigate('/');
    },
    onError: (error) => {
      console.error(`❌ [VERIFY-EMAIL-ERROR]:`, error);
      const message = error.response?.data?.error?.message || 'Email verification failed';
      toast.error(message);
    }
  });

  const resendVerificationMutation = useMutation({
    mutationFn: async (email) => {
      console.log(`📧 [RESEND-VERIFICATION] Attempting to resend verification email to:`, email);
      
      try {
        const response = await authAPI.resendVerificationEmail(email);
        console.log(`✅ [RESEND-VERIFICATION] Verification email sent:`, response.data);
        return response.data;
      } catch (error) {
        console.error(`❌ [RESEND-VERIFICATION] Failed to resend:`, error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log(`📧 [RESEND-VERIFICATION-SUCCESS] Verification email sent`);
      toast.success('Verification email sent! Please check your inbox.');
    },
    onError: (error) => {
      console.error(`❌ [RESEND-VERIFICATION-ERROR]:`, error);
      const message = error.response?.data?.error?.message || 'Failed to send verification email';
      toast.error(message);
    }
  });
  
  // Public methods
  const login = useCallback(async (credentials) => {
    return loginMutation.mutateAsync(credentials);
  }, [loginMutation]);
  
  const register = useCallback(async (userData) => {
    return registerMutation.mutateAsync(userData);
  }, [registerMutation]);
  
  const logout = useCallback(async () => {
    return logoutMutation.mutateAsync();
  }, [logoutMutation]);
  
  const updateProfile = useCallback(async (data) => {
    return updateProfileMutation.mutateAsync(data);
  }, [updateProfileMutation]);
  
  // NEW: Public methods for email verification
  const verifyEmail = useCallback(async (token) => {
    return verifyEmailMutation.mutateAsync(token);
  }, [verifyEmailMutation]);

  const resendVerification = useCallback(async (email) => {
    return resendVerificationMutation.mutateAsync(email);
  }, [resendVerificationMutation]);
  
  const value = {
    // User data
    user,
    isAuthenticated: !!user && auth.isAuthenticated(),
    
    // Loading states
    loading: loading || !initialized,
    initialized,
    
    // Error state
    error: error?.message || null,
    
    // Auth methods
    login,
    register,
    logout,
    updateProfile,
    refreshProfile: refetchProfile,
    
    // NEW: Email verification methods
    verifyEmail,
    resendVerification,
    
    // Loading states for mutations
    isLoggingIn: loginMutation.isLoading,
    isRegistering: registerMutation.isLoading,
    isLoggingOut: logoutMutation.isLoading,
    isUpdatingProfile: updateProfileMutation.isLoading,
    
    // NEW: Email verification loading states
    isVerifyingEmail: verifyEmailMutation.isLoading,
    isResendingVerification: resendVerificationMutation.isLoading
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;