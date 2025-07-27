/**
 * 🔄 RECURRING EXPLANATION STEP - MOBILE-FIRST
 * Enhanced explanation of recurring transactions for onboarding
 * NOW WITH ZUSTAND STORES! 🎉
 * @version 2.0.0
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Repeat, Calendar, TrendingUp, TrendingDown, Clock,
  CheckCircle, Play, Pause, RotateCcw, Zap, Target,
  ArrowRight, ChevronRight, Lightbulb, Gift
} from 'lucide-react';

// ✅ NEW: Import from Zustand stores instead of Context
import {
  useTranslation,
  useCurrency,
  useTheme,
  useNotifications
} from '../../../../stores';

import { Button, Card, Badge } from '../../../ui';
import { cn } from '../../../../utils/helpers';

const RecurringExplanationStep = ({
  onNext,
  onPrevious,
  onSkip,
  className = ''
}) => {
  // ✅ NEW: Use Zustand stores
  const { t, isRTL } = useTranslation('onboarding');
  const { formatCurrency } = useCurrency();
  const { isDark } = useTheme();
  const { addNotification } = useNotifications();

  const [currentExample, setCurrentExample] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);

  // Example recurring transactions
  const examples = [
    {
      id: 'salary',
      type: 'income',
      description: t('recurring.examples.salary.description'),
      amount: 5000,
      frequency: 'monthly',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      benefits: [
        t('recurring.examples.salary.benefit1'),
        t('recurring.examples.salary.benefit2'),
        t('recurring.examples.salary.benefit3')
      ]
    },
    {
      id: 'rent',
      type: 'expense',
      description: t('recurring.examples.rent.description'),
      amount: 1200,
      frequency: 'monthly',
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      benefits: [
        t('recurring.examples.rent.benefit1'),
        t('recurring.examples.rent.benefit2'),
        t('recurring.examples.rent.benefit3')
      ]
    },
    {
      id: 'subscription',
      type: 'expense',
      description: t('recurring.examples.subscription.description'),
      amount: 15,
      frequency: 'monthly',
      icon: Repeat,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      benefits: [
        t('recurring.examples.subscription.benefit1'),
        t('recurring.examples.subscription.benefit2'),
        t('recurring.examples.subscription.benefit3')
      ]
    }
  ];

  // Key benefits of recurring transactions
  const keyBenefits = [
    {
      icon: Clock,
      title: t('recurring.benefits.automation.title'),
      description: t('recurring.benefits.automation.description'),
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      icon: Target,
      title: t('recurring.benefits.budgeting.title'),
      description: t('recurring.benefits.budgeting.description'),
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    },
    {
      icon: Zap,
      title: t('recurring.benefits.insights.title'),
      description: t('recurring.benefits.insights.description'),
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20'
    }
  ];

  // Handle example animation
  const playAnimation = useCallback(() => {
    setIsPlaying(true);
    setAnimationStep(0);

    const animationSteps = [
      () => setAnimationStep(1), // Show transaction creation
      () => setAnimationStep(2), // Show scheduling
      () => setAnimationStep(3), // Show automation
      () => setAnimationStep(4), // Show completion
      () => {
        setAnimationStep(0);
        setIsPlaying(false);
      }
    ];

    animationSteps.forEach((step, index) => {
      setTimeout(step, (index + 1) * 1500);
    });
  }, []);

  // Handle next example
  const nextExample = useCallback(() => {
    setCurrentExample((prev) => (prev + 1) % examples.length);
    setAnimationStep(0);
    setIsPlaying(false);
  }, [examples.length]);

  // Handle previous example
  const previousExample = useCallback(() => {
    setCurrentExample((prev) => (prev - 1 + examples.length) % examples.length);
    setAnimationStep(0);
    setIsPlaying(false);
  }, [examples.length]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: isRTL ? -20 : 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 }
    }
  };

  const currentExampleData = examples[currentExample];
  const ExampleIcon = currentExampleData.icon;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("space-y-8", className)}
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
          <Repeat className="w-8 h-8 text-white" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('recurring.explanation.title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-2 max-w-md mx-auto">
            {t('recurring.explanation.subtitle')}
          </p>
        </div>
      </motion.div>

      {/* Interactive Example */}
      <motion.div variants={itemVariants}>
        <Card className="p-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700">
          {/* Example selector */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('recurring.explanation.example')}
            </h3>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={previousExample}
                disabled={isPlaying}
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
              </Button>
              
              <span className="text-sm text-gray-500 dark:text-gray-400 px-2">
                {currentExample + 1} / {examples.length}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={nextExample}
                disabled={isPlaying}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Example visualization */}
          <div className="space-y-4">
            {/* Transaction card */}
            <motion.div
              animate={{
                scale: animationStep >= 1 ? 1.05 : 1,
                boxShadow: animationStep >= 1 
                  ? '0 10px 25px rgba(0,0,0,0.1)' 
                  : '0 1px 3px rgba(0,0,0,0.1)'
              }}
              transition={{ duration: 0.3 }}
              className={cn(
                "p-4 rounded-xl border-2 transition-all",
                animationStep >= 1 
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    currentExampleData.bgColor
                  )}>
                    <ExampleIcon className={cn("w-5 h-5", currentExampleData.color)} />
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {currentExampleData.description}
                    </h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {t(`recurring.frequency.${currentExampleData.frequency}`)}
                      </Badge>
                      
                      {animationStep >= 2 && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center text-xs text-green-600 dark:text-green-400"
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          {t('recurring.explanation.scheduled')}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <Badge 
                    variant={currentExampleData.type === 'income' ? 'success' : 'destructive'}
                    className="text-lg font-bold"
                  >
                    {currentExampleData.type === 'income' ? '+' : '-'}
                    {formatCurrency(currentExampleData.amount)}
                  </Badge>
                  
                  {animationStep >= 3 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-gray-500 dark:text-gray-400 mt-1"
                    >
                      {t('recurring.explanation.automated')}
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Animation timeline */}
            <div className="flex items-center justify-center space-x-4 py-4">
              {[1, 2, 3, 4].map((step) => (
                <motion.div
                  key={step}
                  className={cn(
                    "w-3 h-3 rounded-full transition-all",
                    animationStep >= step
                      ? "bg-primary-500 scale-125"
                      : "bg-gray-300 dark:bg-gray-600"
                  )}
                  animate={{
                    scale: animationStep === step ? [1, 1.5, 1] : 1
                  }}
                  transition={{ duration: 0.5 }}
                />
              ))}
            </div>

            {/* Animation controls */}
            <div className="flex justify-center">
              <Button
                variant="primary"
                onClick={playAnimation}
                disabled={isPlaying}
                className="min-w-[150px]"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    {t('recurring.explanation.playing')}
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    {t('recurring.explanation.playDemo')}
                  </>
                )}
              </Button>
            </div>

            {/* Current example benefits */}
            <div className="mt-6 space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                {t('recurring.explanation.benefits')}:
              </h4>
              <div className="space-y-1">
                {currentExampleData.benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center text-sm text-gray-600 dark:text-gray-400"
                  >
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    {benefit}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Key Benefits */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center">
          {t('recurring.explanation.whyUseRecurring')}
        </h3>
        
        <div className="grid gap-4 md:grid-cols-3">
          {keyBenefits.map((benefit, index) => {
            const BenefitIcon = benefit.icon;
            return (
              <motion.div
                key={benefit.title}
                variants={itemVariants}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-4 text-center h-full">
                  <div className={cn(
                    "w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3",
                    benefit.bgColor
                  )}>
                    <BenefitIcon className={cn("w-6 h-6", benefit.color)} />
                  </div>
                  
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {benefit.title}
                  </h4>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {benefit.description}
                  </p>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Pro tip */}
      <motion.div variants={itemVariants}>
        <Card className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                {t('recurring.explanation.proTip')}
              </h4>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {t('recurring.explanation.proTipDescription')}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Navigation */}
      <motion.div 
        variants={itemVariants}
        className="flex justify-between items-center pt-6"
      >
        <Button
          variant="outline"
          onClick={onPrevious}
        >
          {t('navigation.previous')}
        </Button>

        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            onClick={onSkip}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {t('navigation.skipForNow')}
          </Button>
          
          <Button
            variant="primary"
            onClick={onNext}
            className="min-w-[120px]"
          >
            {t('navigation.gotIt')}
            <ChevronRight className={cn("w-4 h-4", isRTL ? "mr-2" : "ml-2")} />
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default RecurringExplanationStep; 