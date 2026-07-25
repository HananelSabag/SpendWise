import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Gauge,
  Loader2,
  Pencil,
  Save,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

import { cn } from '../../../utils/helpers';
import { useBankBalance } from '../../../hooks/useBankBalance';
import { getCycleProjection } from '../../../utils/cycleProjection';
import { getOverdraftRunway } from '../../../utils/overdraftRunway';

const TONES = {
  safe: {
    panel: 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/60 dark:bg-emerald-950/20',
    icon: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    title: 'text-emerald-800 dark:text-emerald-200',
    bar: 'bg-emerald-500',
  },
  using: {
    panel: 'border-indigo-200 bg-indigo-50/80 dark:border-indigo-900/60 dark:bg-indigo-950/20',
    icon: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
    title: 'text-indigo-800 dark:text-indigo-200',
    bar: 'bg-indigo-500',
  },
  warning: {
    panel: 'border-amber-300 bg-amber-50 dark:border-amber-900/70 dark:bg-amber-950/25',
    icon: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
    title: 'text-amber-900 dark:text-amber-200',
    bar: 'bg-amber-500',
  },
  exceeded: {
    panel: 'border-rose-300 bg-rose-50 dark:border-rose-900/70 dark:bg-rose-950/25',
    icon: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
    title: 'text-rose-800 dark:text-rose-200',
    bar: 'bg-rose-500',
  },
};

function statusText(runway, formatCurrency, t) {
  if (runway.status === 'exceeded') {
    return t('overdraft.exceeded', { amount: formatCurrency(runway.exceededBy) });
  }
  if (runway.status === 'warning') {
    return t('overdraft.warning', { amount: formatCurrency(runway.remaining) });
  }
  if (runway.status === 'using') {
    return t('overdraft.remaining', { amount: formatCurrency(runway.remaining) });
  }
  return t('overdraft.safe', { amount: formatCurrency(runway.remaining) });
}

function ScenarioRow({ label, balance, runway, active, formatCurrency, t, icon: Icon }) {
  return (
    <div className={cn(
      'rounded-2xl border p-3 transition',
      active
        ? 'border-indigo-200 bg-white shadow-sm dark:border-indigo-700/60 dark:bg-slate-900'
        : 'border-slate-200/80 bg-white/60 dark:border-slate-800 dark:bg-slate-900/50',
    )}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 text-xs font-black text-slate-700 dark:text-slate-200">
          <Icon className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
          <span className="truncate">{label}</span>
        </span>
        {active && (
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[9px] font-black text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            {t('overdraft.activeScenario')}
          </span>
        )}
      </div>
      <p className={cn(
        'mt-2 whitespace-nowrap text-lg font-black tabular-nums',
        runway.status === 'exceeded'
          ? 'text-rose-600 dark:text-rose-300'
          : 'text-slate-950 dark:text-white',
      )}>
        {formatCurrency(balance)}
      </p>
      <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
        {runway.status === 'exceeded'
          ? t('overdraft.scenarioExceeded', { amount: formatCurrency(runway.exceededBy) })
          : t('overdraft.scenarioRoom', { amount: formatCurrency(runway.remaining) })}
      </p>
    </div>
  );
}

export default function OverdraftRunwayCard({
  cycle,
  settings,
  formatCurrency,
  t,
  onSaveLimit,
  isSaving = false,
}) {
  const { hasRealBalance, totalRealBalance, multiAccount } = useBankBalance();
  const configured = settings?.overdraftLimit !== null && settings?.overdraftLimit !== undefined;
  const [editing, setEditing] = useState(!configured);
  const [draft, setDraft] = useState(configured ? String(settings.overdraftLimit) : '');

  useEffect(() => {
    if (!editing && configured) setDraft(String(settings.overdraftLimit));
  }, [configured, editing, settings?.overdraftLimit]);

  const projection = useMemo(
    () => getCycleProjection(
      cycle?.forwardReset || {},
      hasRealBalance ? Number(totalRealBalance) : null,
    ),
    [cycle?.forwardReset, hasRealBalance, totalRealBalance],
  );
  const knownRunway = getOverdraftRunway(projection.afterKnown, settings?.overdraftLimit);
  const forecastRunway = getOverdraftRunway(projection.forecast, settings?.overdraftLimit);
  const useEstimates = settings?.useEstimates !== false;
  const activeRunway = useEstimates ? forecastRunway : knownRunway;
  const tone = TONES[activeRunway.status] || TONES.using;
  const progress = Number.isFinite(activeRunway.usedPercent)
    ? Math.min(100, Math.max(0, activeRunway.usedPercent))
    : 100;

  if (!cycle || !hasRealBalance) return null;

  const save = async (event) => {
    event.preventDefault();
    const value = Number(draft);
    if (!Number.isFinite(value) || value < 0 || value > 10_000_000) return;
    try {
      await onSaveLimit(value);
      setEditing(false);
    } catch (_) {
      // The shared cycle mutation restores the optimistic state and shows the
      // translated failure toast. Keep the form open so the user can retry.
    }
  };

  if (!configured || editing) {
    return (
      <section className="rounded-[1.75rem] border border-indigo-200 bg-gradient-to-br from-white via-indigo-50/70 to-violet-50 p-5 shadow-sm dark:border-indigo-900/60 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/70 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="rounded-2xl bg-indigo-100 p-2.5 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
            <Gauge className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-black text-slate-950 dark:text-white">
              {configured ? t('overdraft.editTitle') : t('overdraft.setupTitle')}
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
              {t(multiAccount ? 'overdraft.setupHintMultiple' : 'overdraft.setupHint')}
            </p>
          </div>
        </div>

        <form onSubmit={save} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">{t('overdraft.limitLabel')}</span>
            <input
              type="number"
              min="0"
              max="10000000"
              step="100"
              inputMode="decimal"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={t('overdraft.limitPlaceholder')}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 pe-10 text-base font-black tabular-nums text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
            <span className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">₪</span>
          </label>
          <button
            type="submit"
            disabled={isSaving || draft === '' || Number(draft) < 0}
            className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 text-sm font-black text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {t('overdraft.save')}
          </button>
          {configured && (
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="h-12 rounded-2xl px-4 text-sm font-black text-slate-500 hover:bg-white/70 dark:hover:bg-slate-800"
            >
              {t('overdraft.cancel')}
            </button>
          )}
        </form>
      </section>
    );
  }

  return (
    <section className={cn('rounded-[1.75rem] border p-5 shadow-sm sm:p-6', tone.panel)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className={cn('rounded-2xl p-2.5', tone.icon)}>
            {activeRunway.status === 'exceeded' || activeRunway.status === 'warning'
              ? <ShieldAlert className="h-5 w-5" />
              : <CheckCircle2 className="h-5 w-5" />}
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              {t('overdraft.eyebrow')}
            </p>
            <h2 className={cn('mt-1 text-lg font-black', tone.title)}>
              {statusText(activeRunway, formatCurrency, t)}
            </h2>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              {t('overdraft.limitSummary', { amount: formatCurrency(activeRunway.limit) })}
              {' · '}
              {useEstimates ? t('overdraft.basedOnForecast') : t('overdraft.basedOnKnown')}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="shrink-0 rounded-xl p-2 text-slate-500 transition hover:bg-white/70 hover:text-indigo-700 dark:hover:bg-slate-800"
          aria-label={t('overdraft.edit')}
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4">
        <div className="h-2 overflow-hidden rounded-full bg-white/80 shadow-inner dark:bg-slate-900/70">
          <div className={cn('h-full rounded-full transition-[width] duration-500', tone.bar)} style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
          <span>{t('overdraft.used', { amount: formatCurrency(activeRunway.used) })}</span>
          <span>{t('overdraft.limitShort', { amount: formatCurrency(activeRunway.limit) })}</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <ScenarioRow
          label={t('overdraft.knownScenario')}
          balance={projection.afterKnown}
          runway={knownRunway}
          active={!useEstimates}
          formatCurrency={formatCurrency}
          t={t}
          icon={CheckCircle2}
        />
        <ScenarioRow
          label={t('overdraft.forecastScenario')}
          balance={projection.forecast}
          runway={forecastRunway}
          active={useEstimates}
          formatCurrency={formatCurrency}
          t={t}
          icon={Sparkles}
        />
      </div>

      <p className="mt-3 text-[10px] leading-4 text-slate-500 dark:text-slate-400">
        {t('overdraft.disclaimer')}
      </p>
    </section>
  );
}
