/**
 * 🎯 WELCOME STEP - MOBILE-FIRST WITH TRANSLATION FIXES
 * Perfect mobile design with translations and fallbacks
 * @version 2.1.0 - TRANSLATION FIXES
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, TrendingUp, PieChart, Target, 
  Smartphone, Shield, Zap, Heart,
  ArrowRight, Play, CheckCircle
} from 'lucide-react';

// ✅ Import from Zustand stores
import { useTranslation, useTheme } from '../../../../stores';

import { Button } from '../../../ui';
import { cn } from '../../../../utils/helpers';

/**
 * 🚀 WelcomeStep - MOBILE-FIRST WITH TRANSLATION FIXES!
 */
const WelcomeStep = ({ 
  onNext, 
  isFirstStep, 
  isLastStep 
}) => {
  // ✅ Use Zustand stores
  const { t, isRTL, loadModule } = useTranslation('onboarding');
  const { isDark } = useTheme();

  // ✅ Force load onboarding module on component mount
  React.useEffect(() => {
    const forceLoadOnboarding = async () => {
      try {
        console.log('🔍 WelcomeStep: Force loading onboarding translations...');
        await loadModule('onboarding');
        console.log('✅ WelcomeStep: Onboarding translations loaded');
      } catch (error) {
        console.error('❌ WelcomeStep: Failed to load onboarding translations:', error);
      }
    };
    
    forceLoadOnboarding();
  }, [loadModule]);

  // ✅ DEBUG: Check translations
  React.useEffect(() => {
    console.log('🔍 WelcomeStep translation debug:', {
      welcomeTitle: t('welcome.title'),
      welcomeSubtitle: t('welcome.subtitle'),
      featuresTitle: t('welcome.features.title'),
      trackingTitle: t('welcome.features.tracking.title'),
      isTranslationWorking: typeof t === 'function'
    });
  }, [t]);

  // ✅ ENHANCED: Features data with fallbacks
  const features = [
    {
      icon: TrendingUp,
      title: t('welcome.features.tracking.title') || 'Smart Tracking',
      description: t('welcome.features.tracking.description') || 'Automatically categorize and track your expenses with AI-powered insights',
      color: 'bg-green-500',
      gradient: 'from-green-400 to-green-600'
    },
    {
      icon: PieChart,
      title: t('welcome.features.analytics.title') || 'Visual Analytics',
      description: t('welcome.features.analytics.description') || 'Beautiful charts and reports to understand your spending patterns',
      color: 'bg-blue-500',
      gradient: 'from-blue-400 to-blue-600'
    },
    {
      icon: Target,
      title: t('welcome.features.goals.title') || 'Financial Goals',
      description: t('welcome.features.goals.description') || 'Set and track budgets, savings goals, and financial milestones',
      color: 'bg-purple-500',
      gradient: 'from-purple-400 to-purple-600'
    },
    {
      icon: Smartphone,
      title: t('welcome.features.mobile.title') || 'Mobile-First',
      description: t('welcome.features.mobile.description') || 'Perfect experience on all devices - phone, tablet, and desktop',
      color: 'bg-orange-500',
      gradient: 'from-orange-400 to-orange-600'
    },
    {
      icon: Shield,
      title: t('welcome.features.security.title') || 'Bank-Grade Security',
      description: t('welcome.features.security.description') || 'Your financial data is protected with enterprise-level encryption',
      color: 'bg-red-500',
      gradient: 'from-red-400 to-red-600'
    },
    {
      icon: Zap,
      title: t('welcome.features.automation.title') || 'Smart Automation',
      description: t('welcome.features.automation.description') || 'Recurring transactions and intelligent categorization save you time',
      color: 'bg-yellow-500',
      gradient: 'from-yellow-400 to-yellow-600'
    }
  ];

  // ✅ ENHANCED: Benefits data with fallbacks
  const benefits = [
    {
      icon: Heart,
      title: t('welcome.benefits.items.easy') || 'Easy to use interface',
      color: 'text-pink-600'
    },
    {
      icon: TrendingUp,
      title: t('welcome.benefits.items.powerful') || 'Powerful analytics',
      color: 'text-green-600'
    },
    {
      icon: Shield,
      title: t('welcome.benefits.items.secure') || 'Bank-grade security',
      color: 'text-blue-600'
    },
    {
      icon: Smartphone,
      title: t('welcome.benefits.items.mobile') || 'Works everywhere',
      color: 'text-purple-600'
    }
  ];

  // ✅ ENHANCED: Stats data with fallbacks
  const stats = [
    {
      value: t('welcome.stats.users') || '50K+ Users',
      label: 'Active Users'
    },
    {
      value: t('welcome.stats.tracked') || '$2M+ Tracked',
      label: 'Total Tracked'
    },
    {
      value: t('welcome.stats.categories') || '100+ Categories',
      label: 'Categories'
    },
    {
      value: t('welcome.stats.countries') || '25+ Countries',
      label: 'Countries'
    }
  ];

  return (
    <div className={cn(
      "w-full h-full flex flex-col",
      "overflow-y-auto",
      // ✅ ENHANCED: Much more space for wider modal
      "px-4 py-6 sm:px-8 sm:py-8 lg:px-16 lg:py-12",
      "space-y-8 sm:space-y-12"
    )}>
      
      {/* ✅ Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-4xl mx-auto"
      >
        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className={cn(
            "text-3xl sm:text-4xl lg:text-5xl font-bold",
            "bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent",
            "mb-4 sm:mb-6"
          )}
        >
          {t('welcome.title') || 'Welcome to SpendWise!'}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className={cn(
            "text-lg sm:text-xl text-gray-600 dark:text-gray-300",
            "mb-6 sm:mb-8",
            "leading-relaxed"
          )}
        >
          {t('welcome.subtitle') || 'Your smart financial companion'}
        </motion.p>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className={cn(
            "text-base text-gray-500 dark:text-gray-400",
            "max-w-2xl mx-auto mb-8",
            "leading-relaxed"
          )}
        >
          {t('welcome.description') || 'Take control of your finances with powerful expense tracking, insights, and automation.'}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
        >
          <Button
            onClick={onNext}
            size="lg"
            className="px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            <Play className="w-5 h-5 mr-2" />
            {t('welcome.cta.getStarted') || 'Get Started'}
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            className="px-8 py-4 text-lg font-semibold"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            {t('welcome.cta.letsGo') || 'Let\'s Go!'}
          </Button>
        </motion.div>
      </motion.div>

      {/* ✅ Features Grid */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="w-full"
      >
        <h2 className={cn(
          "text-2xl sm:text-3xl font-bold text-center mb-8",
          "text-gray-900 dark:text-white"
        )}>
          {t('welcome.features.title') || 'Why Choose SpendWise?'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                className={cn(
                  "p-6 rounded-2xl",
                  "bg-white dark:bg-gray-800",
                  "border border-gray-200 dark:border-gray-700",
                  "shadow-lg hover:shadow-xl",
                  "transition-all duration-300",
                  "hover:scale-105"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-lg mb-4",
                  `bg-gradient-to-r ${feature.gradient}`,
                  "flex items-center justify-center"
                )}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ✅ Stats Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-6 bg-gray-50 dark:bg-gray-800 rounded-2xl p-8"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9 + index * 0.1, duration: 0.4 }}
            className="text-center"
          >
            <div className="text-2xl sm:text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">
              {stat.value}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default WelcomeStep; 