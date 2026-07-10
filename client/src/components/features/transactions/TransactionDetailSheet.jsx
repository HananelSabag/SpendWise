/**
 * TransactionDetailSheet — full detail for a single transaction.
 *
 * Item 12: transaction descriptions are truncated in the list, so selecting a
 * row opens this view with EVERYTHING — full (untruncated) description, amount,
 * date, source, account/card, movement type, origin/status and metadata.
 *
 * Presentation: BottomSheet on mobile, centered Modal on desktop (same content
 * either way). Bank-synced rows are read-only facts (delete only); manual rows
 * keep edit/duplicate/delete — matching ModernTransactionCard's action rules.
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pencil, Copy, Trash2 } from 'lucide-react';

import { useTranslation, useCurrency } from '../../../stores';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { cn } from '../../../utils/helpers';
import BottomSheet from '../../common/BottomSheet';
import {
  institutionLabel,
  institutionIcon,
  institutionKind,
  bankBrand,
} from '../bankSync/bankSyncMeta';

// One label/value row. `value` may be any node; skipped entirely when empty.
const Field = ({ label, value, mono = false }) => {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="shrink-0 text-xs font-medium text-gray-400 dark:text-gray-500">{label}</span>
      <span
        className={cn(
          'min-w-0 text-end text-sm font-medium text-gray-900 dark:text-gray-100',
          mono && 'font-mono text-xs text-gray-500 dark:text-gray-400',
          'break-words',
        )}
      >
        {value}
      </span>
    </div>
  );
};

const DetailBody = ({ transaction, t, currentLanguage, formatCurrency, onEdit, onDelete, onDuplicate, onClose }) => {
  if (!transaction) return null;

  const isIncome = transaction.type === 'income';
  const isBankSynced = Boolean(transaction.bank_source);
  const amount = Math.abs(Number(transaction.amount) || 0);
  const kind = institutionKind(transaction.bank_source);
  const Icon = institutionIcon(transaction.bank_source);

  const rawDate = transaction.transaction_datetime || transaction.date || transaction.created_at;
  const dateLabel = rawDate
    ? new Date(rawDate).toLocaleDateString(currentLanguage === 'he' ? 'he-IL' : 'en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    : null;
  const createdLabel = transaction.created_at
    ? new Date(transaction.created_at).toLocaleDateString(currentLanguage === 'he' ? 'he-IL' : 'en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
      })
    : null;

  const sourceLabel = isBankSynced
    ? institutionLabel(transaction.bank_source, currentLanguage)
    : t('detail.manual', { fallback: 'Manual entry' });

  const movementLabel = !isBankSynced
    ? t('sourceKind.manual', { fallback: 'Manual' })
    : kind === 'credit_card'
      ? t('sourceKind.cardPurchase', { fallback: 'Card purchase' })
      : t('sourceKind.bankMovement', { fallback: 'Bank movement' });

  const originLabel = isBankSynced
    ? t('detail.originBank', { fallback: 'Synced from your bank · read-only' })
    : t('detail.originManual', { fallback: 'Manual entry you added' });

  const canEdit = !isBankSynced && onEdit;
  const canDuplicate = !isBankSynced && onDuplicate;
  const canDelete = Boolean(onDelete);

  const act = (fn) => () => { onClose?.(); fn?.(transaction); };

  return (
    <div className="px-4 pb-5 pt-1 sm:px-5">
      {/* Hero row — icon + amount + type */}
      <div className="flex items-center gap-3 pb-4">
        <div className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
          isBankSynced
            ? `bg-gradient-to-br ${bankBrand(transaction.bank_source).gradient} text-white`
            : 'bg-gray-100 text-gray-500 dark:bg-gray-700/60 dark:text-gray-400',
        )}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn(
            'text-2xl font-bold tabular-nums',
            isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400',
          )}>
            {isIncome ? '+' : '−'}{formatCurrency(amount)}
          </p>
          <span className={cn(
            'mt-0.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold',
            isIncome
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300'
              : 'bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-300',
          )}>
            {isIncome ? t('types.income', { fallback: 'Income' }) : t('types.expense', { fallback: 'Expense' })}
          </span>
        </div>
      </div>

      {/* Full description — never truncated */}
      <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/60">
        <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
          {t('detail.description', { fallback: 'Description' })}
        </p>
        <p className="mt-1 text-sm font-semibold leading-relaxed text-gray-900 dark:text-white break-words">
          {transaction.description || t('noDescription', { fallback: 'No description' })}
        </p>
      </div>

      {/* Fields */}
      <div className="mt-2 divide-y divide-gray-100 dark:divide-gray-800">
        <Field label={t('detail.date', { fallback: 'Date' })} value={dateLabel} />
        <Field label={t('detail.source', { fallback: 'Source' })} value={sourceLabel} />
        <Field label={t('detail.movement', { fallback: 'Movement' })} value={movementLabel} />
        <Field label={t('detail.account', { fallback: 'Account / card' })} value={transaction.bank_account_number} />
        <Field label={t('detail.category', { fallback: 'Category' })} value={(transaction.raw_category || '').trim()} />
        <Field label={t('detail.notes', { fallback: 'Notes' })} value={(transaction.notes || '').trim()} />
        <Field label={t('detail.origin', { fallback: 'Origin' })} value={originLabel} />
        <Field label={t('detail.addedOn', { fallback: 'Added on' })} value={createdLabel} />
        <Field label={t('detail.id', { fallback: 'Reference' })} value={transaction.id} mono />
      </div>

      {/* Actions */}
      {(canEdit || canDuplicate || canDelete) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {canEdit && (
            <button
              onClick={act(onEdit)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <Pencil className="h-4 w-4" /> {t('detail.edit', { fallback: 'Edit' })}
            </button>
          )}
          {canDuplicate && (
            <button
              onClick={act(onDuplicate)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <Copy className="h-4 w-4" /> {t('detail.duplicate', { fallback: 'Duplicate' })}
            </button>
          )}
          {canDelete && (
            <button
              onClick={act(onDelete)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/40"
            >
              <Trash2 className="h-4 w-4" /> {t('detail.delete', { fallback: 'Delete' })}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const TransactionDetailSheet = ({ transaction, isOpen, onClose, onEdit, onDelete, onDuplicate }) => {
  const { t, currentLanguage } = useTranslation('transactions');
  const { formatCurrency } = useCurrency();
  const isMobile = useIsMobile();

  const title = t('detail.title', { fallback: 'Transaction details' });
  const body = (
    <DetailBody
      transaction={transaction}
      t={t}
      currentLanguage={currentLanguage}
      formatCurrency={formatCurrency}
      onEdit={onEdit}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
      onClose={onClose}
    />
  );

  // Mobile — reuse the app's BottomSheet (drag-to-dismiss, back-gesture aware).
  if (isMobile) {
    return (
      <BottomSheet isOpen={isOpen} onClose={onClose} title={title}>
        {body}
      </BottomSheet>
    );
  }

  // Desktop — centered modal.
  return createPortal(
    <AnimatePresence>
      {isOpen && transaction && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900"
            style={{ direction: currentLanguage === 'he' ? 'rtl' : 'ltr' }}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-3.5 dark:border-gray-800">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                aria-label={t('actions.close', { fallback: 'Close' })}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{body}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.getElementById('portal-root') || document.body,
  );
};

export default TransactionDetailSheet;
