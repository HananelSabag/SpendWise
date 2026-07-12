import React from 'react';
import { ArrowRight, Gauge, Info } from 'lucide-react';

import { useTranslation } from '../../../stores';

export default function RunwaySnapshot({ runway, formatCurrency, onOpen }) {
  const { t } = useTranslation('dashboard');
  const cycle = runway?.current;
  if (!cycle) return null;
  return (
    <section className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Gauge className="h-4 w-4 shrink-0 text-indigo-600" />
          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold text-gray-950 dark:text-white">{t('runwaySnapshot.title')}</h2>
            <p className="truncate text-[11px] text-gray-500">{cycle.billing?.openedAfterBillingDate ? `${t('runwaySnapshot.afterBilling')} ${cycle.billing.openedAfterBillingDate}` : `${cycle.cycleStart} — ${cycle.lastDay}`}</p>
          </div>
        </div>
        <button type="button" onClick={onOpen} className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-white px-3 py-2 text-xs font-bold text-indigo-600 shadow-sm dark:bg-gray-900">
          {t('runwaySnapshot.open')}<ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
        </button>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
        <div><p className="text-gray-500">{t('runwaySnapshot.income')}</p><p className="mt-1 font-black text-emerald-600">{formatCurrency(cycle.money?.totalIncome)}</p></div>
        <div><p className="text-gray-500">{t('runwaySnapshot.expenses')}</p><p className="mt-1 font-black text-rose-600">{formatCurrency(cycle.money?.spentCommitted)}</p></div>
        <div><p className="text-gray-500">{t('runwaySnapshot.expected')}</p><p className="mt-1 font-black text-indigo-600">{runway.projection?.projectedCheckingBalance == null ? '—' : formatCurrency(runway.projection.projectedCheckingBalance)}</p></div>
      </div>
      <details className="group mt-3 text-[11px] text-gray-500">
        <summary className="flex cursor-pointer list-none items-center gap-1 font-semibold"><Info className="h-3.5 w-3.5" />{t('runwaySnapshot.what')}</summary>
        <p className="mt-2 leading-5">{t('runwaySnapshot.explanation')}</p>
      </details>
    </section>
  );
}
