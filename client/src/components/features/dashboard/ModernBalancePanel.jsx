/**
 * ModernBalancePanel — Bank Sync Edition
 *
 * Shows data ONLY from the bank scraper (bank_accounts + transactions with bank_source).
 * No period tabs, no manual-entry logic, no useBalance hook.
 *
 * Hero number:
 *   - If the bank exposes balance (bank_accounts.balance != null) → show real balance
 *   - If not (e.g. Yahav doesn't expose it via library) → show net of synced transactions
 *
 * Income / expense totals come from the /bank-sync/stats endpoint (all synced txns, not period-filtered).
 */

import React, { useEffect, useRef, useState } from 'react';
import { Building2, TrendingUp, TrendingDown, RefreshCw, Wifi } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useCurrency } from '../../../stores';
import { cn } from '../../../utils/helpers';
import apiClient from '../../../api/client';

const SOURCE_LABEL = { yahav: 'יהב', isracard: 'ישראכרט', max: 'מקס', discount: 'דיסקונט' };

function relativeTime(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60_000);
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(diff / 86_400_000);
  if (m < 2)  return 'כרגע';
  if (m < 60) return `לפני ${m} דק'`;
  if (h < 24) return `לפני ${h} שע'`;
  return `לפני ${d} ימ'`;
}

// ── Animated count-up number ──────────────────────────────────────────────────
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

  const { data: sources, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['bankSyncStats'],
    queryFn: () => apiClient.get('/bank-sync/stats').then(r => r.data.sources || []),
    staleTime: 5 * 60_000,
    retry: false,
  });

  // ── Aggregates ──────────────────────────────────────────────────────────────
  const hasSynced    = sources && sources.length > 0;
  const totalIncome  = (sources || []).reduce((s, src) => s + Number(src.total_income  || 0), 0);
  const totalExpense = (sources || []).reduce((s, src) => s + Number(src.total_expense || 0), 0);
  const netTxns      = totalIncome - totalExpense;
  const totalTxns    = (sources || []).reduce((s, src) => s + (src.total || 0), 0);

  // Latest sync timestamp across all sources
  const lastSync = (sources || []).reduce((latest, src) => {
    const d = src.last_sync ? new Date(src.last_sync) : null;
    return !latest || (d && d > latest) ? d : latest;
  }, null);

  // Accounts that expose a real balance (not null)
  const accountsWithBalance = (sources || []).flatMap(src =>
    (src.accounts || [])
      .filter(a => a.balance !== null && a.balance !== undefined)
      .map(a => ({ ...a, source: src.source }))
  );
  const hasRealBalance  = accountsWithBalance.length > 0;
  const totalRealBalance = accountsWithBalance.reduce((s, a) => s + Number(a.balance || 0), 0);

  // Hero value and label
  const heroValue    = hasRealBalance ? totalRealBalance : Math.abs(netTxns);
  const isPositive   = hasRealBalance ? totalRealBalance >= 0 : netTxns >= 0;
  const heroLabel    = hasRealBalance ? 'יתרת חשבון בפועל' : 'נטו תנועות מסונכרנות';

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={cn('rounded-2xl overflow-hidden shadow-lg', className)}>
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-5">
          <SkeletonBox className="h-3 w-24 mb-4" />
          <SkeletonBox className="h-10 w-40 mb-2" />
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

  // ── Not synced yet ──────────────────────────────────────────────────────────
  if (!hasSynced) {
    return (
      <div className={cn('rounded-2xl overflow-hidden shadow-lg', className)}>
        <div className="bg-gradient-to-br from-gray-600 to-gray-700 p-5 text-white">
          <div className="flex items-center gap-2 mb-4 opacity-80">
            <Building2 className="w-4 h-4" />
            <span className="text-sm font-semibold">סנכרון בנק</span>
          </div>
          <p className="text-3xl font-bold tracking-tight opacity-40">—</p>
          <p className="text-xs opacity-60 mt-2">לא מסונכרן עדיין</p>
        </div>
        <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800">
          הרץ את <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">bank-scraper</code> כדי למשוך נתונים
        </div>
      </div>
    );
  }

  // ── Synced — main view ──────────────────────────────────────────────────────
  return (
    <div className={cn('rounded-2xl overflow-hidden shadow-lg', className)}>

      {/* ── Gradient header ──────────────────────────────────────────── */}
      <div className={cn(
        'p-5 text-white transition-colors duration-500',
        isPositive
          ? 'bg-gradient-to-br from-emerald-600 to-teal-700'
          : 'bg-gradient-to-br from-rose-600 to-red-700',
      )}>

        {/* Top row: title + last sync + refresh */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 opacity-90">
            <Building2 className="w-4 h-4" />
            <span className="text-sm font-semibold">סנכרון בנק</span>
          </div>
          <div className="flex items-center gap-2">
            {lastSync && (
              <span className="text-[11px] opacity-60">{relativeTime(lastSync)}</span>
            )}
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="opacity-60 hover:opacity-100 transition-opacity"
              title="רענן נתוני בנק"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', isFetching && 'animate-spin')} />
            </button>
          </div>
        </div>

        {/* Hero label */}
        <p className="text-[11px] opacity-70 mb-1 font-medium tracking-wide uppercase">
          {heroLabel}
        </p>

        {/* Hero number */}
        <motion.div
          key={heroValue}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="text-4xl font-bold tracking-tight"
        >
          <AnimatedNumber value={heroValue} format={v => formatCurrency(v)} />
        </motion.div>

        {/* Sub-label: account info or note */}
        {hasRealBalance ? (
          <div className="mt-1 space-y-0.5">
            {accountsWithBalance.map((a, i) => (
              <p key={i} className="text-[11px] opacity-60">
                {SOURCE_LABEL[a.source] || a.source}
                {a.account_number ? ` · ${a.account_number}` : ''}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-[11px] opacity-60 mt-1">
            {totalTxns} תנועות מסונכרנות ·
            {' '}יתרת חשבון לא זמינה ב{SOURCE_LABEL[sources[0]?.source] || 'בנק'}
          </p>
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
              <span className="opacity-60">· {src.total}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Income / Expense totals from bank transactions ────────────── */}
      <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800 rtl:divide-x-reverse">

        {/* Income */}
        <div className="p-4 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">הכנסות</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            <AnimatedNumber value={totalIncome} format={v => formatCurrency(v)} />
          </p>
          <div className="h-1 w-full bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
            <div className="h-full bg-emerald-500 rounded-full w-full" />
          </div>
        </div>

        {/* Expenses */}
        <div className="p-4 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">הוצאות</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            <AnimatedNumber value={totalExpense} format={v => formatCurrency(v)} />
          </p>
          <div className="h-1 w-full bg-red-100 dark:bg-red-900/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-red-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: totalIncome > 0 ? `${Math.min((totalExpense / totalIncome) * 100, 100)}%` : '0%' }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* ── Per-account real balances (if exposed) ────────────────────── */}
      {hasRealBalance && accountsWithBalance.length > 1 && (
        <div className="bg-gray-50 dark:bg-gray-800/60 border-t border-gray-100 dark:border-gray-700 px-4 py-3 space-y-1.5">
          {accountsWithBalance.map((a, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium">
                  {SOURCE_LABEL[a.source] || a.source}
                </span>
                {a.account_number && (
                  <span className="text-[10px] text-gray-400">{a.account_number}</span>
                )}
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {formatCurrency(Number(a.balance))}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Footer: sync cadence ──────────────────────────────────────── */}
      <div className="bg-gray-50 dark:bg-gray-800/40 border-t border-gray-100 dark:border-gray-700 px-4 py-2 text-center">
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          מסונכרן מ-bank-scraper · מתעדכן 3× ביום
        </span>
      </div>
    </div>
  );
};

export default ModernBalancePanel;
