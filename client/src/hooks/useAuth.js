/**
 * useAuth Hook - Fixed to avoid localStorage conflicts with contexts
 * Removed theme/language localStorage setting to prevent conflicts
 */

import { useCallback, useMemo, useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApiQuery, useApiMutation } from './useApi';
import { authAPI, queryKeys, mutationKeys } from '../utils/api';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from './useToast';
import AuthContext from '../context/AuthContext';

/**
 * Enhanced authentication hook with preference management
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toastService = useToast();
  
  // Check if user has valid token
  const hasToken = !!localStorage.getItem('accessToken');
  
  // Only enable profile query after explicit authentication check
  const [shouldFetchProfile, setShouldFetchProfile] = useState(false);
  
  // Profile query - includes preferences
  const profileQuery = useApiQuery(
    queryKeys.profile,
    () => authAPI.getProfile(),
    {
      config: 'user',
      enabled: hasToken && shouldFetchProfile,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
      retry: (failureCount, error) => {
        // ✅ IMPROVED: Better error handling for production
        if (error?.response?.status === 401) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setShouldFetchProfile(false);
          return false;
        }
        
        // Don't retry immediately on server errors during cold start
        if (error?.response?.status >= 500) {
          if (failureCount < 1) {
            return true;
          }
          return false;
        }
        
        // Network errors - retry with exponential backoff
        if (!error?.response) {
          if (failureCount < 2) {
            return true;
          }
          return false;
        }
        
        return false;
      },
      retryDelay: (attemptIndex) => {
        // ✅ NEW: Exponential backoff for retries
        return Math.min(1000 * Math.pow(2, attemptIndex), 10000);
      },
      // Better error handling that doesn't confuse users
      onError: (error) => {
        // Error handling is managed by the app's error boundaries and toast system
        // No console logging needed in production
      }
    }
  );
  
  // Initialize profile fetching on mount only if we have a valid token
  useEffect(() => {
    if (hasToken) {
      const timer = setTimeout(() => {
        setShouldFetchProfile(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [hasToken]);

  // Process user data with preferences
  const user = useMemo(() => {
    let profileData = null;
    
    if (profileQuery.data?.data?.data) {
      profileData = profileQuery.data.data.data;
    } else if (profileQuery.data?.data) {
      profileData = profileQuery.data.data;
    } else if (profileQuery.data) {
      profileData = profileQuery.data;
    }
    
    if (!profileData) {
      return null;
    }
    
    if (!profileData.email || !profileData.username) {
      return null;
    }
    
    if (profileData.email === 'user@example.com') {
      queryClient.removeQueries(queryKeys.profile);
      return null;
    }
    
    const processedUser = {
      ...profileData,
      preferences: {
        profilePicture: profileData.preferences?.profilePicture || null,
        language: profileData.language_preference || 'en',
        theme: profileData.theme_preference || 'light',
        currency: profileData.currency_preference || 'USD',
        notifications: profileData.preferences?.notifications || {
          email: true,
          push: true,
          sms: false,
          recurring: true,
          reminders: true
        },
        privacy: profileData.preferences?.privacy || {
          showProfile: true,
          showStats: false,
          allowAnalytics: true
        },
        ...profileData.preferences
      }
    };
    
    return processedUser;
  }, [profileQuery.data, queryClient]);

  // Login mutation
  const loginMutation = useApiMutation(
    (credentials) => authAPI.login(credentials),
    {
      mutationKey: mutationKeys.login,
      showErrorToast: false, // ✅ Disable automatic error toast
      onSuccess: (response) => {
        const { data } = response.data;
        
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        
        setShouldFetchProfile(true);
        queryClient.invalidateQueries(queryKeys.profile);
        
        // ✅ FIX: Let contexts handle their own preference loading
        // Removed direct localStorage setting and events
        if (data.user && process.env.NODE_ENV === 'development') {
          console.log('🔑 [AUTH] Login successful, user preferences will be loaded by contexts');
        }
        
        toastService.loginSuccess();
        navigate('/');
      },
      onError: (error) => {
        const errorData = error.response?.data?.error;
        
        // ✅ For EMAIL_NOT_VERIFIED, don't show toast - let component handle modal
        if (errorData?.code === 'EMAIL_NOT_VERIFIED') {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔑 [AUTH] Email not verified, letting component handle modal');
          }
          return; // Don't show toast, let error propagate to component
        }
        
        // For other errors, show toast
        toastService.error(error);
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
          return;
        }
        
        toastService.registerSuccess();
      },
      showErrorToast: false
    }
  );
  
  // Logout mutation
  const logoutMutation = useApiMutation(
    () => authAPI.logout(),
    {
      mutationKey: mutationKeys.logout,
      onSuccess: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        queryClient.clear();
        
        // ✅ FIX: Trigger session reset for contexts (not preference reset)
        window.dispatchEvent(new CustomEvent('auth-logout'));
        window.dispatchEvent(new CustomEvent('language-session-reset'));
        window.dispatchEvent(new CustomEvent('theme-session-reset'));
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 [AUTH] Session reset triggered for contexts');
        }
        
        toastService.logoutSuccess();
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
      showSuccessToast: false,
      onSuccess: (response) => {
        const updatedUser = response.data?.data;
        if (updatedUser && process.env.NODE_ENV === 'development') {
          // ✅ FIX: Let contexts handle their own updates
          // Don't apply preferences here - contexts will pick up changes
          console.log('🔄 [AUTH] Profile updated, contexts will sync automatically');
        }
      }
    }
  );
  
  // Update preferences mutation  
  const updatePreferencesMutation = useApiMutation(
    (data) => {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Sending preferences data:', data);
      }
      return authAPI.updatePreferences(data.preferences);
    },
    {
      mutationKey: mutationKeys.updatePreferences,
      invalidateKeys: [queryKeys.profile],
      showSuccessToast: false, // Use toastService directly
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
        // ✅ FIX: Let contexts handle preference updates
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 [AUTH] Preferences updated in database');
        }
        toastService.success('toast.success.preferencesUpdated');
      }
    }
  );
  
  // Upload profile picture mutation
  const uploadProfilePictureMutation = useApiMutation(
    ({ file, onProgress }) => authAPI.uploadProfilePicture(file, onProgress),
    {
      mutationKey: mutationKeys.uploadProfilePicture,
      invalidateKeys: [queryKeys.profile],
      showSuccessToast: false, // Use toastService directly
      onSuccess: (response) => {
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
          
          // Force a profile refetch to ensure fresh data
          queryClient.invalidateQueries(queryKeys.profile);
        }
        toastService.success('toast.success.profilePictureUploaded');
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
        
        toastService.emailVerified();
        navigate('/');
      }
    }
  );
  
  const resendVerificationMutation = useApiMutation(
    (email) => authAPI.resendVerificationEmail(email),
    {
      mutationKey: mutationKeys.resendVerification,
      showSuccessToast: false, // Use toastService directly
      onSuccess: () => {
        toastService.success('toast.success.verificationSent');
      }
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
      showSuccessToast: false, // Use toastService directly
      onSuccess: () => {
        toastService.success('toast.success.passwordReset');
        navigate('/login');
      }
    }
  );
  
  // ✅ REMOVED: applyUserPreferences function that was causing conflicts
  
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

  // Mark onboarding as complete
  const markOnboardingComplete = useCallback(async () => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 About to call authAPI.completeOnboarding()');
      }
      const response = await authAPI.completeOnboarding();
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Response received:', response);
      }
      
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
      // Keep error logging in both development and production for debugging
      console.error('❌ Failed to mark onboarding complete:', error);
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error details:', error.response?.data);
        console.error('❌ Full error:', error);
      }
      throw error;
    }
  }, [queryClient]);
  
  // Computed states
  const isAuthenticated = !!user && hasToken;
  const isLoading = profileQuery.isLoading && shouldFetchProfile;
  const isInitialized = !hasToken || profileQuery.isFetched || profileQuery.isError;
  
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
    markOnboardingComplete,
    
    // Utility
    refreshProfile: profileQuery.refetch,
    
    // Raw query for advanced usage
    profileQuery
  };
};