/**
 * RecurringExplanationStep Component - Explains recurring transactions
 * 
 * ✅ FEATURES:
 * - Interactive explanation
 * - Examples and scenarios
 * - Visual demonstrations
 * - Benefits highlighting
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RefreshCw, Calendar, Clock, TrendingUp, 
  DollarSign, Home, Phone, Lightbulb,
  ChevronDown, ArrowRight, Play, CheckCircle
} from 'lucide-react';

import { useLanguage } from '../../../../context/LanguageContext';
import { cn } from '../../../../utils/helpers';
import { Button } from '../../../ui';

/**
 * RecurringExplanationStep - Learn about recurring transactions
 */
const RecurringExplanationStep = ({ onNext, onPrevious, stepData, updateStepData }) => {
  const { t, language } = useLanguage();
  const isRTL = language === 'he';
  
  const [currentExample, setCurrentExample] = useState(0);
  const [playingDemo, setPlayingDemo] = useState(false);

  // Example scenarios
  const examples = [
    {
      type: 'income',
      icon: DollarSign,
      title: t('onboarding.welcome.examples.salary'),
      amount: 5000,
      frequency: t('transactions.frequencies.monthly'),
      description: t('recurring.examples.salaryDesc'),
      color: 'green'
    },
    {
      type: 'expense',
      icon: Home,
      title: t('onboarding.welcome.examples.rent'),
      amount: -1200,
      frequency: t('transactions.frequencies.monthly'),
      description: t('recurring.examples.rentDesc'),
      color: 'red'
    },
    {
      type: 'expense',
      icon: Phone,
      title: t('onboarding.welcome.examples.phone'),
      amount: -50,
      frequency: t('transactions.frequencies.monthly'),
      description: t('recurring.examples.phoneDesc'),
      color: 'blue'
    }
  ];

  // Benefits of recurring transactions
  const benefits = [
    {
      icon: Clock,
      title: t('recurring.benefits.timeTitle'),
      description: t('recurring.benefits.timeDesc')
    },
    {
      icon: TrendingUp,
      title: t('recurring.benefits.insightsTitle'),
      description: t('recurring.benefits.insightsDesc')
    },
    {
      icon: CheckCircle,
      title: t('recurring.benefits.accuracyTitle'),
      description: t('recurring.benefits.accuracyDesc')
    }
  ];

  // Play demo animation
  const playDemo = () => {
    setPlayingDemo(true);
    setTimeout(() => setPlayingDemo(false), 3000);
  };

  // Next example
  const nextExample = () => {
    setCurrentExample((prev) => (prev + 1) % examples.length);
  };

  const currentExampleData = examples[currentExample];

  return (
    <div className={cn(
      "flex flex-col items-center justify-center min-h-screen p-6",
      "bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800"
    )}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-8 text-white">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white/20 p-3 rounded-full">
              <RefreshCw className="w-8 h-8" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-center mb-2">
            {t('onboarding.recurring.title')}
          </h2>
          
          <p className="text-center text-purple-100">
            {t('onboarding.recurring.subtitle')}
          </p>
        </div>

        <div className="p-8">
          {/* What are recurring transactions */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
              {t('recurring.whatAre.title')}
            </h3>
            
            <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed mb-6">
              {t('recurring.whatAre.description')}
            </p>

            {/* Interactive example */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {t('recurring.examples.title')}
                </h4>
                
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={nextExample}
                    className="text-sm"
                  >
                    {t('common.next')} {t('common.example')}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={playDemo}
                    disabled={playingDemo}
                    className="text-sm"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    {t('recurring.examples.demo')}
                  </Button>
                </div>
              </div>

              {/* Example card */}
              <motion.div
                key={currentExample}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "border-2 rounded-lg p-4 transition-all",
                  currentExampleData.color === 'green' && "border-green-200 bg-green-50 dark:bg-green-900/20",
                  currentExampleData.color === 'red' && "border-red-200 bg-red-50 dark:bg-red-900/20",
                  currentExampleData.color === 'blue' && "border-blue-200 bg-blue-50 dark:bg-blue-900/20",
                  playingDemo && "animate-pulse"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <currentExampleData.icon className={cn(
                      "w-6 h-6 mr-3",
                      currentExampleData.color === 'green' && "text-green-600",
                      currentExampleData.color === 'red' && "text-red-600",
                      currentExampleData.color === 'blue' && "text-blue-600"
                    )} />
                    
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white">
                        {currentExampleData.title}
                      </h5>
                      <p className="text-sm text-gray-500">
                        {currentExampleData.frequency}
                      </p>
                    </div>
                  </div>
                  
                  <div className={cn(
                    "text-lg font-bold",
                    currentExampleData.amount > 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {currentExampleData.amount > 0 ? '+' : ''}
                    {Math.abs(currentExampleData.amount).toLocaleString()}₪
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                  {currentExampleData.description}
                </p>

                {playingDemo && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 3 }}
                    className="h-1 bg-blue-500 rounded-full mt-3"
                  />
                )}
              </motion.div>
            </div>
          </div>

          {/* Benefits */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
              {t('recurring.benefits.title')}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center p-6 bg-white dark:bg-gray-700 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-full mb-4">
                    <benefit.icon className="w-6 h-6" />
                  </div>
                  
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {benefit.title}
                  </h4>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {benefit.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Call to action */}
          <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t('recurring.cta.title')}
            </h4>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {t('recurring.cta.description')}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className={cn(
          "flex justify-between items-center p-8 border-t border-gray-200 dark:border-gray-700",
          isRTL ? "flex-row-reverse" : ""
        )}>
          <Button
            variant="ghost"
            onClick={onPrevious}
            className="flex items-center"
          >
            {isRTL ? <ChevronDown className="w-4 h-4 mr-2 rotate-90" /> : <ChevronDown className="w-4 h-4 ml-2 -rotate-90" />}
            {t('onboarding.common.previous')}
          </Button>

          <div className="text-center">
            <Button
              variant="ghost"
              onClick={onNext}
              className="text-gray-500 text-sm"
            >
              {t('onboarding.common.skip')}
            </Button>
          </div>

          <Button
            onClick={onNext}
            className="flex items-center bg-purple-500 hover:bg-purple-600 text-white px-8"
          >
            {t('recurring.cta.button')}
            {isRTL ? <ArrowRight className="w-4 h-4 mr-2 rotate-180" /> : <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default RecurringExplanationStep; 