import React from 'react';
import { ArrowDown, CheckCircle2, Landmark, Sparkles, TrendingUp, Wallet } from 'lucide-react';

import { cn } from '../../../utils/helpers';
import { useBankBalance } from '../../../hooks/useBankBalance';
import { signedCurrency } from '../../../utils/cycleFormat';
import { getCycleProjection } from '../../../utils/cycleProjection';

function BalanceStep({ icon: Icon, label, value, hint, formatCurrency, emphasis = false }) {
  return (
    <div className={cn(
      'min-w-0 rounded-2xl border p-4',
      emphasis
        ? 'border-indigo-200 bg-indigo-600 text-white shadow-lg shadow-indigo-600/15 dark:border-indigo-500/40'
        : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900',
    )}>
      <div className="flex items-center gap-2">
        <span className={cn('rounded-xl p-2', emphasis ? 'bg-white/15' : 'bg-slate-100 text-slate-500 dark:bg-slate-800')}><Icon className="h-4 w-4" /></span>
        <p className={cn('text-xs font-bold', emphasis ? 'text-indigo-100' : 'text-slate-500')}>{label}</p>
      </div>
      <p className={cn('mt-4 whitespace-nowrap text-2xl font-black tracking-tight tabular-nums', !emphasis && 'text-slate-950 dark:text-white')}>
        {Number.isFinite(value) ? formatCurrency(value) : '—'}
      </p>
      <p className={cn('mt-1 text-[11px]', emphasis ? 'text-indigo-100' : 'text-slate-400')}>{hint}</p>
    </div>
  );
}

export default function CyclePositionPanelV2({
  cycle,
  settings,
  formatCurrency,
  t,
  onEstimateChange,
  isSaving,
}) {
  const { hasRealBalance, totalRealBalance, someBalancesUnavailable } = useBankBalance();
  const reset = cycle?.forwardReset || {};
  const now = hasRealBalance ? Number(totalRealBalance) : null;
  const projection = getCycleProjection(reset, now);
  const useEstimates = settings?.useEstimates !== false;
  const alreadyDirect = Number(cycle?.expenses?.direct) || 0;
  const settledCard = Math.abs((cycle?.expenses?.events || [])
    .filter((event) => !event.future && !event.accruing)
    .reduce((sum, event) => sum + Number(event.total || 0), 0));

  return (
    <section aria-labelledby="cycle-position-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">{t('cycleV2.positionEyebrow')}</p>
          <h2 id="cycle-position-heading" className="mt-1 text-xl font-black text-slate-950 dark:text-white">{t('cycleV2.positionTitle')}</h2>
        </div>
        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-start">
            <span className="block text-xs font-black text-slate-800 dark:text-white">{t('cycleV2.useEstimate')}</span>
            <span className="block text-[10px] text-slate-400">{isSaving ? t('cycleV2.saving') : t('cycleV2.estimateHint')}</span>
          </span>
          <input
            type="checkbox"
            checked={useEstimates}
            onChange={(event) => onEstimateChange(event.target.checked)}
            className="peer sr-only"
          />
          <span className="relative h-6 w-11 shrink-0 rounded-full bg-slate-200 transition peer-checked:bg-indigo-600 dark:bg-slate-700 after:absolute after:start-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5 rtl:peer-checked:after:-translate-x-5" />
        </label>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <BalanceStep icon={Wallet} label={t('cycleV2.balanceNow')} value={now} hint={someBalancesUnavailable ? t('cycleV2.partialBalance') : t('cycleV2.liveBankBalance')} formatCurrency={formatCurrency} />
        <BalanceStep icon={CheckCircle2} label={t('cycleV2.afterKnown')} value={projection.afterKnown} hint={t('cycleV2.afterKnownHint')} formatCurrency={formatCurrency} />
        <BalanceStep icon={Sparkles} label={t('cycleV2.forecast')} value={useEstimates ? projection.forecast : projection.afterKnown} hint={useEstimates ? t('cycleV2.forecastHint') : t('cycleV2.forecastOffHint')} formatCurrency={formatCurrency} emphasis />
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center justify-between rounded-2xl bg-emerald-50 px-3 py-2.5 text-emerald-800 dark:bg-emerald-950/25 dark:text-emerald-300"><span className="flex items-center gap-1.5 text-xs font-bold"><CheckCircle2 className="h-3.5 w-3.5" />{t('cycleV2.alreadyDeducted')}</span><strong className="whitespace-nowrap text-sm tabular-nums">{signedCurrency(-(settledCard + alreadyDirect), formatCurrency)}</strong></div>
        <div className="flex items-center justify-between rounded-2xl bg-slate-100 px-3 py-2.5 text-slate-800 dark:bg-slate-800 dark:text-slate-100"><span className="flex items-center gap-1.5 text-xs font-bold"><ArrowDown className="h-3.5 w-3.5" />{t('cycleV2.cardsKnown')}</span><strong className="whitespace-nowrap text-sm tabular-nums">{signedCurrency(-projection.knownCardOut, formatCurrency)}</strong></div>
        <div className="flex items-center justify-between rounded-2xl bg-slate-100 px-3 py-2.5 text-slate-800 dark:bg-slate-800 dark:text-slate-100"><span className="flex items-center gap-1.5 text-xs font-bold"><Landmark className="h-3.5 w-3.5" />{t('cycleV2.fixedOut')}</span><strong className="whitespace-nowrap text-sm tabular-nums">{signedCurrency(-projection.knownFixedOut, formatCurrency)}</strong></div>
        {useEstimates && projection.expectedIncome > 0 && <div className="flex items-center justify-between rounded-2xl bg-emerald-50 px-3 py-2.5 text-emerald-800 dark:bg-emerald-950/25 dark:text-emerald-300"><span className="flex items-center gap-1.5 text-xs font-bold"><TrendingUp className="h-3.5 w-3.5" />{t('cycleV2.expectedIncome')}</span><strong className="whitespace-nowrap text-sm tabular-nums">{signedCurrency(projection.expectedIncome, formatCurrency, { signPositive: true })}</strong></div>}
        {useEstimates && projection.forecastExtraOut > 0 && <div className="flex items-center justify-between rounded-2xl bg-amber-50 px-3 py-2.5 text-amber-900 dark:bg-amber-950/25 dark:text-amber-200"><span className="text-xs font-bold">{t('cycleV2.estimateExtra')}</span><strong className="whitespace-nowrap text-sm tabular-nums">{signedCurrency(-projection.forecastExtraOut, formatCurrency)}</strong></div>}
      </div>
    </section>
  );
}
