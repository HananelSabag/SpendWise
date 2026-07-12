import React from 'react';
import { CalendarDays, ChevronDown, CircleDollarSign, CreditCard, Landmark, Repeat2 } from 'lucide-react';

import { cn } from '../../../utils/helpers';
import { useTranslation } from '../../../stores';

function Metric({ label, value, tone, formatCurrency }) {
  const amount = Number(value) || 0;
  return (
    <div className="min-w-0">
      <p className="truncate text-[11px] font-medium text-gray-500">{label}</p>
      <p className={cn('mt-1 truncate text-lg font-black tabular-nums', tone)}>{amount < 0 ? '−' : ''}{formatCurrency(Math.abs(amount))}</p>
    </div>
  );
}

function EventRow({ icon: Icon, label, value, formatCurrency }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm">
      <span className="flex min-w-0 items-center gap-2 text-gray-600 dark:text-gray-300">
        <Icon className="h-4 w-4 shrink-0 text-gray-400" />
        <span className="truncate">{label}</span>
      </span>
      <span className="font-bold tabular-nums text-gray-900 dark:text-white">{formatCurrency(value)}</span>
    </div>
  );
}

export default function CalendarActivityCard({ activity, formatCurrency }) {
  const { t } = useTranslation('dashboard');
  if (!activity) return null;
  const events = activity.events || {};
  const pending = activity.spending?.pending || 0;
  const cards = (events.cardCharges?.posted || 0) + (events.cardCharges?.pending || 0) - (events.cardCharges?.refunds || 0);
  const bankPayments = (events.bankPayments?.posted || 0) + (events.bankPayments?.pending || 0);
  const transfers = (events.transfers?.incoming || 0) + (events.transfers?.outgoing || 0);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="rounded-xl bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-300"><CalendarDays className="h-4 w-4" /></span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold text-gray-950 dark:text-white">{t('calendarActivity.title')}</h2>
            <p className="truncate text-[11px] text-gray-500">{t('calendarActivity.subtitle')}</p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-500 dark:bg-gray-800">{activity.transactionCount} {t('calendarActivity.events')}</span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 border-y border-gray-100 py-3 dark:border-gray-800">
        <Metric label={t('calendarActivity.income')} value={activity.income?.total} tone="text-emerald-600" formatCurrency={formatCurrency} />
        <Metric label={t('calendarActivity.spending')} value={activity.spending?.committed} tone="text-rose-600" formatCurrency={formatCurrency} />
        <Metric label={t('calendarActivity.net')} value={activity.net?.committed} tone={(activity.net?.committed || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'} formatCurrency={formatCurrency} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-4 text-xs sm:grid-cols-4">
        <EventRow icon={CreditCard} label={t('calendarActivity.cards')} value={cards} formatCurrency={formatCurrency} />
        <EventRow icon={Landmark} label={t('calendarActivity.bankPayments')} value={bankPayments} formatCurrency={formatCurrency} />
        <EventRow icon={Repeat2} label={t('calendarActivity.transfers')} value={transfers} formatCurrency={formatCurrency} />
        <EventRow icon={CircleDollarSign} label={t('calendarActivity.pending')} value={pending} formatCurrency={formatCurrency} />
      </div>

      <details className="group mt-2 border-t border-gray-100 pt-2 text-xs dark:border-gray-800">
        <summary className="flex cursor-pointer list-none items-center justify-between py-1 font-semibold text-gray-500">
          {t('calendarActivity.more')}
          <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
        </summary>
        <div className="mt-2 grid gap-x-6 sm:grid-cols-2">
          <EventRow icon={Landmark} label={t('calendarActivity.debitCard')} value={(events.debitCardPayments?.posted || 0) + (events.debitCardPayments?.pending || 0)} formatCurrency={formatCurrency} />
          <EventRow icon={Landmark} label={t('calendarActivity.loans')} value={(events.loanPayments?.posted || 0) + (events.loanPayments?.pending || 0)} formatCurrency={formatCurrency} />
          <EventRow icon={CircleDollarSign} label={t('calendarActivity.cash')} value={(events.cashWithdrawals?.posted || 0) + (events.cashWithdrawals?.pending || 0)} formatCurrency={formatCurrency} />
          <EventRow icon={CircleDollarSign} label={t('calendarActivity.fees')} value={(events.feesAndTax?.posted || 0) + (events.feesAndTax?.pending || 0)} formatCurrency={formatCurrency} />
          <p className="col-span-full mt-2 rounded-xl bg-gray-50 p-3 leading-5 text-gray-500 dark:bg-gray-800/60">{t('calendarActivity.explanation')}</p>
        </div>
      </details>
    </section>
  );
}
