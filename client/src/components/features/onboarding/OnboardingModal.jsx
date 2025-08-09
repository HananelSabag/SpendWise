/**
 * 🎯 ONBOARDING MODAL - ENHANCED UI/UX VERSION  
 * WIDER modal, shorter header, better responsive design
 * @version 5.1.0 - WIDER + SHORTER HEADER + TRANSLATION DEBUG
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ✅ Import our clean hooks
import { useOnboardingState } from '../../../hooks/useOnboardingState';
import { useOnboardingNavigation } from '../../../hooks/useOnboardingNavigation';
import { useOnboardingCompletion } from '../../../hooks/useOnboardingCompletion';

// ✅ Import our clean components
import OnboardingHeader from './components/OnboardingHeader';
import OnboardingFooter from './components/OnboardingFooter';

// ✅ Import stores
import { useTranslation } from '../../../stores';

import { cn } from '../../../utils/helpers';

/**
 * 🎯 Enhanced Onboarding Modal - WIDER & SHORTER HEADER
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

  // ✅ DEBUG: Check if translations are working
  React.useEffect(() => {
    console.log('🔍 OnboardingModal translation debug:', {
      namespace: 'onboarding',
      titleTranslation: t('title'),
      welcomeTitleTranslation: t('welcome.title'),
      modalNextTranslation: t('modal.next'),
      isTranslationFunctionWorking: typeof t === 'function'
    });
  }, [t]);

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
    isCompleting,
    hasChanges,
    isValid,
    getStepData,
    updateStepData
  } = onboardingState;

  // ✅ Navigation logic with enhanced UX
  const {
    canGoNext,
    canGoPrevious,
    isLastStep,
    isFirstStep,
    goNext,
    goBack,
    goToStep,
    canSkip,
    handlePrimaryAction
  } = useOnboardingNavigation(onboardingState, {
    onComplete,
    onSkip
  });

  // ✅ Completion logic with fallback strategies
  const { completeOnboarding } = useOnboardingCompletion(stepData, {
    onSuccess: onComplete,
    onError: (error) => {
      console.error('Onboarding completion failed:', error);
    }
  });

  // ✅ Handle completion
  const handleComplete = async () => {
    console.log('🎯 OnboardingModal - Handling completion');
    try {
      setIsCompleting(true);
      const result = await completeOnboarding();
      if (result) {
        console.log('✅ OnboardingModal - Completion successful');
        onComplete?.();
        // Ensure the modal actually closes after finishing
        onClose?.();
      }
    } catch (error) {
      console.error('❌ OnboardingModal - Completion failed:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  // ✅ Enhanced modal variants for better animations
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  const modalVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      y: 50
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300,
        duration: 0.4
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      y: 50,
      transition: { duration: 0.2 }
    }
  };

  if (!isOpen && !forceShow) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {(isOpen || forceShow) && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn(
            "fixed inset-0 z-50",
            "bg-black/70 backdrop-blur-sm"
          )}
          onClick={(e) => {
            // Only close on backdrop click, not on modal content click
            if (e.target === e.currentTarget) {
              onClose?.();
            }
          }}
        >
          <motion.div
            variants={modalVariants}
            onClick={(e) => e.stopPropagation()} // Prevent backdrop click
            className={cn(
              "absolute inset-4 sm:inset-8",
              "rounded-xl overflow-hidden shadow-2xl",
              "bg-white dark:bg-gray-900",
              "flex flex-col",
              className
            )}
          >
            {/* Compact header padding with subtle light-blue background */}
            <div className="flex-shrink-0 p-2 sm:p-3 border-b border-gray-200 dark:border-gray-700 bg-blue-50/60 dark:bg-blue-900/10">
              <OnboardingHeader
                currentStep={currentStep}
                totalSteps={steps.length}
                progress={progress}
                title={currentStepConfig?.title || t('title') || 'Welcome to SpendWise'}
                subtitle={currentStepConfig?.subtitle || t('subtitle') || 'Let\'s set up your account'}
                canClose={!isCompleting}
                onClose={onClose}
                isRTL={isRTL}
                compact={true} // ✅ NEW: Compact mode for shorter header
              />
            </div>

            {/* ✅ ENHANCED: Content area with MORE horizontal space */}
            <div className={cn(
              "flex-1 overflow-y-auto",
              // Much tighter content padding to maximize vertical space
              "p-4 sm:p-6 md:p-8",
              "min-h-0", // Important for flex child scrolling
              // ✅ ENHANCED: Better spacing for wider content
              "space-y-8"
            )}>
              {/* Single child only to satisfy AnimatePresence with mode="wait" */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
                  transition={{ 
                    duration: 0.3,
                    ease: "easeInOut"
                  }}
                  className="w-full h-full"
                >
                  {(() => {
                    const StepComponent = currentStepConfig?.component;
                    if (!StepComponent) return null;
                    return (
                      <StepComponent
                        data={getStepData(currentStepConfig.id)}
                        onDataUpdate={(data) => updateStepData(currentStepConfig.id, data)}
                        onNext={goNext}
                        onBack={goBack}
                      />
                    );
                  })()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Compact footer padding */}
            <div className="flex-shrink-0 p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <OnboardingFooter
                canGoPrevious={canGoPrevious}
                canGoNext={canGoNext}
                canSkip={canSkip}
                isFirstStep={isFirstStep}
                isLastStep={isLastStep}
                isCompleting={isCompleting}
                onPrevious={goBack}
                onNext={goNext}
                onSkip={onSkip}
                onComplete={handleComplete}
                primaryActionText={
                  isLastStep 
                    ? (isCompleting ? t('modal.completing') || 'Completing...' : t('modal.finish') || 'Complete Setup')
                    : t('modal.next') || 'Next'
                }
                isRTL={isRTL}
                showSkipButton={true} // ✅ Always show skip button as requested
                showCompleteButton={true} // ✅ Always show complete button as requested
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OnboardingModal; 