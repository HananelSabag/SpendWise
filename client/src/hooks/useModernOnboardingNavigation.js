/**
 * 🧭 MODERN ONBOARDING NAVIGATION - Enhanced Navigation Hook
 * Improved navigation logic for 3-step onboarding with better UX
 * Features: Smart validation, Step transitions, Keyboard support
 * @version 4.0.0 - MODERN REDESIGN
 */

import { useCallback } from 'react';
import { useNotifications } from '../stores';

/**
 * 🧭 Modern Onboarding Navigation Hook
 */
export const useModernOnboardingNavigation = (onboardingState, options = {}) => {
  const {
    enableValidation = true,
    onNavigate = null,
    onComplete = null,
    onSkip = null
  } = options;

  const { addNotification } = useNotifications();

  const {
    currentStep,
    steps,
    stepData,
    isCompleting,
    setCurrentStep,
    currentStepConfig,
    validateStep,
    canGoBack,
    canGoNext,
    isFirstStep,
    isLastStep
  } = onboardingState;

  // ✅ Navigate to specific step with enhanced validation
  const goToStep = useCallback((stepIndex, force = false) => {
    if (stepIndex < 0 || stepIndex >= steps.length) {
      console.warn(`Invalid step index: ${stepIndex}`);
      return false;
    }

    // Enhanced validation for forward navigation
    if (enableValidation && !force && stepIndex > currentStep) {
      const validation = validateStep(currentStepConfig.id, stepData[currentStepConfig.id]);
      if (!validation.isValid) {
        addNotification({
          type: 'warning',
          message: validation.errors[0] || 'Please complete the current step before continuing',
          duration: 4000
        });
        return false;
      }
    }

    setCurrentStep(stepIndex);
    onNavigate?.(stepIndex, steps[stepIndex]);
    
    return true;
  }, [
    steps.length, 
    currentStep, 
    enableValidation, 
    validateStep, 
    currentStepConfig, 
    stepData, 
    setCurrentStep, 
    onNavigate, 
    addNotification
  ]);

  // ✅ Go to next step with enhanced validation
  const goNext = useCallback(() => {
    if (!canGoNext) {
      console.warn('Cannot go to next step - already at last step');
      return false;
    }

    // Validate current step before advancing
    if (enableValidation) {
      const validation = validateStep(currentStepConfig.id, stepData[currentStepConfig.id]);
      if (!validation.isValid) {
        addNotification({
          type: 'error',
          message: validation.errors[0] || 'Please complete the required fields',
          duration: 4000
        });
        return false;
      }
    }

    const success = goToStep(currentStep + 1);
    if (success) {
      // Provide positive feedback for successful step completion
      addNotification({
        type: 'success',
        message: `Step ${currentStep + 1} completed!`,
        duration: 2000
      });
    }
    
    return success;
  }, [
    canGoNext, 
    enableValidation, 
    validateStep, 
    currentStepConfig, 
    stepData, 
    goToStep, 
    currentStep, 
    addNotification
  ]);

  // ✅ Go to previous step (always allowed)
  const goBack = useCallback(() => {
    if (!canGoBack) {
      console.warn('Cannot go to previous step - already at first step');
      return false;
    }

    return goToStep(currentStep - 1, true); // Force navigation backwards
  }, [canGoBack, goToStep, currentStep]);

  // ✅ Skip current step (enhanced logic)
  const skipStep = useCallback(() => {
    if (!currentStepConfig.canSkip) {
      addNotification({
        type: 'warning',
        message: 'This step cannot be skipped',
        duration: 3000
      });
      return false;
    }

    if (isLastStep) {
      // If last step, treat skip as completion
      onComplete?.();
      return true;
    }

    // Skip to next step
    const success = goToStep(currentStep + 1, true); // Force skip
    
    if (success) {
      onSkip?.(currentStepConfig.id, currentStep);
      addNotification({
        type: 'info',
        message: `Skipped ${currentStepConfig.title}`,
        duration: 2000
      });
    }

    return success;
  }, [
    currentStepConfig, 
    isLastStep, 
    goToStep, 
    currentStep, 
    onSkip, 
    onComplete,
    addNotification
  ]);

  // ✅ Handle completion with validation
  const handleComplete = useCallback(() => {
    if (isCompleting) {
      console.warn('Completion already in progress');
      return false;
    }

    // Validate all required steps
    if (enableValidation) {
      const requiredSteps = steps.filter(step => step.required);
      for (const step of requiredSteps) {
        const validation = validateStep(step.id, stepData[step.id]);
        if (!validation.isValid) {
          addNotification({
            type: 'error',
            message: `Please complete required step: ${step.title}`,
            duration: 4000
          });
          return false;
        }
      }
    }

    onComplete?.();
    return true;
  }, [
    isCompleting, 
    enableValidation, 
    steps, 
    validateStep, 
    stepData, 
    onComplete, 
    addNotification
  ]);

  // ✅ Jump to step by ID
  const goToStepById = useCallback((stepId) => {
    const stepIndex = steps.findIndex(step => step.id === stepId);
    if (stepIndex === -1) {
      console.warn(`Step with ID '${stepId}' not found`);
      return false;
    }
    
    return goToStep(stepIndex);
  }, [steps, goToStep]);

  // ✅ Get navigation state
  const getNavigationState = useCallback(() => {
    return {
      currentStep: currentStep + 1,
      totalSteps: steps.length,
      canGoBack,
      canGoNext,
      canSkip: currentStepConfig.canSkip,
      isFirstStep,
      isLastStep,
      isCompleting,
      stepProgress: ((currentStep + 1) / steps.length) * 100
    };
  }, [
    currentStep, 
    steps.length, 
    canGoBack, 
    canGoNext, 
    currentStepConfig, 
    isFirstStep, 
    isLastStep, 
    isCompleting
  ]);

  return {
    // Navigation actions
    goToStep,
    goNext,
    goBack,
    skipStep,
    handleComplete,
    goToStepById,

    // State utilities
    getNavigationState,

    // Computed properties
    canGoBack,
    canGoNext,
    canSkip: currentStepConfig.canSkip,
    isFirstStep,
    isLastStep,

    // Enhanced properties for modern UI
    progress: ((currentStep + 1) / steps.length) * 100,
    stepInfo: {
      current: currentStep + 1,
      total: steps.length,
      title: currentStepConfig.title,
      subtitle: currentStepConfig.subtitle
    }
  };
};

