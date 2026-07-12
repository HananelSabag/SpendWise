/** Income, expenses, and net for the selected calendar month. */

import React from 'react';
import { CalendarRange } from 'lucide-react';

import { cn } from '../../../utils/helpers';
import { formatFinancialPeriod } from '../../../utils/financialPeriod';
import PeriodCountingPopover from './PeriodCountingPopover';

export default function PeriodSummary({ dashboardData, formatCurrency, t, language = 'en' }) {
  const { summary, period, selectedAccounting } = dashboardData;
  const net = summary.net_balance;
  const range = formatFinancialPeriod(period, language);

  return (
    <section className="glass-card rounded-2xl p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            {period?.isCurrent
              ? t('period.title', { fallback: 'This calendar month' })
              : t('period.selectedTitle', { fallback: 'Selected calendar month' })}
          </h3>
          {/* The selected calendar-month window is always spelled out. */}
          <span className="mt-1 flex flex-wrap items-center gap-1.5">
            {range && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                <CalendarRange className="h-3 w-3" />
                {range}
              </span>
            )}
            {period?.isCurrent && (
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                {t('period.soFar', { fallback: 'so far' })}
              </span>
            )}
          </span>
          <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
            {period?.isCurrent
              ? t('period.runningHint', { fallback: 'Calendar-month activity through today' })
              : t('period.cashFlowHint', { fallback: 'Income and committed spending for this calendar month' })}
          </p>
        </div>
        <PeriodCountingPopover accounting={selectedAccounting} formatCurrency={formatCurrency} t={t} />
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
