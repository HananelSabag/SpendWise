/**
 * 📝 TRANSACTION FORM FIELDS — shared between Add / Edit / Recurring
 */

import React, { useCallback } from 'react';
import { Repeat, AlertCircle } from 'lucide-react';

import { useTranslation } from '../../../../stores';
import AmountInput      from '../inputs/AmountInput';
import CategorySelector from '../inputs/CategorySelector';
import DateTimePicker   from '../inputs/DateTimePicker';
import TransactionTypeToggle from '../inputs/TransactionTypeToggle';
import NotesInput       from '../inputs/NotesInput';

import { Switch } from '../../../ui';
import { getFieldError } from './TransactionValidation';
import { cn } from '../../../../utils/helpers';

const TransactionFormFields = ({
  formData,
  validationErrors = {},
  onFieldChange,
  showRecurring = true,
  showAdvanced  = true,
  className     = '',
}) => {
  const { t, isRTL } = useTranslation('transactions');

  const set = useCallback((field, value) => onFieldChange?.(field, value), [onFieldChange]);

  return (
    <div className={cn('space-y-4', className)} style={{ direction: isRTL ? 'rtl' : 'ltr' }}>

      {/* Type + Amount */}
      <div className="grid gap-3 md:grid-cols-2">
        <TransactionTypeToggle
          value={formData.type}
          onChange={(v) => set('type', v)}
          error={getFieldError('type', validationErrors)}
        />
        <AmountInput
          value={formData.amount}
          onChange={(v) => set('amount', v)}
          type={formData.type}
          error={getFieldError('amount', validationErrors)}
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {t('fields.description.label', 'Description')}
          <span className="text-red-500 ml-0.5">*</span>
        </label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => set('description', e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
          placeholder={t('fields.description.placeholder', 'What was this for?')}
          className={cn(
            'w-full h-11 px-3 rounded-xl border text-sm transition-all outline-none',
            'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
            'placeholder-gray-400 dark:placeholder-gray-500',
            'focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 dark:focus:border-blue-500',
            getFieldError('description', validationErrors)
              ? 'border-red-300 dark:border-red-600'
              : 'border-gray-200 dark:border-gray-700'
          )}
        />
        {getFieldError('description', validationErrors) && (
          <p className="flex items-center gap-1 text-xs text-red-500">
            <AlertCircle className="w-3.5 h-3.5" />
            {getFieldError('description', validationErrors)}
          </p>
        )}
      </div>

      {/* Category + Date */}
      <div className="grid gap-3 md:grid-cols-2">
        <CategorySelector
          value={formData.categoryId}
          onChange={(v) => set('categoryId', v)}
          transactionType={formData.type}
          error={getFieldError('categoryId', validationErrors)}
          required
        />
        <DateTimePicker
          date={formData.date}
          time={formData.time}
          onDateChange={(v) => set('date', v)}
          onTimeChange={(v) => set('time', v)}
          error={getFieldError('date', validationErrors)}
          required
        />
      </div>

      {/* Recurring */}
      {showRecurring && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Repeat className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {t('fields.recurring.title', 'Recurring')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('fields.recurring.description', 'Repeat this transaction automatically')}
                </p>
              </div>
            </div>
            <Switch
              checked={formData.isRecurring}
              onCheckedChange={(v) => set('isRecurring', v)}
            />
          </div>

          {formData.isRecurring && (
            <div className="px-3 pb-3 border-t border-gray-100 dark:border-gray-700 pt-3">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
                {t('fields.recurring.frequency', 'Frequency')}
              </label>
              <select
                value={formData.recurringFrequency}
                onChange={(e) => set('recurringFrequency', e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
              >
                <option value="daily">{t('frequencies.daily', 'Daily')}</option>
                <option value="weekly">{t('frequencies.weekly', 'Weekly')}</option>
                <option value="monthly">{t('frequencies.monthly', 'Monthly')}</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {showAdvanced && (
        <NotesInput
          value={formData.notes}
          onChange={(v) => set('notes', v)}
        />
      )}
    </div>
  );
};

export default TransactionFormFields;
