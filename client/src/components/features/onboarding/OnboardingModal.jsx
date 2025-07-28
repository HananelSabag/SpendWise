/**
 * �� ONBOARDING MODAL - CLEAN ORCHESTRATOR
 * COMPLETELY REFACTORED from 491-line file to clean orchestrator
 * Features: Hook-based architecture, Extracted components, Mobile-first, Performance optimized
 * @version 4.0.0 - COMPLETE REDESIGN SUCCESS! 🎉
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ✅ Import our NEW clean hooks
import { useOnboardingState } from '../../../hooks/useOnboardingState';
import { useOnboardingNavigation } from '../../../hooks/useOnboardingNavigation';
import { useOnboardingCompletion } from '../../../hooks/useOnboardingCompletion';

// ✅ Import our NEW clean components
import OnboardingHeader from './components/OnboardingHeader';
import OnboardingFooter from './components/OnboardingFooter';

// ✅ Import stores
import { useTranslation } from '../../../stores';

import { cn } from '../../../utils/helpers';

/**
 * 🎯 Onboarding Modal - Clean Orchestrator
 */
const OnboardingModal = ({ 
  isOpen = false, 
  onClose, 
  onComplete,
  onSkip,
  forceShow = false,
  className = ''
}) => {
  const { t, isRTL } = useTranslation('onboarding');

  // ✅ Initialize onboarding state
  const onboardingState = useOnboardingState({
    enableValidation: true,
    persistData: true
  });

  const {
    currentStep,
    stepData,
    steps,
    currentStepConfig,
    progress,
    setIsCompleting,
    loadPersistedData,
    clearPersistedData,
    resetOnboarding
  } = onboardingState;

  // ✅ Initialize completion logic
  const completion = useOnboardingCompletion(stepData, {
    enableRetry: true,
    maxRetries: 3,
    onSuccess: () => {
      clearPersistedData();
      onComplete?.();
    },
    onError: (error) => {
      console.error('Onboarding completion failed:', error);
      setIsCompleting(false);
    }
  });

  // ✅ Initialize navigation
  const navigation = useOnboardingNavigation(onboardingState, {
    enableKeyboard: isOpen,
    enableValidation: true,
    onComplete: () => {
      setIsCompleting(true);
      completion.completeOnboarding();
    },
    onNavigate: (stepIndex) => {
      console.log(`Navigated to step ${stepIndex + 1}`);
    }
  });

  // ✅ Handle modal close/skip
  const handleClose = () => {
    if (currentStepConfig.canSkip || forceShow) {
      if (onboardingState.hasUnsavedChanges) {
        const confirmed = window.confirm(t('modal.unsavedChanges'));
        if (!confirmed) return;
      }
      
      resetOnboarding();
      onClose?.();
    }
  };

  // ✅ Load persisted data on mount
  React.useEffect(() => {
    if (isOpen) {
      loadPersistedData();
    }
  }, [isOpen, loadPersistedData]);

  // ✅ Don't render if not open
  if (!isOpen) return null;

  // ✅ Get current step component
  const StepComponent = currentStepConfig.component;

  // ✅ Animation variants
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 30 }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9, 
      y: 20,
      transition: { duration: 0.2 }
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const contentVariants = {
    hidden: { opacity: 0, x: isRTL ? -20 : 20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.2 }
    },
    exit: { 
      opacity: 0, 
      x: isRTL ? 20 : -20,
      transition: { duration: 0.15 }
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        style={{ direction: isRTL ? 'rtl' : 'ltr' }}
        onClick={handleClose}
      >
        {/* ✅ FIXED: Single modal container without double backdrop */}
        <motion.div
          variants={modalVariants}
          onClick={(e) => e.stopPropagation()} // Prevent backdrop click
          className={cn(
            "relative w-full h-full max-w-4xl max-h-[95vh]",
            "bg-white dark:bg-gray-900",
            "flex flex-col",
            "md:rounded-2xl md:shadow-2xl md:h-auto md:max-h-[90vh]",
            "md:border md:border-gray-200 md:dark:border-gray-700",
            "overflow-hidden", // ✅ FIX: Prevent content bleeding
            className
          )}
        >
          {/* Header - Progress and title */}
          <OnboardingHeader
            currentStep={currentStep + 1}
            totalSteps={steps.length}
            progress={progress.percentage}
            stepTitle={currentStepConfig.title}
            stepIcon={currentStepConfig.icon}
            estimatedTimeRemaining={progress.estimatedTimeRemaining}
            onClose={handleClose}
            showCloseButton={currentStepConfig.canSkip || forceShow}
            showProgress={true}
            showEstimatedTime={progress.estimatedTimeRemaining > 0}
          />

          {/* Step content - Mobile optimized scrolling */}
          <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="h-full"
              >
                <StepComponent
                  data={onboardingState.getStepData(currentStepConfig.id)}
                  onDataUpdate={(data, merge) => 
                    onboardingState.updateStepData(currentStepConfig.id, data, merge)
                  }
                  onNext={navigation.goNext}
                  onBack={navigation.goBack}
                  onComplete={navigation.handleComplete}
                  isFirstStep={navigation.isFirstStep}
                  isLastStep={navigation.isLastStep}
                  isCompleting={completion.isCompleting}
                  
                  // Additional props for enhanced step components
                  stepIndex={currentStep}
                  totalSteps={steps.length}
                  canSkip={currentStepConfig.canSkip}
                  estimatedTime={currentStepConfig.estimatedTime}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer - Navigation controls */}
          <OnboardingFooter
            canGoBack={navigation.canGoBack}
            canGoNext={navigation.canGoNext}
            canSkip={navigation.canSkip}
            isFirstStep={navigation.isFirstStep}
            isLastStep={navigation.isLastStep}
            isCompleting={completion.isCompleting}
            
            onBack={navigation.goBack}
            onNext={navigation.goNext}
            onSkip={navigation.skipStep}
            onComplete={navigation.handleComplete}
            
            showBackButton={true}
            showSkipButton={true}
            currentStep={currentStep + 1}
            totalSteps={steps.length}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingModal; 