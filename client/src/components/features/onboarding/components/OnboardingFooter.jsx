/**
 * 🦶 ONBOARDING FOOTER - Navigation Controls
 * Extracted from massive OnboardingModal.jsx for better organization
 * Features: Back/Next buttons, Skip logic, Complete button, Loading states
 * @version 3.0.0 - ONBOARDING REDESIGN
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Sparkles, Clock,
  CheckCircle, ArrowRight, SkipForward
} from 'lucide-react';

// ✅ Import stores and components
import { useTranslation } from '../../../../stores';
import { Button, LoadingSpinner } from '../../../ui';
import { cn } from '../../../../utils/helpers';

/**
 * 🦶 Onboarding Footer Component
 */
const OnboardingFooter = ({
  // Navigation state
  canGoBack = true,
  canGoNext = true,
  canSkip = false,
  isFirstStep = false,
  isLastStep = false,
  isCompleting = false,

  // Actions
  onBack,
  onNext,
  onSkip,
  onComplete,

  // Customization
  showBackButton = true,
  showSkipButton = true,
  showProgress = false,
  currentStep = 1,
  totalSteps = 5,

  // Styling
  className = '',
  backButtonText = null,
  nextButtonText = null,
  skipButtonText = null,
  completeButtonText = null
}) => {
  const { t, isRTL } = useTranslation('onboarding');

  // ✅ Default button texts
  const defaultTexts = {
    back: backButtonText || t('modal.back'),
    next: nextButtonText || t('modal.next'),
    skip: skipButtonText || t('modal.skip'),
    complete: completeButtonText || t('modal.finish'),
    completing: t('modal.completing')
  };

  // ✅ Handle primary action (Next or Complete)
  const handlePrimaryAction = () => {
    console.log('🔍 OnboardingFooter - Primary action clicked:', {
      isLastStep,
      canGoNext,
      isCompleting,
      hasOnComplete: !!onComplete,
      hasOnNext: !!onNext
    });
    
    if (isLastStep) {
      console.log('🎯 OnboardingFooter - Calling onComplete');
      onComplete?.();
    } else {
      console.log('🔍 OnboardingFooter - Calling onNext');
      onNext?.();
    }
  };

  // ✅ Animation variants
  const footerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.2 }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9,
      transition: { duration: 0.15 }
    }
  };

  return (
    <motion.div
      variants={footerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "flex-shrink-0 px-4 py-4 md:px-8",
        "bg-gray-50 dark:bg-gray-800/50",
        "border-t border-gray-200 dark:border-gray-700",
        className
      )}
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      {/* Progress Indicator (optional) */}
      {showProgress && (
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-400">
            <span>{t('progress.step', { current: currentStep, total: totalSteps })}</span>
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <div className="flex items-center justify-between">
        {/* Back Button */}
        <motion.div variants={buttonVariants}>
          {showBackButton && !isFirstStep ? (
            <Button
              variant="outline"
              onClick={onBack}
              disabled={!canGoBack || isCompleting}
              className="min-w-[100px]"
              aria-label={defaultTexts.back}
            >
              {isRTL ? (
                <>
                  {defaultTexts.back}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  {defaultTexts.back}
                </>
              )}
            </Button>
          ) : (
            // Invisible placeholder to maintain layout
            <div className="min-w-[100px]" />
          )}
        </motion.div>

        {/* Center Section - Skip Button or Progress */}
        <motion.div 
          variants={buttonVariants}
          className="flex items-center"
        >
          {/* Skip Button */}
          {showSkipButton && canSkip && !isLastStep && (
            <Button
              variant="ghost"
              onClick={onSkip}
              disabled={isCompleting}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <SkipForward className="w-4 h-4 mr-2" />
              {defaultTexts.skip}
            </Button>
          )}

          {/* Completion Progress (when completing) */}
          {isCompleting && (
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <LoadingSpinner size="sm" />
              <span>{defaultTexts.completing}</span>
            </div>
          )}
        </motion.div>

        {/* Next/Complete Button */}
        <motion.div variants={buttonVariants}>
          <Button
            variant="primary"
            onClick={handlePrimaryAction}
            disabled={isLastStep ? isCompleting : (!canGoNext || isCompleting)}
            loading={isCompleting}
            className="min-w-[120px]"
            aria-label={isLastStep ? defaultTexts.complete : defaultTexts.next}
          >
            {isCompleting ? (
              <span className="flex items-center space-x-2">
                <LoadingSpinner size="sm" />
                <span>{defaultTexts.completing}</span>
              </span>
            ) : isLastStep ? (
              <>
                {defaultTexts.complete}
                <Sparkles className={cn("w-4 h-4", isRTL ? "mr-2" : "ml-2")} />
              </>
            ) : (
              <>
                {isRTL ? (
                  <>
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    {defaultTexts.next}
                  </>
                ) : (
                  <>
                    {defaultTexts.next}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </>
            )}
          </Button>
        </motion.div>
      </div>

      {/* Additional Info Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-3 text-center"
      >
        {/* Keyboard Shortcuts Hint */}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {!isCompleting && (
            <span>
              {t('modal.keyboardHint')} • 
              <kbd className="mx-1 px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                {isRTL ? '←' : '→'}
              </kbd>
              {t('modal.nextShortcut')} • 
              <kbd className="mx-1 px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                {isRTL ? '→' : '←'}
              </kbd>
              {t('modal.backShortcut')}
              {canSkip && (
                <>
                  {' • '}
                  <kbd className="mx-1 px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                    Esc
                  </kbd>
                  {t('modal.skipShortcut')}
                </>
              )}
            </span>
          )}
        </div>

        {/* Completion Indicator */}
        {isLastStep && !isCompleting && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center space-x-2 mt-2 text-green-600 dark:text-green-400"
          >
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">
              {t('modal.readyToComplete')}
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* Decorative Progress Line */}
      {showProgress && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-600 opacity-20" />
      )}
    </motion.div>
  );
};

export default OnboardingFooter; 