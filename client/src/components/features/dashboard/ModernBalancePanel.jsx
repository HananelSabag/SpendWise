/**
 * ModernBalancePanel — Balance summary (dashboard hero)
 *
 * Shows the user's consolidated bank balance from /bank-sync/stats:
 *   - Real account balance (bank_accounts.balance) when the bank exposes it
 *   - "Not available" when it doesn't (e.g. Yahav via israeli-bank-scrapers)
 *
 * Slimmed intentionally: balance + freshness + source chips only. Per-source
 * income/expense detail lives in the dashboard's SourcesOverview, and
 * period-based income/expense in the PeriodSummary — this hero no longer
 * duplicates them. (Its old all-time income/expense/net block was ~half the
 * screen and its all-time totals visually conflicted with the period card
 * directly below it.)
 */

import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, RefreshCw, Landmark, CreditCard, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useCurrency, useTranslation } from '../../../stores';
import { cn } from '../../../utils/helpers';
import apiClient from '../../../api/client';
import { institutionLabel } from '../bankSync/bankSyncMeta';

// Brand gradient — feels like the SpendWise financial home, not a status panel.
const HERO_GRADIENT = 'bg-gradient-to-br from-indigo-600 to-purple-700';

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

  const hasSynced = sources && sources.length > 0;

  // Latest sync timestamp across all sources
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

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={cn('rounded-2xl overflow-hidden shadow-lg p-5', HERO_GRADIENT, className)}>
        <SkeletonBox className="h-3 w-24 mb-4" />
        <SkeletonBox className="h-9 w-40 mb-4" />
        <div className="flex gap-2">
          <SkeletonBox className="h-6 w-20 rounded-full" />
          <SkeletonBox className="h-6 w-20 rounded-full" />
        </div>
      </div>
    );
  }

  // ── Not synced — compact CTA to connect a bank (manual mode stays primary) ──
  if (!hasSynced) {
    return (
      <Link
        to="/bank-sync"
        className={cn(
          'block rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700',
          'hover:border-primary-400 dark:hover:border-primary-600 transition-colors group',
          'p-4 flex items-center gap-3',
          className,
        )}
      >
        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 flex items-center justify-center transition-colors shrink-0">
          <Plus className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('connectBank')}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{t('noConnectionsHint')}</p>
        </div>
      </Link>
    );
  }

  const timeLabel = relativeTime(lastSync, t);

  // ── Synced — compact balance-only hero ──────────────────────────────────────
  return (
    <div className={cn('rounded-2xl overflow-hidden shadow-lg text-white', HERO_GRADIENT, className)}>
      <div className="p-5">

        {/* Top row — title + freshness + refresh */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 opacity-90">
            <Building2 className="w-4 h-4" />
            <span className="text-sm font-semibold">{t('balanceHeroTitle')}</span>
          </div>
          <div className="flex items-center gap-2">
            {timeLabel && (
              <span className="text-[11px] opacity-60">{t('updatedAt', { time: timeLabel })}</span>
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

        {/* Balance */}
        <p className="text-[11px] uppercase tracking-wide opacity-70 mb-1 font-medium">
          {t('accountBalance')}
        </p>

        {hasRealBalance ? (
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
          <div>
            <p className="text-2xl font-bold opacity-50">{t('unavailable')}</p>
            <p className="text-[11px] opacity-50 mt-0.5">
              {t('unavailableNote', { bank: institutionLabel(sources[0]?.source) })}
            </p>
          </div>
        )}

        {/* Per-account rows when more than one account has a balance */}
        {hasRealBalance && accountsWithBalance.length > 1 && (
          <div className="mt-2 space-y-0.5">
            {accountsWithBalance.map((a, i) => (
              <p key={i} className="text-[11px] opacity-60">
                {institutionLabel(a.source)}
                {a.account_number ? ` · ${a.account_number}` : ''}
                {' · '}{formatCurrency(Number(a.balance))}
              </p>
            ))}
          </div>
        )}

        {/* Source chips — icon distinguishes a real bank account from a credit
            company (which never has a real balance here) */}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {sources.map(src => {
            const ChipIcon = src.kind === 'credit_card' ? CreditCard : Landmark;
            return (
              <span
                key={src.source}
                className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-white/20 font-medium"
              >
                <ChipIcon className="w-2.5 h-2.5" />
                {institutionLabel(src.source)}
                <span className="opacity-60">· {t('transactions', { count: src.total })}</span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ModernBalancePanel;
