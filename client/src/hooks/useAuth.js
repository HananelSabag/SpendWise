/**
 * useAuth Hook - Fixed to avoid localStorage conflicts with contexts
 * Removed theme/language localStorage setting to prevent conflicts
 */

import { useCallback, useMemo, useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApiQuery, useApiMutation } from './useApi';
import { authAPI, queryKeys, mutationKeys } from '../utils/api';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
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
        // ✅ IMPROVED: Better error handling - don't show toast for network errors
        if (error?.response?.status === 401) {
          console.log('🔑 [AUTH] Token invalid, clearing auth state');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setShouldFetchProfile(false);
          return false;
        }
        
        // ✅ FIX: Don't retry on server errors that aren't auth-related
        if (error?.response?.status >= 500) {
          console.warn('🔑 [AUTH] Server error during profile fetch, will retry');
          return failureCount < 1; // Reduced retries for server errors
        }
        
        // Network errors - retry silently
        if (!error?.response) {
          console.warn('🔑 [AUTH] Network error during profile fetch, will retry');
          return failureCount < 2;
        }
        
        return false;
      },
      // ✅ FIX: Don't show error toast for profile queries
      onError: (error) => {
        if (error?.response?.status === 401) {
          console.log('🔑 [AUTH] Authentication required - redirecting to login');
          // Let the app handle redirect, don't show toast here
        } else if (error?.response?.status >= 500) {
          console.warn('🔑 [AUTH] Server error during profile fetch');
          // Don't show toast for server errors
        } else if (!error?.response) {
          console.warn('🔑 [AUTH] Network error during profile fetch');
          // Don't show toast for network errors
        }
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
      console.error('Profile data missing required fields');
      return null;
    }
    
    if (profileData.email === 'user@example.com') {
      console.error('Detected cached placeholder data, clearing cache');
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
      onSuccess: (response) => {
        const { data } = response.data;
        
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        
        setShouldFetchProfile(true);
        queryClient.invalidateQueries(queryKeys.profile);
        
        // ✅ FIX: Let contexts handle their own preference loading
        // Removed direct localStorage setting and events
        if (data.user) {
          console.log('🔑 [AUTH] Login successful, user preferences will be loaded by contexts');
        }
        
        toast.success('Welcome back!');
        navigate('/');
      },
      onError: (error) => {
        const errorData = error.response?.data?.error;
        
        if (errorData?.code === 'EMAIL_NOT_VERIFIED') {
          return;
        }
        
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
          return;
        }
        
        toast.success('Registration successful! Please check your email.');
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
        
        console.log('🔄 [AUTH] Session reset triggered for contexts');
        
        toast.success('Logged out successfully');
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
      console.log('Sending preferences data:', data);
      return authAPI.updatePreferences(data.preferences);
    },
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
        // ✅ FIX: Let contexts handle preference updates
        console.log('🔄 [AUTH] Preferences updated in database');
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
    
    // Utility
    refreshProfile: profileQuery.refetch,
    
    // Raw query for advanced usage
    profileQuery
  };
};