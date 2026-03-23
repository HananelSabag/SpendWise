/**
 * 📝 TRANSACTION FORM WITH TABS - Comprehensive Redesign
 * Clear distinction between one-time and recurring transactions
 * Features: Separate tabs, improved UX, clear visual distinction
 * @version 4.0.0
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Repeat, Save, X } from 'lucide-react';

// ✅ Import Zustand stores
import {
  useAuth,
  useTranslation,
  useCurrency,
  useNotifications
} from '../../../../stores';

import { Button, LoadingSpinner, Badge } from '../../../ui';
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
      {/* Header with Type Selection */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shadow-md shrink-0",
            activeTab === 'recurring'
              ? "bg-gradient-to-br from-purple-500 to-violet-600"
              : "bg-gradient-to-br from-blue-500 to-indigo-600"
          )}>
            {activeTab === 'recurring' ? <Repeat className="w-5 h-5 text-white" /> : <CreditCard className="w-5 h-5 text-white" />}
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              {mode === 'edit' ? t('form.editTransaction') : t('form.addTransaction')}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {activeTab === 'recurring'
                ? t('form.recurringSubtitle', { fallback: 'Automatic recurring template' })
                : t('form.oneTimeSubtitle', { fallback: 'One-time transaction' })}
            </p>
          </div>
        </div>

        {/* Tab toggle */}
        <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 shrink-0" style={{ direction: 'ltr' }}>
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  isActive
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                )}
                disabled={mode === 'edit'}
              >
                <TabIcon className="w-3.5 h-3.5" />
                <span>{tab.id === 'recurring' ? t('tabs.recurring.title', { fallback: 'Recurring' }) : t('tabs.oneTime.title', { fallback: 'One-time' })}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm">
            <form onSubmit={handleSubmit} className="p-4 sm:p-5">
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 lg:gap-6">
                <div className="xl:col-span-3 space-y-4">
                  <TransactionFormFields
                    formData={formData}
                    validationErrors={validationErrors}
                    onFieldChange={handleFieldChange}
                    showRecurring={activeTab === 'recurring'}
                    showAdvanced={activeTab === 'recurring'}
                    mode={mode}
                  />
                </div>
                
                {/* Preview Panel (desktop only) */}
                <div className="hidden xl:block xl:col-span-2">
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {activeTab === 'recurring'
                        ? t('recurring.preview.title', { fallback: 'Recurring Preview' })
                        : t('form.editTransaction', { fallback: 'Summary' })}
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{t('fields.amount.label', { fallback: 'Amount' })}</span>
                        <span className={cn("text-sm font-bold", formData.type === 'income' ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                          {formatCurrency(formData.amount || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{t('fields.type.label', { fallback: 'Type' })}</span>
                        <Badge variant={formData.type === 'income' ? 'success' : 'destructive'}>
                          {formData.type === 'income' ? t('types.income', { fallback: 'Income' }) : t('types.expense', { fallback: 'Expense' })}
                        </Badge>
                      </div>
                      {formData.description && (
                        <div className="py-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{t('fields.description.label', { fallback: 'Description' })}</span>
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{formData.description}</p>
                        </div>
                      )}
                      {activeTab === 'recurring' && (
                        <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                          <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 mb-1">
                            <Repeat className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium">{t('labels.recurring', { fallback: 'Recurring' })}</span>
                          </div>
                          <p className="text-xs text-purple-700 dark:text-purple-300">
                            {t('recurring.description', { fallback: 'Template auto-generates transactions by frequency.' })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700 mt-4">
                {isDirty && (
                  <span className="text-xs text-gray-400 dark:text-gray-500 mr-auto">{t('form.unsavedChanges')}</span>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting || isLoading}
                  className="px-4 py-2 h-auto text-sm"
                >
                  <X className="w-3.5 h-3.5 mr-1.5" />
                  {t('form.cancel')}
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={!isValid || isSubmitting || isLoading}
                  className={cn(
                    "px-5 py-2 h-auto text-sm",
                    activeTab === 'recurring'
                      ? "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                      : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  )}
                >
                  {isSubmitting || isLoading ? (
                    <LoadingSpinner size="sm" className="mr-1.5" />
                  ) : activeTab === 'recurring' ? (
                    <Repeat className="w-3.5 h-3.5 mr-1.5" />
                  ) : (
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  {isSubmitting
                    ? t('form.saving')
                    : activeTab === 'recurring'
                      ? (mode === 'create' ? t('form.createTemplate') : t('form.updateTemplate'))
                      : (mode === 'create' ? t('form.create') : t('form.update'))
                  }
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default TransactionFormTabs;