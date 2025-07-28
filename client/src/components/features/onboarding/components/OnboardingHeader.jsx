/**
 * 🎯 ONBOARDING HEADER - COMPACT & SHORTER VERSION
 * Reduced padding, shorter height, better space efficiency  
 * @version 3.1.0 - COMPACT MODE
 */

import React from 'react';
import { motion } from 'framer-motion';
import { X, ChevronLeft, Clock } from 'lucide-react';

import { useTranslation } from '../../../../stores';
import { Button } from '../../../ui';
import { cn } from '../../../../utils/helpers';

/**
 * 🎯 Compact Onboarding Header - Shorter & More Efficient
 */
const OnboardingHeader = ({
  currentStep = 1,
  totalSteps = 5,
  progress = 0,
  title = '',
  subtitle = '',
  canClose = true,
  onClose,
  isRTL = false,
  compact = false // ✅ NEW: Compact mode
}) => {
  const { t } = useTranslation('onboarding');

  // ✅ DEBUG: Check translations in header
  React.useEffect(() => {
    console.log('🔍 OnboardingHeader translation debug:', {
      titleProp: title,
      subtitleProp: subtitle,
      progressTranslation: t('progress.step'),
      welcomeTranslation: t('progress.welcome'),
      isTranslationWorking: typeof t === 'function'
    });
  }, [title, subtitle, t]);

  // ✅ Fallback texts
  const displayTitle = title || t('title') || 'Welcome to SpendWise';
  const displaySubtitle = subtitle || t('subtitle') || 'Let\'s set up your account';
  const stepText = t('progress.step', { current: currentStep, total: totalSteps }) || `Step ${currentStep} of ${totalSteps}`;

  return (
    <div className={cn(
      "relative w-full",
      // ✅ COMPACT: Much less vertical padding
      compact ? "py-2" : "py-4",
      "transition-all duration-200"
    )}>
      
      {/* ✅ COMPACT: Progress bar with minimal spacing */}
      <div className={cn(
        "w-full bg-gray-200 dark:bg-gray-700 rounded-full",
        compact ? "h-1.5 mb-3" : "h-2 mb-4" // ✅ Thinner progress bar in compact mode
      )}>
        <motion.div
          className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* ✅ Header Content */}
      <div className={cn(
        "flex items-start justify-between",
        compact ? "gap-2" : "gap-4" // ✅ Less gap in compact mode
      )}>
        
        {/* ✅ Left: Title & Subtitle */}
        <div className="flex-1 min-w-0">
          
          {/* ✅ Step indicator */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "text-sm font-medium text-primary-600 dark:text-primary-400",
              compact ? "mb-1" : "mb-2" // ✅ Less margin in compact mode
            )}
          >
            {stepText}
          </motion.div>

          {/* ✅ COMPACT: Smaller title */}
          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={cn(
              "font-bold text-gray-900 dark:text-white",
              "leading-tight",
              compact ? "text-xl mb-1" : "text-2xl sm:text-3xl mb-2" // ✅ Much smaller in compact mode
            )}
          >
            {displayTitle}
          </motion.h2>

          {/* ✅ COMPACT: Smaller subtitle */}
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={cn(
              "text-gray-600 dark:text-gray-300",
              "leading-relaxed",
              compact ? "text-sm" : "text-base sm:text-lg" // ✅ Much smaller in compact mode
            )}
          >
            {displaySubtitle}
          </motion.p>
        </div>

        {/* ✅ Right: Close button */}
        {canClose && onClose && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              variant="ghost"
              size={compact ? "sm" : "md"} // ✅ Smaller button in compact mode
              onClick={onClose}
              className={cn(
                "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
                "hover:bg-gray-100 dark:hover:bg-gray-800",
                "transition-colors",
                compact ? "p-2" : "p-3" // ✅ Less padding in compact mode
              )}
              aria-label="Close onboarding"
            >
              <X className={compact ? "w-4 h-4" : "w-5 h-5"} />
            </Button>
          </motion.div>
        )}
      </div>

      {/* ✅ COMPACT: Optional progress percentage (smaller) */}
      {!compact && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="absolute top-0 right-0 text-xs text-gray-500 dark:text-gray-400"
        >
          {Math.round(progress)}%
        </motion.div>
      )}
    </div>
  );
};

export default OnboardingHeader; 