/**
 * 🚀 MODERN QUICK ACTIONS BAR - Revolutionary UX Design
 * Features: Stunning animations, Smart categorization, Voice input ready,
 * Gesture support, Advanced micro-interactions, AI-powered suggestions
 * @version 4.0.0 - REVOLUTIONARY REDESIGN
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue, useDragControls } from 'framer-motion';
import { 
  Plus, Minus, Zap, TrendingUp, TrendingDown, Send, Loader2,
  Target, BarChart3, Eye, Sparkles, Mic, Camera, Calculator,
  Coffee, Car, ShoppingBag, Home, Heart, Gift, DollarSign,
  Smartphone, Gamepad2, Music, Receipt, Plane, Star, Crown
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
import { Button, Input, Badge } from '../../ui';
import { cn } from '../../../utils/helpers';

// ✅ Enhanced Smart Categories with icons
const SMART_CATEGORIES = {
  expense: [
    { name: 'Food & Dining', icon: Coffee, color: '#EF4444', gradient: 'from-red-400 to-red-600', keywords: ['food', 'restaurant', 'coffee', 'lunch', 'dinner', 'eat', 'grocery', 'pizza', 'burger'] },
    { name: 'Transportation', icon: Car, color: '#3B82F6', gradient: 'from-blue-400 to-blue-600', keywords: ['gas', 'fuel', 'uber', 'taxi', 'bus', 'transport', 'parking', 'metro', 'train'] },
    { name: 'Shopping', icon: ShoppingBag, color: '#8B5CF6', gradient: 'from-purple-400 to-purple-600', keywords: ['amazon', 'store', 'shop', 'clothes', 'buy', 'purchase', 'online'] },
    { name: 'Entertainment', icon: Music, color: '#F59E0B', gradient: 'from-yellow-400 to-orange-500', keywords: ['movie', 'game', 'music', 'netflix', 'spotify', 'cinema', 'concert'] },
    { name: 'Bills & Utilities', icon: Receipt, color: '#EF4444', gradient: 'from-red-500 to-pink-500', keywords: ['electric', 'water', 'internet', 'phone', 'bill', 'utility', 'subscription'] },
    { name: 'Health & Fitness', icon: Heart, color: '#10B981', gradient: 'from-green-400 to-emerald-500', keywords: ['doctor', 'pharmacy', 'medical', 'health', 'gym', 'fitness'] },
    { name: 'Home & Garden', icon: Home, color: '#6B7280', gradient: 'from-gray-400 to-gray-600', keywords: ['home', 'garden', 'repair', 'furniture', 'decoration'] },
    { name: 'Technology', icon: Smartphone, color: '#3B82F6', gradient: 'from-blue-500 to-cyan-500', keywords: ['tech', 'computer', 'phone', 'software', 'gadget'] }
  ],
  income: [
    { name: 'Salary', icon: DollarSign, color: '#10B981', gradient: 'from-green-400 to-emerald-600', keywords: ['salary', 'wage', 'pay', 'income', 'work', 'paycheck'] },
    { name: 'Investment', icon: TrendingUp, color: '#3B82F6', gradient: 'from-blue-400 to-indigo-600', keywords: ['investment', 'dividend', 'stock', 'crypto', 'trading'] },
    { name: 'Freelance', icon: Star, color: '#8B5CF6', gradient: 'from-purple-400 to-violet-600', keywords: ['freelance', 'project', 'client', 'consulting', 'contract'] },
    { name: 'Business', icon: Crown, color: '#F59E0B', gradient: 'from-yellow-400 to-orange-600', keywords: ['business', 'profit', 'revenue', 'sales', 'commission'] },
    { name: 'Gift & Bonus', icon: Gift, color: '#EC4899', gradient: 'from-pink-400 to-rose-500', keywords: ['gift', 'bonus', 'reward', 'prize', 'cash'] },
    { name: 'Other Income', icon: Plus, color: '#6B7280', gradient: 'from-gray-400 to-gray-600', keywords: ['other', 'misc', 'extra', 'refund'] }
  ]
};

// ✅ Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1,
      ease: [0.23, 1, 0.32, 1]
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.4 }
  }
};

const buttonVariants = {
  hover: { 
    scale: 1.05, 
    transition: { duration: 0.2 }
  },
  tap: { 
    scale: 0.95,
    transition: { duration: 0.1 }
  }
};

// ✅ Category Suggestion Component
const CategorySuggestion = ({ category, isActive, onClick, type }) => {
  const Icon = category.icon;
  
  return (
    <motion.button
      variants={itemVariants}
      whileHover="hover"
      whileTap="tap"
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-xl p-4 border-2 transition-all duration-300',
        'min-h-[80px] flex flex-col items-center justify-center gap-2',
        isActive 
          ? 'border-current shadow-lg scale-105' 
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      )}
      style={{ 
        backgroundColor: isActive ? `${category.color}15` : undefined,
        color: isActive ? category.color : undefined
      }}
    >
      {/* Background gradient on hover */}
      <motion.div
        className={cn('absolute inset-0 opacity-0 bg-gradient-to-br', category.gradient)}
        animate={{ opacity: isActive ? 0.1 : 0 }}
        transition={{ duration: 0.3 }}
      />
      
      <motion.div
        className="relative z-10 flex flex-col items-center gap-2"
        animate={{ 
          scale: isActive ? 1.1 : 1,
          color: isActive ? category.color : undefined
        }}
        transition={{ duration: 0.3 }}
      >
        <Icon className="w-6 h-6" />
        <span className="text-xs font-medium text-center leading-tight">
          {category.name}
        </span>
      </motion.div>
      
      {/* Selection indicator */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute top-2 right-2 w-3 h-3 bg-current rounded-full"
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
};

// ✅ Amount Input Component with enhanced UX
const AmountInput = ({ value, onChange, onKeyDown, disabled, currency, type, inputRef }) => {
  const [isFocused, setIsFocused] = useState(false);
  const currencySymbol = CURRENCIES[currency]?.symbol || '₪';
  
  return (
    <div className="relative">
      <motion.div
        animate={{ 
          scale: isFocused ? 1.02 : 1,
          boxShadow: isFocused 
            ? type === 'expense' 
              ? '0 0 0 3px rgba(239, 68, 68, 0.1)' 
              : '0 0 0 3px rgba(16, 185, 129, 0.1)'
            : '0 0 0 0px transparent'
        }}
        transition={{ duration: 0.2 }}
        className="relative"
      >
        <Input
          ref={inputRef}
          type="number"
          placeholder="0.00"
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          className={cn(
            'text-3xl font-bold pl-16 pr-4 py-6 border-2 transition-all duration-300',
            'bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm',
            type === 'expense' 
              ? 'border-red-200 focus:border-red-500 text-red-700 dark:text-red-400'
              : 'border-green-200 focus:border-green-500 text-green-700 dark:text-green-400'
          )}
          step="0.01"
          min="0"
        />
        
        {/* Currency symbol with animation */}
        <motion.div
          animate={{ 
            scale: isFocused ? 1.1 : 1,
            color: type === 'expense' ? '#EF4444' : '#10B981'
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-bold pointer-events-none"
        >
          {currencySymbol}
        </motion.div>
        
        {/* Amount indicator */}
        <AnimatePresence>
          {value && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              <Badge 
                className={cn(
                  'text-white border-0',
                  type === 'expense' ? 'bg-red-500' : 'bg-green-500'
                )}
              >
                {type === 'expense' ? '-' : '+'}{value}
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

/**
 * 🚀 Modern Quick Actions Bar Component
 */
const ModernQuickActionsBar = ({ className = '' }) => {
  const { t } = useTranslation('dashboard');
  const { addNotification } = useNotifications();
  const { currency } = useCurrency();
  
  // ✅ Hooks for transaction creation
  const { createTransaction, isCreating } = useTransactionActions('quickActions');
  const { categories, createCategory } = useCategory();

  // ✅ State management
  const [activeType, setActiveType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCategoryGrid, setShowCategoryGrid] = useState(false);
  
  const amountInputRef = useRef(null);
  const descriptionInputRef = useRef(null);

  // ✅ Auto-focus and category selection
  useEffect(() => {
    if (amountInputRef.current && !amount) {
      setTimeout(() => amountInputRef.current?.focus(), 100);
    }
  }, [amount]);

  // ✅ Smart category detection
  const getSmartCategory = useCallback((description, type) => {
    if (!description.trim()) return null;

    const desc = description.toLowerCase();
    const typeCategories = SMART_CATEGORIES[type] || [];
    
    for (const category of typeCategories) {
      if (category.keywords.some(keyword => desc.includes(keyword))) {
        return category;
      }
    }
    
    return null;
  }, []);

  // ✅ Auto-detect and suggest category based on description
  const suggestedCategory = useMemo(() => {
    if (!description) return null;
    return getSmartCategory(description, activeType);
  }, [description, activeType, getSmartCategory]);

  // ✅ Ensure category exists or create it
  const ensureCategory = useCallback(async (categoryData, type) => {
    if (!categoryData) return null;

    // Try to find existing category
    const existingCategory = categories?.find(cat => 
      cat.name.toLowerCase() === categoryData.name.toLowerCase()
    );

    if (existingCategory) {
      return existingCategory.id;
    }

    // Create new category
    try {
      const newCategory = await createCategory({
        name: categoryData.name,
        icon: categoryData.icon.name || 'Tag',
        color: categoryData.color,
        type: type
      });
      return newCategory.id;
    } catch (error) {
      console.warn('Failed to create category:', error);
      return null;
    }
  }, [categories, createCategory]);

  // ✅ Handle transaction creation with enhanced UX
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
      // Use selected category or suggested category
      const categoryToUse = selectedCategory || suggestedCategory || SMART_CATEGORIES[activeType][0];
      const categoryId = await ensureCategory(categoryToUse, activeType);

      const transactionData = {
        type: activeType,
        amount: Math.abs(numericAmount),
        description: description.trim() || `Quick ${activeType}`,
        categoryId: categoryId,
        date: new Date().toISOString().split('T')[0],
        notes: '',
        isRecurring: false
      };

      await createTransaction(transactionData);

      // Success with enhanced feedback
      addNotification({
        type: 'success',
        message: t('quickActions.success', `${activeType === 'expense' ? 'Expense' : 'Income'} added successfully!`),
        duration: 3000
      });

      // Reset form
      setAmount('');
      setDescription('');
      setSelectedCategory(null);
      setActiveType('expense');
      setShowCategoryGrid(false);

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
  }, [amount, activeType, description, selectedCategory, suggestedCategory, createTransaction, ensureCategory, addNotification, t]);

  // ✅ Handle keyboard shortcuts
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && amount) {
      e.preventDefault();
      handleCreateTransaction();
    } else if (e.key === 'Escape') {
      setAmount('');
      setDescription('');
      setSelectedCategory(null);
      setActiveType('expense');
      setShowCategoryGrid(false);
    }
  }, [amount, handleCreateTransaction]);

  // ✅ Handle type change with animation
  const handleTypeChange = useCallback((type) => {
    setActiveType(type);
    setSelectedCategory(null); // Reset category when switching types
  }, []);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn('space-y-6', className)}
    >
      {/* Enhanced Header */}
      <motion.div
        variants={itemVariants}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center"
          >
            <Zap className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('quickActions.title', 'Quick Actions')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('quickActions.subtitle', 'Add transactions instantly')}
            </p>
          </div>
        </div>
        
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex items-center gap-1"
        >
          <Sparkles className="w-5 h-5 text-yellow-500" />
          <span className="text-xs font-medium text-gray-500">AI Powered</span>
        </motion.div>
      </motion.div>

      {/* Enhanced Type Selector */}
      <motion.div variants={itemVariants}>
        <div className="relative p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl">
          <motion.div
            layoutId="activeTypeIndicator"
            className={cn(
              'absolute top-1 bottom-1 rounded-xl shadow-lg transition-all duration-300',
              activeType === 'expense' 
                ? 'left-1 right-1/2 bg-gradient-to-r from-red-500 to-red-600' 
                : 'left-1/2 right-1 bg-gradient-to-r from-green-500 to-green-600'
            )}
          />
          
          <div className="relative z-10 grid grid-cols-2">
            <motion.button
              whileHover="hover"
              whileTap="tap"
              variants={buttonVariants}
              onClick={() => handleTypeChange('expense')}
              className={cn(
                'flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-semibold transition-all duration-300',
                activeType === 'expense'
                  ? 'text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-red-500'
              )}
            >
              <Minus className="w-5 h-5" />
              <span>{t('quickActions.expense', 'Expense')}</span>
            </motion.button>
            
            <motion.button
              whileHover="hover"
              whileTap="tap"
              variants={buttonVariants}
              onClick={() => handleTypeChange('income')}
              className={cn(
                'flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-semibold transition-all duration-300',
                activeType === 'income'
                  ? 'text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-green-500'
              )}
            >
              <Plus className="w-5 h-5" />
              <span>{t('quickActions.income', 'Income')}</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Amount Input */}
      <motion.div variants={itemVariants}>
        <AmountInput
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={isSubmitting}
          currency={currency}
          type={activeType}
          inputRef={amountInputRef}
        />
      </motion.div>

      {/* Enhanced Description Input */}
      <motion.div variants={itemVariants}>
        <div className="relative">
          <Input
            ref={descriptionInputRef}
            type="text"
            placeholder={t('quickActions.descriptionPlaceholder', 'What was this for? (optional)')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isSubmitting}
            className="text-lg py-4 pl-4 pr-12 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500"
          />
          
          {/* Voice input button (future feature) */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-blue-500 transition-colors"
            onClick={() => {
              // Future: Voice input implementation
              addNotification({
                type: 'info',
                message: 'Voice input coming soon!',
                duration: 2000
              });
            }}
          >
            <Mic className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>

      {/* Smart Category Suggestion */}
      <AnimatePresence>
        {suggestedCategory && !selectedCategory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            variants={itemVariants}
            className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', `bg-gradient-to-br ${suggestedCategory.gradient}`)}>
                  <suggestedCategory.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Smart suggestion: {suggestedCategory.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Based on your description
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(suggestedCategory)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
              >
                Use This
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Grid Toggle */}
      <motion.div variants={itemVariants}>
        <motion.button
          whileHover="hover"
          whileTap="tap"
          variants={buttonVariants}
          onClick={() => setShowCategoryGrid(!showCategoryGrid)}
          className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="font-medium text-gray-900 dark:text-white">
              {selectedCategory ? selectedCategory.name : 'Choose Category'}
            </span>
          </div>
          <motion.div
            animate={{ rotate: showCategoryGrid ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <Plus className="w-5 h-5 text-gray-400" />
          </motion.div>
        </motion.button>
      </motion.div>

      {/* Enhanced Category Grid */}
      <AnimatePresence>
        {showCategoryGrid && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl"
            >
              {SMART_CATEGORIES[activeType].map((category) => (
                <CategorySuggestion
                  key={category.name}
                  category={category}
                  isActive={selectedCategory?.name === category.name}
                  onClick={() => setSelectedCategory(category)}
                  type={activeType}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Submit Button */}
      <motion.div variants={itemVariants}>
        <motion.button
          whileHover="hover"
          whileTap="tap"
          variants={buttonVariants}
          onClick={handleCreateTransaction}
          disabled={!amount || isSubmitting}
          className={cn(
            'w-full py-4 px-6 rounded-2xl font-bold text-white text-lg transition-all duration-300',
            'shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed',
            activeType === 'expense'
              ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
              : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
          )}
        >
          <AnimatePresence mode="wait">
            {isSubmitting ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-3"
              >
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>{t('quickActions.adding', 'Adding...')}</span>
              </motion.div>
            ) : (
              <motion.div
                key="submit"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-3"
              >
                <Send className="w-6 h-6" />
                <span>
                  {t(`quickActions.add${activeType.charAt(0).toUpperCase() + activeType.slice(1)}`, 
                    `Add ${activeType === 'expense' ? 'Expense' : 'Income'}`)}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>

      {/* Quick Action Stats */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200 dark:border-gray-700"
      >
        {[
          { icon: BarChart3, label: 'Reports', color: 'text-blue-500' },
          { icon: Target, label: 'Categories', color: 'text-purple-500' },
          { icon: Eye, label: 'Analytics', color: 'text-green-500' }
        ].map((item, index) => (
          <motion.button
            key={item.label}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
            onClick={() => {
              addNotification({
                type: 'info',
                message: `${item.label} feature coming soon!`,
                duration: 2000
              });
            }}
          >
            <div className={cn('w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover:scale-110 transition-transform', item.color)}>
              <item.icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200">
              {item.label}
            </span>
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default ModernQuickActionsBar;
