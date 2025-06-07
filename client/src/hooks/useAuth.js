/**
 * useAuth Hook - Enhanced Authentication Management
 * Provides authentication functionality with database-driven preferences
 */

import { useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApiQuery, useApiMutation } from './useApi';
import { authAPI, queryKeys, mutationKeys } from '../utils/api';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

/**
 * Enhanced authentication hook with preference management
 */
export const useAuth = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Check if user has valid token
  const hasToken = !!localStorage.getItem('accessToken');
  
  // Profile query - includes preferences
  const profileQuery = useApiQuery(
    queryKeys.profile,
    () => authAPI.getProfile(),
    {
      config: 'user',
      enabled: hasToken,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
      retry: (failureCount, error) => {
        if (error?.response?.status === 401) {
          // Clear tokens on 401
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          return false;
        }
        return failureCount < 2;
      }
    }
  );
  
  // Process user data with preferences
  const user = useMemo(() => {
    if (!profileQuery.data?.data) return null;
    
    const userData = profileQuery.data.data;
    
    // Ensure preferences are properly structured
    return {
      ...userData,
      preferences: {
        profilePicture: userData.preferences?.profilePicture || null,
        language: userData.language_preference || 'en',
        theme: userData.theme_preference || 'light',
        currency: userData.currency_preference || 'USD',
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
        ...userData.preferences
      }
    };
  }, [profileQuery.data]);
  
  // Login mutation
  const loginMutation = useApiMutation(
    (credentials) => authAPI.login(credentials),
    {
      mutationKey: mutationKeys.login,
      onSuccess: (response) => {
        const { data } = response.data;
        
        // Store tokens
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        
        // Invalidate profile to refetch with new auth
        queryClient.invalidateQueries(queryKeys.profile);
        
        // Apply user preferences immediately
        if (data.user) {
          applyUserPreferences(data.user);
        }
        
        toast.success('Welcome back!');
        
        // Navigate to dashboard
        navigate('/');
      },
      onError: (error) => {
        const errorData = error.response?.data?.error;
        
        if (errorData?.code === 'EMAIL_NOT_VERIFIED') {
          // Don't show toast, let component handle it
          return;
        }
        
        // Show other errors
        const message = errorData?.message || 'Login failed';
        toast.error(message);
      }
    }
  );
  
  // Register mutation
  const registerMutation = useApiMutation(
    (userData) => authAPI.register(userData),
    {
      mutationKey: mutationKeys.register,
      onSuccess: (response) => {
        if (response.data?.requiresVerification) {
          // Let component handle verification flow
          return;
        }
        
        toast.success('Registration successful! Please check your email.');
      },
      showErrorToast: false // Handle errors in component
    }
  );
  
  // Logout mutation
  const logoutMutation = useApiMutation(
    () => authAPI.logout(),
    {
      mutationKey: mutationKeys.logout,
      onSuccess: () => {
        // Clear all auth data
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        // Clear all queries
        queryClient.clear();
        
        // Reset to default preferences
        resetToDefaultPreferences();
        
        toast.success('Logged out successfully');
        
        // Navigate to login
        navigate('/login');
      },
      showErrorToast: false
    }
  );
  
  // Update profile mutation
  const updateProfileMutation = useApiMutation(
    (data) => authAPI.updateProfile(data),
    {
      mutationKey: mutationKeys.updateProfile,
      invalidateKeys: [queryKeys.profile],
      successMessage: 'Profile updated successfully',
      onSuccess: (response) => {
        const updatedUser = response.data?.data;
        if (updatedUser) {
          applyUserPreferences(updatedUser);
        }
      }
    }
  );
  
  // Update preferences mutation
  const updatePreferencesMutation = useApiMutation(
    (preferences) => authAPI.updatePreferences(preferences),
    {
      mutationKey: mutationKeys.updatePreferences,
      invalidateKeys: [queryKeys.profile],
      successMessage: 'Preferences updated successfully',
      optimisticUpdate: {
        queryKey: queryKeys.profile,
        updater: (old, variables) => {
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
        }
      },
      onSuccess: (response) => {
        const updatedPreferences = response.data?.data?.preferences;
        if (updatedPreferences) {
          applyPreferences(updatedPreferences);
        }
      }
    }
  );
  
  // Upload profile picture mutation
  const uploadProfilePictureMutation = useApiMutation(
    ({ file, onProgress }) => authAPI.uploadProfilePicture(file, onProgress),
    {
      mutationKey: mutationKeys.uploadProfilePicture,
      invalidateKeys: [queryKeys.profile],
      successMessage: 'Profile picture uploaded successfully',
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
      }
    }
  );
  
  // Email verification mutations
  const verifyEmailMutation = useApiMutation(
    (token) => authAPI.verifyEmail(token),
    {
      mutationKey: mutationKeys.verifyEmail,
      onSuccess: (response) => {
        const { data } = response.data;
        
        if (data?.accessToken) {
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          queryClient.invalidateQueries(queryKeys.profile);
        }
        
        toast.success('Email verified successfully!');
        navigate('/');
      }
    }
  );
  
  const resendVerificationMutation = useApiMutation(
    (email) => authAPI.resendVerificationEmail(email),
    {
      mutationKey: mutationKeys.resendVerification,
      successMessage: 'Verification email sent!'
    }
  );
  
  // Password reset mutations
  const forgotPasswordMutation = useApiMutation(
    (email) => authAPI.forgotPassword(email),
    {
      mutationKey: mutationKeys.forgotPassword,
      showSuccessToast: false,
      showErrorToast: false
    }
  );
  
  const resetPasswordMutation = useApiMutation(
    ({ token, newPassword }) => authAPI.resetPassword(token, newPassword),
    {
      mutationKey: mutationKeys.resetPassword,
      successMessage: 'Password reset successfully',
      onSuccess: () => {
        navigate('/login');
      }
    }
  );
  
  // Apply user preferences to the app
  const applyUserPreferences = useCallback((userData) => {
    // Apply theme
    if (userData.theme_preference) {
      document.documentElement.classList.toggle('dark', userData.theme_preference === 'dark');
      localStorage.setItem('theme', userData.theme_preference);
    }
    
    // Apply language
    if (userData.language_preference) {
      localStorage.setItem('language', userData.language_preference);
      // Trigger language change event
      window.dispatchEvent(new CustomEvent('language-changed', { 
        detail: userData.language_preference 
      }));
    }
    
    // Apply currency
    if (userData.currency_preference) {
      localStorage.setItem('currency', userData.currency_preference);
      // Trigger currency change event
      window.dispatchEvent(new CustomEvent('currency-changed', { 
        detail: userData.currency_preference 
      }));
    }
  }, []);
  
  // Apply specific preferences
  const applyPreferences = useCallback((preferences) => {
    if (!preferences) return;
    
    // Apply any preference changes
    Object.entries(preferences).forEach(([key, value]) => {
      switch (key) {
        case 'theme':
          document.documentElement.classList.toggle('dark', value === 'dark');
          localStorage.setItem('theme', value);
          break;
        case 'language':
          localStorage.setItem('language', value);
          window.dispatchEvent(new CustomEvent('language-changed', { detail: value }));
          break;
        case 'currency':
          localStorage.setItem('currency', value);
          window.dispatchEvent(new CustomEvent('currency-changed', { detail: value }));
          break;
      }
    });
  }, []);
  
  // Reset to default preferences
  const resetToDefaultPreferences = useCallback(() => {
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('theme');
    localStorage.removeItem('language');
    localStorage.removeItem('currency');
    
    // Trigger reset events
    window.dispatchEvent(new CustomEvent('preferences-reset'));
  }, []);
  
  // Apply user preferences on load
  useEffect(() => {
    if (user) {
      applyUserPreferences(user);
    }
  }, [user, applyUserPreferences]);
  
  // Helper functions
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
  
  const updatePreferences = useCallback(async (preferences) => {
    return updatePreferencesMutation.mutateAsync({ preferences });
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
  
  // Computed states
  const isAuthenticated = !!user && hasToken;
  const isLoading = profileQuery.isLoading;
  const isInitialized = !hasToken || profileQuery.isFetched;
  
  return {
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
    
    // Utility
    refreshProfile: profileQuery.refetch,
    applyUserPreferences,
    
    // Raw query for advanced usage
    profileQuery
  };
};