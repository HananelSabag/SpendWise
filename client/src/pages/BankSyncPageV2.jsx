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
import BankSyncOverview from '../components/features/bankSync/BankSyncOverview';
import ConnectBankModal from '../components/features/bankSync/ConnectBankModal';
import SyncMethodPanel from '../components/features/bankSync/SyncMethodPanel';
import HowItWorksPanel from '../components/features/bankSync/HowItWorksPanel';
import { institutionKind, nextAutoSync } from '../components/features/bankSync/bankSyncMeta';

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
  const [editingConnection, setEditingConnection] = useState(null);

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
  const openConnect = useCallback((kind = null) => {
    setEditingConnection(null);
    setConnectKind(kind);
    setShowConnect(true);
  }, []);
  const openEdit = useCallback((connection, kind = null) => {
    setEditingConnection(connection);
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
    agent: he ? 'סוכן' : 'Agent',
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
            mobileCompact
          />
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-5 lg:px-8">
        {(connectionsQuery.isError || statsQuery.isError) && <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle className="h-4 w-4" />{t('loadError')}</div>}

        {tab === 'overview' && (
          <BankSyncOverview
            connections={connections}
            sources={sources}
            autoSync={auto}
            currentLanguage={currentLanguage}
            t={t}
            onManageAccounts={() => handleTabChange('accounts')}
          />
        )}

        {tab === 'accounts' && (
          <div className="grid gap-7 lg:grid-cols-2">
            <BankConnectionGroup kind="bank" items={groupedConnections.banks} sources={sources} t={t} he={he} currentLanguage={currentLanguage} onOpenConnect={openConnect} onOpenEdit={openEdit} />
            <BankConnectionGroup kind="credit_card" items={groupedConnections.cards} sources={sources} t={t} he={he} currentLanguage={currentLanguage} onOpenConnect={openConnect} onOpenEdit={openEdit} />
          </div>
        )}
        {tab === 'agent' && <div className="mx-auto max-w-3xl"><SyncMethodPanel t={t} hasConnections={connections.length > 0} /></div>}
        {tab === 'help' && <div className="mx-auto max-w-3xl"><HowItWorksPanel t={t} defaultOpen /></div>}
      </main>

      <ConnectBankModal isOpen={showConnect} onClose={() => { setShowConnect(false); setEditingConnection(null); setConnectKind(null); }} connection={editingConnection} kindFilter={connectKind} existingSources={connections.map((c) => c.bank_source)} />
    </div>
  );
}
