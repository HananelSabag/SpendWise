/**
 * The cycle at a glance: for a running cycle, what is still to come and what has booked so far;
 * for a closed one, the net you actually lived on, the figures behind it, and the breakdown.
 *
 * Word-light: every figure gets a one- or two-word label, and the one genuinely non-obvious number
 * (bank movement) keeps a tap-to-explain hint. Everything else is just the numbers.
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';

import { cn } from '../../../utils/helpers';
import { signedCurrency } from '../../../utils/cycleFormat';
import { InfoHint } from '../../ui';
import CycleBreakdown from '../dashboard/CycleBreakdown';
import ForwardResetSummary from './ForwardResetSummary';
import ClosedCycleInsights from './ClosedCycleInsights';

function SalaryLate({ t }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-amber-50 px-3 py-2 dark:bg-amber-900/20">
      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
        {t('cycle.salaryLate', { fallback: 'Your salary has not come in yet — keep an eye on it.' })}
      </p>
    </div>
  );
}

/** An incomplete cycle understates what moved — say so, never let it read as a real number. */
function PartialWarning({ t }) {
  return (
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
  );
}

function Figure({ label, value, tone = 'neutral', hint, hintTitle, formatCurrency }) {
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
      <p className={cn('mt-1 text-lg font-bold tabular-nums', tones[tone])}>
        {signedCurrency(value, formatCurrency)}
      </p>
    </div>
  );
}

function NotIncluded({ decisions = [], formatCurrency, t }) {
  const items = decisions.filter((item) => (
    !item.included && ['transfer', 'exclude'].includes(item.classification)
  ));
  if (!items.length) return null;
  return (
    <details className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
      <summary className="cursor-pointer text-xs font-bold text-gray-600 dark:text-gray-300">
        {t('cycle.notIncludedGroup', { count: items.length, fallback: `Not included in totals (${items.length})` })}
      </summary>
      <div className="mt-2 space-y-1">
        {items.map((item) => (
          <div key={item.transactionId} className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2 text-[11px] dark:bg-gray-800/60">
            <span className="min-w-0 flex-1 truncate font-semibold text-gray-700 dark:text-gray-200">{item.description || '—'}</span>
            <span className="shrink-0 text-gray-400">{t(`cycle.control.class.${item.classification}`, { fallback: item.classification })}</span>
            <span className="shrink-0 font-black tabular-nums text-gray-700 dark:text-gray-200">{signedCurrency(item.amount, formatCurrency)}</span>
          </div>
        ))}
      </div>
    </details>
  );
}

export default function CycleOverviewTab({ cycle, salaryTracking, formatCurrency, t, language, useCardEstimate = true }) {
  if (!cycle) return null;
  const { income, expenses, operatingNet, financing, bankMovement } = cycle;
  const deficit = operatingNet < 0;
  const salaryLate = salaryTracking?.status === 'late';
  const isPartial = cycle.partials?.length > 0;

  if (cycle.window?.running) {
    const reset = cycle.forwardReset || {};
    const fixedOut = Number(reset.fixedOut ?? reset.estimatedFixedOut) || 0;
    const futureExpenses = (Number(useCardEstimate ? reset.estimatedCardOut : reset.knownCardOut) || 0) + fixedOut;
    return (
      <div className="space-y-3">
        {salaryLate && <SalaryLate t={t} />}
        {isPartial && <PartialWarning t={t} />}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          <Figure label={t('cycle.receivedSoFar', { fallback: 'Received so far' })} value={income.total} tone="positive" formatCurrency={formatCurrency} />
          <Figure label={t('cycle.cardSpentSoFar', { fallback: 'Credit-card spending' })} value={-expenses.cards} tone="negative" formatCurrency={formatCurrency} />
          <Figure label={t('cycle.directSpentSoFar', { fallback: 'Direct bank expenses' })} value={-expenses.direct} tone="negative" formatCurrency={formatCurrency} />
          <Figure label={t('cycle.futureIncome', { fallback: 'Future income' })} value={reset.expectedIncoming || 0} tone="positive" formatCurrency={formatCurrency} />
          <Figure label={t('cycle.futureExpenses', { fallback: 'Future expenses' })} value={-futureExpenses} tone="negative" formatCurrency={formatCurrency} />
        </div>
        <ForwardResetSummary forwardReset={cycle.forwardReset} useEstimate={useCardEstimate} formatCurrency={formatCurrency} t={t} language={language} />
        <div className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-gray-400">
            {t('cycle.forward.alreadySettled', { fallback: 'Completed income and direct bank expenses' })}
          </p>
          <CycleBreakdown cycle={cycle} formatCurrency={formatCurrency} t={t} language={language} />
        </div>
        <NotIncluded decisions={cycle.decisions} formatCurrency={formatCurrency} t={t} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {salaryLate && <SalaryLate t={t} />}
      {isPartial && <PartialWarning t={t} />}

      {/* The number to feel — first and dominant. */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          {t('cycle.operatingNet', { fallback: 'Net — how you are living' })}
        </p>
        <p className={cn('mt-1 text-3xl font-black tabular-nums', deficit ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400')}>
          {signedCurrency(operatingNet, formatCurrency)}
        </p>
        <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
          {deficit
            ? t('cycle.deficitHint', { fallback: 'You are spending more than you earn' })
            : t('cycle.surplusHint', { fallback: 'You earned more than you spent' })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Figure label={t('cycle.income', { fallback: 'Income' })} value={income.total} tone="positive" formatCurrency={formatCurrency} />
        <Figure label={t('cycle.expenses', { fallback: 'Expenses' })} value={-expenses.total} tone="negative" formatCurrency={formatCurrency} />
        {financing.total > 0 && (
          <Figure label={t('cycle.financing', { fallback: 'Borrowed this cycle' })} value={financing.total} tone="violet" formatCurrency={formatCurrency} />
        )}
        <Figure label={t('cycle.bankMovement', { fallback: 'Change in your balance' })} value={bankMovement}
          tone={bankMovement < 0 ? 'negative' : 'positive'} formatCurrency={formatCurrency}
          hintTitle={t('cycle.bankMovement', { fallback: 'Change in your balance' })}
          hint={t('cycle.bankHint', { fallback: 'The literal change in the bank between salary dates.' })} />
      </div>

      {/* Daily averages are a footnote to the net, not a headline — kept compact and below it. */}
      <ClosedCycleInsights insights={cycle.closedInsights} formatCurrency={formatCurrency} t={t} language={language} />

      <div className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
        <CycleBreakdown cycle={cycle} formatCurrency={formatCurrency} t={t} language={language} />
      </div>
      <NotIncluded decisions={cycle.decisions} formatCurrency={formatCurrency} t={t} />
    </div>
  );
}
