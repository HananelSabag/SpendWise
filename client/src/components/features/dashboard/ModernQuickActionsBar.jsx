/**
 * 🚀 QUICK ACTIONS BAR - Simple & Fast
 * Just expense/income toggle + amount input + submit
 * @version 1.0.0 - CLEAN & SIMPLE
 */

import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, Send, Loader2, Zap } from 'lucide-react';

// ✅ Import stores and hooks
import { 
  useTranslation, 
  useNotifications, 
  useCurrency,
  CURRENCIES
} from '../../../stores';
import { useTransactionActions } from '../../../hooks/useTransactionActions';

// ✅ Import components
import { Button, Input } from '../../ui';
import { cn } from '../../../utils/helpers';

/**
 * 🚀 Quick Actions Bar Component
 */
const ModernQuickActionsBar = ({ className = '' }) => {
  const { t } = useTranslation('dashboard');
  const { addNotification } = useNotifications();
  const { currency } = useCurrency();
  
  // ✅ Hooks for transaction creation
  const { createTransaction } = useTransactionActions('quickActions');

  // ✅ State management
  const [activeType, setActiveType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const amountInputRef = useRef(null);

  // ✅ Handle transaction creation
  const handleCreateTransaction = useCallback(async () => {
    if (!amount) return;

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      addNotification({
        type: 'error',
        message: t('quickActions.invalidAmount', 'Please enter a valid amount'),
        duration: 3000
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Use specific quick action category IDs based on user's language preference
      const { currentLanguage } = useTranslation();
      const isHebrew = currentLanguage === 'he';
      
      const quickCategoryIds = {
        expense: isHebrew ? 59 : 68, // Quick Expense - Hebrew: 59, English: 68
        income: isHebrew ? 55 : 64   // Quick Income - Hebrew: 55, English: 64
      };

      const transactionData = {
        type: activeType,
        amount: Math.abs(numericAmount),
        description: `Quick ${activeType}`,
        categoryId: quickCategoryIds[activeType],
        date: new Date().toLocaleDateString('en-CA'),
        notes: '',
        isRecurring: false
      };

      await createTransaction(transactionData);

      // Success
      addNotification({
        type: 'success',
        message: t('quickActions.success', `${activeType === 'expense' ? 'Expense' : 'Income'} added successfully!`),
        duration: 3000
      });

      // Reset form
      setAmount('');
      setActiveType('expense');

      // Focus amount input
      setTimeout(() => amountInputRef.current?.focus(), 100);

    } catch (error) {
      console.error('Quick transaction failed:', error);
      addNotification({
        type: 'error',
        message: t('quickActions.failed', 'Failed to add transaction. Please try again.'),
        duration: 5000
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [amount, activeType, createTransaction, addNotification, t]);

  // ✅ Handle keyboard shortcuts
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && amount) {
      e.preventDefault();
      handleCreateTransaction();
    }
  }, [amount, handleCreateTransaction]);

  const currencySymbol = CURRENCIES[currency]?.symbol || '₪';

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with Dynamic Lightning Icon */}
      <div className="flex items-center gap-3 mb-1">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300",
          activeType === 'expense' 
            ? "bg-gradient-to-br from-red-500 to-red-600" 
            : "bg-gradient-to-br from-green-500 to-green-600"
        )}>
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('quickActions.title', 'Quick Actions')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('quickActions.subtitle', 'Add transactions instantly')}
          </p>
        </div>
      </div>

      {/* Type Selector */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
        <button
          onClick={() => setActiveType('expense')}
          className={cn(
            'flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-200',
            activeType === 'expense'
              ? 'bg-red-500 text-white shadow-lg'
              : 'text-gray-600 dark:text-gray-400 hover:text-red-500'
          )}
        >
          <Minus className="w-4 h-4" />
          {t('quickActions.expense', 'Expense')}
        </button>
        
        <button
          onClick={() => setActiveType('income')}
          className={cn(
            'flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-200',
            activeType === 'income'
              ? 'bg-green-500 text-white shadow-lg'
              : 'text-gray-600 dark:text-gray-400 hover:text-green-500'
          )}
        >
          <Plus className="w-4 h-4" />
          {t('quickActions.income', 'Income')}
        </button>
      </div>

      {/* Amount Input */}
      <div className="relative">
        <Input
          ref={amountInputRef}
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={isSubmitting}
          className={cn(
            'text-2xl font-bold pl-4 pr-16 py-4 border-2 transition-all duration-200',
            activeType === 'expense' 
              ? 'border-red-200 focus:border-red-500 text-red-700 dark:text-red-400'
              : 'border-green-200 focus:border-green-500 text-green-700 dark:text-green-400'
          )}
          step="0.01"
          min="0"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-500 dark:text-gray-400 pointer-events-none">
          {currencySymbol}
        </div>
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleCreateTransaction}
        disabled={!amount || isSubmitting}
        className={cn(
          'w-full py-3 text-white font-semibold rounded-xl transition-all duration-200',
          activeType === 'expense'
            ? 'bg-red-500 hover:bg-red-600 disabled:bg-red-300'
            : 'bg-green-500 hover:bg-green-600 disabled:bg-green-300'
        )}
      >
        {isSubmitting ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            {t('quickActions.adding', 'Adding...')}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <Send className="w-5 h-5" />
            {t(`quickActions.add${activeType.charAt(0).toUpperCase() + activeType.slice(1)}`, 
              `Add ${activeType === 'expense' ? 'Expense' : 'Income'}`)}
          </div>
        )}
      </Button>

      {/* Quick tip */}
      <p className="text-xs text-center text-gray-400 dark:text-gray-500">
        {t('quickActions.tip', 'Enter amount and press Enter or click submit')}
      </p>
    </div>
  );
};

export default ModernQuickActionsBar;