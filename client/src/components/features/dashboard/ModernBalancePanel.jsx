/**
 * ModernBalancePanel — Bank Sync Edition
 *
 * Shows ONLY data from /bank-sync/stats (bank_accounts + synced transactions).
 * No period tabs, no useBalance hook, no manual-entry logic.
 *
 * Hero:
 *   - Real account balance (bank_accounts.balance) when the bank exposes it
 *   - "Not available" when the bank doesn't (e.g. Yahav via israeli-bank-scrapers)
 *
 * Income / expense totals come from ALL synced transactions in the DB,
 * NOT a period-filtered calculation. Net activity is shown separately,
 * clearly labeled — it is NOT the account balance.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Building2, TrendingUp, TrendingDown, RefreshCw, Wifi } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useCurrency, useTranslation } from '../../../stores';
import { cn } from '../../../utils/helpers';
import apiClient from '../../../api/client';

const SOURCE_LABEL = { yahav: 'Yahav', isracard: 'Isracard', max: 'Max', discount: 'Discount' };

// ── Relative time (uses translation keys) ────────────────────────────────────
function relativeTime(dateStr, t) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60_000);
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(diff / 86_400_000);
  if (m < 2)  return t('justNow');
  if (m < 60) return t('minutesAgo', { n: m });
  if (h < 24) return t('hoursAgo',   { n: h });
  return t('daysAgo', { n: d });
}

// ── Animated count-up ────────────────────────────────────────────────────────
const AnimatedNumber = ({ value, format }) => {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  const raf  = useRef(null);

  useEffect(() => {
    if (prev.current === value) return;
    const start = prev.current;
    const end   = value;
    const t0    = performance.now();
    const tick  = (now) => {
      const p = Math.min((now - t0) / 420, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setDisplay(start + (end - start) * e);
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else { setDisplay(end); prev.current = end; }
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);

  return <span>{format(display)}</span>;
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
const SkeletonBox = ({ className }) => (
  <div className={cn('animate-pulse bg-white/20 rounded-xl', className)} />
);

// ── Main ──────────────────────────────────────────────────────────────────────
const ModernBalancePanel = ({ className = '' }) => {
  const { formatCurrency } = useCurrency();
  const { t } = useTranslation('bankSync');

  const { data: sources, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['bankSyncStats'],
    queryFn: () => apiClient.get('/bank-sync/stats').then(r => r.data.sources || []),
    staleTime: 5 * 60_000,
    retry: false,
  });

  // ── Aggregates across all synced sources ────────────────────────────────────
  const hasSynced    = sources && sources.length > 0;
  const totalIncome  = (sources || []).reduce((s, src) => s + Number(src.total_income  || 0), 0);
  const totalExpense = (sources || []).reduce((s, src) => s + Number(src.total_expense || 0), 0);
  const netActivity  = totalIncome - totalExpense;       // can be negative — labeled correctly
  const totalTxns    = (sources || []).reduce((s, src) => s + (src.total || 0), 0);

  // Latest sync timestamp
  const lastSync = (sources || []).reduce((latest, src) => {
    const d = src.last_sync ? new Date(src.last_sync) : null;
    return !latest || (d && d > latest) ? d : latest;
  }, null);

  // Accounts that expose a REAL balance (not null)
  const accountsWithBalance = (sources || []).flatMap(src =>
    (src.accounts || [])
      .filter(a => a.balance !== null && a.balance !== undefined)
      .map(a => ({ ...a, source: src.source }))
  );
  const hasRealBalance   = accountsWithBalance.length > 0;
  const totalRealBalance = accountsWithBalance.reduce((s, a) => s + Number(a.balance || 0), 0);

  // Header gradient: green if net positive, red if net negative, gray if no sync
  const gradientClass = !hasSynced
    ? 'bg-gradient-to-br from-gray-600 to-gray-700'
    : netActivity >= 0
      ? 'bg-gradient-to-br from-emerald-600 to-teal-700'
      : 'bg-gradient-to-br from-rose-600 to-red-700';

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={cn('rounded-2xl overflow-hidden shadow-lg', className)}>
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-5">
          <SkeletonBox className="h-3 w-24 mb-4" />
          <SkeletonBox className="h-5 w-40 mb-2" />
          <SkeletonBox className="h-3 w-48 mb-5" />
          <div className="flex gap-2">
            <SkeletonBox className="h-6 w-16 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-2 bg-white dark:bg-gray-800">
          <div className="p-4"><SkeletonBox className="!bg-gray-100 dark:!bg-gray-700 h-14 rounded-xl" /></div>
          <div className="p-4"><SkeletonBox className="!bg-gray-100 dark:!bg-gray-700 h-14 rounded-xl" /></div>
        </div>
      </div>
    );
  }

  // ── Not synced ───────────────────────────────────────────────────────────────
  if (!hasSynced) {
    return (
      <div className={cn('rounded-2xl overflow-hidden shadow-lg', className)}>
        <div className="bg-gradient-to-br from-gray-600 to-gray-700 p-5 text-white">
          <div className="flex items-center gap-2 mb-4 opacity-80">
            <Building2 className="w-4 h-4" />
            <span className="text-sm font-semibold">{t('title')}</span>
          </div>
          <p className="text-2xl font-bold tracking-tight opacity-40">—</p>
          <p className="text-xs opacity-60 mt-1">{t('notSynced')}</p>
        </div>
        <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800">
          {t('runScraper')}
        </div>
      </div>
    );
  }

  const timeLabel = relativeTime(lastSync, t);

  return (
    <div className={cn('rounded-2xl overflow-hidden shadow-lg', className)}>

      {/* ── Gradient header ─────────────────────────────────────────── */}
      <div className={cn('p-5 text-white transition-colors duration-500', gradientClass)}>

        {/* Top row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 opacity-90">
            <Building2 className="w-4 h-4" />
            <span className="text-sm font-semibold">{t('title')}</span>
          </div>
          <div className="flex items-center gap-2">
            {timeLabel && (
              <span className="text-[11px] opacity-60">
                {t('updatedAt', { time: timeLabel })}
              </span>
            )}
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="opacity-60 hover:opacity-100 transition-opacity"
              title={t('refresh')}
            >
              <RefreshCw className={cn('w-3.5 h-3.5', isFetching && 'animate-spin')} />
            </button>
          </div>
        </div>

        {/* Account balance row */}
        <p className="text-[11px] uppercase tracking-wide opacity-70 mb-1 font-medium">
          {t('accountBalance')}
        </p>

        {hasRealBalance ? (
          /* Bank exposes real balance — show it */
          <motion.div
            key={totalRealBalance}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="text-4xl font-bold tracking-tight"
          >
            <AnimatedNumber value={totalRealBalance} format={v => formatCurrency(v)} />
          </motion.div>
        ) : (
          /* Bank doesn't expose balance (e.g. Yahav) */
          <div>
            <p className="text-2xl font-bold opacity-50">{t('unavailable')}</p>
            <p className="text-[11px] opacity-50 mt-0.5">
              {t('unavailableNote', { bank: SOURCE_LABEL[sources[0]?.source] || sources[0]?.source })}
            </p>
          </div>
        )}

        {/* Per-account rows for multiple accounts with balance */}
        {hasRealBalance && accountsWithBalance.length > 1 && (
          <div className="mt-2 space-y-0.5">
            {accountsWithBalance.map((a, i) => (
              <p key={i} className="text-[11px] opacity-60">
                {SOURCE_LABEL[a.source] || a.source}
                {a.account_number ? ` · ${a.account_number}` : ''}
                {' · '}{formatCurrency(Number(a.balance))}
              </p>
            ))}
          </div>
        )}

        {/* Source chips */}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {sources.map(src => (
            <span
              key={src.source}
              className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-white/20 font-medium"
            >
              <Wifi className="w-2.5 h-2.5" />
              {SOURCE_LABEL[src.source] || src.source}
              <span className="opacity-60">
                · {t('transactions', { count: src.total })}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Income / Expense from synced transactions ────────────────── */}
      <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800 rtl:divide-x-reverse">

        <div className="p-4 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {t('income')}
            </span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            <AnimatedNumber value={totalIncome} format={v => formatCurrency(v)} />
          </p>
          <div className="h-1 w-full bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
            <div className="h-full bg-emerald-500 rounded-full w-full" />
          </div>
        </div>

        <div className="p-4 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {t('expenses')}
            </span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            <AnimatedNumber value={totalExpense} format={v => formatCurrency(v)} />
          </p>
          <div className="h-1 w-full bg-red-100 dark:bg-red-900/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-red-500 rounded-full"
              initial={{ width: 0 }}
              animate={{
                width: totalIncome > 0
                  ? `${Math.min((totalExpense / totalIncome) * 100, 100)}%`
                  : '0%',
              }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* ── Net activity row ─────────────────────────────────────────── */}
      <div className="bg-gray-50 dark:bg-gray-800/60 border-t border-gray-100 dark:border-gray-700 px-4 py-2.5 flex items-center justify-between">
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          {t('netActivity')}
        </span>
        <span className={cn(
          'text-sm font-bold',
          netActivity >= 0
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-red-600 dark:text-red-400',
        )}>
          {netActivity >= 0 ? '+' : '−'}{formatCurrency(Math.abs(netActivity))}
        </span>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <div className="bg-gray-50 dark:bg-gray-800/40 border-t border-gray-100 dark:border-gray-700 px-4 py-2 text-center">
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          {t('syncedDaily')}
        </span>
      </div>
    </div>
  );
};

export default ModernBalancePanel;
