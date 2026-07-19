import React from 'react';
import { ArrowDown, ArrowUp, Flame, Gauge, Trophy } from 'lucide-react';

import { cn } from '../../../utils/helpers';
import { formatCycleDay } from '../../../utils/cycleDate';

function DailyFigure({ label, value, tone, formatCurrency }) {
  return (
    <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/60">
      <p className="text-[9px] font-bold text-gray-400">{label}</p>
      <p className={cn('mt-1 text-lg font-black tabular-nums', tone)}>{formatCurrency(value)}</p>
    </div>
  );
}

function PeakRow({ icon, label, day, formatCurrency, language, tone }) {
  if (!day) return null;
  return (
    <div className="flex items-center gap-2 rounded-xl border border-gray-100 px-3 py-2 dark:border-gray-800">
      {icon}
      <span className="min-w-0 flex-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400">
        {label} · {formatCycleDay(day.date, language)}
      </span>
      <span className={cn('shrink-0 text-xs font-black tabular-nums', tone)}>{formatCurrency(Math.abs(day.amount))}</span>
    </div>
  );
}

export default function ClosedCycleInsights({ insights, formatCurrency, t, language = 'en' }) {
  if (!insights) return null;
  const dailyGap = insights.averageIncomePerDay - insights.averageExpensePerDay;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start gap-2">
        <Gauge className="mt-0.5 h-4 w-4 text-indigo-500" />
        <div>
          <h2 className="text-sm font-black text-gray-950 dark:text-white">{t('cycle.closed.title', { fallback: 'What each day cost you' })}</h2>
          <p className="text-[10px] text-gray-500">{t('cycle.closed.subtitle', { days: insights.calendarDays, fallback: `Daily average across ${insights.calendarDays} calendar days` })}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <DailyFigure label={t('cycle.closed.earnedDay', { fallback: 'Earned / day' })} value={insights.averageIncomePerDay} tone="text-emerald-600 dark:text-emerald-400" formatCurrency={formatCurrency} />
        <DailyFigure label={t('cycle.closed.spentDay', { fallback: 'Spent / day' })} value={insights.averageExpensePerDay} tone="text-rose-600 dark:text-rose-400" formatCurrency={formatCurrency} />
        <DailyFigure label={t('cycle.closed.netDay', { fallback: 'Net / day' })} value={insights.averageNetPerDay} tone={insights.averageNetPerDay < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'} formatCurrency={formatCurrency} />
      </div>

      <div className={cn('mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-bold', dailyGap < 0 ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/25 dark:text-rose-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/25 dark:text-emerald-300')}>
        {dailyGap < 0 ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
        {dailyGap < 0
          ? t('cycle.closed.shockSpent', { amount: formatCurrency(Math.abs(dailyGap)), fallback: `On average, you spent ${formatCurrency(Math.abs(dailyGap))} more than you earned every day.` })
          : t('cycle.closed.shockSaved', { amount: formatCurrency(dailyGap), fallback: `On average, you kept ${formatCurrency(dailyGap)} per day.` })}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <PeakRow icon={<Flame className="h-4 w-4 text-rose-500" />} label={t('cycle.closed.peakExpense', { fallback: 'Biggest spending day' })} day={insights.peakExpenseDay} formatCurrency={formatCurrency} language={language} tone="text-rose-600" />
        <PeakRow icon={<Trophy className="h-4 w-4 text-emerald-500" />} label={t('cycle.closed.peakIncome', { fallback: 'Biggest income day' })} day={insights.peakIncomeDay} formatCurrency={formatCurrency} language={language} tone="text-emerald-600" />
      </div>
    </section>
  );
}
