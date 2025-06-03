// components/features/dashboard/QuickActionsBar.jsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MinusCircle, 
  PlusCircle, 
  Check,
  Zap,
  Plus,
  TrendingUp,
  TrendingDown,
  Sparkles,
  AlertTriangle,
  Clock,
  Activity
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useTransactions } from '../../../context/TransactionContext';
import { useCurrency } from '../../../context/CurrencyContext';
import { useDate } from '../../../context/DateContext';
import { Card, Button, Badge, Modal } from '../../ui';
import ActionsPanel from './ActionsPanel';
import { transactionSchemas, validate, amountValidation } from '../../../utils/validationSchemas';

const QuickActionsBar = () => {
  const { t, language } = useLanguage();
  const { quickAddTransaction, refreshData } = useTransactions();
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
    const today = new Date().toISOString().split('T')[0];
    const selectedDay = getDateForServer(selectedDate);
    setTodayWarning(selectedDay !== today);
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

  const handleSubmit = async (type = 'expense') => {
    const { success, errors: validationErrors } = validate(
      transactionSchemas.quickAdd,
      { amount, type }
    );

    if (!success) {
      setError(validationErrors.amount || t('actions.errors.invalidAmount'));
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await quickAddTransaction(
        type, 
        parseFloat(amount), 
        t('dashboard.quickActions.defaultDescription'),
        8
      );
      
      setSuccess(true);
      setTimeout(() => {
        setAmount('');
        setSuccess(false);
        
        if (refreshData) {
          refreshData();
        }
        
        if (todayWarning) {
          if (window.confirm(t('dashboard.quickActions.switchToToday'))) {
            resetToToday();
          }
        }
      }, 2000);
      
    } catch (err) {
      setError(t('actions.errors.addingTransaction'));
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (e) => {
    setAmount(amountValidation.formatAmountInput(e.target.value));
    setError('');
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
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Card className="p-6 bg-gradient-to-br from-emerald-50 via-cyan-50 to-blue-50 dark:from-gray-800 dark:via-gray-900 dark:to-blue-900 border-0 shadow-xl relative overflow-hidden">
          {/* Enhanced background decoration */}
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-blue-400/20 to-purple-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-gradient-to-br from-yellow-400/10 to-orange-400/10 rounded-full blur-lg animate-pulse delay-500"></div>
          </div>
          
          <div className="relative z-10">
            {/* Header */}
            <motion.div variants={itemVariants} className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-xl shadow-lg">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                    {t('actions.quickActions')}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('dashboard.quickActions.subtitle') || 'Fast transaction entry'}
                  </p>
                </div>
              </div>
              <Badge variant="success" className="text-xs font-medium px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-cyan-600 text-white border-0">
                <Sparkles className="w-3 h-3 mr-1" />
                {t('dashboard.quickActions.fast') || 'Fast'}
              </Badge>
            </motion.div>

            {/* Today Warning */}
            <AnimatePresence>
              {todayWarning && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4"
                >
                  <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      {t('dashboard.quickActions.todayWarning')}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-5">
              {/* Amount Input */}
              <motion.div variants={itemVariants} className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder={t('dashboard.quickActions.placeholder')}
                  className={`w-full px-5 py-4 pr-20 text-xl font-bold rounded-xl border-2 
                    ${error 
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                      : 'border-gray-200 dark:border-gray-700 focus:border-emerald-500'
                    }
                    bg-white dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none
                    transition-all duration-200 placeholder-gray-400 shadow-sm`}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-500">
                    {currency === 'ILS' ? '₪' : currency === 'USD' ? '$' : '€'}
                  </span>
                </div>
              </motion.div>

              {/* Quick Amount Pills */}
              <motion.div variants={itemVariants} className="flex gap-2 flex-wrap">
                {quickAmounts.map((item) => (
                  <motion.button
                    key={item.value}
                    onClick={() => handleQuickAmount(item.value)}
                    className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 
                               ${item.color} transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md`}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    +{item.value}
                  </motion.button>
                ))}
              </motion.div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
                  >
                    <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                      {error}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Buttons */}
              <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
                <Button
                  variant="danger"
                  size="default"
                  onClick={() => handleSubmit('expense')}
                  disabled={!amount || loading || success}
                  className="group bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 py-3"
                >
                  <AnimatePresence mode="wait">
                    {success ? (
                      <motion.div
                        key="success"
                        variants={successVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        ✨
                      </motion.div>
                    ) : (
                      <motion.div
                        key="expense"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <TrendingDown className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span>{t('transactions.expense')}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
                
                <Button
                  variant="success"
                  size="default"
                  onClick={() => handleSubmit('income')}
                  disabled={!amount || loading || success}
                  className="group bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 py-3"
                >
                  <TrendingUp className="w-4 h-4 group-hover:scale-110 transition-transform mr-2" />
                  <span>{t('transactions.income')}</span>
                </Button>
              </motion.div>

              {/* Help text */}
              <motion.div variants={itemVariants} className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('dashboard.quickActions.defaultDescription') || 'Quick entry for common transactions'}
                </p>
              </motion.div>
            </div>
          </div>
        </Card>

        {/* Quick Actions Secondary Panel (Newly Added) */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mt-4"
        >
          <Card className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md rounded-xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                {t('actions.quickActions')}
              </h4>
              <Badge variant="primary" className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0">
                <Activity className="w-3 h-3 mr-1" />
                {t('common.active')}
              </Badge>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map((action) => (
                <motion.button
                  key={action.id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSubmit(action.actionType)}
                  className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700 transition-all group"
                >
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${action.gradient} group-hover:scale-110 transition-transform`}>
                    <action.icon className="w-5 h-5 text-white" />
                  </div>
                  
                  <div className="flex-1 ml-4 text-left">
                    <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {action.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {action.subtitle}
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                {t('dashboard.quickActionsHint')}
              </p>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </>
  );
};

export default QuickActionsBar;