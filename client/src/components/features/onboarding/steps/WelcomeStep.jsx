/**
 * WelcomeStep Component - First step of onboarding
 * 
 * ✅ FEATURES:
 * - Beautiful welcome message
 * - Overview of SpendWise features
 * - Introduction to recurring transactions
 * - Animated elements
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, RefreshCw, BarChart3, Shield, 
  Zap, Target, ArrowRight, Play 
} from 'lucide-react';

import { useLanguage } from '../../../../context/LanguageContext';
import { useAuth } from '../../../../context/AuthContext';
import { cn } from '../../../../utils/helpers';
import { Button } from '../../../ui';

/**
 * WelcomeStep - Introduction to SpendWise
 */
const WelcomeStep = ({ onNext, stepData, updateStepData }) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const isRTL = language === 'he';

  // Feature highlights
  const features = [
    {
      icon: RefreshCw,
      title: t('onboarding.welcome.features.recurring.title'),
      description: t('onboarding.welcome.features.recurring.description'),
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    },
    {
      icon: BarChart3,
      title: t('onboarding.welcome.features.analytics.title'),
      description: t('onboarding.welcome.features.analytics.description'),
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      icon: Shield,
      title: t('onboarding.welcome.features.security.title'),
      description: t('onboarding.welcome.features.security.description'),
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", duration: 0.8 }}
            className="p-4 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-full"
          >
            <Sparkles className="w-12 h-12 text-purple-600 dark:text-purple-400" />
          </motion.div>
        </div>

        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4"
        >
          {t('onboarding.welcome.greeting', { name: user?.username || t('common.user') })}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed"
        >
          {t('onboarding.welcome.description')}
        </motion.p>
      </motion.div>

      {/* Features Grid */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="grid md:grid-cols-3 gap-6 mb-12"
      >
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 + (index * 0.1), duration: 0.5 }}
            className={cn(
              "p-6 rounded-2xl border border-gray-200 dark:border-gray-700",
              "bg-white dark:bg-gray-800 hover:shadow-lg transition-all duration-300",
              "transform hover:-translate-y-1"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center mb-4",
              feature.bgColor
            )}>
              <feature.icon className={cn("w-6 h-6", feature.color)} />
            </div>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {feature.title}
            </h3>

            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Recurring Transactions Highlight */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.4, duration: 0.6 }}
        className={cn(
          "relative p-8 rounded-3xl",
          "bg-gradient-to-br from-purple-50 to-blue-50",
          "dark:from-purple-900/20 dark:to-blue-900/20",
          "border border-purple-200 dark:border-purple-700/50"
        )}
      >
        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* Icon and Title */}
          <div className="flex-shrink-0 text-center lg:text-left">
            <div className="inline-flex p-4 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl mb-4">
              <RefreshCw className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {t('onboarding.welcome.highlight.title')}
            </h3>
            <p className="text-purple-600 dark:text-purple-400 font-medium">
              {t('onboarding.welcome.highlight.subtitle')}
            </p>
          </div>

          {/* Description */}
          <div className="flex-1">
            <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed mb-6">
              {t('onboarding.welcome.highlight.description')}
            </p>

            {/* Examples */}
            <div className="flex flex-wrap gap-3">
              {[
                t('onboarding.welcome.examples.salary'),
                t('onboarding.welcome.examples.rent'),
                t('onboarding.welcome.examples.phone'),
                t('onboarding.welcome.examples.utilities')
              ].map((example, index) => (
                <motion.span
                  key={example}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.8 + (index * 0.1), duration: 0.4 }}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium",
                    "bg-white dark:bg-gray-800 text-purple-700 dark:text-purple-300",
                    "border border-purple-200 dark:border-purple-700"
                  )}
                >
                  {example}
                </motion.span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 0.6 }}
        className="text-center mt-12"
      >
        <p className="text-gray-600 dark:text-gray-300 text-lg mb-8">
          {t('onboarding.welcome.cta.description')}
        </p>

        <Button
          onClick={onNext}
          size="lg"
          className={cn(
            "px-8 py-4 text-lg font-semibold",
            "bg-gradient-to-r from-purple-600 to-blue-600",
            "hover:from-purple-700 hover:to-blue-700",
            "transform hover:scale-105 transition-all duration-200",
            "shadow-lg hover:shadow-xl"
          )}
        >
          <span className="flex items-center gap-3">
            <Play className="w-5 h-5" />
            {t('onboarding.welcome.cta.button')}
            {isRTL ? (
              <ArrowRight className="w-5 h-5 rotate-180" />
            ) : (
              <ArrowRight className="w-5 h-5" />
            )}
          </span>
        </Button>
      </motion.div>

      {/* Bottom Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.4, duration: 0.6 }}
        className="grid grid-cols-3 gap-6 mt-16 pt-8 border-t border-gray-200 dark:border-gray-700"
      >
        {[
          { number: '5', label: t('onboarding.welcome.stats.minutes') },
          { number: '3', label: t('onboarding.welcome.stats.steps') },
          { number: '∞', label: t('onboarding.welcome.stats.benefits') }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.6 + (index * 0.1), duration: 0.4 }}
            className="text-center"
          >
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
              {stat.number}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default WelcomeStep; 