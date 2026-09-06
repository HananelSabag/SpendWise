import React from 'react';
import { ChevronDown } from 'lucide-react';
import { CycleMoney, cycleSurface } from './CyclePrimitives';
import CycleTransactionList from './CycleTransactionList';
import { formatCycleDay } from '../../../utils/cycleDate';
import { cardShortName, last4 } from '../../../utils/cycleFormat';

export default function CycleActivityPanel({ cycle, formatCurrency, language, t }) {
  const sections = [
    {
      id: 'income',
      label: t('cycleV2.received'),
      total: Number(cycle.income?.total) || 0,
      transactions: cycle.income?.items || [],
    },
    {
      id: 'direct',
      label: t('cycleV2.alreadyDirect'),
      total: -(Number(cycle.expenses?.direct) || 0),
      transactions: cycle.expenses?.directItems || [],
    },
  ];
  return (
    <section className={`${cycleSurface} p-4 sm:p-6`}>
      <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
        {t('cycleV2.activityTitle')}
      </h2>
      <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
        {t('cycleV2.activityHint')}
      </p>
      <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
        {sections.map((section) => (
          <details key={section.id} className="group py-1">
            <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 text-sm [&::-webkit-details-marker]:hidden">
              <span className="min-w-0 flex-1 font-medium text-slate-700 dark:text-slate-200">
                {section.label}
              </span>
              <CycleMoney
                value={section.total}
                formatCurrency={formatCurrency}
                signed
                className={
                  section.total > 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-slate-950 dark:text-white'
                }
              />
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-180" />
            </summary>
            <CycleTransactionList
              transactions={section.transactions}
              formatCurrency={formatCurrency}
              language={language}
              t={t}
            />
          </details>
        ))}
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
        {t('cycleV2.actualCardHint')}
      </p>
      {(Number(cycle.financing?.total) || 0) !== 0 && (
        <div className="mt-3 flex items-start justify-between gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-950/50">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {t('cycleV2.financing')}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              {t('cycleV2.financingSeparate')}
            </p>
          </div>
          <CycleMoney
            value={Number(cycle.financing.total)}
            formatCurrency={formatCurrency}
            signed
            className="text-sm text-slate-950 dark:text-white"
          />
        </div>
      )}
      {!!cycle.unreconciledCardEvents?.length && (
        <details className="group mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/20">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium text-amber-900 dark:text-amber-200 [&::-webkit-details-marker]:hidden">
            {t('cycleV2.unmatchedCards', { count: cycle.unreconciledCardEvents.length })}
            <ChevronDown className="h-4 w-4 shrink-0 transition group-open:rotate-180" />
          </summary>
          <p className="mt-2 text-xs leading-6 text-amber-800 dark:text-amber-300">
            {t('cycleV2.unmatchedCardsHint')}
          </p>
          {cycle.unreconciledCardEvents.map((event, index) => (
            <div
              key={`${event.source}-${event.accountNumber}-${event.chargeDate}-${index}`}
              className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700 dark:text-slate-300"
            >
              <span>
                <bdi>
                  {cardShortName(event.source)} · {last4(event.accountNumber)}
                </bdi>{' '}
                · {formatCycleDay(event.chargeDate, language)}
              </span>
              <CycleMoney value={Number(event.total)} formatCurrency={formatCurrency} signed />
            </div>
          ))}
        </details>
      )}
    </section>
  );
}
