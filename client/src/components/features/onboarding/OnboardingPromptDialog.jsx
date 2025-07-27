/**
 * 🚀 ONBOARDING PROMPT DIALOG - MOBILE-FIRST
 * Enhanced onboarding invitation dialog with better UX
 * NOW WITH ZUSTAND STORES! 🎉
 * @version 2.0.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, ArrowRight, X, Clock, Target, Shield, 
  TrendingUp, Gift, Star, CheckCircle, Users, Zap
} from 'lucide-react';

// ✅ NEW: Import from Zustand stores instead of Context
import {
  useTranslation,
  useAuth,
  useTheme,
  useNotifications
} from '../../../stores';

import { Button, Card, Badge } from '../../ui';
import { cn } from '../../../utils/helpers';

const OnboardingPromptDialog = ({
  isOpen,
  onStart,
  onDismiss,
  onSkip,
  type = 'welcome' // welcome, reminder, complete
}) => {
  // ✅ NEW: Use Zustand stores
  const { t, isRTL } = useTranslation('onboarding');
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { addNotification } = useNotifications();

  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Onboarding benefits
  const benefits = [
    {
      icon: Target,
      title: t('prompt.benefits.organization.title'),
      description: t('prompt.benefits.organization.description'),
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      icon: TrendingUp,
      title: t('prompt.benefits.insights.title'),
      description: t('prompt.benefits.insights.description'),
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      icon: Shield,
      title: t('prompt.benefits.security.title'),
      description: t('prompt.benefits.security.description'),
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    },
    {
      icon: Zap,
      title: t('prompt.benefits.automation.title'),
      description: t('prompt.benefits.automation.description'),
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20'
    }
  ];

  // Progress steps for different types
  const progressSteps = {
    welcome: [
      t('prompt.steps.welcome'),
      t('prompt.steps.preferences'),
      t('prompt.steps.categories'),
      t('prompt.steps.complete')
    ],
    reminder: [
      t('prompt.steps.quick'),
      t('prompt.steps.setup'),
      t('prompt.steps.ready')
    ],
    complete: [
      t('prompt.steps.review'),
      t('prompt.steps.finish')
    ]
  };

  // Auto-advance benefits showcase
  useEffect(() => {
    if (type === 'welcome' && isOpen) {
      const interval = setInterval(() => {
        setCurrentStep(prev => (prev + 1) % benefits.length);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [type, isOpen, benefits.length]);

  // Handle start onboarding
  const handleStart = useCallback(async () => {
    setIsAnimating(true);
    
    try {
      if (onStart) {
        await onStart();
      }
      
      addNotification({
        type: 'success',
        title: t('prompt.started'),
        description: t('prompt.startedDescription'),
        duration: 3000
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: t('prompt.startFailed'),
        description: error.message,
        duration: 5000
      });
    } finally {
      setIsAnimating(false);
    }
  }, [onStart, addNotification, t]);

  // Handle dismiss with feedback
  const handleDismiss = useCallback((reason = 'user_dismissed') => {
    // Track dismissal reason for analytics
    if (onDismiss) {
      onDismiss(reason);
    }
  }, [onDismiss]);

  // Get content based on type
  const getContent = () => {
    switch (type) {
      case 'reminder':
        return {
          title: t('prompt.reminder.title'),
          subtitle: t('prompt.reminder.subtitle'),
          icon: Clock,
          color: 'from-orange-500 to-red-600',
          ctaText: t('prompt.reminder.cta'),
          benefits: benefits.slice(0, 2)
        };
      
      case 'complete':
        return {
          title: t('prompt.complete.title'),
          subtitle: t('prompt.complete.subtitle'),
          icon: CheckCircle,
          color: 'from-green-500 to-blue-600',
          ctaText: t('prompt.complete.cta'),
          benefits: []
        };
      
      default: // welcome
        return {
          title: t('prompt.welcome.title', { name: user?.username || 'there' }),
          subtitle: t('prompt.welcome.subtitle'),
          icon: Sparkles,
          color: 'from-blue-500 to-purple-600',
          ctaText: t('prompt.welcome.cta'),
          benefits: benefits
        };
    }
  };

  const content = getContent();
  const ContentIcon = content.icon;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        style={{ direction: isRTL ? 'rtl' : 'ltr' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-lg"
        >
          <Card className="p-0 overflow-hidden bg-white dark:bg-gray-800 shadow-2xl">
            {/* Header */}
            <div className={cn(
              "relative p-6 text-white bg-gradient-to-br",
              content.color
            )}>
              {/* Close button */}
              <button
                onClick={() => handleDismiss('close_button')}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Content */}
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-2xl flex items-center justify-center"
                >
                  <ContentIcon className="w-8 h-8 text-white" />
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold mb-2"
                >
                  {content.title}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/90 leading-relaxed"
                >
                  {content.subtitle}
                </motion.p>
              </div>

              {/* Progress indicator for multi-step */}
              {progressSteps[type] && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 flex justify-center space-x-2"
                >
                  {progressSteps[type].map((_, index) => (
                    <div
                      key={index}
                      className="w-2 h-2 rounded-full bg-white/40"
                    />
                  ))}
                </motion.div>
              )}
            </div>

            {/* Content body */}
            <div className="p-6 space-y-6">
              {/* Benefits showcase */}
              {content.benefits.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-center">
                    {t('prompt.benefitsTitle')}
                  </h3>

                  <div className="grid gap-3">
                    <AnimatePresence mode="wait">
                      {content.benefits.map((benefit, index) => {
                        const BenefitIcon = benefit.icon;
                        const isActive = type === 'welcome' ? index === currentStep : true;
                        
                        if (type === 'welcome' && !isActive) return null;

                        return (
                          <motion.div
                            key={benefit.title}
                            initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: isRTL ? -20 : 20 }}
                            transition={{ duration: 0.3 }}
                            className={cn(
                              "p-4 rounded-xl border-2 transition-all",
                              isActive 
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                : "border-gray-200 dark:border-gray-700"
                            )}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                                benefit.bgColor
                              )}>
                                <BenefitIcon className={cn("w-5 h-5", benefit.color)} />
                              </div>
                              
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                                  {benefit.title}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {benefit.description}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>

                  {/* Progress dots for welcome type */}
                  {type === 'welcome' && (
                    <div className="flex justify-center space-x-2">
                      {benefits.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentStep(index)}
                          className={cn(
                            "w-2 h-2 rounded-full transition-all",
                            index === currentStep
                              ? "bg-blue-500 w-6"
                              : "bg-gray-300 dark:bg-gray-600"
                          )}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Time estimate */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>
                    {type === 'reminder' 
                      ? t('prompt.timeEstimate.quick')
                      : t('prompt.timeEstimate.full')
                    }
                  </span>
                </div>
              </div>

              {/* Social proof */}
              {type === 'welcome' && (
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <div className="flex -space-x-2">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 border-2 border-white dark:border-gray-800"
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      +{Math.floor(Math.random() * 900 + 100)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('prompt.socialProof')}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-6 bg-gray-50 dark:bg-gray-800 space-y-3">
              <Button
                variant="primary"
                onClick={handleStart}
                disabled={isAnimating}
                loading={isAnimating}
                className="w-full h-12 text-lg font-semibold"
              >
                {isAnimating ? (
                  t('prompt.starting')
                ) : (
                  <>
                    {content.ctaText}
                    <ArrowRight className={cn("w-5 h-5", isRTL ? "mr-2" : "ml-2")} />
                  </>
                )}
              </Button>

              <div className="flex gap-3">
                {onSkip && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      onSkip();
                      handleDismiss('skipped');
                    }}
                    className="flex-1"
                  >
                    {t('prompt.skipForNow')}
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  onClick={() => handleDismiss('maybe_later')}
                  className="flex-1"
                >
                  {t('prompt.maybeLater')}
                </Button>
              </div>

              {/* Skip notice */}
              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                {t('prompt.skipNotice')}
              </p>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingPromptDialog; 