/**
 * ShoppingItemCard — single shopping list item, claymorphic card
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Trash2, ExternalLink, ShoppingBag, CheckCircle2, Circle } from 'lucide-react';
import { cn } from '../../../utils/helpers';
import { CATEGORIES } from './ShoppingBottomSheet';

const formatPrice = (price) => {
  const n = parseFloat(price) || 0;
  return '₪' + n.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const ShoppingItemCard = ({ item, onEdit, onDelete, onToggleBought, isDeleting }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const cat = CATEGORIES.find((c) => c.value === item.category) || CATEGORIES[5];
  const bought = item.is_bought;

  const handleDeleteClick = () => {
    if (confirmDelete) {
      onDelete(item.id);
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, y: -8 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className={cn(
        'relative rounded-2xl border bg-white',
        'shadow-[0_4px_20px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.95)]',
        'dark:bg-gray-800/90 dark:border-gray-700/60',
        'overflow-hidden transition-all duration-200',
        bought && 'opacity-60 grayscale-[30%]'
      )}
      dir="rtl"
    >
      {/* Category accent bar at top */}
      <div className={cn('h-1 w-full', cat.dot)} />

      <div className="p-4">
        {/* Top row: name + price */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            {/* Bought toggle */}
            <button
              onClick={() => onToggleBought(item)}
              className="mt-0.5 flex-shrink-0 min-h-[24px] min-w-[24px] flex items-center justify-center"
              aria-label={bought ? 'סמן כלא נרכש' : 'סמן כנרכש'}
            >
              {bought
                ? <CheckCircle2 className="w-5 h-5 text-emerald-500" strokeWidth={2} />
                : <Circle className="w-5 h-5 text-gray-300 hover:text-blue-400 transition-colors" strokeWidth={2} />
              }
            </button>

            {/* Name */}
            <h3 className={cn(
              'text-base font-bold text-gray-800 dark:text-white leading-tight truncate',
              bought && 'line-through text-gray-400'
            )}>
              {item.name}
            </h3>
          </div>

          {/* Price badge */}
          {parseFloat(item.price_ils) > 0 && (
            <span className={cn(
              'flex-shrink-0 text-sm font-extrabold text-blue-700 dark:text-blue-300',
              'bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800',
              'px-2.5 py-1 rounded-xl tabular-nums'
            )}>
              {formatPrice(item.price_ils)}
            </span>
          )}
        </div>

        {/* Category chip */}
        <div className="flex items-center gap-2 mb-3">
          <span className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
            cat.color
          )}>
            <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', cat.dot)} />
            {cat.label}
          </span>
        </div>

        {/* Notes */}
        {item.notes && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed line-clamp-2">
            {item.notes}
          </p>
        )}

        {/* Action row */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700/50">
          {/* Link */}
          {item.buy_url && (
            <a
              href={item.buy_url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-xl',
                'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800',
                'text-indigo-600 dark:text-indigo-400 text-xs font-semibold',
                'hover:bg-indigo-100 transition-colors min-h-[36px]'
              )}
            >
              <ExternalLink className="w-3.5 h-3.5" strokeWidth={2.5} />
              קנה עכשיו
            </a>
          )}

          <div className="flex items-center gap-2 mr-auto">
            {/* Edit */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => onEdit(item)}
              className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center',
                'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600',
                'text-gray-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50',
                'transition-all duration-150'
              )}
              aria-label="ערוך פריט"
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
                  className={cn(
                    'px-3 h-9 rounded-xl flex items-center gap-1.5',
                    'bg-red-500 border border-red-400',
                    'text-white text-xs font-bold',
                    'min-h-[36px] transition-all'
                  )}
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                  מחק?
                </motion.button>
              ) : (
                <motion.button
                  key="trash"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={handleDeleteClick}
                  className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center',
                    'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600',
                    'text-gray-500 hover:text-red-600 hover:border-red-300 hover:bg-red-50',
                    'transition-all duration-150'
                  )}
                  aria-label="מחק פריט"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ShoppingItemCard;
