/**
 * 🎯 MODERN ONBOARDING MODAL - Complete 3-Step Redesign
 * Enhanced UI/UX with only 3 essential steps and better navigation
 * Features: Profile+Preferences, Education, Templates
 * @version 4.0.0 - MODERN REDESIGN
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

// ✅ Import our modern hooks and components
import { useModernOnboardingState } from '../../../hooks/useModernOnboardingState';
import { useOnboardingNavigation } from '../../../hooks/useOnboardingNavigation';
import { useOnboardingCompletion } from '../../../hooks/useOnboardingCompletion';

// ✅ Import modern components
import ModernOnboardingHeader from './components/ModernOnboardingHeader';
import ModernOnboardingFooter from './components/ModernOnboardingFooter';

// ✅ Import stores
import { useTranslation } from '../../../stores';

import { cn } from '../../../utils/helpers';

/**
 * 🎯 Modern Onboarding Modal - 3-Step Design
 */
const ModernOnboardingModal = ({ 
  isOpen = false, 
  onClose, 
  onComplete,
  onSkip,
  forceShow = false,
  previewOnly = false,
  className = ''
}) => {
  const { t, isRTL } = useTranslation('onboarding');

  // ✅ Initialize modern onboarding state (3 steps only)
  const onboardingState = useModernOnboardingState({
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
    isCompleted,
    setIsCompleted,
    getStepData,
    updateStepData,
    validateStep
  } = onboardingState;

  // ✅ Enhanced navigation logic
  const {
    canGoNext,
    canGoPrevious,
    isLastStep,
    isFirstStep,
    goNext,
    goBack,
    goToStep
  } = useOnboardingNavigation(onboardingState, {
    onComplete,
    onSkip
  });

  // ✅ Completion logic
  const { completeOnboarding } = useOnboardingCompletion(stepData, {
    onSuccess: onComplete,
    onError: (error) => {
      console.error('Modern onboarding completion failed:', error);
    }
  });

  // ✅ Handle completion
  const handleComplete = async () => {
    console.log('🎯 ModernOnboardingModal - Handling completion');
    console.log('🎯 ModernOnboardingModal - previewOnly mode:', previewOnly);
    console.log('🎯 ModernOnboardingModal - Current stepData:', stepData);
    console.log('🎯 ModernOnboardingModal - Templates data:', stepData?.templates);
    
    try {
      if (previewOnly) {
        console.log('⚠️ ModernOnboardingModal - PREVIEW ONLY MODE - Skipping template saving!');
        onComplete?.();
        onClose?.();
        return;
      }
      
      // Set loading state
      setIsCompleting(true);
      console.log('🔄 ModernOnboardingModal - Calling completeOnboarding...');
      
      const result = await completeOnboarding();
      console.log('🔄 ModernOnboardingModal - completeOnboarding result:', result);
      
      if (result) {
        console.log('✅ ModernOnboardingModal - Completion successful');
        
        // ✅ Show success state
        setIsCompleted(true);
        
        // ✅ ENHANCED: Add a small delay to show success state before closing
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Call success callbacks
        onComplete?.();
        onClose?.();
      } else {
        console.log('❌ ModernOnboardingModal - Completion returned false');
        // Don't close modal on failure, let user retry
      }
    } catch (error) {
      console.error('❌ ModernOnboardingModal - Completion failed:', error);
      console.error('❌ ModernOnboardingModal - Error stack:', error.stack);
      // Don't close modal on error, let user retry
    } finally {
      // Always clear loading state
      setIsCompleting(false);
    }
  };

  // ✅ Handle "Finish Now" from step 1
  const handleFinishNow = async () => {
    console.log('🚀 ModernOnboardingModal - Quick finish from step 1');
    
    // Validate current step first
    const validation = validateStep(currentStepConfig.id, stepData[currentStepConfig.id]);
    if (!validation.isValid) {
      console.warn('Step 1 validation failed:', validation.errors);
      return;
    }
    
    // Complete with minimal data
    await handleComplete();
  };

  // ✅ Enhanced modal variants
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
      scale: 0.9,
      y: 20
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
      scale: 0.9,
      y: 20,
      transition: { duration: 0.2 }
    }
  };

  // ✅ Check if current step is valid
  const isCurrentStepValid = React.useMemo(() => {
    const validation = validateStep(currentStepConfig.id, stepData[currentStepConfig.id]);
    return validation.isValid;
  }, [validateStep, currentStepConfig.id, stepData]);

  if (!isOpen && !forceShow) {
    return null;
  }

  const modalContent = (
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
            if (e.target === e.currentTarget) {
              onClose?.();
            }
          }}
        >
          <motion.div
            variants={modalVariants}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "absolute inset-4 sm:inset-8",
              "rounded-xl overflow-hidden shadow-2xl",
              "bg-white dark:bg-gray-900",
              "flex flex-col",
              "max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)]",
              className
            )}
          >
            {/* ✅ Enhanced header with X button */}
            <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <ModernOnboardingHeader
                currentStep={currentStep}
                totalSteps={steps.length}
                progress={progress.percentage}
                title={currentStepConfig?.title || t('title') || 'Welcome to SpendWise'}
                subtitle={currentStepConfig?.subtitle || t('subtitle') || 'Let\'s set up your account'}
                canClose={!isCompleting}
                onClose={onClose}
                isRTL={isRTL}
              />
            </div>

            {/* ✅ Content area with optimal spacing */}
            <div className={cn(
              "flex-1 overflow-y-auto",
              "p-4 sm:p-6",
              "min-h-0" // Important for flex child scrolling
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

            {/* ✅ Enhanced footer with new navigation */}
            <div className="flex-shrink-0">
              <ModernOnboardingFooter
                currentStep={currentStep}
                totalSteps={steps.length}
                canGoPrevious={canGoPrevious}
                canGoNext={canGoNext && isCurrentStepValid}
                isCompleting={isCompleting}
                onPrevious={goBack}
                onNext={goNext}
                onComplete={handleComplete}
                onFinishNow={handleFinishNow}
                isRTL={isRTL}
                isValid={isCurrentStepValid}
                isCompleted={isCompleted}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Render into portal to avoid stacking issues
  const portalTarget = document.getElementById('portal-root') || document.body;
  return createPortal(modalContent, portalTarget);
};

export default ModernOnboardingModal;
