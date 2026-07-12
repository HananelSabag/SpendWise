import React, { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, AlertCircle, Bot, HelpCircle, Landmark, RefreshCw } from 'lucide-react';

import { useAuth, useTranslation } from '../stores';
import apiClient from '../api/client';
import bankConnectionsApi from '../api/bankConnections';
import { cn } from '../utils/helpers';
import BrandMark from '../components/common/BrandMark';
import { LiquidTabs } from '../components/ui';
import BankConnectionGroup from '../components/features/bankSync/BankConnectionGroup';
import ConnectBankModal from '../components/features/bankSync/ConnectBankModal';
import SyncMethodPanel from '../components/features/bankSync/SyncMethodPanel';
import HowItWorksPanel from '../components/features/bankSync/HowItWorksPanel';
import { institutionKind, nextAutoSync, formatDateTime } from '../components/features/bankSync/bankSyncMeta';
import { BankIcon, StatusBadge } from '../components/features/bankSync/BankBits';

const TABS = [
  ['overview', Activity],
  ['accounts', Landmark],
  ['agent', Bot],
  ['help', HelpCircle],
];
const EMPTY_LIST = [];

const split = (items, sourceKey) => items.reduce((result, item) => {
  result[institutionKind(item[sourceKey]) === 'credit_card' ? 'cards' : 'banks'].push(item);
  return result;
}, { banks: [], cards: [] });

export default function BankSyncPageV2() {
  const { t, currentLanguage } = useTranslation('bankSync');
  const { user } = useAuth();
  const he = currentLanguage === 'he';
  const [tab, setTab] = useState('overview');
  const [showConnect, setShowConnect] = useState(false);
  const [connectKind, setConnectKind] = useState(null);
  const [initialBank, setInitialBank] = useState(null);

  const connectionsQuery = useQuery({
    queryKey: ['bankConnections', user?.id],
    queryFn: bankConnectionsApi.list,
    staleTime: 30_000,
  });
  const statsQuery = useQuery({
    queryKey: ['bankSyncStats', user?.id, 0],
    queryFn: () => apiClient.get('/bank-sync/stats', { params: { periodOffset: 0 } }).then((r) => r.data),
    staleTime: 60_000,
  });
  const connections = connectionsQuery.data || EMPTY_LIST;
  const sources = statsQuery.data?.sources || EMPTY_LIST;
  const groupedConnections = useMemo(() => split(connections, 'bank_source'), [connections]);
  const auto = nextAutoSync();
  const overview = useMemo(() => connections.reduce((summary, connection) => {
    const result = connection.latest_job_result || {};
    summary.added += Number(result.inserted ?? result.new_transactions ?? result.imported ?? 0);
    if (connection.status === 'error' || connection.latest_job_status === 'failed') summary.issues += 1;
    else if (connection.latest_job_status === 'running' || connection.latest_job_status === 'pending') summary.working += 1;
    else summary.ready += 1;
    if (connection.last_sync_at && (!summary.lastSync || new Date(connection.last_sync_at) > new Date(summary.lastSync))) summary.lastSync = connection.last_sync_at;
    return summary;
  }, { added: 0, issues: 0, working: 0, ready: 0, lastSync: null }), [connections]);

  const openConnect = useCallback((bank = null, kind = null) => {
    setInitialBank(bank);
    setConnectKind(kind);
    setShowConnect(true);
  }, []);
  const refresh = () => Promise.all([connectionsQuery.refetch(), statsQuery.refetch()]);
  const handleTabChange = useCallback((nextTab) => {
    setTab(nextTab);
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }));
  }, []);

  const tabLabel = (key) => ({
    overview: he ? 'סקירה' : 'Overview',
    accounts: he ? 'חשבונות' : 'Accounts',
    agent: he ? 'סוכן פרטי' : 'Private agent',
    help: he ? 'עזרה' : 'Help',
  }[key]);

  return (
    <div className="min-h-screen bg-gray-50 pb-24 dark:bg-gray-950 lg:pb-10">
      <header className="sticky top-0 z-30 border-b border-gray-200/70 bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-gray-900/90">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 lg:px-8">
          <BrandMark size="md" />
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-gray-950 dark:text-white">{t('title')}</h1>
            <p className="truncate text-xs text-gray-500">{t(auto.tomorrow ? 'nextAutoSyncTomorrow' : 'nextAutoSync', { time: auto.time })}</p>
          </div>
          <button onClick={refresh} className="rounded-xl p-2 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label={t('refresh')}><RefreshCw className={cn('h-4 w-4', (connectionsQuery.isFetching || statsQuery.isFetching) && 'animate-spin')} /></button>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-2 lg:px-8">
          <LiquidTabs
            tabs={TABS.map(([key, Icon]) => ({ id: key, label: tabLabel(key), icon: Icon }))}
            active={tab}
            onChange={handleTabChange}
            size="sm"
            fill
          />
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-5 lg:px-8">
        {(connectionsQuery.isError || statsQuery.isError) && <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle className="h-4 w-4" />{t('loadError')}</div>}

        {tab === 'overview' && (
          <div className="space-y-4">
            {connections.length > 0 && (
              <section className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="grid grid-cols-2 gap-px bg-gray-100 dark:bg-gray-800 sm:grid-cols-4">
                  {[
                    [connections.length, he ? 'חיבורים' : 'Connections', 'text-gray-950 dark:text-white'],
                    [overview.ready, he ? 'מוכנים' : 'Ready', 'text-emerald-600 dark:text-emerald-400'],
                    [overview.added, he ? 'חדשות בסנכרון האחרון' : 'New in last sync', 'text-indigo-600 dark:text-indigo-400'],
                    [overview.issues, he ? 'דורשים טיפול' : 'Need attention', overview.issues ? 'text-red-600 dark:text-red-400' : 'text-gray-950 dark:text-white'],
                  ].map(([value, label, valueClass]) => (
                    <div key={label} className="bg-white px-4 py-3 dark:bg-gray-900">
                      <p className={cn('text-xl font-black tabular-nums', valueClass)}>{value}</p>
                      <p className="mt-0.5 text-[10px] font-medium text-gray-500">{label}</p>
                    </div>
                  ))}
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {connections.map((connection) => {
                    const result = connection.latest_job_result || {};
                    const added = Number(result.inserted ?? result.new_transactions ?? result.imported ?? 0);
                    const processed = Number(result.processed ?? result.transactions ?? result.total ?? (added + Number(result.skipped || 0)));
                    const isWorking = ['pending', 'running'].includes(connection.latest_job_status);
                    return (
                      <button
                        key={connection.id}
                        type="button"
                        onClick={() => handleTabChange('accounts')}
                        className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60"
                      >
                        <BankIcon source={connection.bank_source} size="sm" />
                        <div className="min-w-0">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-bold text-gray-950 dark:text-white">
                              {connection.institution_label || t(`bankNames.${connection.bank_source}`)}
                            </p>
                            <StatusBadge status={connection.status} t={t} />
                            {isWorking && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                                <RefreshCw className="h-3 w-3 animate-spin" />{he ? 'מסנכרן עכשיו' : 'Syncing now'}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 truncate text-[11px] text-gray-500">
                            {connection.last_sync_at ? formatDateTime(connection.last_sync_at, currentLanguage) : t('neverSynced')}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-end">
                          <div>
                            <p className="text-sm font-black tabular-nums text-indigo-600 dark:text-indigo-400">{added}</p>
                            <p className="text-[9px] text-gray-400">{he ? 'חדשות' : 'new'}</p>
                          </div>
                          <div className="hidden sm:block">
                            <p className="text-sm font-black tabular-nums text-gray-800 dark:text-gray-100">{processed}</p>
                            <p className="text-[9px] text-gray-400">{he ? 'עובדו' : 'processed'}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {!connections.length && !connectionsQuery.isLoading && (
              <button onClick={() => handleTabChange('accounts')} className="w-full rounded-2xl border-2 border-dashed border-indigo-300 bg-white p-10 text-center font-bold text-indigo-600 dark:bg-gray-900">
                {he ? 'חברו חשבון ראשון' : 'Connect your first account'}
              </button>
            )}

            {overview.lastSync && (
              <p className="text-center text-[11px] text-gray-400">
                {he ? 'הסנכרון האחרון במערכת' : 'Latest system sync'} · {formatDateTime(overview.lastSync, currentLanguage)}
              </p>
            )}
          </div>
        )}

        {tab === 'accounts' && (
          <div className="grid gap-7 lg:grid-cols-2">
            <BankConnectionGroup kind="bank" items={groupedConnections.banks} sources={sources} t={t} he={he} currentLanguage={currentLanguage} onOpenConnect={openConnect} />
            <BankConnectionGroup kind="credit_card" items={groupedConnections.cards} sources={sources} t={t} he={he} currentLanguage={currentLanguage} onOpenConnect={openConnect} />
          </div>
        )}
        {tab === 'agent' && <div className="mx-auto max-w-3xl"><SyncMethodPanel t={t} hasConnections={connections.length > 0} /></div>}
        {tab === 'help' && <div className="mx-auto max-w-3xl"><HowItWorksPanel t={t} defaultOpen /></div>}
      </main>

      <ConnectBankModal isOpen={showConnect} onClose={() => { setShowConnect(false); setInitialBank(null); setConnectKind(null); }} initialBank={initialBank} kindFilter={connectKind} existingSources={connections.map((c) => c.bank_source)} />
    </div>
  );
}
