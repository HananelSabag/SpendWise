/**
 * 📝 TRANSACTION FORM WITH TABS - עיצוב מחדש מקיף
 * טופס עסקאות עם הבחנה ברורה בין חד-פעמי לחוזר
 * Features: טאבים נפרדים, UX משופר, הבחנה ויזואלית ברורה
 * @version 4.0.0 - בהתאם לבקשת המשתמש
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
  className = ''
}) => {
  const { user } = useAuth();
  const { t, isRTL } = useTranslation('transactions');
  const { formatCurrency } = useCurrency();
  const { addNotification } = useNotifications();

  // ✅ Tab state - חד פעמי או חוזר
  const [activeTab, setActiveTab] = useState(() => {
    // בעריכה - זהה את הסוג לפי הנתונים הקיימים
    if (mode === 'edit' && initialData?.template_id) {
      return 'recurring';
    }
    return 'one-time'; // ברירת מחדל
  });

  // ✅ Centralized form state
  const [formData, setFormData] = useState(() => 
    getDefaultFormData(initialData, mode)
  );
  
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // ✅ עדכון formData כאשר משנים טאב
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
      title: t('tabs.oneTime.title', { fallback: 'עסקה חד פעמית' }),
      subtitle: t('tabs.oneTime.subtitle', { fallback: 'עסקה אחת בלבד' }),
      color: 'blue',
      description: t('tabs.oneTime.description', { fallback: 'צור עסקה יחידה שתבוצע פעם אחת' })
    },
    {
      id: 'recurring',
      icon: Repeat,
      title: t('tabs.recurring.title', { fallback: 'עסקה חוזרת' }),
      subtitle: t('tabs.recurring.subtitle', { fallback: 'עסקה אוטומטית' }),
      color: 'purple',
      description: t('tabs.recurring.description', { fallback: 'צור תבנית שתיצור עסקאות אוטומטית בעתיד' })
    }
  ];

  // ✅ Handle tab change
  const handleTabChange = useCallback((tabId) => {
    if (isDirty) {
      const confirmed = window.confirm(t('tabs.changeWarning', { 
        fallback: 'שינוי הטאב יאיפס את הטופס. האם להמשיך?' 
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
  }, [isDirty, validationErrors]);

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
      {/* Header with Tab Selection */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-700">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {mode === 'edit' ? t('form.editTransaction') : t('form.addTransaction')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t('form.selectType', { fallback: 'בחר את סוג העסקה שברצונך ליצור' })}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-2 gap-4">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <motion.button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "relative p-4 rounded-xl border-2 transition-all duration-200 text-right",
                  "focus:outline-none focus:ring-2 focus:ring-offset-2",
                  isActive ? [
                    tab.color === 'blue' 
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 focus:ring-blue-500"
                      : "border-purple-500 bg-purple-50 dark:bg-purple-900/30 focus:ring-purple-500"
                  ] : [
                    "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700",
                    "hover:border-gray-300 dark:hover:border-gray-500"
                  ]
                )}
                disabled={mode === 'edit'} // לא ניתן לשנות טאב בעריכה
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className={cn(
                      "absolute top-2 left-2 w-3 h-3 rounded-full",
                      tab.color === 'blue' ? "bg-blue-500" : "bg-purple-500"
                    )}
                  />
                )}

                <div className="flex items-start space-x-3 rtl:space-x-reverse">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    isActive ? [
                      tab.color === 'blue' 
                        ? "bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300"
                        : "bg-purple-100 dark:bg-purple-800 text-purple-600 dark:text-purple-300"
                    ] : "bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                  )}>
                    <TabIcon className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 text-right rtl:text-right">
                    <h3 className={cn(
                      "font-semibold text-base mb-1",
                      isActive ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"
                    )}>
                      {tab.title}
                    </h3>
                    <p className={cn(
                      "text-sm",
                      isActive ? [
                        tab.color === 'blue' 
                          ? "text-blue-600 dark:text-blue-300"
                          : "text-purple-600 dark:text-purple-300"
                      ] : "text-gray-500 dark:text-gray-400"
                    )}>
                      {tab.subtitle}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {tab.description}
                    </p>
                  </div>
                </div>

                {/* Badge for recurring */}
                {tab.id === 'recurring' && (
                  <Badge 
                    variant="secondary" 
                    className="absolute top-2 right-2 text-xs"
                  >
                    {t('badges.advanced', { fallback: 'מתקדם' })}
                  </Badge>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Mode indicator for edit */}
        {mode === 'edit' && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-yellow-800 dark:text-yellow-200">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                {t('form.editMode', { fallback: 'במצב עריכה - לא ניתן לשנות את סוג העסקה' })}
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
          <Card className="p-6 md:p-8">
            {/* Form Header */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-6 mb-6">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                {/* Tab icon */}
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  activeTab === 'recurring' 
                    ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                    : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                )}>
                  {activeTab === 'recurring' ? (
                    <Repeat className="w-5 h-5" />
                  ) : (
                    <CreditCard className="w-5 h-5" />
                  )}
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {tabs.find(tab => tab.id === activeTab)?.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {activeTab === 'recurring' 
                      ? t('form.recurringSubtitle', { fallback: 'הגדר תבנית לעסקאות אוטומטיות' })
                      : t('form.oneTimeSubtitle', { fallback: 'פרטי העסקה החד-פעמית' })
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

            {/* Form Fields */}
            <form onSubmit={handleSubmit}>
              <TransactionFormFields
                formData={formData}
                validationErrors={validationErrors}
                onFieldChange={handleFieldChange}
                showRecurring={activeTab === 'recurring'}
                showAdvanced={activeTab === 'recurring'}
                mode={mode}
              />

              {/* Form Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700 mt-8">
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