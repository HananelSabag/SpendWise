/**
 * 🚀 QUICK ACTIONS BAR - REDESIGNED ONE-CLICK VERSION
 * Always visible form with expense default and income/expense tabs
 * Features: Auto-categorization, Real-time updates, Mobile-first, Fixed category field
 * @version 2.0.0 - REDESIGNED UI
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, Minus, Zap, TrendingUp, TrendingDown,
  Eye, BarChart3, Target, Send, Loader2
} from 'lucide-react';

// ✅ Import stores and hooks
import { 
  useTranslation, 
  useNotifications, 
  useCurrency,
  CURRENCIES
} from '../../../stores';
import { useTransactionActions } from '../../../hooks/useTransactionActions';
import { useCategory } from '../../../hooks/useCategory';

// ✅ Import components
import { Button, Input } from '../../ui';
import { cn } from '../../../utils/helpers';

// ✅ Smart categories for auto-categorization
const QUICK_CATEGORIES = {
  expense: [
    { name: 'Food', icon: { name: 'Coffee' }, color: '#EF4444', keywords: ['food', 'restaurant', 'coffee', 'lunch', 'dinner', 'eat', 'grocery'] },
    { name: 'Transport', icon: { name: 'Car' }, color: '#3B82F6', keywords: ['gas', 'fuel', 'uber', 'taxi', 'bus', 'transport', 'parking'] },
    { name: 'Shopping', icon: { name: 'ShoppingBag' }, color: '#8B5CF6', keywords: ['amazon', 'store', 'shop', 'clothes', 'buy'] },
    { name: 'Entertainment', icon: { name: 'Music' }, color: '#F59E0B', keywords: ['movie', 'game', 'music', 'netflix', 'spotify'] },
    { name: 'Bills', icon: { name: 'Receipt' }, color: '#EF4444', keywords: ['electric', 'water', 'internet', 'phone', 'bill'] },
    { name: 'Health', icon: { name: 'Heart' }, color: '#10B981', keywords: ['doctor', 'pharmacy', 'medical', 'health'] }
  ],
  income: [
    { name: 'Salary', icon: { name: 'DollarSign' }, color: '#10B981', keywords: ['salary', 'wage', 'pay', 'income', 'work'] },
    { name: 'Investment', icon: { name: 'TrendingUp' }, color: '#3B82F6', keywords: ['investment', 'dividend', 'stock', 'crypto'] },
    { name: 'Freelance', icon: { name: 'Laptop' }, color: '#8B5CF6', keywords: ['freelance', 'project', 'client', 'consulting'] },
    { name: 'Gift', icon: { name: 'Gift' }, color: '#F59E0B', keywords: ['gift', 'bonus', 'reward', 'prize'] },
    { name: 'Other', icon: { name: 'Plus' }, color: '#6B7280', keywords: ['other', 'misc', 'extra'] }
  ]
};

/**
 * 🚀 Quick Actions Bar Component
 */
const QuickActionsBar = ({ className = '' }) => {
  const { t } = useTranslation('dashboard');
  const { addNotification } = useNotifications();
  const { currency } = useCurrency();
  const currencySymbol = CURRENCIES[currency]?.symbol || '₪';
  
  // ✅ Hooks for transaction creation
  const { createTransaction, isCreating } = useTransactionActions('quickActions');
  const { categories, createCategory } = useCategory();

  // ✅ State management - Always show form with expense default
  const [activeType, setActiveType] = useState('expense'); // ✅ Default to expense (more frequent)
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const amountInputRef = useRef(null);

  // ✅ Auto-focus amount input on mount
  useEffect(() => {
    if (amountInputRef.current) {
      setTimeout(() => amountInputRef.current?.focus(), 100);
    }
  }, []);

  // ✅ Smart category selection based on description
  const getSmartCategory = useCallback((description, type) => {
    if (!description.trim()) {
      // Return default category for type
      return QUICK_CATEGORIES[type]?.[0];
    }

    const desc = description.toLowerCase();
    const typeCategories = QUICK_CATEGORIES[type] || [];
    
    // Find matching category by keywords
    for (const category of typeCategories) {
      if (category.keywords.some(keyword => desc.includes(keyword))) {
        return category;
      }
    }
    
    // Return default if no match
    return typeCategories[0];
  }, []);

  // ✅ Ensure category exists or create it
  const ensureCategory = useCallback(async (smartCategory, type) => {
    if (!smartCategory) return null;

    // Try to find existing category
    const existingCategory = categories?.find(cat => 
      cat.name.toLowerCase() === smartCategory.name.toLowerCase() ||
      cat.name.toLowerCase().includes(smartCategory.name.toLowerCase())
    );

    if (existingCategory) {
      return existingCategory.id;
    }

    // Create new category if it doesn't exist
    try {
      const newCategory = await createCategory({
        name: smartCategory.name,
        icon: smartCategory.icon.name || 'Tag',
        color: smartCategory.color,
        type: type
      });
      return newCategory.id;
    } catch (error) {
      console.warn('Failed to create category, using null:', error);
      return null;
    }
  }, [categories, createCategory]);

  // ✅ Handle quick transaction creation
  const handleQuickTransaction = useCallback(async () => {
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
      // Get smart category
      const smartCategory = getSmartCategory(description, activeType);
      const categoryId = await ensureCategory(smartCategory, activeType);

      // Prepare transaction data - FIXED: Always send positive amounts, server differentiates by type
      const transactionData = {
        type: activeType,
        amount: Math.abs(numericAmount), // ✅ FIXED: Always positive amount, server handles sign based on type
        description: description.trim() || (activeType === 'expense' ? 'Quick Expense' : 'Quick Income'),
        categoryId: categoryId, // ✅ FIXED: Use correct field name
        date: new Date().toISOString().split('T')[0], // ✅ FIXED: Use date format like regular form
        notes: '',
        isRecurring: false
      };

      console.log('🚀 QuickActions: Creating transaction:', transactionData);

      // Create transaction
      await createTransaction(transactionData);

      // Success notification
      addNotification({
        type: 'success',
        message: t('quickActions.success', `${activeType === 'expense' ? 'Expense' : 'Income'} added successfully!`),
        duration: 3000
      });

      // Reset form but keep type as expense default
      setAmount('');
      setDescription('');
      setActiveType('expense'); // ✅ Reset to expense default

      // Refocus amount input
      if (amountInputRef.current) {
        setTimeout(() => amountInputRef.current?.focus(), 100);
      }

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
  }, [amount, activeType, description, createTransaction, getSmartCategory, ensureCategory, addNotification, t]);

  // ✅ Handle input keypress
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && amount) {
      handleQuickTransaction();
    } else if (e.key === 'Escape') {
      setAmount('');
      setDescription('');
      setActiveType('expense'); // ✅ Reset to expense default
    }
  }, [amount, handleQuickTransaction]);

  // ✅ Handle type change (for tabs)
  const handleTypeChange = useCallback((type) => {
    setActiveType(type);
  }, []);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          {t('quickActions.title', 'Quick Actions')}
        </h3>
        <Zap className="w-6 h-6 text-yellow-500" />
      </div>

      {/* ✅ NEW: Always visible form with tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* Income/Expense Tabs */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1" role="tablist" aria-label={t('quickActions.typeSelector', 'Transaction type')}>
          <button
            onClick={() => handleTypeChange('expense')}
            className={cn(
              'flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md transition-all duration-200 font-medium',
              activeType === 'expense'
                ? 'bg-red-500 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
            )}
            role="tab"
            aria-selected={activeType === 'expense'}
            aria-label={t('quickActions.expense', 'Expense')}
          >
            <Minus className="w-4 h-4" />
            <span>{t('quickActions.expense', 'Expense')}</span>
          </button>
          
          <button
            onClick={() => handleTypeChange('income')}
            className={cn(
              'flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md transition-all duration-200 font-medium',
              activeType === 'income'
                ? 'bg-green-500 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
            )}
            role="tab"
            aria-selected={activeType === 'income'}
            aria-label={t('quickActions.income', 'Income')}
          >
            <Plus className="w-4 h-4" />
            <span>{t('quickActions.income', 'Income')}</span>
          </button>
        </div>

        {/* Amount Input */}
        <div className="space-y-3">
          <div className="relative">
            <Input
              ref={amountInputRef}
              type="number"
              placeholder={t('quickActions.enterAmount', 'Enter amount...')}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isSubmitting}
              className={cn(
                'text-lg font-semibold pl-12 pr-4 py-3 border-2 transition-all',
                activeType === 'expense' 
                  ? 'border-red-200 focus:border-red-500 focus:ring-red-500/20'
                  : 'border-green-200 focus:border-green-500 focus:ring-green-500/20'
              )}
              step="0.01"
              min="0"
              aria-label={t('quickActions.enterAmount', 'Enter amount...')}
            />
            <div
              className={cn(
                'absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold',
                activeType === 'expense' ? 'text-red-500' : 'text-green-500'
              )}
              aria-hidden="true"
            >
              {currencySymbol}
            </div>
          </div>

          {/* Description Input (Optional) */}
          <Input
            type="text"
            placeholder={t('quickActions.descriptionOptional', 'Description (optional)...')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isSubmitting}
            className="text-sm"
            aria-label={t('quickActions.descriptionOptional', 'Description (optional)...')}
          />
        </div>

        {/* Smart Category Preview */}
        {(amount || description) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
          >
            <Target className="w-4 h-4" />
            <span>
              {t('quickActions.smartCategory', 'Smart category')}: 
              <span className="font-medium ml-1">
                {getSmartCategory(description, activeType)?.name || 'General'}
              </span>
            </span>
          </motion.div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleQuickTransaction}
          disabled={!amount || isSubmitting}
          className={cn(
            'w-full py-3 font-semibold text-white transition-all duration-200',
            activeType === 'expense'
              ? 'bg-red-500 hover:bg-red-600 disabled:bg-red-300'
              : 'bg-green-500 hover:bg-green-600 disabled:bg-green-300'
          )}
          aria-label={activeType === 'expense' 
            ? t('quickActions.addExpense', 'Add Expense')
            : t('quickActions.addIncome', 'Add Income')}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t('quickActions.adding', 'Adding...')}</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <Send className="w-4 h-4" />
              <span>
                {activeType === 'expense' 
                  ? t('quickActions.addExpense', 'Add Expense')
                  : t('quickActions.addIncome', 'Add Income')
                }
              </span>
            </div>
          )}
        </Button>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {/* Navigate to reports */}}
            className="flex flex-col items-center space-y-1 text-gray-500 hover:text-blue-500 transition-colors"
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-xs">{t('quickActions.viewReports', 'Reports')}</span>
          </button>
          
          <button
            onClick={() => {/* Open category manager */}}
            className="flex flex-col items-center space-y-1 text-gray-500 hover:text-purple-500 transition-colors"
          >
            <Target className="w-5 h-5" />
            <span className="text-xs">{t('quickActions.manageCategories', 'Categories')}</span>
          </button>
          
          <button
            onClick={() => {/* Open export */}}
            className="flex flex-col items-center space-y-1 text-gray-500 hover:text-green-500 transition-colors"
          >
            <Eye className="w-5 h-5" />
            <span className="text-xs">{t('quickActions.exportData', 'Export')}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default QuickActionsBar;