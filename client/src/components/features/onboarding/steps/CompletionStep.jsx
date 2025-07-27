/**
 * 🎉 ONBOARDING COMPLETION STEP
 * Simple completion step for onboarding flow
 */

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Sparkles, ArrowRight } from 'lucide-react';
import { useTranslation } from '../../../../stores';
import { Button, Card } from '../../../ui';

const CompletionStep = ({ data, onDataChange, onNext, onPrev }) => {
  const { t } = useTranslation();

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-8 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <CheckCircle className="w-20 h-20 text-green-500" />
              <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
          </div>

          {/* Title */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {t('onboarding.completion.title', { fallback: '🎉 Welcome to SpendWise!' })}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t('onboarding.completion.subtitle', { 
                fallback: 'Your account is set up and ready to help you manage your finances!' 
              })}
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-white text-sm">📊</span>
              </div>
              <p className="text-sm font-medium">Smart Analytics</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-white text-sm">💰</span>
              </div>
              <p className="text-sm font-medium">Budget Tracking</p>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-white text-sm">🎯</span>
              </div>
              <p className="text-sm font-medium">Goal Setting</p>
            </div>
          </div>

          {/* Action */}
          <Button
            onClick={onNext}
            className="w-full md:w-auto px-8 py-3"
            size="lg"
          >
            {t('onboarding.completion.getStarted', { fallback: 'Get Started' })}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      </Card>
    </div>
  );
};

export default CompletionStep; 