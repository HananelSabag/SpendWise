/**
 * EditTransactionPanel Component - COMPLETE PRODUCTION READY VERSION
 * 
 * ✅ FIXED: Responsive window sizing - fits perfectly on desktop and mobile
 * ✅ FIXED: One-time transactions show "Edit Transaction" (not "single occurrence")
 * ✅ FIXED: No duplicate titles in modal
 * ✅ FIXED: Proper scope detection for all transaction types
 * ✅ ENHANCED: Default descriptions if user doesn't provide any
 * ✅ COMPLETE: Same hooks integration as AddTransactions but for editing
 * ✅ COMPLETE: Amount as primary required field, smart defaults for rest
 * ✅ PRESERVED: All existing functionality and translation keys
 * ✅ VALIDATED: Uses existing validation helpers from utils
 * 
 * BASED ON: AddTransactions component structure and hooks
 * SCOPE LOGIC:
 * - oneTime: Regular transactions → "Edit Transaction"
 * - single: Recurring with editingSingle=true → "Edit Single Occurrence"  
 * - series: Recurring with editingSingle=false → "Edit All Future"
 * - template: Template transactions → "Edit Template"
 * 
 * DEFAULT DESCRIPTIONS:
 * - If user doesn't provide description, generate smart defaults based on:
 *   * Category name + transaction type + amount
 *   * Recurring status for context
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Edit3, Calendar, Check, Repeat, DollarSign, FileText, X, ChevronDown,
  Save, Info, AlertTriangle, Zap, Clock, Crown, Plus, Sparkles
} from 'lucide-react';

// ✅ SAME: Exact imports as AddTransactions
import { 
  getIconComponent, 
  getColorForCategory, 
  getGradientForCategory,
  allIcons 
} from '../../../config/categoryIcons';

import { useLanguage } from '../../../context/LanguageContext';
import { useTransactionActions } from '../../../hooks/useTransactionActions';
import { useCategories } from '../../../hooks/useCategory';
import { useDate } from '../../../context/DateContext';
import { Card, Button, Badge } from '../../ui';
import { transactionSchemas, validate, amountValidation } from '../../../utils/validationSchemas';
import CalendarWidget from '../../common/CalendarWidget';

/**
 * ✅ ENHANCED: Proper scope detection for edit operations
 */
const getTransactionScope = (transaction, editingSingle) => {
  if (!transaction) return 'oneTime';
  
  const isRecurring = Boolean(transaction.template_id || transaction.is_recurring);
  const isTemplate = Boolean(transaction.id && !transaction.template_id && transaction.interval_type);
  
  console.log('🔍 [SCOPE] Edit scope detection:', {
    transactionId: transaction.id,
    editingSingle,
    isRecurring,
    isTemplate,
    templateId: transaction.template_id,
    intervalType: transaction.interval_type
  });
  
  if (isTemplate) {
    return 'template';
  } else if (isRecurring) {
    return editingSingle ? 'single' : 'series';
  } else {
    return 'oneTime'; // ← This fixes one-time transactions!
  }
};

/**
 * ✅ ENHANCED: Scope configuration with proper edit translations
 */
const getScopeConfig = (scope, t) => {
  const configs = {
    oneTime: {
      title: t('transactions.editTransaction'),
      description: t('transactions.editTransactionDesc'),
      color: 'from-blue-600 via-indigo-600 to-purple-600',
      icon: Edit3,
      saveText: t('transactions.saveTransaction')
    },
    single: {
      title: t('transactions.editSingleOccurrence'),
      description: t('transactions.editSingleDesc'),
      color: 'from-blue-600 via-indigo-600 to-purple-600',
      icon: Edit3,
      saveText: t('transactions.saveSingle')
    },
    series: {
      title: t('transactions.editAllFuture'),
      description: t('transactions.editSeriesDesc'),
      color: 'from-green-600 via-emerald-600 to-teal-600',
      icon: Zap,
      saveText: t('transactions.saveSeries')
    },
    template: {
      title: t('transactions.editTemplate'),
      description: t('transactions.editTemplateDesc'),
      color: 'from-purple-600 via-violet-600 to-indigo-600',
      icon: Sparkles,
      saveText: t('transactions.saveTemplate')
    }
  };
  
  return configs[scope] || configs.oneTime;
};

/**
 * ✅ ENHANCED: Generate smart default description
 */
const generateDefaultDescription = (amount, categoryName, transactionType, isRecurring, t) => {
  const type = transactionType === 'expense' ? t('transactions.expense') : t('transactions.income');
  const recurringText = isRecurring ? ` (${t('transactions.recurring')})` : '';
  
  if (categoryName && categoryName !== 'General') {
    return `${categoryName} ${type}${recurringText}`;
  } else if (amount) {
    return `${type} ₪${amount}${recurringText}`;
  } else {
    return `${type}${recurringText}`;
  }
};

/**
 * COMPLETE EditTransactionPanel - Following AddTransactions pattern exactly
 */
const EditTransactionPanel = ({ 
  transaction, 
  editingSingle = false,
  onClose, 
  onSuccess 
}) => {
  const { t, language } = useLanguage();
  const { updateTransaction, isUpdating } = useTransactionActions();
  const { categories: allCategories = [], isLoading: categoriesLoading } = useCategories();
  const { selectedDate } = useDate();
  
  const isRTL = language === 'he';
  
  // ✅ ENHANCED: Proper scope detection
  const scope = getTransactionScope(transaction, editingSingle);
  const scopeConfig = getScopeConfig(scope, t);
  
  // ✅ SAME: State management as AddTransactions
  const [showCalendar, setShowCalendar] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [categoryTab, setCategoryTab] = useState('general');
  
  const dateButtonRef = useRef(null);

  // ✅ SAME: Categories processing exactly as AddTransactions
  const getCategoriesForType = (type) => {
    if (!Array.isArray(allCategories)) return { general: [], customized: [] };
    
    const categories = allCategories
      .filter(cat => cat.is_active !== false)
      .map(cat => ({
        id: cat.id,
        name: cat.is_default ? t(`categories.${cat.name}`) : cat.name,
        iconComponent: getIconComponent(cat.icon || 'tag'),
        isDefault: cat.is_default,
        type: cat.type || 'expense'
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      general: categories.filter(cat => cat.isDefault),
      customized: categories.filter(cat => !cat.isDefault)
    };
  };

  const categorizedCategories = getCategoriesForType(transaction.transaction_type);
  const currentTabCategories = categorizedCategories[categoryTab] || [];

  // ✅ ENHANCED: Form data initialization with smart defaults
  const [formData, setFormData] = useState(() => {
    // Safe date parsing (same as AddTransactions)
    let dateString;
    try {
      let date;
      if (transaction.date) {
        date = transaction.date.includes('T') 
          ? new Date(transaction.date)
          : new Date(transaction.date + 'T12:00:00');
      } else {
        date = selectedDate || new Date();
      }
      
      if (isNaN(date.getTime())) {
        date = new Date();
      }
      date.setHours(12, 0, 0, 0);
      
      dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    } catch (error) {
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }

    return {
      amount: transaction.amount?.toString() || '',
      description: transaction.description || '', // Will generate default if empty
      category_id: transaction.category_id || null,
      is_recurring: scope === 'oneTime' ? false : (transaction.is_recurring || false),
      recurring_interval: transaction.recurring_interval || 'monthly',
      recurring_end_date: transaction.recurring_end_date || null,
      // ✅ FIX: Ensure day values are properly set
      day_of_week: transaction.day_of_week !== undefined ? transaction.day_of_week : new Date(dateString).getDay(),
      day_of_month: transaction.day_of_month !== undefined ? transaction.day_of_month : new Date(dateString).getDate(),
      date: dateString,
    };
  });

  // ✅ SAME: Category default setting as AddTransactions
  useEffect(() => {
    if (allCategories.length > 0 && !formData.category_id) {
      const categories = getCategoriesForType(transaction.transaction_type || 'expense');
      const defaultCategory = categories.general[0] || categories.customized[0];
      if (defaultCategory) {
        setFormData(prev => ({
          ...prev,
          category_id: defaultCategory.id
        }));
      }
    }
  }, [allCategories, formData.category_id, transaction.transaction_type]);
  
  // ✅ SAME: Calendar outside click handler as AddTransactions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dateButtonRef.current && !dateButtonRef.current.contains(event.target) && showCalendar) {
        setShowCalendar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCalendar]);

  // ✅ ENHANCED: Form submission with smart defaults
  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ ENHANCED: Generate default description if empty
    let finalDescription = formData.description.trim();
    if (!finalDescription) {
      const selectedCategory = allCategories.find(cat => cat.id === formData.category_id);
      const categoryName = selectedCategory ? 
        (selectedCategory.is_default ? t(`categories.${selectedCategory.name}`) : selectedCategory.name) : 
        'General';
      
      finalDescription = generateDefaultDescription(
        formData.amount,
        categoryName,
        transaction.transaction_type || transaction.type,
        formData.is_recurring,
        t
      );
    }

    // Validation (same as AddTransactions)
    const { success: isValid, errors: validationErrors } = validate(
      transactionSchemas.create,
      {
        amount: parseFloat(formData.amount),
        description: finalDescription,
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

    // Additional validation
    if (!formData.category_id) {
      setError(t('actions.errors.categoryRequired'));
      return;
    }

    try {
      setError('');
      
      const transactionType = transaction.transaction_type || transaction.type;
      const submitData = {
        ...formData,
        description: finalDescription, // Use the final description (default or user)
        amount: parseFloat(formData.amount),
        // ✅ ENHANCED: Include day values for recurring transactions
        day_of_month: formData.is_recurring && formData.recurring_interval === 'monthly' ? formData.day_of_month : undefined,
        day_of_week: formData.is_recurring && formData.recurring_interval === 'weekly' ? formData.day_of_week : undefined,
        // ✅ ENHANCED: Proper update scope handling
        updateFuture: scope === 'series' || scope === 'template'
      };

      await updateTransaction(transactionType, transaction.id, submitData);
      
      // ✅ ENHANCED: Beautiful success animation with auto-close
      setSuccess(true);
      
      // Success callback
      onSuccess?.(submitData);
      
      // Auto-close after success animation
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 2000);
      
    } catch (err) {
      console.error('Transaction update failed:', err);
      // ✅ ENHANCED: Show error animation
      setError(err.message || t('actions.errors.updatingTransaction'));
      
      // Clear error after some time to allow retry
      setTimeout(() => {
        setError('');
      }, 5000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="h-full flex flex-col w-full max-h-[85vh] overflow-hidden" // ✅ FIXED: Constrain height
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* ✅ FIXED: Compact header - single title, no duplicates */}
      <div className={`flex-none text-white relative overflow-hidden bg-gradient-to-r ${scopeConfig.color}`}>
        {/* Background decoration (same as AddTransactions) */}
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
        
        <div className="relative z-10 p-3 sm:p-4 lg:p-6"> {/* ✅ FIXED: Responsive padding */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-white/20 rounded-xl">
                <scopeConfig.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              
              <div className="min-w-0">
                <motion.h1 
                  key={scopeConfig.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-lg sm:text-xl lg:text-2xl font-bold truncate" // ✅ FIXED: Responsive font size
                >
                  {scopeConfig.title}
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-white/80 text-xs sm:text-sm lg:text-base" // ✅ FIXED: Responsive font size
                >
                  {scopeConfig.description}
                </motion.p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="default" className="bg-white/20 text-white border-white/30 text-xs hidden sm:flex">
                <scopeConfig.icon className="w-3 h-3 mr-1" />
                {scope === 'oneTime' ? t('transactions.oneTime') : 
                 scope === 'single' ? t('transactions.singleEdit') :
                 scope === 'series' ? t('transactions.seriesEdit') :
                 t('transactions.template')}
              </Badge>
              
              {onClose && (
                <motion.button
                  onClick={onClose}
                  className="p-1.5 sm:p-2 hover:bg-white/20 rounded-xl transition-colors" // ✅ FIXED: Responsive padding
                  whileHover={{ scale: 1.05, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ✅ ENHANCED: Scope Information Banner */}
      <div className={`flex-none p-3 sm:p-4 border-b ${
        scope === 'oneTime' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' :
        scope === 'single' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' :
        scope === 'series' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
        'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${
            scope === 'oneTime' ? 'bg-blue-100 dark:bg-blue-900/50' :
            scope === 'single' ? 'bg-blue-100 dark:bg-blue-900/50' :
            scope === 'series' ? 'bg-green-100 dark:bg-green-900/50' :
            'bg-purple-100 dark:bg-purple-900/50'
          }`}>
            <Info className={`w-3 h-3 sm:w-4 sm:h-4 ${
              scope === 'oneTime' ? 'text-blue-600 dark:text-blue-400' :
              scope === 'single' ? 'text-blue-600 dark:text-blue-400' :
              scope === 'series' ? 'text-green-600 dark:text-green-400' :
              'text-purple-600 dark:text-purple-400'
            }`} />
          </div>
          <div>
            <h4 className={`font-medium mb-1 text-sm sm:text-base ${
              scope === 'oneTime' ? 'text-blue-900 dark:text-blue-100' :
              scope === 'single' ? 'text-blue-900 dark:text-blue-100' :
              scope === 'series' ? 'text-green-900 dark:text-green-100' :
              'text-purple-900 dark:text-purple-100'
            }`}>
              {scope === 'oneTime' && t('transactions.editingTransaction')}
              {scope === 'single' && t('transactions.editingSingleOccurrence')}
              {scope === 'series' && t('transactions.editingAllFuture')}
              {scope === 'template' && t('transactions.editingTemplate')}
            </h4>
            <p className={`text-xs sm:text-sm leading-relaxed ${
              scope === 'oneTime' ? 'text-blue-700 dark:text-blue-300' :
              scope === 'single' ? 'text-blue-700 dark:text-blue-300' :
              scope === 'series' ? 'text-green-700 dark:text-green-300' :
              'text-purple-700 dark:text-purple-300'
            }`}>
              {scope === 'oneTime' && t('transactions.oneTimeEditExplanation')}
              {scope === 'single' && t('transactions.singleEditExplanation')}
              {scope === 'series' && t('transactions.seriesEditExplanation')}
              {scope === 'template' && t('transactions.templateEditExplanation')}
            </p>
          </div>
        </div>
      </div>

      {/* ✅ FIXED: Scrollable main content area with proper constraints */}
      <div className="flex-1 overflow-y-auto min-h-0"> {/* ✅ FIXED: min-h-0 for proper scrolling */}
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4"> {/* ✅ FIXED: Responsive padding and spacing */}
                      <form onSubmit={handleSubmit} className="space-y-3">
            
            {/* ✅ FIXED: Responsive grid layout - stack on mobile */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3">
              
              {/* Amount Card */}
              <Card className="p-3 sm:p-4">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                  {t('common.amount')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      amount: amountValidation.formatAmountInput(e.target.value) 
                    }))}
                    placeholder="150.00"
                    className="w-full text-base sm:text-lg font-bold py-2 sm:py-3 px-3 sm:px-4 pr-10 sm:pr-12 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    required
                    autoFocus
                  />
                  <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2">
                    <span className="text-xs sm:text-sm font-medium text-gray-400">₪</span>
                  </div>
                </div>
              </Card>

              {/* Description Card */}
              <Card className="p-3 sm:p-4">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                  {t('common.description')} <span className="text-gray-500 text-xs">({t('common.optional')})</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={t('actions.descriptionPlaceholder')}
                    className="w-full text-sm sm:text-base py-2 sm:py-3 px-3 sm:px-4 pr-10 sm:pr-12 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                  <FileText className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {t('transactions.descriptionOptional')}
                </p>
              </Card>
            </div>

            {/* ✅ FIXED: Responsive category and date layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
              
              {/* Category Selection - Exact same as AddTransactions */}
              <Card className="p-3 sm:p-4 lg:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 sm:mb-4">
                  {t('common.category')}
                </label>
                
                {categoriesLoading ? (
                  <div className="flex justify-center py-8 sm:py-12">
                    <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-indigo-500"></div>
                  </div>
                ) : (
                  <>
                    {/* Category Tabs */}
                    <div className="flex space-x-1 mb-4 sm:mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => setCategoryTab('general')}
                        className={`flex-1 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-md transition-all ${
                          categoryTab === 'general'
                            ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1 sm:gap-2">
                          <Crown className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">{t('categories.defaultCategories')}</span>
                          <span className="sm:hidden">Default</span>
                          <span>({categorizedCategories.general.length})</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCategoryTab('customized')}
                        className={`flex-1 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-md transition-all ${
                          categoryTab === 'customized'
                            ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1 sm:gap-2">
                          {React.createElement(getIconComponent('tag'), { className: 'w-3 h-3 sm:w-4 sm:h-4' })}
                          <span className="hidden sm:inline">{t('categories.userCategoriesDesc')}</span>
                          <span className="sm:hidden">Custom</span>
                          <span>({categorizedCategories.customized.length})</span>
                        </div>
                      </button>
                    </div>

                    {/* ✅ FIXED: Responsive Category Grid */}
                    {currentTabCategories.length === 0 ? (
                      <div className="text-center py-6 sm:py-8">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                          {categoryTab === 'general' ? (
                            <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                          ) : (
                            <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                          )}
                        </div>
                        <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white mb-2">
                          {categoryTab === 'general' ? t('categories.noGeneralCategories') : t('categories.noCustomCategories')}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 mb-4">
                          {categoryTab === 'general' 
                            ? t('categories.defaultCategoriesWillAppear')
                            : t('categories.createCategoriesInSettings')
                          }
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3"> {/* ✅ FIXED: Responsive grid */}
                        {currentTabCategories.map((cat) => {
                          const IconComponent = cat.iconComponent;
                          const isSelected = formData.category_id === cat.id;
                          
                          return (
                            <motion.button
                              key={cat.id}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, category_id: cat.id }))}
                              className={`group p-2 sm:p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 sm:gap-3 text-center min-h-[80px] sm:min-h-[100px] relative ${
                                isSelected
                                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-lg scale-105'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 bg-white dark:bg-gray-800 hover:scale-102 hover:shadow-md'
                              }`}
                              whileHover={{ scale: isSelected ? 1.05 : 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              title={cat.name}
                            >
                              <div className={`p-2 sm:p-3 rounded-xl transition-colors ${
                                isSelected 
                                  ? 'bg-indigo-100 dark:bg-indigo-800' 
                                  : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20'
                              }`}>
                                <IconComponent className={`w-4 h-4 sm:w-6 sm:h-6 transition-colors ${
                                  isSelected 
                                    ? 'text-indigo-600 dark:text-indigo-400' 
                                    : 'text-gray-500 group-hover:text-indigo-500'
                                }`} />
                              </div>
                              
                              <span className={`text-xs sm:text-sm font-medium leading-tight text-center w-full transition-colors ${
                                isSelected 
                                  ? 'text-indigo-700 dark:text-indigo-300' 
                                  : 'text-gray-600 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                              }`}>
                                {cat.name}
                              </span>
                              
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-indigo-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-lg"
                                >
                                  <Check className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                                </motion.div>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </Card>

              {/* Date Selection - Same as AddTransactions */}
              <Card className="p-3 sm:p-4">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                  {t('common.date')}
                </label>
                <div className="relative">
                  <Button
                    ref={dateButtonRef}
                    type="button"
                    variant="outline"
                    fullWidth
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="justify-between py-2 sm:py-3 px-3 text-left border-2 hover:border-indigo-300 h-auto"
                  >
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="font-medium truncate text-sm sm:text-base">
                        {new Date(formData.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showCalendar ? 'rotate-180' : ''}`} />
                  </Button>
                  
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

            {/* ✅ SAME: Recurring Options - only for series/template (same as AddTransactions) */}
            {(scope === 'series' || scope === 'template') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Card className="p-3 sm:p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <div className="p-2 bg-green-500 rounded-md">
                      <Repeat className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                      {t('actions.recurringOptions')}
                    </h4>
                    <Badge variant="primary" size="small">
                      <Info className="w-3 h-3 mr-1" />
                      {t('actions.automaticPayments')}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('actions.frequency')}
                      </label>
                      <select
                        value={formData.recurring_interval}
                        onChange={(e) => setFormData(prev => ({ ...prev, recurring_interval: e.target.value }))}
                        className="w-full py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all text-sm sm:text-base"
                      >
                        <option value="daily">{t('common.daily')}</option>
                        <option value="weekly">{t('common.weekly')}</option>
                        <option value="monthly">{t('common.monthly')}</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('actions.endDate')} <span className="text-gray-500 text-xs">({t('common.optional')})</span>
                      </label>
                      <input
                        type="date"
                        value={formData.recurring_end_date || ''}
                        onChange={(e) => {
                          const inputDate = e.target.value;
                          if (inputDate) {
                            const date = new Date(inputDate + 'T12:00:00');
                            const localDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                            setFormData(prev => ({ ...prev, recurring_end_date: localDateStr }));
                          } else {
                            setFormData(prev => ({ ...prev, recurring_end_date: null }));
                          }
                        }}
                        min={formData.date}
                        className="w-full py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all text-sm sm:text-base"
                      />
                    </div>
                  </div>

                  {/* Day of Week for Weekly */}
                  {formData.recurring_interval === 'weekly' && (
                    <div className="mt-3 sm:mt-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('actions.dayOfWeek')}
                      </label>
                      <select
                        value={formData.day_of_week || 0}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          day_of_week: parseInt(e.target.value) 
                        }))}
                        className="w-full py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all text-sm sm:text-base"
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

                  {/* Day of Month for Monthly */}
                  {formData.recurring_interval === 'monthly' && (
                    <div className="mt-3 sm:mt-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('actions.dayOfMonth', 'Day of Month')}
                      </label>
                      <select
                        value={formData.day_of_month || new Date().getDate()}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          day_of_month: parseInt(e.target.value) 
                        }))}
                        className="w-full py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all text-sm sm:text-base"
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                          <option key={day} value={day}>
                            {day}{day === 1 ? (isRTL ? ' ראשון' : 'st') : 
                                day === 2 ? (isRTL ? ' שני' : 'nd') : 
                                day === 3 ? (isRTL ? ' שלישי' : 'rd') : 
                                (isRTL ? ` ה-${day}` : 'th')}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        {isRTL ? 'עבור חודשים עם פחות ימים, יבוא ביום האחרון של החודש' : 'For months with fewer days, will occur on the last day of the month'}
                      </p>
                    </div>
                  )}
                </Card>
              </motion.div>
            )}

            {/* ✅ ENHANCED: Beautiful Error Animation */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <div className="p-3 sm:p-4 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-800 rounded-xl shadow-lg">
                    <div className="flex items-center gap-3 text-red-800 dark:text-red-300">
                      <motion.div 
                        className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 shadow-md"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 0.5 }}
                      >
                        <X className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      </motion.div>
                      <div className="flex-1">
                        <h4 className="font-bold text-xs sm:text-sm">שגיאת עדכון</h4>
                        <p className="font-medium text-xs sm:text-sm">{error}</p>
                      </div>
                      <button
                        onClick={() => setError('')}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 p-1 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ✅ ENHANCED: Beautiful Success Animation with Auto-Close */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ scale: 0, opacity: 0, rotate: -180 }}
                  animate={{ 
                    scale: 1, 
                    opacity: 1, 
                    rotate: 0,
                    transition: {
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                      duration: 0.8
                    }
                  }}
                  className="text-center py-4 sm:py-6"
                >
                  <div className="inline-flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl shadow-lg">
                    <motion.div
                      className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-md"
                      animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, -10, 0]
                      }}
                      transition={{ duration: 0.8, type: "spring" }}
                    >
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                      >
                        <Check className="w-4 h-4 sm:w-7 sm:h-7 text-white drop-shadow-sm" />
                      </motion.div>
                    </motion.div>
                    <div className="text-left">
                      <motion.h3 
                        className="text-base sm:text-lg font-bold text-green-800 dark:text-green-300"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        {t('actions.updateSuccess') || 'עודכן בהצלחה!'}
                      </motion.h3>
                      <motion.p 
                        className="text-xs sm:text-sm text-green-600 dark:text-green-400 font-medium"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        החלון יסגר אוטומטית...
                      </motion.p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>
      </div>

      {/* ✅ FIXED: Compact responsive footer */}
      {!success && (
        <div className="flex-none border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4 bg-white dark:bg-gray-800">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isUpdating}
              className="px-4 sm:px-6 order-2 sm:order-1 text-sm"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isUpdating}
              disabled={isUpdating || !formData.amount}
              className={`flex-1 shadow-md hover:shadow-lg py-2 sm:py-3 bg-gradient-to-r ${scopeConfig.color} hover:opacity-90 order-1 sm:order-2 text-sm sm:text-base`}
              onClick={handleSubmit}
            >
              {isUpdating ? (
                <div className="flex items-center gap-2 justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  <span>{t('common.saving')}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 justify-center">
                  <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="font-medium">
                    {scopeConfig.saveText}
                  </span>
                </div>
              )}
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default EditTransactionPanel;