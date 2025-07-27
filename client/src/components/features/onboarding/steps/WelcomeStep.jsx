/**
 * 🎯 WELCOME STEP - MOBILE-FIRST REVOLUTION!
 * Perfect mobile design with new translations and Zustand integration
 * @version 2.0.0
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, TrendingUp, PieChart, Target, 
  Smartphone, Shield, Zap, Heart,
  ArrowRight, Play, CheckCircle
} from 'lucide-react';

// ✅ NEW: Import from Zustand stores instead of Context
import { useTranslation, useTheme } from '../../../../stores';

import { Button } from '../../../ui';
import { cn } from '../../../../utils/helpers';

/**
 * 🚀 WelcomeStep - MOBILE-FIRST PERFECTION!
 */
const WelcomeStep = ({ 
  onNext, 
  isFirstStep, 
  isLastStep 
}) => {
  // ✅ NEW: Use Zustand stores
  const { t, isRTL } = useTranslation('onboarding');
  const { isDark } = useTheme();

  // Enhanced features data
  const features = [
    {
      icon: TrendingUp,
      title: t('welcome.features.tracking.title'),
      description: t('welcome.features.tracking.description'),
      color: 'bg-green-500',
      gradient: 'from-green-400 to-green-600'
    },
    {
      icon: PieChart,
      title: t('welcome.features.analytics.title'),
      description: t('welcome.features.analytics.description'),
      color: 'bg-blue-500',
      gradient: 'from-blue-400 to-blue-600'
    },
    {
      icon: Target,
      title: t('welcome.features.goals.title'),
      description: t('welcome.features.goals.description'),
      color: 'bg-purple-500',
      gradient: 'from-purple-400 to-purple-600'
    },
    {
      icon: Smartphone,
      title: t('welcome.features.mobile.title'),
      description: t('welcome.features.mobile.description'),
      color: 'bg-orange-500',
      gradient: 'from-orange-400 to-orange-600'
    }
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  const featureVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-full flex flex-col"
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      {/* Hero section - Mobile optimized */}
      <motion.div
        variants={itemVariants}
        className="text-center mb-8"
      >
        {/* Animated logo/icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            delay: 0.3, 
            duration: 0.8, 
            type: "spring", 
            stiffness: 200 
          }}
          className="relative mx-auto mb-6 w-24 h-24 md:w-32 md:h-32"
        >
          <div className={cn(
            "w-full h-full rounded-3xl",
            "bg-gradient-to-br from-primary-400 to-primary-600",
            "flex items-center justify-center",
            "shadow-xl shadow-primary-500/25",
            "relative overflow-hidden"
          )}>
            {/* Animated background pattern */}
            <motion.div
              animate={{ 
                rotate: 360,
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
              }}
              className="absolute inset-0 opacity-20"
            >
              <div className="w-full h-full bg-gradient-to-br from-white to-transparent" />
            </motion.div>
            
            <Sparkles className="w-12 h-12 md:w-16 md:h-16 text-white relative z-10" />
          </div>
        </motion.div>

        {/* Main title */}
        <motion.h1
          variants={itemVariants}
          className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
        >
          <span className="bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            {t('welcome.title')}
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={itemVariants}
          className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto leading-relaxed"
        >
          {t('welcome.subtitle')}
        </motion.p>

        {/* Description */}
        <motion.p
          variants={itemVariants}
          className="text-gray-500 dark:text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed"
        >
          {t('welcome.description')}
        </motion.p>

        {/* Time estimate badge */}
        <motion.div
          variants={itemVariants}
          className={cn(
            "inline-flex items-center px-4 py-2 rounded-full",
            "bg-primary-50 dark:bg-primary-900/20",
            "border border-primary-200 dark:border-primary-700",
            "text-primary-700 dark:text-primary-300 text-sm font-medium"
          )}
        >
          <Shield className="w-4 h-4 mr-2" />
          {t('welcome.timeEstimate')}
        </motion.div>
      </motion.div>

      {/* Features grid - Mobile optimized */}
      <motion.div
        variants={itemVariants}
        className="flex-1 mb-8"
      >
        <motion.h2
          variants={itemVariants}
          className="text-xl md:text-2xl font-semibold text-center mb-8 text-gray-900 dark:text-gray-100"
        >
          {t('welcome.features.title')}
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={featureVariants}
              transition={{ delay: index * 0.1 }}
              whileHover={{ 
                scale: 1.02,
                transition: { duration: 0.2 }
              }}
              className={cn(
                "relative p-6 rounded-2xl",
                "bg-white dark:bg-gray-800",
                "border border-gray-200 dark:border-gray-700",
                "shadow-sm hover:shadow-md",
                "transition-all duration-200",
                "group cursor-pointer"
              )}
            >
              {/* Feature icon */}
              <div className={cn(
                "w-12 h-12 rounded-xl mb-4",
                "bg-gradient-to-br", feature.gradient,
                "flex items-center justify-center",
                "group-hover:scale-110 transition-transform duration-200"
              )}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>

              {/* Feature content */}
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                {feature.title}
              </h3>
              
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                {feature.description}
              </p>

              {/* Hover indicator */}
              <motion.div
                className={cn(
                  "absolute top-4 opacity-0 group-hover:opacity-100",
                  "transition-opacity duration-200",
                  isRTL ? "left-4" : "right-4"
                )}
              >
                <CheckCircle className="w-5 h-5 text-green-500" />
              </motion.div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Call to action - Mobile optimized */}
      <motion.div
        variants={itemVariants}
        className="text-center"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            size="lg"
            variant="primary"
            onClick={onNext}
            className={cn(
              "text-lg px-8 py-4 rounded-xl",
              "bg-gradient-to-r from-primary-500 to-primary-600",
              "hover:from-primary-600 hover:to-primary-700",
              "shadow-lg shadow-primary-500/25",
              "border-0 min-w-[200px]"
            )}
          >
            {isRTL ? (
              <>
                <ArrowRight className="w-5 h-5 mr-3 rotate-180" />
                {t('welcome.cta')}
              </>
            ) : (
              <>
                {t('welcome.cta')}
                <ArrowRight className="w-5 h-5 ml-3" />
              </>
            )}
          </Button>
        </motion.div>

        {/* Additional encouragement */}
        <motion.p
          variants={itemVariants}
          className="text-sm text-gray-500 dark:text-gray-400 mt-4"
        >
          {t('welcome.timeEstimate')} • {t('modal.skip')} 
        </motion.p>
      </motion.div>

      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating sparkles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.8, 0.3],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeInOut"
            }}
            className={cn(
              "absolute w-2 h-2 rounded-full",
              "bg-gradient-to-r from-primary-400 to-primary-600",
              i % 2 === 0 ? "top-1/4" : "top-3/4",
              `${isRTL ? 'right' : 'left'}-[${10 + i * 15}%]`
            )}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default WelcomeStep; 