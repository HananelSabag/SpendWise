/**
 * 📝 TRANSACTION FORM WITH TABS - Modern
 * Tabbed transaction form with clear separation between one-time and recurring
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
  onSubmit,
  onCancel,
  isLoading = false,
  className = '',
  // External control for active tab and header visibility
  activeTabExternal,
  onActiveTabChange,
  hideTopCard = false
}) => {
  const { user } = useAuth();
  const { t, isRTL } = useTranslation('transactions');
  const { formatCurrency } = useCurrency();
  const { addNotification } = useNotifications();

  // ✅ Tab state (supports external control)
  const [internalActiveTab, setInternalActiveTab] = useState(() => {
    // In edit mode, detect type from existing data
    if (mode === 'edit' && initialData?.template_id) {
      return 'recurring';
    }
    return 'one-time';
  });
  const activeTab = activeTabExternal ?? internalActiveTab;
  const setActiveTab = (val) => {
    if (onActiveTabChange) onActiveTabChange(val);
    setInternalActiveTab(val);
  };

  // ✅ Centralized form state
  const [formData, setFormData] = useState(() => 
    getDefaultFormData(initialData, mode)
  );
  
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // ✅ Update formData when changing tab
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
      title: t('formTabs.oneTime.title', { fallback: 'One-time Transaction' }),
      subtitle: t('formTabs.oneTime.subtitle', { fallback: 'Single transaction' }),
      color: 'blue',
      description: t('formTabs.oneTime.description', { fallback: 'Create a single transaction that will be executed once' })
    },
    {
      id: 'recurring',
      icon: Repeat,
      title: t('formTabs.recurring.title', { fallback: 'Recurring Transaction' }),
      subtitle: t('formTabs.recurring.subtitle', { fallback: 'Automatic transaction' }),
      color: 'purple',
      description: t('formTabs.recurring.description', { fallback: 'Create a template that will generate transactions automatically in the future' })
    }
  ];

  // ✅ Handle tab change
  const handleTabChange = useCallback((tabId) => {
    if (isDirty) {
      const confirmed = window.confirm(t('formTabs.changeWarning', { 
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
          ? t('form.recurringCreateSuccess', { fallback: 'תבנית חוזרת נוצרה בהצלחה!' })
          : t('form.createSuccess', { fallback: 'עסקה נוצרה בהצלחה!' }),
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
      {!hideTopCard && (
      <Card className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-700">

        {/* Compact segmented control instead of large cards */}
        <div className="inline-flex bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700 shadow-sm">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
                disabled={mode === 'edit'}
              >
                <TabIcon className="w-4 h-4" />
                <span>{tab.id === 'recurring' ? t('tabs.recurring.title') : t('tabs.oneTime.title')}</span>
              </button>
            );
          })}
        </div>

        {/* Mode indicator for edit */}
        {mode === 'edit' && (
          <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-yellow-800 dark:text-yellow-200">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                {t('form.editMode', { fallback: 'במצב עריכה - לא ניתן לשנות את סוג העסקה' })}
              </span>
            </div>
          </div>
        )}
      </Card>
      )}

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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-gray-200 dark:border-gray-700 space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-4 rtl:space-x-reverse flex-1">
                {/* Enhanced Tab icon */}
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shadow-md transition-all duration-300",
                  activeTab === 'recurring' 
                    ? "bg-gradient-to-br from-purple-500 to-purple-600 text-white"
                    : "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                )}>
                  {activeTab === 'recurring' ? (
                    <Repeat className="w-6 h-6" />
                  ) : (
                    <CreditCard className="w-6 h-6" />
                  )}
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {tabs.find(tab => tab.id === activeTab)?.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {activeTab === 'recurring' ? t('form.recurringSubtitle') : t('form.oneTimeSubtitle')}
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
                        {activeTab === 'recurring' ? t('recurring.preview.title') : t('labels.template')}
                      </h4>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <span className="text-gray-600 dark:text-gray-400">{t('fields.amount.label')}:</span>
                        <span className={cn(
                          "font-bold text-lg",
                          formData.type === 'income' ? "text-green-600" : "text-red-600"
                        )}>
                          {formatCurrency(formData.amount || 0)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <span className="text-gray-600 dark:text-gray-400">{t('fields.type.label')}:</span>
                        <Badge variant={formData.type === 'income' ? 'success' : 'destructive'}>
                          {formData.type === 'income' ? t('types.income') : t('types.expense')}
                        </Badge>
                      </div>
                      
                      {formData.description && (
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                          <span className="text-gray-600 dark:text-gray-400 block mb-1">{t('fields.description.label')}:</span>
                          <p className="font-medium text-gray-900 dark:text-white">{formData.description}</p>
                        </div>
                      )}
                      
                      {activeTab === 'recurring' && (
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                          <div className="flex items-center space-x-2 rtl:space-x-reverse text-purple-600 dark:text-purple-400 mb-2">
                            <Repeat className="w-4 h-4" />
                            <span className="font-medium">{t('labels.recurring')}</span>
                          </div>
                          <p className="text-sm text-purple-700 dark:text-purple-300">
                            {t('tabs.recurring.description')}
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