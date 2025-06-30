/**
 * OnboardingModal Component - Beautiful Full-Screen Onboarding Experience
 * 
 * ✅ FEATURES:
 * - Multi-step wizard with smooth animations
 * - Beautiful gradient design matching app theme
 * - Mobile responsive and RTL support
 * - Progress indicator
 * - Skip options at every step
 * - Local storage for progress
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronRight, ChevronLeft, Check, Sparkles, 
  Heart, Zap, Shield, Target, ArrowRight, Play
} from 'lucide-react';

import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../context/AuthContext';
import { cn } from '../../../utils/helpers';
import { Button } from '../../ui';

// Import onboarding steps
import WelcomeStep from './steps/WelcomeStep';
import PreferencesStep from './steps/PreferencesStep';
import RecurringExplanationStep from './steps/RecurringExplanationStep';
import InitialTemplatesStep from './steps/InitialTemplatesStep';

/**
 * OnboardingModal - Beautiful Multi-Step Onboarding Experience
 */
const OnboardingModal = ({ 
  isOpen, 
  onClose, 
  onComplete,
  forceShow = false // For re-showing onboarding from help menu
}) => {
  const { t, language } = useLanguage();
  const { user, markOnboardingComplete, refreshProfile } = useAuth();
  const isRTL = language === 'he';
  
  // State management
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [stepData, setStepData] = useState({
    preferences: {},
    templates: []
  });

  // Onboarding steps configuration
  const steps = [
    {
      id: 'welcome',
      title: t('onboarding.welcome.title'),
      component: WelcomeStep,
      skippable: false
    },
    {
      id: 'recurring',
      title: t('onboarding.recurring.title'),
      component: RecurringExplanationStep,
      skippable: true
    },
    {
      id: 'templates',
      title: t('onboarding.templates.title'),
      component: InitialTemplatesStep,
      skippable: true
    }
  ];

  // Debug current step changes
  useEffect(() => {
    console.log(`🚀 [ONBOARDING] Current step changed to: ${currentStep} (${steps[currentStep]?.id || 'undefined'})`);
    console.log(`🚀 [ONBOARDING] Steps array:`, steps.map(s => s.id));
  }, [currentStep, steps]);

  // Load saved progress from localStorage
  useEffect(() => {
    if (isOpen) {
      const savedProgress = localStorage.getItem('spendwise-onboarding-progress');
      console.log(`🚀 [ONBOARDING] Loading saved progress:`, savedProgress);
      
      if (savedProgress) {
        try {
          const { step, data } = JSON.parse(savedProgress);
          console.log(`🚀 [ONBOARDING] Parsed progress:`, { step, data, forceShow });
          
          if (!forceShow) {
            setCurrentStep(step || 0);
            setStepData(data || { preferences: {}, templates: [] });
            console.log(`🚀 [ONBOARDING] Restored to step ${step || 0}`);
          }
        } catch (error) {
          console.warn('Failed to load onboarding progress:', error);
        }
      }
    }
  }, [isOpen, forceShow]);

  // Save progress to localStorage
  const saveProgress = (stepOverride = null) => {
    const progress = {
      step: stepOverride !== null ? stepOverride : currentStep,
      data: stepData,
      timestamp: Date.now()
    };
    console.log(`🚀 [ONBOARDING] Saving progress:`, progress);
    localStorage.setItem('spendwise-onboarding-progress', JSON.stringify(progress));
  };

  // Navigation handlers
  const goToNextStep = () => {
    console.log(`🚀 [ONBOARDING] goToNextStep called. Current: ${currentStep}, Total: ${steps.length}`);
    
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      console.log(`🚀 [ONBOARDING] Moving to step ${nextStep}`);
      setCurrentStep(nextStep);
      console.log(`🚀 [ONBOARDING] setCurrentStep(${nextStep}) called`);
      
      // ✅ FIX: Save progress with the new step immediately
      saveProgress(nextStep);
    } else {
      console.log(`🚀 [ONBOARDING] Last step reached, completing onboarding`);
      handleComplete();
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      saveProgress(prevStep);
    }
  };

  const goToStep = (stepIndex) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex);
      saveProgress(stepIndex);
    }
  };

  // Skip current step
  const skipStep = () => {
    console.log(`🚀 [ONBOARDING] skipStep called from step ${currentStep}`);
    goToNextStep();
  };

  // Update step data
  const updateStepData = (key, value) => {
    console.log(`🚀 [ONBOARDING] updateStepData called:`, { key, value });
    setStepData(prev => {
      const newData = { ...prev, [key]: value };
      console.log(`🚀 [ONBOARDING] stepData updated:`, newData);
      return newData;
    });
  };

  // Complete onboarding
  const handleComplete = async () => {
    console.log(`🚀 [ONBOARDING] handleComplete called, isCompleting: ${isCompleting}`);
    
    if (isCompleting) return;
    
    setIsCompleting(true);
    
    try {
      console.log(`🚀 [ONBOARDING] Marking onboarding as complete... User ID: ${user?.id}`);
      // Mark onboarding as complete in the backend
      const result = await markOnboardingComplete();
      console.log(`🚀 [ONBOARDING] API response:`, result);
      
      // Clear saved progress
      localStorage.removeItem('spendwise-onboarding-progress');
      
      // ✅ FIX: Clear the onboarding-skipped flag if it exists
      localStorage.removeItem('spendwise-onboarding-skipped');
      
      console.log(`🚀 [ONBOARDING] Progress cleared, calling completion callback`);
      
      // ✅ FIX: Force refresh user data to ensure onboarding_completed is updated
      if (refreshProfile) {
        console.log(`🚀 [ONBOARDING] Refreshing profile...`);
        await refreshProfile();
        console.log(`🚀 [ONBOARDING] Profile refreshed`);
      }
      
      // Call completion callback
      onComplete?.();
      
      // Close modal
      onClose();
      console.log(`🚀 [ONBOARDING] Onboarding completed successfully`);
    } catch (error) {
      console.error('❌ [ONBOARDING] Failed to complete onboarding:', error);
      console.error('❌ [ONBOARDING] Error details:', error.response?.data || error.message);
      // Still close modal to avoid user being stuck
      onClose();
    } finally {
      setIsCompleting(false);
    }
  };

  // ✅ NEW: Handle onboarding skip
  const handleSkipOnboarding = async () => {
    try {
      console.log(`🚀 [ONBOARDING] Skipping onboarding... User ID: ${user?.id}`);
      
      // Mark onboarding as complete in backend
      const result = await markOnboardingComplete();
      console.log(`🚀 [ONBOARDING] Skip API response:`, result);
      
      // Clear progress and mark as skipped
      localStorage.removeItem('spendwise-onboarding-progress');
      localStorage.setItem('spendwise-onboarding-skipped', 'true');
      
      // Force refresh user data
      if (refreshProfile) {
        console.log(`🚀 [ONBOARDING] Refreshing profile after skip...`);
        await refreshProfile();
        console.log(`🚀 [ONBOARDING] Profile refreshed after skip`);
      }
      
      // Call completion callback and close
      onComplete?.();
      onClose();
      
      console.log(`🚀 [ONBOARDING] Onboarding skipped successfully`);
    } catch (error) {
      console.error('❌ [ONBOARDING] Failed to skip onboarding:', error);
      console.error('❌ [ONBOARDING] Skip error details:', error.response?.data || error.message);
      // Still close to avoid user being stuck
      onClose();
    }
  };

  // Close handler with confirmation if in progress
  const handleClose = () => {
    if (currentStep > 0 && !forceShow) {
      const confirmMessage = t('onboarding.exitConfirm');
      
      if (window.confirm(confirmMessage)) {
        saveProgress(currentStep);
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Don't render if not open
  if (!isOpen) return null;

  const CurrentStepComponent = steps[currentStep]?.component;
  const currentStepConfig = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  console.log(`🚀 [ONBOARDING] Rendering step ${currentStep}:`, {
    component: CurrentStepComponent?.name,
    config: currentStepConfig?.id,
    isLastStep,
    isFirstStep,
    totalSteps: steps.length
  });

  // Assuming the user's name is available in the 'user' object from useAuth
  const userName = user?.username ? user.username.split(' ')[0] : t('onboarding.defaultName');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            console.log(`🚀 [ONBOARDING] Backdrop clicked from step ${currentStep}`);
            handleClose();
          }
        }}
      >
        {/* Main Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={cn(
            "relative w-full max-w-7xl mx-auto bg-white dark:bg-gray-900",
            "shadow-2xl border border-gray-200 dark:border-gray-700",
            "overflow-hidden flex flex-col",
            "my-4 h-[95vh] max-h-[1000px] rounded-2xl"
          )}
        >
          {/* Progress Bar ONLY - No Header */}
          <div className="relative bg-white dark:bg-gray-900 flex-shrink-0">
            {/* Close Button - More prominent */}
            <button
              onClick={() => {
                console.log(`🚀 [ONBOARDING] Close button clicked from step ${currentStep}`);
                handleClose();
              }}
              className={cn(
                "absolute top-3 z-10 p-2 text-gray-600 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400",
                "hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200",
                "border border-gray-300 dark:border-gray-600 hover:border-red-300 dark:hover:border-red-500",
                "shadow-sm hover:shadow-md backdrop-blur-sm bg-white/80 dark:bg-gray-800/80",
                isRTL ? "left-3" : "right-3"
              )}
              title={t('onboarding.closeExit')}
            >
              <X size={20} className="stroke-2" />
            </button>

            {/* Progress Bar */}
            <div className="h-1 bg-gray-200 dark:bg-gray-700">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-600 to-purple-600"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Step Content - FULL HEIGHT with no footer */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={`step-${currentStep}`}
                initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="h-full flex flex-col"
              >
                {CurrentStepComponent && (
                  <div className="flex-1 p-2 lg:p-6">
                    <CurrentStepComponent
                      onNext={() => {
                        console.log(`🚀 [ONBOARDING] onNext called from step ${currentStep} (${steps[currentStep]?.id})`);
                        goToNextStep();
                      }}
                      onPrevious={goToPreviousStep}
                      onSkip={currentStepConfig?.skippable ? skipStep : undefined}
                      stepData={stepData}
                      updateStepData={updateStepData}
                      isLastStep={isLastStep}
                      isFirstStep={isFirstStep}
                      onComplete={handleComplete}
                      isCompleting={isCompleting}
                      stepConfig={currentStepConfig}
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingModal; 