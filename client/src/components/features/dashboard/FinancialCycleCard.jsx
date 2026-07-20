/**
 * The financial cycle on the dashboard — one calm answer to "where will I land?".
 *
 * The dashboard hero already shows the balance right now (ModernBalancePanel). This card answers
 * the next question: given the salary still to arrive and the card bills still to leave, what will
 * the connected checking account hold by the end of this cycle. That projected balance is the
 * single number the card leads with; everything else is a quiet supporting line, and the full
 * breakdown lives on the cycle page. The estimate is labelled and never mixed into settled figures
 * (FINANCIAL_CYCLE_SPEC.md §6).
 */

import React from 'react';
import { AlertTriangle, ArrowRight, TrendingDown, TrendingUp, Wallet } from 'lucide-react';

import { cn } from '../../../utils/helpers';
import { formatCycleDay } from '../../../utils/cycleDate';
import { formatCycleWindow, signedCurrency } from '../../../utils/cycleFormat';
import { useBankBalance } from '../../../hooks/useBankBalance';
import { projectBalanceAfterNextBills } from '../../../utils/bankBalance';

function CycleCardSkeleton({ label }) {
  const pulse = 'animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700/60';
  return (
    <section aria-busy="true" aria-label={label} className="glass-card min-h-[15rem] rounded-2xl p-5">
      <div className={`${pulse} h-3 w-32`} />
      <div className={`${pulse} mt-4 h-10 w-48`} />
      <div className={`${pulse} mt-2 h-3 w-40`} />
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className={`${pulse} h-14`} />
        <div className={`${pulse} h-14`} />
      </div>
      <div className={`${pulse} mt-5 h-4 w-28`} />
    </section>
  );
}

/** One quiet supporting figure: a small label over a right-sized amount. */
function Flow({ label, value, tone, formatCurrency }) {
  const tones = {
    positive: 'text-emerald-600 dark:text-emerald-400',
    negative: 'text-gray-900 dark:text-white',
  };
  return (
    <div className="rounded-xl bg-gray-50 px-3 py-2.5 dark:bg-gray-800/50">
      <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className={cn('mt-0.5 text-base font-bold tabular-nums', tones[tone])}>
        {signedCurrency(value, formatCurrency, { signPositive: true })}
      </p>
    </div>
  );
}

export default function FinancialCycleCard({
  cycle,
  isLoading = false,
  salaryTracking,
  formatCurrency,
  t,
  onOpenCycle,
  onLinkSalary,
  needsSalaryLink = false,
  language = 'en',
}) {
  // Shared with the dashboard hero (same query key → no extra request). Read the balance up front
  // so the hook order is stable across the early returns below.
  const { hasRealBalance, totalRealBalance, someBalancesUnavailable } = useBankBalance();

  if (isLoading && !cycle) {
    return <CycleCardSkeleton label={t('cycle.loading', { fallback: 'Loading financial cycle' })} />;
  }

  // Salary is the anchor of the whole model — without it there is no window to show.
  if (needsSalaryLink) {
    return (
      <section className="glass-card rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-indigo-50 p-2 text-indigo-500 dark:bg-indigo-950/30"><Wallet className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">{t('cycle.linkSalaryTitle', { fallback: 'Link your salary to see your cycle' })}</h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('cycle.linkSalaryHint', { fallback: 'Your financial cycle runs from one salary to the next. Point us at your salary once and we take it from there.' })}</p>
            <button type="button" onClick={onLinkSalary} className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700">
              {t('cycle.linkSalaryCta', { fallback: 'Link salary' })}<ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!cycle) return null;

  const { window, income, expenses, operatingNet } = cycle;
  const running = window.running;
  const reset = cycle.forwardReset;
  const salaryLate = salaryTracking?.status === 'late';
  const isPartial = cycle.partials?.length > 0;

  // Running cycle: the projected checking balance is the headline. Fall back to the expected change
  // when the bank does not report a balance (e.g. Yahav) so the card still answers the question.
  const projectedBalance = running && hasRealBalance
    ? projectBalanceAfterNextBills(totalRealBalance, cycle, true)
    : null;
  const netChange = reset && Number.isFinite(Number(reset.estimatedNetChange)) ? Number(reset.estimatedNetChange) : null;
  const expectedIn = reset ? Number(reset.expectedIncoming) || 0 : null;
  const stillOut = reset ? -((Number(reset.estimatedCardOut) || 0) + (Number(reset.estimatedFixedOut) || 0)) : null;
  const endDate = reset?.completionDate;
  const rising = (netChange ?? 0) >= 0;

  const openCycle = () => onOpenCycle?.();

  return (
    <section className="glass-card rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
          {t('cycle.title', { fallback: 'This financial cycle' })}
        </h3>
        <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
          {formatCycleWindow(window, language)}
        </span>
      </div>

      {salaryLate && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 dark:bg-amber-900/20">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-200">
            {t('cycle.salaryLate', { fallback: 'Your salary has not come in yet — keep an eye on it.' })}
          </p>
        </div>
      )}

      {running ? (
        <>
          {/* The one number: what the account is expected to hold by the end of this cycle. */}
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {projectedBalance !== null
              ? t('cycle.projectedBalance', { fallback: 'Expected balance at cycle end' })
              : t('cycle.projectedChange', { fallback: 'Expected change by cycle end' })}
            {endDate && <span className="text-gray-400 dark:text-gray-500"> · {formatCycleDay(endDate, language)}</span>}
          </p>

          {projectedBalance !== null ? (
            <p className={cn('mt-1 text-3xl font-bold tracking-tight tabular-nums', projectedBalance < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-900 dark:text-white')}>
              ~{formatCurrency(projectedBalance)}
            </p>
          ) : netChange !== null ? (
            <p className={cn('mt-1 text-3xl font-bold tracking-tight tabular-nums', rising ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
              {signedCurrency(netChange, formatCurrency)}
            </p>
          ) : (
            <p className="mt-1 text-2xl font-bold text-gray-400 dark:text-gray-500">{t('cycle.balanceUnavailable', { fallback: 'Not available' })}</p>
          )}

          {/* The expected change that gets there — the account's current balance is the hero above,
              so it is not repeated here. */}
          {projectedBalance !== null && netChange !== null && (
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-500 dark:text-gray-400">
              <span className={cn('inline-flex items-center gap-0.5 font-semibold tabular-nums', rising ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
                {rising ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {signedCurrency(netChange, formatCurrency)}
              </span>
              <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-gray-400 dark:bg-gray-800 dark:text-gray-500">
                {t('cycle.estimateTag', { fallback: 'estimate' })}
              </span>
              {someBalancesUnavailable && (
                <span className="text-[10px] text-gray-400">{t('cycle.balanceExcludesUnavailable', { fallback: "Some accounts don't report a balance." })}</span>
              )}
            </p>
          )}

          {isPartial && (
            <p className="mt-2 text-[11px] font-medium text-orange-600 dark:text-orange-400">
              {t('cycle.partialTitle', { fallback: 'This cycle is incomplete' })}
            </p>
          )}

          {/* Two quiet supporting figures — the money still moving before the cycle closes. */}
          {reset && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Flow label={t('cycle.expectedIn', { fallback: 'Expected in' })} value={expectedIn} tone="positive" formatCurrency={formatCurrency} />
              <Flow label={t('cycle.stillOut', { fallback: 'Still to leave' })} value={stillOut} tone="negative" formatCurrency={formatCurrency} />
            </div>
          )}
        </>
      ) : (
        <>
          {/* A closed cycle: the number to feel is how you actually lived. */}
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {t('cycle.operatingNet', { fallback: 'Net — how you are living' })}
          </p>
          <p className={cn('mt-1 text-3xl font-bold tracking-tight tabular-nums', operatingNet < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400')}>
            {signedCurrency(operatingNet, formatCurrency)}
          </p>
          {isPartial && (
            <p className="mt-2 text-[11px] font-medium text-orange-600 dark:text-orange-400">
              {t('cycle.partialTitle', { fallback: 'This cycle is incomplete' })}
            </p>
          )}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Flow label={t('cycle.income', { fallback: 'Income' })} value={income.total} tone="positive" formatCurrency={formatCurrency} />
            <Flow label={t('cycle.expenses', { fallback: 'Expenses' })} value={-expenses.total} tone="negative" formatCurrency={formatCurrency} />
          </div>
        </>
      )}

      <button
        type="button"
        onClick={openCycle}
        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-gray-900 py-2.5 text-xs font-bold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
      >
        {t('cycle.openDetails', { fallback: 'Full breakdown' })}<ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
      </button>
    </section>
  );
}
