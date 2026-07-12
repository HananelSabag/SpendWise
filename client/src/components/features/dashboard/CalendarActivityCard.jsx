import React from 'react';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, CreditCard, Landmark } from 'lucide-react';

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
    <div className="min-w-0">
      <p className="truncate text-[11px] font-medium text-gray-500">{label}</p>
      <p className={cn('mt-1 truncate text-lg font-black tabular-nums', tone)}>
        {amount < 0 ? '−' : ''}{formatCurrency(Math.abs(amount))}
      </p>
    </div>
  );
}

export default function CalendarActivityCard({
  activity,
  formatCurrency,
  onPrevious,
  onNext,
  canPrevious,
  canNext,
}) {
  const { t, currentLanguage } = useTranslation('dashboard');
  if (!activity) return null;
  const bank = activity.bankCashFlow || {};
  const cards = activity.cardActivity || {};

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="rounded-xl bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-300"><CalendarDays className="h-4 w-4" /></span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold text-gray-950 dark:text-white">{monthLabel(activity.period?.month, currentLanguage)}</h2>
            <p className="truncate text-[11px] text-gray-500">{t('calendarActivity.rawSubtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onPrevious} disabled={!canPrevious} aria-label={t('calendarActivity.previousMonth')} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-gray-800"><ChevronLeft className="h-4 w-4 rtl:rotate-180" /></button>
          <button type="button" onClick={onNext} disabled={!canNext} aria-label={t('calendarActivity.nextMonth')} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-gray-800"><ChevronRight className="h-4 w-4 rtl:rotate-180" /></button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 border-y border-gray-100 py-3 dark:border-gray-800">
        <Metric label={t('calendarActivity.bankIncome')} value={bank.income} tone="text-emerald-600" formatCurrency={formatCurrency} />
        <Metric label={t('calendarActivity.bankExpenses')} value={bank.expenses} tone="text-rose-600" formatCurrency={formatCurrency} />
        <Metric label={t('calendarActivity.bankNet')} value={bank.net} tone={(bank.net || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'} formatCurrency={formatCurrency} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-violet-50/70 p-3 dark:bg-violet-950/20">
        <span className="flex min-w-0 items-center gap-2 text-xs font-semibold text-violet-700 dark:text-violet-300"><CreditCard className="h-4 w-4 shrink-0" />{t('calendarActivity.cardActivity')}</span>
        <span className="shrink-0 text-sm font-black tabular-nums text-violet-700 dark:text-violet-300">{formatCurrency(cards.netCharges || 0)}</span>
      </div>

      <details className="group mt-2 border-t border-gray-100 pt-2 text-xs dark:border-gray-800">
        <summary className="flex cursor-pointer list-none items-center justify-between py-1 font-semibold text-gray-500">
          {t('calendarActivity.details')}
          <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
        </summary>
        <div className="mt-2 grid grid-cols-2 gap-2 text-gray-500 sm:grid-cols-4">
          <div><p>{t('calendarActivity.bankPending')}</p><p className="font-bold text-gray-900 dark:text-white">{formatCurrency(bank.pendingExpenses || 0)}</p></div>
          <div><p>{t('calendarActivity.cardCharges')}</p><p className="font-bold text-gray-900 dark:text-white">{formatCurrency(cards.charges || 0)}</p></div>
          <div><p>{t('calendarActivity.cardRefunds')}</p><p className="font-bold text-gray-900 dark:text-white">{formatCurrency(cards.refunds || 0)}</p></div>
          <div><p>{t('calendarActivity.rawRows')}</p><p className="font-bold text-gray-900 dark:text-white">{activity.transactionCount}</p></div>
          <p className="col-span-full mt-1 flex gap-2 rounded-xl bg-gray-50 p-3 leading-5 dark:bg-gray-800/60"><Landmark className="mt-0.5 h-4 w-4 shrink-0" />{t('calendarActivity.rawExplanation')}</p>
        </div>
      </details>
    </section>
  );
}
