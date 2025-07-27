/**
 * 📋 ONBOARDING HEADER - Progress & Navigation
 * Extracted from massive OnboardingModal.jsx for better organization
 * Features: Progress bar, Step indicators, Title display, Close button
 * @version 3.0.0 - ONBOARDING REDESIGN
 */

import React from 'react';
import { motion } from 'framer-motion';
import { X, Clock, CheckCircle } from 'lucide-react';

// ✅ Import stores and components
import { useTranslation } from '../../../../stores';
import { Button, Badge } from '../../../ui';
import { cn } from '../../../../utils/helpers';

/**
 * 📋 Onboarding Header Component
 */
const OnboardingHeader = ({
  currentStep,
  totalSteps,
  progress,
  stepTitle,
  stepIcon: StepIcon,
  estimatedTimeRemaining = 0,
  onClose,
  showCloseButton = true,
  showProgress = true,
  showEstimatedTime = false,
  className = ''
}) => {
  const { t, isRTL } = useTranslation('onboarding');

  // ✅ Animation variants
  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  const progressVariants = {
    hidden: { width: 0 },
    visible: { 
      width: `${progress}%`,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <motion.div
      variants={headerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "relative flex-shrink-0",
        "bg-gradient-to-r from-primary-500 to-primary-600",
        "dark:from-primary-600 dark:to-primary-700",
        "px-4 py-6 md:px-8",
        "text-white",
        className
      )}
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      {/* Close Button */}
      {showCloseButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className={cn(
            "absolute top-4 text-white/80 hover:text-white",
            "hover:bg-white/10 border-0 transition-colors",
            isRTL ? "left-4" : "right-4"
          )}
          aria-label={t('modal.close')}
        >
          <X className="w-5 h-5" />
        </Button>
      )}

      {/* Progress Section */}
      {showProgress && (
        <div className="mb-4">
          {/* Progress Info */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium text-white/90">
                {t('progress.step', { current: currentStep, total: totalSteps })}
              </p>
              
              {/* Completion Badge */}
              {progress === 100 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {t('progress.complete')}
                  </Badge>
                </motion.div>
              )}
            </div>

            <div className="flex items-center space-x-3 text-sm text-white/70">
              {/* Estimated Time */}
              {showEstimatedTime && estimatedTimeRemaining > 0 && (
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    {t('progress.timeRemaining', { 
                      minutes: estimatedTimeRemaining 
                    })}
                  </span>
                </div>
              )}

              {/* Progress Percentage */}
              <span className="font-medium">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="relative w-full bg-white/20 rounded-full h-2 overflow-hidden">
            <motion.div
              variants={progressVariants}
              initial="hidden"
              animate="visible"
              className="absolute top-0 left-0 h-full bg-white rounded-full shadow-sm"
            />
            
            {/* Progress Glow Effect */}
            <motion.div
              variants={progressVariants}
              initial="hidden"
              animate="visible"
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full"
              style={{ filter: 'blur(1px)' }}
            />
          </div>
        </div>
      )}

      {/* Step Title Section */}
      <div className="text-center">
        <motion.div
          key={`${currentStep}-${stepTitle}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-center space-x-3"
        >
          {/* Step Icon */}
          {StepIcon && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="flex-shrink-0"
            >
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <StepIcon className="w-5 h-5" />
              </div>
            </motion.div>
          )}

          {/* Step Title */}
          <div>
            <h2 className="text-lg md:text-xl font-semibold">
              {stepTitle}
            </h2>
            
            {/* Optional Step Description */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-sm text-white/80 mt-1"
            >
              {t('progress.stepDescription', { step: currentStep, total: totalSteps })}
            </motion.p>
          </div>
        </motion.div>

        {/* Step Indicators (Dots) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center space-x-2 mt-4"
        >
          {Array.from({ length: totalSteps }, (_, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0.8 }}
              animate={{ 
                scale: index === currentStep - 1 ? 1.2 : 1,
                opacity: index < currentStep ? 1 : 0.4
              }}
              transition={{ duration: 0.2 }}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index < currentStep 
                  ? "bg-white shadow-sm" 
                  : index === currentStep - 1
                    ? "bg-white shadow-md ring-2 ring-white/30"
                    : "bg-white/30"
              )}
            />
          ))}
        </motion.div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />
        
        {/* Animated Particles */}
        {Array.from({ length: 3 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            initial={{ 
              x: Math.random() * 100 + '%',
              y: Math.random() * 100 + '%',
              opacity: 0
            }}
            animate={{
              x: [
                Math.random() * 100 + '%',
                Math.random() * 100 + '%',
                Math.random() * 100 + '%'
              ],
              y: [
                Math.random() * 100 + '%',
                Math.random() * 100 + '%',
                Math.random() * 100 + '%'
              ],
              opacity: [0, 0.6, 0]
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: "linear",
              delay: i * 2
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default OnboardingHeader; 