/**
 * 🎯 MODERN ONBOARDING HEADER - Enhanced Design
 * Clean, minimal header with X button and progress
 * Features: Step progress, Title display, Close button
 * @version 4.0.0 - MODERN REDESIGN
 */

import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

import { useTranslation } from '../../../../stores';
import { Button } from '../../../ui';
import { cn } from '../../../../utils/helpers';

/**
 * 🎯 Modern Onboarding Header
 */
const ModernOnboardingHeader = ({
  currentStep = 0,
  totalSteps = 3,
  progress = 0,
  title = '',
  subtitle = '',
  canClose = true,
  onClose,
  isRTL = false
}) => {
  const { t } = useTranslation('onboarding');

  // ✅ Fallback texts
  const displayTitle = title || t('title') || 'Welcome to SpendWise';
  const displaySubtitle = subtitle || t('subtitle') || 'Let\'s set up your account';
  const stepText = t('progress.step', { 
    params: { current: currentStep + 1, total: totalSteps } 
  }) || `Step ${currentStep + 1} of ${totalSteps}`;

  return (
    <div className="relative w-full p-4">
      
      {/* ✅ Single row layout with progress, title, and close button */}
      <div className="flex items-center justify-between gap-4 mb-2">
        
        {/* Left: Step indicator and title */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Step indicator */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-sm font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap"
          >
            {stepText}
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl font-bold text-gray-900 dark:text-white truncate"
          >
            {displayTitle}
          </motion.h1>
        </div>

        {/* ✅ RIGHT: X button */}
        {canClose && onClose && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex-shrink-0"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className={cn(
                "p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
                "hover:bg-gray-100 dark:hover:bg-gray-800",
                "rounded-full transition-colors",
                "w-8 h-8 flex items-center justify-center"
              )}
              aria-label="Close onboarding"
            >
              <X className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </div>

      {/* ✅ Progress bar - smaller */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

export default ModernOnboardingHeader;

