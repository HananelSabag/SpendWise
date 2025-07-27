/**
 * 🎯 ONBOARDING MODAL - MOBILE-FIRST REVOLUTION!
 * Complete rewrite with Zustand, perfect mobile design, new translations
 * NOW WITH ZUSTAND STORES! 🎉
 * @version 2.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronRight, ChevronLeft, Check, Sparkles, 
  Heart, Zap, Shield, Target, ArrowRight, Play,
  Smartphone, TrendingUp, PieChart, Wallet
} from 'lucide-react';

// ✅ NEW: Import from Zustand stores instead of Context
import {
  useAuth,
  useTranslation,
  useTheme,
  useCurrency,
  useNotifications
} from '../../../stores';

import { cn } from '../../../utils/helpers';
import { Button } from '../../ui';

// Import enhanced onboarding steps
import WelcomeStep from './steps/WelcomeStep';
import PreferencesStep from './steps/PreferencesStep';
import CategoriesStep from './steps/CategoriesStep';
import TemplatesStep from './steps/InitialTemplatesStep';
import CompletionStep from './steps/CompletionStep';

/**
 * 🚀 OnboardingModal - MOBILE-FIRST PERFECTION!
 */
const OnboardingModal = ({ 
  isOpen, 
  onClose, 
  onComplete,
  forceShow = false // For re-showing onboarding from help menu
}) => {
  // ✅ NEW: Use Zustand stores
  const { user, actions: authActions } = useAuth();
  const { t, currentLanguage, isRTL } = useTranslation('onboarding');
  const { isDark } = useTheme();
  const { addNotification } = useNotifications();
  
  // Enhanced state management
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
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

  // Enhanced step configuration
  const steps = [
    {
      id: 'welcome',
      component: WelcomeStep,
      title: t('progress.welcome'),
      icon: Sparkles,
      canSkip: false,
      required: false
    },
    {
      id: 'preferences', 
      component: PreferencesStep,
      title: t('progress.preferences'),
      icon: Heart,
      canSkip: true,
      required: false
    },
    {
      id: 'categories',
      component: CategoriesStep, 
      title: t('progress.categories'),
      icon: PieChart,
      canSkip: true,
      required: false
    },
    {
      id: 'templates',
      component: TemplatesStep,
      title: t('progress.templates'),
      icon: Target,
      canSkip: true,
      required: false
    },
    {
      id: 'completion',
      component: CompletionStep,
      title: t('progress.ready'),
      icon: Check,
      canSkip: false,
      required: false
    }
  ];

  // Enhanced step data update handler
  const handleStepDataUpdate = useCallback((stepId, data, merge = true) => {
    setStepData(prev => ({
      ...prev,
      [stepId]: merge ? { ...prev[stepId], ...data } : data
    }));
    setHasUnsavedChanges(true);
  }, []);

  // Enhanced navigation
  const goToStep = useCallback((stepIndex) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex);
    }
  }, [steps.length]);

  const goNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, steps.length]);

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  // Enhanced completion handler
  const handleComplete = useCallback(async () => {
    setIsCompleting(true);
    
    try {
      // Save user preferences from onboarding
      if (stepData.preferences) {
        // Apply language preference
        if (stepData.preferences.language !== currentLanguage) {
          // Language will be applied automatically by the translation store
        }
        
        // Apply other preferences through auth store
        await authActions.updateProfile({
          language_preference: stepData.preferences.language,
          currency_preference: stepData.preferences.currency,
          theme_preference: stepData.preferences.theme,
          preferences: {
            ...user?.preferences,
            notifications: stepData.preferences.notifications,
            dateFormat: stepData.preferences.dateFormat
          }
        });
      }

      // Create custom categories if any
      if (stepData.categories.custom.length > 0) {
        for (const category of stepData.categories.custom) {
          try {
            // Use category API to create categories
            await fetch('/api/v1/categories', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
              },
              body: JSON.stringify(category)
            });
          } catch (error) {
            console.error('Failed to create category:', error);
          }
        }
      }

      // Create recurring templates if any
      if (stepData.templates.length > 0) {
        for (const template of stepData.templates) {
          try {
            await fetch('/api/v1/transactions/recurring/templates', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
              },
              body: JSON.stringify(template)
            });
          } catch (error) {
            console.error('Failed to create template:', error);
          }
        }
      }

      // Mark onboarding as complete
      await authActions.markOnboardingComplete();
      
      // Show success notification
      addNotification({
        type: 'success',
        title: t('success.onboardingComplete'),
        duration: 5000
      });
      
      // Trigger completion callback
      onComplete?.(stepData);
      
      // Close modal
      onClose();
      
    } catch (error) {
      console.error('Onboarding completion failed:', error);
      
      addNotification({
        type: 'error',
        title: t('errors.completionFailed'),
        description: error.message || t('errors.serverError'),
        duration: 8000
      });
    } finally {
      setIsCompleting(false);
    }
  }, [stepData, currentLanguage, authActions, user, t, addNotification, onComplete, onClose]);

  // Enhanced skip handler
  const handleSkip = useCallback(() => {
    if (hasUnsavedChanges) {
      // Show confirmation dialog
      const confirmSkip = window.confirm(
        `${t('modal.skipConfirm')}\n\n${t('modal.skipMessage')}`
      );
      
      if (!confirmSkip) return;
    }
    
    onClose();
  }, [hasUnsavedChanges, t, onClose]);

  // Enhanced keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          handleSkip();
          break;
        case 'ArrowRight':
          if (!isRTL && currentStep < steps.length - 1) {
            e.preventDefault();
            goNext();
          }
          break;
        case 'ArrowLeft':
          if (!isRTL && currentStep > 0) {
            e.preventDefault();
            goBack();
          }
          break;
        case 'Enter':
          if (currentStep === steps.length - 1) {
            e.preventDefault();
            handleComplete();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep, steps.length, isRTL, handleSkip, goNext, goBack, handleComplete]);

  // Don't render if not open
  if (!isOpen) return null;

  const currentStepConfig = steps[currentStep];
  const StepComponent = currentStepConfig.component;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="onboarding-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        style={{ direction: isRTL ? 'rtl' : 'ltr' }}
      >
        {/* Enhanced backdrop with blur */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleSkip}
        />

        {/* Main modal container - Mobile optimized */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={cn(
            "relative w-full h-full max-w-4xl max-h-[95vh]",
            "bg-white dark:bg-gray-900",
            "flex flex-col",
            "md:rounded-2xl md:shadow-2xl md:h-auto md:max-h-[90vh]",
            "md:border md:border-gray-200 md:dark:border-gray-700"
          )}
        >
          {/* Enhanced header - Mobile optimized */}
          <div className={cn(
            "relative flex-shrink-0",
            "bg-gradient-to-r from-primary-500 to-primary-600",
            "dark:from-primary-600 dark:to-primary-700",
            "px-4 py-6 md:px-8",
            "text-white"
          )}>
            {/* Close button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className={cn(
                "absolute top-4 text-white/80 hover:text-white",
                "hover:bg-white/10 border-0",
                isRTL ? "left-4" : "right-4"
              )}
            >
              <X className="w-5 h-5" />
            </Button>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-white/90">
                  {t('progress.step', { current: currentStep + 1, total: steps.length })}
                </p>
                <p className="text-sm text-white/70">
                  {Math.round(progress)}%
                </p>
              </div>
              
              <div className="w-full bg-white/20 rounded-full h-2">
                <motion.div
                  className="bg-white rounded-full h-2"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Step title and description */}
            <div className="text-center">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center mb-2"
              >
                <currentStepConfig.icon className="w-6 h-6 mr-2" />
                <h2 className="text-lg font-semibold">
                  {currentStepConfig.title}
                </h2>
              </motion.div>
            </div>
          </div>

          {/* Step content - Mobile optimized scrolling */}
          <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <StepComponent
                  data={stepData[currentStepConfig.id] || {}}
                  onDataUpdate={(data, merge) => handleStepDataUpdate(currentStepConfig.id, data, merge)}
                  onNext={goNext}
                  onBack={goBack}
                  onComplete={handleComplete}
                  isFirstStep={currentStep === 0}
                  isLastStep={currentStep === steps.length - 1}
                  isCompleting={isCompleting}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Enhanced footer navigation - Mobile optimized */}
          <div className={cn(
            "flex-shrink-0 px-4 py-4 md:px-8",
            "bg-gray-50 dark:bg-gray-800/50",
            "border-t border-gray-200 dark:border-gray-700"
          )}>
            <div className="flex items-center justify-between">
              {/* Back button */}
              <Button
                variant="outline"
                onClick={goBack}
                disabled={currentStep === 0}
                className={cn(
                  "min-w-[100px]",
                  currentStep === 0 && "invisible"
                )}
              >
                {isRTL ? (
                  <>
                    {t('modal.back')}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    {t('modal.back')}
                  </>
                )}
              </Button>

              {/* Skip button (for skippable steps) */}
              {currentStepConfig.canSkip && currentStep < steps.length - 1 && (
                <Button
                  variant="ghost"
                  onClick={goNext}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {t('modal.skip')}
                </Button>
              )}

              {/* Next/Finish button */}
              <Button
                variant="primary"
                onClick={currentStep === steps.length - 1 ? handleComplete : goNext}
                disabled={isCompleting}
                className="min-w-[120px]"
                loading={isCompleting}
              >
                {isCompleting ? (
                  t('modal.completing')
                ) : currentStep === steps.length - 1 ? (
                  <>
                    {t('modal.finish')}
                    <Sparkles className={cn("w-4 h-4", isRTL ? "mr-2" : "ml-2")} />
                  </>
                ) : (
                  <>
                    {isRTL ? (
                      <>
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        {t('modal.next')}
                      </>
                    ) : (
                      <>
                        {t('modal.next')}
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingModal; 