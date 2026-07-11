import React, { useEffect, useRef, useState } from 'react';
import { CreditCard, Info, Landmark, Plus, X } from 'lucide-react';

import { cn } from '../../../utils/helpers';

export default function PeriodCountingPopover({ summary, formatCurrency, t }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

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

  // Cash-flow model: expenses = money that actually left the bank (direct
  // debits + the credit-card bill) + manual entries. Individual card purchases
  // are breakdown detail, not re-counted here.
  const rows = [
    {
      key: 'bank',
      icon: Landmark,
      label: t('moneyModel.bankDirect', { fallback: 'Bank account movement' }),
      value: Math.abs(Number(summary?.bank_direct_expenses) || 0),
      tint: 'text-blue-600 dark:text-blue-300',
    },
    {
      key: 'cardBill',
      icon: CreditCard,
      label: t('moneyModel.cardBill', { fallback: 'Credit-card bill (paid from bank)' }),
      value: Math.abs(Number(summary?.bank_card_settlements) || 0),
      tint: 'text-violet-600 dark:text-violet-300',
    },
    {
      key: 'manual',
      icon: Plus,
      label: t('moneyModel.manual', { fallback: 'Manual entries' }),
      value: Math.abs(Number(summary?.manual_expenses) || 0),
      tint: 'text-gray-600 dark:text-gray-300',
    },
  ].filter((row) => row.value > 0);

  const cardPurchases = Math.abs(Number(summary?.card_charges) || 0);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-300"
        aria-expanded={open}
        aria-label={t('moneyModel.title', { fallback: 'How this period is counted' })}
      >
        <Info className="h-4 w-4" />
      </button>

      {open && (
        <div
          role="tooltip"
          className="absolute end-0 top-10 z-40 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-gray-200 bg-white p-4 text-start shadow-2xl dark:border-gray-700 dark:bg-gray-900"
        >
          <div className="mb-3 flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {t('moneyModel.title', { fallback: 'How this period is counted' })}
              </p>
              <p className="mt-1 text-[11px] leading-snug text-gray-500 dark:text-gray-400">
                {t('moneyModel.cashflowSubtitle', {
                  fallback: 'We count money that actually moved through your bank — including your credit-card bill. Individual card purchases show in the breakdown, not added again.',
                })}
              </p>
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

          {cardPurchases > 0 && (
            <div className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-800">
              <div className="flex items-center gap-2 rounded-xl bg-violet-50/70 px-3 py-2 dark:bg-violet-950/20">
                <CreditCard className="h-4 w-4 shrink-0 text-violet-500" />
                <span className="min-w-0 flex-1 text-xs font-medium text-gray-700 dark:text-gray-200">
                  {t('moneyModel.cardPurchases', { fallback: 'Itemized card purchases' })}
                </span>
                <span className="shrink-0 text-xs font-bold tabular-nums text-violet-700 dark:text-violet-300">
                  {formatCurrency(cardPurchases)}
                </span>
              </div>
              <p className="mt-1.5 text-[10px] leading-snug text-gray-400 dark:text-gray-500">
                {t('moneyModel.cardPurchasesHint', {
                  fallback: 'Shown for reconciliation; not added again because the bank card bill is already counted above.',
                })}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
