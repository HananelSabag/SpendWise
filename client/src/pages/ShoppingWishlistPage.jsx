/**
 * ShoppingWishlistPage — רשימת קניות
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ShoppingCart,
  Plus,
  Package,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import { cn, currency } from '../utils/helpers';
import { useShoppingItems } from '../hooks/useShoppingItems';
import ShoppingBottomSheet, { CATEGORIES } from '../components/features/shopping/ShoppingBottomSheet';
import ShoppingItemCard from '../components/features/shopping/ShoppingItemCard';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { useTranslation } from '../stores';

// ──────────────────────────────────────────
// Empty state
// ──────────────────────────────────────────
const EmptyState = ({ onAdd, filtered, t }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 }}
    className="flex flex-col items-center justify-center py-20 px-8 text-center"
  >
    <div className={cn(
      'w-24 h-24 rounded-3xl flex items-center justify-center mb-6',
      'bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30',
      'shadow-[0_8px_32px_rgba(99,102,241,0.15),inset_0_1px_0_rgba(255,255,255,0.8)]',
      'border border-blue-100 dark:border-blue-800'
    )}>
      {filtered
        ? <SlidersHorizontal className="w-10 h-10 text-blue-400" strokeWidth={1.5} />
        : <ShoppingCart className="w-10 h-10 text-blue-400" strokeWidth={1.5} />
      }
    </div>
    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
      {filtered ? t('empty.filteredTitle') : t('empty.title')}
    </h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-xs leading-relaxed">
      {filtered ? t('empty.filteredDescription') : t('empty.description')}
    </p>
    {!filtered && (
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={onAdd}
        className={cn(
          'flex items-center gap-2 px-6 py-3.5 rounded-2xl',
          'bg-gradient-to-l from-blue-600 to-indigo-600',
          'text-white font-bold text-sm shadow-lg shadow-blue-500/30',
          'min-h-[48px]'
        )}
      >
        <Plus className="w-4 h-4" strokeWidth={2.5} />
        {t('empty.addFirst')}
      </motion.button>
    )}
  </motion.div>
);

// ──────────────────────────────────────────
// Main page
// ──────────────────────────────────────────
const ShoppingWishlistPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('shopping');
  const { t: tc } = useTranslation('common');
  const {
    items, isLoading, isError, refetch,
    createItem, updateItem, deleteItem, toggleBought,
    isCreating, isUpdating, isDeleting,
  } = useShoppingItems();

  const [activeCategory, setActiveCategory] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // 'null' means "all" — derived from translation so it updates with language changes
  const ALL_KEY = t('allCategories');

  // Single pass: category tabs (ordered by CATEGORIES), per-cat counts, filtered+split lists, pending total
  const { categoryTabs, categoryCounts, filteredItems, unbought, bought, pendingTotal } = useMemo(() => {
    const counts = {};
    items.forEach((i) => { counts[i.category] = (counts[i.category] || 0) + 1; });

    const tabs = [null, ...CATEGORIES.filter((c) => counts[c.value]).map((c) => c.value)];

    const filtered = activeCategory === null ? items : items.filter((i) => i.category === activeCategory);
    const u = filtered.filter((i) => !i.is_bought);
    const b = filtered.filter((i) => i.is_bought);
    const pending = u.reduce((s, i) => s + parseFloat(i.price_ils || 0), 0);

    return { categoryTabs: tabs, categoryCounts: counts, filteredItems: filtered, unbought: u, bought: b, pendingTotal: pending };
  }, [items, activeCategory]);

  // Auto-reset category filter when filtered list becomes empty (e.g. after deletion)
  useEffect(() => {
    if (activeCategory !== null && filteredItems.length === 0 && items.length > 0) {
      setActiveCategory(null);
    }
  }, [activeCategory, filteredItems.length, items.length]);

  const handleAdd = useCallback(() => {
    setEditingItem(null);
    setSheetOpen(true);
  }, []);

  const handleEdit = useCallback((item) => {
    setEditingItem(item);
    setSheetOpen(true);
  }, []);

  const handleSave = useCallback(async (payload) => {
    if (editingItem) {
      await updateItem(editingItem.id, payload);
    } else {
      await createItem(payload);
    }
    setSheetOpen(false);
    setEditingItem(null);
  }, [editingItem, createItem, updateItem]);

  const handleClose = useCallback(() => {
    setSheetOpen(false);
    setEditingItem(null);
  }, []);

  if (isLoading) return <PageLoader text={t('loading')} />;

  if (isError) return (
    <div className="min-h-screen flex items-center justify-center p-8 text-center" dir="rtl">
      <div>
        <Package className="w-12 h-12 text-red-400 mx-auto mb-3" strokeWidth={1.5} />
        <p className="text-gray-600 dark:text-gray-400 mb-4">{t('error.title')}</p>
        <button onClick={() => refetch()} className="text-blue-600 font-semibold underline">{tc('retry')}</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/60 via-white to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 flex flex-col" dir="rtl">

      {/* ── Header ── */}
      <div className={cn(
        'sticky top-0 z-30',
        'bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl',
        'border-b border-gray-100 dark:border-gray-800'
      )}>
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
            className={cn(
              'w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0',
              'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
              'text-gray-600 dark:text-gray-300 hover:bg-gray-100 transition-colors'
            )}
            aria-label={tc('back')}
          >
            <ArrowRight className="w-5 h-5" strokeWidth={2} />
          </motion.button>

          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-extrabold text-gray-900 dark:text-white leading-tight">
              {t('title')}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {t('itemsCount', { count: items.length })}
            </p>
          </div>

          {/* Live pending total badge */}
          {items.length > 0 && pendingTotal > 0 && (
            <motion.div
              key={pendingTotal}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className={cn(
                'flex-shrink-0 px-3 py-1.5 rounded-xl',
                'bg-gradient-to-l from-blue-600 to-indigo-600',
                'text-white text-sm font-extrabold tabular-nums',
                'shadow-md shadow-blue-500/25'
              )}
            >
              {currency.format(pendingTotal)}
            </motion.div>
          )}

          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleAdd}
            className={cn(
              'w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0',
              'bg-gradient-to-br from-blue-600 to-indigo-600',
              'text-white shadow-md shadow-blue-500/30 hover:shadow-lg transition-shadow'
            )}
            aria-label={t('addItemAria')}
          >
            <Plus className="w-5 h-5" strokeWidth={2.5} />
          </motion.button>
        </div>

        {/* Category filter chips */}
        {items.length > 0 && categoryTabs.length > 1 && (
          <div className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-none">
            {categoryTabs.map((cat) => {
              const active = activeCategory === cat;
              const catObj = cat !== null ? CATEGORIES.find((c) => c.value === cat) : null;
              const count = cat === null ? items.length : (categoryCounts[cat] || 0);
              const displayLabel = cat === null ? ALL_KEY : t(`categories.${catObj?.key}`);
              return (
                <motion.button
                  key={cat ?? '__all__'}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    'flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full',
                    'text-xs font-bold border transition-all duration-150 min-h-[36px]',
                    active
                      ? 'bg-gradient-to-l from-blue-600 to-indigo-600 text-white border-transparent shadow-md shadow-blue-500/25'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-300'
                  )}
                >
                  {catObj && !active && (
                    <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', catObj.dot)} />
                  )}
                  {displayLabel}
                  {active && (
                    <span className="bg-white/30 text-white text-[10px] font-extrabold px-1.5 rounded-full">
                      {count}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 px-4 py-4 pb-28 max-w-lg mx-auto w-full">
        {items.length === 0 ? (
          <EmptyState onAdd={handleAdd} filtered={false} t={t} />
        ) : filteredItems.length === 0 ? (
          <EmptyState onAdd={handleAdd} filtered t={t} />
        ) : (
          <AnimatePresence mode="popLayout">
            {unbought.length > 0 && (
              <motion.section key="unbought" layout>
                <div className="flex flex-col gap-3">
                  {unbought.map((item) => (
                    <ShoppingItemCard
                      key={item.id}
                      item={item}
                      onEdit={handleEdit}
                      onDelete={deleteItem}
                      onToggleBought={toggleBought}
                      isDeleting={isDeleting}
                    />
                  ))}
                </div>
              </motion.section>
            )}

            {bought.length > 0 && (
              <motion.section
                key="bought"
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6"
              >
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" strokeWidth={2} />
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {t('boughtSection', { count: bought.length })}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {bought.map((item) => (
                    <ShoppingItemCard
                      key={item.id}
                      item={item}
                      onEdit={handleEdit}
                      onDelete={deleteItem}
                      onToggleBought={toggleBought}
                      isDeleting={isDeleting}
                    />
                  ))}
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* ── Sticky bottom bar ── */}
      {items.length > 0 && (
        <motion.div
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          className={cn(
            'fixed bottom-0 left-0 right-0 z-20',
            'bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl',
            'border-t border-gray-100 dark:border-gray-800',
            'px-4 py-3'
          )}
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}
        >
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                {t('totalPending')}
              </span>
              <motion.span
                key={pendingTotal}
                initial={{ scale: 0.92 }}
                animate={{ scale: 1 }}
                className="text-xl font-extrabold text-gray-900 dark:text-white tabular-nums"
              >
                {currency.format(pendingTotal)}
              </motion.span>
            </div>

            <div className="flex items-center gap-3">
              {bought.length > 0 && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  {t('boughtItems', { count: bought.length })}
                </span>
              )}
              <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                {t('pendingItems', { count: unbought.length })}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Add / Edit BottomSheet */}
      <ShoppingBottomSheet
        isOpen={sheetOpen}
        onClose={handleClose}
        onSave={handleSave}
        editItem={editingItem}
        isSaving={isCreating || isUpdating}
      />
    </div>
  );
};

export default ShoppingWishlistPage;
