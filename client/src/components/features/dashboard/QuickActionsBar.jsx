// components/features/dashboard/QuickActionsBar.jsx

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingDown, 
  TrendingUp, 
  Clock, 
  Plus,
  Check,
  X,
  Zap
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
// ✅ NEW: Updated imports - Use new hooks instead of old context
import { useTransactionActions } from '../../../hooks/useTransactionActions';
import { useCurrency } from '../../../context/CurrencyContext';
import { useDate } from '../../../context/DateContext';
import { Card, Button, Badge } from '../../ui';
import { amountValidation } from '../../../utils/validationSchemas';

const QuickActionsBar = () => {
  const { t, language } = useLanguage();
  const { createTransaction, isCreating } = useTransactionActions();
  const { formatAmount, currency } = useCurrency();
  const { selectedDate, getDateForServer, resetToToday } = useDate();
  
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [todayWarning, setTodayWarning] = useState(false);
  const [showActionsPanel, setShowActionsPanel] = useState(false);
  // ✅ NEW: Add mobile-specific state
  const [activeType, setActiveType] = useState('expense');
  const inputRef = useRef(null);
  
  const isRTL = language === 'he';

  // Check if selected date is today
  useEffect(() => {
    const today = new Date();
    const selected = new Date(selectedDate);
    const isToday = today.toDateString() === selected.toDateString();
    setTodayWarning(!isToday);
  }, [selectedDate, getDateForServer]);

  // ✅ NEW: Enhanced date protection with UX logic
  const isHistoricalDate = useMemo(() => {
    const today = new Date();
    const selected = new Date(selectedDate);
    return today.toDateString() !== selected.toDateString();
  }, [selectedDate]);

  // ✅ NEW: Smart date handling for transactions
  const getTransactionDate = useCallback(() => {
    // For historical dates, show warning but allow user choice
    if (isHistoricalDate) {
      return getDateForServer(selectedDate);
    }
    // For today, use current date
    return getDateForServer(new Date());
  }, [selectedDate, isHistoricalDate, getDateForServer]);

  // Compact quick amounts with enhanced visual improvements
  const quickAmounts = [
    { value: 10, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800/40' },
    { value: 25, color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800/40' },
    { value: 50, color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-800/40' },
    { value: 100, color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-800/40' },
    { value: 250, color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800/40' }
  ];

  const handleQuickAmount = (value) => {
    setAmount(value.toString());
    inputRef.current?.focus();
  };

  // ✅ NEW: Updated handleSubmit to use new hooks
  const handleSubmit = async (type = 'expense') => {
    if (!amount || parseFloat(amount) <= 0) {
      setError(t('actions.errors.amountRequired'));
      return;
    }

    try {
      setError('');
      
      // ✅ NEW: Dynamic description based on transaction type
      const getDescription = (transactionType) => {
        switch (transactionType) {
          case 'expense':
            return t('dashboard.quickActions.quickExpense') || 'Quick Expense';
          case 'income':
            return t('dashboard.quickActions.quickIncome') || 'Quick Income';
          case 'recurring':
            return t('dashboard.quickActions.quickRecurring') || 'Quick Recurring';
          default:
            return t('dashboard.quickActions.defaultDescription') || 'Quick Transaction';
        }
      };
      
      // ✅ NEW: Use the same createTransaction method as AddTransactions
      await createTransaction(type, {
        amount: parseFloat(amount),
        description: getDescription(type),
        category_id: 8, // Default category
        date: getTransactionDate(),
        is_recurring: false
      });
      
      // ✅ ENHANCED: Beautiful success animation + reset
      setSuccess(true);
      setAmount(''); // Clear input immediately
      
      // Reset success state after animation
      setTimeout(() => {
        setSuccess(false);
      }, 2500);
      
    } catch (err) {
      // ✅ ENHANCED: Show error animation
      setError(err.message || t('actions.errors.addingTransaction'));
      
      // Clear error after a reasonable time
      setTimeout(() => {
        setError('');
      }, 4000);
    }
  };

  const handleAmountChange = (e) => {
    const formattedAmount = amountValidation.formatAmountInput(e.target.value);
    setAmount(formattedAmount);
  };

  // Animation variants
  const successVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 30
      }
    },
    exit: { 
      scale: 0, 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 200
      }
    }
  };

  const quickActions = [
    {
      id: 'expense',
      title: t('actions.quickExpense'),
      subtitle: t('actions.quickExpenseDesc'),
      icon: TrendingDown,
      color: 'red',
      gradient: 'from-red-500 to-red-600',
      actionType: 'expense'
    },
    {
      id: 'income',
      title: t('actions.quickIncome'),
      subtitle: t('actions.quickIncomeDesc'),
      icon: TrendingUp,
      color: 'green',
      gradient: 'from-green-500 to-green-600',
      actionType: 'income'
    },
    {
      id: 'recurring',
      title: t('actions.recurringSetup'),
      subtitle: t('actions.recurringSetupDesc'),
      icon: Clock,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      actionType: 'recurring'
    }
  ];

  // ✅ NEW: Enhanced mobile quick amounts (shorter for mobile)
  const mobileQuickAmounts = [10, 20, 50, 100, 200];

  // ✅ NEW: Enhanced mobile handlers
  const handleQuickAmountMobile = useCallback((value) => {
    setAmount(value.toString());
    setError('');
    inputRef.current?.focus();
  }, []);
  
  const handleAmountChangeMobile = useCallback((e) => {
    const value = e.target.value.replace(/[^\d.-]/g, '');
    setAmount(value);
    setError('');
  }, []);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !isCreating) {
      handleSubmit(activeType);
    }
  }, [activeType, isCreating]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
      data-component="QuickActionsBar"
    >
      {/* ✅ CLEAN: Simple gradient background - no orange! */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20 rounded-2xl"></div>
      </div>

      {/* 🚀 UNIFIED RESPONSIVE QUICK ACTIONS */}
      <Card variant="clean" padding="adaptive" className="relative overflow-hidden">
        <div className="adaptive-section">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-orange-400 via-red-500 to-pink-500 rounded-lg sm:rounded-xl">
                <Zap className="icon-adaptive-base text-white" />
              </div>
              <div>
                <h3 className="text-adaptive-base font-bold text-gray-900 dark:text-white">
                  {t('dashboard.quickActions.title') || 'Quick Add'}
                </h3>
                <p className="text-adaptive-xs text-gray-600 dark:text-gray-400">
                  {t('dashboard.quickActions.subtitle') || 'Fast transactions'}
                </p>
              </div>
            </div>
            
            {/* Historical Date Warning - Responsive */}
            <AnimatePresence>
              {isHistoricalDate && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg border border-amber-300 dark:border-amber-700"
                >
                  <Clock className="icon-adaptive-sm text-amber-700 dark:text-amber-300" />
                  <div>
                    <span className="text-adaptive-xs font-semibold text-amber-800 dark:text-amber-200">
                      {t('dashboard.quickActions.historicalDateWarning', 'Historical Date Mode')}
                    </span>
                    <button
                      onClick={resetToToday}
                      className="ml-2 text-adaptive-xs font-bold text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100 underline"
                    >
                      {t('dashboard.quickActions.goToToday', 'Today')}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Historical Date Warning - Unified */}
          <AnimatePresence>
            {isHistoricalDate && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg adaptive-card"
              >
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                  <Clock className="icon-adaptive-sm" />
                  <div className="flex-1">
                    <p className="text-adaptive-xs font-medium">
                      {t('dashboard.quickActions.historicalDateWarning', 'Historical Date Mode')}
                    </p>
                    <p className="text-xs opacity-80">
                      {new Date(selectedDate).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US')}
                    </p>
                  </div>
                  <button
                    onClick={resetToToday}
                    className="text-xs bg-amber-200 dark:bg-amber-800 px-2 py-1 rounded hover:bg-amber-300 dark:hover:bg-amber-700 transition-colors"
                  >
                    {t('dashboard.quickActions.goToToday', 'Today')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Type Switch - Mobile Only */}
          <div className="sm:hidden mb-4 flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
            <motion.button
              onClick={() => setActiveType('expense')}
              className={`flex-1 flex items-center justify-center gap-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                activeType === 'expense'
                  ? 'bg-red-500 text-white shadow-lg'
                  : 'text-red-700 dark:text-red-300'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <TrendingDown className="icon-adaptive-sm" />
              <span>{t('transactions.expense')}</span>
            </motion.button>
            
            <motion.button
              onClick={() => setActiveType('income')}
              className={`flex-1 flex items-center justify-center gap-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                activeType === 'income'
                  ? 'bg-green-500 text-white shadow-lg'
                  : 'text-green-700 dark:text-green-300'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <TrendingUp className="icon-adaptive-sm" />
              <span>{t('transactions.income')}</span>
            </motion.button>
          </div>
          
          {/* Amount Input Section */}
          <div className="mb-4">
            <label className="hidden sm:block text-adaptive-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
              {t('dashboard.quickActions.amount')}
            </label>
            
            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-5 sm:flex sm:flex-wrap gap-1.5 mb-3">
              {quickAmounts.slice(0, 5).map((quick) => (
                <motion.button
                  key={quick.value}
                  onClick={() => handleQuickAmount(quick.value)}
                  className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md ${quick.color}`}
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {formatAmount(quick.value)}
                </motion.button>
              ))}
            </div>
            
            {/* Amount Input Field */}
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={amount}
                onChange={handleAmountChange}
                onKeyPress={handleKeyPress}
                placeholder="0.00"
                className="w-full text-center sm:text-left text-lg sm:text-xl font-bold py-3 px-3 sm:pr-12 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30 transition-all"
              />
              <div className="absolute left-3 sm:right-3 top-1/2 -translate-y-1/2 sm:left-auto text-sm font-bold text-gray-500">
                {currency?.symbol || '₪'}
              </div>
            </div>
          </div>
          
          {/* Submit Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Mobile: Single dynamic button */}
            <motion.button
              onClick={() => handleSubmit(activeType)}
              disabled={isCreating || !amount || parseFloat(amount) <= 0}
              className={`sm:hidden w-full py-3 text-adaptive-sm font-bold rounded-xl transition-all relative overflow-hidden text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-xl ${
                activeType === 'expense'
                  ? 'bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600'
                  : 'bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600'
              }`}
              whileHover={{ scale: isCreating ? 1 : 1.02, y: isCreating ? 0 : -1 }}
              whileTap={{ scale: isCreating ? 1 : 0.98 }}
            >
              <AnimatePresence mode="wait">
                {isCreating ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center gap-2"
                  >
                    <motion.div
                      className="icon-adaptive-sm border-2 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <span>{t('actions.adding') || 'Adding...'}</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="submit"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center gap-2"
                  >
                    <Plus className="icon-adaptive-sm" />
                    <span>
                      {t('actions.add') || 'Add'} {activeType === 'expense' ? t('transactions.expense') : t('transactions.income')}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
            
            {/* Desktop: Dual buttons - Fixed sizing */}
            <motion.button
              onClick={() => handleSubmit('expense')}
              disabled={isCreating || !amount}
              className="hidden sm:block py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-400 via-red-500 to-red-600 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-center gap-2">
                <TrendingDown className="w-4 h-4" />
                <span className="text-sm">{t('actions.quickExpense')}</span>
                {isCreating && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                )}
              </div>
            </motion.button>

            <motion.button
              onClick={() => handleSubmit('income')}
              disabled={isCreating || !amount}
              className="hidden sm:block py-2.5 px-4 rounded-xl bg-gradient-to-r from-green-400 via-green-500 to-green-600 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">{t('actions.quickIncome')}</span>
                {isCreating && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                )}
              </div>
            </motion.button>
          </div>
                 </div>
       </Card>
       
       {/* Shared Error and Success States */}
       <AnimatePresence>
         {error && (
           <motion.div
             initial={{ opacity: 0, height: 0 }}
             animate={{ opacity: 1, height: 'auto' }}
             exit={{ opacity: 0, height: 0 }}
             className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
           >
             <div className="flex items-center gap-2 text-red-800 dark:text-red-300">
               <X className="icon-adaptive-sm" />
               <span className="text-adaptive-sm font-semibold">{error}</span>
               <button
                 onClick={() => setError('')}
                 className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
               >
                 <X className="icon-adaptive-sm" />
               </button>
             </div>
           </motion.div>
         )}
       </AnimatePresence>

       <AnimatePresence>
         {success && (
           <motion.div
             initial={{ opacity: 0, scale: 0.9, height: 0 }}
             animate={{ opacity: 1, scale: 1, height: 'auto' }}
             exit={{ opacity: 0, scale: 0.9, height: 0 }}
             className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
           >
             <div className="flex items-center gap-4 text-green-800 dark:text-green-300">
               <motion.div
                 className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                 initial={{ scale: 0 }}
                 animate={{ scale: 1 }}
                 transition={{ type: "spring", stiffness: 500, damping: 30 }}
               >
                 <Check className="w-4 h-4 text-white" />
               </motion.div>
               <div>
                 <h4 className="font-bold text-adaptive-base">{t('actions.success')}</h4>
                 <p className="text-adaptive-sm text-green-700 dark:text-green-400">{t('actions.transactionAdded')}</p>
               </div>
             </div>
           </motion.div>
         )}
       </AnimatePresence>
    </motion.div>
  );
};

export default QuickActionsBar;