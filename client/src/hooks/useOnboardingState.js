/**
 * 🎯 USE ONBOARDING STATE - Advanced State Management Hook
 * Centralized onboarding state and step management
 * Features: Step configuration, Data management, Validation, Progress tracking
 * @version 3.0.0 - ONBOARDING REDESIGN
 */

import { useState, useCallback, useMemo } from 'react';
import { 
  Sparkles, Heart, PieChart, Target, Check,
  Smartphone, TrendingUp, Wallet, User
} from 'lucide-react';

// ✅ Import stores and components
import { useTranslation, useAuth } from '../stores';

// Import NEW step components - REDESIGNED ONBOARDING
import ProfileSetupStep from '../components/features/onboarding/steps/ProfileSetupStep';
import TransactionEducationStep from '../components/features/onboarding/steps/TransactionEducationStep';
import QuickRecurringSetupStep from '../components/features/onboarding/steps/QuickRecurringSetupStep';
import NewCompletionStep from '../components/features/onboarding/steps/NewCompletionStep';

/**
 * 🎯 Onboarding State Hook
 */
export const useOnboardingState = (options = {}) => {
  const {
    initialStep = 0,
    enableValidation = true,
    persistData = true
  } = options;

  const { t, currentLanguage } = useTranslation('onboarding');
  const { user } = useAuth();

  // ✅ Current step tracking
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isCompleting, setIsCompleting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // ✅ Step data management
  const [stepData, setStepData] = useState({
    preferences: {
      language: currentLanguage,
      currency: 'USD',
      theme: 'auto',
      dateFormat: 'MM/DD/YYYY',
      notifications: {
        email: true,
        push: true,
        sms: false,
        recurring: true,
        budgetAlerts: true
      }
    },
    categories: {
      selected: [],
      custom: []
    },
    templates: []
  });

  // ✅ NEW Step configuration - REDESIGNED ONBOARDING
  const steps = useMemo(() => [
    {
      id: 'profile',
      component: ProfileSetupStep,
      title: 'Profile Setup',
      icon: User,
      canSkip: false,
      required: true,
      estimatedTime: 3
    },
    {
      id: 'education',
      component: TransactionEducationStep,
      title: 'Transaction Education',
      icon: PieChart,
      canSkip: false,
      required: true,
      estimatedTime: 2
    },
    {
      id: 'recurring',
      component: QuickRecurringSetupStep,
      title: 'Quick Setup',
      icon: Target,
      canSkip: false,
      required: true,
      estimatedTime: 3
    },
    {
      id: 'completion',
      component: NewCompletionStep,
      title: 'Complete',
      icon: Check,
      canSkip: false,
      required: true,
      estimatedTime: 1
    }
  ], [t]);

  // ✅ Progress calculations
  const progress = useMemo(() => {
    const completed = currentStep + 1;
    const total = steps.length;
    const percentage = (completed / total) * 100;
    
    return {
      current: completed,
      total,
      percentage: Math.round(percentage),
      isComplete: currentStep >= steps.length - 1,
      estimatedTimeRemaining: steps
        .slice(currentStep + 1)
        .reduce((total, step) => total + step.estimatedTime, 0)
    };
  }, [currentStep, steps]);

  // ✅ Current step info
  const currentStepConfig = useMemo(() => {
    return steps[currentStep] || steps[0];
  }, [steps, currentStep]);

  // ✅ Validation logic
  const validateStep = useCallback((stepId, data) => {
    if (!enableValidation) return { isValid: true, errors: [] };

    const errors = [];

    switch (stepId) {
      case 'preferences':
        if (!data.language) {
          errors.push('Language selection is required');
        }
        if (!data.currency) {
          errors.push('Currency selection is required');
        }
        break;

      case 'categories':
        // Categories are optional, no validation needed
        break;

      case 'templates':
        // Templates are optional, no validation needed
        break;

      default:
        break;
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, [enableValidation]);

  // ✅ Step data update handler
  const updateStepData = useCallback((stepId, data, merge = true) => {
    setStepData(prev => {
      const newData = {
        ...prev,
        [stepId]: merge ? { ...prev[stepId], ...data } : data
      };

      // Validate the updated data
      if (enableValidation) {
        const validation = validateStep(stepId, newData[stepId]);
        if (!validation.isValid) {
          console.warn(`Step ${stepId} validation failed:`, validation.errors);
        }
      }

      return newData;
    });

    setHasUnsavedChanges(true);

    // Persist data if enabled
    if (persistData) {
      try {
        localStorage.setItem('onboarding_step_data', JSON.stringify(stepData));
      } catch (error) {
        console.warn('Failed to persist onboarding data:', error);
      }
    }
  }, [enableValidation, validateStep, persistData, stepData]);

  // ✅ Load persisted data on mount
  const loadPersistedData = useCallback(() => {
    if (!persistData) return;

    try {
      const saved = localStorage.getItem('onboarding_step_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        setStepData(prev => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.warn('Failed to load persisted onboarding data:', error);
    }
  }, [persistData]);

  // ✅ Clear persisted data
  const clearPersistedData = useCallback(() => {
    try {
      localStorage.removeItem('onboarding_step_data');
      setHasUnsavedChanges(false);
    } catch (error) {
      console.warn('Failed to clear persisted data:', error);
    }
  }, []);

  // ✅ Reset to initial state
  const resetOnboarding = useCallback(() => {
    setCurrentStep(initialStep);
    setIsCompleting(false);
    setStepData({
      preferences: {
        language: currentLanguage,
        currency: 'USD',
        theme: 'auto',
        dateFormat: 'MM/DD/YYYY',
        notifications: {
          email: true,
          push: true,
          sms: false,
          recurring: true,
          budgetAlerts: true
        }
      },
      categories: {
        selected: [],
        custom: []
      },
      templates: []
    });
    clearPersistedData();
  }, [initialStep, currentLanguage, clearPersistedData]);

  // ✅ Get step summary
  const getStepSummary = useCallback(() => {
    return {
      currentStep: currentStep + 1,
      totalSteps: steps.length,
      stepId: currentStepConfig.id,
      stepTitle: currentStepConfig.title,
      canSkip: currentStepConfig.canSkip,
      isRequired: currentStepConfig.required,
      progress: progress.percentage,
      estimatedTimeRemaining: progress.estimatedTimeRemaining,
      hasUnsavedChanges,
      isCompleting
    };
  }, [currentStep, steps.length, currentStepConfig, progress, hasUnsavedChanges, isCompleting]);

  // ✅ Get data for specific step
  const getStepData = useCallback((stepId) => {
    return stepData[stepId] || {};
  }, [stepData]);

  // ✅ Check if step has data
  const hasStepData = useCallback((stepId) => {
    const data = stepData[stepId];
    if (!data) return false;

    // Check if step has meaningful data
    switch (stepId) {
      case 'preferences':
        return Boolean(data.language || data.currency || data.theme !== 'auto');
      case 'categories':
        return Boolean(data.selected?.length > 0 || data.custom?.length > 0);
      case 'templates':
        return Boolean(data.length > 0);
      default:
        return Object.keys(data).length > 0;
    }
  }, [stepData]);

  return {
    // State
    currentStep,
    isCompleting,
    hasUnsavedChanges,
    stepData,
    steps,

    // Current step info
    currentStepConfig,
    progress,

    // Actions
    setCurrentStep,
    setIsCompleting,
    updateStepData,
    resetOnboarding,
    loadPersistedData,
    clearPersistedData,

    // Utilities
    validateStep,
    getStepSummary,
    getStepData,
    hasStepData,

    // Computed properties
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === steps.length - 1,
    canGoBack: currentStep > 0,
    canGoNext: currentStep < steps.length - 1
  };
}; 