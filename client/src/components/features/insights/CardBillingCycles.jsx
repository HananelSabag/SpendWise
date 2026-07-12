import React from 'react';
import { CalendarClock, ChevronDown, CreditCard } from 'lucide-react';

import { useTranslation } from '../../../stores';

export default function CardBillingCycles({ cycles = [], formatCurrency }) {
  const { t } = useTranslation('dashboard');
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-5">
      <div className="flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-violet-500" />
        <div>
          <h2 className="font-black text-gray-950 dark:text-white">{t('cycleDashboard.cardCycles')}</h2>
          <p className="text-xs text-gray-500">{t('cycleDashboard.cardCyclesSubtitle')}</p>
        </div>
      </div>
      <div className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
        {cycles.map((cycle) => (
          <div key={`${cycle.bankSource}-${cycle.accountNumber}-${cycle.billingDate || 'none'}`} className="flex items-center gap-3 py-3">
            <span className="rounded-xl bg-violet-50 p-2 text-violet-500 dark:bg-violet-950/25"><CalendarClock className="h-4 w-4" /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{cycle.bankSource} · {cycle.accountNumber || '—'}</p>
              <p className="text-[11px] text-gray-500">{cycle.billingDate || t('cycleDashboard.billingDateUnknown')} · {cycle.count} {t('cycleDashboard.charges')}</p>
            </div>
            <div className="text-end">
              <p className="font-black tabular-nums text-gray-950 dark:text-white">{formatCurrency(cycle.total)}</p>
              {cycle.pending > 0 && <p className="text-[10px] text-amber-600">{formatCurrency(cycle.pending)} {t('cycleDashboard.pending')}</p>}
            </div>
          </div>
        ))}
        {!cycles.length && <p className="py-6 text-center text-sm text-gray-500">{t('cycleDashboard.noCardCycles')}</p>}
      </div>
      <details className="group mt-2 border-t border-gray-100 pt-3 text-xs dark:border-gray-800">
        <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-gray-500">{t('cycleDashboard.whatBillingMeans')}<ChevronDown className="h-4 w-4 transition group-open:rotate-180" /></summary>
        <p className="mt-2 leading-5 text-gray-500">{t('cycleDashboard.billingExplanation')}</p>
      </details>
    </section>
  );
}
