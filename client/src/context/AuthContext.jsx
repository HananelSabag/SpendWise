/**
 * AuthContext - Enhanced with Database Preference Synchronization
 * Central authentication state with preference management
 */

import React, { createContext, useContext, useCallback, useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authAPI, queryKeys, mutationKeys } from '../utils/api';
import { useToast } from '../hooks/useToast';

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
  const toastService = useToast();
  
  // Check if user has valid token
  const hasToken = !!localStorage.getItem('accessToken');
  
  // Only enable profile query after explicit authentication check
  const [shouldFetchProfile, setShouldFetchProfile] = useState(false);
  
  // Profile query - includes preferences
  const profileQuery = useQuery({
    queryKey: queryKeys.profile,
    queryFn: () => authAPI.getProfile(),
    enabled: hasToken && shouldFetchProfile, // Only when explicitly enabled
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: (failureCount, error) => {
      if (error?.response?.status === 401) {
        // Clear tokens on 401
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setShouldFetchProfile(false);
        return false;
      }
      return failureCount < 2;
    }
  });
  
  // Initialize profile fetching on mount only if we have a valid token
  useEffect(() => {
    if (hasToken) {
      // Small delay to avoid immediate fetch on page load
      const timer = setTimeout(() => {
        setShouldFetchProfile(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [hasToken]);

  // Process user data with preferences
  const user = useMemo(() => {
    // Handle multiple response structures from API
    let userData = null;
    
    if (profileQuery.data?.data?.data) {
      // Case 1: response.data.data.data (triple nested)
      userData = profileQuery.data.data.data;
    } else if (profileQuery.data?.data) {
      // Case 2: response.data.data (double nested)
      userData = profileQuery.data.data;
    } else if (profileQuery.data) {
      // Case 3: response.data (single nested)
      userData = profileQuery.data;
    }
    
    if (!userData) {
      return null;
    }
    
    // Validate required user data fields
    if (!userData.email || !userData.username) {
      console.error('Profile data missing required fields');
      return null;
    }
    
    // Prevent cached placeholder data
    if (userData.email === 'user@example.com') {
      console.error('Detected cached placeholder data, clearing cache');
      return null;
    }
    
    // ✅ FIXED: Structure user preferences from database columns and JSONB
    const processedUser = {
      ...userData,
      preferences: {
        // ✅ FIXED: Map database columns to correct preference names
        language: userData.language_preference || 'en',
        theme: userData.theme_preference || 'light',
        currency: userData.currency_preference || 'USD',
        
        // JSONB preferences
        profilePicture: userData.preferences?.profilePicture || null,
        notifications: userData.preferences?.notifications || {
          email: true,
          push: true,
          sms: false,
          recurring: true,
          reminders: true
        },
        privacy: userData.preferences?.privacy || {
          showProfile: true,
          showStats: false,
          allowAnalytics: true
        },
        
        // Spread any other JSONB preferences
        ...userData.preferences
      }
    };
    
    return processedUser;
  }, [profileQuery.data]);
  
  // Apply user preferences to the app
  const applyUserPreferences = useCallback((userData) => {
    if (!userData) return;
    
    // ✅ ADD: Emit unified event for all context providers
    window.dispatchEvent(new CustomEvent('user-preferences-loaded', { 
      detail: { user: userData }
    }));
    
    // Legacy events for backwards compatibility
    if (userData.theme_preference) {
      window.dispatchEvent(new CustomEvent('theme-preference-changed', { 
        detail: userData.theme_preference 
      }));
    }
    
    if (userData.language_preference) {
      window.dispatchEvent(new CustomEvent('language-preference-changed', { 
        detail: userData.language_preference 
      }));
    }
    
    if (userData.currency_preference) {
      window.dispatchEvent(new CustomEvent('currency-preference-changed', { 
        detail: userData.currency_preference 
      }));
    }
  }, []);
  
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (credentials) => authAPI.login(credentials),
    mutationKey: mutationKeys.login,
    onSuccess: (response) => {
      const { data } = response.data;
      
      // Store tokens
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      // Clear guest preferences
      localStorage.removeItem('guestTheme');
      localStorage.removeItem('guestCurrency');
      localStorage.removeItem('guestLanguage');
      
      // Enable profile fetching and invalidate to refetch
      setShouldFetchProfile(true);
      queryClient.invalidateQueries(queryKeys.profile);
      
      // Apply user preferences immediately
      if (data.user) {
        applyUserPreferences(data.user);
      }
      
      toastService.loginSuccess();
      
      // Navigate to dashboard
      navigate('/');
    },
    onError: (error) => {
      console.error('Login error:', error);
      clearTokens();
      
      // Don't show toast for EMAIL_NOT_VERIFIED - let component handle modal
      const errorCode = error.response?.data?.error?.code;
      if (errorCode === 'EMAIL_NOT_VERIFIED') {
        // Don't throw error here - let the login helper function handle it
        console.log('EMAIL_NOT_VERIFIED caught in mutation, will be handled by component');
        return;
      }
      
      const message = error.response?.data?.message || 'Login failed';
      toastService.error(message);
    }
  });
  
  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (userData) => authAPI.register(userData),
    mutationKey: mutationKeys.register,
    onSuccess: (response) => {
      if (response.data?.requiresVerification) {
        // Let component handle verification flow
        return;
      }
      
      toastService.registerSuccess();
    },
    onError: (error) => {
      console.error('Registration error:', error);
      // Let the error propagate to the form
      throw error;
    }
  });
  
  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => authAPI.logout(),
    mutationKey: mutationKeys.logout,
    onSuccess: () => {
      // Clear all auth data
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      // Clear all queries
      queryClient.clear();
      
      // ✅ ADD: Comprehensive session cleanup
      window.dispatchEvent(new Event('auth-logout'));
      window.dispatchEvent(new Event('preferences-reset'));
      window.dispatchEvent(new CustomEvent('language-session-reset'));
      window.dispatchEvent(new CustomEvent('theme-session-reset'));
      
      console.log('🔄 [AUTH] Complete session cleanup (language + theme + preferences)');
      
      toastService.logoutSuccess();
      
      // Navigate to login
      navigate('/login');
    },
    onError: () => {
      // Even if logout API fails, clear local data
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      queryClient.clear();
      
      // ✅ ADD: Force cleanup on error too
      window.dispatchEvent(new Event('auth-logout'));
      window.dispatchEvent(new Event('preferences-reset'));
      window.dispatchEvent(new CustomEvent('language-session-reset'));
      window.dispatchEvent(new CustomEvent('theme-session-reset'));
      
      navigate('/login');
    }
  });
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data) => authAPI.updateProfile(data),
    mutationKey: mutationKeys.updateProfile,
    onSuccess: (response) => {
      const updatedUser = response.data?.data;
      
      // Update cache
      queryClient.setQueryData(queryKeys.profile, (old) => ({
        ...old,
        data: updatedUser
      }));
      
      // Apply preferences if they changed
      if (updatedUser) {
        applyUserPreferences(updatedUser);
      }
      
      toastService.profileUpdated();
    }
  });
  
  // Update preferences mutation (JSONB)
  const updatePreferencesMutation = useMutation({
    mutationFn: (preferences) => authAPI.updatePreferences(preferences),
    mutationKey: mutationKeys.updatePreferences,
    onSuccess: (response, variables) => {
      // Update cache optimistically
      queryClient.setQueryData(queryKeys.profile, (old) => {
        if (!old?.data) return old;
        
        return {
          ...old,
          data: {
            ...old.data,
            preferences: {
              ...old.data.preferences,
              ...variables.preferences
            }
          }
        };
      });
      
      // ✅ REMOVED: Don't show generic toast - let specific components handle their own toasts
      // toastService.preferencesUpdated();
    }
  });
  
  // Upload profile picture mutation
  const uploadProfilePictureMutation = useMutation({
    mutationFn: ({ file, onProgress }) => authAPI.uploadProfilePicture(file, onProgress),
    mutationKey: mutationKeys.uploadProfilePicture,
    onSuccess: (response) => {
      // Update cache immediately with new picture URL
      const pictureUrl = response.data?.data?.url;
      if (pictureUrl) {
        queryClient.setQueryData(queryKeys.profile, (old) => {
          if (!old?.data) return old;
          
          return {
            ...old,
            data: {
              ...old.data,
              preferences: {
                ...old.data.preferences,
                profilePicture: pictureUrl
              }
            }
          };
        });
      }
      
      toastService.profilePictureUploaded();
    }
  });
  
  // Email verification mutations
  const verifyEmailMutation = useMutation({
    mutationFn: (token) => authAPI.verifyEmail(token),
    mutationKey: mutationKeys.verifyEmail,
    onSuccess: (response) => {
      const { data } = response.data;
      
      if (data?.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        queryClient.invalidateQueries(queryKeys.profile);
      }
      
      toastService.emailVerified();
      navigate('/');
    }
  });
  
  const resendVerificationMutation = useMutation({
    mutationFn: (email) => authAPI.resendVerificationEmail(email),
    mutationKey: mutationKeys.resendVerification,
    onSuccess: () => {
      // Don't show toast here - let modal handle success feedback
      console.log('Verification email sent successfully');
    },
    onError: (error) => {
      // Let modal handle error display
      console.error('Failed to send verification email:', error);
    }
  });
  
  // Password reset mutations
  const forgotPasswordMutation = useMutation({
    mutationFn: (email) => authAPI.forgotPassword(email),
    mutationKey: mutationKeys.forgotPassword
  });
  
  const resetPasswordMutation = useMutation({
    mutationFn: ({ token, newPassword }) => authAPI.resetPassword(token, newPassword),
    mutationKey: mutationKeys.resetPassword,
    onSuccess: () => {
      toastService.passwordReset();
      navigate('/login');
    }
  });
  
  // Helper functions
  const login = useCallback(async (credentials) => {
    try {
      return await loginMutation.mutateAsync(credentials);
    } catch (error) {
      // Re-throw EMAIL_NOT_VERIFIED errors so component can handle them
      const errorCode = error.response?.data?.error?.code;
      if (errorCode === 'EMAIL_NOT_VERIFIED') {
        throw error;
      }
      // For other errors, re-throw as well
      throw error;
    }
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
  
  const updatePreferences = useCallback(async (preferences) => {
    // Handle both formats: direct preferences or wrapped
    const prefsToUpdate = preferences.preferences || preferences;
    return updatePreferencesMutation.mutateAsync({ preferences: prefsToUpdate });
  }, [updatePreferencesMutation]);
  
  const uploadProfilePicture = useCallback(async (file, onProgress) => {
    return uploadProfilePictureMutation.mutateAsync({ file, onProgress });
  }, [uploadProfilePictureMutation]);
  
  const verifyEmail = useCallback(async (token) => {
    return verifyEmailMutation.mutateAsync(token);
  }, [verifyEmailMutation]);
  
  const resendVerificationEmail = useCallback(async (email) => {
    return resendVerificationMutation.mutateAsync(email);
  }, [resendVerificationMutation]);
  
  const forgotPassword = useCallback(async (email) => {
    return forgotPasswordMutation.mutateAsync(email);
  }, [forgotPasswordMutation]);
  
  const resetPassword = useCallback(async (token, newPassword) => {
    return resetPasswordMutation.mutateAsync({ token, newPassword });
  }, [resetPasswordMutation]);
  
  // Mark onboarding as complete
  const markOnboardingComplete = useCallback(async () => {
    try {
      const response = await authAPI.completeOnboarding();
      
      // Update the user data locally
      queryClient.setQueryData(queryKeys.profile, (old) => {
        if (!old?.data) return old;
        
        return {
          ...old,
          data: {
            ...old.data,
            onboarding_completed: true
          }
        };
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to mark onboarding complete:', error);
      throw error;
    }
  }, [queryClient]);
  
  // Refresh profile data
  const refreshProfile = useCallback(() => {
    return profileQuery.refetch();
  }, [profileQuery]);
  
  // Apply preferences on user change
  React.useEffect(() => {
    if (user) {
      applyUserPreferences(user);
    }
  }, [user, applyUserPreferences]);
  
  // Computed states
  const isAuthenticated = !!user && hasToken;
  const isLoading = profileQuery.isLoading;
  const isInitialized = !hasToken || profileQuery.isFetched;
  
  const value = useMemo(() => ({
    // User data
    user,
    isAuthenticated,
    preferences: user?.preferences || null,
    
    // Loading states
    isLoading,
    isInitialized,
    isLoggingIn: loginMutation.isLoading,
    isRegistering: registerMutation.isLoading,
    isLoggingOut: logoutMutation.isLoading,
    isUpdatingProfile: updateProfileMutation.isLoading,
    isUpdatingPreferences: updatePreferencesMutation.isLoading,
    isUploadingPicture: uploadProfilePictureMutation.isLoading,
    isVerifyingEmail: verifyEmailMutation.isLoading,
    isResendingVerification: resendVerificationMutation.isLoading,
    isSendingResetEmail: forgotPasswordMutation.isLoading,
    isResettingPassword: resetPasswordMutation.isLoading,
    
    // Auth methods
    login,
    register,
    logout,
    updateProfile,
    updatePreferences,
    uploadProfilePicture,
    verifyEmail,
    resendVerificationEmail,
    forgotPassword,
    resetPassword,
    markOnboardingComplete,
    
    // Utility
    refreshProfile,
    applyUserPreferences,
    
    // Raw query for advanced usage
    profileQuery
  }), [
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    loginMutation.isLoading,
    registerMutation.isLoading,
    logoutMutation.isLoading,
    updateProfileMutation.isLoading,
    updatePreferencesMutation.isLoading,
    uploadProfilePictureMutation.isLoading,
    verifyEmailMutation.isLoading,
    resendVerificationMutation.isLoading,
    forgotPasswordMutation.isLoading,
    resetPasswordMutation.isLoading,
    login,
    register,
    logout,
    updateProfile,
    updatePreferences,
    uploadProfilePicture,
    verifyEmail,
    resendVerificationEmail,
    forgotPassword,
    resetPassword,
    markOnboardingComplete,
    refreshProfile,
    applyUserPreferences,
    profileQuery,
    hasToken
  ]);
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;