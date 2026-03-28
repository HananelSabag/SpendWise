/**
 * MODERN ONBOARDING FOOTER
 * Step 1: Back (hidden) · dots · Skip Setup + Next
 * Step 2: Back · dots · Next
 * Step 3: Back · dots · Done
 * The "X of 3" text label is removed — the header progress bar already conveys position.
 * @version 5.0.0
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

const ModernOnboardingFooter = ({
  currentStep = 0,
  totalSteps = 3,
  canGoPrevious = false,
  canGoNext = true,
  isCompleting = false,
  onPrevious,
  onNext,
  onComplete,
  onFinishNow,
  isRTL = false,
  isValid = true,
  isCompleted = false,
}) => {
  const { t } = useTranslation('onboarding');

  const isFirstStep = currentStep === 0;
  const isLastStep  = currentStep === totalSteps - 1;
  const showBack    = currentStep > 0 && canGoPrevious;

  const texts = {
    back:       t('modal.back')  || 'Back',
    next:       t('modal.next')  || 'Next',
    finish:     'Done',
    skipSetup:  'Skip Setup',
    completing: 'Please wait…',
  };

  const handlePrimary = () => {
    if (isLastStep) onComplete?.();
    else onNext?.();
  };

  return (
    <div className={cn(
      'flex items-center justify-between gap-3',
      'w-full px-5 py-4',
      'bg-gray-50 dark:bg-gray-800/50',
      'border-t border-gray-200 dark:border-gray-700'
    )}>

      {/* LEFT: Back button — keeps layout stable when hidden */}
      <div className="w-20 flex justify-start">
        {showBack && (
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={isCompleting}
            className="flex items-center gap-1.5 h-9 px-3 text-sm text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600"
          >
            {isRTL ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
            {texts.back}
          </Button>
        )}
      </div>

      {/* CENTER: step dots only (no redundant "X of 3" text) */}
      <div className="flex items-center gap-1.5">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'rounded-full transition-all duration-300',
              i === currentStep
                ? 'w-4 h-2 bg-blue-500'          // active: pill
                : i < currentStep
                  ? 'w-2 h-2 bg-blue-400'         // completed: filled
                  : 'w-2 h-2 bg-gray-300 dark:bg-gray-600' // future: empty
            )}
          />
        ))}
      </div>

      {/* RIGHT: action buttons */}
      <div className="flex items-center gap-2 justify-end">

        {/* Step 1 only: Skip Setup */}
        {isFirstStep && (
          <Button
            variant="outline"
            onClick={onFinishNow}
            disabled={isCompleting || !isValid}
            className="flex items-center gap-1.5 h-9 px-3 text-sm text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {texts.skipSetup}
          </Button>
        )}

        {/* Primary: Next / Done */}
        <Button
          onClick={handlePrimary}
          disabled={isCompleting || (!canGoNext && !isLastStep) || !isValid}
          className={cn(
            'flex items-center gap-1.5 h-9 px-4 text-sm font-semibold text-white min-w-[90px]',
            isCompleted ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700',
            isCompleting && 'opacity-75 cursor-not-allowed'
          )}
        >
          {isCompleted ? (
            <><CheckCircle className="w-4 h-4" />{t('modal.success') || 'Done!'}</>
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
