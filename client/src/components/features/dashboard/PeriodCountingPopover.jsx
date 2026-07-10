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

  const rows = [
    {
      key: 'bank',
      icon: Landmark,
      label: t('moneyModel.bankDirect', { fallback: 'Bank account movement' }),
      value: Math.abs(Number(summary?.bank_direct_expenses) || 0),
      tint: 'text-blue-600 dark:text-blue-300',
    },
    {
      key: 'card',
      icon: CreditCard,
      label: t('moneyModel.cardPurchases', { fallback: 'Credit-card statement charges' }),
      value: Math.abs(Number(summary?.card_charges) || 0),
      tint: 'text-violet-600 dark:text-violet-300',
    },
    {
      key: 'manual',
      icon: Plus,
      label: t('moneyModel.manual', { fallback: 'Manual entries' }),
      value: Math.abs(Number(summary?.manual_expenses) || 0),
      tint: 'text-gray-600 dark:text-gray-300',
    },
  ];

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
                {t('moneyModel.statementSubtitle', {
                  fallback: 'Cards use their payment date. Bank card settlements are excluded when itemized card detail is available.',
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
        </div>
      )}
    </div>
  );
}

