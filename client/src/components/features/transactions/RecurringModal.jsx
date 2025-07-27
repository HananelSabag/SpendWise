/**
 * 🔄 RECURRING MODAL - MOBILE-FIRST
 * Enhanced recurring transaction setup with better UX
 * NOW WITH ZUSTAND STORES! 🎉
 * @version 2.0.0
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Repeat, Calendar, Clock, Target, TrendingUp, TrendingDown,
  X, Check, AlertCircle, Info, Zap, Settings, ChevronDown
} from 'lucide-react';

// ✅ NEW: Import from Zustand stores instead of Context
import {
  useTranslation,
  useCurrency,
  useTheme,
  useNotifications
} from '../../../stores';

import { Button, Modal, Input, Select, Card, Badge, Tooltip } from '../../ui';
import { cn, dateHelpers } from '../../../utils/helpers';

const RecurringModal = ({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  mode = 'create' // create, edit, template
}) => {
  // ✅ NEW: Use Zustand stores
  const { t, isRTL } = useTranslation('transactions');
  const { formatCurrency, currency } = useCurrency();
  const { isDark } = useTheme();
  const { addNotification } = useNotifications();

  // Form state
  const [formData, setFormData] = useState({
    description: initialData?.description || '',
    amount: initialData?.amount || '',
    type: initialData?.type || 'expense',
    category_id: initialData?.category_id || '',
    frequency: initialData?.frequency || 'monthly',
    interval: initialData?.interval || 1,
    start_date: initialData?.start_date || new Date().toISOString().split('T')[0],
    end_date: initialData?.end_date || '',
    end_type: initialData?.end_type || 'never', // never, date, occurrences
    max_occurrences: initialData?.max_occurrences || 12,
    is_active: initialData?.is_active ?? true,
    tags: initialData?.tags || [],
    notes: initialData?.notes || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1: basic, 2: schedule, 3: review
  const [validationErrors, setValidationErrors] = useState({});

  // Frequency options
  const frequencyOptions = [
    { value: 'daily', label: t('recurring.frequency.daily'), icon: '📅' },
    { value: 'weekly', label: t('recurring.frequency.weekly'), icon: '📆' },
    { value: 'monthly', label: t('recurring.frequency.monthly'), icon: '🗓️' },
    { value: 'quarterly', label: t('recurring.frequency.quarterly'), icon: '📊' },
    { value: 'yearly', label: t('recurring.frequency.yearly'), icon: '🎯' }
  ];

  // End type options
  const endTypeOptions = [
    { value: 'never', label: t('recurring.endType.never'), description: t('recurring.endType.neverDesc') },
    { value: 'date', label: t('recurring.endType.date'), description: t('recurring.endType.dateDesc') },
    { value: 'occurrences', label: t('recurring.endType.occurrences'), description: t('recurring.endType.occurrencesDesc') }
  ];

  // Calculate preview of upcoming transactions
  const upcomingTransactions = useMemo(() => {
    if (!formData.start_date || !formData.frequency) return [];

    const transactions = [];
    const startDate = new Date(formData.start_date);
    const endDate = formData.end_type === 'date' && formData.end_date 
      ? new Date(formData.end_date) 
      : null;
    const maxOccurrences = formData.end_type === 'occurrences' 
      ? formData.max_occurrences 
      : 5; // Preview limit

    let currentDate = new Date(startDate);
    let count = 0;

    while (count < maxOccurrences && count < 5) {
      if (endDate && currentDate > endDate) break;

      transactions.push({
        date: new Date(currentDate),
        amount: parseFloat(formData.amount) || 0,
        description: formData.description,
        type: formData.type
      });

      // Calculate next date based on frequency
      switch (formData.frequency) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + formData.interval);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + (7 * formData.interval));
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + formData.interval);
          break;
        case 'quarterly':
          currentDate.setMonth(currentDate.getMonth() + (3 * formData.interval));
          break;
        case 'yearly':
          currentDate.setFullYear(currentDate.getFullYear() + formData.interval);
          break;
        default:
          break;
      }

      count++;
    }

    return transactions;
  }, [formData]);

  // Form validation
  const validateForm = useCallback(() => {
    const errors = {};

    if (!formData.description.trim()) {
      errors.description = t('validation.descriptionRequired');
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      errors.amount = t('validation.amountRequired');
    }

    if (!formData.category_id) {
      errors.category_id = t('validation.categoryRequired');
    }

    if (!formData.start_date) {
      errors.start_date = t('validation.startDateRequired');
    }

    if (formData.end_type === 'date' && !formData.end_date) {
      errors.end_date = t('validation.endDateRequired');
    }

    if (formData.end_type === 'occurrences' && (!formData.max_occurrences || formData.max_occurrences < 1)) {
      errors.max_occurrences = t('validation.occurrencesRequired');
    }

    if (formData.interval < 1) {
      errors.interval = t('validation.intervalRequired');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, t]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      addNotification({
        type: 'error',
        title: t('validation.pleaseFixErrors'),
        duration: 4000
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
      
      addNotification({
        type: 'success',
        title: mode === 'create' ? t('success.recurringCreated') : t('success.recurringUpdated'),
        duration: 3000
      });

      onClose();
    } catch (error) {
      addNotification({
        type: 'error',
        title: t('errors.savingFailed'),
        description: error.message,
        duration: 5000
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, onSave, mode, addNotification, t, onClose]);

  // Update form data
  const updateFormData = useCallback((updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      description: '',
      amount: '',
      type: 'expense',
      category_id: '',
      frequency: 'monthly',
      interval: 1,
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      end_type: 'never',
      max_occurrences: 12,
      is_active: true,
      tags: [],
      notes: ''
    });
    setStep(1);
    setValidationErrors({});
  }, []);

  // Handle close
  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  // Render step 1: Basic Information
  const renderBasicStep = () => (
    <div className="space-y-6">
      {/* Transaction Type */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant={formData.type === 'income' ? 'primary' : 'outline'}
          onClick={() => updateFormData({ type: 'income' })}
          className="h-16 flex flex-col items-center justify-center"
        >
          <TrendingUp className="w-6 h-6 mb-1" />
          {t('types.income')}
        </Button>
        <Button
          variant={formData.type === 'expense' ? 'primary' : 'outline'}
          onClick={() => updateFormData({ type: 'expense' })}
          className="h-16 flex flex-col items-center justify-center"
        >
          <TrendingDown className="w-6 h-6 mb-1" />
          {t('types.expense')}
        </Button>
      </div>

      {/* Description */}
      <Input
        label={t('fields.description')}
        placeholder={t('placeholders.recurringDescription')}
        value={formData.description}
        onChange={(e) => updateFormData({ description: e.target.value })}
        error={validationErrors.description}
        required
      />

      {/* Amount */}
      <Input
        label={t('fields.amount')}
        type="number"
        step="0.01"
        min="0"
        placeholder="0.00"
        value={formData.amount}
        onChange={(e) => updateFormData({ amount: e.target.value })}
        error={validationErrors.amount}
        required
      />

      {/* Category */}
      <Select
        label={t('fields.category')}
        placeholder={t('placeholders.selectCategory')}
        value={formData.category_id}
        onChange={(value) => updateFormData({ category_id: value })}
        error={validationErrors.category_id}
        required
      >
        {/* Category options would be populated here */}
      </Select>
    </div>
  );

  // Render step 2: Schedule
  const renderScheduleStep = () => (
    <div className="space-y-6">
      {/* Frequency */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {t('recurring.frequency.title')}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {frequencyOptions.map((option) => (
            <Button
              key={option.value}
              variant={formData.frequency === option.value ? 'primary' : 'outline'}
              onClick={() => updateFormData({ frequency: option.value })}
              className="h-16 flex flex-col items-center justify-center text-xs"
            >
              <span className="text-lg mb-1">{option.icon}</span>
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Interval */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label={t('recurring.interval.title')}
          type="number"
          min="1"
          value={formData.interval}
          onChange={(e) => updateFormData({ interval: parseInt(e.target.value) || 1 })}
          error={validationErrors.interval}
        />
        <div className="flex items-end">
          <span className="text-sm text-gray-600 dark:text-gray-400 pb-2">
            {t(`recurring.interval.${formData.frequency}`, { count: formData.interval })}
          </span>
        </div>
      </div>

      {/* Start Date */}
      <Input
        label={t('recurring.startDate')}
        type="date"
        value={formData.start_date}
        onChange={(e) => updateFormData({ start_date: e.target.value })}
        error={validationErrors.start_date}
        required
      />

      {/* End Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {t('recurring.endType.title')}
        </label>
        <div className="space-y-3">
          {endTypeOptions.map((option) => (
            <Card
              key={option.value}
              className={cn(
                "p-4 cursor-pointer transition-all border-2",
                formData.end_type === option.value
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              )}
              onClick={() => updateFormData({ end_type: option.value })}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {option.label}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {option.description}
                  </p>
                </div>
                <div className={cn(
                  "w-4 h-4 rounded-full border-2",
                  formData.end_type === option.value
                    ? "border-primary-500 bg-primary-500"
                    : "border-gray-300 dark:border-gray-600"
                )}>
                  {formData.end_type === option.value && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* End Date (if end_type is 'date') */}
      {formData.end_type === 'date' && (
        <Input
          label={t('recurring.endDate')}
          type="date"
          value={formData.end_date}
          onChange={(e) => updateFormData({ end_date: e.target.value })}
          error={validationErrors.end_date}
          min={formData.start_date}
          required
        />
      )}

      {/* Max Occurrences (if end_type is 'occurrences') */}
      {formData.end_type === 'occurrences' && (
        <Input
          label={t('recurring.maxOccurrences')}
          type="number"
          min="1"
          value={formData.max_occurrences}
          onChange={(e) => updateFormData({ max_occurrences: parseInt(e.target.value) || 1 })}
          error={validationErrors.max_occurrences}
          required
        />
      )}
    </div>
  );

  // Render step 3: Review
  const renderReviewStep = () => (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="p-4 bg-gray-50 dark:bg-gray-800">
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">
          {t('recurring.summary.title')}
        </h3>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">{t('fields.description')}:</span>
            <span className="font-medium">{formData.description}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">{t('fields.amount')}:</span>
            <Badge variant={formData.type === 'income' ? 'success' : 'destructive'}>
              {formData.type === 'income' ? '+' : '-'}{formatCurrency(parseFloat(formData.amount) || 0)}
            </Badge>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">{t('recurring.frequency.title')}:</span>
            <span className="font-medium">
              {t(`recurring.frequency.${formData.frequency}`)} 
              {formData.interval > 1 && ` (${t('recurring.interval.every')} ${formData.interval})`}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">{t('recurring.startDate')}:</span>
            <span className="font-medium">{dateHelpers.format(formData.start_date, 'MMM DD, YYYY')}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">{t('recurring.endType.title')}:</span>
            <span className="font-medium">
              {formData.end_type === 'never' && t('recurring.endType.never')}
              {formData.end_type === 'date' && dateHelpers.format(formData.end_date, 'MMM DD, YYYY')}
              {formData.end_type === 'occurrences' && t('recurring.occurrencesCount', { count: formData.max_occurrences })}
            </span>
          </div>
        </div>
      </Card>

      {/* Preview */}
      <div>
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">
          {t('recurring.preview.title')}
        </h3>
        
        <div className="space-y-2">
          {upcomingTransactions.map((transaction, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {transaction.description}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {dateHelpers.format(transaction.date, 'MMM DD, YYYY')}
                </p>
              </div>
              
              <Badge variant={transaction.type === 'income' ? 'success' : 'destructive'}>
                {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
              </Badge>
            </div>
          ))}
          
          {upcomingTransactions.length === 5 && formData.end_type !== 'occurrences' && (
            <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-2">
              {t('recurring.preview.moreTransactions')}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'create' ? t('recurring.create.title') : t('recurring.edit.title')}
      maxWidth="lg"
    >
      <div style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
        {/* Step indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((stepNumber) => (
              <div
                key={stepNumber}
                className={cn(
                  "flex items-center",
                  stepNumber < 3 && "flex-1"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  step >= stepNumber
                    ? "bg-primary-500 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                )}>
                  {stepNumber}
                </div>
                
                {stepNumber < 3 && (
                  <div className={cn(
                    "flex-1 h-1 mx-3",
                    step > stepNumber
                      ? "bg-primary-500"
                      : "bg-gray-200 dark:bg-gray-700"
                  )} />
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-between mt-2 text-xs text-gray-600 dark:text-gray-400">
            <span>{t('recurring.steps.basic')}</span>
            <span>{t('recurring.steps.schedule')}</span>
            <span>{t('recurring.steps.review')}</span>
          </div>
        </div>

        {/* Step content */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {step === 1 && renderBasicStep()}
          {step === 2 && renderScheduleStep()}
          {step === 3 && renderReviewStep()}
        </motion.div>

        {/* Actions */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div>
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={isSubmitting}
              >
                {t('actions.previous')}
              </Button>
            )}
          </div>
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              {t('actions.cancel')}
            </Button>
            
            {step < 3 ? (
              <Button
                variant="primary"
                onClick={() => setStep(step + 1)}
                disabled={isSubmitting}
              >
                {t('actions.next')}
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleSubmit}
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                {mode === 'create' ? t('actions.create') : t('actions.update')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default RecurringModal;