/**
 * GroceryHistoryPanel — completed trips, newest first.
 *
 * Everything here is read-only except the two things you can still attach after
 * the fact: a receipt, and one explicit SpendWise expense. The SpendWise button
 * is deliberately manual — bank and card sync import the same supermarket charge
 * on their own, and creating it automatically would double-count the shop.
 */

import React, { useCallback, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown, FileText, Loader2, Paperclip, Receipt, Store, Wallet, Plus, Check,
} from 'lucide-react';
import { cn, currency, dateHelpers } from '../../../utils/helpers';
import { useTranslation } from '../../../stores';
import { useGroceryHistory, useGroceryTripDetail, useGroceryTripActions } from '../../../hooks/useGroceryHistory';
import { CATEGORY_BY_KEY, categoryOrder, DEFAULT_CATEGORY } from './groceryCategories';

const TripItems = ({ tripId }) => {
  const { t } = useTranslation('grocery');
  const { items, isLoading } = useGroceryTripDetail(tripId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      </div>
    );
  }

  const groups = new Map();
  items.filter((item) => item.is_purchased).forEach((item) => {
    const key = item.category_key || DEFAULT_CATEGORY;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });

  const ordered = [...groups.entries()].sort(([a], [b]) => categoryOrder(a) - categoryOrder(b));

  return (
    <div className="space-y-3 pt-3">
      {ordered.map(([key, groupItems]) => {
        const category = CATEGORY_BY_KEY[key] || CATEGORY_BY_KEY[DEFAULT_CATEGORY];
        const Icon = category.icon;
        return (
          <div key={key}>
            <p className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              <Icon className={cn('h-3.5 w-3.5', category.tint)} />
              {t(`categories.${key}`)}
            </p>
            <ul className="space-y-0.5 ps-5">
              {groupItems.map((item) => (
                <li key={item.id} className="flex items-baseline gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <span className="truncate">{item.name}</span>
                  {item.quantity && (
                    <span className="shrink-0 text-xs tabular-nums text-gray-400">
                      {Number(item.quantity)}
                      {item.unit ? ` ${t(`units.${item.unit}`, { fallback: item.unit })}` : ''}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
};

const TripCard = ({ trip }) => {
  const { t, currentLanguage } = useTranslation('grocery');
  const { uploadReceipt, openReceipt, addToSpendWise, busyTripId } = useGroceryTripActions();
  const [expanded, setExpanded] = useState(false);
  const fileRef = useRef(null);

  const busy = busyTripId === trip.id;

  const handleReceipt = useCallback(async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) await uploadReceipt(trip.id, file);
  }, [trip.id, uploadReceipt]);

  const handleViewReceipt = useCallback(async () => {
    const url = await openReceipt(trip.id);
    // Signed URLs are short-lived, so open immediately rather than storing them.
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }, [trip.id, openReceipt]);

  return (
    <li className="rounded-2xl border border-gray-100 bg-white p-3.5 dark:border-gray-700 dark:bg-gray-800/60">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
          <Receipt className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-gray-900 dark:text-gray-50">
            {trip.store_name || dateHelpers.format(trip.completed_at, 'PPP', currentLanguage)}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-400 dark:text-gray-500">
            <span>{dateHelpers.format(trip.completed_at, 'PPp', currentLanguage)}</span>
            <span aria-hidden>·</span>
            <span>{t('history.items', { count: trip.item_count })}</span>
            {trip.completed_by_first_name && (
              <>
                <span aria-hidden>·</span>
                <span>{t('history.finishedBy', { name: trip.completed_by_first_name })}</span>
              </>
            )}
          </p>
        </div>

        <div className="shrink-0 text-end">
          {trip.total_ils != null ? (
            <p className="text-base font-extrabold tabular-nums text-gray-900 dark:text-gray-50">
              {currency.format(Number(trip.total_ils))}
            </p>
          ) : (
            <p className="text-xs text-gray-400 dark:text-gray-500">{t('history.noTotal')}</p>
          )}
          {trip.transaction_id && (
            <p className="mt-0.5 flex items-center justify-end gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <Check className="h-3 w-3" />
              {t('history.linked')}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 text-xs font-semibold text-gray-500 dark:border-gray-700 dark:text-gray-400"
        >
          <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.18 }}>
            <ChevronDown className="h-3.5 w-3.5" />
          </motion.span>
          {expanded ? t('history.collapse') : t('history.expand')}
        </button>

        {trip.has_receipt ? (
          <button
            type="button"
            onClick={handleViewReceipt}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 text-xs font-semibold text-gray-500 dark:border-gray-700 dark:text-gray-400"
          >
            <FileText className="h-3.5 w-3.5" />
            {t('history.viewReceipt')}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-dashed border-gray-200 px-2.5 text-xs font-semibold text-gray-400 dark:border-gray-700"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />}
              {t('history.uploadReceipt')}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleReceipt}
              className="hidden"
            />
          </>
        )}

        {trip.total_ils != null && !trip.transaction_id && (
          <button
            type="button"
            onClick={() => addToSpendWise(trip.id)}
            disabled={busy}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            {t('history.addToSpendWise')}
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <TripItems tripId={trip.id} />
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
};

const GroceryHistoryPanel = ({ active }) => {
  const { t } = useTranslation('grocery');
  const { trips, isLoading } = useGroceryHistory({ enabled: active });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
        <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-300 dark:bg-gray-800 dark:text-gray-600">
          <Store className="h-8 w-8" strokeWidth={1.5} />
        </span>
        <h3 className="mb-1.5 text-base font-bold text-gray-700 dark:text-gray-200">
          {t('history.empty')}
        </h3>
        <p className="max-w-xs text-sm leading-relaxed text-gray-400 dark:text-gray-500">
          {t('history.emptyDescription')}
        </p>
      </div>
    );
  }

  return (
    <>
      <p className="mb-3 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
        <Wallet className="h-3.5 w-3.5" />
        {t('history.linkHint')}
      </p>
      <ul className="space-y-2.5">
        {trips.map((trip) => <TripCard key={trip.id} trip={trip} />)}
      </ul>
    </>
  );
};

export default GroceryHistoryPanel;
