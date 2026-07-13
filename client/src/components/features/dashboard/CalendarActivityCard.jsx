import React, { useEffect, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Clock3,
  CreditCard,
  Loader2,
  RefreshCcw,
  Undo2,
} from 'lucide-react';

import { cn } from '../../../utils/helpers';
import { useTranslation } from '../../../stores';
import { useCalendarMonthDetails } from '../../../hooks/useCalendarMonthDetails';
import CalendarActivityDetailsSheet from './CalendarActivityDetailsSheet';

const sourceName = (source) => ({ max: 'MAX', visa_cal: 'CAL' }[source] || String(source || '').toUpperCase());

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

function ActivityRow({ icon: Icon, label, meta, amount, tone = 'neutral', formatCurrency, onClick, disabled }) {
  const tones = {
    card: 'bg-violet-50/80 text-violet-700 hover:bg-violet-100 dark:bg-violet-950/25 dark:text-violet-300 dark:hover:bg-violet-950/40',
    income: 'bg-emerald-50/80 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-300 dark:hover:bg-emerald-950/35',
    adjustment: 'bg-indigo-50/80 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-300 dark:hover:bg-indigo-950/35',
    pending: 'bg-amber-50/80 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/20 dark:text-amber-300 dark:hover:bg-amber-950/35',
    neutral: 'bg-gray-50 text-gray-800 hover:bg-gray-100 dark:bg-gray-800/60 dark:text-gray-100 dark:hover:bg-gray-800',
  };
  const value = Number(amount) || 0;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition disabled:cursor-wait disabled:opacity-60',
        tones[tone],
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-bold sm:text-sm">{label}</span>
        {meta && <span className="mt-0.5 block truncate text-[10px] opacity-70">{meta}</span>}
      </span>
      <span className="shrink-0 whitespace-nowrap text-xs font-black tabular-nums sm:text-sm">
        {value < 0 ? '−' : ''}{formatCurrency(Math.abs(value))}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 opacity-35 transition group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
    </button>
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
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const detailQuery = useCalendarMonthDetails(summary?.period?.offset || 0, selectedGroup?.key || null);

  useEffect(() => {
    setSelectedGroup(null);
    setIsExpanded(false);
  }, [summary?.period?.month]);

  if (!summary) return null;
  const totals = summary.totals || {};
  const breakdown = summary.breakdown || {};
  const bank = breakdown.bankTransactions || {};
  const cards = breakdown.creditCards || [];
  const reconciliation = summary.reconciliation || {};
  const reversals = breakdown.refundsAndReversals || {};
  const reversalTotal = (reversals.cardRefunds || 0) + (reversals.matchedBankReversals || 0);
  const openGroup = (key, title) => setSelectedGroup({ key, title });
  const activityRows = [
    ...cards.map((card) => {
      const title = `${sourceName(card.bankSource)} ••••${String(card.accountNumber).slice(-4)}`;
      return {
        key: `card:${card.bankSource}:${card.accountNumber}`,
        icon: CreditCard,
        label: title,
        meta: t('calendarActivity.transactionCount', { count: card.chargeCount || 0 }),
        amount: card.charges || 0,
        tone: 'card',
        onClick: () => openGroup(`card:${card.bankSource}:${card.accountNumber}`, title),
      };
    }),
    {
      key: 'bank:expense',
      icon: ArrowDownToLine,
      label: t('calendarActivity.bankOut'),
      meta: t('calendarActivity.transactionCount', { count: bank.expenseCount || 0 }),
      amount: bank.expenses || 0,
      onClick: () => openGroup('bank:expense', t('calendarActivity.bankOut')),
    },
    {
      key: 'bank:income',
      icon: ArrowUpFromLine,
      label: t('calendarActivity.bankIn'),
      meta: t('calendarActivity.transactionCount', { count: bank.incomeCount || 0 }),
      amount: bank.income || 0,
      tone: 'income',
      onClick: () => openGroup('bank:income', t('calendarActivity.bankIn')),
    },
    reconciliation.totalAdjustment > 0 && {
      key: 'adjustments',
      icon: RefreshCcw,
      label: t('calendarActivity.duplicateAdjustments'),
      meta: t('calendarActivity.adjustmentsHint'),
      amount: -reconciliation.totalAdjustment,
      tone: 'adjustment',
      onClick: () => openGroup('adjustments', t('calendarActivity.duplicateAdjustments')),
    },
    reversalTotal > 0 && {
      key: 'refunds',
      icon: Undo2,
      label: t('calendarActivity.refundInstallment'),
      meta: t('calendarActivity.includedInBankIncome'),
      amount: reversalTotal,
      tone: 'income',
      onClick: () => openGroup('refunds', t('calendarActivity.refundInstallment')),
    },
    summary.pending?.count > 0 && {
      key: 'pending',
      icon: Clock3,
      label: t('calendarActivity.pendingTitle'),
      meta: t('calendarActivity.pendingSubset'),
      amount: summary.pending.expenses || 0,
      tone: 'pending',
      onClick: () => openGroup('pending', t('calendarActivity.pendingTitle')),
    },
  ].filter(Boolean);
  const hiddenRowCount = Math.max(activityRows.length - 3, 0);
  const visibleRows = isExpanded ? activityRows : activityRows.slice(0, 3);

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="rounded-xl bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-300"><CalendarDays className="h-4 w-4" /></span>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-gray-950 dark:text-white">{monthLabel(summary.period?.month, currentLanguage)}</h2>
              <p className="text-[11px] text-gray-500">{t('calendarActivity.tapForBreakdown')}</p>
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

        <div className={cn('mt-3 space-y-2 transition-opacity', isFetching && 'opacity-65')}>
          {visibleRows.map(({ key, ...row }) => (
            <ActivityRow
              key={key}
              {...row}
              formatCurrency={formatCurrency}
              disabled={isFetching}
            />
          ))}
          {hiddenRowCount > 0 && (
            <button
              type="button"
              onClick={() => setIsExpanded((value) => !value)}
              aria-expanded={isExpanded}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold text-indigo-600 transition hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-950/25"
            >
              {isExpanded
                ? t('calendarActivity.showLess')
                : t('calendarActivity.showMore', { count: hiddenRowCount })}
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
          {isError && <p className="px-1 text-[11px] text-rose-600">{t('calendarActivity.loadError')}</p>}
        </div>
      </section>

      <CalendarActivityDetailsSheet
        isOpen={Boolean(selectedGroup)}
        onClose={() => setSelectedGroup(null)}
        title={selectedGroup?.title || ''}
        details={detailQuery.data}
        isLoading={detailQuery.isPending && !detailQuery.data}
        isError={detailQuery.isError}
        onRetry={detailQuery.refetch}
        formatCurrency={formatCurrency}
      />
    </>
  );
}
