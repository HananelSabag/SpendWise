// components/features/dashboard/ActionsPanel.jsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ArrowUpRight,
  ArrowDownRight,
  Repeat,
  Clock,
  Calendar,
  ChevronDown,
  DollarSign,
  Tag,
  FileText,
  Check,
  TrendingUp,
  Home,
  ShoppingCart,
  Car,
  Zap,
  Tv
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useTransactions } from '../../../context/TransactionContext';
import { useDate } from '../../../context/DateContext';
import { Card, Button, Input, Select, Alert, Badge } from '../../ui';
import CalendarWidget from '../../common/CalendarWidget';
import { transactionSchemas, validate, amountValidation } from '../../../utils/validationSchemas';

const ActionsPanel = ({ onClose, context = 'dashboard', initialActionType = null }) => {
  const { t, language } = useLanguage();
  const { createTransaction } = useTransactions();
  const { selectedDate } = useDate();
  const isRTL = language === 'he';
  
  // States
  const [activeType, setActiveType] = useState(initialActionType);
  const [showCalendar, setShowCalendar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(initialActionType ? 1 : 0); // 0: type selection, 1: form
  
  const dateButtonRef = useRef(null);

  // Form data with smart defaults
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category_id: 8,
    is_recurring: initialActionType?.isRecurring || false,
    recurring_interval: 'monthly',
    recurring_end_date: null,
    date: selectedDate.toISOString().split('T')[0],
  });

  // Enhanced categories with better icons and colors
  const categories = {
    income: [
      { id: 8, name: 'General', icon: Tag, color: 'slate', bg: 'bg-slate-100 dark:bg-slate-800' },
      { id: 1, name: 'Salary', icon: DollarSign, color: 'emerald', bg: 'bg-emerald-100 dark:bg-emerald-900' },
      { id: 2, name: 'Freelance', icon: FileText, color: 'blue', bg: 'bg-blue-100 dark:bg-blue-900' },
      { id: 3, name: 'Investments', icon: TrendingUp, color: 'purple', bg: 'bg-purple-100 dark:bg-purple-900' },
    ],
    expense: [
      { id: 8, name: 'General', icon: Tag, color: 'slate', bg: 'bg-slate-100 dark:bg-slate-800' },
      { id: 3, name: 'Rent', icon: Home, color: 'red', bg: 'bg-red-100 dark:bg-red-900' },
      { id: 4, name: 'Groceries', icon: ShoppingCart, color: 'orange', bg: 'bg-orange-100 dark:bg-orange-900' },
      { id: 5, name: 'Transportation', icon: Car, color: 'yellow', bg: 'bg-yellow-100 dark:bg-yellow-900' },
      { id: 6, name: 'Utilities', icon: Zap, color: 'indigo', bg: 'bg-indigo-100 dark:bg-indigo-900' },
      { id: 7, name: 'Entertainment', icon: Tv, color: 'pink', bg: 'bg-pink-100 dark:bg-pink-900' },
    ],
  };

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
      
      await createTransaction(activeType.type, {
        ...formData,
        amount: parseFloat(formData.amount)
      });
      
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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="h-full flex flex-col"
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
      <div className="flex-1 overflow-y-auto">
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

            {/* STEP 1: TRANSACTION FORM - Enhanced Mobile Design */}
            {currentStep === 1 && activeType && (
              <motion.form
                key="transaction-form"
                onSubmit={handleSubmit}
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-6"
              >
                {/* Amount Input - Hero Section */}
                <Card className="p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-2 border-gray-100 dark:border-gray-700">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    {t('actions.amount')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: amountValidation.formatAmountInput(e.target.value) }))}
                      placeholder="0.00"
                      className="w-full text-2xl sm:text-3xl font-bold py-4 px-6 pr-16 rounded-2xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all"
                      required
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <DollarSign className="w-6 h-6 text-gray-400" />
                    </div>
                  </div>
                </Card>

                {/* Description Input */}
                <Card className="p-4 sm:p-6">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    {t('actions.description')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder={t('actions.descriptionPlaceholder')}
                      className="w-full py-3 px-4 pr-12 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all"
                      required
                    />
                    <FileText className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </Card>

                {/* Category Selection - Enhanced Mobile Grid */}
                <Card className="p-4 sm:p-6">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    {t('actions.category')}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {categories[activeType.type].map((cat) => (
                      <motion.button
                        key={cat.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, category_id: cat.id }))}
                        className={`p-3 sm:p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 text-center min-h-[80px] ${
                          formData.category_id === cat.id
                            ? `border-indigo-500 ${cat.bg} shadow-lg shadow-indigo-500/20`
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 bg-white dark:bg-gray-800'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <cat.icon className={`w-5 h-5 ${formData.category_id === cat.id ? `text-${cat.color}-600` : 'text-gray-500'}`} />
                        <span className={`text-xs sm:text-sm font-medium ${formData.category_id === cat.id ? `text-${cat.color}-700 dark:text-${cat.color}-300` : 'text-gray-600 dark:text-gray-400'}`}>
                          {t(`categories.${cat.name}`)}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </Card>

                {/* Date Selection */}
                <Card className="p-4 sm:p-6">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    {t('actions.date')}
                  </label>
                  <div className="relative">
                    <Button
                      ref={dateButtonRef}
                      type="button"
                      variant="outline"
                      fullWidth
                      onClick={() => setShowCalendar(!showCalendar)}
                      className="justify-between py-3 px-4 text-left border-2 hover:border-indigo-300"
                    >
                      <span className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-gray-500" />
                        <span className="font-medium">
                          {new Date(formData.date).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${showCalendar ? 'rotate-180' : ''}`} />
                    </Button>
                    
                    {showCalendar && (
                      <div className="absolute top-full mt-2 z-50 w-full">
                        <CalendarWidget
                          selectedDate={new Date(formData.date)}
                          onDateSelect={(date) => {
                            setFormData(prev => ({ 
                              ...prev, 
                              date: date.toISOString().split('T')[0] 
                            }));
                            setShowCalendar(false);
                          }}
                          onClose={() => setShowCalendar(false)}
                        />
                      </div>
                    )}
                  </div>
                </Card>

                {/* Recurring Options - Enhanced */}
                {activeType.isRecurring && (
                  <Card className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <Repeat className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {t('actions.recurringOptions')}
                      </h4>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('actions.frequency')}
                        </label>
                        <select
                          value={formData.recurring_interval}
                          onChange={(e) => setFormData(prev => ({ ...prev, recurring_interval: e.target.value }))}
                          className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                        >
                          <option value="daily">{t('actions.frequencies.daily')}</option>
                          <option value="weekly">{t('actions.frequencies.weekly')}</option>
                          <option value="monthly">{t('actions.frequencies.monthly')}</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('actions.endDate')} <span className="text-gray-500">({t('common.optional')})</span>
                        </label>
                        <input
                          type="date"
                          value={formData.recurring_end_date || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, recurring_end_date: e.target.value }))
                          }
                          min={formData.date}
                          className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                        />
                      </div>
                    </div>
                  </Card>
                )}

                {/* Error Display */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    >
                      <Alert type="error" dismissible onDismiss={() => setError('')}>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5" />
                          <span className="font-medium">{error}</span>
                        </div>
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Success Animation - Enhanced */}
                <AnimatePresence>
                  {success && (
                    <motion.div
                      variants={successVariants}
                      initial="initial"
                      animate="animate"
                      className="text-center py-8"
                    >
                      <div className="relative inline-block">
                        <motion.div
                          className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full shadow-2xl"
                          animate={{
                            scale: [1, 1.1, 1],
                            rotate: [0, 10, -10, 0],
                          }}
                          transition={{
                            duration: 1,
                            repeat: 2,
                            ease: "easeInOut"
                          }}
                        >
                          <Check className="w-10 h-10 text-white" />
                        </motion.div>
                        
                        {/* Enhanced sparkle effects */}
                        {[...Array(8)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute w-3 h-3 bg-yellow-400 rounded-full"
                            style={{
                              top: '25%',
                              left: '50%',
                            }}
                            animate={{
                              x: [0, (i - 3.5) * 50],
                              y: [0, -40 - (i % 2) * 25],
                              opacity: [0, 1, 0],
                              scale: [0, 1.5, 0],
                            }}
                            transition={{
                              duration: 2,
                              delay: 0.3 + i * 0.1,
                              ease: "easeOut"
                            }}
                          />
                        ))}
                      </div>
                      
                      <motion.h3 
                        className="text-2xl font-bold text-gray-900 dark:text-white mt-6 mb-2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        {t('actions.success')} ✨
                      </motion.h3>
                      
                      <motion.p 
                        className="text-gray-600 dark:text-gray-400"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                      >
                        {t('actions.transactionAdded')}
                      </motion.p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ENHANCED FOOTER - Fixed, Smart Actions */}
      {currentStep === 1 && activeType && !success && (
        <div className="flex-none border-t border-gray-200 dark:border-gray-700 p-4 sm:p-6 bg-white dark:bg-gray-800">
          <div className="flex gap-3">
            {!initialActionType && (
              <Button
                type="button"
                variant="outline"
                onClick={goBackToTypeSelection}
                disabled={loading}
                className="flex-1 sm:flex-none"
              >
                {t('common.back')}
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={loading || !formData.amount || !formData.description}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all py-3"
              onClick={handleSubmit}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                  {t('common.loading')}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  {t('actions.add')}
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