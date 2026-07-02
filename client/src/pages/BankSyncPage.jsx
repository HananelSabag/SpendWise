/**
 * Bank Sync Page — Bank Connect management hub
 *
 * Sections:
 *   1. My Bank Connections — connect / sync now / pause / resume / delete
 *   2. Synced data cards — per-source stats (transactions, balances)
 *   3. How it works
 *
 * Credentials are encrypted in the browser (ConnectBankModal) — this page
 * never sees or handles plaintext credentials.
 * Full i18n via bankSync translation module. No hardcoded strings.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, RefreshCw, Clock, TrendingDown,
  TrendingUp, AlertCircle, ChevronDown, ChevronUp, Landmark,
  Info, Plus, Pause, Play, Trash2, ShieldCheck, Loader2,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation, useNotifications } from '../stores';
import { cn } from '../utils/helpers';
import apiClient from '../api/client';
import bankConnectionsApi from '../api/bankConnections';
import ConnectBankModal from '../components/features/bankSync/ConnectBankModal';

// ── API ───────────────────────────────────────────────────────────────────────
async function fetchBankStats() {
  const res = await apiClient.get('/bank-sync/stats');
  return res.data.sources || [];
}

// ── Source display metadata (colors only — labels come from i18n) ─────────────
const SOURCE_META = {
  yahav:    { bg: 'bg-green-50 dark:bg-green-950/30',   border: 'border-green-200 dark:border-green-800' },
  isracard: { bg: 'bg-red-50 dark:bg-red-950/30',       border: 'border-red-200 dark:border-red-800' },
  max:      { bg: 'bg-blue-50 dark:bg-blue-950/30',     border: 'border-blue-200 dark:border-blue-800' },
  discount: { bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-200 dark:border-orange-800' },
};

function getMeta(source) {
  return SOURCE_META[source] || {
    bg: 'bg-gray-50 dark:bg-gray-800/30',
    border: 'border-gray-200 dark:border-gray-700',
  };
}

function formatDate(iso, lang) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(lang === 'he' ? 'he-IL' : 'en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatAmount(n, lang) {
  return Number(n || 0).toLocaleString(lang === 'he' ? 'he-IL' : 'en-US', {
    style: 'currency', currency: 'ILS', maximumFractionDigits: 0,
  });
}

// ── Status chip ───────────────────────────────────────────────────────────────
function StatusChip({ status, t }) {
  const map = {
    active: { label: t('statusActive'), cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' },
    paused: { label: t('statusPaused'), cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
    error:  { label: t('statusError'),  cls: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' },
  };
  const { label, cls } = map[status] || map.paused;
  return <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-semibold', cls)}>{label}</span>;
}

// ── Connection card ───────────────────────────────────────────────────────────
function ConnectionCard({ conn, t, lang }) {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['bankConnections'] });

  const syncMutation = useMutation({
    mutationFn: () => bankConnectionsApi.syncNow(conn.id),
    onSuccess: () => {
      addNotification({ type: 'success', message: t('syncQueued') });
      invalidate();
    },
    onError: (err) => {
      const code = err?.details?.code || err?.code;
      const msg =
        code === 'SYNC_QUOTA' ? t('syncQuotaReached')
        : code === 'SYNC_TOO_SOON' ? t('syncTooSoon')
        : code === 'SYNC_IN_FLIGHT' ? t('syncInFlight')
        : code === 'CONNECTION_PAUSED' ? t('connectionPaused')
        : (err?.message || t('loadError'));
      addNotification({ type: 'error', message: msg });
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status) => bankConnectionsApi.setStatus(conn.id, status),
    onSuccess: invalidate,
    onError: (err) => addNotification({ type: 'error', message: err?.message || t('loadError') }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => bankConnectionsApi.remove(conn.id),
    onSuccess: () => { setConfirmDelete(false); invalidate(); },
    onError: (err) => addNotification({ type: 'error', message: err?.message || t('loadError') }),
  });

  const meta = getMeta(conn.bank_source);
  const isPausedByFailures = conn.status === 'error';
  const jobStatus = conn.latest_job_status;
  const isPending = jobStatus === 'pending';
  const isRunning = jobStatus === 'running';
  // Show the last failure reason even before auto-pause kicks in (3 strikes).
  const lastError = conn.last_error;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('rounded-2xl border p-4', meta.bg, meta.border)}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
            <Landmark className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900 dark:text-white truncate">
                {t(`bankNames.${conn.bank_source}`)}
              </p>
              <StatusChip status={conn.status} t={t} />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {conn.display_name || conn.bank_source}
            </p>
          </div>
        </div>
      </div>

      {/* Live job state — reassures the user a queued sync is waiting for
          their (possibly offline) agent machine, not silently broken. */}
      {isRunning && (
        <div className="mt-3 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-xl px-3 py-2">
          <Loader2 className="w-3.5 h-3.5 flex-shrink-0 animate-spin" />
          <span>{t('jobSyncing')}</span>
        </div>
      )}
      {isPending && !isRunning && (
        <div className="mt-3 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-3 py-2">
          <Clock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <div>
            <p>{t('jobWaiting')}</p>
            <p className="opacity-70 mt-0.5">{t('jobWaitingHint')}</p>
          </div>
        </div>
      )}

      {isPausedByFailures && (
        <div className="mt-3 flex items-start gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{t('pausedAfterFailures')}</span>
        </div>
      )}

      {/* Non-fatal last error (before the 3-strike auto-pause) */}
      {!isPausedByFailures && !isPending && !isRunning && lastError && (
        <div className="mt-3 flex items-start gap-2 text-xs text-red-500 dark:text-red-400 bg-red-50/60 dark:bg-red-900/10 rounded-xl px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span className="truncate">{t('lastAttemptFailed', { error: lastError })}</span>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {t('lastSyncLabel')}: {conn.last_sync_at ? formatDate(conn.last_sync_at, lang) : t('neverSynced')}
        </span>
      </div>

      {/* Actions */}
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending || conn.status !== 'active'}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors"
        >
          {syncMutation.isPending
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <RefreshCw className="w-3.5 h-3.5" />}
          {t('syncNow')}
        </button>

        {conn.status === 'active' ? (
          <button
            onClick={() => statusMutation.mutate('paused')}
            disabled={statusMutation.isPending}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-xs font-medium hover:bg-white/60 dark:hover:bg-gray-800 transition-colors"
          >
            <Pause className="w-3.5 h-3.5" />
            {t('pause')}
          </button>
        ) : (
          <button
            onClick={() => statusMutation.mutate('active')}
            disabled={statusMutation.isPending}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 text-xs font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            {t('resume')}
          </button>
        )}

        <button
          onClick={() => setConfirmDelete(true)}
          className="flex items-center justify-center px-3 py-2 rounded-xl border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          aria-label={t('delete')}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3"
        >
          <p className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1">{t('deleteConfirmTitle')}</p>
          <p className="text-[11px] text-red-600 dark:text-red-400 mb-3">{t('deleteConfirmBody')}</p>
          <div className="flex gap-2">
            <button
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="flex-1 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors"
            >
              {deleteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : t('delete')}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-xs font-medium transition-colors"
            >
              {t('cancel')}
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// ── Synced data card (per-source stats) ───────────────────────────────────────
function BankStatsCard({ stat, t, lang }) {
  const meta = getMeta(stat.source);
  const bankName = t(`bankNames.${stat.source}`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('rounded-2xl border p-5', meta.bg, meta.border)}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
          <Landmark className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white truncate">{bankName}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{stat.source}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900 dark:text-white">{stat.total}</p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">{t('transactionsShort')}</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-0.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{stat.income_count}</p>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">{t('income')}</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-0.5">
            <TrendingDown className="w-3.5 h-3.5 text-red-500" />
            <p className="text-sm font-semibold text-red-500 dark:text-red-400">{stat.expense_count}</p>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">{t('expenses')}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 pt-3 border-t border-gray-200/60 dark:border-gray-700/60">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">{formatAmount(stat.total_income, lang)}</span>
          {' / '}
          <span className="text-red-500 dark:text-red-400 font-medium">-{formatAmount(stat.total_expense, lang)}</span>
        </span>
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500">
          <Clock className="w-3 h-3" />
          <span>{formatDate(stat.last_sync, lang)}</span>
        </div>
      </div>

      {/* Real account balance */}
      <div className="mt-3 rounded-xl bg-white/60 dark:bg-gray-900/40 border border-gray-200/60 dark:border-gray-700/60 px-3 py-2.5">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
          {t('accountBalance')}
        </p>
        {stat.accounts && stat.accounts.some(a => a.balance !== null && a.balance !== undefined) ? (
          stat.accounts
            .filter(a => a.balance !== null && a.balance !== undefined)
            .map((a, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400 text-xs">
                  {a.account_number || t('mainAccount')}
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {formatAmount(a.balance, lang)}
                </span>
              </div>
            ))
        ) : (
          <p className="text-[11px] text-gray-400 dark:text-gray-500 italic">
            {t('balanceUnavailableNote')}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ── How it works ──────────────────────────────────────────────────────────────
function HowItWorks({ t }) {
  const [open, setOpen] = useState(false);

  const steps = [
    t('howItWorksStep1'),
    t('howItWorksStep2'),
    t('howItWorksStep3'),
    t('howItWorksStep4'),
  ];

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        <span className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-500" />
          {t('howItWorks')}
        </span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-5 pb-5 space-y-3 text-sm text-gray-600 dark:text-gray-400"
        >
          <div className="space-y-2">
            {steps.map((text, i) => (
              <div key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span>{text}</span>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">{t('securityTitle')}</p>
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              {t('securityPoint2')}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function BankSyncPage() {
  const { t, currentLanguage } = useTranslation('bankSync');
  const queryClient = useQueryClient();
  const [showConnect, setShowConnect] = useState(false);

  const { data: sources = [], isLoading: statsLoading, error: statsError, refetch } = useQuery({
    queryKey: ['bankSyncStats'],
    queryFn: fetchBankStats,
    staleTime: 60_000,
  });

  const { data: connections = [], isLoading: connsLoading } = useQuery({
    queryKey: ['bankConnections'],
    queryFn: bankConnectionsApi.list,
    staleTime: 30_000,
    // While any job is pending/running, poll so the card advances live
    // (waiting → syncing → done) without the user refreshing.
    refetchInterval: (query) => {
      const conns = query.state.data || [];
      const active = conns.some(c => ['pending', 'running'].includes(c.latest_job_status));
      return active ? 8_000 : false;
    },
  });

  // When the newest sync timestamp advances (a job just finished), refresh
  // the synced-transaction stats so new rows appear without a manual reload.
  const latestSyncStamp = connections
    .map(c => c.last_sync_at || '')
    .sort()
    .slice(-1)[0] || '';
  useEffect(() => {
    if (latestSyncStamp) {
      queryClient.invalidateQueries({ queryKey: ['bankSyncStats'] });
    }
  }, [latestSyncStamp, queryClient]);

  const isLoading = statsLoading || connsLoading;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24 lg:pb-8">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-5 lg:px-8">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('connectBankSubtitle')}</p>
            </div>
            <button
              onClick={() => refetch()}
              className="ms-auto p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={t('refresh')}
            >
              <RefreshCw className={cn('w-4 h-4 text-gray-400', isLoading && 'animate-spin')} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6 space-y-6 lg:px-8">

        {/* ── My connections ─────────────────────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              {t('myConnections')}
            </h2>
            <button
              onClick={() => setShowConnect(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {t('connectBank')}
            </button>
          </div>

          {connsLoading && (
            <div className="h-28 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
          )}

          {!connsLoading && connections.length === 0 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setShowConnect(true)}
              className="w-full text-center py-10 px-6 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-600 transition-colors group"
            >
              <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 mx-auto mb-3 flex items-center justify-center transition-colors">
                <Plus className="w-7 h-7 text-gray-400 group-hover:text-primary-500 transition-colors" />
              </div>
              <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">{t('noConnections')}</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">{t('noConnectionsHint')}</p>
            </motion.button>
          )}

          {connections.map((conn) => (
            <ConnectionCard key={conn.id} conn={conn} t={t} lang={currentLanguage} />
          ))}
        </section>

        {/* ── Synced data ────────────────────────────────────────────── */}
        {statsError && (
          <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{t('loadError')}</span>
          </div>
        )}

        {sources.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              {t('recentSyncs')}
            </h2>
            {sources.map(stat => (
              <BankStatsCard key={stat.source} stat={stat} t={t} lang={currentLanguage} />
            ))}
          </section>
        )}

        {/* How it works */}
        <HowItWorks t={t} />
      </div>

      {/* Connect wizard */}
      <ConnectBankModal
        isOpen={showConnect}
        onClose={() => setShowConnect(false)}
      />
    </div>
  );
}
