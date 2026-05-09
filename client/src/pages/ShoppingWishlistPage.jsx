/**
 * ShoppingWishlistPage — רשימת קניות
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Plus, Package,
  CheckCircle2, UserPlus, SlidersHorizontal, ChevronDown,
} from 'lucide-react';
import { cn, currency } from '../utils/helpers';
import { useShoppingItems } from '../hooks/useShoppingItems';
import { useShoppingShare } from '../hooks/useShoppingShare';
import { useNotifications } from '../hooks/useNotifications';
import ShoppingBottomSheet, { CATEGORIES } from '../components/features/shopping/ShoppingBottomSheet';
import ShoppingItemCard from '../components/features/shopping/ShoppingItemCard';
import ShoppingShareSheet from '../components/features/shopping/ShoppingShareSheet';
import { PageSkeleton } from '../components/ui';
import { useTranslation } from '../stores';
import { useAuth } from '../hooks/useAuth';

// ── Empty state ────────────────────────────────────────────
const EmptyState = ({ onAdd, filtered, t }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
    className="flex flex-col items-center justify-center py-20 px-8 text-center"
  >
    <div className={cn(
      'w-24 h-24 rounded-3xl flex items-center justify-center mb-6',
      'bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30',
      'shadow-[0_8px_32px_rgba(99,102,241,0.15)]',
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
      <motion.button whileTap={{ scale: 0.96 }} onClick={onAdd}
        className={cn(
          'flex items-center gap-2 px-6 py-3.5 rounded-2xl',
          'bg-gradient-to-l from-blue-600 to-indigo-600',
          'text-white font-bold text-sm shadow-lg shadow-blue-500/30 min-h-[48px]'
        )}>
        <Plus className="w-4 h-4" strokeWidth={2.5} />
        {t('empty.addFirst')}
      </motion.button>
    )}
  </motion.div>
);

// ── Invitation banner ──────────────────────────────────────
const InviteBanner = ({ invitations, onOpenShare }) => {
  const { t } = useTranslation('shopping');
  if (!invitations.length) return null;
  const first = invitations[0];
  const name = first.inviter_first_name
    ? `${first.inviter_first_name} ${first.inviter_last_name || ''}`.trim()
    : first.inviter_username;
  return (
    <motion.button
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      onClick={onOpenShare}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 rounded-2xl mb-3',
        'bg-gradient-to-l from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
        'border border-blue-200 dark:border-blue-800',
        'shadow-[0_2px_12px_rgba(99,102,241,0.1)]',
      )}
    >
      <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
        <UserPlus className="w-4 h-4 text-blue-500" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0 text-start">
        <p className="text-sm font-bold text-blue-700 dark:text-blue-300 truncate">
          {t('inviteBanner.invited', { name })}
        </p>
        <p className="text-xs text-blue-500 dark:text-blue-400">
          {invitations.length > 1
            ? t('inviteBanner.moreInvitations', { count: invitations.length - 1 })
            : t('inviteBanner.tapToView')}
        </p>
      </div>
    </motion.button>
  );
};

// ── Main page ──────────────────────────────────────────────
const ShoppingWishlistPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, isRTL } = useTranslation('shopping');
  const { t: tc } = useTranslation('common');

  const {
    items, isLoading, isError, refetch,
    createItem, updateItem, deleteItem, toggleBought,
    isCreating, isUpdating, isDeleting,
  } = useShoppingItems();

  const { myMembers, sharedWithMe, pendingInvitations, respond } = useShoppingShare();
  const { notifications, markAllRead } = useNotifications();

  const { user } = useAuth();
  const currentUserId = user?.id;

  const [activeCategory, setActiveCategory] = useState(null);
  const [activeTab,      setActiveTab]      = useState(null); // null = all | 'mine' | 'shared'
  const [filtersOpen,    setFiltersOpen]    = useState(false);
  const [sheetOpen,      setSheetOpen]      = useState(false);
  const [shareOpen,      setShareOpen]      = useState(false);
  const [editingItem,    setEditingItem]    = useState(null);

  useEffect(() => {
    const token = searchParams.get('invite');
    if (token) {
      respond(token, 'accept').catch(() => {});
      navigate('/shopping', { replace: true });
      setShareOpen(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const ALL_KEY = t('allCategories');

  const { categoryTabs, categoryCounts, filteredItems, unbought, bought, pendingTotal, spentTotal } = useMemo(() => {
    const tabItems = activeTab === null ? items
      : activeTab === 'mine'   ? items.filter((i) => i.user_id === currentUserId)
      :                          items.filter((i) => i.user_id !== currentUserId);

    const counts = {};
    tabItems.forEach((i) => { counts[i.category] = (counts[i.category] || 0) + 1; });
    const tabs     = [null, ...CATEGORIES.filter((c) => counts[c.value]).map((c) => c.value)];
    const filtered = activeCategory === null ? tabItems : tabItems.filter((i) => i.category === activeCategory);
    const u = filtered.filter((i) => !i.is_bought);
    const b = filtered.filter((i) => i.is_bought);
    const pending = u.reduce((s, i) => s + parseFloat(i.price_ils || 0), 0);
    const spent   = b.reduce((s, i) => s + parseFloat(i.price_ils || 0), 0);
    return { categoryTabs: tabs, categoryCounts: counts, filteredItems: filtered, unbought: u, bought: b, pendingTotal: pending, spentTotal: spent };
  }, [items, activeCategory, activeTab, currentUserId]);

  useEffect(() => {
    if (activeCategory !== null && filteredItems.length === 0 && items.length > 0) {
      setActiveCategory(null);
    }
  }, [activeCategory, filteredItems.length, items.length]);

  const handleAdd  = useCallback(() => { setEditingItem(null); setSheetOpen(true); }, []);
  const handleEdit = useCallback((item) => { setEditingItem(item); setSheetOpen(true); }, []);

  const handleSave = useCallback(async (payload) => {
    if (editingItem) await updateItem(editingItem.id, payload);
    else             await createItem(payload);
    setSheetOpen(false);
    setEditingItem(null);
  }, [editingItem, createItem, updateItem]);

  const handleClose = useCallback(() => { setSheetOpen(false); setEditingItem(null); }, []);

  const nonInviteUnread = notifications.filter(n => n.type !== 'shopping_invite' && !n.is_read).length;

  const openShare = useCallback(() => {
    setShareOpen(true);
    if (nonInviteUnread > 0) markAllRead();
  }, [nonInviteUnread, markAllRead]);

  if (isLoading) return <PageSkeleton page="shopping" />;
  if (isError) return (
    <div className="min-h-screen flex items-center justify-center p-8 text-center">
      <div>
        <Package className="w-12 h-12 text-red-400 mx-auto mb-3" strokeWidth={1.5} />
        <p className="text-gray-600 dark:text-gray-400 mb-4">{t('error.title')}</p>
        <button onClick={() => refetch()} className="text-blue-600 font-semibold underline">{tc('retry')}</button>
      </div>
    </div>
  );

  const totalBadgeCount = nonInviteUnread + pendingInvitations.length;
  const hasSharingMembers = myMembers.length > 0 || sharedWithMe.length > 0;

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-gradient-to-b from-blue-50/60 via-white to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 flex flex-col">

      {/* ── Header (non-sticky) ── */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">

        {/* Title row */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white leading-tight">{t('title')}</h1>
            <p className="text-xs font-medium mt-0.5 flex items-center gap-2 flex-wrap">
              {pendingTotal > 0 && (
                <span className="text-blue-600 dark:text-blue-400 tabular-nums">{currency.format(pendingTotal)}</span>
              )}
              {pendingTotal > 0 && spentTotal > 0 && <span className="text-gray-300 dark:text-gray-600">·</span>}
              {spentTotal > 0 && (
                <span className="text-emerald-500 dark:text-emerald-400 tabular-nums">✓ {currency.format(spentTotal)}</span>
              )}
              {pendingTotal === 0 && spentTotal === 0 && (
                <span className="text-gray-400 dark:text-gray-500">{t('itemsCount', { count: items.length })}</span>
              )}
            </p>
          </div>

          <motion.button whileTap={{ scale: 0.92 }} onClick={openShare}
            className="relative w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 transition-colors"
            aria-label={t('share.button')}
          >
            <UserPlus className="w-4 h-4" strokeWidth={2} />
            {totalBadgeCount > 0 && (
              <span className="absolute -top-1 -end-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center">
                {totalBadgeCount > 9 ? '9+' : totalBadgeCount}
              </span>
            )}
          </motion.button>
        </div>

        {/* Collapsible filters: tab switcher + categories */}
        {(hasSharingMembers || (items.length > 0 && categoryTabs.length > 1)) && (
          <div className="border-t border-gray-100 dark:border-gray-800">
            {/* Toggle bar */}
            <button
              onClick={() => setFiltersOpen(v => !v)}
              className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>
                  {(() => {
                    const parts = [];
                    if (activeTab === 'mine')   parts.push(t('tabs.personal'));
                    if (activeTab === 'shared') parts.push(t('tabs.shared'));
                    if (activeCategory !== null) {
                      const catObj = CATEGORIES.find(c => c.value === activeCategory);
                      if (catObj) parts.push(`${catObj.emoji} ${t(`categories.${catObj.key}`)}`);
                    }
                    return parts.length ? parts.join(' · ') : t('allCategories');
                  })()}
                </span>
              </span>
              <motion.span animate={{ rotate: filtersOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="w-4 h-4" />
              </motion.span>
            </button>

            {/* Expandable content */}
            <AnimatePresence initial={false}>
              {filtersOpen && (
                <motion.div
                  key="filters"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  {/* Personal / Shared tab switcher */}
                  {hasSharingMembers && (
                    <div className="px-4 pt-1 pb-2">
                      <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
                        {[
                          { key: null,     label: t('allCategories') },
                          { key: 'mine',   label: t('tabs.personal') },
                          { key: 'shared', label: t('tabs.shared') },
                        ].map(({ key, label }) => {
                          const active = activeTab === key;
                          return (
                            <motion.button
                              key={String(key)}
                              whileTap={{ scale: 0.94 }}
                              onClick={() => { setActiveTab(key); setActiveCategory(null); }}
                              className={cn(
                                'flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold border transition-all duration-150',
                                active
                                  ? 'bg-blue-600 text-white border-transparent shadow-sm shadow-blue-500/30'
                                  : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-300'
                              )}
                            >
                              {label}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Separator between tab switcher and category chips */}
                  {hasSharingMembers && items.length > 0 && categoryTabs.length > 1 && (
                    <div className="mx-4 border-t border-gray-100 dark:border-gray-700/50" />
                  )}

                  {/* Category chips */}
                  {items.length > 0 && categoryTabs.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto px-4 py-2.5 scrollbar-none">
                      {categoryTabs.map((cat) => {
                        const active  = activeCategory === cat;
                        const catObj  = cat !== null ? CATEGORIES.find((c) => c.value === cat) : null;
                        const count   = cat === null ? items.length : (categoryCounts[cat] || 0);
                        const label   = cat === null ? ALL_KEY : t(`categories.${catObj?.key}`);
                        return (
                          <motion.button
                            key={cat ?? '__all__'} whileTap={{ scale: 0.94 }}
                            onClick={() => setActiveCategory(cat)}
                            className={cn(
                              'flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full',
                              'text-xs font-bold border transition-all duration-150 min-h-[36px]',
                              active
                                ? 'bg-gradient-to-l from-blue-600 to-indigo-600 text-white border-transparent shadow-md shadow-blue-500/25'
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-300'
                            )}
                          >
                            {catObj && <span className={cn('text-sm leading-none', !active && 'grayscale opacity-50')}>{catObj.emoji}</span>}
                            {label}
                            {active && (
                              <span className="bg-white/30 text-white text-[10px] font-extrabold px-1.5 rounded-full">{count}</span>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 px-4 py-4 pb-28 max-w-lg mx-auto w-full">

        <InviteBanner invitations={pendingInvitations} onOpenShare={openShare} />

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
                    <ShoppingItemCard key={item.id} item={item}
                      onEdit={handleEdit} onDelete={deleteItem}
                      onToggleBought={toggleBought} isDeleting={isDeleting} />
                  ))}
                </div>
              </motion.section>
            )}

            {bought.length > 0 && (
              <motion.section key="bought" layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" strokeWidth={2} />
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {t('boughtSection', { count: bought.length })}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {bought.map((item) => (
                    <ShoppingItemCard key={item.id} item={item}
                      onEdit={handleEdit} onDelete={deleteItem}
                      onToggleBought={toggleBought} isDeleting={isDeleting} />
                  ))}
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* ── Sticky bottom bar ── */}
      {items.length > 0 && (
        <motion.div initial={{ y: 80 }} animate={{ y: 0 }}
          className={cn(
            'fixed bottom-0 left-0 right-0 z-20',
            'bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl',
            'border-t border-gray-100 dark:border-gray-800 px-4 py-3'
          )}
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}
        >
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div className="flex flex-col items-start">
              <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{t('totalPending')}</span>
              <motion.span key={pendingTotal} initial={{ scale: 0.92 }} animate={{ scale: 1 }}
                className="text-xl font-extrabold text-gray-900 dark:text-white tabular-nums">
                {currency.format(pendingTotal)}
              </motion.span>
              {spentTotal > 0 && (
                <span className="text-xs text-emerald-500 dark:text-emerald-400 font-bold tabular-nums mt-0.5">
                  ✓ {currency.format(spentTotal)} {t('spent')}
                </span>
              )}
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

      {/* ── FAB — Add item ── */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25, delay: 0.15 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleAdd}
        className={cn(
          'fixed bottom-32 z-40',
          isRTL ? 'left-4' : 'right-4',
          'w-14 h-14 rounded-2xl flex items-center justify-center',
          'bg-gradient-to-br from-blue-600 to-indigo-600 text-white',
          'shadow-xl shadow-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/50 transition-shadow'
        )}
        aria-label={t('addItemAria')}
      >
        <Plus className="w-6 h-6" strokeWidth={2.5} />
      </motion.button>

      <ShoppingBottomSheet isOpen={sheetOpen} onClose={handleClose}
        onSave={handleSave} editItem={editingItem} isSaving={isCreating || isUpdating} />

      <ShoppingShareSheet isOpen={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
};

export default ShoppingWishlistPage;
