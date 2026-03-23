/**
 * 💳 TRANSACTION CARD
 * Mobile-first, accessible, smart action routing
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Repeat, Calendar, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';

import { useTranslation, useCurrency } from '../../../stores';
import { getIconComponent } from '../../../config/categoryIcons';
import { cn, dateHelpers } from '../../../utils/helpers';
import { Tooltip } from '../../ui';
import RecurringTransactionActions from './actions/RecurringTransactionActions';
import OneTimeTransactionActions from './actions/OneTimeTransactionActions';

// ── Sub-components ────────────────────────────────────────────────────────────

const RecurringBadge = ({ transaction }) => {
  const { t } = useTranslation();
  if (!transaction?.template_id && !transaction?.is_recurring) return null;
  return (
    <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-md border-2 border-white dark:border-gray-800 flex items-center justify-center">
      <Tooltip content={t('transactions.recurring.tooltip', 'Recurring Transaction')}>
        <Repeat className="w-3 h-3" />
      </Tooltip>
    </div>
  );
};

const TypeBadge = ({ isIncome, isRecurring }) => {
  const { t } = useTranslation();
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border',
      isIncome
        ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
        : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
    )}>
      {isIncome ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {isIncome ? t('transactions.types.income', 'Income') : t('transactions.types.expense', 'Expense')}
      {isRecurring && <Repeat className="w-3 h-3 ml-0.5 text-purple-500" />}
    </span>
  );
};

// ── Main Card ─────────────────────────────────────────────────────────────────

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

  const isIncome   = transaction?.type === 'income';
  const isRecurring = Boolean(transaction?.template_id || transaction?.is_recurring);
  const amount     = Math.abs(transaction?.amount || 0);

  // Date / time helpers
  const date = useMemo(() => {
    const raw = transaction?.transaction_datetime || transaction?.created_at || transaction?.date;
    return raw ? new Date(raw) : new Date();
  }, [transaction]);

  const dateLabel = useMemo(() => {
    const today     = new Date();
    const yesterday = new Date(Date.now() - 86_400_000);
    if (date.toDateString() === today.toDateString())     return t('date.today', 'Today');
    if (date.toDateString() === yesterday.toDateString()) return t('date.yesterday', 'Yesterday');
    return date.toLocaleDateString();
  }, [date, t]);

  const timeLabel = useMemo(() => {
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      if (transaction?.transaction_datetime) {
        try {
          const tz   = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const name = tz.split('/').pop()?.toLowerCase().replace('jerusalem', 'israel') ?? 'local';
          const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
          return `${name} ${time}`;
        } catch { /* fallthrough */ }
      }
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    return dateHelpers.fromNow(date);
  }, [date, transaction]);

  // Category icon
  const Icon = useMemo(() => {
    try { return getIconComponent(transaction?.category_icon || transaction?.category?.icon || 'Receipt'); }
    catch { return null; }
  }, [transaction]);

  const isGrid = viewMode === 'grid';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        'relative group transition-shadow duration-200',
        'bg-white dark:bg-gray-800 border-2 shadow-sm hover:shadow-md',
        isGrid ? 'rounded-2xl p-5' : 'rounded-xl p-4',
        isSelected
          ? 'ring-2 ring-blue-500 ring-offset-1 border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20'
          : isRecurring
            ? 'border-purple-200 dark:border-purple-800'
            : isIncome
              ? 'border-l-4 border-l-green-400 dark:border-l-green-500 border-t-gray-200 border-r-gray-200 border-b-gray-200 dark:border-t-gray-700 dark:border-r-gray-700 dark:border-b-gray-700'
              : 'border-l-4 border-l-red-400 dark:border-l-red-500 border-t-gray-200 border-r-gray-200 border-b-gray-200 dark:border-t-gray-700 dark:border-r-gray-700 dark:border-b-gray-700',
        className
      )}
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      {/* Selection check */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            className="absolute -top-2 -left-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold z-10"
          >✓</motion.div>
        )}
      </AnimatePresence>

      <div className={cn('flex gap-3', isGrid && 'flex-col items-center text-center', isRTL && !isGrid && 'flex-row-reverse')}>
        {/* Category icon */}
        <div className="relative flex-shrink-0">
          <div className={cn(
            'rounded-xl flex items-center justify-center shadow-md border',
            isGrid ? 'w-14 h-14' : 'w-10 h-10 sm:w-12 sm:h-12',
            isIncome
              ? 'bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900/40 dark:to-emerald-900/40 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300'
              : 'bg-gradient-to-br from-red-100 to-rose-200 dark:from-red-900/40 dark:to-rose-900/40 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300'
          )}>
            {Icon && <Icon className={cn('stroke-2', isGrid ? 'w-7 h-7' : 'w-5 h-5 sm:w-6 sm:h-6')} />}
            {/* +/- dot */}
            <div className={cn(
              'absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold',
              isIncome ? 'bg-green-600 dark:bg-green-500' : 'bg-red-600 dark:bg-red-500'
            )}>
              {isIncome ? '+' : '−'}
            </div>
          </div>
          <RecurringBadge transaction={transaction} />
        </div>

        {/* Details */}
        <div className={cn('flex-1 min-w-0 space-y-1.5', isGrid && 'w-full')}>
          {/* Description + Amount */}
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">
              {transaction?.description || t('transactions.noDescription', 'No description')}
            </h4>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={cn(
                'font-bold text-sm sm:text-base tabular-nums whitespace-nowrap',
                isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              )}>
                {isIncome ? '+' : '−'}{formatCurrency(amount)}
              </span>
              {/* Select checkbox */}
              {onSelect && (
                <button
                  onClick={e => { e.stopPropagation(); onSelect(transaction.id, !isSelected); }}
                  className={cn(
                    'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                    isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                  )}
                  aria-label={t('actions.select', 'Select')}
                >
                  {isSelected && <span className="text-xs leading-none">✓</span>}
                </button>
              )}
            </div>
          </div>

          {/* Category + type */}
          <div className={cn('flex items-center gap-2 flex-wrap', isGrid && 'justify-center')}>
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {transaction?.category_name || transaction?.category?.name || t('categories.uncategorized', 'Uncategorized')}
            </span>
            <span className="text-gray-300 dark:text-gray-600 text-xs">•</span>
            <TypeBadge isIncome={isIncome} isRecurring={isRecurring} />
          </div>

          {/* Date + time */}
          <div className={cn('flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500', isGrid && 'justify-center')}>
            <Calendar className="w-3 h-3" />
            <span>{dateLabel}</span>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <Clock className="w-3 h-3" />
            <span>{timeLabel}</span>
          </div>

          {/* Actions */}
          <div className={cn('flex', isGrid ? 'justify-center mt-2 pt-2 border-t border-gray-200 dark:border-gray-700' : 'justify-end')}>
            {isRecurring ? (
              <RecurringTransactionActions transaction={transaction} onEdit={onEdit} onDelete={onDelete} onSuccess={() => {}} variant="compact" />
            ) : (
              <OneTimeTransactionActions transaction={transaction} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} onSuccess={() => {}} variant="compact" />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ModernTransactionCard;
