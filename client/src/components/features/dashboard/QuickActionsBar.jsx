// components/features/dashboard/QuickActionsBar.jsx

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
        date: getDateForServer(selectedDate),
        is_recurring: false
      });
      
      setSuccess(true);
      setAmount('');
      
      // Reset success state after animation
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
      
    } catch (err) {
      setError(err.message || t('actions.errors.addingTransaction'));
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
      {/* ENHANCED: Much more visible animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-red-500 to-pink-500 rounded-2xl shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-tr from-yellow-400/20 via-orange-300/30 to-red-400/20 rounded-2xl"></div>
        
        {/* ENHANCED: More visible floating orbs - responsive sizes */}
        <motion.div 
          className="absolute top-2 right-2 w-12 sm:w-20 h-12 sm:h-20 bg-white/30 rounded-full blur-2xl"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.4, 0.8, 0.4]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-2 left-2 w-8 sm:w-16 h-8 sm:h-16 bg-yellow-300/40 rounded-full blur-xl"
          animate={{ 
            scale: [1.2, 0.8, 1.2],
            opacity: [0.5, 0.9, 0.5]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/3 w-6 sm:w-12 h-6 sm:h-12 bg-red-300/50 rounded-full blur-lg"
          animate={{ 
            y: [-10, 10, -10],
            x: [-5, 5, -5],
            opacity: [0.3, 0.7, 0.3]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.div 
          className="absolute bottom-1/3 right-1/3 w-4 sm:w-8 h-4 sm:h-8 bg-orange-200/60 rounded-full blur-md"
          animate={{ 
            scale: [0.8, 1.4, 0.8],
            opacity: [0.2, 0.6, 0.2]
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        />
      </div>

      {/* ENHANCED: More transparent card to show background */}
      <Card className="relative bg-white/85 dark:bg-gray-900/85 backdrop-blur-xl border-0 shadow-2xl rounded-2xl overflow-hidden">
        
        {/* 📱 MOBILE VERSION: Compact layout with beautiful effects */}
        <div className="lg:hidden relative p-3">
          {/* ENHANCED: Mobile glow effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-orange-400/15 via-red-400/15 to-pink-400/15 blur-xl"></div>
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-orange-300/10 to-transparent"></div>
          
          <div className="relative z-10 space-y-3">
            {/* Mobile Header with success indicator */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <motion.div 
                  className="relative p-2 bg-gradient-to-br from-orange-400 via-red-500 to-pink-500 rounded-xl shadow-lg"
                  whileHover={{ scale: 1.1, rotate: 10 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  style={{
                    boxShadow: '0 6px 20px rgba(249, 115, 22, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-300 to-red-400 rounded-xl blur-lg opacity-70"></div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent rounded-xl"></div>
                  <Zap className="relative w-4 h-4 text-white drop-shadow-lg" />
                </motion.div>
                
                <div>
                  <h3 className="text-sm font-bold bg-gradient-to-r from-gray-800 via-orange-700 to-red-800 dark:from-white dark:via-orange-100 dark:to-red-100 bg-clip-text text-transparent drop-shadow-sm">
                    {t('dashboard.quickActions.title') || 'Quick Add'}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {t('dashboard.quickActions.subtitle') || 'Fast transactions'}
                  </p>
                </div>
              </div>
              
              <AnimatePresence>
                {success && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="flex items-center gap-1 bg-green-400/20 dark:bg-green-600/30 backdrop-blur-md text-green-700 dark:text-green-300 px-2 py-1 rounded-full text-xs border border-green-300/50 shadow-lg"
                  >
                    <Check className="w-3 h-3" />
                    ✓
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Mobile Type Switch with enhanced glow */}
            <div className="flex rounded-xl bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-md p-1 shadow-inner border border-white/20">
              <motion.button
                onClick={() => setActiveType('expense')}
                className={`flex-1 flex items-center justify-center gap-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all relative ${
                  activeType === 'expense'
                    ? 'text-white shadow-lg'
                    : 'text-red-700 dark:text-red-300'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  background: activeType === 'expense' 
                    ? 'linear-gradient(135deg, rgb(239, 68, 68), rgb(220, 38, 38))'
                    : 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.1))',
                  border: '1px solid rgba(239, 68, 68, 0.2)'
                }}
              >
                <TrendingDown className="w-3 h-3 relative z-10 drop-shadow-sm" />
                <span className="relative z-10 drop-shadow-sm">{t('transactions.expense')}</span>
              </motion.button>
              
              <motion.button
                onClick={() => setActiveType('income')}
                className={`flex-1 flex items-center justify-center gap-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all relative ${
                  activeType === 'income'
                    ? 'text-white shadow-lg'
                    : 'text-green-700 dark:text-green-300'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  background: activeType === 'income' 
                    ? 'linear-gradient(135deg, rgb(34, 197, 94), rgb(22, 163, 74))'
                    : 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(22, 163, 74, 0.1))',
                  border: '1px solid rgba(34, 197, 94, 0.2)'
                }}
              >
                <TrendingUp className="w-3 h-3 relative z-10 drop-shadow-sm" />
                <span className="relative z-10 drop-shadow-sm">{t('transactions.income')}</span>
              </motion.button>
            </div>
            
            {/* Mobile Amount Input Field with enhanced glow */}
            <div className="space-y-2">
              <div className="relative">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-400/10 via-red-400/10 to-pink-400/10 blur-md"></div>
                
                <input
                  ref={inputRef}
                  type="text"
                  value={amount}
                  onChange={handleAmountChangeMobile}
                  onKeyPress={handleKeyPress}
                  placeholder="0.00"
                  className="relative w-full p-3 text-center text-lg font-bold border-2 border-white/50 rounded-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-md text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-4 focus:ring-orange-400/30 focus:border-orange-400 transition-all"
                  style={{
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                  }}
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm font-bold text-gray-500 drop-shadow-sm">
                  {currency?.symbol || '₪'}
                </div>
              </div>
              
              {/* Mobile quick amount buttons with enhanced glow */}
              <div className="grid grid-cols-5 gap-1.5">
                {mobileQuickAmounts.map((quickAmount) => (
                  <motion.button
                    key={quickAmount}
                    onClick={() => handleQuickAmountMobile(quickAmount)}
                    className="py-2 px-1 text-xs font-bold transition-all rounded-lg shadow-lg backdrop-blur-sm border border-white/30"
                    whileHover={{ scale: 1.08, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      background: `linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(239, 68, 68, 0.1))`,
                      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                      color: '#c2410c'
                    }}
                  >
                    <span className="relative z-10 drop-shadow-sm">{formatAmount(quickAmount)}</span>
                  </motion.button>
                ))}
              </div>
            </div>
            
            {/* Mobile Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-red-600 dark:text-red-400 bg-red-100/80 dark:bg-red-900/30 backdrop-blur-md p-2 rounded-lg border border-red-300/50 dark:border-red-700/50 text-center shadow-lg"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Mobile Submit Button with stunning effects */}
            <motion.button
              onClick={() => handleSubmit(activeType)}
              disabled={isCreating || !amount || parseFloat(amount) <= 0}
              className={`w-full py-3 text-sm font-bold rounded-xl transition-all relative overflow-hidden ${
                activeType === 'expense'
                  ? 'bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 disabled:from-red-300 disabled:to-red-400'
                  : 'bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 disabled:from-green-300 disabled:to-green-400'
              } text-white disabled:text-gray-500 disabled:cursor-not-allowed shadow-xl`}
              whileHover={{ scale: isCreating ? 1 : 1.02, y: isCreating ? 0 : -1 }}
              whileTap={{ scale: isCreating ? 1 : 0.98 }}
              style={{
                boxShadow: activeType === 'expense' 
                  ? '0 6px 25px rgba(239, 68, 68, 0.3)' 
                  : '0 6px 25px rgba(34, 197, 94, 0.3)'
              }}
            >
              {/* Enhanced mobile button glow */}
              <div className={`absolute inset-0 rounded-xl blur-lg opacity-60 group-hover:opacity-90 transition-opacity ${
                activeType === 'expense' 
                  ? 'bg-gradient-to-r from-red-300 to-red-400' 
                  : 'bg-gradient-to-r from-green-300 to-green-400'
              }`}></div>
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent rounded-xl"></div>
              
              {/* Enhanced floating particles */}
              <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-white/60 rounded-full animate-pulse"></div>
              <div className="absolute bottom-1 left-1 w-1 h-1 bg-white/80 rounded-full animate-ping delay-300"></div>
              
              <AnimatePresence mode="wait">
                {isCreating ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="relative z-10 flex items-center justify-center gap-2"
                  >
                    <motion.div
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <span className="drop-shadow-lg">{t('actions.adding') || 'מוסיף...'}</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="submit"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="relative z-10 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4 drop-shadow-lg" />
                    <span className="drop-shadow-lg">
                      {t('actions.add') || 'הכנס'} {activeType === 'expense' ? t('transactions.expense') : t('transactions.income')}
                      {amount && ` • ${formatAmount(parseFloat(amount))}`}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* 💻 DESKTOP VERSION: Original beautiful layout */}
        <div className="hidden lg:block relative p-4 sm:p-6">
          {/* ENHANCED: Multiple layered glow effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 via-red-400/20 to-pink-400/20 blur-2xl"></div>
          <div className="absolute top-0 left-0 w-full h-2/3 bg-gradient-to-b from-orange-300/15 to-transparent"></div>
          <div className="absolute bottom-0 right-0 w-2/3 h-full bg-gradient-to-l from-red-300/10 to-transparent"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <motion.div 
                  className="relative p-3 sm:p-4 bg-gradient-to-br from-orange-400 via-red-500 to-pink-500 rounded-2xl shadow-2xl"
                  whileHover={{ scale: 1.1, rotate: 10 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  style={{
                    boxShadow: '0 10px 30px rgba(249, 115, 22, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                  }}
                >
                  {/* ENHANCED: Multiple glow layers for icon */}
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-300 to-red-400 rounded-2xl blur-xl opacity-80"></div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent rounded-2xl"></div>
                  <div className="absolute inset-0 bg-white/10 rounded-2xl"></div>
                  <Zap className="relative w-5 sm:w-6 h-5 sm:h-6 text-white drop-shadow-2xl" />
                </motion.div>
                
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-800 via-orange-700 to-red-800 dark:from-white dark:via-orange-100 dark:to-red-100 bg-clip-text text-transparent drop-shadow-lg">
                    {t('dashboard.quickActions.title')}
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 font-medium">
                    {t('dashboard.quickActions.subtitle')}
                  </p>
                </div>
              </div>
              
              {/* ENHANCED: More visible today warning */}
              {todayWarning && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 px-3 py-2 bg-amber-400/20 dark:bg-amber-600/30 backdrop-blur-md rounded-xl border border-amber-300/50 dark:border-amber-500/50 shadow-xl"
                  style={{
                    boxShadow: '0 4px 20px rgba(245, 158, 11, 0.2)'
                  }}
                >
                  <Clock className="w-4 h-4 text-amber-700 dark:text-amber-300" />
                  <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                    {t('dashboard.quickActions.notToday')}
                  </span>
                  <button
                    onClick={resetToToday}
                    className="text-sm font-bold text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100 underline"
                  >
                    {t('dashboard.quickActions.goToToday')}
                  </button>
                </motion.div>
              )}
            </div>

            {/* ENHANCED: Amount Input Section with stronger visual effects */}
            <div className="mb-6">
              <label className="block text-base font-bold text-gray-800 dark:text-gray-200 mb-3">
                {t('dashboard.quickActions.amount')}
              </label>
              
              {/* ENHANCED: More vibrant quick amount buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                {quickAmounts.map((quick) => (
                  <motion.button
                    key={quick.value}
                    onClick={() => handleQuickAmount(quick.value)}
                    className="px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg backdrop-blur-sm border border-white/30"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      background: quick.color.includes('blue') ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(29, 78, 216, 0.2))' : 
                                  quick.color.includes('green') ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(21, 128, 61, 0.2))' :
                                  quick.color.includes('purple') ? 'linear-gradient(135deg, rgba(147, 51, 234, 0.3), rgba(107, 33, 168, 0.2))' :
                                  quick.color.includes('orange') ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.3), rgba(194, 65, 12, 0.2))' :
                                  'linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(185, 28, 28, 0.2))',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                      color: quick.color.includes('blue') ? '#1e40af' : 
                             quick.color.includes('green') ? '#15803d' :
                             quick.color.includes('purple') ? '#6b21a8' :
                             quick.color.includes('orange') ? '#c2410c' : '#b91c1c'
                    }}
                  >
                    <span className="relative z-10 drop-shadow-sm">{currency.symbol}{quick.value}</span>
                  </motion.button>
                ))}
              </div>
              
              {/* ENHANCED: Much more visible amount input with strong glow */}
              <div className="relative">
                {/* ENHANCED: Multiple background glow layers */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-400/20 via-red-400/20 to-pink-400/20 blur-xl"></div>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/30 to-transparent"></div>
                
                <motion.input
                  ref={inputRef}
                  type="text"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="0.00"
                  className="relative w-full text-2xl font-bold py-4 px-4 pr-16 rounded-2xl border-2 border-white/50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl focus:border-orange-400 focus:ring-4 focus:ring-orange-400/30 transition-all"
                  whileFocus={{ scale: 1.02 }}
                  style={{
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                  }}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <span className="text-xl font-bold text-gray-500 drop-shadow-sm">{currency.symbol}</span>
                </div>
              </div>
            </div>

            {/* ENHANCED: Much more stunning action buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.button
                onClick={() => handleSubmit('expense')}
                disabled={isCreating || !amount}
                className="group relative overflow-hidden p-4 rounded-2xl bg-gradient-to-r from-red-400 via-red-500 to-red-600 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  boxShadow: '0 10px 40px rgba(239, 68, 68, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                }}
              >
                {/* ENHANCED: Multiple glow layers for buttons */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-300 to-red-400 rounded-2xl blur-2xl opacity-70 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent rounded-2xl"></div>
                <div className="absolute inset-0 bg-white/5 rounded-2xl"></div>
                
                {/* ENHANCED: More visible floating particles */}
                <div className="absolute top-2 right-2 w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
                <div className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-white/80 rounded-full animate-ping delay-300"></div>
                <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-white/50 rounded-full animate-pulse delay-700"></div>
                
                <div className="relative z-10 flex items-center justify-center gap-3">
                  <TrendingDown className="w-5 h-5 drop-shadow-2xl" />
                  <span className="text-base drop-shadow-2xl">{t('actions.quickExpense')}</span>
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
                className="group relative overflow-hidden p-4 rounded-2xl bg-gradient-to-r from-green-400 via-green-500 to-green-600 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  boxShadow: '0 10px 40px rgba(34, 197, 94, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                }}
              >
                {/* ENHANCED: Multiple glow layers for buttons */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-300 to-green-400 rounded-2xl blur-2xl opacity-70 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent rounded-2xl"></div>
                <div className="absolute inset-0 bg-white/5 rounded-2xl"></div>
                
                {/* ENHANCED: More visible floating particles */}
                <div className="absolute top-2 right-2 w-2 h-2 bg-white/60 rounded-full animate-pulse delay-500"></div>
                <div className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-white/80 rounded-full animate-ping delay-700"></div>
                <div className="absolute top-1/2 left-1/3 w-1 h-1 bg-white/50 rounded-full animate-pulse delay-200"></div>
                
                <div className="relative z-10 flex items-center justify-center gap-3">
                  <TrendingUp className="w-5 h-5 drop-shadow-2xl" />
                  <span className="text-base drop-shadow-2xl">{t('actions.quickIncome')}</span>
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
        </div>

        {/* ENHANCED: More visible error and success states - shared for both mobile and desktop */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-4 mb-4 p-3 bg-red-100/80 dark:bg-red-900/40 backdrop-blur-md border border-red-300/50 dark:border-red-700/50 rounded-xl shadow-xl"
              style={{
                boxShadow: '0 4px 20px rgba(239, 68, 68, 0.2)'
              }}
            >
              <div className="flex items-center gap-3 text-red-800 dark:text-red-300">
                <X className="w-4 h-4" />
                <span className="text-sm font-semibold">{error}</span>
                <button
                  onClick={() => setError('')}
                  className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                >
                  <X className="w-4 h-4" />
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
              className="mx-4 mb-4 p-4 bg-green-100/80 dark:bg-green-900/40 backdrop-blur-md border border-green-300/50 dark:border-green-700/50 rounded-xl shadow-xl"
              style={{
                boxShadow: '0 6px 25px rgba(34, 197, 94, 0.3)'
              }}
            >
              <div className="flex items-center gap-4 text-green-800 dark:text-green-300">
                <motion.div
                  className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-xl"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  style={{
                    boxShadow: '0 4px 15px rgba(34, 197, 94, 0.4)'
                  }}
                >
                  <Check className="w-4 h-4 text-white drop-shadow-lg" />
                </motion.div>
                <div>
                  <h4 className="font-bold text-base drop-shadow-sm">{t('actions.success')}</h4>
                  <p className="text-sm text-green-700 dark:text-green-400 font-medium">{t('actions.transactionAdded')}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

export default QuickActionsBar;