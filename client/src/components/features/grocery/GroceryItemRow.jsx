/**
 * GroceryItemRow — one line of the active list.
 *
 * Built for a thumb in a supermarket aisle. The whole row is the purchase
 * target: while shopping you are checking things off, not editing them, so the
 * common action gets all 56px and the rare ones sit behind a gesture.
 *
 *   tap        → into the cart (or back out of it)
 *   long-press → actions: edit, or delete
 *   photo tap  → expand the picture in place
 *
 * Long-press rather than swipe because the aisle strip above scrolls
 * horizontally, and a swipe here would fight it on every drag.
 */

import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Link2, Pencil, StickyNote, Trash2, X } from 'lucide-react';
import { cn } from '../../../utils/helpers';
import { useTranslation } from '../../../stores';

/** Matches the iOS/Android long-press convention. Shorter fired on slow taps. */
const LONG_PRESS_MS = 500;

const GroceryItemRow = ({ item, onToggle, onOpen, onDelete, disabled = false }) => {
  const { t } = useTranslation('grocery');
  const [showPhoto, setShowPhoto] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const rowRef = useRef(null);
  const timerRef = useRef(null);
  const firedRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);
  useEffect(() => { if (!actionsOpen) setConfirmDelete(false); }, [actionsOpen]);

  // Dismiss on a tap anywhere else, on scroll, or on Escape. Without this an
  // accidental long-press traps you until you find the small close button.
  useEffect(() => {
    if (!actionsOpen) return undefined;

    const closeIfOutside = (event) => {
      if (!rowRef.current?.contains(event.target)) setActionsOpen(false);
    };
    const close = () => setActionsOpen(false);
    const closeOnEscape = (event) => { if (event.key === 'Escape') setActionsOpen(false); };

    document.addEventListener('pointerdown', closeIfOutside, true);
    window.addEventListener('scroll', close, { passive: true, capture: true });
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeIfOutside, true);
      window.removeEventListener('scroll', close, { capture: true });
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [actionsOpen]);

  const startPress = useCallback(() => {
    if (disabled) return;
    firedRef.current = false;
    clearTimer();
    timerRef.current = setTimeout(() => {
      firedRef.current = true;
      setActionsOpen(true);
      // The only feedback that the gesture registered before the menu paints.
      // Chrome *logs* rather than throws when the frame has had no user gesture
      // yet, so a try/catch alone would still spam the console.
      if (navigator.userActivation?.hasBeenActive !== false) {
        try { navigator.vibrate?.(15); } catch { /* unsupported */ }
      }
    }, LONG_PRESS_MS);
  }, [disabled, clearTimer]);

  const endPress = useCallback(() => clearTimer(), [clearTimer]);

  /** A press that became a long-press must not also toggle the item. */
  const handleClick = useCallback(() => {
    if (firedRef.current) { firedRef.current = false; return; }
    if (disabled || actionsOpen) return;
    onToggle(item);
  }, [disabled, actionsOpen, onToggle, item]);

  const purchased = item.is_purchased;
  const quantityLabel = item.quantity
    ? `${Number(item.quantity) % 1 === 0 ? Number(item.quantity) : item.quantity}${
        item.unit ? ` ${t(`units.${item.unit}`, { fallback: item.unit })}` : ''
      }`
    : null;

  return (
    <motion.li
      ref={rowRef}
      layout="position"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.16 }}
      className={cn(
        'group relative flex items-stretch rounded-2xl border transition-colors',
        purchased
          ? 'border-transparent bg-gray-50/70 dark:bg-gray-800/40'
          : 'border-gray-100 bg-white hover:border-gray-200 dark:border-gray-700/70 dark:bg-gray-800/70 dark:hover:border-gray-600'
      )}
    >
      {/* The row itself is the check target. */}
      <button
        type="button"
        onClick={handleClick}
        onPointerDown={startPress}
        onPointerUp={endPress}
        onPointerLeave={endPress}
        onPointerCancel={endPress}
        onContextMenu={(event) => event.preventDefault()}
        disabled={disabled}
        aria-pressed={purchased}
        aria-label={purchased ? t('item.markNotPurchased') : t('item.markPurchased')}
        className={cn(
          'flex min-h-[56px] flex-1 select-none items-center gap-2 rounded-2xl py-2 pe-2 text-start',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset',
          disabled && 'cursor-not-allowed opacity-60'
        )}
      >
        <span className="flex w-14 shrink-0 items-center justify-center">
          <span
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all',
              purchased
                ? 'border-emerald-500 bg-emerald-500 text-white'
                : 'border-gray-300 text-transparent group-hover:border-blue-400 dark:border-gray-600'
            )}
          >
            <Check className="h-4 w-4" strokeWidth={3} />
          </span>
        </span>

        <span className="min-w-0 flex-1">
          <span
            className={cn(
              'block truncate text-[15px] font-medium leading-snug',
              purchased
                ? 'text-gray-400 line-through dark:text-gray-500'
                : 'text-gray-900 dark:text-gray-50'
            )}
          >
            {item.name}
          </span>

          {(item.note || quantityLabel) && (
            <span className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
              {quantityLabel && (
                <span className="font-semibold tabular-nums text-gray-500 dark:text-gray-400">
                  {quantityLabel}
                </span>
              )}
              {item.note && (
                <>
                  <StickyNote className="h-3 w-3 shrink-0" />
                  <span className="truncate">{item.note}</span>
                </>
              )}
            </span>
          )}
        </span>

        {item.product_url && (
          <Link2 className="h-4 w-4 shrink-0 text-gray-300 dark:text-gray-600" aria-hidden />
        )}
      </button>

      {/* Photo: a thumbnail that expands in place, so the exact product is one
          tap away without pushing the list around. */}
      {item.image_url && (
        <button
          type="button"
          onClick={() => setShowPhoto((open) => !open)}
          aria-label={t('item.hasPhoto')}
          aria-expanded={showPhoto}
          className="me-2 flex w-11 shrink-0 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <img
            src={item.image_url}
            alt=""
            loading="lazy"
            className={cn(
              'h-10 w-10 rounded-xl border border-gray-200 object-cover dark:border-gray-700',
              purchased && 'opacity-50'
            )}
          />
        </button>
      )}

      {showPhoto && item.image_url && (
        <div
          className="absolute inset-x-2 top-full z-20 mt-1 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800"
          onClick={() => setShowPhoto(false)}
        >
          <img src={item.image_url} alt={item.name} className="max-h-64 w-full object-contain" />
        </div>
      )}

      {/* Long-press actions, laid over the row so the list never reflows. */}
      <AnimatePresence>
        {actionsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="absolute inset-0 z-30 flex items-center gap-1.5 rounded-2xl bg-white/95 px-2 backdrop-blur-sm dark:bg-gray-800/95"
          >
            <button
              type="button"
              onClick={() => { setActionsOpen(false); onOpen(item); }}
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-gray-100 text-xs font-bold text-gray-700 dark:bg-gray-700 dark:text-gray-200"
            >
              <Pencil className="h-4 w-4" />
              {t('item.edit')}
            </button>

            <button
              type="button"
              onClick={() => {
                if (!confirmDelete) { setConfirmDelete(true); return; }
                setActionsOpen(false);
                onDelete(item.id);
              }}
              aria-label={t('item.delete')}
              className={cn(
                'flex h-11 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold transition-colors',
                confirmDelete
                  ? 'flex-1 bg-red-500 text-white'
                  : 'w-11 bg-red-50 text-red-500 dark:bg-red-500/15'
              )}
            >
              <Trash2 className="h-4 w-4" />
              {confirmDelete && t('item.deleteConfirm')}
            </button>

            <button
              type="button"
              onClick={() => setActionsOpen(false)}
              aria-label={t('sheet.cancel')}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-gray-400"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
};

export default memo(GroceryItemRow);
