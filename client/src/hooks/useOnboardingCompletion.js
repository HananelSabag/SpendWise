/**
 * ✅ USE ONBOARDING COMPLETION - SIMPLIFIED COMPLETION LOGIC
 * Just marks onboarding as complete without complex setup
 * @version 4.0.0 - SIMPLIFIED FOR RELIABILITY
 */

import { useCallback } from 'react';
import { useAuth, useNotifications, useTranslation } from '../stores';
import { api } from '../api';
import { useBalanceRefresh } from '../contexts/BalanceContext';

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
  const { refreshAll } = useBalanceRefresh();

  /**
   * Complete onboarding process: save the financial-cycle day, then mark
   * onboarding complete.
   */
  const completeOnboarding = useCallback(async () => {
    try {
      const billingCycleDay = stepData?.billingCycle?.billingCycleDay;

      if (billingCycleDay) {
        try {
          await api.users.updateProfile({ billing_cycle_day: billingCycleDay });
        } catch (error) {
          console.error('❌ Saving financial cycle day failed:', error);
          addNotification(
            t('completion.billingCycleFailed') || 'Could not save your financial cycle day, but onboarding will continue.',
            'warning'
          );
          // Don't fail the whole onboarding if this fails — the user can
          // still set it later from profile settings.
        }
      }

      // Complete onboarding
      const response = await api.onboarding.complete({
        steps_completed: Object.keys(stepData || {}).length,
        completion_time: new Date().toISOString(),
        user_id: user?.id
      });

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to complete onboarding');
      }

      // ✅ ENHANCED: Update auth store with completed onboarding status
      if (authActions.updateProfile) {
        try {
          const updateResult = await authActions.updateProfile({
            onboarding_completed: true
          });

          // ✅ ENHANCED: If updateProfile succeeded, also directly update the user in store
          if (updateResult.success && updateResult.user) {
            authActions.setUser({
              ...user,
              ...updateResult.user,
              onboarding_completed: true,
              onboardingCompleted: true
            });
          }
        } catch (error) {
          // Onboarding still completed even if store update fails
        }
      }

      // ✅ ENHANCED: Since refreshUser doesn't exist, force a profile refetch
      if (authActions.getProfile) {
        try {
          await authActions.getProfile();
        } catch (error) {
          // Onboarding still completed
        }
      } else {
        // ✅ FALLBACK: Directly update auth store with onboarding completion
        try {
          authActions.setUser({
            ...user,
            onboarding_completed: true,
            onboardingCompleted: true
          });
        } catch (error) {
          // Onboarding still completed
        }
      }

      // Clear any persisted onboarding data
      localStorage.removeItem('onboarding_step_data');
      localStorage.removeItem('onboarding_current_step');
      localStorage.setItem('onboarding_completed', 'true');
      localStorage.setItem('onboarding_completed_at', new Date().toISOString());

      // ✅ FINAL REFRESH: Single refresh after all operations complete
      try {
        await refreshAll();
      } catch (refreshError) {
        // Refresh failure doesn't block onboarding completion
      }

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
    }
  }, [
    stepData,
    user,
    authActions,
    addNotification,
    t,
    onSuccess,
    onError,
    refreshAll
  ]);

  return {
    // Actions
    completeOnboarding,

    // Computed properties
    hasErrors: false,
    canRetry: false
  };
}; 