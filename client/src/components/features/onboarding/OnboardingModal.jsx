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
    isValid
  } = onboardingState;

  // ✅ Navigation logic with enhanced UX
  const {
    canGoNext,
    canGoPrevious,
    isLastStep,
    isFirstStep,
    goNext,
    goPrevious,
    goToStep,
    canSkip,
    handlePrimaryAction
  } = useOnboardingNavigation(onboardingState, {
    onComplete,
    onSkip
  });

  // ✅ Completion logic with fallback strategies
  const { completeOnboarding } = useOnboardingCompletion({
    setIsCompleting,
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
      const result = await completeOnboarding(stepData);
      if (result) {
        console.log('✅ OnboardingModal - Completion successful');
        onComplete?.();
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
            "bg-black/70 backdrop-blur-sm",
            "flex items-center justify-center",
            "p-4 sm:p-6 lg:p-8",
            "overflow-hidden"
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
              // ✅ ENHANCED: MUCH WIDER modal as requested
              "relative w-full h-full max-w-7xl max-h-[95vh]",
              "bg-white dark:bg-gray-900",
              "flex flex-col",
              
              // ✅ RESPONSIVE: Much wider across all screens
              "sm:h-auto sm:max-h-[90vh] sm:rounded-2xl",
              "md:max-w-6xl md:max-h-[85vh]",
              "lg:max-w-7xl lg:max-h-[90vh]",
              "xl:max-w-[90vw]", // ✅ SUPER WIDE on large screens
              "2xl:max-w-[85vw]",
              
              // ✅ ENHANCED: Better shadows and borders
              "shadow-2xl border border-gray-200 dark:border-gray-700",
              "sm:shadow-xl",
              
              // ✅ ENHANCED: Prevent content overflow
              "overflow-hidden",
              className
            )}
          >
            {/* ✅ ENHANCED: SHORTER Header with minimal padding */}
            <div className="flex-shrink-0 p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700">
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
              "p-8 sm:p-12 lg:p-16 xl:p-20", // ✅ MUCH MORE padding for wider content
              "min-h-0", // Important for flex child scrolling
              // ✅ ENHANCED: Better spacing for wider content
              "space-y-8"
            )}>
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
                  {currentStepConfig?.component}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* ✅ ENHANCED: Footer with consistent padding */}
            <div className="flex-shrink-0 p-6 sm:p-8 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <OnboardingFooter
                canGoPrevious={canGoPrevious}
                canGoNext={canGoNext}
                canSkip={canSkip}
                isFirstStep={isFirstStep}
                isLastStep={isLastStep}
                isCompleting={isCompleting}
                onPrevious={goPrevious}
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