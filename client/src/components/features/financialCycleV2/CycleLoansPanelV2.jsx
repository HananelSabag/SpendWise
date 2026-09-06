import React from 'react';
import { ChevronDown, Landmark, Loader2 } from 'lucide-react';
import { useCycles } from '../../../hooks/useCycles';
import { formatCycleDay } from '../../../utils/cycleDate';
import { CycleEmpty, CycleMoney, cycleButton, cycleSurface } from './CyclePrimitives';

export default function CycleLoansPanelV2({ formatCurrency, language, t, onManageRecurring }) {
  const details = useCycles();
  if (details.isLoading)
    return (
      <p
        role="status"
        className="flex items-center gap-2 p-6 text-sm text-slate-500 dark:text-slate-400"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        {t('cycleV2.loadingLoans')}
      </p>
    );
  if (details.isError)
    return (
      <CycleEmpty title={t('cycleV2.loadLoansError')}>
        <button
          type="button"
          onClick={() => details.refetch()}
          className={`${cycleButton} bg-indigo-600 text-white`}
        >
          {t('cycleV2.tryAgain')}
        </button>
      </CycleEmpty>
    );
  const loans = (details.loans || []).filter((loan) => Number(loan.principal) > 0);
  const active = loans.filter((loan) => Number(loan.outstanding) > 0);
  const remaining = active.reduce((sum, loan) => sum + Number(loan.outstanding), 0);
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
          {t('cycleV2.loansTitle')}
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
          {t('cycleV2.loansSourceHint')}
        </p>
      </div>
      <div className={`${cycleSurface} p-5 sm:p-6`}>
        <p className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Landmark className="h-4 w-4" />
          {t('cycleV2.loanRemainderEstimate')}
        </p>
        <CycleMoney
          value={remaining}
          formatCurrency={formatCurrency}
          className="mt-2 text-3xl text-slate-950 dark:text-white"
        />
        <p className="mt-2 text-xs leading-6 text-slate-500 dark:text-slate-400">
          {t('cycleV2.loanEstimateWarning')}
        </p>
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        {loans.map((loan, index) => (
          <article key={`${loan.identifier}-${index}`} className={`${cycleSurface} p-4 sm:p-5`}>
            <h3 className="break-words text-base font-semibold text-slate-950 dark:text-white">
              {loan.description || t('cycle.loan')}
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {t('cycleV2.loanFirstSeen', { date: formatCycleDay(loan.disbursedOn, language) })}
            </p>
            <dl className="mt-4 space-y-3">
              {[
                { key: 'loanReceived', amount: Number(loan.principal) },
                { key: 'loanPaid', amount: Number(loan.repaid) },
                { key: 'loanRemainderEstimate', amount: Math.max(0, Number(loan.outstanding)) },
              ].map(({ key, amount }) => (
                <div key={key} className="flex items-start justify-between gap-3 text-sm">
                  <dt className="text-slate-500 dark:text-slate-400">{t(`cycleV2.${key}`)}</dt>
                  <dd>
                    <CycleMoney
                      value={amount}
                      formatCurrency={formatCurrency}
                      className="text-slate-950 dark:text-white"
                    />
                  </dd>
                </div>
              ))}
            </dl>
            {Number(loan.outstanding) <= 0 && (
              <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500 dark:bg-slate-950/50 dark:text-slate-400">
                {t('cycleV2.loanNoRemaining')}
              </p>
            )}
            <details className="group mt-4 border-t border-slate-100 dark:border-slate-800">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 text-sm text-indigo-700 dark:text-indigo-300 [&::-webkit-details-marker]:hidden">
                <span>{t('cycleV2.paymentCount', { count: loan.paymentCount })}</span>
                <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
              </summary>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {(loan.payments || []).map((payment, paymentIndex) => (
                  <div key={paymentIndex} className="flex justify-between gap-3 py-2 text-sm">
                    <span className="text-slate-500 dark:text-slate-400">
                      {formatCycleDay(payment.date, language)}
                    </span>
                    <CycleMoney
                      value={Number(payment.amount)}
                      formatCurrency={formatCurrency}
                      className="text-slate-900 dark:text-white"
                    />
                  </div>
                ))}
              </div>
            </details>
          </article>
        ))}
      </div>
      {!loans.length && (
        <CycleEmpty title={t('cycleV2.noDetectedLoans')} hint={t('cycleV2.noLoansHint')} />
      )}
      <button
        type="button"
        onClick={onManageRecurring}
        className={`${cycleButton} bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300`}
      >
        {t('cycleV2.manageRepayments')}
      </button>
    </section>
  );
}
