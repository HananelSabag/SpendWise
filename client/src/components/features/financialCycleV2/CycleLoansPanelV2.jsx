import React from 'react';
import { Coins, Landmark, Loader2 } from 'lucide-react';

import { useCycles } from '../../../hooks/useCycles';
import { formatCycleDay } from '../../../utils/cycleDate';
import { signedCurrency } from '../../../utils/cycleFormat';
import { InfoHint } from '../../ui';

function Progress({ repaid, principal }) {
  const percent = principal > 0 ? Math.min(100, Math.round((repaid / principal) * 100)) : 0;
  return <div className="mt-2"><div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-violet-500" style={{ width: `${percent}%` }} /></div><p className="mt-1 text-[10px] text-slate-400">{percent}%</p></div>;
}

export default function CycleLoansPanelV2({ formatCurrency, language, t }) {
  const details = useCycles();
  if (details.isLoading) return <div className="flex items-center justify-center gap-2 rounded-3xl bg-white p-10 text-sm text-slate-500 dark:bg-slate-900"><Loader2 className="h-4 w-4 animate-spin" />{t('cycleV2.loadingLoans')}</div>;
  const loans = (details.loans || []).filter((loan) => Number(loan.principal) > 0);
  const recurring = details.recurring || [];
  return (
    <section className="space-y-3">
      <div className="mb-4"><div className="flex items-center gap-2"><Landmark className="h-5 w-5 text-violet-600" /><h2 className="text-xl font-black text-slate-950 dark:text-white">{t('cycleV2.loansTitle')}</h2></div><p className="mt-1 text-xs text-slate-500">{t('cycleV2.loansSourceHint')}</p></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <p className="flex items-center gap-1 text-xs font-semibold text-slate-500"><Landmark className="h-3.5 w-3.5" />{t('cycle.totalOutstanding')}<InfoHint title={t('cycle.totalOutstanding')}>{t('cycle.debtHint')}</InfoHint></p>
        <p className="mt-1 text-2xl font-black tabular-nums text-slate-900 dark:text-white">{formatCurrency(details.totalOutstanding || 0)}</p>
        <p className="mt-0.5 text-[11px] text-slate-400">{t('cycleV2.detectedLoans', { count: loans.length })}</p>
      </div>
      {loans.map((loan) => <article key={loan.identifier} className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900 dark:text-white">{loan.description || t('cycle.loan')}</p><p className="mt-0.5 text-[11px] text-slate-400">{formatCurrency(loan.principal)} · {formatCycleDay(loan.disbursedOn, language)} · {t('cycle.payDay')} {loan.paymentDay}</p></div><div className="shrink-0 text-end"><p className="text-lg font-black tabular-nums text-slate-900 dark:text-white">{formatCurrency(loan.outstanding)}</p><p className="text-[10px] text-slate-400">{t('cycle.left')}</p></div></div><Progress repaid={loan.repaid} principal={loan.principal} /><p className="mt-1 text-[11px] text-slate-500">{t('cycle.repaid')} {formatCurrency(loan.repaid)} · {t('cycleV2.paymentCount', { count: loan.paymentCount })}</p></article>)}
      {recurring.length > 0 && <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"><p className="flex items-center gap-1 text-xs font-semibold text-slate-500"><Coins className="h-3.5 w-3.5" />{t('cycle.needsLabel')}<InfoHint title={t('cycle.needsLabel')}>{t('cycle.needsLabelHint')}</InfoHint></p><div className="mt-2 space-y-1">{recurring.map((series) => <div key={series.identifier} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60"><div className="min-w-0"><p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">{series.description}</p><p className="text-[10px] text-slate-400">{t('cycle.payDay')} {series.paymentDay} · {series.occurrences}×</p></div><p className="shrink-0 text-xs font-black tabular-nums text-slate-900 dark:text-white">{signedCurrency(-series.typicalAmount, formatCurrency)}</p></div>)}</div></div>}
      {!loans.length && !recurring.length && <p className="py-8 text-center text-sm text-slate-500">{t('cycle.noDebts')}</p>}
    </section>
  );
}
