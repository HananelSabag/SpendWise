/**
 * ModernBalancePanel — Balance summary (dashboard hero)
 *
 * The architecture refactor made "one account balance" a wrong assumption: a
 * user can have Leumi + Poalim + Discount + Yahav at once. So the hero lists
 * EACH bank account separately, then a clear "Total bank balance" summary —
 * never a single blended number that hides which account holds what.
 *
 *   - Real account balance (bank_accounts.balance) when the bank exposes it
 *   - "Not available" when it doesn't (e.g. Yahav via israeli-bank-scrapers),
 *     shown per-account and excluded from the total
 *
 * A credit company (max/isracard/cal) NEVER has a balance — only charges — so
 * it never appears in the balance list or the total; it stays a source chip.
 * Income and spending live in the salary-cycle card; this hero stays balance-only.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, RefreshCw, Plus, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useAuth, useCurrency, useTranslation } from '../../../stores';
import { cn } from '../../../utils/helpers';
import apiClient from '../../../api/client';
import { institutionLabel } from '../bankSync/bankSyncMeta';
import { computeBankBalance } from '../../../utils/bankBalance';

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

// One account row inside the multi-account list. `balance === null` means the
// bank doesn't expose it (Yahav) — we say so instead of printing a fake 0.
const AccountRow = ({ label, balance, formatCurrency, unavailableLabel }) => (
  <div className="flex items-baseline justify-between gap-3 py-1.5">
    <span className="min-w-0 truncate text-sm font-medium text-white/90">{label}</span>
    <span
      className={cn(
        'shrink-0 tabular-nums',
        balance === null
          ? 'text-xs font-medium text-white/50'
          : 'text-sm font-bold text-white',
      )}
    >
      {balance === null ? unavailableLabel : formatCurrency(balance)}
    </span>
  </div>
);

// ── Main ──────────────────────────────────────────────────────────────────────
const ModernBalancePanel = ({ className = '' }) => {
  const { formatCurrency } = useCurrency();
  const { t, currentLanguage } = useTranslation('bankSync');
  const { user } = useAuth();

  const { data: sources, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['bankBalances', user?.id],
    queryFn: () => apiClient.get('/bank-sync/stats', { params: { periodOffset: 0 } }).then(r => r.data.sources || []),
    staleTime: 5 * 60_000,
    retry: 1,
  });

  // The balance reduction is shared with the financial-cycle page (utils/bankBalance) so the
  // two screens can never disagree on how much is in the account. Only the labels stay here —
  // they are language-specific. Presentation below is unchanged.
  const {
    hasSynced, lastSync, bankSources, hasBankSource,
    bankAccounts: rawBankAccounts, accountsWithBalance,
    hasRealBalance, totalRealBalance, multiAccount,
  } = computeBankBalance(sources);
  const bankAccounts = rawBankAccounts.map(a => ({
    ...a,
    label: institutionLabel(a.source, currentLanguage) + (a.accountNumber ? ` · ${a.accountNumber}` : ''),
  }));

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

  // ── Load failure — say so. NEVER show the "connect a bank" CTA on an
  // error: telling a user with connected banks that they have none is the
  // fastest way to make a finance app feel untrustworthy. ──
  if (isError && !sources) {
    return (
      <div className={cn(
        'rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20',
        'p-4 flex items-center gap-3',
        className,
      )}>
        <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
        <p className="text-sm text-red-700 dark:text-red-300 flex-1 min-w-0">
          {t('statsLoadError')}
        </p>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 text-xs font-semibold text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', isFetching && 'animate-spin')} />
          {t('retry')}
        </button>
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
  const unavailableLabel = t('unavailable');

  // ── Synced — balance hero ────────────────────────────────────────────────────
  return (
    <div className={cn('rounded-2xl overflow-hidden shadow-md text-white', HERO_GRADIENT, className)}>
      <div className="p-4">

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
          </div>
        </div>

        {!hasBankSource ? (
          // Only credit companies connected — there is no balance to total.
          <div>
            <p className="text-[11px] uppercase tracking-wide opacity-70 mb-1 font-medium">
              {t('accountBalance')}
            </p>
            <p className="text-2xl font-bold opacity-50">{unavailableLabel}</p>
            <p className="text-[11px] opacity-50 mt-0.5">{t('balanceNeedsBank')}</p>
          </div>
        ) : multiAccount ? (
          // Multiple bank accounts — list each, then a clear total.
          <div>
            <p className="text-[11px] uppercase tracking-wide opacity-70 mb-1 font-medium">
              {t('accountsListTitle')}
            </p>
            <div className="divide-y divide-white/10">
              {bankAccounts.map((a, i) => (
                <AccountRow
                  key={`${a.source}-${a.accountNumber || i}`}
                  label={a.label}
                  balance={a.balance}
                  formatCurrency={formatCurrency}
                  unavailableLabel={unavailableLabel}
                />
              ))}
            </div>

            <div className="mt-3 border-t border-white/25 pt-3 flex items-end justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-wide opacity-80">
                {t('totalBankBalance')}
              </span>
              {hasRealBalance ? (
                <motion.span
                  key={totalRealBalance}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="text-2xl font-bold tracking-tight tabular-nums sm:text-3xl"
                >
                  <AnimatedNumber value={totalRealBalance} format={v => formatCurrency(v)} />
                </motion.span>
              ) : (
                <span className="text-lg font-bold opacity-50">{unavailableLabel}</span>
              )}
            </div>
            {hasRealBalance && accountsWithBalance.length < bankAccounts.length && (
              <p className="mt-1 text-[10px] opacity-50">{t('totalExcludesUnavailable')}</p>
            )}
          </div>
        ) : (
          // Exactly one bank account — the classic single big-number hero.
          <div>
            <p className="text-[11px] uppercase tracking-wide opacity-70 mb-1 font-medium">
              {t('accountBalance')}
            </p>
            {hasRealBalance ? (
              <>
                <motion.div
                  key={totalRealBalance}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="text-4xl font-bold tracking-tight"
                >
                  <AnimatedNumber value={totalRealBalance} format={v => formatCurrency(v)} />
                </motion.div>
                <p className="mt-1 text-[11px] opacity-60 truncate">{bankAccounts[0]?.label}</p>
              </>
            ) : (
              <div>
                <p className="text-2xl font-bold opacity-50">{unavailableLabel}</p>
                <p className="text-[11px] opacity-50 mt-0.5">
                  {t('unavailableNote', { bank: institutionLabel(bankSources[0]?.source, currentLanguage) })}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernBalancePanel;
