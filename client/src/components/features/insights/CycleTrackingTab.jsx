/**
 * What the engine knows, and the one thing it will not guess.
 *
 * Salary anchors the whole cycle, so its state is stated plainly. Below it sit the credits we
 * cannot prove: a bank handing back the exact amount of a card bill two days later is almost
 * certainly a spread into a loan — but "almost certainly" is not good enough to book silently.
 * We show the evidence, pre-fill the likely answer, and let the user settle it in one tap.
 */

import React from 'react';
import { AlertTriangle, ArrowRightLeft, Briefcase, CalendarCheck, HelpCircle } from 'lucide-react';

import { cn } from '../../../utils/helpers';
import { formatCycleDay } from '../../../utils/cycleDate';
import { InfoHint } from '../../ui';
import SalaryCandidatePrompt from '../dashboard/SalaryCandidatePrompt';
import WatchedMerchants from './WatchedMerchants';

const STATUS_TONE = {
  scheduled: 'text-emerald-600 dark:text-emerald-400',
  due: 'text-amber-600 dark:text-amber-400',
  late: 'text-rose-600 dark:text-rose-400',
  unknown: 'text-gray-400',
};

export default function CycleTrackingTab({
  salaryTracking,
  salaryChange,
  needsReview = [],
  formatCurrency,
  t,
  onClassify,
  isClassifying = false,
  classifyingTransactionId = null,
  signatures = [],
  onSalarySelected,
  language = 'en',
}) {
  const status = salaryTracking?.status || 'unknown';

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <p className="flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
          <CalendarCheck className="h-3.5 w-3.5" />
          {t('cycle.salary', { fallback: 'Salary' })}
          <InfoHint title={t('cycle.salary', { fallback: 'Salary' })}>
            {t('cycle.salaryHint', { fallback: 'Your cycle runs from one salary to the next, so we watch for it. A day or two late around a weekend is normal.' })}
          </InfoHint>
        </p>
        {salaryTracking?.last ? (
          <>
            <p className="mt-1 text-2xl font-black tabular-nums text-gray-900 dark:text-white">
              {formatCurrency(salaryTracking.typicalAmount)}
            </p>
            <p className={cn('mt-0.5 text-[11px] font-semibold', STATUS_TONE[status])}>
              {status === 'late'
                ? t('cycle.salaryLateShort', { fallback: 'Has not arrived' })
                : `${t('cycle.nextExpected', { fallback: 'Next' })} ${formatCycleDay(salaryTracking.expectedNext, language)}`}
            </p>
          </>
        ) : (
          <p className="mt-1 text-sm text-gray-500">{t('cycle.noSalaryLinked', { fallback: 'No salary linked yet' })}</p>
        )}
      </div>

      <SalaryCandidatePrompt
        formatCurrency={formatCurrency}
        hasSalaryIdentity
        salaryIdentityCount={signatures.length}
        onSelected={onSalarySelected}
      />

      {/* A stopped salary plus a new lookalike is the shape of a job change — worth surfacing,
          never worth re-anchoring the cycle on by ourselves. */}
      {salaryChange?.suspected && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-3 dark:border-indigo-900/60 dark:bg-indigo-950/20">
          <p className="flex items-center gap-1.5 text-xs font-bold text-indigo-800 dark:text-indigo-200">
            <Briefcase className="h-3.5 w-3.5" />
            {t('cycle.jobChange', { fallback: 'Did you change jobs?' })}
          </p>
          {salaryChange.candidates.map((c) => (
            <p key={c.date} className="mt-1 text-[11px] text-indigo-700 dark:text-indigo-300">
              {formatCycleDay(c.date, language)} · {c.description} · <span className="font-bold tabular-nums">{formatCurrency(c.amount)}</span>
            </p>
          ))}
        </div>
      )}

      {needsReview.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-900/60 dark:bg-amber-950/20">
          <p className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
            <HelpCircle className="h-3.5 w-3.5" />
            {t('cycle.needsAnswer', { fallback: 'We are not sure about this' })}
          </p>
          {needsReview.map((item) => (
            <div key={item.transactionId || item.identifier || item.date} className="mt-2 rounded-xl bg-white/70 p-3 dark:bg-gray-900/50">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{item.description}</p>
                  <p className="mt-0.5 text-[11px] text-gray-500">{formatCycleDay(item.date, language)}</p>
                </div>
                <p className="shrink-0 text-base font-black tabular-nums text-emerald-600">+{formatCurrency(item.amount)}</p>
              </div>

              {item.matchedBill && (
                <p className="mt-2 flex items-center gap-1 rounded-lg bg-gray-50 px-2 py-1.5 text-[11px] text-gray-600 dark:bg-gray-800/60 dark:text-gray-300">
                  <ArrowRightLeft className="h-3 w-3 shrink-0" />
                  {t('cycle.matchesBill', { fallback: 'Matches your' })} {item.matchedBill.source?.toUpperCase()} ••••{String(item.matchedBill.accountNumber || '').slice(-4)} {t('cycle.billFrom', { fallback: 'bill from' })} {formatCycleDay(item.matchedBill.chargeDate, language)}
                </p>
              )}

              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => onClassify?.(item, 'financing')}
                  disabled={isClassifying}
                  className="flex-1 rounded-xl bg-indigo-600 px-3 py-2 text-[11px] font-bold text-white hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60"
                >
                  {t('cycle.itIsALoan', { fallback: 'It is a loan' })}
                </button>
                <button
                  type="button"
                  onClick={() => onClassify?.(item, 'income')}
                  disabled={isClassifying}
                  className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-[11px] font-bold text-gray-700 hover:bg-gray-50 disabled:cursor-wait disabled:opacity-60 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  {t('cycle.itIsIncome', { fallback: 'It is income' })}
                </button>
              </div>
              <p className="mt-1.5 text-[10px] text-gray-400">
                {isClassifying && Number(classifyingTransactionId) === Number(item.transactionId)
                  ? t('cycle.savingAnswer', { fallback: 'Saving your answer...' })
                  : t('cycle.answeredOnce', { fallback: 'Answer once — we remember it from now on' })}
              </p>
            </div>
          ))}
        </div>
      )}

      {!needsReview.length && !salaryChange?.suspected && salaryTracking?.last && (
        <p className="flex items-center justify-center gap-1.5 py-6 text-center text-xs text-gray-400">
          <AlertTriangle className="h-3.5 w-3.5 opacity-0" />
          {t('cycle.nothingToReview', { fallback: 'Nothing needs your attention' })}
        </p>
      )}

      <WatchedMerchants formatCurrency={formatCurrency} />
    </div>
  );
}
