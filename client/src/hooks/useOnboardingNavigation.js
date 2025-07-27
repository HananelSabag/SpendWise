/**
 * 🧭 USE ONBOARDING NAVIGATION - Navigation Logic Hook
 * Centralized navigation, keyboard controls, and step transitions
 * Features: Smart navigation, Keyboard shortcuts, Skip logic, Validation checks
 * @version 3.0.0 - ONBOARDING REDESIGN
 */

import { useCallback, useEffect } from 'react';
import { useNotifications } from '../stores';

/**
 * 🧭 Onboarding Navigation Hook
 */
export const useOnboardingNavigation = (onboardingState, options = {}) => {
  const {
    enableKeyboard = true,
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

  // ✅ Navigate to specific step
  const goToStep = useCallback((stepIndex, force = false) => {
    if (stepIndex < 0 || stepIndex >= steps.length) {
      console.warn(`Invalid step index: ${stepIndex}`);
      return false;
    }

    // Validate current step before navigation (unless forced)
    if (enableValidation && !force && stepIndex > currentStep) {
      const validation = validateStep(currentStepConfig.id, stepData[currentStepConfig.id]);
      if (!validation.isValid) {
        addNotification({
          type: 'warning',
          message: `Please complete the current step before continuing`,
          duration: 3000
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

  // ✅ Go to next step
  const goNext = useCallback(() => {
    if (!canGoNext) {
      console.warn('Cannot go to next step - already at last step');
      return false;
    }

    // Validate current step
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

    return goToStep(currentStep + 1);
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

  // ✅ Go to previous step
  const goBack = useCallback(() => {
    if (!canGoBack) {
      console.warn('Cannot go to previous step - already at first step');
      return false;
    }

    return goToStep(currentStep - 1, true); // Force navigation backwards
  }, [canGoBack, goToStep, currentStep]);

  // ✅ Skip current step
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
      return handleComplete();
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
    addNotification
  ]);

  // ✅ Handle completion
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
      isCompleting
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

  // ✅ Keyboard navigation
  useEffect(() => {
    if (!enableKeyboard) return;

    const handleKeyDown = (e) => {
      // Don't handle if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
          if (canGoNext) {
            e.preventDefault();
            goNext();
          }
          break;

        case 'ArrowLeft':
        case 'PageUp':
          if (canGoBack) {
            e.preventDefault();
            goBack();
          }
          break;

        case 'Enter':
          if (isLastStep) {
            e.preventDefault();
            handleComplete();
          } else if (canGoNext) {
            e.preventDefault();
            goNext();
          }
          break;

        case 'Escape':
          if (currentStepConfig.canSkip) {
            e.preventDefault();
            skipStep();
          }
          break;

        case ' ': // Spacebar
          if (currentStepConfig.canSkip) {
            e.preventDefault();
            skipStep();
          }
          break;

        // Number keys to jump to steps
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          const stepIndex = parseInt(e.key) - 1;
          if (stepIndex < steps.length) {
            e.preventDefault();
            goToStep(stepIndex);
          }
          break;

        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    enableKeyboard,
    canGoNext,
    canGoBack,
    isLastStep,
    currentStepConfig,
    steps.length,
    goNext,
    goBack,
    handleComplete,
    skipStep,
    goToStep
  ]);

  // ✅ Auto-advance logic (optional)
  const enableAutoAdvance = useCallback((stepId, delay = 2000) => {
    const timer = setTimeout(() => {
      if (currentStepConfig.id === stepId && canGoNext) {
        goNext();
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [currentStepConfig.id, canGoNext, goNext]);

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
    enableAutoAdvance,

    // Computed properties
    canGoBack,
    canGoNext,
    canSkip: currentStepConfig.canSkip,
    isFirstStep,
    isLastStep,

    // Keyboard shortcuts info (for help/tooltips)
    keyboardShortcuts: {
      next: 'Arrow Right / Page Down / Enter',
      back: 'Arrow Left / Page Up',
      skip: 'Escape / Space',
      jumpToStep: 'Number keys (1-9)'
    }
  };
}; 