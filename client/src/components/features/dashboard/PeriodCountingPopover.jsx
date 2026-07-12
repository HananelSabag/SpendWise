import React, { useEffect, useId, useRef, useState } from 'react';
import { CreditCard, Info, Landmark, Plus, X } from 'lucide-react';

import { cn } from '../../../utils/helpers';
import { getCommittedSpendingComposition } from '../../../utils/spendingComposition';

export default function PeriodCountingPopover({ accounting, formatCurrency, t }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const popoverId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const spending = accounting?.spending || {};
  const composition = getCommittedSpendingComposition(spending);
  const values = Object.fromEntries(composition.parts.map((part) => [part.key, part.value]));
  // Exact additive parts of committed calendar spending. The summarized bank
  // card settlement is a verification fact and is deliberately absent.
  const rows = [
    {
      key: 'bank', icon: Landmark,
      label: t('moneyModel.bankDirect'), value: values.bankDirect,
      tint: 'text-blue-600 dark:text-blue-300',
    },
    {
      key: 'bankPending', icon: Landmark,
      label: t('moneyModel.bankDirectPending'), value: values.bankDirectPending,
      tint: 'text-amber-600 dark:text-amber-300',
    },
    {
      key: 'cardPosted', icon: CreditCard,
      label: t('moneyModel.cardPurchases'), value: values.cardPosted,
      tint: 'text-violet-600 dark:text-violet-300',
    },
    {
      key: 'cardPending', icon: CreditCard,
      label: t('moneyModel.cardPurchasesPending'), value: values.cardPending,
      tint: 'text-amber-600 dark:text-amber-300',
    },
    {
      key: 'manual', icon: Plus,
      label: t('moneyModel.manual'), value: values.manual,
      tint: 'text-gray-600 dark:text-gray-300',
    },
  ].filter((row) => row.value !== 0);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-300"
        aria-expanded={open}
        aria-controls={popoverId}
        aria-haspopup="dialog"
        aria-label={t('moneyModel.title')}
      >
        <Info className="h-4 w-4" />
      </button>

      {open && (
        <div
          id={popoverId}
          role="dialog"
          aria-label={t('moneyModel.title')}
          className="absolute end-0 top-10 z-40 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-gray-200 bg-white p-4 text-start shadow-2xl dark:border-gray-700 dark:bg-gray-900"
        >
          <div className="mb-3 flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-gray-900 dark:text-white">{t('moneyModel.title')}</p>
              <p className="mt-1 text-[11px] leading-snug text-gray-500 dark:text-gray-400">{t('moneyModel.cashflowSubtitle')}</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label={t('common.close', { fallback: 'Close' })}>
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2">
            {rows.map(({ key, icon: Icon, label, value, tint }) => (
              <div key={key} className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 dark:bg-gray-800/70">
                <Icon className={cn('h-4 w-4 shrink-0', tint)} />
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-gray-700 dark:text-gray-200">{label}</span>
                <span className="shrink-0 text-xs font-bold tabular-nums text-gray-900 dark:text-white">{formatCurrency(value)}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-bold text-gray-900 dark:border-gray-800 dark:text-white">
            <span>{t('moneyModel.committedTotal')}</span>
            <span className="tabular-nums">{formatCurrency(composition.committed)}</span>
          </div>

          {!composition.reconciles && (
            <p role="alert" className="mt-2 text-[10px] font-semibold text-red-600 dark:text-red-400">
              {t('moneyModel.compositionMismatch')}
            </p>
          )}

          <p className="mt-3 text-[10px] leading-snug text-gray-400 dark:text-gray-500">
            {t('moneyModel.settlementHint')}
          </p>
        </div>
      )}
    </div>
  );
}
