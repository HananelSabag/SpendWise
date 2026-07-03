/**
 * 💳 TRANSACTION CARD — compact, quiet, bank-aware
 *
 * Design rules:
 * - One compact row: icon · description+meta · amount+actions.
 * - Color is reserved for the AMOUNT (the one thing that matters);
 *   everything else stays neutral so dark mode doesn't scream.
 * - Bank-synced rows (bank_source set) are read-only facts from the bank:
 *   they can be hidden (delete = soft-delete, dedup keeps them from
 *   re-importing) but NOT edited or duplicated.
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Landmark } from 'lucide-react';

import { useTranslation, useCurrency } from '../../../stores';
import { getIconComponent } from '../../../config/categoryIcons';
import { cn, dateHelpers } from '../../../utils/helpers';
import { institutionLabel } from '../bankSync/bankSyncMeta';
import OneTimeTransactionActions from './actions/OneTimeTransactionActions';

const ModernTransactionCard = ({
  transaction,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  viewMode = 'list',
  className = ''
}) => {
  const { t, isRTL } = useTranslation();
  const { formatCurrency } = useCurrency();

  const isIncome     = transaction?.type === 'income';
  const isBankSynced = Boolean(transaction?.bank_source);
  const amount       = Math.abs(transaction?.amount || 0);

  const date = useMemo(() => {
    const raw = transaction?.transaction_datetime || transaction?.created_at || transaction?.date;
    return raw ? new Date(raw) : new Date();
  }, [transaction]);

  const dateLabel = useMemo(() => {
    const today     = new Date();
    const yesterday = new Date(Date.now() - 86_400_000);
    if (date.toDateString() === today.toDateString())     return t('date.today', 'Today');
    if (date.toDateString() === yesterday.toDateString()) return t('date.yesterday', 'Yesterday');
    return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  }, [date, t]);

  const Icon = useMemo(() => {
    try { return getIconComponent(transaction?.category_icon || transaction?.category?.icon || 'Receipt'); }
    catch { return null; }
  }, [transaction]);

  const sourceLabel = isBankSynced
    ? institutionLabel(transaction.bank_source)
    : t('transactions.manualEntry', 'Manual entry');

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'relative group rounded-xl border transition-colors',
        'bg-white dark:bg-gray-800/80',
        isSelected
          ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50/60 dark:bg-indigo-900/15'
          : 'border-gray-100 dark:border-gray-700/60 hover:border-gray-200 dark:hover:border-gray-600',
        className
      )}
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      <div className="flex items-center gap-3 px-3 py-2.5">

        {/* Category icon — neutral container, quiet tinted glyph */}
        <div className="relative shrink-0">
          <div className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center',
            'bg-gray-100 dark:bg-gray-700/60',
            isIncome
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-red-500 dark:text-red-400/90'
          )}>
            {Icon && <Icon className="w-4.5 h-4.5 w-[18px] h-[18px]" />}
          </div>
        </div>

        {/* Description + meta */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate leading-snug">
            {transaction?.description || t('transactions.noDescription', 'No description')}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5 flex items-center gap-1">
            {isBankSynced && <Landmark className="w-3 h-3 shrink-0" />}
            <span className="truncate">{sourceLabel}</span>
            <span>·</span>
            <span className="shrink-0">{dateLabel}</span>
          </p>
        </div>

        {/* Amount + actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={cn(
            'font-semibold text-sm tabular-nums whitespace-nowrap',
            isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
          )}>
            {isIncome ? '+' : '−'}{formatCurrency(amount)}
          </span>

          {/* Actions: bank rows are read-only facts — delete only.
              Manual rows get the full set. */}
          <OneTimeTransactionActions
            transaction={transaction}
            onEdit={isBankSynced ? undefined : onEdit}
            onDelete={onDelete}
            onDuplicate={isBankSynced ? undefined : onDuplicate}
            onSuccess={() => {}}
            variant="compact"
            readOnly={isBankSynced}
          />

          {/* Select checkbox (bulk mode) */}
          {onSelect && (
            <button
              onClick={e => { e.stopPropagation(); onSelect(transaction.id, !isSelected); }}
              className={cn(
                'w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0',
                isSelected
                  ? 'bg-indigo-500 border-indigo-500 text-white'
                  : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400'
              )}
              aria-label={t('actions.select', 'Select')}
            >
              {isSelected && <span className="text-[10px] leading-none">✓</span>}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ModernTransactionCard;
