// components/features/dashboard/ActionsPanel.jsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  Calendar,
  Check,
  Clock,
  Repeat,
  Tag,
  DollarSign,
  FileText,
  TrendingUp,
  Home,
  ShoppingCart,
  Car,
  Zap,
  Tv,
  X,
  Plus,
  ChevronDown,
  // ✅ ADD: Missing icon imports
  Coffee,
  Utensils,
  ShoppingBag,
  Heart,
  Book,
  Plane,
  Dumbbell,
  Phone,
  Fuel,
  Pill,
  Crown
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useTransactions } from '../../../context/TransactionContext';
import { useDate } from '../../../context/DateContext';
import { useCategories } from '../../../hooks/useApi';
import { Card, Button, Badge, Modal } from '../../ui';
import { transactionSchemas, validate, amountValidation } from '../../../utils/validationSchemas';
import CalendarWidget from '../../common/CalendarWidget';
import { dateHelpers } from '../../../utils/helpers';

const ActionsPanel = ({ onClose, context = 'dashboard', initialActionType = null }) => {
  const { t, language } = useLanguage();
  const { createTransaction } = useTransactions();
  const { selectedDate } = useDate();
  
  // ✅ CORRECT: This component doesn't need dashboard data
  // It only creates transactions, so no useDashboard() call needed
  
  const { data: allCategories = [], isLoading: categoriesLoading } = useCategories();
  const isRTL = language === 'he';
  
  // States
  const [activeType, setActiveType] = useState(initialActionType);
  const [showCalendar, setShowCalendar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(initialActionType ? 1 : 0); // 0: type selection, 1: form
  
  // ✅ ADD: Category tab state
  const [categoryTab, setCategoryTab] = useState('general');
  
  const dateButtonRef = useRef(null);

  // Form data with smart defaults
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category_id: 8,
    is_recurring: initialActionType?.isRecurring || false,
    recurring_interval: 'monthly',
    recurring_end_date: null,
    day_of_week: 0, // Default to Sunday
    // ✅ FIX: Use local timezone date formatting consistent with server
    date: (() => {
      const date = selectedDate || new Date();
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    })(),
  });

  // Helper functions for category display - Enhanced with more icons
  const getIconForCategory = (name) => {
    const iconMap = {
      'General': Tag,
      'Salary': DollarSign,
      'Freelance': FileText,
      'Investments': TrendingUp,
      'Rent': Home,
      'Groceries': ShoppingCart,
      'Transportation': Car,
      'Utilities': Zap,
      'Entertainment': Tv,
      // ✅ FIX: Use available lucide-react icons
      'Coffee': Coffee,
      'Food': Utensils,
      'Shopping': ShoppingBag,
      'Health': Heart,
      'Education': Book,
      'Travel': Plane,
      'Fitness': Dumbbell,
      'Bills': Phone,
      'Gas': Fuel,
      'Medical': Pill
    };
    return iconMap[name] || Tag;
  };

  // ✅ ENHANCED: Better color mapping for all categories
  const getColorForCategory = (name) => {
    const colorMap = {
      'General': 'slate',
      'Salary': 'emerald',
      'Freelance': 'blue',
      'Investments': 'purple',
      'Rent': 'red',
      'Groceries': 'orange',
      'Transportation': 'yellow',
      'Utilities': 'indigo',
      'Entertainment': 'pink',
      // User category colors
      'Coffee': 'amber',
      'Food': 'orange',
      'Shopping': 'cyan',
      'Health': 'rose',
      'Education': 'violet',
      'Travel': 'sky',
      'Fitness': 'lime',
      'Bills': 'slate',
      'Gas': 'yellow',
      'Medical': 'red'
    };
    return colorMap[name] || 'gray';
  };

  const getBgForCategory = (name) => {
    const bgMap = {
      'General': 'bg-slate-100 dark:bg-slate-800',
      'Salary': 'bg-emerald-100 dark:bg-emerald-800',
      'Freelance': 'bg-blue-100 dark:bg-blue-800',
      'Investments': 'bg-purple-100 dark:bg-purple-800',
      'Rent': 'bg-red-100 dark:bg-red-800',
      'Groceries': 'bg-orange-100 dark:bg-orange-800',
      'Transportation': 'bg-yellow-100 dark:bg-yellow-800',
      'Utilities': 'bg-indigo-100 dark:bg-indigo-800',
      'Entertainment': 'bg-pink-100 dark:bg-pink-800',
      // User category backgrounds
      'Coffee': 'bg-amber-100 dark:bg-amber-800',
      'Food': 'bg-orange-100 dark:bg-orange-800',
      'Shopping': 'bg-cyan-100 dark:bg-cyan-800',
      'Health': 'bg-rose-100 dark:bg-rose-800',
      'Education': 'bg-violet-100 dark:bg-violet-800',
      'Travel': 'bg-sky-100 dark:bg-sky-800',
      'Fitness': 'bg-lime-100 dark:bg-lime-800',
      'Bills': 'bg-slate-100 dark:bg-slate-800',
      'Gas': 'bg-yellow-100 dark:bg-yellow-800',
      'Medical': 'bg-red-100 dark:bg-red-800'
    };
    return bgMap[name] || 'bg-gray-100 dark:bg-gray-800';
  };

  // ✅ NOW getCategoriesForType can safely use the helper functions
  // ✅ ENHANCED: Better category organization with tabs
  const getCategoriesForType = (type) => {
    const categories = allCategories
      .filter(cat => cat.is_active !== false)
      .map(cat => ({
        id: cat.id,
        name: cat.is_default ? t(`categories.${cat.name}`) : cat.name,
        icon: getIconForCategory(cat.name),
        color: getColorForCategory(cat.name),
        bg: getBgForCategory(cat.name),
        isDefault: cat.is_default,
        type: cat.type || 'expense'
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      general: categories.filter(cat => cat.isDefault),
      customized: categories.filter(cat => !cat.isDefault)
    };
  };

  // Get categorized categories
  const categorizedCategories = getCategoriesForType(activeType?.type || 'expense');
  const currentTabCategories = categorizedCategories[categoryTab] || [];

  // Enhanced transaction types with better design
  const transactionTypes = [
    {
      id: 'expense',
      type: 'expense',
      isRecurring: false,
      icon: ArrowDownRight,
      title: t('actions.oneTimeExpense'),
      description: t('actions.oneTimeExpenseDesc'),
      gradient: 'from-red-500 via-red-600 to-red-700',
      bgGradient: 'from-red-50 to-rose-100 dark:from-red-900/20 dark:to-rose-900/30',
      iconBg: 'bg-red-500',
      example: 'Coffee ₪15, Lunch ₪45',
    },
    {
      id: 'recurring-expense',
      type: 'expense',
      isRecurring: true,
      icon: Repeat,
      title: t('actions.recurringExpense'),
      description: t('actions.recurringExpenseDesc'),
      gradient: 'from-orange-500 via-orange-600 to-red-600',
      bgGradient: 'from-orange-50 to-red-100 dark:from-orange-900/20 dark:to-red-900/30',
      iconBg: 'bg-orange-500',
      example: 'Rent ₪3500, Netflix ₪50',
    },
    {
      id: 'income',
      type: 'income',
      isRecurring: false,
      icon: ArrowUpRight,
      title: t('actions.oneTimeIncome'),
      description: t('actions.oneTimeIncomeDesc'),
      gradient: 'from-emerald-500 via-green-600 to-teal-600',
      bgGradient: 'from-emerald-50 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/30',
      iconBg: 'bg-emerald-500',
      example: 'Bonus ₪2000, Freelance ₪1500',
    },
    {
      id: 'recurring-income',
      type: 'income',
      isRecurring: true,
      icon: Clock,
      title: t('actions.recurringIncome'),
      description: t('actions.recurringIncomeDesc'),
      gradient: 'from-blue-500 via-indigo-600 to-purple-600',
      bgGradient: 'from-blue-50 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/30',
      iconBg: 'bg-blue-500',
      example: 'Salary ₪12000, Dividends ₪500',
    },
  ];

  // Handle type selection with smooth step transition
  const handleTypeSelect = (type) => {
    setActiveType(type);
    setCurrentStep(1);
    setFormData(prev => ({
      ...prev,
      is_recurring: type.isRecurring,
      category_id: 8,
    }));
    setError('');
  };

  // Go back to type selection
  const goBackToTypeSelection = () => {
    setActiveType(null);
    setCurrentStep(0);
    setError('');
  };

  // Enhanced form submission with better UX
  const handleSubmit = async (e) => {
    e.preventDefault();

    const { success: isValid, errors: validationErrors } = validate(
      transactionSchemas.create,
      {
        amount: parseFloat(formData.amount),
        description: formData.description,
        date: new Date(formData.date),
        category_id: formData.category_id,
        is_recurring: formData.is_recurring,
        recurring_interval: formData.recurring_interval,
        recurring_end_date: formData.recurring_end_date ? new Date(formData.recurring_end_date) : null
      }
    );

    if (!isValid) {
      setError(Object.values(validationErrors)[0] || t('actions.errors.formErrors'));
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // ✅ FIX: Explicitly construct submission data to ensure day_of_week is included
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount),
        // ✅ CRITICAL FIX: Ensure day_of_week is included for weekly recurring
        day_of_week: formData.is_recurring && formData.recurring_interval === 'weekly' 
          ? formData.day_of_week 
          : null
      };

      console.log('🔍 [ACTIONS-DEBUG] Submitting data:', submitData);
      
      await createTransaction(activeType.type, submitData);
      
      setSuccess(true);
      setTimeout(() => {
        onClose?.();
      }, 2500);
      
    } catch (err) {
      setError(err.message || t('actions.errors.addingTransaction'));
    } finally {
      setLoading(false);
    }
  };

  // Enhanced animation variants
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        staggerChildren: 0.1
      }
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 30 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25
      }
    },
    exit: { 
      opacity: 0, 
      x: -30,
      transition: { duration: 0.2 }
    }
  };

  const typeCardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.1,
        type: "spring",
        stiffness: 300,
        damping: 25
      }
    }),
    hover: {
      y: -8,
      scale: 1.02,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 15
      }
    }
  };

  const successVariants = {
    initial: { scale: 0, opacity: 0, rotate: -180 },
    animate: { 
      scale: 1, 
      opacity: 1, 
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
        duration: 0.8
      }
    }
  };

  // Get categories for current transaction type
  const currentCategories = getCategoriesForType(activeType?.type || 'expense');

  // Set default category when type changes
  useEffect(() => {
    if (activeType && allCategories.length > 0) {
      const categories = getCategoriesForType(activeType.type);
      if (categories.length > 0 && !formData.category_id) {
        setFormData(prev => ({
          ...prev,
          category_id: categories[0].id
        }));
      }
    }
  }, [activeType, allCategories]);
  
  // ✅ ADD: Click outside handler for calendar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dateButtonRef.current && !dateButtonRef.current.contains(event.target) && showCalendar) {
        setShowCalendar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar]);
  
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="h-full flex flex-col" // ✅ REMOVE: Any overflow-hidden classes
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* PREMIUM HEADER - Fixed, never scrolls */}
      <div className="flex-none bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white relative overflow-hidden">
        {/* Animated background particles */}
        <div className="absolute inset-0">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full"
              style={{
                top: `${20 + i * 15}%`,
                left: `${10 + i * 20}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 3 + i,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.5,
              }}
            />
          ))}
        </div>
        
        <div className="relative z-10 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {/* Smart back button */}
              {activeType && !initialActionType && (
                <motion.button
                  onClick={goBackToTypeSelection}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors flex-shrink-0"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowDownRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                </motion.button>
              )}
              
              <div className="min-w-0">
                <motion.h1 
                  key={activeType?.title || 'main'}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xl sm:text-2xl font-bold truncate"
                >
                  {activeType?.title || t('actions.title')}
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-white/80 text-sm sm:text-base"
                >
                  {activeType 
                    ? t('actions.fillDetails') 
                    : t('actions.selectType')
                  }
                </motion.p>
              </div>
            </div>
            
            {/* Enhanced badges */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {initialActionType && (
                <Badge variant="default" className="bg-emerald-400/20 text-emerald-100 border-emerald-400/30 text-xs hidden sm:flex">
                  <Zap className="w-3 h-3 mr-1" />
                  {t('actions.directEntry')}
                </Badge>
              )}
              
              {onClose && (
                <motion.button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                  whileHover={{ scale: 1.05, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              )}
            </div>
          </div>
          
          {/* Progress indicator */}
          <div className="mt-4 flex items-center gap-2">
            {[0, 1].map((step) => (
              <div
                key={step}
                className={`h-1 rounded-full transition-all duration-500 ${
                  step <= currentStep 
                    ? 'bg-white flex-1' 
                    : 'bg-white/30 w-8'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT - Scrollable when needed */}
      <div className="flex-1 overflow-y-auto"> {/* ✅ KEEP: Only vertical scroll, not hidden */}
        <div className="p-4 sm:p-6 space-y-6">
          <AnimatePresence mode="wait">
            {/* STEP 0: TYPE SELECTION - Premium Cards */}
            {currentStep === 0 && (
              <motion.div
                key="type-selection"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {transactionTypes.map((type, index) => (
                    <motion.div
                      key={type.id}
                      custom={index}
                      variants={typeCardVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        clickable
                        onClick={() => handleTypeSelect(type)}
                        className={`relative overflow-hidden border-0 bg-gradient-to-br ${type.bgGradient} cursor-pointer group`}
                      >
                        {/* Hover effect overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        <div className="relative p-4 sm:p-6">
                          {/* Icon with enhanced design */}
                          <div className={`inline-flex p-3 sm:p-4 rounded-2xl bg-gradient-to-r ${type.gradient} mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                            <type.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                          
                          {/* Content */}
                          <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {type.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                            {type.description}
                          </p>
                          
                          {/* Example with better styling */}
                          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              {t('actions.example')}:
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {type.example}
                            </p>
                          </div>
                          
                          {/* Selection indicator */}
                          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                              <ArrowUpRight className="w-3 h-3 text-white" />
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 1: TRANSACTION FORM - Redesigned for Better UX */}
            {currentStep === 1 && activeType && (
              <motion.form
                key="transaction-form"
                onSubmit={handleSubmit}
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-3"
              >
                {/* Two-Column Layout for Amount & Description */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Amount Input - Right-sized */}
                  <Card className="p-3">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('actions.amount')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.amount}
                        onChange={(e) => setFormData(prev => ({ ...prev, amount: amountValidation.formatAmountInput(e.target.value) }))}
                        placeholder="150.00"
                        className="w-full text-lg font-bold py-2.5 px-3 pr-10 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        required
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <span className="text-sm font-medium text-gray-400">₪</span>
                      </div>
                    </div>
                  </Card>

                  {/* Description Input - Compact */}
                  <Card className="p-3">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('actions.description')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Coffee with friends"
                        className="w-full py-2.5 px-3 pr-10 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        required
                      />
                      <FileText className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </Card>
                </div>

                {/* Category & Date Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Category Selection - Compact & Smart */}
                  <Card className="p-4 md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                      {t('actions.category')}
                    </label>
                    
                    {categoriesLoading ? (
                      <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                      </div>
                    ) : (
                      <>
                        {/* ✅ NEW: Category Tabs */}
                        <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                          <button
                            type="button"
                            onClick={() => setCategoryTab('general')}
                            className={`flex-1 px-4 py-3 text-sm font-medium rounded-md transition-all ${
                              categoryTab === 'general'
                                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                            }`}
                          >
                            <div className="flex items-center justify-center gap-2">
                              <Crown className="w-4 h-4" />
                              <span>{t('categories.defaultCategories')} ({categorizedCategories.general.length})</span>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setCategoryTab('customized')}
                            className={`flex-1 px-4 py-3 text-sm font-medium rounded-md transition-all ${
                              categoryTab === 'customized'
                                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                            }`}
                          >
                            <div className="flex items-center justify-center gap-2">
                              <Tag className="w-4 h-4" />
                              <span>{t('categories.userCategoriesDesc')} ({categorizedCategories.customized.length})</span>
                            </div>
                          </button>
                        </div>

                        {/* ✅ ENHANCED: Category Grid - Smaller, More Compact */}
                        {currentTabCategories.length === 0 ? (
                          <div className="text-center py-8">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                              {categoryTab === 'general' ? (
                                <Crown className="w-8 h-8 text-gray-400" />
                              ) : (
                                <Plus className="w-8 h-8 text-gray-400" />
                              )}
                            </div>
                            <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2">
                              {categoryTab === 'general' ? 'No General Categories' : 'No Customized Categories'}
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                              {categoryTab === 'general' 
                                ? 'Default categories will appear here' 
                                : 'Create your own categories in Settings'
                              }
                            </p>
                            {categoryTab === 'customized' && (
                              <Button
                                type="button"
                                variant="outline"
                                size="small"
                                onClick={() => {
                                  console.log('Navigate to category management');
                                }}
                                className="text-sm"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Create Category
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 max-h-40 overflow-y-auto">
                            {currentTabCategories.map((cat) => {
                              const IconComponent = cat.icon;
                              const isSelected = formData.category_id === cat.id;
                              
                              return (
                                <motion.button
                                  key={cat.id}
                                  type="button"
                                  onClick={() => setFormData(prev => ({ ...prev, category_id: cat.id }))}
                                  className={`group p-2 rounded-lg border transition-all flex flex-col items-center gap-1 text-center min-h-[60px] relative ${
                                    isSelected
                                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-md scale-105'
                                      : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 bg-white dark:bg-gray-800 hover:scale-102 hover:shadow-sm'
                                  }`}
                                  whileHover={{ scale: isSelected ? 1.05 : 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  title={cat.name}
                                >
                                  {/* ✅ Smaller icon container */}
                                  <div className={`p-1.5 rounded-lg transition-colors ${
                                    isSelected 
                                      ? 'bg-indigo-100 dark:bg-indigo-800' 
                                      : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20'
                                  }`}>
                                    <IconComponent className={`w-4 h-4 transition-colors ${
                                      isSelected 
                                        ? 'text-indigo-600 dark:text-indigo-400' 
                                        : 'text-gray-500 group-hover:text-indigo-500'
                                    }`} />
                                  </div>
                                  
                                  {/* ✅ Smaller text */}
                                  <span className={`text-xs font-medium leading-tight text-center w-full transition-colors truncate ${
                                    isSelected 
                                      ? 'text-indigo-700 dark:text-indigo-300' 
                                      : 'text-gray-600 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                                  }`}>
                                    {cat.name}
                                  </span>
                                  
                                  {/* ✅ Smaller selection indicator */}
                                  {isSelected && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center border border-white dark:border-gray-800 shadow-sm"
                                    >
                                      <Check className="w-2 h-2 text-white" />
                                    </motion.div>
                                  )}
                                </motion.button>
                              );
                            })}
                          </div>
                        )}

                        {/* ✅ Smaller footer */}
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Crown className="w-3 h-3" />
                              {categorizedCategories.general.length} General
                            </span>
                            <span className="flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              {categorizedCategories.customized.length} Customized
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="small"
                            onClick={() => {
                              console.log('Navigate to category management');
                            }}
                            className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 px-2 py-1"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Manage
                          </Button>
                        </div>
                      </>
                    )}
                  </Card>

                  {/* Date Selection - Compact */}
                  <Card className="p-3">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('actions.date')}
                    </label>
                    <div className="relative">
                      <Button
                        ref={dateButtonRef}
                        type="button"
                        variant="outline"
                        fullWidth
                        onClick={() => setShowCalendar(!showCalendar)}
                        className="justify-between py-2 px-2 text-left border-2 hover:border-indigo-300 h-auto text-xs"
                      >
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-500" />
                          <span className="font-medium truncate">
                            {new Date(formData.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${showCalendar ? 'rotate-180' : ''}`} />
                      </Button>
                      
                      {/* ✅ FIX: Calendar with proper triggerRef */}
                      {showCalendar && (
                        <CalendarWidget
                          triggerRef={dateButtonRef}
                          selectedDate={new Date(formData.date)}
                          onDateSelect={(date) => {
                            const localDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                            setFormData(prev => ({ 
                              ...prev, 
                              date: localDateStr
                            }));
                            setShowCalendar(false);
                          }}
                          onClose={() => setShowCalendar(false)}
                        />
                      )}
                    </div>
                  </Card>
                </div>

                {/* Recurring Options - Collapsible */}
                {activeType.isRecurring && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Card className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1 bg-blue-500 rounded-md">
                          <Repeat className="w-4 h-4 text-white" />
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                          {t('actions.recurringOptions')}
                        </h4>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('actions.frequency')}
                          </label>
                          <select
                            value={formData.recurring_interval}
                            onChange={(e) => setFormData(prev => ({ ...prev, recurring_interval: e.target.value }))}
                            className="w-full py-2 px-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                          >
                            <option value="daily">{t('actions.frequencies.daily')}</option>
                            <option value="weekly">{t('actions.frequencies.weekly')}</option>
                            <option value="monthly">{t('actions.frequencies.monthly')}</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('actions.endDate')}
                          </label>
                          <input
                            type="date"
                            value={formData.recurring_end_date || ''}
                            onChange={(e) => {
                              // ✅ FIX: Ensure date input uses local timezone
                              const inputDate = e.target.value;
                              if (inputDate) {
                                const date = new Date(inputDate + 'T12:00:00'); // Add noon to prevent timezone issues
                                const localDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                                setFormData(prev => ({ ...prev, recurring_end_date: localDateStr }));
                              } else {
                                setFormData(prev => ({ ...prev, recurring_end_date: null }));
                              }
                            }}
                            min={formData.date}
                            className="w-full py-2 px-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                          />
                        </div>
                      </div>

                      {/* Day of Week Selection for Weekly Recurring */}
                      {formData.is_recurring && formData.recurring_interval === 'weekly' && (
                        <div className="mt-3">
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('actions.dayOfWeek')}
                          </label>
                          <select
                            value={formData.day_of_week || 0}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              day_of_week: parseInt(e.target.value) 
                            }))}
                            className="w-full py-2 px-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                          >
                            <option value={0}>{t('days.sunday')}</option>
                            <option value={1}>{t('days.monday')}</option>
                            <option value={2}>{t('days.tuesday')}</option>
                            <option value={3}>{t('days.wednesday')}</option>
                            <option value={4}>{t('days.thursday')}</option>
                            <option value={5}>{t('days.friday')}</option>
                            <option value={6}>{t('days.saturday')}</option>
                          </select>
                        </div>
                      )}
                    </Card>
                  </motion.div>
                )}

                {/* Error Display - Minimal */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 text-red-800">
                          <div className="w-4 h-4 rounded-full bg-red-200 flex items-center justify-center">
                            <X className="w-3 h-3" />
                          </div>
                          <span className="text-sm font-medium">{error}</span>
                          <button
                            onClick={() => setError('')}
                            className="ml-auto text-red-600 hover:text-red-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Success Animation - Minimal */}
                <AnimatePresence>
                  {success && (
                    <motion.div
                      variants={successVariants}
                      initial="initial"
                      animate="animate"
                      className="text-center py-4"
                    >
                      <div className="inline-flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
                        <motion.div
                          className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 0.5 }}
                        >
                          <Check className="w-5 h-5 text-white" />
                        </motion.div>
                        <div className="text-left">
                          <h3 className="text-sm font-semibold text-green-800">
                            {t('actions.success')}
                          </h3>
                          <p className="text-xs text-green-600">
                            {t('actions.transactionAdded')}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* MINIMAL FOOTER - Streamlined */}
      {currentStep === 1 && activeType && !success && (
        <div className="flex-none border-t border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-800">
          <div className="flex gap-2">
            {!initialActionType && (
              <Button
                type="button"
                variant="outline"
                onClick={goBackToTypeSelection}
                disabled={loading}
                size="small"
                className="px-4"
              >
                {t('common.back')}
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={loading || !formData.amount || !formData.description}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg py-2.5"
              onClick={handleSubmit}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  <span className="text-sm">{t('common.loading')}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span className="text-sm font-medium">{t('actions.add')}</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ActionsPanel;