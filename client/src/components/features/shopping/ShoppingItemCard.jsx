/**
 * ShoppingItemCard — premium redesign
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Trash2, ExternalLink, Check } from 'lucide-react';
import { cn, currency } from '../../../utils/helpers';
import { CATEGORIES } from './ShoppingBottomSheet';
import { useTranslation } from '../../../stores';

// Subtle category-tinted card backgrounds
const CAT_BG = {
  'bg-amber-500':  'bg-gradient-to-bl from-amber-50/70 to-white dark:from-amber-900/10 dark:to-gray-800',
  'bg-orange-500': 'bg-gradient-to-bl from-orange-50/70 to-white dark:from-orange-900/10 dark:to-gray-800',
  'bg-purple-500': 'bg-gradient-to-bl from-purple-50/70 to-white dark:from-purple-900/10 dark:to-gray-800',
  'bg-blue-500':   'bg-gradient-to-bl from-blue-50/70 to-white dark:from-blue-900/10 dark:to-gray-800',
  'bg-pink-500':   'bg-gradient-to-bl from-pink-50/70 to-white dark:from-pink-900/10 dark:to-gray-800',
  'bg-gray-400':   'bg-gradient-to-bl from-gray-50/80 to-white dark:from-gray-700/20 dark:to-gray-800',
};

const ShoppingItemCard = ({ item, onEdit, onDelete, onToggleBought, isDeleting }) => {
  const { t, isRTL } = useTranslation('shopping');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!confirmDelete) return;
    timeoutRef.current = setTimeout(() => setConfirmDelete(false), 3000);
    return () => clearTimeout(timeoutRef.current);
  }, [confirmDelete]);

  useEffect(() => { setImgFailed(false); }, [item.image_url]);

  const cat    = CATEGORIES.find((c) => c.value === item.category) || CATEGORIES[5];
  const bought = item.is_bought;
  const price  = parseFloat(item.price_ils) || 0;
  const cardBg = CAT_BG[cat.dot] || CAT_BG['bg-gray-400'];

  const handleDeleteClick = () => {
    if (confirmDelete) { onDelete(item.id); setConfirmDelete(false); }
    else setConfirmDelete(true);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: bought ? 0.65 : 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, y: -8 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className={cn(
        'relative rounded-2xl overflow-hidden',
        'border border-gray-100 dark:border-gray-700/60',
        'shadow-[0_2px_12px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)]',
        'transition-shadow hover:shadow-[0_4px_20px_rgba(0,0,0,0.09)]',
        cardBg
      )}
    >
      {/* Start-side category accent (right in RTL, left in LTR) */}
      <div className={cn('absolute top-0 w-[3px] h-full', cat.dot, isRTL ? 'right-0' : 'left-0')} />

      <div className="px-4 pt-4 pb-3 pr-5">

        {/* ── Top row: toggle | name | price ── */}
        <div className="flex items-center gap-3">

          {/* Toggle — rightmost on screen (first in RTL flex) */}
          <motion.button
            onClick={() => onToggleBought(item)}
            disabled={confirmDelete}
            whileTap={{ scale: 0.85 }}
            className={cn(
              'flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center',
              'transition-all duration-250 disabled:opacity-40',
              bought
                ? 'bg-emerald-500 shadow-md shadow-emerald-400/40'
                : 'bg-white dark:bg-gray-700/80 border-2 border-gray-200 dark:border-gray-600 shadow-sm'
            )}
            aria-label={bought ? t('card.markAsNotBought') : t('card.markAsBought')}
          >
            <AnimatePresence mode="wait" initial={false}>
              {bought ? (
                <motion.div key="check"
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                  <Check className="w-5 h-5 text-white" strokeWidth={3} />
                </motion.div>
              ) : (
                <motion.span
                  key="dot"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className={cn('w-3 h-3 rounded-full', cat.dot, 'opacity-40')}
                />
              )}
            </AnimatePresence>
          </motion.button>

          {/* Name + meta — middle */}
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              'text-[15px] font-bold leading-snug',
              bought
                ? 'line-through text-gray-400 dark:text-gray-500'
                : 'text-gray-900 dark:text-white'
            )}>
              {item.name}
            </h3>

            {/* Category + notes inline */}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full',
                'text-[11px] font-semibold border',
                cat.color
              )}>
                <span className="text-sm leading-none">{cat.emoji}</span>
                {t(`categories.${cat.key}`)}
              </span>
              {item.notes && (
                <span className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[150px] italic">
                  {item.notes}
                </span>
              )}
            </div>
          </div>

          {/* Price */}
          {price > 0 && (
            <div className="flex-shrink-0 text-right">
              <span className={cn(
                'text-base font-extrabold tabular-nums leading-none',
                bought
                  ? 'text-gray-400 dark:text-gray-500 line-through'
                  : 'text-gray-900 dark:text-white'
              )}>
                {currency.format(price)}
              </span>
            </div>
          )}

          {/* Product image thumbnail — trailing end of card */}
          {item.image_url && !imgFailed && (
            <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700/60 shadow-sm">
              <img
                src={item.image_url}
                alt=""
                className="w-full h-full object-cover"
                onError={() => setImgFailed(true)}
              />
            </div>
          )}
        </div>

        {/* ── Action row ── */}
        <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-gray-100/70 dark:border-gray-700/50">

          {/* Buy Now link */}
          {item.buy_url && (
            <a
              href={item.buy_url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl',
                'bg-indigo-50 dark:bg-indigo-900/25 border border-indigo-100 dark:border-indigo-800/60',
                'text-indigo-600 dark:text-indigo-400 text-xs font-semibold',
                'hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors'
              )}
            >
              <ExternalLink className="w-3 h-3" strokeWidth={2.5} />
              {t('card.buyNow')}
            </a>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Edit */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onEdit(item)}
            className={cn(
              'w-8 h-8 rounded-xl flex items-center justify-center',
              'bg-white/90 dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600',
              'text-gray-400 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20',
              'transition-all duration-150'
            )}
            aria-label={t('card.editAria')}
          >
            <Pencil className="w-3.5 h-3.5" strokeWidth={2.5} />
          </motion.button>

          {/* Delete / Confirm */}
          <AnimatePresence mode="wait">
            {confirmDelete ? (
              <motion.button
                key="confirm"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                whileTap={{ scale: 0.92 }}
                onClick={handleDeleteClick}
                disabled={isDeleting}
                className="px-3 h-8 rounded-xl flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold shadow-sm shadow-red-400/30 disabled:opacity-60"
              >
                <Trash2 className="w-3 h-3" strokeWidth={2.5} />
                {t('card.confirmDelete')}
              </motion.button>
            ) : (
              <motion.button
                key="trash"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleDeleteClick}
                className={cn(
                  'w-8 h-8 rounded-xl flex items-center justify-center',
                  'bg-white/90 dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600',
                  'text-gray-400 hover:text-red-500 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20',
                  'transition-all duration-150'
                )}
                aria-label={t('card.deleteAria')}
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default ShoppingItemCard;
