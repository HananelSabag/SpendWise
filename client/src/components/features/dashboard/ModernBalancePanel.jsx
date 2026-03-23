/**
 * ModernBalancePanel — balance overview with period tabs.
 * Shows net balance (large), income and expenses.
 * Clean design, mobile-first. No unnecessary animations.
 */

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useTranslation, useCurrency } from '../../../stores';
import { useBalance } from '../../../hooks';
import { cn } from '../../../utils/helpers';

const PERIODS = ['daily', 'weekly', 'monthly', 'yearly'];

const SkeletonBox = ({ className }) => (
  <div className={cn('animate-pulse bg-white/20 rounded-xl', className)} />
);

const ModernBalancePanel = ({ className = '' }) => {
  const { t } = useTranslation('dashboard');
  const { formatCurrency } = useCurrency();
  const { data, loading, error } = useBalance({ autoRefresh: true });

  const [period, setPeriod] = useState('monthly');

  const periodData = data?.[period] || { income: 0, expenses: 0, total: 0 };
  const net = periodData.total ?? (periodData.income - Math.abs(periodData.expenses));
  const isPositive = net >= 0;

  // Loading skeleton
  if (loading && !data) {
    return (
      <div className={cn('rounded-2xl overflow-hidden shadow-lg', className)}>
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-5">
          <SkeletonBox className="h-3 w-28 mb-3" />
          <SkeletonBox className="h-9 w-44 mb-5" />
          <div className="flex gap-1">
            {PERIODS.map(p => <SkeletonBox key={p} className="flex-1 h-8" />)}
          </div>
        </div>
        <div className="grid grid-cols-2 bg-white dark:bg-gray-800">
          <div className="p-4"><SkeletonBox className="!bg-gray-100 dark:!bg-gray-700 h-12 w-full" /></div>
          <div className="p-4"><SkeletonBox className="!bg-gray-100 dark:!bg-gray-700 h-12 w-full" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-2xl overflow-hidden shadow-lg', className)}>
      {/* Gradient header */}
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-5 text-white">
        {/* Title */}
        <div className="flex items-center gap-2 opacity-90 mb-1">
          <Wallet className="w-4 h-4" />
          <span className="text-sm font-medium">{t('balance.title')}</span>
        </div>

        {/* Net amount */}
        <div className="mb-4 mt-1">
          <div className={cn('text-3xl font-bold tracking-tight', !isPositive && 'text-red-200')}>
            {error && !data ? '—' : formatCurrency(Math.abs(net))}
          </div>
          {!error && (
            <p className="text-xs mt-0.5 opacity-75">
              {isPositive ? '↑' : '↓'} {t(isPositive ? 'stats.positive' : 'stats.negative')}
            </p>
          )}
        </div>

        {/* Period tabs */}
        <div className="flex gap-1 bg-white/10 rounded-xl p-1">
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'flex-1 py-1.5 rounded-lg text-xs font-medium transition-all',
                period === p
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              )}
            >
              {t(`periods.${p}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Income / Expenses */}
      <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
        <div className="p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
              <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">{t('balance.income')}</span>
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {formatCurrency(periodData.income || 0)}
          </span>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
              <TrendingDown className="w-3 h-3 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">{t('balance.expenses')}</span>
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {formatCurrency(Math.abs(periodData.expenses || 0))}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ModernBalancePanel;
