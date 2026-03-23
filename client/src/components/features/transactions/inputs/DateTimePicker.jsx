/**
 * 📅 DATE TIME PICKER — Clean, compact date + time inputs
 */

import React, { useCallback, useMemo } from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { useTranslation } from '../../../../stores';
import { cn } from '../../../../utils/helpers';

const DateTimePicker = ({
  date = '',
  time = '',
  onDateChange,
  onTimeChange,
  error = null,
  required = false,
  disabled = false,
  showTime = true,
  className = '',
  // ignored legacy props
  showPresets,
  collapsed,
}) => {
  const { t } = useTranslation('transactions');

  // Human-readable date label
  const dateLabel = useMemo(() => {
    if (!date) return '';
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (date === today) return t('datePicker.today', 'Today');
    if (date === yesterday) return t('datePicker.yesterday', 'Yesterday');
    return new Date(date).toLocaleDateString();
  }, [date, t]);

  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {t('fields.date.label', 'Date')}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      <div className={cn('flex gap-2', showTime ? 'flex-row' : '')}>
        {/* Date input */}
        <div className="relative flex-1">
          <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="date"
            value={date}
            onChange={e => onDateChange?.(e.target.value)}
            disabled={disabled}
            className={cn(
              'w-full h-11 pl-9 pr-3 rounded-xl border text-sm font-medium transition-all outline-none',
              'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
              'focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 dark:focus:border-blue-500',
              error
                ? 'border-red-300 dark:border-red-600'
                : 'border-gray-200 dark:border-gray-700',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          />
        </div>

        {/* Time input */}
        {showTime && (
          <div className="relative w-28">
            <Clock className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="time"
              value={time}
              onChange={e => onTimeChange?.(e.target.value)}
              disabled={disabled}
              className={cn(
                'w-full h-11 pl-8 pr-2 rounded-xl border text-sm font-medium transition-all outline-none',
                'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
                'focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 dark:focus:border-blue-500',
                'border-gray-200 dark:border-gray-700',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            />
          </div>
        )}
      </div>

      {/* Quick date chips */}
      <div className="flex gap-1.5">
        {[
          { label: t('datePicker.today', 'Today'), value: new Date().toISOString().split('T')[0] },
          { label: t('datePicker.yesterday', 'Yesterday'), value: new Date(Date.now() - 86400000).toISOString().split('T')[0] },
        ].map(chip => (
          <button
            key={chip.label}
            type="button"
            onClick={() => onDateChange?.(chip.value)}
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors',
              date === chip.value
                ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500">
          <AlertCircle className="w-3.5 h-3.5" />{error}
        </p>
      )}
    </div>
  );
};

export default DateTimePicker;
