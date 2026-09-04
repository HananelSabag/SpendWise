/**
 * GroceryItemRow — one line of the active list.
 *
 * Built for a thumb in a supermarket aisle, not for browsing: a 48px check
 * target on the leading edge does the only thing that matters while shopping,
 * and everything else (edit, photo, link) sits behind a second, deliberate tap.
 * No swipe gestures — they fight the horizontal aisle scroller above.
 */

import React, { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Link2, StickyNote } from 'lucide-react';
import { cn } from '../../../utils/helpers';
import { useTranslation } from '../../../stores';

const GroceryItemRow = ({ item, onToggle, onOpen, disabled = false }) => {
  const { t } = useTranslation('grocery');
  const [showPhoto, setShowPhoto] = useState(false);

  const purchased = item.is_purchased;
  const quantityLabel = item.quantity
    ? `${Number(item.quantity) % 1 === 0 ? Number(item.quantity) : item.quantity}${
        item.unit ? ` ${t(`units.${item.unit}`, { fallback: item.unit })}` : ''
      }`
    : null;

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.16 }}
      className={cn(
        'group relative flex items-stretch gap-1 rounded-2xl border transition-colors',
        purchased
          ? 'border-transparent bg-gray-50/70 dark:bg-gray-800/40'
          : 'border-gray-100 bg-white hover:border-gray-200 dark:border-gray-700/70 dark:bg-gray-800/70 dark:hover:border-gray-600'
      )}
    >
      {/* The one control that matters while walking the aisles. */}
      <button
        type="button"
        onClick={() => onToggle(item)}
        disabled={disabled}
        aria-pressed={purchased}
        aria-label={purchased ? t('item.markNotPurchased') : t('item.markPurchased')}
        className={cn(
          'flex w-14 shrink-0 items-center justify-center rounded-s-2xl',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
          disabled && 'cursor-not-allowed opacity-40'
        )}
      >
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
      </button>

      {/* Body — opens the editor. */}
      <button
        type="button"
        onClick={() => onOpen(item)}
        disabled={disabled}
        className={cn(
          'flex min-h-[56px] flex-1 items-center gap-2 py-2 pe-2 text-start',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset',
          disabled && 'cursor-default'
        )}
      >
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

      {/* Photo: a thumbnail that expands in place, so "which exact yogurt" is
          one tap away without ever pushing the list around. */}
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
    </motion.li>
  );
};

export default memo(GroceryItemRow);
