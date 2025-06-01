// components/features/dashboard/QuickExpenseBar.jsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MinusCircle, 
  PlusCircle, 
  ArrowDownRight,
  Check,
  Zap
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useTransactions } from '../../../context/TransactionContext';
import { useCurrency } from '../../../context/CurrencyContext';
import { useDate } from '../../../context/DateContext';
import { Card, Button, Badge } from '../../ui';
import { transactionSchemas, validate, amountValidation } from '../../../utils/validationSchemas';

const QuickActionsBar = () => {
  const { t, language } = useLanguage();
  const { quickAddTransaction, refreshData } = useTransactions(); // Add refreshData here
  const { formatAmount, currency } = useCurrency();
  const { selectedDate, getDateForServer, resetToToday } = useDate();
  
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [todayWarning, setTodayWarning] = useState(false);
  const inputRef = useRef(null);
  
  const isRTL = language === 'he';

  // בדוק אם התאריך הנבחר הוא היום
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const selectedDay = getDateForServer(selectedDate);
    
    setTodayWarning(selectedDay !== today);
  }, [selectedDate, getDateForServer]);

  // Quick amount buttons
  const quickAmounts = [10, 25, 50, 100, 250];

  const handleQuickAmount = (value) => {
    setAmount(value.toString());
    inputRef.current?.focus();
  };

  const handleSubmit = async (type = 'expense') => {
    // השתמש ב-validation schema הקיים במקום בפונקציה מותאמת אישית
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
      
      // Use current date with timezone consideration
      const today = new Date();
      console.log('[INFO] Adding transaction with today\'s date:', today.toISOString().split('T')[0]);
      
      // ✅ שינוי: השתמש בקטגוריה ברירת מחדל ID 8 במקום null
      await quickAddTransaction(
        type, 
        parseFloat(amount), 
        t('quickExpense.defaultDescription'),
        8  // השתמש ב-ID 8 שהוא הקטגוריה "General" מה-seed data
      );
      
      // Alert if selected date is not today
      if (todayWarning) {
        console.log('[INFO] Transaction added to today\'s date, but viewing a different date');
      }
      
      // Success animation
      setSuccess(true);
      setTimeout(() => {
        setAmount('');
        setSuccess(false);
        
        // Force refresh data after adding transaction
        if (refreshData) {
          console.log('[INFO] Refreshing dashboard data after transaction');
          refreshData();
        }
        
        // If user is viewing a date other than today, offer to switch to today
        if (todayWarning) {
          if (window.confirm(t('quickExpense.switchToToday'))) {
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

  return (
    <Card className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-500" />
          {t('quickExpense.fast')} {/* שינוי הכותרת מ-'title' ל-'fast' */}
        </h3>
        <Badge variant="warning" className="text-xs">
          {t('quickExpense.title')} {/* העברנו את הכותרת המקורית לבאדג' */}
        </Badge>
      </div>

      <div className="space-y-3">
        {/* Amount Input */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={amount}
            onChange={handleAmountChange}
            placeholder={t('quickExpense.placeholder')}
            className={`w-full px-4 py-3 pr-12 text-lg font-semibold rounded-lg border 
              ${error ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'}
              bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent
              transition-all`}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
            {currency === 'ILS' ? '₪' : currency === 'USD' ? '$' : '€'}
          </span>
        </div>

        {/* Quick Amount Buttons */}
        <div className="flex gap-2 flex-wrap">
          {quickAmounts.map((value) => (
            <button
              key={value}
              onClick={() => handleQuickAmount(value)}
              className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 
                       dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              +{value}
            </button>
          ))}
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-sm text-red-500"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="danger"
            size="small"
            fullWidth
            onClick={() => handleSubmit('expense')}
            disabled={!amount || loading || success}
            className="group"
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
                  {t('quickExpense.added')}
                </motion.div>
              ) : (
                <motion.div
                  key="add"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <MinusCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  {t('quickExpense.addExpense')}
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
          
          <Button
            variant="success"
            size="small"
            onClick={() => handleSubmit('income')}
            disabled={!amount || loading || success}
            className="group"
          >
            <PlusCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </Button>
        </div>
      </div>

      {/* התראה אם מסתכלים בתאריך שונה מהיום */}
      {todayWarning && (
        <div className="text-xs text-amber-600 dark:text-amber-400 mb-2 mt-1">
          <p>{t('quickExpense.todayWarning')}</p>
        </div>
      )}
    </Card>
  );
};

export default QuickActionsBar;