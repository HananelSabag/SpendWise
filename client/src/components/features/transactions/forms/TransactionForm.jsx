/**
 * 📝 TRANSACTION FORM - MAIN ORCHESTRATOR
 * New clean architecture foundation - eliminates massive duplication
 * Features: Shared state management, Consistent UX, Mobile-first, Validation
 * @version 3.0.0 - COMPLETE REDESIGN
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, X, AlertCircle, CheckCircle, Clock, Calendar } from 'lucide-react';

// ✅ Import Zustand stores
import {
  useAuth,
  useTranslation,
  useCurrency,
  useNotifications
} from '../../../../stores';

import { Button, LoadingSpinner } from '../../../ui';
import TransactionFormFields from './TransactionFormFields';
import { validateTransaction, getValidationErrors } from './TransactionValidation';
import { formatTransactionForAPI, getDefaultFormData } from './TransactionHelpers';
import { cn } from '../../../../utils/helpers';

/**
 * 📝 Main Transaction Form Component
 */
const TransactionForm = ({
  mode = 'create', // create, edit, duplicate
  initialData = null,
  onSubmit,
  onCancel,
  isLoading = false,
  showRecurring = true,
  showAdvanced = true,
  className = ''
}) => {
  const { user } = useAuth();
  const { t, isRTL } = useTranslation('transactions');
  const { formatCurrency } = useCurrency();
  const { addNotification } = useNotifications();

  // ✅ Centralized form state
  const [formData, setFormData] = useState(() => 
    getDefaultFormData(initialData, mode)
  );
  
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

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
      // Format data for API
      const apiData = formatTransactionForAPI(formData, mode);
      
      // Submit to parent
      await onSubmit?.(apiData);
      
      addNotification({
        type: 'success',
        message: t(mode === 'create' ? 'form.createSuccess' : 'form.updateSuccess'),
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
  }, [formData, mode, onSubmit, addNotification, t]);

  // ✅ Handle cancel
  const handleCancel = useCallback(() => {
    if (isDirty) {
      // NOTE: Confirmation dialog for large transactions could be added for safety
      const confirmed = window.confirm(t('form.unsavedChanges'));
      if (!confirmed) return;
    }
    
    onCancel?.();
  }, [isDirty, onCancel, t]);

  // ✅ Form title based on mode
  const formTitle = useMemo(() => {
    switch (mode) {
      case 'edit':
        return t('form.editTransaction');
      case 'duplicate':
        return t('form.duplicateTransaction');
      default:
        return t('form.addTransaction');
    }
  }, [mode, t]);

  // ✅ Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  const fieldVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.2 }
    }
  };

  return (
    <motion.form
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      onSubmit={handleSubmit}
      className={cn(
        "space-y-6 bg-white dark:bg-gray-800 p-4 sm:p-6 md:p-8 lg:p-10 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700",
        "backdrop-blur-sm bg-white/95 dark:bg-gray-800/95",
        "max-w-none w-full",
        className
      )}
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      {/* Enhanced Form Header - Better Mobile Layout */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-gray-200 dark:border-gray-700 pb-6 space-y-4 sm:space-y-0">
        <div className="flex-1">
          <motion.h2 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-gray-900 dark:text-white mb-2"
          >
            {formTitle}
          </motion.h2>
          {mode === 'edit' && initialData && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              {t('form.editingTransaction', { 
                date: new Date(formData.date).toLocaleDateString(),
                amount: formatCurrency(Math.abs(formData.amount)) 
              })}
            </motion.p>
          )}
        </div>

        {/* Form Status - Better Mobile Layout */}
        <div className="flex items-center gap-2 sm:ml-4">
          {isDirty && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center space-x-1 text-orange-600 dark:text-orange-400"
            >
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">{t('form.unsaved')}</span>
            </motion.div>
          )}
          
          {!isValid && isDirty && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center space-x-1 text-red-600 dark:text-red-400"
            >
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs font-medium">{t('form.invalid')}</span>
            </motion.div>
          )}
          
          {isValid && isDirty && !isSubmitting && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center space-x-1 text-green-600 dark:text-green-400"
            >
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs font-medium">{t('form.valid')}</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Form Fields */}
      <motion.div variants={fieldVariants}>
        <TransactionFormFields
          formData={formData}
          validationErrors={validationErrors}
          onFieldChange={handleFieldChange}
          showRecurring={showRecurring}
          showAdvanced={showAdvanced}
          mode={mode}
        />
      </motion.div>

      {/* Enhanced Form Actions - Better Mobile Experience */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700 space-y-4 sm:space-y-0"
      >
        {/* Left side - Additional info */}
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          {isDirty && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
              <span>{t('form.unsavedChanges')}</span>
            </motion.div>
          )}
        </div>

        {/* Action buttons - Enhanced Touch Targets */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting || isLoading}
              className="px-6 py-3 h-auto text-base font-medium rounded-xl border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 flex-1 sm:flex-none"
            >
              <X className="w-4 h-4 mr-2" />
              {t('form.cancel')}
            </Button>
          </motion.div>

          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              type="submit"
              variant="primary"
              disabled={!isValid || isSubmitting || isLoading}
              className={cn(
                "min-w-[140px] px-6 py-3 h-auto text-base font-medium rounded-xl shadow-lg",
                "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
                "disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed",
                "transition-all duration-200 flex-1 sm:flex-none"
              )}
            >
              {isSubmitting || isLoading ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isSubmitting 
                ? t('form.saving')
                : mode === 'create' 
                  ? t('form.create')
                  : t('form.update')
              }
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </motion.form>
  );
};

export default TransactionForm; 