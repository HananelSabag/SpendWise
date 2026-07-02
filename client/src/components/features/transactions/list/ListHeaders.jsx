/**
 * MonthHeader / DayHeader — sticky group headers in the grouped
 * transaction list, each showing income / expense / net for the group.
 * Extracted from ModernTransactions.jsx.
 */

import React from 'react';
import { Calendar } from 'lucide-react';

import { useCurrency } from '../../../../stores';
import { cn } from '../../../../utils/helpers';

export const MonthHeader = ({ title, totalIncome, totalExpenses }) => {
  const { formatCurrency } = useCurrency();
  const net = totalIncome - totalExpenses;

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 mb-3 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800 sticky top-0 z-20 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-indigo-500" />
        <span className="font-bold text-gray-900 dark:text-white text-sm">{title}</span>
      </div>
      <div className="flex items-center gap-2 text-xs font-semibold">
        {totalIncome > 0 && <span className="text-green-600 dark:text-green-400">+{formatCurrency(totalIncome)}</span>}
        {totalExpenses > 0 && <span className="text-red-600 dark:text-red-400">-{formatCurrency(totalExpenses)}</span>}
        <span className={cn('pl-2 border-l border-gray-300 dark:border-gray-600',
          net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
          {net >= 0 ? '+' : ''}{formatCurrency(net)}
        </span>
      </div>
    </div>
  );
};

export const DayHeader = ({ title, totalIncome, totalExpenses }) => {
  const { formatCurrency } = useCurrency();
  const net = totalIncome - totalExpenses;

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 mb-2 bg-gray-50 dark:bg-gray-800/60 rounded-lg border border-gray-200 dark:border-gray-700 sticky top-12 z-10">
      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{title}</span>
      <div className="flex items-center gap-2 text-xs">
        {totalIncome > 0 && <span className="text-green-600 dark:text-green-400">+{formatCurrency(totalIncome)}</span>}
        {totalExpenses > 0 && <span className="text-red-600 dark:text-red-400">-{formatCurrency(totalExpenses)}</span>}
        <span className={cn('pl-1.5 border-l border-gray-300 dark:border-gray-600 font-semibold',
          net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
          {net >= 0 ? '+' : ''}{formatCurrency(net)}
        </span>
      </div>
    </div>
  );
};
