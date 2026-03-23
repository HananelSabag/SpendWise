/**
 * 📝 TRANSACTION FORM — used by EditTransactionModal
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Save, X, CreditCard } from 'lucide-react';

import {
  useAuth,
  useTranslation,
  useNotifications
} from '../../../../stores';

import { Button, LoadingSpinner } from '../../../ui';
import TransactionFormFields from './TransactionFormFields';
import { validateTransaction } from './TransactionValidation';
import { formatTransactionForAPI, getDefaultFormData } from './TransactionHelpers';
import { cn } from '../../../../utils/helpers';

const TransactionForm = ({
  mode         = 'edit',
  initialData  = null,
  onSubmit,
  onCancel,
  isLoading    = false,
  showRecurring = false,
  showAdvanced  = true,
  className    = '',
}) => {
  const { t, isRTL }       = useTranslation('transactions');
  const { addNotification } = useNotifications();

  const [formData, setFormData]               = useState(() => getDefaultFormData(initialData, mode));
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting]       = useState(false);
  const [isDirty, setIsDirty]                 = useState(false);

  const { isValid, errors } = useMemo(() => {
    const v = validateTransaction(formData);
    return { isValid: v.isValid, errors: v.errors };
  }, [formData]);

  useEffect(() => {
    if (isDirty) setValidationErrors(errors);
  }, [errors, isDirty]);

  const handleFieldChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (!isDirty) setIsDirty(true);
    if (validationErrors[field]) setValidationErrors(prev => ({ ...prev, [field]: null }));
  }, [isDirty, validationErrors]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsDirty(true);
    const validation = validateTransaction(formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      addNotification({ type: 'error', message: t('form.validationFailed'), duration: 3000 });
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit?.(formatTransactionForAPI(formData, mode));
      addNotification({ type: 'success', message: t('form.updateSuccess'), duration: 3000 });
    } catch {
      addNotification({ type: 'error', message: t('form.submitFailed'), duration: 4000 });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, mode, onSubmit, addNotification, t]);

  const handleCancel = useCallback(() => {
    if (isDirty && !window.confirm(t('form.unsavedChanges'))) return;
    onCancel?.();
  }, [isDirty, onCancel, t]);

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('space-y-4', className)}
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shrink-0">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              {t('form.editTransaction', 'Edit Transaction')}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {initialData?.description || t('form.oneTimeSubtitle', 'One-time transaction')}
            </p>
          </div>
        </div>
      </div>

      {/* Fields */}
      <TransactionFormFields
        formData={formData}
        validationErrors={validationErrors}
        onFieldChange={handleFieldChange}
        showRecurring={showRecurring}
        showAdvanced={showAdvanced}
        mode={mode}
      />

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
        {isDirty && (
          <span className="text-xs text-gray-400 dark:text-gray-500 mr-auto">
            {t('form.unsavedChanges', 'Unsaved changes')}
          </span>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isSubmitting || isLoading}
          className="px-4 py-2 h-auto text-sm"
        >
          <X className="w-3.5 h-3.5 mr-1.5" />
          {t('form.cancel', 'Cancel')}
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={!isValid || isSubmitting || isLoading}
          className="px-5 py-2 h-auto text-sm bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
        >
          {isSubmitting || isLoading
            ? <LoadingSpinner size="sm" className="mr-1.5" />
            : <Save className="w-3.5 h-3.5 mr-1.5" />}
          {isSubmitting ? t('form.saving', 'Saving...') : t('form.update', 'Update')}
        </Button>
      </div>
    </form>
  );
};

export default TransactionForm;
