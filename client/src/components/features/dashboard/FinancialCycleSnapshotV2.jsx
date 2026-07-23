import React from 'react';
import { ArrowRight, CalendarDays, CreditCard, Landmark, Sparkles, TrendingUp, WalletCards } from 'lucide-react';

import { cn } from '../../../utils/helpers';
import { formatCycleWindow, signedCurrency } from '../../../utils/cycleFormat';
import { useBankBalance } from '../../../hooks/useBankBalance';
import { getCycleProjection } from '../../../utils/cycleProjection';

function Money({ value, formatCurrency, className }) {
  return (
    <span className={cn('whitespace-nowrap tabular-nums', className)}>
      {Number.isFinite(value) ? formatCurrency(value) : '—'}
    </span>
  );
}

function MiniMetric({ label, value, formatCurrency, tone = 'default' }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/70 bg-white/70 p-3 shadow-sm backdrop-blur dark:border-white/5 dark:bg-white/5">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <Money
        value={value}
        formatCurrency={formatCurrency}
        className={cn('mt-1 block text-base font-black', tone === 'positive' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white')}
      />
    </div>
  );
}

export default function FinancialCycleSnapshotV2({
  cycle,
  settings,
  isLoading,
  needsSalaryLink,
  needsCycleAnchor,
  formatCurrency,
  language,
  t,
  onOpen,
}) {
  const { hasRealBalance, totalRealBalance } = useBankBalance();

  if (isLoading && !cycle) {
    return <div className="h-72 animate-pulse rounded-[1.75rem] bg-slate-200/70 dark:bg-slate-800/70" />;
  }

  if (!cycle || needsSalaryLink || needsCycleAnchor) {
    return (
      <section className="overflow-hidden rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-xl shadow-slate-900/10">
        <WalletCards className="h-6 w-6 text-indigo-300" />
        <h2 className="mt-4 text-lg font-black">{t(needsCycleAnchor ? 'cycleV2.anchorTitle' : 'cycleV2.incomeTitle')}</h2>
        <p className="mt-1 max-w-md text-sm text-slate-300">{t(needsCycleAnchor ? 'cycleV2.anchorHint' : 'cycleV2.incomeHint')}</p>
        <button type="button" onClick={onOpen} className="mt-5 rounded-xl bg-white px-4 py-2 text-sm font-black text-slate-950">
          {t('cycleV2.openSetup')}
        </button>
      </section>
    );
  }

  const reset = cycle.forwardReset || {};
  const now = hasRealBalance ? Number(totalRealBalance) : null;
  const projection = getCycleProjection(reset, now);
  const useEstimate = settings?.useEstimates !== false;
  const headline = useEstimate ? projection.forecast : projection.afterKnown;

  return (
    <section className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-5 text-white shadow-xl shadow-slate-900/15 sm:p-6">
      <div className="pointer-events-none absolute -end-16 -top-20 h-52 w-52 rounded-full bg-indigo-500/25 blur-3xl" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-300">{t('cycleV2.dashboardEyebrow')}</p>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatCycleWindow(cycle.window, language)}
            </div>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold text-slate-300">
            {useEstimate ? t('cycleV2.estimateOn') : t('cycleV2.estimateOff')}
          </span>
        </div>

        <p className="mt-7 text-xs font-semibold text-slate-400">{useEstimate ? t('cycleV2.balanceAfterForecast') : t('cycleV2.balanceAfterKnown')}</p>
        <Money
          value={headline}
          formatCurrency={formatCurrency}
          className={cn('mt-1 block text-4xl font-black tracking-tight sm:text-5xl', Number(headline) < 0 ? 'text-rose-300' : 'text-white')}
        />

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <MiniMetric label={t('cycleV2.balanceNow')} value={now} formatCurrency={formatCurrency} />
          <MiniMetric label={t('cycleV2.afterKnown')} value={projection.afterKnown} formatCurrency={formatCurrency} />
          <MiniMetric label={t('cycleV2.knownExpenses')} value={-(projection.knownCardOut + projection.knownFixedOut)} formatCurrency={formatCurrency} />
        </div>

        <div className="mt-4 grid gap-2 text-xs text-slate-300 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-indigo-300" /><span>{t('cycleV2.cardsKnown')} <strong className="whitespace-nowrap text-white">{signedCurrency(-projection.knownCardOut, formatCurrency)}</strong></span></div>
          <div className="flex items-center gap-2"><Landmark className="h-4 w-4 text-indigo-300" /><span>{t('cycleV2.fixedOut')} <strong className="whitespace-nowrap text-white">{signedCurrency(-projection.knownFixedOut, formatCurrency)}</strong></span></div>
          {useEstimate && projection.expectedIncome > 0 && <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-300" /><span>{t('cycleV2.expectedIncome')} <strong className="whitespace-nowrap text-emerald-200">{signedCurrency(projection.expectedIncome, formatCurrency, { signPositive: true })}</strong></span></div>}
          {useEstimate && projection.forecastExtraOut > 0 && <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-amber-300" /><span>{t('cycleV2.possibleGrowth')} <strong className="whitespace-nowrap text-white">{signedCurrency(-projection.forecastExtraOut, formatCurrency)}</strong></span></div>}
        </div>

        <button type="button" onClick={onOpen} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm font-black text-slate-950 transition hover:bg-indigo-50">
          {t('cycleV2.openDetails')}<ArrowRight className="h-4 w-4 rtl:rotate-180" />
        </button>
      </div>
    </section>
  );
}
