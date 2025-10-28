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
   * Complete onboarding process with template setup
   * Uses bulk API to avoid rate limits when creating multiple templates
   */
  const completeOnboarding = useCallback(async () => {
    try {
      // Save templates and complete onboarding
      const templates = stepData?.templates?.selectedTemplates || [];
      
      // Bulk save templates to avoid rate limits
      if (templates.length > 0) {
        
        try {
          // Format templates for bulk API
          const formattedTemplates = templates.map(template => ({
            name: template.name,
            description: template.name,
            amount: template.amount,
            type: template.type,
            category_name: template.categoryName || 'General',
            interval_type: 'monthly',
            is_active: true
          }));

          // Use bulk API method directly
          const api = (await import('../api/transactions')).default;
          const result = await api.createBulkRecurringTemplates(formattedTemplates);
          
          if (result.success) {
            // Show success toast with details
            const summary = result.data.summary;
            addNotification(
              t('completion.templates_created', { 
                count: summary.successful,
                total: summary.totalRequested 
              }) || `Successfully created ${summary.successful} out of ${summary.totalRequested} templates`,
              'success'
            );
          } else {
            // Show warning toast for partial failure
            addNotification(
              t('completion.templates_partial_failure') || 'Some templates could not be created. Please try again.',
              'warning'
            );
          }
        } catch (error) {
          console.error('❌ Bulk template creation failed:', error);
          
          // ⚠️ Show error toast but don't fail onboarding
          addNotification(
            t('completion.templates_failed') || 'Templates could not be created, but onboarding will continue.',
            'warning'
          );
          
          // Don't fail the whole onboarding if templates fail
        }
      }

      // Complete onboarding
      const response = await api.onboarding.complete({
        steps_completed: Object.keys(stepData || {}).length,
        completion_time: new Date().toISOString(),
        user_id: user?.id,
        templates_count: templates.length
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

      // ✅ FINAL REFRESH: Single refresh after all operations complete
      console.log('🔄 Triggering final app refresh after onboarding completion...');
      try {
        await refreshAll();
        console.log('✅ Final refresh completed - all data should be up-to-date');
      } catch (refreshError) {
        console.warn('⚠️ Final refresh failed, but onboarding still completed:', refreshError);
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