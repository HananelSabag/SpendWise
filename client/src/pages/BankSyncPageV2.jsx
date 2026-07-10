import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, AlertCircle, Bot, CreditCard, HelpCircle, Landmark, Plus, RefreshCw } from 'lucide-react';

import { useAuth, useTranslation } from '../stores';
import apiClient from '../api/client';
import bankConnectionsApi from '../api/bankConnections';
import { cn } from '../utils/helpers';
import BrandMark from '../components/common/BrandMark';
import { LiquidTabs } from '../components/ui';
import BankConnectionCard from '../components/features/bankSync/BankConnectionCard';
import BankStatsCard from '../components/features/bankSync/BankStatsCard';
import ConnectBankModal from '../components/features/bankSync/ConnectBankModal';
import HowItWorksPanel from '../components/features/bankSync/HowItWorksPanel';
import SyncMethodPanel from '../components/features/bankSync/SyncMethodPanel';
import { institutionKind, nextAutoSync, formatDateTime } from '../components/features/bankSync/bankSyncMeta';

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
  const groupedStats = useMemo(() => split(sources, 'source'), [sources]);
  const auto = nextAutoSync();

  const openConnect = (bank = null, kind = null) => {
    setInitialBank(bank);
    setConnectKind(kind);
    setShowConnect(true);
  };
  const refresh = () => Promise.all([connectionsQuery.refetch(), statsQuery.refetch()]);

  const tabLabel = (key) => ({
    overview: he ? 'סנכרון אחרון' : 'Last sync',
    accounts: he ? 'חשבונות מחוברים' : 'Connected accounts',
    agent: he ? 'Agent פרטי' : 'Private Agent',
    help: he ? 'עזרה' : 'Help',
  }[key]);

  const ConnectionGroup = ({ kind, items }) => {
    const isCard = kind === 'credit_card';
    const Icon = isCard ? CreditCard : Landmark;
    return (
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-bold text-gray-950 dark:text-white"><Icon className="h-4 w-4" />{isCard ? (he ? 'חברות אשראי' : 'Credit companies') : (he ? 'חשבונות בנק' : 'Bank accounts')}</h2>
            <p className="text-xs text-gray-500">{isCard ? t('cardsProvide') : t('banksProvide')}</p>
          </div>
          <button onClick={() => openConnect(null, kind)} className={cn('flex shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold text-white', isCard ? 'bg-violet-600' : 'bg-indigo-600')}>
            <Plus className="h-3.5 w-3.5" />{isCard ? t('addCard') : t('addBank')}
          </button>
        </div>
        {items.length ? items.map((conn) => <BankConnectionCard key={conn.id} conn={conn} t={t} lang={currentLanguage} onUpdateCredentials={(bank) => openConnect(bank, kind)} />) : (
          <button onClick={() => openConnect(null, kind)} className="w-full rounded-2xl border-2 border-dashed border-gray-300 p-7 text-sm text-gray-500 dark:border-gray-700">{isCard ? t('cardSectionEmpty') : t('bankSectionEmpty')}</button>
        )}
      </section>
    );
  };

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
            onChange={setTab}
            size="sm"
          />
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-5 lg:px-8">
        {(connectionsQuery.isError || statsQuery.isError) && <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle className="h-4 w-4" />{t('loadError')}</div>}

        {tab === 'overview' && (
          <div className="space-y-5">
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {connections.map((conn) => {
                const result = conn.latest_job_result || {};
                const added = Number(result.inserted ?? result.new_transactions ?? result.imported ?? 0);
                const processed = Number(result.processed ?? result.transactions ?? result.total ?? (added + Number(result.skipped || 0)));
                return <div key={conn.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                  <div className="flex items-center justify-between gap-2"><p className="font-bold text-gray-900 dark:text-white">{conn.institution_label}</p><span className={cn('rounded-full px-2 py-1 text-[10px] font-bold', conn.latest_job_status === 'done' ? 'bg-emerald-100 text-emerald-700' : conn.latest_job_status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700')}>{conn.latest_job_status || (he ? 'טרם סונכרן' : 'Not synced')}</span></div>
                  <p className="mt-1 text-xs text-gray-500">{conn.last_sync_at ? formatDateTime(conn.last_sync_at, currentLanguage) : t('neverSynced')}</p>
                  <div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-xl bg-indigo-50 p-3 dark:bg-indigo-950/30"><p className="text-xl font-black text-indigo-700 dark:text-indigo-300">{added}</p><p className="text-[11px] text-gray-500">{he ? 'חדשות שנכנסו' : 'new added'}</p></div><div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800"><p className="text-xl font-black text-gray-800 dark:text-white">{processed}</p><p className="text-[11px] text-gray-500">{he ? 'עסקאות שעובדו' : 'processed'}</p></div></div>
                </div>;
              })}
            </section>
            {!connections.length && !connectionsQuery.isLoading && <button onClick={() => setTab('accounts')} className="w-full rounded-2xl border-2 border-dashed border-indigo-300 bg-white p-10 text-center font-bold text-indigo-600 dark:bg-gray-900">{he ? 'חברו חשבון ראשון' : 'Connect your first account'}</button>}
            {[...groupedStats.banks, ...groupedStats.cards].map((stat) => <BankStatsCard key={stat.source} stat={stat} connectionId={connections.find((c) => c.bank_source === stat.source)?.id} t={t} lang={currentLanguage} />)}
          </div>
        )}

        {tab === 'accounts' && <div className="grid gap-7 lg:grid-cols-2"><ConnectionGroup kind="bank" items={groupedConnections.banks} /><ConnectionGroup kind="credit_card" items={groupedConnections.cards} /></div>}
        {tab === 'agent' && <div className="mx-auto max-w-3xl"><SyncMethodPanel t={t} hasConnections={connections.length > 0} /></div>}
        {tab === 'help' && <div className="mx-auto max-w-3xl space-y-4"><HowItWorksPanel t={t} /><div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-900 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-100">{he ? 'חשבון בנק מציג תזרים ויתרה. חברת אשראי מציגה רכישות מפורטות. SpendWise מחבר ביניהם בלי לספור את חיוב הכרטיס פעמיים.' : 'A bank account shows cash flow and balance. A credit company shows itemized purchases. SpendWise combines them without counting the card settlement twice.'}</div></div>}
      </main>

      <ConnectBankModal isOpen={showConnect} onClose={() => { setShowConnect(false); setInitialBank(null); setConnectKind(null); }} initialBank={initialBank} kindFilter={connectKind} existingSources={connections.map((c) => c.bank_source)} />
    </div>
  );
}
