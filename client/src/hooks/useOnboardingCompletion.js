/**
 * ✅ USE ONBOARDING COMPLETION - Completion Logic Hook
 * Handles onboarding completion, API calls, and data persistence
 * Features: Profile updates, Category creation, Template setup, Error handling
 * @version 3.0.0 - ONBOARDING REDESIGN - API FIXES APPLIED ⚡
 */

import { useCallback, useState } from 'react';
import { useAuth, useNotifications, useTranslation } from '../stores';
import { api } from '../api';

/**
 * ✅ Onboarding Completion Hook
 */
export const useOnboardingCompletion = (stepData, options = {}) => {
  const {
    enableRetry = true,
    maxRetries = 3,
    onSuccess = null,
    onError = null,
    onProgress = null
  } = options;

  const { user, actions: authActions } = useAuth();
  const { addNotification } = useNotifications();
  const { t, currentLanguage } = useTranslation('onboarding');

  const [isCompleting, setIsCompleting] = useState(false);
  const [completionProgress, setCompletionProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [completionErrors, setCompletionErrors] = useState([]);

  // ✅ Update completion progress
  const updateProgress = useCallback((progress, message = '') => {
    setCompletionProgress(progress);
    onProgress?.(progress, message);
  }, [onProgress]);

  // ✅ Handle API errors with retry logic
  const handleApiError = useCallback((error, operation, data = null) => {
    console.error(`Onboarding ${operation} failed:`, error);
    
    const errorInfo = {
      operation,
      error: error.message || error,
      data,
      timestamp: new Date().toISOString(),
      retryCount
    };

    setCompletionErrors(prev => [...prev, errorInfo]);

    // Attempt retry if enabled and under limit
    if (enableRetry && retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      addNotification({
        type: 'warning',
        message: `${operation} failed, retrying... (${retryCount + 1}/${maxRetries})`,
        duration: 3000
      });
      return true; // Indicate retry will happen
    }

    return false; // No retry
  }, [enableRetry, maxRetries, retryCount, addNotification]);

  // ✅ Save user preferences - FIXED TO USE ONBOARDING API
  const saveUserPreferences = useCallback(async () => {
    updateProgress(10, 'Saving preferences...');

    if (!stepData.preferences) {
      updateProgress(25, 'No preferences to save');
      return true;
    }

    try {
      // Apply language preference immediately
      if (stepData.preferences.language && stepData.preferences.language !== currentLanguage) {
        localStorage.setItem('preferred_language', stepData.preferences.language);
      }

      // ✅ FIXED: Use onboarding API for preferences
      const response = await api.onboarding.updatePreferences({
        language_preference: stepData.preferences.language,
        currency_preference: stepData.preferences.currency,
        theme_preference: stepData.preferences.theme,
        onboarding_completed: true, // ✅ Mark as completed in DB
        preferences: {
          ...user?.preferences,
          notifications: stepData.preferences.notifications,
          dateFormat: stepData.preferences.dateFormat,
          onboardingCompleted: true,
          onboardingCompletedAt: new Date().toISOString()
        }
      });

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to save preferences');
      }

      updateProgress(25, 'Preferences saved successfully');
      return true;

    } catch (error) {
      if (handleApiError(error, 'saveUserPreferences', stepData.preferences)) {
        return await saveUserPreferences(); // Retry
      }
      throw error;
    }
  }, [stepData.preferences, currentLanguage, user, updateProgress, handleApiError]);

  // ✅ Create custom categories - FIXED TO USE CATEGORIES API
  const createCustomCategories = useCallback(async () => {
    updateProgress(30, 'Creating categories...');

    if (!stepData.categories?.custom?.length) {
      updateProgress(50, 'No custom categories to create');
      return true;
    }

    try {
      const results = [];
      
      for (const [index, category] of stepData.categories.custom.entries()) {
        const progress = 30 + (index / stepData.categories.custom.length) * 20;
        updateProgress(progress, `Creating category: ${category.name}`);

        try {
          // ✅ FIXED: Use categories API module instead of direct fetch
          const response = await api.categories.create({
            name: category.name,
            description: category.description || '',
            icon: category.icon || 'Tag',
            color: category.color || '#3B82F6',
            type: category.type || 'expense',
            is_custom: true,
            created_during_onboarding: true
          });

          if (!response.success) {
            throw new Error(response.error?.message || 'Failed to create category');
          }

          results.push(response.data);

        } catch (error) {
          console.error(`Failed to create category ${category.name}:`, error);
          
          if (!handleApiError(error, 'createCategory', category)) {
            // If no retry, log error but continue with other categories
            addNotification({
              type: 'warning',
              message: `Failed to create category "${category.name}"`,
              duration: 4000
            });
          }
        }
      }

      updateProgress(50, `Created ${results.length} categories`);
      return true;

    } catch (error) {
      if (handleApiError(error, 'createCustomCategories', stepData.categories.custom)) {
        return await createCustomCategories(); // Retry
      }
      throw error;
    }
  }, [stepData.categories, updateProgress, handleApiError, addNotification]);

  // ✅ Create recurring templates - FIXED TO USE CORRECT API METHOD
  const createRecurringTemplates = useCallback(async () => {
    updateProgress(55, 'Creating templates...');

    if (!stepData.templates?.length) {
      updateProgress(75, 'No templates to create');
      return true;
    }

    try {
      const results = [];

      for (const [index, template] of stepData.templates.entries()) {
        const progress = 55 + (index / stepData.templates.length) * 20;
        updateProgress(progress, `Creating template: ${template.description}`);

        try {
          // ✅ FIXED: Use correct API method - api.transactions.recurring.create
          const response = await api.transactions.recurring.create({
            description: template.description,
            amount: template.amount,
            type: template.type,
            category_id: template.category_id,
            frequency: template.frequency || 'monthly',
            start_date: template.start_date || new Date().toISOString().split('T')[0],
            is_active: true,
            created_during_onboarding: true,
            tags: template.tags || []
          });

          if (!response.success) {
            throw new Error(response.error?.message || 'Failed to create template');
          }

          results.push(response.data);

        } catch (error) {
          console.error(`Failed to create template ${template.description}:`, error);
          
          if (!handleApiError(error, 'createTemplate', template)) {
            // If no retry, log error but continue with other templates
            addNotification({
              type: 'warning',
              message: `Failed to create template "${template.description}"`,
              duration: 4000
            });
          }
        }
      }

      updateProgress(75, `Created ${results.length} templates`);
      return true;

    } catch (error) {
      if (handleApiError(error, 'createRecurringTemplates', stepData.templates)) {
        return await createRecurringTemplates(); // Retry
      }
      throw error;
    }
  }, [stepData.templates, updateProgress, handleApiError, addNotification]);

  // ✅ Finalize onboarding - FIXED TO USE ONBOARDING API
  const finalizeOnboarding = useCallback(async () => {
    updateProgress(80, 'Finalizing onboarding...');

    try {
      // Clear any persisted onboarding data
      localStorage.removeItem('onboarding_step_data');
      localStorage.removeItem('onboarding_current_step');

      // ✅ FIXED: Use onboarding API for completion
      const response = await api.onboarding.complete({
        steps_completed: Object.keys(stepData).length,
        categories_created: stepData.categories?.custom?.length || 0,
        templates_created: stepData.templates?.length || 0,
        completion_time: new Date().toISOString(),
        user_id: user?.id
      });

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to complete onboarding');
      }

      // Set onboarding completion flags
      localStorage.setItem('onboarding_completed', 'true');
      localStorage.setItem('onboarding_completed_at', new Date().toISOString());

      // Track completion analytics (if analytics are enabled)
      try {
        await api.analytics.trackEvent({
          event: 'onboarding_completed',
          properties: {
            steps_completed: Object.keys(stepData).length,
            categories_created: stepData.categories?.custom?.length || 0,
            templates_created: stepData.templates?.length || 0,
            completion_time: new Date().toISOString(),
            user_id: user?.id
          }
        });
      } catch (error) {
        // Analytics failure shouldn't block completion
        console.warn('Failed to track onboarding completion:', error);
      }

      updateProgress(95, 'Onboarding completed successfully');
      return true;

    } catch (error) {
      if (handleApiError(error, 'finalizeOnboarding')) {
        return await finalizeOnboarding(); // Retry
      }
      throw error;
    }
  }, [stepData, user, updateProgress, handleApiError]);

  // ✅ Main completion function
  const completeOnboarding = useCallback(async () => {
    if (isCompleting) {
      console.warn('Onboarding completion already in progress');
      return false;
    }

    setIsCompleting(true);
    setCompletionProgress(0);
    setRetryCount(0);
    setCompletionErrors([]);

    try {
      updateProgress(5, 'Starting onboarding completion...');

      // Step 1: Save user preferences
      await saveUserPreferences();

      // Step 2: Create custom categories
      await createCustomCategories();

      // Step 3: Create recurring templates
      await createRecurringTemplates();

      // Step 4: Finalize onboarding
      await finalizeOnboarding();

      // Step 5: Complete
      updateProgress(100, 'Onboarding completed successfully!');

      addNotification({
        type: 'success',
        message: t('completion.success'),
        duration: 5000
      });

      onSuccess?.();
      return true;

    } catch (error) {
      console.error('Onboarding completion failed:', error);
      
      setCompletionErrors(prev => [...prev, {
        operation: 'completeOnboarding',
        error: error.message || error,
        timestamp: new Date().toISOString(),
        final: true
      }]);

      addNotification({
        type: 'error',
        message: t('completion.failed'),
        duration: 6000
      });

      onError?.(error, completionErrors);
      return false;

    } finally {
      setIsCompleting(false);
    }
  }, [
    isCompleting,
    saveUserPreferences,
    createCustomCategories,
    createRecurringTemplates,
    finalizeOnboarding,
    updateProgress,
    addNotification,
    t,
    onSuccess,
    onError,
    completionErrors
  ]);

  // ✅ Retry completion
  const retryCompletion = useCallback(async () => {
    if (retryCount >= maxRetries) {
      addNotification({
        type: 'error',
        message: 'Maximum retry attempts reached',
        duration: 4000
      });
      return false;
    }

    setRetryCount(prev => prev + 1);
    return await completeOnboarding();
  }, [retryCount, maxRetries, completeOnboarding, addNotification]);

  // ✅ Get completion summary
  const getCompletionSummary = useCallback(() => {
    return {
      isCompleting,
      progress: completionProgress,
      retryCount,
      maxRetries,
      errors: completionErrors,
      hasErrors: completionErrors.length > 0,
      canRetry: enableRetry && retryCount < maxRetries && completionErrors.length > 0,
      summary: {
        preferencesConfigured: Boolean(stepData.preferences),
        categoriesCreated: stepData.categories?.custom?.length || 0,
        templatesCreated: stepData.templates?.length || 0
      }
    };
  }, [
    isCompleting,
    completionProgress,
    retryCount,
    maxRetries,
    completionErrors,
    enableRetry,
    stepData
  ]);

  return {
    // State
    isCompleting,
    completionProgress,
    retryCount,
    completionErrors,

    // Actions
    completeOnboarding,
    retryCompletion,

    // Individual steps (for manual control)
    saveUserPreferences,
    createCustomCategories,
    createRecurringTemplates,
    finalizeOnboarding,

    // Utilities
    getCompletionSummary,

    // Computed properties
    hasErrors: completionErrors.length > 0,
    canRetry: enableRetry && retryCount < maxRetries && completionErrors.length > 0
  };
}; 