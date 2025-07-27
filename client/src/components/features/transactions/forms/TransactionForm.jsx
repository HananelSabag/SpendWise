/**
 * 📝 TRANSACTION FORM - MAIN ORCHESTRATOR
 * New clean architecture foundation - eliminates massive duplication
 * Features: Shared state management, Consistent UX, Mobile-first, Validation
 * @version 3.0.0 - COMPLETE REDESIGN
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, X, AlertCircle, CheckCircle, Clock } from 'lucide-react';

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
      // TODO: Show confirmation dialog
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
        "space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg",
        className
      )}
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      {/* Form Header */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {formTitle}
          </h2>
          {mode === 'edit' && initialData && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('form.editingTransaction', { 
                date: new Date(formData.date).toLocaleDateString(),
                amount: formatCurrency(Math.abs(formData.amount)) 
              })}
            </p>
          )}
        </div>

        {/* Form Status */}
        <div className="flex items-center space-x-2">
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

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isSubmitting || isLoading}
        >
          <X className="w-4 h-4 mr-2" />
          {t('form.cancel')}
        </Button>

        <Button
          type="submit"
          variant="primary"
          disabled={!isValid || isSubmitting || isLoading}
          className="min-w-[120px]"
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
      </div>
    </motion.form>
  );
};

export default TransactionForm; 