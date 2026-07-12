import React, { useMemo } from 'react';
import {
  ArrowRight, CheckCircle2, Clock3, EyeOff, Layers3, RefreshCw,
  AlertTriangle, ShieldCheck, SlidersHorizontal, Sparkles,
} from 'lucide-react';

import { cn } from '../../../utils/helpers';
import { buildBankSyncOverview } from '../../../utils/bankSyncOverview';
import { BankIcon, StatusBadge } from './BankBits';
import { formatDateTime } from './bankSyncMeta';

function Metric({ value, label, tone = 'default' }) {
  const toneClass = tone === 'good'
    ? 'text-emerald-600 dark:text-emerald-400'
    : tone === 'brand'
      ? 'text-indigo-600 dark:text-indigo-300'
      : tone === 'warning'
        ? 'text-amber-600 dark:text-amber-300'
        : 'text-gray-950 dark:text-white';
  return (
    <div className="min-w-0 rounded-xl bg-gray-50 px-3 py-2.5 dark:bg-gray-800/60">
      <p className={cn('text-lg font-black tabular-nums', toneClass)}>{value}</p>
      <p className="mt-0.5 truncate text-[10px] font-medium text-gray-500">{label}</p>
    </div>
  );
}

export default function BankSyncOverview({
  connections,
  sources,
  autoSync,
  currentLanguage,
  t,
  onManageAccounts,
}) {
  const overview = useMemo(
    () => buildBankSyncOverview(connections, sources),
    [connections, sources],
  );
  const allHealthy = overview.connectionCount > 0
    && overview.issueCount === 0
    && overview.workingCount === 0;
  const HealthIcon = overview.issueCount > 0 ? AlertTriangle : overview.workingCount > 0 ? RefreshCw : CheckCircle2;
  const healthTitle = overview.issueCount > 0
    ? t('overview.needsAttention')
    : overview.workingCount > 0
      ? t('overview.syncingNow')
      : t('overview.allCurrent');

  if (!connections.length) {
    return (
      <button
        type="button"
        onClick={onManageAccounts}
        className="w-full rounded-2xl border-2 border-dashed border-indigo-300 bg-white p-10 text-center font-bold text-indigo-600 dark:bg-gray-900"
      >
        {t('overview.connectFirst')}
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
              overview.issueCount > 0
                ? 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-300'
                : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300',
            )}>
              <HealthIcon className={cn(
                'h-5 w-5',
                overview.issueCount === 0 && overview.workingCount > 0 && 'animate-spin',
              )} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-black text-gray-950 dark:text-white">{healthTitle}</p>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">
                {t(allHealthy ? 'overview.healthyBody' : 'overview.statusBody')}
              </p>
              {overview.lastSync && (
                <p className="mt-1.5 text-[11px] text-gray-400">
                  {t('overview.lastSystemSync', { time: formatDateTime(overview.lastSync, currentLanguage) })}
                </p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-xl bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-200">
            <Clock3 className="h-4 w-4" />
            {t(autoSync.tomorrow ? 'nextAutoSyncTomorrow' : 'nextAutoSync', { time: autoSync.time })}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric value={overview.connectionCount} label={t('overview.connectedSources')} />
          <Metric
            value={overview.accountCount ? `${overview.enabledAccountCount}/${overview.accountCount}` : '—'}
            label={t('overview.includedAccounts')}
            tone="good"
          />
          <Metric value={overview.newCount} label={t('overview.newImported')} tone="brand" />
          <Metric
            value={overview.issueCount}
            label={t('overview.needAttention')}
            tone={overview.issueCount ? 'warning' : 'default'}
          />
        </div>

        <div className="mt-3 flex flex-col gap-3 rounded-xl border border-indigo-100 bg-indigo-50/60 px-3 py-3 dark:border-indigo-900/60 dark:bg-indigo-950/20 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-2.5">
            {overview.disabledAccountCount > 0 ? <EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /> : <SlidersHorizontal className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />}
            <div>
              <p className="text-xs font-bold text-gray-900 dark:text-white">{t('overview.dashboardScopeTitle')}</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-gray-500">
                {overview.disabledAccountCount > 0
                  ? t('overview.excludedAccounts', { count: overview.disabledAccountCount })
                  : t('overview.allAccountsIncluded')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onManageAccounts}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-indigo-700"
          >
            {t('overview.manageScope')}<ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <div>
            <h2 className="text-sm font-black text-gray-950 dark:text-white">{t('overview.sourcesTitle')}</h2>
            <p className="text-[11px] text-gray-500">{t('overview.sourcesSubtitle')}</p>
          </div>
          <span className="text-[10px] font-semibold text-gray-400">{t('overview.processedTotal', { count: overview.processedCount })}</span>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {overview.institutions.map((item) => (
            <button
              key={item.connection.id}
              type="button"
              onClick={onManageAccounts}
              className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60"
            >
              <BankIcon source={item.connection.bank_source} size="sm" />
              <div className="min-w-0">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-bold text-gray-950 dark:text-white">
                    {item.connection.institution_label || t(`bankNames.${item.connection.bank_source}`)}
                  </p>
                  <StatusBadge status={item.connection.status} t={t} />
                </div>
                <p className="mt-0.5 truncate text-[11px] text-gray-500">
                  {item.accountCount
                    ? t('overview.sourceScope', { enabled: item.enabledAccountCount, total: item.accountCount })
                    : t('overview.waitingForAccounts')}
                </p>
              </div>
              <div className="text-end">
                <p className="text-sm font-black tabular-nums text-indigo-600 dark:text-indigo-300">+{item.added}</p>
                <p className="text-[9px] text-gray-400">{t('overview.newShort')}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-indigo-500" />
          <h2 className="text-sm font-black text-gray-950 dark:text-white">{t('overview.cleanTotalsTitle')}</h2>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {[
            [Layers3, 'overview.bankFactTitle', 'overview.bankFactBody'],
            [Sparkles, 'overview.cardFactTitle', 'overview.cardFactBody'],
            [ShieldCheck, 'overview.dedupeTitle', 'overview.dedupeBody'],
          ].map(([Icon, titleKey, bodyKey]) => (
            <div key={titleKey} className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/60">
              <Icon className="h-4 w-4 text-indigo-500" />
              <p className="mt-2 text-xs font-bold text-gray-900 dark:text-white">{t(titleKey)}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-gray-500">{t(bodyKey)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
