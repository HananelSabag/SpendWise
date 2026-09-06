import React, { useId } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { cn } from '../../../utils/helpers';
import { signedCurrency } from '../../../utils/cycleFormat';

export const cycleSurface =
  'rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900';
export const cycleButton =
  'min-h-11 rounded-xl px-3 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-wait disabled:opacity-50';

export function CycleMoney({ value, formatCurrency, className, signed = false }) {
  return (
    <bdi
      dir="ltr"
      className={cn(
        'inline-block whitespace-nowrap font-semibold tabular-nums tracking-tight',
        className,
      )}
    >
      {Number.isFinite(value)
        ? signedCurrency(value, formatCurrency, { signPositive: signed })
        : '—'}
    </bdi>
  );
}

export function CycleScenarioControl({ useEstimates, onChange, isSaving, t }) {
  const helpId = useId();
  return (
    <div className="min-w-0 sm:min-w-[20rem]">
      <div
        className="flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-950"
        role="group"
        aria-label={t('cycleV2.scenarioLabel')}
        aria-describedby={helpId}
      >
        {[false, true].map((value) => {
          const selected = useEstimates === value;
          const Icon = value ? Sparkles : Check;
          return (
            <button
              key={String(value)}
              type="button"
              aria-pressed={selected}
              disabled={isSaving}
              onClick={() => !selected && onChange(value)}
              className={cn(
                cycleButton,
                'flex min-w-0 flex-1 items-center justify-center gap-1.5 px-2 text-xs sm:gap-2 sm:px-4 sm:text-sm',
                selected
                  ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-800 dark:text-indigo-300'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">
                {t(value ? 'cycleV2.scenarioForecast' : 'cycleV2.scenarioKnown')}
              </span>
            </button>
          );
        })}
      </div>
      <p id={helpId} className="sr-only">
        {t('cycleV2.scenarioHelp')}
      </p>
    </div>
  );
}

export function CycleEmpty({ title, hint, children }) {
  return (
    <div className={cn(cycleSurface, 'p-6 text-center sm:p-10')}>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
      {hint && (
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      )}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
