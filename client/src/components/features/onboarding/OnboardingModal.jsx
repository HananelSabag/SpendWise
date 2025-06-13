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
  const { user, markOnboardingComplete } = useAuth();
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
      id: 'preferences',
      title: t('onboarding.preferences.title'),
      component: PreferencesStep,
      skippable: true
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

  // Load saved progress from localStorage
  useEffect(() => {
    if (isOpen) {
      const savedProgress = localStorage.getItem('spendwise-onboarding-progress');
      if (savedProgress) {
        try {
          const { step, data } = JSON.parse(savedProgress);
          if (!forceShow) {
            setCurrentStep(step || 0);
            setStepData(data || { preferences: {}, templates: [] });
          }
        } catch (error) {
          console.warn('Failed to load onboarding progress:', error);
        }
      }
    }
  }, [isOpen, forceShow]);

  // Save progress to localStorage
  const saveProgress = () => {
    const progress = {
      step: currentStep,
      data: stepData,
      timestamp: Date.now()
    };
    localStorage.setItem('spendwise-onboarding-progress', JSON.stringify(progress));
  };

  // Navigation handlers
  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      saveProgress();
    } else {
      handleComplete();
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      saveProgress();
    }
  };

  const goToStep = (stepIndex) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex);
      saveProgress();
    }
  };

  // Skip current step
  const skipStep = () => {
    goToNextStep();
  };

  // Update step data
  const updateStepData = (key, value) => {
    setStepData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Complete onboarding
  const handleComplete = async () => {
    if (isCompleting) return;
    
    setIsCompleting(true);
    
    try {
      // Mark onboarding as complete in the backend
      await markOnboardingComplete();
      
      // Clear saved progress
      localStorage.removeItem('spendwise-onboarding-progress');
      
      // Call completion callback
      onComplete?.();
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      // Still close modal to avoid user being stuck
      onClose();
    } finally {
      setIsCompleting(false);
    }
  };

  // Close handler with confirmation if in progress
  const handleClose = () => {
    if (currentStep > 0 && !forceShow) {
      if (window.confirm(t('onboarding.common.confirmClose'))) {
        saveProgress();
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Don't render if not open
  if (!isOpen) return null;

  const CurrentStepComponent = steps[currentStep]?.component;
  const currentStepConfig = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && handleClose()}
      >
        {/* Main Modal */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", duration: 0.3 }}
          className={cn(
            "relative w-full h-full max-w-4xl mx-auto bg-white dark:bg-gray-900",
            "shadow-2xl overflow-hidden",
            "lg:my-8 lg:h-auto lg:max-h-[90vh] lg:rounded-2xl"
          )}
        >
          {/* Header with Gradient */}
          <div className="relative bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20" />
            
            {/* Close Button */}
            <button
              onClick={handleClose}
              className={cn(
                "absolute top-4 z-10 p-2 text-white/80 hover:text-white",
                "hover:bg-white/10 rounded-lg transition-colors",
                isRTL ? "left-4" : "right-4"
              )}
            >
              <X size={24} />
            </button>

            {/* Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/20">
              <motion.div
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-400"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Header Content */}
            <div className="relative px-6 pt-16 pb-8 text-center">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-white/10 rounded-full backdrop-blur-sm">
                    {currentStep === 0 && <Sparkles className="w-8 h-8 text-white" />}
                    {currentStep === 1 && <Heart className="w-8 h-8 text-white" />}
                    {currentStep === 2 && <Zap className="w-8 h-8 text-white" />}
                    {currentStep === 3 && <Target className="w-8 h-8 text-white" />}
                  </div>
                </div>
                
                <h1 className="text-3xl font-bold text-white mb-2">
                  {currentStepConfig?.title}
                </h1>
                
                <p className="text-white/80 text-lg">
                  {t(`onboarding.step${currentStep + 1}.subtitle`)}
                </p>
              </motion.div>

              {/* Step Indicators */}
              <div className="flex justify-center mt-8 space-x-2">
                {steps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToStep(index)}
                    className={cn(
                      "w-3 h-3 rounded-full transition-all duration-300",
                      index <= currentStep
                        ? "bg-white shadow-lg scale-110"
                        : "bg-white/30 hover:bg-white/50"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Step Content */}
          <div className="relative flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
                transition={{ duration: 0.3 }}
                className="p-6 lg:p-8"
              >
                {CurrentStepComponent && (
                  <CurrentStepComponent
                    onNext={goToNextStep}
                    onPrevious={goToPreviousStep}
                    onSkip={skipStep}
                    stepData={stepData}
                    updateStepData={updateStepData}
                    isLastStep={isLastStep}
                    isFirstStep={isFirstStep}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Navigation */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              {/* Previous Button */}
              <Button
                variant="ghost"
                onClick={goToPreviousStep}
                disabled={isFirstStep}
                className={cn(
                  "flex items-center gap-2",
                  isFirstStep && "invisible"
                )}
              >
                {isRTL ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                {t('onboarding.common.previous')}
              </Button>

              {/* Step Counter */}
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {currentStep + 1} {t('onboarding.common.of')} {steps.length}
              </span>

              {/* Next/Complete Button */}
              <div className="flex items-center gap-3">
                {/* Skip Button */}
                {currentStepConfig?.skippable && !isLastStep && (
                  <Button
                    variant="ghost"
                    onClick={skipStep}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {t('onboarding.common.skip')}
                  </Button>
                )}

                {/* Next/Complete Button */}
                <Button
                  onClick={isLastStep ? handleComplete : goToNextStep}
                  disabled={isCompleting}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {isCompleting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                      {t('onboarding.common.completing')}
                    </>
                  ) : isLastStep ? (
                    <>
                      <Check size={20} />
                      {t('onboarding.common.complete')}
                    </>
                  ) : (
                    <>
                      {t('onboarding.common.next')}
                      {isRTL ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingModal; 