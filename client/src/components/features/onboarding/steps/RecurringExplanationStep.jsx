/**
 * RecurringExplanationStep Component - Enhanced explanation with real TransactionCard examples
 * 
 * ✅ ENHANCED FEATURES:
 * - Uses REAL TransactionCard component from the main app
 * - Shows expanded comparison: recurring vs one-time transactions
 * - Edit options visible by default (no animation needed)
 * - Better space utilization with no scrolling
 * - Improved button alignment and spacing
 * - Modern design with better visual hierarchy
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RefreshCw, Calendar, Clock, TrendingUp, 
  DollarSign, Home, Phone, Coffee,
  ChevronDown, ArrowRight, Play, CheckCircle,
  Plus, Search, Filter, Settings, CreditCard, Layers, 
  Target, Sparkles, Shield, Users, Zap, BarChart3,
  Star, Crown, Heart, Repeat, Activity,
  Edit2, Trash2, Pause, CalendarX, ChevronLeft
} from 'lucide-react';

import { useLanguage } from '../../../../context/LanguageContext';
import { useCurrency } from '../../../../context/CurrencyContext';
import { cn } from '../../../../utils/helpers';
import { Button } from '../../../ui';

/**
 * DemoTransactionCard - Simplified card component specifically for onboarding demo
 * Shows edit options by default without animation or real functionality
 */
const DemoTransactionCard = ({ transaction, isRTL, formatAmount, t }) => {
  const isRecurring = transaction.is_recurring;
  const isExpense = transaction.type === 'expense';
  
  // Demo action buttons (non-functional)
  const demoActions = isRecurring ? [
    { icon: Edit2, label: t('transactions.editThis'), color: 'blue' },
    { icon: Zap, label: t('transactions.editAll'), color: 'purple' },
    { icon: Pause, label: t('transactions.pause'), color: 'orange' },
    { icon: CalendarX, label: t('transactions.skipNext'), color: 'yellow' },
    { icon: Trash2, label: t('common.delete'), color: 'red' }
  ] : [
    { icon: Edit2, label: t('common.edit'), color: 'blue' },
    { icon: Trash2, label: t('common.delete'), color: 'red' }
  ];

  return (
    <div className={cn(
      'bg-white dark:bg-gray-800 rounded-xl border-2 overflow-hidden',
      'shadow-sm transition-all duration-200',
      isRecurring 
        ? 'border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/30 to-indigo-50/30 dark:from-purple-900/5 dark:to-indigo-900/5'
        : 'border-gray-200 dark:border-gray-700'
    )}>
      {/* Card Header */}
      <div className="p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              'p-1.5 rounded-lg',
              isExpense ? 'bg-red-100 dark:bg-red-900/20' : 'bg-green-100 dark:bg-green-900/20'
            )}>
              <DollarSign className={cn(
                'w-3 h-3',
                isExpense ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
              )} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-xs">
                {transaction.description}
              </h3>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300">
                  <Calendar className="w-2 h-2" />
                  <span className="text-xs">Jun 14</span>
                </div>
                <div className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300">
                  {transaction.category_name}
                </div>
                {isRecurring && (
                  <div className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 rounded text-xs text-purple-700 dark:text-purple-300 font-medium">
                    Monthly
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className={cn(
            'text-sm font-bold',
            isExpense ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
          )}>
            {isExpense ? '-' : '+'}{formatAmount(Math.abs(transaction.amount))}
          </div>
        </div>
      </div>

      {/* Demo Actions - Always Visible */}
      <div className="border-t border-gray-100 dark:border-gray-700 p-2 bg-gray-50/50 dark:bg-gray-800/50">
        <div className="grid grid-cols-2 gap-1.5">
          {demoActions.map((action, index) => (
            <button
              key={index}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1.5 rounded-lg border-2 text-xs font-medium transition-all duration-200',
                'cursor-default', // Non-functional demo button
                action.color === 'blue' && 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
                action.color === 'purple' && 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
                action.color === 'orange' && 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700',
                action.color === 'yellow' && 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700',
                action.color === 'red' && 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700'
              )}
              title="Demo only - no functionality"
              disabled
            >
              <action.icon className="w-3 h-3" />
              <span className="truncate">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * RecurringExplanationStep - Enhanced recurring transactions explanation
 * ✅ Shows both transaction types with edit options visible by default
 */
const RecurringExplanationStep = ({ onNext, onPrevious, onSkip }) => {
  const { t, language } = useLanguage();
  const { formatAmount } = useCurrency();
  const isRTL = language === 'he';

  // ✅ DEMO TRANSACTION DATA for visual demonstration
  const recurringTransaction = {
    id: 'demo-recurring-1',
    description: t('onboarding.recurring.examples.salary'),
    amount: 12000,
    type: 'income',
    category_name: t('onboarding.recurring.examples.salaryCat'),
    date: new Date().toISOString().split('T')[0],
    is_recurring: true,
    recurring_interval: 'monthly'
  };

  const oneTimeTransaction = {
    id: 'demo-onetime-1',
    description: t('onboarding.recurring.examples.coffee'),
    amount: -5,
    type: 'expense',
    category_name: t('onboarding.recurring.examples.coffeeCat'),
    date: new Date().toISOString().split('T')[0],
    is_recurring: false
  };

  // ✅ ENHANCED: Key features showcase
  const keyFeatures = [
    {
      icon: RefreshCw,
      title: t('onboarding.recurring.features.manager.title'),
      description: t('onboarding.recurring.features.manager.description'),
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    },
    {
      icon: Plus,
      title: t('onboarding.recurring.features.quickAdd.title'),
      description: t('onboarding.recurring.features.quickAdd.description'),
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      icon: Layers,
      title: t('onboarding.recurring.features.categories.title'),
      description: t('onboarding.recurring.features.categories.description'),
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      icon: BarChart3,
      title: t('onboarding.recurring.features.advanced.title'),
      description: t('onboarding.recurring.features.advanced.description'),
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/20'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col justify-between py-1 bg-gradient-to-br from-purple-50/30 via-indigo-50/20 to-blue-50/30 dark:from-purple-900/10 dark:via-indigo-900/10 dark:to-blue-900/10">
      {/* ✅ COMPACT: Minimal header for no scrolling */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-2"
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <RefreshCw className="w-5 h-5 text-purple-600" />
          </motion.div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {t('onboarding.recurring.title')}
          </h2>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="w-4 h-4 text-yellow-500" />
          </motion.div>
        </div>
        <p className={cn(
          "text-xs text-gray-600 dark:text-gray-300",
          isRTL && "text-right"
        )}>
          {t('onboarding.recurring.tagline')}
        </p>
      </motion.div>

      {/* ✅ ENHANCED: Two-column layout for better space utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 items-start">
        
        {/* Left Column: Demo Transaction Cards */}
        <motion.div
          initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="space-y-2 pb-8"
        >
          <div className="card p-3 rounded-xl">
            <h3 className={cn(
              "text-base font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2",
              isRTL && "flex-row-reverse"
            )}>
              <Crown className="w-4 h-4 text-purple-600" />
              {t('onboarding.recurring.compareTitle')}
            </h3>
            
            {/* ✅ ENHANCED: Demo transaction cards with edit options always visible */}
            <div className="space-y-2">
              {/* Recurring Transaction Card */}
              <div>
                <div className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1 flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  {t('onboarding.recurring.recurringLabel')}
                </div>
                <DemoTransactionCard
                  transaction={recurringTransaction}
                  isRTL={isRTL}
                  formatAmount={formatAmount}
                  t={t}
                />
              </div>
              
              {/* One-time Transaction Card */}
              <div className="pb-6">
                <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  {t('onboarding.recurring.oneTimeLabel')}
                </div>
                <DemoTransactionCard
                  transaction={oneTimeTransaction}
                  isRTL={isRTL}
                  formatAmount={formatAmount}
                  t={t}
                />
              </div>
            </div>

            {/* ✅ KEY DIFFERENCES */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.3 }}
              className="mt-2 p-2 rounded-lg bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800"
            >
              <h4 className="text-xs font-bold text-purple-700 dark:text-purple-300 mb-1 flex items-center gap-1">
                <Star className="w-3 h-3" />
                {t('onboarding.recurring.keyDiffTitle')}
              </h4>
              <ul className={cn(
                "text-xs text-purple-600 dark:text-purple-300 space-y-0.5",
                isRTL && "text-right"
              )}>
                <li>• {t('onboarding.recurring.keyDiff.point1')}</li>
                <li>• {t('onboarding.recurring.keyDiff.point2')}</li>
              </ul>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Column: Benefits and Features */}
        <motion.div
          initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="space-y-2"
        >
          {/* How It Works */}
          <div className="card p-3 rounded-xl">
            <h3 className={cn(
              "text-base font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2",
              isRTL && "flex-row-reverse"
            )}>
              <Zap className="w-4 h-4 text-blue-600" />
              {t('onboarding.recurring.howWorks.title')}
            </h3>
            
                        <div className="space-y-2">
              {/* Monthly distribution explanation */}
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <h4 className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {t('onboarding.recurring.howWorks.title')}
                </h4>
                <p className={cn(
                  "text-xs text-blue-600 dark:text-blue-300",
                  isRTL && "text-right"
                )}>
                  {t('onboarding.recurring.howWorks.desc1')}
                </p>
              </div>

              {/* Peace of Mind */}
              <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800">
                <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-1 flex items-center gap-1">
                  <Heart className="w-3 h-3 text-red-500" />
                  {t('onboarding.recurring.howWorks.peace')}
                </h4>
                <p className={cn(
                  "text-xs text-emerald-600 dark:text-emerald-300",
                  isRTL && "text-right"
                )}>
                  {t('onboarding.recurring.howWorks.desc2')}
                </p>
              </div>
            </div>
          </div>

          {/* Available Tools */}
          <div className="card p-2 rounded-xl">
            <h3 className={cn(
              "text-base font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2",
              isRTL && "flex-row-reverse"
            )}>
              <Activity className="w-4 h-4 text-indigo-600" />
              {t('onboarding.recurring.toolsTitle')}
            </h3>
            
            <div className="space-y-2">
              {keyFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + index * 0.1, duration: 0.3 }}
                    className={cn(
                      "flex items-start gap-2.5 p-2.5 rounded-lg",
                      feature.bgColor,
                      isRTL && "flex-row-reverse text-right"
                    )}
                  >
                    <div className="p-1.5 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                      <Icon className={cn("w-3 h-3", feature.color)} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-0.5">
                        {feature.title}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>


          </div>


        </motion.div>
      </div>

      {/* ✅ FIXED: Bottom buttons with proper positioning */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="flex items-center justify-between mt-3 px-6 pb-3"
      >
        <Button
          onClick={onPrevious}
          variant="outline"
          size="md"
          className="px-6 py-2.5 rounded-lg border-2 text-sm font-medium"
        >
          {t('onboarding.common.previous')}
        </Button>
        
        <Button
          onClick={onNext}
          size="md"
          className="px-8 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg text-sm"
        >
          <span>{t('onboarding.templates.cta.button') || t('onboarding.common.next')}</span>
        </Button>
      </motion.div>
    </div>
  );
};

export default RecurringExplanationStep; 