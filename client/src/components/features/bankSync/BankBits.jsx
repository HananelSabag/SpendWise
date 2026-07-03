/**
 * Small shared presentational bits for the Bank Sync feature:
 * BankIcon (gradient square) and StatusBadge (connection status chip).
 */

import React from 'react';
import { Landmark, CreditCard } from 'lucide-react';
import { cn } from '../../../utils/helpers';
import { bankBrand, institutionKind, STATUS_STYLE } from './bankSyncMeta';

// Gradient icon square in the app's house style (see ModernTransactionCard).
// A credit card company gets the card glyph — it's a categorically different
// kind of source (billing-cycle charges, no real bank balance) from a bank
// account, and the icon should say so at a glance.
export function BankIcon({ source, size = 'md' }) {
  const { gradient } = bankBrand(source);
  const dims = size === 'lg' ? 'w-12 h-12' : size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const icon = size === 'lg' ? 'w-6 h-6' : size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const Icon = institutionKind(source) === 'credit_card' ? CreditCard : Landmark;
  return (
    <div className={cn(
      'shrink-0 rounded-xl flex items-center justify-center shadow-sm bg-gradient-to-br',
      dims, gradient,
    )}>
      <Icon className={cn('text-white', icon)} />
    </div>
  );
}

// Connection status chip — dot + label, in the app's bordered-badge style.
export function StatusBadge({ status, t }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.paused;
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border',
      s.cls,
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', s.dot)} />
      {t(s.key)}
    </span>
  );
}
