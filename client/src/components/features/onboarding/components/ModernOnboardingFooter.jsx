/**
 * 🎯 MODERN ONBOARDING FOOTER - New Navigation System
 * Implements the specific button layout requested by user
 * Features: Step-specific buttons, X button in header, Enhanced UX
 * @version 4.0.0 - MODERN REDESIGN
 */

import React from 'react';
import {
  ArrowLeft, ArrowRight,
  Sparkles,
  Loader2, CheckCircle
} from 'lucide-react';

import { Button } from '../../../ui';
import { useTranslation } from '../../../../stores';
import { cn } from '../../../../utils/helpers';

/**
 * 🎯 Modern Onboarding Footer - New Navigation Logic
 * Step 1: Next + "Finish Now" buttons
 * Step 2: Next + Previous buttons  
 * Step 3: Finish + Previous buttons
 */
const ModernOnboardingFooter = ({
  currentStep = 0,
  totalSteps = 3,
  canGoPrevious = false,
  canGoNext = true,
  isCompleting = false,
  onPrevious,
  onNext,
  onComplete,
  onFinishNow, // NEW: For "Finish Now" button in step 1
  isRTL = false,
  isValid = true,
  isCompleted = false // NEW: Prop to indicate if onboarding is completed
}) => {
  const { t } = useTranslation('onboarding');

  // ✅ Step-based button configuration
  const isFirstStep = currentStep === 0;
  const isSecondStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps - 1;

  // ✅ Default texts - NO TRANSLATIONS for finish buttons per user request
  const texts = {
    back: t('modal.back') || 'Back',
    next: t('modal.next') || 'Next', 
    finish: 'Done', // ✅ NO TRANSLATION - simple text
    finishNow: 'Skip Setup', // ✅ NO TRANSLATION - simple text
    completing: 'Please wait...' // ✅ NO TRANSLATION - simple text
  };

  // ✅ Handle primary action
  const handlePrimaryAction = () => {
    if (isLastStep && onComplete) {
      onComplete();
    } else if (onNext) {
      onNext();
    }
  };

  // ✅ Handle secondary action (Finish Now for step 1)
  const handleSecondaryAction = () => {
    if (isFirstStep && onFinishNow) {
      onFinishNow();
    }
  };

  return (
    <div className={cn(
      "flex items-center justify-between gap-4",
      "w-full px-6 py-4",
      "bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700"
    )}>
      
      {/* LEFT: Previous button (steps 2 & 3) */}
      <div className="flex items-center">
        {(isSecondStep || isLastStep) && canGoPrevious && (
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={isCompleting}
            className="flex items-center gap-2 h-10 px-4 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 border-gray-300 dark:border-gray-600"
          >
            {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {texts.back}
          </Button>
        )}
      </div>

      {/* ✅ CENTER: Step indicator */}
      <div className="flex items-center gap-2">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              index <= currentStep
                ? "bg-blue-500"
                : "bg-gray-300 dark:bg-gray-600"
            )}
          />
        ))}
        <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
          {currentStep + 1} of {totalSteps}
        </span>
      </div>

      {/* ✅ RIGHT SIDE: Primary + Secondary actions */}
      <div className="flex items-center gap-3">
        
        {/* STEP 1: "Skip Setup" button */}
        {isFirstStep && (
          <Button
            variant="outline"
            onClick={handleSecondaryAction}
            disabled={isCompleting || !isValid}
            className="flex items-center gap-2 h-10 px-4 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20"
          >
            <Sparkles className="w-4 h-4" />
            {texts.finishNow}
          </Button>
        )}

        {/* PRIMARY ACTION: Next / Finish */}
        <Button
          onClick={handlePrimaryAction}
          disabled={isCompleting || (!canGoNext && !isLastStep) || !isValid}
          className={cn(
            "flex items-center gap-2 h-10 px-4 text-sm font-semibold text-white min-w-[100px]",
            isCompleted
              ? "bg-green-600 hover:bg-green-700"
              : "bg-blue-600 hover:bg-blue-700",
            isCompleting && "opacity-75 cursor-not-allowed"
          )}
        >
          {isCompleted ? (
            <><CheckCircle className="w-4 h-4" />Success!</>
          ) : isCompleting ? (
            <><Loader2 className="w-4 h-4 animate-spin" />{texts.completing}</>
          ) : isLastStep ? (
            <><CheckCircle className="w-4 h-4" />{texts.finish}</>
          ) : (
            <>
              {texts.next}
              {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ModernOnboardingFooter;

