import React from 'react';
import { ArrowDownLeft, ArrowUpRight, CalendarDays, CreditCard, Landmark } from 'lucide-react';
import { getCycleUpcoming } from '../../../utils/cycleProjection';
import { formatCycleDay } from '../../../utils/cycleDate';
import { cn } from '../../../utils/helpers';
import { CycleMoney, cycleSurface } from './CyclePrimitives';

export default function CycleKnownExpensesPanelV2({
  cycle,
  useEstimates = true,
  formatCurrency,
  language,
  t,
}) {
  const rows = getCycleUpcoming(cycle?.forwardReset, useEstimates);
  const groups = new Map();
  rows.forEach((row) => {
    const date = row.date || '';
    if (!groups.has(date)) groups.set(date, []);
    groups.get(date).push(row);
  });
  return (
    <section className={cn(cycleSurface, 'p-4 sm:p-6')}>
      <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950 dark:text-white">
        <CalendarDays className="h-5 w-5 text-indigo-500" />
        {t('cycleV2.upcomingTitle')}
      </h2>
      <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
        {t(useEstimates ? 'cycleV2.upcomingForecastHint' : 'cycleV2.upcomingKnownHint')}
      </p>
      <div className="mt-5 space-y-5">
        {[...groups].map(([date, items]) => (
          <div key={date}>
            <p className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {formatCycleDay(date, language)}
            </p>
            <div className="divide-y divide-slate-100 border-s-2 border-indigo-100 ps-3 dark:divide-slate-800 dark:border-indigo-900 sm:ps-4">
              {items.map((item) => {
                const income = item.amount > 0;
                const Icon = income
                  ? ArrowDownLeft
                  : item.kind === 'card'
                    ? CreditCard
                    : item.kind === 'loan'
                      ? Landmark
                      : ArrowUpRight;
                const late = item.status === 'late';
                return (
                  <div key={item.key} className="flex items-start gap-3 py-3">
                    <Icon
                      className={cn(
                        'mt-0.5 h-4 w-4 shrink-0',
                        income ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400',
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-medium text-slate-900 dark:text-white">
                        {item.label || t('cycleV2.cardRecurringExtra')}
                        {item.growth && (
                          <span className="ms-1 text-xs text-slate-500">
                            · {t('cycleV2.forecastExtra')}
                          </span>
                        )}
                      </p>
                      <p
                        className={cn(
                          'mt-1 text-xs leading-5',
                          late
                            ? 'text-amber-700 dark:text-amber-300'
                            : 'text-slate-500 dark:text-slate-400',
                        )}
                      >
                        {late
                          ? t('cycleV2.incomeNotSeen')
                          : t(
                              item.estimated
                                ? 'cycleV2.estimateSource'
                                : item.kind === 'card'
                                  ? 'cycleV2.cardSource'
                                  : 'cycleV2.fixedSource',
                            )}
                      </p>
                    </div>
                    <CycleMoney
                      value={item.amount}
                      formatCurrency={formatCurrency}
                      signed
                      className={cn(
                        'shrink-0 text-sm',
                        income
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-slate-900 dark:text-white',
                      )}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {!rows.length && (
        <p className="mt-4 rounded-2xl bg-slate-50 p-5 text-sm text-slate-500 dark:bg-slate-950/50 dark:text-slate-400">
          {t('cycleV2.noUpcoming')}
        </p>
      )}
    </section>
  );
}
