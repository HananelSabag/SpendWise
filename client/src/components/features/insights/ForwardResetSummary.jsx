import React from 'react';
import { ArrowDown, ArrowUp, CalendarClock, CreditCard, Landmark } from 'lucide-react';

import { cn } from '../../../utils/helpers';
import { formatCycleDay } from '../../../utils/cycleDate';
import { signedCurrency } from '../../../utils/cycleFormat';

const signed = (value, formatCurrency) => signedCurrency(value, formatCurrency, { signPositive: true });

function StageIcon({ kind }) {
  if (kind === 'income') return <ArrowDown className="h-3.5 w-3.5 text-emerald-500" />;
  if (kind === 'card') return <CreditCard className="h-3.5 w-3.5 text-rose-500" />;
  return <Landmark className="h-3.5 w-3.5 text-amber-500" />;
}

export default function ForwardResetSummary({
  forwardReset,
  useEstimate = true,
  formatCurrency,
  t,
  language = 'en',
  compact = false,
}) {
  if (!forwardReset) return null;

  const cardOut = useEstimate ? forwardReset.estimatedCardOut : forwardReset.knownCardOut;
  const incoming = useEstimate ? forwardReset.expectedIncoming : 0;
  const fixedOut = useEstimate ? forwardReset.estimatedFixedOut : 0;
  const netChange = useEstimate ? forwardReset.estimatedNetChange : forwardReset.knownNetChange;
  const stages = compact ? forwardReset.stages?.slice(0, 4) : forwardReset.stages;

  return (
    <section className={cn('rounded-2xl border border-indigo-200 bg-gradient-to-br from-white to-indigo-50/70 dark:border-indigo-900/60 dark:from-gray-900 dark:to-indigo-950/20', compact ? 'p-3' : 'p-4')}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-black text-gray-950 dark:text-white">
            <CalendarClock className="h-4 w-4 text-indigo-500" />
            {t('cycle.forward.title', { fallback: 'Until the next reset' })}
          </p>
          <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
            {t('cycle.forward.subtitle', { fallback: 'Only money that still has to enter or leave from now.' })}
          </p>
        </div>
        <span className="rounded-full bg-indigo-100 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
          {useEstimate
            ? t('cycle.forward.estimated', { fallback: 'Estimated' })
            : t('cycle.forward.known', { fallback: 'Known only' })}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-white/80 p-2 dark:bg-gray-900/70">
          <p className="text-[9px] font-bold text-gray-400">{t('cycle.forward.incoming', { fallback: 'Expected in' })}</p>
          <p className="mt-0.5 text-xs font-black leading-tight tabular-nums sm:text-sm text-emerald-600 dark:text-emerald-400">{signed(incoming, formatCurrency)}</p>
        </div>
        <div className="rounded-xl bg-white/80 p-2 dark:bg-gray-900/70">
          <p className="text-[9px] font-bold text-gray-400">{t('cycle.forward.cardsOut', { fallback: 'Cards to leave' })}</p>
          <p className="mt-0.5 text-xs font-black leading-tight tabular-nums sm:text-sm text-rose-600 dark:text-rose-400">{signed(-cardOut, formatCurrency)}</p>
        </div>
        <div className="rounded-xl bg-white/80 p-2 dark:bg-gray-900/70">
          <p className="text-[9px] font-bold text-gray-400">{t('cycle.forward.net', { fallback: 'Reset effect' })}</p>
          <p className={cn('mt-0.5 text-xs font-black leading-tight tabular-nums sm:text-sm', netChange < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400')}>
            {signed(netChange, formatCurrency)}
          </p>
        </div>
      </div>

      {fixedOut > 0 && (
        <p className="mt-2 text-[10px] font-semibold text-gray-500 dark:text-gray-400">
          {t('cycle.forward.fixedOut', { fallback: 'Recurring charges still expected' })}: −{formatCurrency(fixedOut)}
        </p>
      )}

      {stages?.length > 0 && (
        <div className="mt-3 space-y-1.5 border-t border-indigo-100 pt-2.5 dark:border-indigo-900/50">
          {stages.map((stage, index) => {
            const displayedAmount = !useEstimate && stage.kind !== 'card'
              ? 0
              : (stage.kind === 'card' && useEstimate ? stage.estimatedAmount : stage.amount);
            return (
              <div key={`${stage.kind}-${stage.date}-${stage.label}-${index}`} className="flex items-center gap-2 text-[10px]">
                <StageIcon kind={stage.kind} />
                <span className="w-12 shrink-0 font-bold text-gray-500 dark:text-gray-400">{formatCycleDay(stage.date, language)}</span>
                <span className="min-w-0 flex-1 truncate font-semibold text-gray-700 dark:text-gray-300">{stage.label || t(`cycle.forward.stage.${stage.kind}`, { fallback: stage.kind })}</span>
                {stage.primary === false && (
                  <span className="rounded bg-violet-100 px-1 py-0.5 text-[8px] font-black text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                    {t('cycle.forward.additional', { fallback: 'Additional' })}
                  </span>
                )}
                <span className={cn('shrink-0 font-black tabular-nums', Number(displayedAmount) < 0 ? 'text-rose-600' : 'text-emerald-600')}>
                  {signed(displayedAmount, formatCurrency)}
                </span>
              </div>
            );
          })}
          {compact && forwardReset.stages.length > stages.length && (
            <p className="text-[9px] font-semibold text-indigo-600 dark:text-indigo-400">
              {t('cycle.forward.moreStages', { count: forwardReset.stages.length - stages.length, fallback: `+${forwardReset.stages.length - stages.length} more stages` })}
            </p>
          )}
        </div>
      )}

      <p className="mt-2 flex items-center gap-1 text-[9px] font-semibold text-gray-400">
        {netChange < 0 ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
        {t('cycle.forward.completes', {
          date: formatCycleDay(forwardReset.completionDate, language),
          fallback: `Reset completes around ${formatCycleDay(forwardReset.completionDate, language)}`,
        })}
      </p>
    </section>
  );
}
