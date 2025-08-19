/**
 * 🎯 ONBOARDING FOOTER - ENHANCED BUTTON LAYOUT
 * Always visible skip & complete buttons, better alignment, responsive design
 * @version 3.0.0 - ENHANCED UI/UX
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, ArrowRight, 
  SkipForward, Sparkles, 
  Loader2, CheckCircle 
} from 'lucide-react';

import { Button } from '../../../ui';
import { useTranslation } from '../../../../stores';
import { cn } from '../../../../utils/helpers';

/**
 * 🎯 Enhanced Onboarding Footer with better button layout
 */
const OnboardingFooter = ({
  canGoPrevious = false,
  canGoNext = true,
  canSkip = true,
  isFirstStep = false,
  isLastStep = false,
  isCompleting = false,
  onPrevious,
  onNext,
  onSkip,
  onComplete,
  primaryActionText,
  isRTL = false,
  showSkipButton = true,    // ✅ NEW: Always show skip
  showCompleteButton = true // ✅ NEW: Always show complete
}) => {
  const { t } = useTranslation('onboarding');

  // ✅ DEFAULT TEXTS - NO TRANSLATIONS for finish buttons per user request  
  const defaultTexts = {
    back: t('modal.back') || 'Back',
    next: t('modal.next') || 'Next', 
    skip: 'Skip For Now', // ✅ NO TRANSLATION - simple text
    complete: 'Done', // ✅ NO TRANSLATION - simple text
    completing: 'Please wait...' // ✅ NO TRANSLATION - simple text
  };

  // ✅ ENHANCED: Handle primary action (Next or Complete)
  const handlePrimaryAction = () => {
    const actionData = {
      isLastStep,
      canGoNext,
      isCompleting,
      hasOnComplete: !!onComplete,
      hasOnNext: !!onNext
    };
    
    console.log('🔍 OnboardingFooter - Primary action clicked:', actionData);
    
    if (isLastStep && onComplete) {
      console.log('🎯 OnboardingFooter - Calling onComplete');
      onComplete();
    } else if (onNext) {
      console.log('🔍 OnboardingFooter - Calling onNext');
      onNext();
    }
  };

  // ✅ ENHANCED: Button animation variants
  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.2 }
    },
    hover: { 
      scale: 1.05,
      transition: { duration: 0.1 }
    },
    tap: { scale: 0.95 }
  };

  return (
    <div className={cn(
      "flex items-center justify-between gap-2",
      "w-full",
      // ultra compact footer height
      "flex-wrap sm:flex-nowrap"
    )}>
      
      {/* ✅ LEFT SIDE: Back button */}
      <div className="flex items-center gap-3">
        {canGoPrevious && !isFirstStep && (
          <motion.div
            variants={buttonVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            whileTap="tap"
          >
            <Button
              variant="ghost"
              onClick={onPrevious}
              disabled={isCompleting}
              className={cn(
                "text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200",
                "transition-colors duration-200",
                // ultra compact sizing
                "px-2.5 py-1.5 sm:px-3.5 sm:py-1.5"
              )}
            >
              {isRTL ? (
                <ArrowRight className="w-4 h-4 mr-2" />
              ) : (
                <ArrowLeft className="w-4 h-4 mr-2" />
              )}
              {defaultTexts.back}
            </Button>
          </motion.div>
        )}
      </div>

      {/* ✅ CENTER: Always visible Skip & Complete buttons */}
      <div className={cn(
        "flex items-center gap-3",
        // ✅ ENHANCED: Better responsive layout
        "order-3 sm:order-2 w-full sm:w-auto justify-center",
        "mt-4 sm:mt-0"
      )}>
        
        {/* ✅ ENHANCED: Always show Skip button (not just when canSkip) */}
        {showSkipButton && !isCompleting && (
          <motion.div
            variants={buttonVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            whileTap="tap"
          >
            <Button
              variant="ghost"
              onClick={onSkip}
              disabled={isCompleting}
              className={cn(
                "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
                "border border-gray-300 dark:border-gray-600",
                "hover:border-gray-400 dark:hover:border-gray-500",
                "transition-all duration-200",
                // ultra compact sizing
                "px-2.5 py-1.5 sm:px-3.5 sm:py-1.5"
              )}
            >
              <SkipForward className="w-4 h-4 mr-2" />
              {defaultTexts.skip}
            </Button>
          </motion.div>
        )}

        {/* ✅ ENHANCED: Always show Complete button for quick completion */}
        {showCompleteButton && !isLastStep && !isCompleting && (
          <motion.div
            variants={buttonVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            whileTap="tap"
          >
            <Button
              variant="outline"
              onClick={onComplete}
              disabled={isCompleting}
              className={cn(
                "text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300",
                "border-primary-300 hover:border-primary-400 dark:border-primary-600 dark:hover:border-primary-500",
                "bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/20 dark:hover:bg-primary-900/30",
                "transition-all duration-200",
                // ultra compact sizing
                "px-2.5 py-1.5 sm:px-3.5 sm:py-1.5"
              )}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {defaultTexts.complete}
            </Button>
          </motion.div>
        )}
      </div>

      {/* ✅ RIGHT SIDE: Primary action button (Next/Finish) */}
      <div className={cn(
        "flex items-center gap-3",
        "order-2 sm:order-3"
      )}>
        <motion.div
          variants={buttonVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
          whileTap="tap"
        >
          <Button
            onClick={handlePrimaryAction}
            disabled={isCompleting || (!canGoNext && !isLastStep)}
            className={cn(
              // ✅ ENHANCED: Better primary button styling
              "bg-primary-600 hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700",
              "text-white font-semibold",
              "shadow-lg hover:shadow-xl",
              "transition-all duration-200",
              // ultra compact sizing
              "px-4 py-2 sm:px-5 sm:py-2",
              // ✅ ENHANCED: Loading state
              isCompleting && "opacity-75 cursor-not-allowed"
            )}
          >
            {isCompleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {defaultTexts.completing}
              </>
            ) : isLastStep ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                {defaultTexts.complete}
              </>
            ) : (
              <>
                {primaryActionText || defaultTexts.next}
                {isRTL ? (
                  <ArrowLeft className="w-4 h-4 ml-2" />
                ) : (
                  <ArrowRight className="w-4 h-4 ml-2" />
                )}
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default OnboardingFooter; 