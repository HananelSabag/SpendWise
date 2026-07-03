/**
 * Bank Sync Page — Bank Connect management hub.
 *
 * Composition only — the visual pieces live in components/features/bankSync/:
 *   BankConnectionCard · BankStatsCard · HowItWorksPanel · ConnectBankModal
 *
 * Credentials are encrypted in the browser (ConnectBankModal); this page
 * never handles plaintext. Full i18n via the bankSync module.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Building2, RefreshCw, AlertCircle, Plus, Landmark, CreditCard } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../stores';
import { cn } from '../utils/helpers';
import apiClient from '../api/client';
import bankConnectionsApi from '../api/bankConnections';
import { institutionKind } from '../components/features/bankSync/bankSyncMeta';
import ConnectBankModal from '../components/features/bankSync/ConnectBankModal';
import BankConnectionCard from '../components/features/bankSync/BankConnectionCard';
import BankStatsCard from '../components/features/bankSync/BankStatsCard';
import HowItWorksPanel from '../components/features/bankSync/HowItWorksPanel';

// Split a list of bank-source-tagged items into bank-account vs credit-card
// groups. Banks and credit card companies are not the same kind of
// financial entity — a bank has a real balance and direct debits, a credit
// card company has billing-cycle charges and (here) no real balance — so
// they're shown as clearly separate sections, not one undifferentiated list.
function splitByKind(items, getSource) {
  const banks = [];
  const cards = [];
  for (const item of items) {
    const kind = item.kind || institutionKind(getSource(item));
    (kind === 'credit_card' ? cards : banks).push(item);
  }
  return { banks, cards };
}

const fetchBankStats = () => apiClient.get('/bank-sync/stats').then(r => r.data.sources || []);

export default function BankSyncPage() {
  const { t, currentLanguage } = useTranslation('bankSync');
  const queryClient = useQueryClient();
  const [showConnect, setShowConnect] = useState(false);

  const { data: sources = [], error: statsError, refetch, isFetching } = useQuery({
    queryKey: ['bankSyncStats'],
    queryFn: fetchBankStats,
    staleTime: 60_000,
  });

  const { data: connections = [], isLoading: connsLoading } = useQuery({
    queryKey: ['bankConnections'],
    queryFn: bankConnectionsApi.list,
    staleTime: 30_000,
    // Poll while a job is active so cards advance live (waiting → syncing → done).
    refetchInterval: (query) => {
      const conns = query.state.data || [];
      return conns.some(c => ['pending', 'running'].includes(c.latest_job_status)) ? 8_000 : false;
    },
  });

  // Refresh synced-transaction stats when the newest sync time advances.
  const latestSyncStamp = connections.map(c => c.last_sync_at || '').sort().slice(-1)[0] || '';
  useEffect(() => {
    if (latestSyncStamp) queryClient.invalidateQueries({ queryKey: ['bankSyncStats'] });
  }, [latestSyncStamp, queryClient]);

  const { banks: bankConnections, cards: cardConnections } = useMemo(
    () => splitByKind(connections, (c) => c.bank_source),
    [connections],
  );
  const { banks: bankStats, cards: cardStats } = useMemo(
    () => splitByKind(sources, (s) => s.source),
    [sources],
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24 lg:pb-8">
      {/* Header — matches the app's frosted-glass + gradient-icon header */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-700/60">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{t('title')}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{t('connectBankSubtitle')}</p>
          </div>
          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={t('refresh')}
          >
            <RefreshCw className={cn('w-4 h-4 text-gray-400', isFetching && 'animate-spin')} />
          </button>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-5 space-y-6">

        {/* My connections */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('myConnections')}
            </h2>
            {connections.length > 0 && (
              <button
                onClick={() => setShowConnect(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> {t('connectBank')}
              </button>
            )}
          </div>

          {connsLoading && <div className="h-32 rounded-xl bg-gray-200/70 dark:bg-gray-800/70 animate-pulse" />}

          {!connsLoading && connections.length === 0 && (
            <motion.button
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              onClick={() => setShowConnect(true)}
              className="w-full text-center py-10 px-6 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors group"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mx-auto mb-3 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <Plus className="w-7 h-7 text-white" />
              </div>
              <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">{t('noConnections')}</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">{t('noConnectionsHint')}</p>
            </motion.button>
          )}

          {bankConnections.length > 0 && (
            <div className="space-y-2">
              <h3 className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                <Landmark className="w-3 h-3" /> {t('bankAccounts', { fallback: 'Bank Accounts' })}
              </h3>
              {bankConnections.map(conn => (
                <BankConnectionCard key={conn.id} conn={conn} t={t} lang={currentLanguage} />
              ))}
            </div>
          )}

          {cardConnections.length > 0 && (
            <div className="space-y-2">
              <h3 className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                <CreditCard className="w-3 h-3" /> {t('creditCards', { fallback: 'Credit Cards' })}
              </h3>
              {cardConnections.map(conn => (
                <BankConnectionCard key={conn.id} conn={conn} t={t} lang={currentLanguage} />
              ))}
            </div>
          )}
        </section>

        {/* Synced data */}
        {statsError && (
          <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" /> <span>{t('loadError')}</span>
          </div>
        )}

        {sources.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('recentSyncs')}
            </h2>

            {bankStats.length > 0 && (
              <div className="space-y-3">
                <h3 className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                  <Landmark className="w-3 h-3" /> {t('bankAccounts', { fallback: 'Bank Accounts' })}
                </h3>
                {bankStats.map(stat => (
                  <BankStatsCard
                    key={stat.source}
                    stat={stat}
                    connectionId={connections.find(c => c.bank_source === stat.source)?.id}
                    t={t}
                    lang={currentLanguage}
                  />
                ))}
              </div>
            )}

            {cardStats.length > 0 && (
              <div className="space-y-3">
                <h3 className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                  <CreditCard className="w-3 h-3" /> {t('creditCards', { fallback: 'Credit Cards' })}
                </h3>
                {cardStats.map(stat => (
                  <BankStatsCard
                    key={stat.source}
                    stat={stat}
                    connectionId={connections.find(c => c.bank_source === stat.source)?.id}
                    t={t}
                    lang={currentLanguage}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        <HowItWorksPanel t={t} />
      </div>

      <ConnectBankModal isOpen={showConnect} onClose={() => setShowConnect(false)} />
    </div>
  );
}
