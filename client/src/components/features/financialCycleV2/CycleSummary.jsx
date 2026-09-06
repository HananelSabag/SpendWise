import React from 'react';
import { ArrowRight, CalendarDays, ChevronDown, Wallet } from 'lucide-react';
import { useBankBalance } from '../../../hooks/useBankBalance';
import { getCycleProjection } from '../../../utils/cycleProjection';
import { formatCycleDay } from '../../../utils/cycleDate';
import { formatCycleWindow } from '../../../utils/cycleFormat';
import { cn } from '../../../utils/helpers';
import { CycleMoney, CycleScenarioControl, cycleButton, cycleSurface } from './CyclePrimitives';

function CalculationRow({ label, value, formatCurrency, accent = false }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="min-w-0 text-sm text-slate-600 dark:text-slate-300">{label}</dt>
      <dd
        className={cn(
          'shrink-0 text-sm',
          accent && value > 0
            ? 'text-emerald-700 dark:text-emerald-400'
            : 'text-slate-900 dark:text-slate-100',
        )}
      >
        <CycleMoney value={value} formatCurrency={formatCurrency} signed />
      </dd>
    </div>
  );
}

/** The dashboard and detail page render the same scenario and equation. */
export default function CycleSummary({
  cycle,
  settings,
  formatCurrency,
  language,
  t,
  onEstimateChange,
  isSaving,
  onOpen,
  compact = false,
}) {
  const balance = useBankBalance();
  const projection = getCycleProjection(
    cycle?.forwardReset,
    balance.hasRealBalance ? Number(balance.totalRealBalance) : null,
  );
  const useEstimates = settings?.useEstimates !== false;
  const result = useEstimates ? projection.forecast : projection.afterKnown;
  const horizon = cycle?.forwardReset?.completionDate || cycle?.window?.end;
  const difference = projection.forecastExtraOut || projection.expectedIncome;

  return (
    <section
      className={cn(cycleSurface, 'overflow-hidden shadow-sm')}
      aria-label={t('cycleV2.positionTitle')}
    >
      <div className="flex flex-col gap-4 border-b border-slate-100 px-4 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-950 dark:text-white">
            {t('cycleV2.dashboardEyebrow')}
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            {formatCycleWindow(cycle.window, language)}
          </p>
        </div>
        {onEstimateChange && (
          <CycleScenarioControl
            useEstimates={useEstimates}
            onChange={onEstimateChange}
            isSaving={isSaving}
            t={t}
          />
        )}
      </div>
      <div className="grid lg:grid-cols-[1fr_1fr]">
        <div className="min-w-0 bg-indigo-50/50 p-5 dark:bg-indigo-950/20 sm:p-6">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {t(useEstimates ? 'cycleV2.balanceAfterForecast' : 'cycleV2.balanceAfterKnown')}
          </p>
          <div aria-live="polite" aria-atomic="true" className="mt-2">
            <CycleMoney
              value={result}
              formatCurrency={formatCurrency}
              className={cn(
                'max-w-full text-[clamp(1.75rem,7vw,3rem)] font-bold leading-tight',
                result < 0 ? 'text-rose-700 dark:text-rose-300' : 'text-slate-950 dark:text-white',
              )}
            />
          </div>
          <p className="mt-2 text-xs font-medium text-indigo-700 dark:text-indigo-300">
            {t('cycleV2.projectionThrough', { date: formatCycleDay(horizon, language) })}
          </p>
          <p className="mt-4 max-w-lg text-sm leading-6 text-slate-600 dark:text-slate-400">
            {t(useEstimates ? 'cycleV2.forecastScenarioHint' : 'cycleV2.knownScenarioHint')}
          </p>
          {balance.someBalancesUnavailable && (
            <p
              role="status"
              className="mt-3 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
            >
              {t('cycleV2.partialBalance')}
            </p>
          )}
          {!balance.hasRealBalance && (
            <p role="status" className="mt-3 text-sm text-amber-700 dark:text-amber-300">
              {t('cycleV2.balanceUnavailable')}
            </p>
          )}
          {useEstimates && !difference && (
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              {t('cycleV2.noForecastDifference')}
            </p>
          )}
        </div>
        <div className="min-w-0 px-5 py-4 sm:px-6">
          <p className="mb-1 flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Wallet className="h-4 w-4" />
            {t('cycleV2.calculationTitle')}
          </p>
          <dl className="divide-y divide-slate-100 dark:divide-slate-800">
            <CalculationRow
              label={t('cycleV2.balanceNow')}
              value={projection.now}
              formatCurrency={formatCurrency}
            />
            <CalculationRow
              label={t('cycleV2.cardsKnown')}
              value={-projection.knownCardOut}
              formatCurrency={formatCurrency}
            />
            <CalculationRow
              label={t('cycleV2.fixedOut')}
              value={-projection.knownFixedOut}
              formatCurrency={formatCurrency}
            />
            {useEstimates && (
              <CalculationRow
                label={t('cycleV2.expectedIncome')}
                value={projection.expectedIncome}
                formatCurrency={formatCurrency}
                accent
              />
            )}
            {useEstimates && (
              <CalculationRow
                label={t('cycleV2.estimateExtra')}
                value={-projection.forecastExtraOut}
                formatCurrency={formatCurrency}
              />
            )}
            <div className="flex items-center justify-between gap-3 pt-3">
              <dt className="text-sm font-semibold text-slate-900 dark:text-white">
                {t('cycleV2.resultBalance')}
              </dt>
              <dd>
                <CycleMoney
                  value={result}
                  formatCurrency={formatCurrency}
                  className="text-lg text-slate-950 dark:text-white"
                />
              </dd>
            </div>
          </dl>
          {!compact && (
            <details className="group mt-4 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-950/50">
              <summary className="flex min-h-6 cursor-pointer list-none items-center justify-between gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 [&::-webkit-details-marker]:hidden">
                {t('cycleV2.calculationExplain')}
                <ChevronDown className="h-4 w-4 shrink-0 transition group-open:rotate-180" />
              </summary>
              <div className="mt-3 space-y-2 text-xs leading-6 text-slate-500 dark:text-slate-400">
                <p>{t('cycleV2.calculationHint')}</p>
                <p>{t('cycleV2.knownSourceNote')}</p>
                <p>{t('cycleV2.forecastSourceNote')}</p>
              </div>
            </details>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-100 px-5 py-3 text-xs dark:border-slate-800 sm:px-6">
        <span className="font-medium text-slate-500 dark:text-slate-400">{t('cycleV2.soFar')}</span>
        <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          {t('cycleV2.received')}
          <CycleMoney
            value={Number(cycle.income?.total) || 0}
            formatCurrency={formatCurrency}
            className="text-emerald-700 dark:text-emerald-400"
          />
        </span>
        <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          {t('cycleV2.spent')}
          <CycleMoney
            value={Number(cycle.expenses?.total) || 0}
            formatCurrency={formatCurrency}
            className="text-slate-900 dark:text-white"
          />
        </span>
        {onOpen && (
          <button
            type="button"
            onClick={onOpen}
            className={cn(
              cycleButton,
              'ms-auto flex items-center gap-2 text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-950',
            )}
          >
            {t('cycleV2.openDetails')}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </button>
        )}
      </div>
    </section>
  );
}
