/**
 * 📝 TRANSACTION FORM WITH TABS - Comprehensive Redesign
 * Clear distinction between one-time and recurring transactions
 * Features: Separate tabs, improved UX, clear visual distinction
 * @version 4.0.0
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, Repeat, Calendar, Clock, Save, X, 
  AlertCircle, CheckCircle, Target, Zap 
} from 'lucide-react';

// ✅ Import Zustand stores
import {
  useAuth,
  useTranslation,
  useCurrency,
  useNotifications
} from '../../../../stores';

import { Button, LoadingSpinner, Card, Badge } from '../../../ui';
import TransactionFormFields from './TransactionFormFields';
import { validateTransaction } from './TransactionValidation';
import { formatTransactionForAPI, getDefaultFormData } from './TransactionHelpers';
import { cn } from '../../../../utils/helpers';

/**
 * 📝 Main Transaction Form Component with Tabs
 */
const TransactionFormTabs = ({
  mode = 'create', // create, edit, duplicate
  initialData = null,
  initialTab = null, // 'one-time' or 'recurring' to override default
  onSubmit,
  onCancel,
  isLoading = false,
  className = ''
}) => {
  const { user } = useAuth();
  const { t, isRTL } = useTranslation('transactions');
  const { formatCurrency } = useCurrency();
  const { addNotification } = useNotifications();

  /**
   * Tab state - Determines if transaction is one-time or recurring
   * @type {'one-time' | 'recurring'}
   */
  const [activeTab, setActiveTab] = useState(() => {
    // Allow external override of initial tab
    if (initialTab === 'recurring' || initialTab === 'one-time') {
      return initialTab;
    }
    // In edit mode - detect type from existing data
    if (mode === 'edit' && initialData?.template_id) {
      return 'recurring';
    }
    return 'one-time'; // Default to one-time transaction
  });

  // ✅ Centralized form state
  const [formData, setFormData] = useState(() => 
    getDefaultFormData(initialData, mode)
  );
  
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  /**
   * Update formData when switching tabs
   * Ensures proper field structure for one-time vs recurring transactions
   */
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      isRecurring: activeTab === 'recurring'
    }));
  }, [activeTab]);

  // ✅ Form validation
  const { isValid, errors } = useMemo(() => {
    const validation = validateTransaction(formData);
    return {
      isValid: validation.isValid,
      errors: validation.errors
    };
  }, [formData]);

  // Update validation errors when form changes
  useEffect(() => {
    if (isDirty) {
      setValidationErrors(errors);
    }
  }, [errors, isDirty]);

  // ✅ Tab definitions
  const tabs = [
    {
      id: 'one-time',
      icon: CreditCard,
      title: t('tabs.oneTime.title', { fallback: 'One-time Transaction' }),
      subtitle: t('tabs.oneTime.subtitle', { fallback: 'Single transaction' }),
      color: 'blue',
      description: t('tabs.oneTime.description', { fallback: 'Create a single transaction executed once' })
    },
    {
      id: 'recurring',
      icon: Repeat,
      title: t('tabs.recurring.title', { fallback: 'Recurring Transaction' }),
      subtitle: t('tabs.recurring.subtitle', { fallback: 'Automatic transaction' }),
      color: 'purple',
      description: t('tabs.recurring.description', { fallback: 'Create a template that generates transactions automatically' })
    }
  ];

  // ✅ Handle tab change
  const handleTabChange = useCallback((tabId) => {
    if (isDirty) {
      const confirmed = window.confirm(t('tabs.changeWarning', { 
        fallback: 'Changing the tab will reset the form. Continue?' 
      }));
      if (!confirmed) return;
    }
    
    setActiveTab(tabId);
    setFormData(getDefaultFormData(null, mode));
    setIsDirty(false);
    setValidationErrors({});
  }, [isDirty, mode, t]);

  // ✅ Handle form field changes
  const handleFieldChange = useCallback((field, value) => {
    console.log('📝 TransactionFormTabs: Field changed:', { field, value, currentFormData: formData });
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (!isDirty) {
      setIsDirty(true);
    }

    // Clear specific field error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  }, [isDirty, validationErrors, formData]);

  // ✅ Handle form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    console.log('🔒 Form submission triggered ONLY by explicit button click');
    setIsDirty(true);

    // Validate form
    const validation = validateTransaction(formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      addNotification({
        type: 'error',
        message: t('form.validationFailed'),
        duration: 3000
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Format data for API based on tab type
      const apiData = formatTransactionForAPI({
        ...formData,
        isRecurring: activeTab === 'recurring'
      }, mode);
      
      // Submit to parent
      await onSubmit?.(apiData);
      
      addNotification({
        type: 'success',
        message: activeTab === 'recurring' 
          ? t('form.recurringCreateSuccess', { fallback: 'Recurring transaction template created successfully!' })
          : t('form.createSuccess', { fallback: 'Transaction created successfully!' }),
        duration: 3000
      });
      
      // Reset form if creating new transaction
      if (mode === 'create') {
        setFormData(getDefaultFormData());
        setIsDirty(false);
        setValidationErrors({});
      }
      
    } catch (error) {
      console.error('Transaction submission failed:', error);
      addNotification({
        type: 'error',
        message: t('form.submitFailed'),
        duration: 4000
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, activeTab, mode, onSubmit, addNotification, t]);

  // ✅ Handle cancel
  const handleCancel = useCallback(() => {
    if (isDirty) {
      const confirmed = window.confirm(t('form.unsavedChanges'));
      if (!confirmed) return;
    }
    
    onCancel?.();
  }, [isDirty, onCancel, t]);

  return (
    <div 
      className={cn("space-y-6", className)}
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      {/* Header with Type Selection (compact) */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-700">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {mode === 'edit' ? t('form.editTransaction') : t('form.addTransaction')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t('form.selectType', { fallback: 'Choose the type of transaction you want to create' })}
          </p>
        </div>

        {/* Compact segmented control instead of large cards */}
        <div className="inline-flex bg-white dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-700 shadow-sm" style={{ direction: 'ltr' }}>
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
                disabled={mode === 'edit'}
              >
                <TabIcon className="w-4 h-4" />
                <span>{tab.id === 'recurring' ? t('tabs.recurring.title', { fallback: 'Recurring Transaction' }) : t('tabs.oneTime.title', { fallback: 'One-time Transaction' })}</span>
              </button>
            );
          })}
        </div>

        {/* Mode indicator for edit */}
        {mode === 'edit' && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-yellow-800 dark:text-yellow-200">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                {t('form.editMode', { fallback: 'In edit mode - cannot change transaction type' })}
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Form Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-6 sm:p-8 md:p-10 lg:p-12 bg-white dark:bg-gray-800 shadow-xl rounded-3xl border-0">
            {/* Enhanced Form Header - Better Mobile Layout */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 md:pb-8 mb-6 md:mb-8 border-b-2 border-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4 rtl:space-x-reverse flex-1">
                {/* Enhanced Tab icon */}
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300",
                  activeTab === 'recurring' 
                    ? "bg-gradient-to-br from-purple-500 to-purple-600 text-white"
                    : "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                )}>
                  {activeTab === 'recurring' ? (
                    <Repeat className="w-8 h-8" />
                  ) : (
                    <CreditCard className="w-8 h-8" />
                  )}
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {tabs.find(tab => tab.id === activeTab)?.title}
                  </h3>
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    {activeTab === 'recurring' 
                      ? t('form.recurringSubtitle', { fallback: 'Set up template for automatic transactions' })
                      : t('form.oneTimeSubtitle', { fallback: 'One-time transaction details' })
                    }
                  </p>
                </div>
              </div>

              {/* Form status indicators */}
              <div className="flex items-center gap-2">
                {isDirty && (
                  <div className="flex items-center space-x-1 rtl:space-x-reverse text-orange-600 dark:text-orange-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-medium">{t('form.unsaved')}</span>
                  </div>
                )}
                
                {!isValid && isDirty && (
                  <div className="flex items-center space-x-1 rtl:space-x-reverse text-red-600 dark:text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">{t('form.invalid')}</span>
                  </div>
                )}
                
                {isValid && isDirty && !isSubmitting && (
                  <div className="flex items-center space-x-1 rtl:space-x-reverse text-green-600 dark:text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">{t('form.valid')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Form Fields - Better Desktop Layout */}
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 lg:gap-8">
                <div className="xl:col-span-3 space-y-6">
                  <TransactionFormFields
                    formData={formData}
                    validationErrors={validationErrors}
                    onFieldChange={handleFieldChange}
                    showRecurring={activeTab === 'recurring'}
                    showAdvanced={activeTab === 'recurring'}
                    mode={mode}
                  />
                </div>
                
                {/* Enhanced Preview Panel - Better Desktop Integration */}
                <div className="hidden xl:block xl:col-span-2">
                  <Card className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 rounded-2xl border-2 border-gray-200 dark:border-gray-700">
                    <div className={cn(
                      "flex items-center space-x-3 rtl:space-x-reverse mb-6",
                      activeTab === 'recurring' ? "text-purple-600" : "text-blue-600"
                    )}>
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        activeTab === 'recurring' 
                          ? "bg-purple-100 dark:bg-purple-900/30"
                          : "bg-blue-100 dark:bg-blue-900/30"
                      )}>
                        {activeTab === 'recurring' ? (
                          <Repeat className="w-5 h-5" />
                        ) : (
                          <CreditCard className="w-5 h-5" />
                        )}
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {activeTab === 'recurring' 
                          ? t('recurring.preview.title', { fallback: 'Recurring Preview' })
                          : t('form.editTransaction', { fallback: 'Transaction Summary' })}
                      </h4>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <span className="text-gray-600 dark:text-gray-400">{t('fields.amount.label', { fallback: 'Amount' })}:</span>
                        <span className={cn(
                          "font-bold text-lg",
                          formData.type === 'income' ? "text-green-600" : "text-red-600"
                        )}>
                          {formatCurrency(formData.amount || 0)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <span className="text-gray-600 dark:text-gray-400">{t('fields.type.label', { fallback: 'Type' })}:</span>
                        <Badge variant={formData.type === 'income' ? 'success' : 'destructive'}>
                          {formData.type === 'income' ? t('types.income', { fallback: 'Income' }) : t('types.expense', { fallback: 'Expense' })}
                        </Badge>
                      </div>
                      
                      {formData.description && (
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                          <span className="text-gray-600 dark:text-gray-400 block mb-1">{t('fields.description.label', { fallback: 'Description' })}:</span>
                          <p className="font-medium text-gray-900 dark:text-white">{formData.description}</p>
                        </div>
                      )}
                      
                      {activeTab === 'recurring' && (
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                          <div className="flex items-center space-x-2 rtl:space-x-reverse text-purple-600 dark:text-purple-400 mb-2">
                            <Repeat className="w-4 h-4" />
                            <span className="font-medium">{t('labels.recurring', { fallback: 'Recurring' })}</span>
                          </div>
                          <p className="text-sm text-purple-700 dark:text-purple-300">
                            {t('recurring.description', { fallback: 'This will be created as a template and generated automatically by the chosen frequency.' })}
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </div>

              {/* Enhanced Form Actions - Better Mobile Layout */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700 mt-8 space-y-4 sm:space-y-0">
                {/* Left side - Additional info */}
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  {isDirty && (
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                      <span>{t('form.unsavedChanges')}</span>
                    </div>
                  )}
                </div>

                {/* Right side - Action buttons */}
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSubmitting || isLoading}
                    className="px-6 py-2.5 h-auto"
                  >
                    <X className="w-4 h-4 mr-2" />
                    {t('form.cancel')}
                  </Button>

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={!isValid || isSubmitting || isLoading}
                    className={cn(
                      "min-w-[140px] px-6 py-2.5 h-auto",
                      activeTab === 'recurring'
                        ? "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                        : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                    )}
                  >
                    {isSubmitting || isLoading ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : activeTab === 'recurring' ? (
                      <Repeat className="w-4 h-4 mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {isSubmitting 
                      ? t('form.saving')
                      : activeTab === 'recurring'
                        ? (mode === 'create' ? t('form.createTemplate') : t('form.updateTemplate'))
                        : (mode === 'create' ? t('form.create') : t('form.update'))
                    }
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default TransactionFormTabs;