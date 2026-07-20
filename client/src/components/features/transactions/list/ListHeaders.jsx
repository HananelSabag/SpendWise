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

  // Quiet glass bar — the month NET is the only colored element.
  // Sticky on desktop only: on mobile the search/filter block is already
  // sticky at top-0, and a second top-0 sticky bar fights it for the same
  // pixels.
  return (
    <div className="glass-card flex items-center justify-between gap-3 px-4 py-2.5 mb-3 rounded-xl lg:sticky lg:top-0 z-10">
      <div className="flex items-center gap-2 min-w-0">
        <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate">{title}</span>
      </div>
      <div className="flex items-center gap-2 text-xs tabular-nums shrink-0">
        <span className="text-gray-400 dark:text-gray-500 hidden sm:inline">
          {totalIncome > 0 && `+${formatCurrency(totalIncome)}`}
          {totalIncome > 0 && totalExpenses > 0 && ' / '}
          {totalExpenses > 0 && `−${formatCurrency(totalExpenses)}`}
        </span>
        <span className={cn('font-semibold',
          net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400')}>
          {net < 0 ? '−' : '+'}{formatCurrency(Math.abs(net))}
        </span>
      </div>
    </div>
  );
};

export const DayHeader = ({ title, totalIncome, totalExpenses }) => {
  const { formatCurrency } = useCurrency();
  const net = totalIncome - totalExpenses;

  // Barely-there divider: label + net, no card chrome at all.
  return (
    <div className="flex items-center justify-between gap-2 px-1 pt-2 pb-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">{title}</span>
      <span className={cn('text-[11px] font-semibold tabular-nums',
        net >= 0 ? 'text-emerald-600/80 dark:text-emerald-400/80' : 'text-red-500/80 dark:text-red-400/80')}>
        {net < 0 ? '−' : '+'}{formatCurrency(Math.abs(net))}
      </span>
    </div>
  );
};
