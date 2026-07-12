import React from 'react';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, CreditCard, Landmark, Loader2, RefreshCcw } from 'lucide-react';

import { cn } from '../../../utils/helpers';
import { useTranslation } from '../../../stores';

function monthLabel(month, language) {
  if (!month) return '';
  return new Intl.DateTimeFormat(language === 'he' ? 'he-IL' : 'en-GB', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${month}-15T12:00:00`));
}

function Metric({ label, value, tone, formatCurrency }) {
  const amount = Number(value) || 0;
  return (
    <div className="min-w-0 text-center sm:text-start">
      <p className="text-[10px] font-semibold leading-tight text-gray-500 sm:text-xs">{label}</p>
      <p className={cn('mt-1 whitespace-nowrap text-sm font-black tabular-nums sm:text-lg', tone)}>
        {amount < 0 ? '−' : ''}{formatCurrency(Math.abs(amount))}
      </p>
    </div>
  );
}

export default function CalendarActivityCard({
  summary,
  formatCurrency,
  isFetching,
  isError,
  onPrevious,
  onNext,
  canPrevious,
  canNext,
}) {
  const { t, currentLanguage } = useTranslation('dashboard');
  if (!summary) return null;
  const totals = summary.totals || {};
  const breakdown = summary.breakdown || {};
  const bank = breakdown.bankTransactions || {};
  const other = breakdown.otherTransactions || {};
  const cards = breakdown.creditCards || [];
  const reconciliation = summary.reconciliation || {};
  const reversals = breakdown.refundsAndReversals || {};
  const reversalTotal = (reversals.cardRefunds || 0) + (reversals.matchedBankReversals || 0);
  const otherCount = (other.incomeCount || 0) + (other.expenseCount || 0);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="rounded-xl bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-300"><CalendarDays className="h-4 w-4" /></span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold text-gray-950 dark:text-white">{monthLabel(summary.period?.month, currentLanguage)}</h2>
            <p className="text-[11px] text-gray-500">{t('calendarActivity.rawSubtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isFetching && <Loader2 className="me-1 h-4 w-4 animate-spin text-indigo-500" aria-label={t('calendarActivity.loading')} />}
          <button type="button" onClick={onPrevious} disabled={!canPrevious || isFetching} aria-label={t('calendarActivity.previousMonth')} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-gray-800"><ChevronLeft className="h-4 w-4 rtl:rotate-180" /></button>
          <button type="button" onClick={onNext} disabled={!canNext || isFetching} aria-label={t('calendarActivity.nextMonth')} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-gray-800"><ChevronRight className="h-4 w-4 rtl:rotate-180" /></button>
        </div>
      </div>

      <div className={cn('mt-4 grid grid-cols-3 gap-1 border-y border-gray-100 py-3 transition-opacity dark:border-gray-800 sm:gap-3', isFetching && 'opacity-65')}>
        <Metric label={t('calendarActivity.totalIncome')} value={totals.income} tone="text-emerald-600" formatCurrency={formatCurrency} />
        <Metric label={t('calendarActivity.totalExpenses')} value={totals.expenses} tone="text-rose-600" formatCurrency={formatCurrency} />
        <Metric label={t('calendarActivity.netBalance')} value={totals.net} tone={(totals.net || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'} formatCurrency={formatCurrency} />
      </div>

      <div className={cn('mt-3 space-y-2 text-xs transition-opacity', isFetching && 'opacity-65')}>
        {cards.map((card) => (
          <div key={`${card.bankSource}:${card.accountNumber}`} className="flex items-center justify-between gap-3 rounded-xl bg-violet-50/70 px-3 py-2.5 dark:bg-violet-950/20">
            <span className="flex min-w-0 items-center gap-2 font-semibold text-violet-700 dark:text-violet-300"><CreditCard className="h-4 w-4 shrink-0" /><span>{t('calendarActivity.creditCard')} ••••{String(card.accountNumber).slice(-4)}</span></span>
            <span className="shrink-0 whitespace-nowrap font-black tabular-nums text-violet-700 dark:text-violet-300">{formatCurrency(card.charges || 0)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3 py-2.5 dark:bg-gray-800/60">
          <span className="flex min-w-0 items-center gap-2 text-gray-600 dark:text-gray-300"><Landmark className="h-4 w-4 shrink-0" />{t('calendarActivity.bankExpenseBreakdown', { count: bank.expenseCount || 0 })}</span>
          <span className="shrink-0 whitespace-nowrap font-black tabular-nums text-gray-900 dark:text-white">{formatCurrency(bank.expenses || 0)}</span>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3 py-2.5 dark:bg-gray-800/60">
          <span className="flex min-w-0 items-center gap-2 text-gray-600 dark:text-gray-300"><Landmark className="h-4 w-4 shrink-0" />{t('calendarActivity.bankIncomeBreakdown', { count: bank.incomeCount || 0 })}</span>
          <span className="shrink-0 whitespace-nowrap font-black tabular-nums text-gray-900 dark:text-white">{formatCurrency(bank.income || 0)}</span>
        </div>
        {reconciliation.totalAdjustment > 0 && <div className="flex items-center justify-between gap-3 rounded-xl bg-indigo-50/70 px-3 py-2.5 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-300">
          <span className="flex min-w-0 items-center gap-2"><RefreshCcw className="h-4 w-4 shrink-0" />{t('calendarActivity.cardDebitAdjustments')}</span>
          <span className="shrink-0 whitespace-nowrap font-black tabular-nums">−{formatCurrency(reconciliation.totalAdjustment)}</span>
        </div>}
        {reversalTotal > 0 && <div className="flex items-center justify-between gap-3 px-3 py-1 text-emerald-700 dark:text-emerald-300">
          <span>{t('calendarActivity.refundsReversals')}</span>
          <span className="shrink-0 whitespace-nowrap font-bold tabular-nums">{formatCurrency(reversalTotal)}</span>
        </div>}
        {otherCount > 0 && <div className="flex items-center justify-between gap-3 px-3 py-1 text-gray-500"><span>{t('calendarActivity.otherTransactions', { count: otherCount })}</span><span className="shrink-0 whitespace-nowrap font-bold tabular-nums">{formatCurrency(other.net || 0)}</span></div>}
        {summary.pending?.count > 0 && <p className="px-1 text-[10px] text-amber-600">{t('calendarActivity.pendingIncluded', { count: summary.pending.count, amount: formatCurrency(summary.pending.expenses || 0) })}</p>}
        {reconciliation.adjustments?.some((item) => item.adjustment > 0) && <details className="group border-t border-gray-100 pt-2 dark:border-gray-800">
          <summary className="flex cursor-pointer list-none items-center justify-between py-1 font-semibold text-gray-500">
            {t('calendarActivity.howCardDebitsAdjusted')}
            <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
          </summary>
          <div className="mt-2 space-y-2">
            {reconciliation.adjustments.filter((item) => item.adjustment > 0).map((item) => <div key={`${item.cardSource}:${item.accountNumber}:${item.billingDate}`} className="rounded-xl bg-gray-50 p-3 text-[11px] leading-5 text-gray-600 dark:bg-gray-800/60 dark:text-gray-300">
              <p className="font-bold text-gray-900 dark:text-white">{t('calendarActivity.creditCard')} ••••{String(item.accountNumber || '').slice(-4)} · {item.billingDate}</p>
              <p>{t('calendarActivity.fullBankDebit')}: <b>{formatCurrency(item.bankDebit)}</b> · {t('calendarActivity.alreadyRepresented')}: <b>{formatCurrency(item.alreadyRepresented)}</b></p>
              <p>{t('calendarActivity.remainingBankDebit')}: <b>{formatCurrency(item.remainingBankDebit)}</b></p>
            </div>)}
          </div>
        </details>}
        {isError && <p className="px-1 text-[11px] text-rose-600">{t('calendarActivity.loadError')}</p>}
      </div>
    </section>
  );
}
