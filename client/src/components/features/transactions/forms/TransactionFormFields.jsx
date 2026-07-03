/**
 * 📝 TRANSACTION FORM FIELDS — one-time manual income/expense entry
 */

import React, { useCallback } from 'react';
import { AlertCircle } from 'lucide-react';

import { useTranslation } from '../../../../stores';
import AmountInput      from '../inputs/AmountInput';
import DateTimePicker   from '../inputs/DateTimePicker';
import TransactionTypeToggle from '../inputs/TransactionTypeToggle';
import NotesInput       from '../inputs/NotesInput';

import { getFieldError } from './TransactionValidation';
import { cn } from '../../../../utils/helpers';

const TransactionFormFields = ({
  formData,
  validationErrors = {},
  onFieldChange,
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

      {/* Date */}
      <DateTimePicker
        date={formData.date}
        time={formData.time}
        onDateChange={(v) => set('date', v)}
        onTimeChange={(v) => set('time', v)}
        error={getFieldError('date', validationErrors)}
        required
      />

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
