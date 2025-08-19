/**
 * 🎯 MODERN ONBOARDING STATE - NEW 3-STEP DESIGN
 * Enhanced UX with only 3 essential steps
 * Features: Profile+Preferences, Education, Templates
 * @version 4.0.0 - MODERN REDESIGN
 */

import { useState, useCallback, useMemo } from 'react';
import { 
  User, GraduationCap, Zap, Check
} from 'lucide-react';

// ✅ Import stores and components
import { useTranslation, useAuth } from '../stores';

// Import NEW modern step components
import ModernProfileStep from '../components/features/onboarding/steps/ModernProfileStep';
import ModernEducationStep from '../components/features/onboarding/steps/ModernEducationStep';
import FinalTemplatesStep from '../components/features/onboarding/steps/FinalTemplatesStep';

/**
 * 🎯 Modern 3-Step Onboarding State Hook
 */
export const useModernOnboardingState = (options = {}) => {
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

  // ✅ Auto-populate names from email for new users
  const getNameFromEmail = (email) => {
    if (!email) return { firstName: '', lastName: '' };
    const username = email.split('@')[0];
    const parts = username.split(/[._-]/);
    if (parts.length >= 2) {
      return {
        firstName: parts[0].charAt(0).toUpperCase() + parts[0].slice(1),
        lastName: parts[1].charAt(0).toUpperCase() + parts[1].slice(1)
      };
    }
    return {
      firstName: username.charAt(0).toUpperCase() + username.slice(1),
      lastName: ''
    };
  };

  const emailNames = getNameFromEmail(user?.email);

  // ✅ Enhanced step data management - 3 steps only
  const [stepData, setStepData] = useState({
    // Step 1: Profile + Preferences (combined)
    profile: {
      profilePicture: user?.profilePicture || user?.profile_picture_url || user?.avatar || null,
      firstName: user?.firstName || user?.first_name || emailNames.firstName,
      lastName: user?.lastName || user?.last_name || emailNames.lastName,
      password: '',
      confirmPassword: '',
      language: currentLanguage || 'en',
      currency: 'USD',
      theme: 'auto'
    },
    // Step 2: Education (understanding concepts)
    education: {
      understoodTransactionTypes: false,
      understoodBalancePanel: false,
      selectedExamples: []
    },
    // Step 3: Templates (quick setup)
    templates: {
      selectedTemplates: [],
      customAmounts: {},
      summary: null
    }
  });

  // ✅ NEW 3-Step configuration - MODERN DESIGN
  const steps = useMemo(() => [
    {
      id: 'profile',
      component: ModernProfileStep,
      title: t('steps.profile.title') || 'Profile & Preferences',
      subtitle: t('steps.profile.subtitle') || 'Set up your profile and preferences',
      icon: User,
      canSkip: false,
      required: true,
      estimatedTime: 2
    },
    {
      id: 'education', 
      component: ModernEducationStep,
      title: t('steps.education.title') || 'Learn the Basics',
      subtitle: t('steps.education.subtitle') || 'Understand transactions and balance tracking',
      icon: GraduationCap,
      canSkip: false,
      required: false,
      estimatedTime: 2
    },
    {
      id: 'templates',
      component: FinalTemplatesStep,
      title: t('steps.templates.title') || 'Quick Setup',
      subtitle: t('steps.templates.subtitle') || 'Add recurring transactions in seconds',
      icon: Zap,
      canSkip: false,
      required: false,
      estimatedTime: 3
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

  // ✅ Enhanced validation logic for 3 steps
  const validateStep = useCallback((stepId, data) => {
    if (!enableValidation) return { isValid: true, errors: [] };

    const errors = [];

    switch (stepId) {
      case 'profile':
        // First and last name are optional now
        if (!data.language) {
          errors.push('Language selection is required');
        }
        if (!data.currency) {
          errors.push('Currency selection is required');
        }
                        // ✅ SIMPLIFIED: Use ACTUAL database values instead of guesswork
                const isGoogleUser = !!(user?.oauth_provider === 'google' || user?.google_id);
                const hasPassword = !!(user?.hasPassword || user?.has_password);
                const isHybridUser = isGoogleUser && hasPassword; // Simple: Google + Password = Hybrid
                const isEmailOnlyUser = hasPassword && !isGoogleUser; // Email only
                const isGoogleOnlyUser = isGoogleUser && !hasPassword; // Google only

                // Authentication setup requirements
                const needsPassword = isGoogleOnlyUser; // Only Google-only users need password setup
                const canLinkGoogle = isEmailOnlyUser;   // Only email-only users can link Google
        
        // ✅ Password is now OPTIONAL - users can proceed without setting it
        if (needsPassword && data.password) {
          // Only validate password if user chooses to set one
          if (data.password.length < 8) {
            errors.push('Password must be at least 8 characters');
          }
          if (data.password !== data.confirmPassword) {
            errors.push('Passwords do not match');
          }
        }
        break;

      case 'education':
        // Education step is optional - no validation required
        break;

      case 'templates':
        // Templates are optional - no validation required
        // But we could add minimum template validation if needed
        break;

      default:
        break;
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, [enableValidation, user]);

  // ✅ Enhanced step data update handler
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
        localStorage.setItem('modern_onboarding_step_data', JSON.stringify(stepData));
      } catch (error) {
        console.warn('Failed to persist onboarding data:', error);
      }
    }
  }, [enableValidation, validateStep, persistData, stepData]);

  // ✅ Load persisted data on mount
  const loadPersistedData = useCallback(() => {
    if (!persistData) return;

    try {
      const saved = localStorage.getItem('modern_onboarding_step_data');
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
      localStorage.removeItem('modern_onboarding_step_data');
      localStorage.removeItem('onboarding_step_data'); // Clear old data too
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
      profile: {
        profilePicture: user?.profilePicture || user?.profile_picture_url || user?.avatar || null,
        firstName: user?.firstName || user?.first_name || emailNames.firstName,
        lastName: user?.lastName || user?.last_name || emailNames.lastName,
        password: '',
        confirmPassword: '',
        language: currentLanguage || 'en',
        currency: 'USD',
        theme: 'auto'
      },
      education: {
        understoodTransactionTypes: false,
        understoodBalancePanel: false,
        selectedExamples: []
      },
      templates: {
        selectedTemplates: [],
        customAmounts: {},
        summary: null
      }
    });
    clearPersistedData();
  }, [initialStep, user, currentLanguage, clearPersistedData]);

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
      case 'profile':
        return Boolean(data.firstName?.trim() || data.lastName?.trim() || data.language || data.currency);
      case 'education':
        return Boolean(data.understoodTransactionTypes || data.understoodBalancePanel);
      case 'templates':
        return Boolean(data.selectedTemplates?.length > 0);
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
