/**
 * BankConnectionCard — manage one bank connection: status, live job state,
 * last sync, and actions (sync now / pause / resume / delete).
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw, Clock, AlertCircle, Pause, Play, Trash2, Loader2, ChevronDown,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../../hooks/useToast';
import { cn } from '../../../utils/helpers';
import bankConnectionsApi from '../../../api/bankConnections';
import { bankBrand, formatDateTime } from './bankSyncMeta';
import { BankIcon, StatusBadge } from './BankBits';

const SYNC_ERROR_KEYS = {
  SYNC_QUOTA: 'syncQuotaReached',
  SYNC_TOO_SOON: 'syncTooSoon',
  SYNC_IN_FLIGHT: 'syncInFlight',
  CONNECTION_PAUSED: 'connectionPaused',
};

// Mirrors MANUAL_SYNC_GAP_HOURS in server/routes/bankConnectionsRoutes.js.
// Used only to show the user WHEN they'll be able to sync again — the
// server is the actual source of truth/enforcement.
const MANUAL_SYNC_GAP_HOURS = 3;

export default function BankConnectionCard({ conn, t, lang }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Force a re-render every 30s so the cooldown countdown/enable-state below
  // updates on its own, without the user needing to refresh anything.
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['bankConnections'] });

  // Proactive cooldown: rather than let the user click "Sync Now" and
  // silently 429, show exactly when the next manual sync will be allowed.
  const nextSyncAt = useMemo(() => {
    if (!conn.last_sync_at) return null;
    return new Date(new Date(conn.last_sync_at).getTime() + MANUAL_SYNC_GAP_HOURS * 3600_000);
  }, [conn.last_sync_at]);
  const inCooldown = Boolean(nextSyncAt && nextSyncAt.getTime() > Date.now());

  const syncMutation = useMutation({
    mutationFn: () => bankConnectionsApi.syncNow(conn.id),
    onSuccess: () => { toast.success(t('syncQueued')); invalidate(); },
    onError: (err) => {
      // Rate-limit / guard rejections (quota, too-soon, in-flight, paused) are
      // expected states, not failures — show them as warnings, not red errors.
      const code = err?.details?.code || err?.code;
      const key = SYNC_ERROR_KEYS[code];
      if (key) toast.warning(t(key));
      else toast.error(err?.message || t('loadError'));
    },
  });
  const statusMutation = useMutation({
    mutationFn: (status) => bankConnectionsApi.setStatus(conn.id, status),
    onSuccess: invalidate,
    onError: (err) => toast.error(err?.message || t('loadError')),
  });
  const deleteMutation = useMutation({
    mutationFn: () => bankConnectionsApi.remove(conn.id),
    onSuccess: () => { setConfirmDelete(false); invalidate(); },
    onError: (err) => toast.error(err?.message || t('loadError')),
  });

  // Every click must produce visible feedback. During the client-side cooldown
  // window we short-circuit and explain WHEN the next sync is allowed instead
  // of silently doing nothing (the old disabled button gave no signal on tap).
  const handleSync = () => {
    if (inCooldown) {
      toast.info(t('nextSyncAt', { time: formatDateTime(nextSyncAt, lang) }));
      return;
    }
    syncMutation.mutate();
  };

  const { tint } = bankBrand(conn.bank_source);
  const isError = conn.status === 'error';
  const isPending = conn.latest_job_status === 'pending';
  const isRunning = conn.latest_job_status === 'running';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border border-gray-200/70 dark:border-gray-700/70 shadow-sm overflow-hidden',
        tint,
      )}
    >
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-center gap-3">
          <BankIcon source={conn.bank_source} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-gray-900 dark:text-white truncate">
                {t(`bankNames.${conn.bank_source}`)}
              </p>
              <StatusBadge status={conn.status} t={t} />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
              {conn.display_name || conn.bank_source}
            </p>
          </div>
        </div>

        {/* Live job / error banners */}
        <AnimatePresence initial={false}>
          {isRunning && (
            <motion.div
              key="running"
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="mt-3 flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2"
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              <span>{t('jobSyncing')}</span>
            </motion.div>
          )}
          {isPending && !isRunning && (
            <motion.div
              key="pending"
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="mt-3 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2"
            >
              <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{t('jobWaiting')}</p>
                <p className="opacity-75 mt-0.5">{t('jobWaitingHint')}</p>
              </div>
            </motion.div>
          )}
          {isError && (
            <motion.div
              key="error"
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="mt-3 flex items-start gap-2 text-xs text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{t('pausedAfterFailures')}</span>
            </motion.div>
          )}
          {!isError && !isPending && !isRunning && conn.last_error && (
            <motion.div
              key="lasterr"
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="mt-3 flex items-start gap-2 text-xs text-red-500 dark:text-red-400 bg-red-50/60 dark:bg-red-900/10 rounded-lg px-3 py-2"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span className="truncate">{t('lastAttemptFailed', { error: conn.last_error })}</span>
            </motion.div>
          )}
          {/* Proactive cooldown — visible even on mobile (no hover tooltips there),
              so clicking "Sync Now" repeatedly with no feedback can't happen. */}
          {!isError && !isPending && !isRunning && !conn.last_error && inCooldown && (
            <motion.div
              key="cooldown"
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="mt-3 flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2"
            >
              <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{t('nextSyncAt', { time: formatDateTime(nextSyncAt, lang) })}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Last sync */}
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500">
          <Clock className="w-3 h-3" />
          <span>{t('lastSyncLabel')}: {conn.last_sync_at ? formatDateTime(conn.last_sync_at, lang) : t('neverSynced')}</span>
        </div>

        {/* Actions */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleSync}
            disabled={syncMutation.isPending || conn.status !== 'active'}
            title={inCooldown ? t('nextSyncAt', { time: formatDateTime(nextSyncAt, lang) }) : undefined}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-white text-xs font-semibold transition-colors',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              inCooldown ? 'bg-primary-400 hover:bg-primary-500' : 'bg-primary-600 hover:bg-primary-700',
            )}
          >
            {syncMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {t('syncNow')}
          </button>

          {conn.status === 'active' ? (
            <button
              onClick={() => statusMutation.mutate('paused')}
              disabled={statusMutation.isPending}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-xs font-medium hover:bg-white/70 dark:hover:bg-gray-800 transition-colors"
            >
              <Pause className="w-3.5 h-3.5" /> {t('pause')}
            </button>
          ) : (
            <button
              onClick={() => statusMutation.mutate('active')}
              disabled={statusMutation.isPending}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 text-xs font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
            >
              <Play className="w-3.5 h-3.5" /> {t('resume')}
            </button>
          )}

          <button
            onClick={() => setConfirmDelete(v => !v)}
            className="flex items-center justify-center px-3 py-2 rounded-lg border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            aria-label={t('delete')}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Delete confirm */}
        <AnimatePresence>
          {confirmDelete && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="mt-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3"
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
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
