/**
 * 🔄 TRANSACTION TYPE TOGGLE — Animated expense/income switcher
 */

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { useTranslation } from '../../../../stores';
import { cn } from '../../../../utils/helpers';
import { TRANSACTION_TYPES } from '../forms/TransactionHelpers';

const TransactionTypeToggle = ({
  value = TRANSACTION_TYPES.EXPENSE,
  onChange,
  error = null,
  disabled = false,
  className = '',
}) => {
  const { t } = useTranslation('transactions');
  const isExpense = value === TRANSACTION_TYPES.EXPENSE;

  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {t('fields.type.label', 'Type')}
      </label>

      <div
        className={cn(
          'relative flex h-11 items-center overflow-hidden rounded-xl border',
          'bg-gray-50 dark:bg-gray-800/80',
          error
            ? 'border-red-300 dark:border-red-600'
            : 'border-gray-200 dark:border-gray-700',
          disabled && 'cursor-not-allowed opacity-50'
        )}
        style={{ direction: 'ltr' }}
      >
        {/* Animated background pill */}
        <motion.div
          layout
          className={cn(
            'absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg shadow-sm',
            isExpense ? 'bg-red-500' : 'bg-emerald-500'
          )}
          animate={{ x: isExpense ? 4 : 'calc(100% + 4px)' }}
          transition={{ type: 'spring', stiffness: 500, damping: 38, mass: 0.8 }}
        />

        {/* Expense */}
        <button
          type="button"
          onClick={() => !disabled && onChange?.(TRANSACTION_TYPES.EXPENSE)}
          className={cn(
            'relative z-10 flex flex-1 items-center justify-center gap-1.5',
            'text-sm font-semibold transition-colors duration-150',
            isExpense ? 'text-white' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
          )}
        >
          <TrendingDown className="w-4 h-4" />
          {t('types.expense', 'Expense')}
        </button>

        {/* Income */}
        <button
          type="button"
          onClick={() => !disabled && onChange?.(TRANSACTION_TYPES.INCOME)}
          className={cn(
            'relative z-10 flex flex-1 items-center justify-center gap-1.5',
            'text-sm font-semibold transition-colors duration-150',
            !isExpense ? 'text-white' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
          )}
        >
          <TrendingUp className="w-4 h-4" />
          {t('types.income', 'Income')}
        </button>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default TransactionTypeToggle;
