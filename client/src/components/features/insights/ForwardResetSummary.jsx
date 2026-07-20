/**
 * The dated timeline of what still has to happen before the cycle closes.
 *
 * The headline forward numbers (expected in, cards to leave, the resulting balance) already live
 * in the balance strip at the top of the page, so this is deliberately just the schedule — when
 * each salary, card bill and fixed debit lands — and nothing else, to avoid saying the same thing
 * twice inches apart.
 */

import React from 'react';
import { ArrowDown, CreditCard, Landmark } from 'lucide-react';

import { cn } from '../../../utils/helpers';
import { formatCycleDay } from '../../../utils/cycleDate';
import { signedCurrency } from '../../../utils/cycleFormat';

function StageIcon({ kind }) {
  if (kind === 'income') return <ArrowDown className="h-3.5 w-3.5 shrink-0 text-emerald-500" />;
  if (kind === 'card') return <CreditCard className="h-3.5 w-3.5 shrink-0 text-rose-500" />;
  return <Landmark className="h-3.5 w-3.5 shrink-0 text-amber-500" />;
}

export default function ForwardResetSummary({ forwardReset, useEstimate = true, formatCurrency, t, language = 'en' }) {
  const stages = forwardReset?.stages || [];
  if (!stages.length) return null;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <p className="mb-3 text-xs font-bold text-gray-900 dark:text-white">
        {t('cycle.forward.timeline', { fallback: "What's still to happen" })}
      </p>
      <div className="space-y-2.5">
        {stages.map((stage, index) => {
          // Fixed debits and known card purchases stay in every forecast.  Only uncertain future
          // income and possible card-bill growth belong to the estimate preference.
          const displayedAmount = !useEstimate && stage.kind === 'income'
            ? 0
            : (stage.kind === 'card' && useEstimate ? stage.estimatedAmount : stage.amount);
          return (
            <div key={`${stage.kind}-${stage.date}-${stage.label}-${index}`} className="flex items-center gap-2.5 text-[11px]">
              <StageIcon kind={stage.kind} />
              <span className="w-14 shrink-0 font-semibold text-gray-500 dark:text-gray-400">{formatCycleDay(stage.date, language)}</span>
              <span className="min-w-0 flex-1 truncate font-medium text-gray-700 dark:text-gray-300">
                {stage.label || t(`cycle.forward.stage.${stage.kind}`, { fallback: stage.kind })}
              </span>
              {stage.primary === false && (
                <span className="shrink-0 rounded bg-violet-100 px-1.5 py-0.5 text-[9px] font-black text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                  {t('cycle.forward.additional', { fallback: 'Additional' })}
                </span>
              )}
              {stage.certainty && (
                <span className="shrink-0 text-[9px] font-semibold text-gray-400">
                  {t(`cycle.forward.certainty.${stage.certainty}`, { fallback: stage.certainty === 'known' || stage.certainty === 'proven' ? 'known' : 'estimate' })}
                </span>
              )}
              <span className={cn('shrink-0 font-black tabular-nums', Number(displayedAmount) < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400')}>
                {signedCurrency(displayedAmount, formatCurrency, { signPositive: true })}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
