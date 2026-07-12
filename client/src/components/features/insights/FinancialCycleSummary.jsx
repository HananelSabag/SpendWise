import React from 'react';
import { CalendarRange, ChevronDown, TrendingDown, TrendingUp, Wallet } from 'lucide-react';

import { cn } from '../../../utils/helpers';
import { useTranslation } from '../../../stores';

function Metric({ icon: Icon, label, value, tone, formatCurrency }) {
  const displayValue = value == null ? '—' : `${value < 0 ? '−' : ''}${formatCurrency(Math.abs(value))}`;
  return (
    <div className="rounded-2xl bg-gray-50 p-3 dark:bg-gray-800/70">
      <p className="flex items-center gap-1 text-[11px] font-medium text-gray-500"><Icon className="h-3.5 w-3.5" />{label}</p>
      <p className={cn('mt-1 text-lg font-black tabular-nums', tone)}>{displayValue}</p>
    </div>
  );
}

export default function FinancialCycleSummary({ cycle, formatCurrency }) {
  const { t } = useTranslation('dashboard');
  if (!cycle) return null;
  const net = cycle.money?.netIncludingSalaryCommitted || 0;
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-black text-gray-950 dark:text-white">{t('cycleDashboard.summaryTitle')}</h2>
          <p className="mt-1 flex items-center gap-1 text-xs text-gray-500"><CalendarRange className="h-3.5 w-3.5" />{cycle.cycleStart} — {cycle.lastDay}</p>
        </div>
        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-300">{cycle.daysElapsed} {t('cycleDashboard.days')}</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric icon={TrendingUp} label={t('cycleDashboard.totalIncome')} value={cycle.money?.totalIncome} tone="text-emerald-600" formatCurrency={formatCurrency} />
        <Metric icon={TrendingDown} label={t('cycleDashboard.totalExpenses')} value={cycle.money?.spentCommitted} tone="text-rose-600" formatCurrency={formatCurrency} />
        <Metric icon={Wallet} label={t('cycleDashboard.cycleNet')} value={net} tone={net >= 0 ? 'text-emerald-600' : 'text-rose-600'} formatCurrency={formatCurrency} />
        <Metric icon={Wallet} label={t('cycleDashboard.currentBalance')} value={cycle.checkingBalance} tone="text-indigo-600" formatCurrency={formatCurrency} />
      </div>
      <details className="group mt-3 border-t border-gray-100 pt-3 text-xs dark:border-gray-800">
        <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-gray-500">{t('cycleDashboard.howCalculated')}<ChevronDown className="h-4 w-4 transition group-open:rotate-180" /></summary>
        <p className="mt-2 rounded-xl bg-gray-50 p-3 leading-5 text-gray-500 dark:bg-gray-800/60">{t('cycleDashboard.summaryExplanation')}</p>
      </details>
    </section>
  );
}
