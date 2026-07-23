import React, { useState } from 'react';
import { ChevronDown, CheckCircle2, CreditCard, Landmark, Sparkles } from 'lucide-react';

import { cn } from '../../../utils/helpers';
import { formatCycleDay } from '../../../utils/cycleDate';
import { signedCurrency } from '../../../utils/cycleFormat';

function ExpenseRow({ item, formatCurrency, language, t, estimate = false }) {
  const Icon = item.kind === 'card' ? CreditCard : Landmark;
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-3 dark:bg-slate-800/65">
      <span className={cn('rounded-xl p-2', estimate ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300')}><Icon className="h-4 w-4" /></span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-black text-slate-900 dark:text-white">{item.label || t('cycleV2.knownExpense')}</p>
        <p className="mt-0.5 text-[10px] text-slate-400">{formatCycleDay(item.date, language)} · {estimate ? t('cycleV2.forecastOnly') : t('cycleV2.linkedKnown')}</p>
      </div>
      <strong className="shrink-0 whitespace-nowrap text-sm tabular-nums text-slate-900 dark:text-white">{signedCurrency(Number(estimate ? (item.estimatedAmount ?? item.amount) : item.amount), formatCurrency)}</strong>
    </div>
  );
}

export default function CycleKnownExpensesPanelV2({
  cycle,
  useEstimates = true,
  formatCurrency,
  language,
  t,
}) {
  const [showForecast, setShowForecast] = useState(false);
  const stages = (cycle?.forwardReset?.stages || []).filter((item) => Number(item.amount) < 0);
  const isKnown = (item) => ['known', 'proven'].includes(item.certainty)
    || (item.kind === 'card' && Math.abs(Number(item.amount) || 0) > 0);
  const known = stages.filter(isKnown);
  const forecastOnly = stages.filter((item) => !isKnown(item));
  const cardGrowth = stages
    .filter((item) => item.kind === 'card' && Math.abs(Number(item.estimatedAmount || 0)) > Math.abs(Number(item.amount || 0)))
    .map((item) => ({
      ...item,
      amount: -(Math.abs(Number(item.estimatedAmount)) - Math.abs(Number(item.amount))),
      estimatedAmount: -(Math.abs(Number(item.estimatedAmount)) - Math.abs(Number(item.amount))),
      label: `${item.label} · ${t('cycleV2.possibleGrowth')}`,
    }));
  const uncertain = [...forecastOnly, ...cardGrowth];
  const knownTotal = known.reduce((sum, item) => sum + Math.abs(Number(item.amount) || 0), 0);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-600" /><h2 className="text-base font-black text-slate-950 dark:text-white">{t('cycleV2.knownExpensesTitle')}</h2></div>
          <p className="mt-1 text-xs text-slate-500">{t('cycleV2.knownExpensesHint')}</p>
        </div>
        <strong className="whitespace-nowrap text-lg font-black tabular-nums text-slate-950 dark:text-white">{formatCurrency(knownTotal)}</strong>
      </div>

      <div className="mt-4 space-y-2">
        {known.map((item) => <ExpenseRow key={`${item.kind}-${item.date}-${item.label}`} item={item} formatCurrency={formatCurrency} language={language} t={t} />)}
        {!known.length && <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-center text-xs text-slate-500 dark:border-slate-700">{t('cycleV2.noKnownExpenses')}</p>}
      </div>

      {useEstimates && uncertain.length > 0 && (
        <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
          <button type="button" onClick={() => setShowForecast((open) => !open)} aria-expanded={showForecast} className="flex w-full items-center gap-2 rounded-xl px-1 py-1 text-start text-xs font-black text-amber-700 dark:text-amber-300">
            <Sparkles className="h-4 w-4" />
            <span className="flex-1">{t('cycleV2.forecastExpenses', { count: uncertain.length })}</span>
            <ChevronDown className={cn('h-4 w-4 transition', showForecast && 'rotate-180')} />
          </button>
          {showForecast && <div className="mt-2 space-y-2">{uncertain.map((item, index) => <ExpenseRow key={`${item.kind}-${item.date}-${item.label}-${index}`} item={item} formatCurrency={formatCurrency} language={language} t={t} estimate />)}</div>}
        </div>
      )}
    </section>
  );
}
