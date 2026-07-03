/**
 * Shared branding + formatting for the Bank Sync feature.
 * Bank colors are used consistently across the picker, connection cards,
 * and stats cards so a bank always looks the same everywhere.
 */

// Per-bank gradient (icon square) + soft tint (card) — matches the app's
// gradient-icon language (see ModernTransactionCard, page headers).
export const BANK_BRAND = {
  yahav:    { gradient: 'from-blue-500 to-blue-700',       tint: 'bg-blue-50/60 dark:bg-blue-950/20' },
  leumi:    { gradient: 'from-indigo-500 to-indigo-800',   tint: 'bg-indigo-50/60 dark:bg-indigo-950/20' },
  isracard: { gradient: 'from-rose-500 to-rose-700',       tint: 'bg-rose-50/60 dark:bg-rose-950/20' },
  max:      { gradient: 'from-sky-500 to-blue-600',        tint: 'bg-sky-50/60 dark:bg-sky-950/20' },
  discount: { gradient: 'from-amber-500 to-orange-600',    tint: 'bg-amber-50/60 dark:bg-amber-950/20' },
};

export function bankBrand(source) {
  return BANK_BRAND[source] || { gradient: 'from-gray-400 to-gray-600', tint: 'bg-gray-50 dark:bg-gray-800/40' };
}

// Institution registry — mirrors server/config/institutions.js. A bank
// account (real balance, direct debits) is not the same kind of thing as a
// credit card company (billing-cycle charges, no real balance); this is the
// single client-side source of truth for that distinction and display name.
export const INSTITUTIONS = {
  yahav:    { kind: 'bank',        label: 'Bank Yahav' },
  leumi:    { kind: 'bank',        label: 'Bank Leumi' },
  discount: { kind: 'bank',        label: 'Discount Bank' },
  isracard: { kind: 'credit_card', label: 'Isracard' },
  max:      { kind: 'credit_card', label: 'Max' },
};

export function institutionKind(source) {
  return INSTITUTIONS[source]?.kind || null;
}

export function institutionLabel(source) {
  return INSTITUTIONS[source]?.label || source;
}

// Connection status → badge styling + translation key.
export const STATUS_STYLE = {
  active: {
    key: 'statusActive',
    cls: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500',
  },
  paused: {
    key: 'statusPaused',
    cls: 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600',
    dot: 'bg-gray-400',
  },
  error: {
    key: 'statusError',
    cls: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
    dot: 'bg-red-500',
  },
};

export function formatDateTime(iso, lang) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(lang === 'he' ? 'he-IL' : 'en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function formatILS(n, lang) {
  return Number(n || 0).toLocaleString(lang === 'he' ? 'he-IL' : 'en-US', {
    style: 'currency', currency: 'ILS', maximumFractionDigits: 0,
  });
}
