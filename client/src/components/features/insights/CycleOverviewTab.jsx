/**
 * The cycle at a glance: what you earned, what you spent, what you borrowed, and what the
 * account actually did — then the rows that built each of those.
 *
 * Deliberately word-light. Every figure gets a label of one or two words; the reasoning behind
 * it lives in an InfoHint, so the screen reads as numbers rather than paragraphs.
 */

import React from 'react';
import { AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';

import { cn } from '../../../utils/helpers';
import { formatCycleDay } from '../../../utils/cycleDate';
import { InfoHint } from '../../ui';
import CycleBreakdown from '../dashboard/CycleBreakdown';

function Figure({ label, value, tone = 'neutral', hint, hintTitle, formatCurrency, big = false }) {
  const tones = {
    positive: 'text-emerald-600 dark:text-emerald-400',
    negative: 'text-rose-600 dark:text-rose-400',
    violet: 'text-violet-600 dark:text-violet-300',
    neutral: 'text-gray-900 dark:text-white',
  };
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
      <p className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
        {label}
        {hint && <InfoHint title={hintTitle}>{hint}</InfoHint>}
      </p>
      <p className={cn('mt-1 tabular-nums', big ? 'text-2xl font-black' : 'text-lg font-bold', tones[tone])}>
        {formatCurrency(value)}
      </p>
    </div>
  );
}

export default function CycleOverviewTab({ cycle, salaryTracking, formatCurrency, t, language }) {
  if (!cycle) return null;
  const { income, expenses, operatingNet, financing, bankMovement, projection } = cycle;
  const deficit = operatingNet < 0;

  return (
    <div className="space-y-3">
      {salaryTracking?.status === 'late' && (
        <div className="flex items-center gap-2 rounded-2xl bg-amber-50 px-3 py-2 dark:bg-amber-900/20">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
            {t('cycle.salaryLate', { fallback: 'Your salary has not come in yet — keep an eye on it.' })}
          </p>
        </div>
      )}

      {/* An incomplete cycle understates what moved — say so, never let it read as a real number. */}
      {cycle.partials?.length > 0 && (
        <div className="flex items-start gap-2 rounded-2xl border border-orange-200 bg-orange-50/70 px-3 py-2 dark:border-orange-900/50 dark:bg-orange-950/20">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-600 dark:text-orange-400" />
          <div>
            <p className="text-xs font-bold text-orange-900 dark:text-orange-200">
              {t('cycle.partialTitle', { fallback: 'This cycle is incomplete' })}
            </p>
            <p className="mt-0.5 text-[11px] leading-tight text-orange-800/80 dark:text-orange-200/70">
              {t('cycle.partialHint', { fallback: 'An older card statement from before your synced history is missing, so these figures understate what really moved.' })}
            </p>
          </div>
        </div>
      )}

      {/* The number to feel, alone and dominant. */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <p className="flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
          {t('cycle.operatingNet', { fallback: 'Net — how you are living' })}
          <InfoHint title={t('cycle.operatingNet', { fallback: 'Net' })}>
            {t('cycle.netHint', { fallback: 'Income minus spending. Borrowed money is not income, so it is kept out of this number — it appears on its own line.' })}
          </InfoHint>
        </p>
        <p className={cn('mt-1 text-3xl font-black tabular-nums', deficit ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400')}>
          {formatCurrency(operatingNet)}
        </p>
        <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
          {deficit
            ? t('cycle.deficitHint', { fallback: 'You are spending more than you earn' })
            : t('cycle.surplusHint', { fallback: 'You earned more than you spent' })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Figure label={t('cycle.income', { fallback: 'Income' })} value={income.total} tone="positive" formatCurrency={formatCurrency}
          hintTitle={t('cycle.income', { fallback: 'Income' })}
          hint={t('cycle.incomeHint', { fallback: 'Money that is yours — borrowing is not counted here' })} />
        <Figure label={t('cycle.expenses', { fallback: 'Expenses' })} value={-expenses.total} tone="negative" formatCurrency={formatCurrency} />
        {financing.total > 0 && (
          <Figure label={t('cycle.financing', { fallback: 'Borrowed this cycle' })} value={financing.total} tone="violet" formatCurrency={formatCurrency}
            hintTitle={t('cycle.financing', { fallback: 'Borrowed' })}
            hint={t('cycle.financingHint', { fallback: 'It covered the gap — and you pay it back' })} />
        )}
        <Figure label={t('cycle.bankMovement', { fallback: 'Change in your balance' })} value={bankMovement}
          tone={bankMovement < 0 ? 'negative' : 'positive'} formatCurrency={formatCurrency}
          hintTitle={t('cycle.bankMovement', { fallback: 'Change in your balance' })}
          hint={t('cycle.bankHint', { fallback: 'Net plus borrowing. This always equals the real movement in your account.' })} />
      </div>

      {projection && projection.upcoming.length > 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
          <p className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
            {projection.projectedOperatingNet < operatingNet ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
            {t('cycle.stillExpected', { fallback: 'Still expected before your next salary' })}
            <InfoHint title={t('cycle.projectedEnd', { fallback: 'Estimate' })}>
              {t('cycle.projectionHint', { fallback: 'An estimate from charges we have already seen repeat. It is never mixed into the settled numbers above.' })}
            </InfoHint>
          </p>
          <ul className="mt-2 space-y-1">
            {projection.upcoming.map((item) => (
              <li key={`${item.kind}-${item.date}-${item.label}`} className="flex items-center justify-between gap-2 text-[11px]">
                <span className="truncate text-gray-500 dark:text-gray-400">{formatCycleDay(item.date, language)} · {item.label}</span>
                <span className="shrink-0 tabular-nums font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(item.amount)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex items-center justify-between gap-2 border-t border-gray-100 pt-2 dark:border-gray-800">
            <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300">{t('cycle.projectedEnd', { fallback: 'Estimated end of cycle' })}</span>
            <span className={cn('tabular-nums text-base font-black', projection.projectedOperatingNet < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400')}>
              {formatCurrency(projection.projectedOperatingNet)}
            </span>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
        <CycleBreakdown cycle={cycle} formatCurrency={formatCurrency} t={t} language={language} />
      </div>
    </div>
  );
}
