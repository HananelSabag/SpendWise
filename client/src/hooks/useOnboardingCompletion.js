/**
 * ✅ USE ONBOARDING COMPLETION - SIMPLIFIED COMPLETION LOGIC
 * Just marks onboarding as complete without complex setup
 * @version 4.0.0 - SIMPLIFIED FOR RELIABILITY
 */

import { useCallback, useState } from 'react';
import { useAuth, useNotifications, useTranslation } from '../stores';
import { api } from '../api';

/**
 * ✅ Simplified Onboarding Completion Hook
 */
export const useOnboardingCompletion = (stepData, options = {}) => {
  const {
    onSuccess = null,
    onError = null
  } = options;

  const { user, actions: authActions } = useAuth();
  const { addNotification } = useNotifications();
  const { t } = useTranslation('onboarding');

  const [isCompleting, setIsCompleting] = useState(false);

  // ✅ SIMPLIFIED: Just complete onboarding without complex setup
  const completeOnboarding = useCallback(async () => {
    if (isCompleting) {
      console.warn('Onboarding completion already in progress');
      return false;
    }

    setIsCompleting(true);

    try {
      console.log('🎯 Starting simplified onboarding completion...');

      // ✅ SIMPLIFIED: Just call the onboarding complete API
      const response = await api.onboarding.complete({
        steps_completed: Object.keys(stepData || {}).length,
        completion_time: new Date().toISOString(),
        user_id: user?.id
      });

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to complete onboarding');
      }

      console.log('✅ Onboarding completion successful:', response.data);

      // ✅ ENHANCED: Update auth store with completed onboarding status
      if (authActions.updateProfile) {
        try {
          const updateResult = await authActions.updateProfile({
            onboarding_completed: true
          });
          console.log('✅ Auth store updateProfile result:', updateResult);
          
          // ✅ ENHANCED: If updateProfile succeeded, also directly update the user in store
          if (updateResult.success && updateResult.user) {
            authActions.setUser({
              ...user,
              ...updateResult.user,
              onboarding_completed: true,
              onboardingCompleted: true
            });
            console.log('✅ Direct auth store user update completed');
          }
        } catch (error) {
          console.warn('Failed to update auth store, but onboarding still completed:', error);
        }
      }

      // ✅ ENHANCED: Since refreshUser doesn't exist, force a profile refetch
      if (authActions.getProfile) {
        try {
          const profileResult = await authActions.getProfile();
          console.log('✅ Profile refetch result:', profileResult);
        } catch (error) {
          console.warn('Failed to refresh profile, but onboarding still completed:', error);
        }
      } else {
        // ✅ FALLBACK: Directly update auth store with onboarding completion
        try {
          authActions.setUser({
            ...user,
            onboarding_completed: true,
            onboardingCompleted: true
          });
          console.log('✅ Fallback: Direct user update in auth store');
        } catch (error) {
          console.warn('Failed to directly update auth store:', error);
        }
      }

      // Clear any persisted onboarding data
      localStorage.removeItem('onboarding_step_data');
      localStorage.removeItem('onboarding_current_step');
      localStorage.setItem('onboarding_completed', 'true');
      localStorage.setItem('onboarding_completed_at', new Date().toISOString());

      addNotification({
        type: 'success',
        message: t('completion.success') || 'Setup completed successfully!',
        duration: 5000
      });

      onSuccess?.();
      return true;

    } catch (error) {
      console.error('❌ Onboarding completion failed:', error);
      console.error('❌ Server response details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });

      addNotification({
        type: 'error',
        message: t('completion.failed') || 'Setup completion failed. Please try again.',
        duration: 6000
      });

      onError?.(error);
      return false;

    } finally {
      setIsCompleting(false);
    }
  }, [
    isCompleting,
    stepData,
    user,
    authActions,
    addNotification,
    t,
    onSuccess,
    onError
  ]);

  return {
    // State
    isCompleting,

    // Actions
    completeOnboarding,

    // Computed properties
    hasErrors: false,
    canRetry: false
  };
}; 