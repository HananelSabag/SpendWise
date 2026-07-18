/**
 * BankStatsCard — operational sync health for one institution: transaction count,
 * last sync, and per-account balances/toggles. Financial totals belong to the cycle engine.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { cn } from '../../../utils/helpers';
import { bankBrand, institutionKind, formatDateTime } from './bankSyncMeta';
import { BankIcon } from './BankBits';
import BankAccountRow from './BankAccountRow';

export default function BankStatsCard({ stat, connectionId, t, lang }) {
  const { tint } = bankBrand(stat.source);
  const accounts = stat.accounts || [];
  const multi = accounts.length > 1;
  const isCreditCard = (stat.kind || institutionKind(stat.source)) === 'credit_card';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('rounded-xl border border-gray-200/70 dark:border-gray-700/70 shadow-sm p-4', tint)}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <BankIcon source={stat.source} />
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white truncate">{t(`bankNames.${stat.source}`)}</p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {formatDateTime(stat.last_sync, lang)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-lg bg-white/70 px-3 py-2.5 dark:bg-gray-900/40">
        <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{t('transactionsShort')}</p>
        <p className="text-lg font-bold tabular-nums text-gray-900 dark:text-white">{stat.total}</p>
      </div>

      {/* Accounts + per-account toggle */}
      <div className="mt-3 rounded-lg bg-white/70 dark:bg-gray-900/40 px-3 py-1.5">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pt-1">
          {isCreditCard
            ? t('cardActivity', { fallback: 'Card Activity' })
            : (multi ? t('accounts') : t('accountBalance'))}
        </p>
        {accounts.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {accounts.map((a, i) => (
              <BankAccountRow
                key={i}
                account={a}
                connectionId={connectionId}
                t={t}
                lang={lang}
                hideBalance={isCreditCard}
              />
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-gray-400 dark:text-gray-500 italic py-2">{t('balanceUnavailableNote')}</p>
        )}
      </div>
    </motion.div>
  );
}
