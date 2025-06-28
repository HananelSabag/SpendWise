// components/features/dashboard/QuickActionsBar.jsx

import React, { useState, useRef, useCallback } from 'react';
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
import { useTransactionActions } from '../../../hooks/useTransactionActions';
import { useCurrency } from '../../../context/CurrencyContext';
import { useDate } from '../../../context/DateContext';
import { Card, Button } from '../../ui';
import { amountValidation } from '../../../utils/validationSchemas';

const QuickActionsBar = () => {
  const { t, language } = useLanguage();
  const { createTransaction, isCreating } = useTransactionActions();
  const { formatAmount, currency } = useCurrency();
  const { selectedDate, getDateForServer, resetToToday } = useDate();
  
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const inputRef = useRef(null);
  
  const isRTL = language === 'he';

  // Check if selected date is not today
  const isHistoricalDate = React.useMemo(() => {
    const today = new Date();
    const selected = new Date(selectedDate);
    return today.toDateString() !== selected.toDateString();
  }, [selectedDate]);

  // ✅ UNIFIED: Simple gray quick amounts - no color chaos
  const quickAmounts = [
    { value: 10, color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700' },
    { value: 25, color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700' },
    { value: 50, color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700' },
    { value: 100, color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700' },
    { value: 250, color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700' }
  ];

  const handleQuickAmount = (value) => {
    setAmount(value.toString());
    setError('');
    inputRef.current?.focus();
  };

  const handleSubmit = async (type = 'expense') => {
    if (!amount || parseFloat(amount) <= 0) {
      setError(t('actions.errors.amountRequired'));
      return;
    }

    try {
      setError('');
      
      const getDescription = (transactionType) => {
        switch (transactionType) {
          case 'expense':
            return t('dashboard.quickActions.quickExpense') || 'Quick Expense';
          case 'income':
            return t('dashboard.quickActions.quickIncome') || 'Quick Income';
          default:
            return t('dashboard.quickActions.defaultDescription') || 'Quick Transaction';
        }
      };
      
      // ✅ FIX: Use correct general categories based on transaction type
      const getCategoryId = (transactionType) => {
        switch (transactionType) {
          case 'expense':
            return 59; // "הוצאה מהירה" Hebrew Quick Expense with zap icon
          case 'income':
            return 55; // "הכנסה מהירה" Hebrew Quick Income with zap icon
          default:
            return 59; // Default to Hebrew quick expense category
        }
      };
      
      await createTransaction(type, {
        amount: parseFloat(amount),
        description: getDescription(type),
        category_id: getCategoryId(type), // ✅ FIX: Use correct category based on type
        date: getDateForServer(selectedDate),
        is_recurring: false
      });
      
      setSuccess(true);
      setAmount('');
      
      setTimeout(() => {
        setSuccess(false);
      }, 1200);
      
    } catch (err) {
      setError(err.message || t('actions.errors.addingTransaction'));
      setTimeout(() => {
        setError('');
      }, 4000);
    }
  };

  const handleAmountChange = (e) => {
    const formattedAmount = amountValidation.formatAmountInput(e.target.value);
    setAmount(formattedAmount);
    setError('');
  };

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !isCreating) {
      handleSubmit('expense');
    }
  }, [isCreating]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <Card variant="clean" className="h-full">
        {/* ✅ UNIFIED: Clean header with simple icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
            <Zap className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {t('dashboard.quickActions.title') || 'Quick Actions'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('dashboard.quickActions.subtitle') || 'Add transactions quickly'}
            </p>
          </div>
        </div>
        
        {/* Historical Date Warning */}
        <AnimatePresence>
          {isHistoricalDate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
            >
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                <Clock className="w-4 h-4" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {t('dashboard.quickActions.historicalDateWarning', 'Adding to historical date')}
                  </p>
                  <p className="text-xs opacity-80">
                    {new Date(selectedDate).toLocaleDateString()}
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
        
        {/* Amount Input Section */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('dashboard.quickActions.amount', 'Amount')}
          </label>
          
          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-5 gap-2 mb-3">
            {quickAmounts.map((quick) => (
              <motion.button
                key={quick.value}
                onClick={() => handleQuickAmount(quick.value)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${quick.color}`}
                whileHover={{ scale: 1.05 }}
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
              className="w-full text-lg font-bold py-3 px-4 pr-12 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
              {currency?.symbol || '₪'}
            </div>
          </div>
        </div>
        
        {/* ✅ UNIFIED: Clean action buttons with semantic colors */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <motion.button
            onClick={() => handleSubmit('expense')}
            disabled={isCreating || !amount || parseFloat(amount) <= 0}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: isCreating ? 1 : 1.02 }}
            whileTap={{ scale: isCreating ? 1 : 0.98 }}
          >
            <TrendingDown className="w-4 h-4" />
            <span>{t('actions.quickExpense', 'Expense')}</span>
            {isCreating && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
              />
            )}
          </motion.button>

          <motion.button
            onClick={() => handleSubmit('income')}
            disabled={isCreating || !amount || parseFloat(amount) <= 0}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: isCreating ? 1 : 1.02 }}
            whileTap={{ scale: isCreating ? 1 : 0.98 }}
          >
            <TrendingUp className="w-4 h-4" />
            <span>{t('actions.quickIncome', 'Income')}</span>
            {isCreating && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
              />
            )}
          </motion.button>
        </div>
        
        {/* Error and Success States */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <div className="flex items-center gap-2 text-red-800 dark:text-red-300">
                <X className="w-4 h-4" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
            >
              <div className="flex items-center gap-2 text-green-800 dark:text-green-300">
                <motion.div
                  className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <Check className="w-3 h-3 text-white" />
                </motion.div>
                <div>
                  <p className="text-sm font-medium">{t('actions.success', 'Success!')}</p>
                  <p className="text-xs text-green-700 dark:text-green-400">{t('actions.transactionAdded', 'Transaction added')}</p>
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