/**
 * SyncMethodPanel — choose who runs your bank syncs.
 *
 *  - SpendWise's server (Default Host): zero setup, the shared agent handles it.
 *  - My own computer: the user runs the SpendWise Agent themselves; the
 *    server hands that device a pairing code, the Agent confirms it, and
 *    every future job for this user is scoped to that one device (see
 *    server/routes/agentPairingRoutes.js + bankAgentRoutes.js).
 *
 * Switching either direction invalidates whatever key the user's bank
 * credentials are currently sealed to, so both paths confirm first when
 * there's something to lose.
 */

import React, { useState, useEffect } from 'react';
import { Laptop, Server, Check, Loader2, Download, KeyRound } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ConfirmModal } from '../../ui';
import { useToast } from '../../../hooks/useToast';
import agentPairingApi from '../../../api/agentPairing';

// Always points at the newest release — no client change needed per Agent build.
const AGENT_DOWNLOAD_URL = 'https://github.com/HananelSabag/spendwise-agent/releases/latest/download/SpendWiseAgent-ForUsers.zip';

export default function SyncMethodPanel({ t, hasConnections }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [pendingCode, setPendingCode] = useState(null); // { code, expires_at }
  const [confirmAction, setConfirmAction] = useState(null); // 'start' | 'unpair' | null

  const { data: pairing = { paired: false }, isLoading } = useQuery({
    queryKey: ['agentPairingStatus'],
    queryFn: agentPairingApi.status,
    staleTime: 15_000,
    // Poll while a code is being shown, so the moment the Agent confirms it
    // this flips to the "connected" state without the user refreshing.
    refetchInterval: pendingCode ? 3_000 : false,
  });

  useEffect(() => {
    if (pairing.paired && pendingCode) {
      setPendingCode(null);
      toast.success(t('syncMethodPaired', { label: pairing.label || '' }));
    }
  }, [pairing.paired]); // eslint-disable-line react-hooks/exhaustive-deps

  const startMutation = useMutation({
    mutationFn: agentPairingApi.start,
    onSuccess: (data) => setPendingCode(data),
    onError: () => toast.error(t('syncMethodError')),
  });

  const unpairMutation = useMutation({
    mutationFn: agentPairingApi.unpair,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentPairingStatus'] });
      setPendingCode(null);
    },
    onError: () => toast.error(t('syncMethodError')),
  });

  const requestCode = () => {
    if (hasConnections) setConfirmAction('start');
    else startMutation.mutate();
  };

  const doUnpair = () => {
    if (hasConnections) setConfirmAction('unpair');
    else unpairMutation.mutate();
  };

  const minutesLeft = pendingCode
    ? Math.max(0, Math.round((new Date(pendingCode.expires_at) - Date.now()) / 60_000))
    : 0;

  return (
    <section className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200/70 dark:border-gray-700/70 p-4 space-y-3">
      <div>
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">{t('syncMethodTitle')}</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('syncMethodSubtitle')}</p>
      </div>

      {isLoading ? (
        <div className="h-20 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
      ) : pairing.paired ? (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
            <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
              {t('syncMethodPaired', { label: pairing.label || t('syncMethodOwnTitle') })}
            </p>
            {pairing.paired_at && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                {t('syncMethodPairedSince', { date: new Date(pairing.paired_at).toLocaleDateString() })}
              </p>
            )}
          </div>
          <button
            onClick={doUnpair}
            disabled={unpairMutation.isPending}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {unpairMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t('syncMethodUnpair')}
          </button>
        </div>
      ) : pendingCode ? (
        <div className="p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 text-center space-y-2">
          <p className="text-2xl font-bold tracking-[0.3em] text-indigo-700 dark:text-indigo-300 font-mono">
            {pendingCode.code}
          </p>
          <p className="text-xs text-indigo-600 dark:text-indigo-400">{t('syncMethodCodeHint')}</p>
          <p className="text-[11px] text-indigo-500 dark:text-indigo-500">
            {t('syncMethodCodeExpires', { minutes: minutesLeft })}
          </p>
          <div className="flex items-center justify-center gap-1.5 text-xs text-indigo-500 dark:text-indigo-400 pt-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('syncMethodWaiting')}
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/10 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Server className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
              <p className="text-xs font-bold text-indigo-900 dark:text-indigo-100">{t('syncMethodDefaultTitle')}</p>
              <span className="ms-auto text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-600 text-white">
                {t('active', { fallback: 'Active' })}
              </span>
            </div>
            <p className="text-[11px] text-indigo-700 dark:text-indigo-300 leading-snug">{t('syncMethodDefaultBody')}</p>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Laptop className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{t('syncMethodOwnTitle')}</p>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug mb-2">{t('syncMethodOwnBody')}</p>
            <div className="flex flex-col gap-1.5">
              <a
                href={AGENT_DOWNLOAD_URL}
                className="flex items-center justify-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> {t('syncMethodDownload')}
              </a>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-snug px-0.5">
                {t('syncMethodSmartScreenHint')}
              </p>
              <button
                onClick={requestCode}
                disabled={startMutation.isPending}
                className="flex items-center justify-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50"
              >
                {startMutation.isPending
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <><KeyRound className="w-3.5 h-3.5" /> {t('syncMethodGenerateCode')}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmAction === 'start'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => startMutation.mutate()}
        title={t('syncMethodSwitchConfirmTitle')}
        message={t('syncMethodSwitchToOwnConfirmBody')}
        confirmText={t('syncMethodConfirm')}
        cancelText={t('syncMethodCancel')}
        variant="warning"
      />
      <ConfirmModal
        isOpen={confirmAction === 'unpair'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => unpairMutation.mutate()}
        title={t('syncMethodUnpairConfirmTitle')}
        message={t('syncMethodUnpairConfirmBody', { label: pairing.label || t('syncMethodOwnTitle') })}
        confirmText={t('syncMethodConfirm')}
        cancelText={t('syncMethodCancel')}
        variant="warning"
      />
    </section>
  );
}
