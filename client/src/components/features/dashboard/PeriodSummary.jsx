/** Income, expenses, and net for the selected billing-cycle window. */

import React from 'react';

import { cn } from '../../../utils/helpers';
import PeriodCountingPopover from './PeriodCountingPopover';

export default function PeriodSummary({ dashboardData, formatCurrency, t }) {
  const { summary, period } = dashboardData;
  const net = summary.net_balance;

  return (
    <section className="glass-card rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            {period?.isCurrent
              ? t('period.title', { fallback: 'This financial period' })
              : t('period.selectedTitle', { fallback: 'Selected financial period' })}
          </h3>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            {t('period.cashFlowHint', { fallback: 'What came in and went out inside this cycle window' })}
          </p>
        </div>
        <PeriodCountingPopover summary={summary} formatCurrency={formatCurrency} t={t} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {t('period.income', { fallback: 'Income' })}
          </p>
          <p className="text-base font-bold text-emerald-600 tabular-nums dark:text-emerald-400">
            {formatCurrency(summary.total_income)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {t('period.expenses', { fallback: 'Expenses' })}
          </p>
          <p className="text-base font-bold text-red-500 tabular-nums dark:text-red-400">
            {formatCurrency(summary.total_expenses)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {t('period.net', { fallback: 'Net' })}
          </p>
          <p
            className={cn(
              'text-base font-bold tabular-nums',
              net >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-500 dark:text-red-400',
            )}
          >
            {net < 0 && '−'}
            {formatCurrency(Math.abs(net))}
          </p>
        </div>
      </div>
    </section>
  );
}
