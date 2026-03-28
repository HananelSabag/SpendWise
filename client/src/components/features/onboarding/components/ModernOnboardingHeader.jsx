/**
 * MODERN ONBOARDING HEADER
 * Two-row layout: step badge + close button on top, title below, progress bar flush at bottom.
 * Close button hidden on mobile — drag handle / backdrop handle dismiss there.
 * @version 5.0.0
 */

import React from 'react';
import { X } from 'lucide-react';

import { useTranslation } from '../../../../stores';
import { cn } from '../../../../utils/helpers';

const ModernOnboardingHeader = ({
  currentStep = 0,
  totalSteps = 3,
  progress = 0,
  title = '',
  canClose = true,
  onClose,
  isRTL = false,
  isMobile = false,
}) => {
  const { t } = useTranslation('onboarding');

  const displayTitle = title || t('title') || 'Welcome to SpendWise';
  const stepText =
    t('progress.step', { params: { current: currentStep + 1, total: totalSteps } }) ||
    `Step ${currentStep + 1} of ${totalSteps}`;

  return (
    <div className="w-full">
      {/* Inner padding area */}
      <div className="px-5 pt-4 pb-3">

        {/* Row 1: step badge  ·  X button (desktop only) */}
        <div className={cn(
          'flex items-center justify-between mb-1.5',
          isRTL && 'flex-row-reverse'
        )}>
          <span className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
            {stepText}
          </span>

          {/* X visible on desktop only; mobile closes via drag / backdrop */}
          {!isMobile && canClose && onClose && (
            <button
              onClick={onClose}
              aria-label={t('modal.close') || 'Close'}
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Row 2: step title */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-snug">
          {displayTitle}
        </h2>
      </div>

      {/* Progress bar flush to the bottom edge — no border-radius so it bleeds edge-to-edge */}
      <div className="w-full h-1 bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default ModernOnboardingHeader;
