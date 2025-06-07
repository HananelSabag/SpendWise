// components/features/dashboard/QuickActionsBar.jsx

import React, { useState, useRef, useEffect } from 'react';
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
import { useTransactions } from '../../../hooks/useTransactions';
import { useCurrency } from '../../../context/CurrencyContext';
import { useDate } from '../../../context/DateContext';
import { Card, Button, Badge } from '../../ui';
import { amountValidation } from '../../../utils/validationSchemas';

const QuickActionsBar = () => {
  const { t, language } = useLanguage();
  // ✅ FIX: Use only the createTransaction function, not full hook
  const { createTransaction, isCreating } = useTransactions({
    limit: 1 // Minimal config since we're only creating
  });
  const { formatAmount, currency } = useCurrency();
  const { selectedDate, getDateForServer, resetToToday } = useDate();
  
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [todayWarning, setTodayWarning] = useState(false);
  const [showActionsPanel, setShowActionsPanel] = useState(false);
  const inputRef = useRef(null);
  
  const isRTL = language === 'he';

  // Check if selected date is today
  useEffect(() => {
    const today = new Date();
    const selected = new Date(selectedDate);
    const isToday = today.toDateString() === selected.toDateString();
    setTodayWarning(!isToday);
  }, [selectedDate, getDateForServer]);

  // Enhanced quick amounts with visual improvements
  const quickAmounts = [
    { value: 10, color: 'bg-blue-100 text-blue-600 hover:bg-blue-200' },
    { value: 25, color: 'bg-green-100 text-green-600 hover:bg-green-200' },
    { value: 50, color: 'bg-purple-100 text-purple-600 hover:bg-purple-200' },
    { value: 100, color: 'bg-orange-100 text-orange-600 hover:bg-orange-200' },
    { value: 250, color: 'bg-red-100 text-red-600 hover:bg-red-200' }
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
      
      // ✅ NEW: Use the same createTransaction method as AddTransactions
      await createTransaction(type, {
        amount: parseFloat(amount),
        description: t('dashboard.quickActions.defaultDescription'),
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

  return (
    <Card className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-0 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {t('dashboard.quickActions.title')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('dashboard.quickActions.subtitle')}
          </p>
        </div>
        
        {/* Today warning */}
        {todayWarning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-3 py-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg border border-amber-200 dark:border-amber-800"
          >
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
              {t('dashboard.quickActions.notToday')}
            </span>
            <button
              onClick={resetToToday}
              className="text-xs font-medium text-amber-600 hover:text-amber-800 underline"
            >
              {t('dashboard.quickActions.goToToday')}
            </button>
          </motion.div>
        )}
      </div>

      {/* Amount Input Section */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          {t('dashboard.quickActions.amount')}
        </label>
        
        {/* Quick amount buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {quickAmounts.map((quick) => (
            <motion.button
              key={quick.value}
              onClick={() => handleQuickAmount(quick.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${quick.color}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {currency.symbol}{quick.value}
            </motion.button>
          ))}
        </div>
        
        {/* Amount input */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={amount}
            onChange={handleAmountChange}
            placeholder="0.00"
            className="w-full text-2xl font-bold py-4 px-4 pr-16 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <span className="text-lg font-medium text-gray-400">{currency.symbol}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {quickActions.slice(0, 2).map((action) => (
          <motion.button
            key={action.id}
            onClick={() => handleSubmit(action.actionType)}
            // ✅ NEW: Use isCreating from hook instead of local loading
            disabled={isCreating || !amount}
            className={`p-4 rounded-xl bg-gradient-to-r ${action.gradient} text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-center gap-2">
              <action.icon className="w-5 h-5" />
              <span>{action.title}</span>
              {/* ✅ NEW: Show loading indicator using hook state */}
              {isCreating && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                />
              )}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Advanced Actions Button */}
      <motion.button
        onClick={() => setShowActionsPanel(true)}
        className="w-full p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center justify-center gap-2">
          <Plus className="w-5 h-5" />
          <span className="font-medium">{t('dashboard.quickActions.advanced')}</span>
        </div>
      </motion.button>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <div className="flex items-center gap-2 text-red-800">
              <X className="w-4 h-4" />
              <span className="text-sm font-medium">{error}</span>
              <button
                onClick={() => setError('')}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Animation */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg"
          >
            <div className="flex items-center gap-3 text-green-800">
              <motion.div
                className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <Check className="w-4 h-4 text-white" />
              </motion.div>
              <div>
                <h4 className="font-semibold">{t('actions.success')}</h4>
                <p className="text-sm text-green-600">{t('actions.transactionAdded')}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default QuickActionsBar;