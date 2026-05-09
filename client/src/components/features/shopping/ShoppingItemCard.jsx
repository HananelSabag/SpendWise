/**
 * ShoppingItemCard — visual-first redesign
 * Full-width image (or category placeholder), name prominent,
 * notes readable, bought state with overlay + strikethrough.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Trash2, ExternalLink, Check, ShoppingBag } from 'lucide-react';
import { cn, currency } from '../../../utils/helpers';
import { CATEGORIES } from './ShoppingBottomSheet';
import { useTranslation } from '../../../stores';

// Per-category placeholder gradient (behind emoji when no image)
const PLACEHOLDER_BG = {
  'bg-amber-500':  'from-amber-100 to-amber-50 dark:from-amber-900/50 dark:to-amber-900/20',
  'bg-orange-500': 'from-orange-100 to-orange-50 dark:from-orange-900/50 dark:to-orange-900/20',
  'bg-purple-500': 'from-purple-100 to-purple-50 dark:from-purple-900/50 dark:to-purple-900/20',
  'bg-blue-500':   'from-blue-100 to-blue-50 dark:from-blue-900/50 dark:to-blue-900/20',
  'bg-pink-500':   'from-pink-100 to-pink-50 dark:from-pink-900/50 dark:to-pink-900/20',
  'bg-green-500':  'from-green-100 to-green-50 dark:from-green-900/50 dark:to-green-900/20',
  'bg-gray-400':   'from-gray-100 to-gray-50 dark:from-gray-700/50 dark:to-gray-700/20',
};

// Subtle card tint (just the content area below image)
const CARD_TINT = {
  'bg-amber-500':  'dark:bg-gray-800',
  'bg-orange-500': 'dark:bg-gray-800',
  'bg-purple-500': 'dark:bg-gray-800',
  'bg-blue-500':   'dark:bg-gray-800',
  'bg-pink-500':   'dark:bg-gray-800',
  'bg-green-500':  'dark:bg-gray-800',
  'bg-gray-400':   'dark:bg-gray-800',
};

const ShoppingItemCard = ({ item, onEdit, onDelete, onToggleBought, isDeleting }) => {
  const { t, isRTL } = useTranslation('shopping');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [imgFailed,     setImgFailed]     = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!confirmDelete) return;
    timeoutRef.current = setTimeout(() => setConfirmDelete(false), 3000);
    return () => clearTimeout(timeoutRef.current);
  }, [confirmDelete]);

  useEffect(() => { setImgFailed(false); }, [item.image_url]);

  const cat         = CATEGORIES.find((c) => c.value === item.category) || CATEGORIES[CATEGORIES.length - 1];
  const bought      = item.is_bought;
  const price       = parseFloat(item.price_ils) || 0;
  const showImage   = !!(item.image_url && !imgFailed);
  const placeholderBg = PLACEHOLDER_BG[cat.dot] || PLACEHOLDER_BG['bg-gray-400'];
  const cardTint    = CARD_TINT[cat.dot] || CARD_TINT['bg-gray-400'];

  const handleDeleteClick = () => {
    if (confirmDelete) { onDelete(item.id); setConfirmDelete(false); }
    else setConfirmDelete(true);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, y: -8 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className={cn(
        'relative rounded-2xl overflow-hidden',
        'border border-gray-100 dark:border-gray-700/60',
        'shadow-[0_2px_16px_rgba(0,0,0,0.07),0_1px_4px_rgba(0,0,0,0.05)]',
        'hover:shadow-[0_6px_24px_rgba(0,0,0,0.11)] transition-shadow duration-200',
        'bg-white', cardTint
      )}
    >
      {/* Category accent stripe (side) */}
      <div className={cn(
        'absolute top-0 bottom-0 w-[3.5px] z-10',
        cat.dot,
        isRTL ? 'right-0' : 'left-0'
      )} />

      {/* ── Image / Placeholder area ── */}
      <div className="relative h-48 overflow-hidden">

        {showImage ? (
          <img
            src={item.image_url}
            alt={item.name}
            className={cn(
              'w-full h-full object-cover object-center transition-all duration-300',
              bought && 'opacity-50 saturate-50'
            )}
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className={cn(
            'w-full h-full bg-gradient-to-b flex items-center justify-center',
            placeholderBg,
            bought && 'opacity-60'
          )}>
            <span className="text-7xl select-none">{cat.emoji}</span>
          </div>
        )}

        {/* Bought overlay */}
        <AnimatePresence>
          {bought && (
            <motion.div
              key="bought-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-emerald-500/15 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 450, damping: 22 }}
                className="bg-emerald-500 rounded-full p-3 shadow-xl shadow-emerald-500/40"
              >
                <Check className="w-9 h-9 text-white" strokeWidth={3} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle button — top corner */}
        <motion.button
          onClick={() => onToggleBought(item)}
          disabled={confirmDelete}
          whileTap={{ scale: 0.82 }}
          className={cn(
            'absolute top-2.5 z-20 w-10 h-10 rounded-2xl flex items-center justify-center',
            'shadow-lg transition-all duration-250 disabled:opacity-40',
            isRTL ? 'left-3' : 'right-3',
            bought
              ? 'bg-emerald-500 shadow-emerald-400/50'
              : 'bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-600'
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
                className={cn('w-3.5 h-3.5 rounded-full', cat.dot, 'opacity-50')}
              />
            )}
          </AnimatePresence>
        </motion.button>

        {/* Price badge — bottom corner, overlaid on image */}
        {price > 0 && (
          <div className={cn(
            'absolute bottom-2.5 z-20 px-3 py-1 rounded-xl',
            'bg-black/55 backdrop-blur-sm',
            'text-white text-sm font-extrabold tabular-nums',
            isRTL ? 'left-3' : 'right-3',
            bought && 'opacity-50 line-through'
          )}>
            {currency.format(price)}
          </div>
        )}
      </div>

      {/* ── Content area ── */}
      <div className="px-4 pt-3 pb-3">

        {/* Name */}
        <h3 className={cn(
          'text-[17px] font-extrabold leading-snug mb-2',
          bought
            ? 'line-through text-gray-400 dark:text-gray-500'
            : 'text-gray-900 dark:text-white'
        )}>
          {item.name}
        </h3>

        {/* Category badge + notes */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className={cn(
            'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full',
            'text-[11px] font-bold border',
            cat.color
          )}>
            <span className="text-sm leading-none">{cat.emoji}</span>
            {t(`categories.${cat.key}`)}
          </span>

          {item.notes && (
            <span className="text-[13px] text-gray-500 dark:text-gray-400 leading-snug flex-1 min-w-0">
              {item.notes}
            </span>
          )}
        </div>

        {/* ── Action row ── */}
        <div className="flex items-center gap-2 pt-2.5 border-t border-gray-100 dark:border-gray-700/50">

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
