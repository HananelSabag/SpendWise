/**
 * Shared branding + formatting for the Bank Sync feature.
 * Bank colors are used consistently across the picker, connection cards,
 * and stats cards so a bank always looks the same everywhere.
 */

import { Landmark, CreditCard, PencilLine } from 'lucide-react';

// Per-bank gradient (icon square) + soft tint (card) — matches the app's
// gradient-icon language (see ModernTransactionCard, page headers).
export const BANK_BRAND = {
  yahav:         { gradient: 'from-blue-500 to-blue-700',       tint: 'bg-blue-50/60 dark:bg-blue-950/20' },
  hapoalim:      { gradient: 'from-red-500 to-rose-700',        tint: 'bg-red-50/60 dark:bg-red-950/20' },
  leumi:         { gradient: 'from-indigo-500 to-indigo-800',   tint: 'bg-indigo-50/60 dark:bg-indigo-950/20' },
  mizrahi:       { gradient: 'from-orange-500 to-red-600',      tint: 'bg-orange-50/60 dark:bg-orange-950/20' },
  discount:      { gradient: 'from-amber-500 to-orange-600',    tint: 'bg-amber-50/60 dark:bg-amber-950/20' },
  mercantile:    { gradient: 'from-lime-500 to-emerald-600',    tint: 'bg-lime-50/60 dark:bg-lime-950/20' },
  otsar_hahayal: { gradient: 'from-teal-500 to-cyan-700',       tint: 'bg-teal-50/60 dark:bg-teal-950/20' },
  beinleumi:     { gradient: 'from-cyan-500 to-blue-700',       tint: 'bg-cyan-50/60 dark:bg-cyan-950/20' },
  massad:        { gradient: 'from-emerald-500 to-teal-700',    tint: 'bg-emerald-50/60 dark:bg-emerald-950/20' },
  pagi:          { gradient: 'from-slate-500 to-zinc-700',      tint: 'bg-slate-50/60 dark:bg-slate-800/20' },
  isracard:      { gradient: 'from-rose-500 to-rose-700',       tint: 'bg-rose-50/60 dark:bg-rose-950/20' },
  amex:          { gradient: 'from-blue-600 to-sky-800',        tint: 'bg-blue-50/60 dark:bg-blue-950/20' },
  visa_cal:      { gradient: 'from-violet-500 to-fuchsia-700',  tint: 'bg-violet-50/60 dark:bg-violet-950/20' },
  max:           { gradient: 'from-sky-500 to-blue-600',        tint: 'bg-sky-50/60 dark:bg-sky-950/20' },
};

export function bankBrand(source) {
  return BANK_BRAND[source] || { gradient: 'from-gray-400 to-gray-600', tint: 'bg-gray-50 dark:bg-gray-800/40' };
}

// Institution registry — mirrors server/config/institutions.js. A bank
// account (real balance, direct debits) is not the same kind of thing as a
// credit card company (billing-cycle charges, no real balance); this is the
// single client-side source of truth for that distinction and display name.
export const INSTITUTIONS = {
  yahav:         { kind: 'bank',        label: 'Bank Yahav' },
  hapoalim:      { kind: 'bank',        label: 'Bank Hapoalim' },
  leumi:         { kind: 'bank',        label: 'Bank Leumi' },
  mizrahi:       { kind: 'bank',        label: 'Mizrahi Bank' },
  discount:      { kind: 'bank',        label: 'Discount Bank' },
  mercantile:    { kind: 'bank',        label: 'Mercantile Bank' },
  otsar_hahayal: { kind: 'bank',        label: 'Bank Otsar Hahayal' },
  beinleumi:     { kind: 'bank',        label: 'Beinleumi' },
  massad:        { kind: 'bank',        label: 'Massad' },
  pagi:          { kind: 'bank',        label: 'Pagi' },
  isracard:      { kind: 'credit_card', label: 'Isracard' },
  amex:          { kind: 'credit_card', label: 'Amex' },
  visa_cal:      { kind: 'credit_card', label: 'Visa Cal' },
  max:           { kind: 'credit_card', label: 'Max' },
};

export function institutionKind(source) {
  return INSTITUTIONS[source]?.kind || null;
}

export function institutionLabel(source) {
  return INSTITUTIONS[source]?.label || source;
}

// Icon by institution kind — a bank account and a credit-card company are
// different things and should never share a glyph. Manual/unknown rows get a
// pencil (a human typed them). Returns a lucide component.
export function institutionIcon(source) {
  const kind = institutionKind(source);
  if (kind === 'bank') return Landmark;
  if (kind === 'credit_card') return CreditCard;
  return PencilLine;
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

// Next automatic sync — mirrors the server's enqueue targets (07:00 / 18:00
// Asia/Jerusalem, see services/syncSchedulingService.js). Client-side hint
// only; the server is the source of truth. Returns { time: 'HH:00', tomorrow }.
export function nextAutoSync(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jerusalem', hour12: false, hour: '2-digit', minute: '2-digit',
  }).formatToParts(now);
  const hh = Number(parts.find((p) => p.type === 'hour').value) % 24;
  const mm = Number(parts.find((p) => p.type === 'minute').value);
  const nowMin = hh * 60 + mm;
  const targets = [7 * 60, 18 * 60];
  const idx = targets.findIndex((tm) => tm > nowMin);
  const tomorrow = idx === -1;
  const targetMin = tomorrow ? targets[0] : targets[idx];
  return { time: `${String(Math.floor(targetMin / 60)).padStart(2, '0')}:00`, tomorrow };
}

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
