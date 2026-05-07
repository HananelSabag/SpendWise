/**
 * ShoppingWishlistPage — רשימת קניות
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ArrowLeft, ShoppingCart, Plus, Package,
  CheckCircle2, SlidersHorizontal, UserPlus, Users, ChevronLeft, ChevronRight, Crown,
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

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-emerald-500',
  'bg-orange-500', 'bg-pink-500', 'bg-indigo-500',
];

const getInitial = (m) => {
  const name = m.first_name || m.username || m.email || '?';
  return name[0].toUpperCase();
};

const getShortName = (m) => {
  if (m.first_name) return m.first_name;
  const email = m.username || m.email || '';
  return email.split('@')[0];
};

// ── Sharing banner ─────────────────────────────────────────
const SharingBanner = ({ myMembers, sharedWithMe, onOpen, isRTL }) => {
  const { t } = useTranslation('shopping');
  if (!myMembers.length && !sharedWithMe.length) return null;

  const isLeader = myMembers.length > 0;
  const ownerName = sharedWithMe[0]
    ? (sharedWithMe[0].first_name || sharedWithMe[0].username || sharedWithMe[0].email?.split('@')[0])
    : null;

  const visibleMembers = (isLeader ? myMembers : sharedWithMe).slice(0, 3);
  const extra = (isLeader ? myMembers : sharedWithMe).length - 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 pb-2"
    >
      <button
        onClick={onOpen}
        className={cn(
          'w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl',
          'bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40',
          'hover:bg-blue-100/70 dark:hover:bg-blue-900/30 transition-colors duration-150',
          isRTL ? 'flex-row-reverse' : 'flex-row'
        )}
      >
        {/* Role indicator */}
        <div className={cn(
          'flex items-center gap-1 px-2 py-0.5 rounded-full flex-shrink-0 text-[10px] font-bold',
          isLeader
            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
            : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
        )}>
          {isLeader
            ? <><Crown className="w-2.5 h-2.5" /> {t('sharingBanner.youLead')}</>
            : <><Users className="w-2.5 h-2.5" /> {t('sharingBanner.managedBy', { name: ownerName })}</>
          }
        </div>

        {/* Avatars */}
        <div className={cn('flex items-center', isRTL ? 'flex-row-reverse' : 'flex-row')}>
          {visibleMembers.map((m, i) => (
            <div
              key={m.id ?? i}
              title={getShortName(m)}
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-extrabold border-2 border-white dark:border-gray-900',
                AVATAR_COLORS[i % AVATAR_COLORS.length],
                i > 0 && (isRTL ? 'mr-[-6px]' : 'ml-[-6px]')
              )}
            >
              {getInitial(m)}
            </div>
          ))}
          {extra > 0 && (
            <span className={cn(
              'text-[10px] font-bold text-gray-400 dark:text-gray-500',
              isRTL ? 'mr-1.5' : 'ml-1.5'
            )}>
              {t('sharingBanner.andMore', { count: extra })}
            </span>
          )}
        </div>

        <span className={cn('flex-1 text-[11px] text-blue-400 dark:text-blue-500 font-medium', isRTL ? 'text-left' : 'text-right')}>
          {t('sharingBanner.tapToManage')}
        </span>
      </button>
    </motion.div>
  );
};

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
const InviteBanner = ({ invitations, onOpenShare, isRTL }) => {
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
        isRTL ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
        <UserPlus className="w-4 h-4 text-blue-500" strokeWidth={2} />
      </div>
      <div className={cn('flex-1 min-w-0', isRTL ? 'text-right' : 'text-left')}>
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

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  const {
    items, isLoading, isError, refetch,
    createItem, updateItem, deleteItem, toggleBought,
    isCreating, isUpdating, isDeleting,
  } = useShoppingItems();

  const { myMembers, sharedWithMe, pendingInvitations, respond } = useShoppingShare();
  const { unreadCount, markAllRead } = useNotifications();

  const { user } = useAuth();
  const currentUserId = user?.id;

  const [activeCategory, setActiveCategory] = useState(null);
  const [activeTab,     setActiveTab]     = useState(null); // null = all | 'mine' | 'shared'
  const [sheetOpen,   setSheetOpen]   = useState(false);
  const [shareOpen,   setShareOpen]   = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    const token = searchParams.get('invite');
    if (token) {
      respond(token, 'accept').catch(() => {});
      navigate('/shopping', { replace: true });
      setShareOpen(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const ALL_KEY = t('allCategories');

  const { categoryTabs, categoryCounts, filteredItems, unbought, bought, pendingTotal } = useMemo(() => {
    // Apply tab filter first
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
    return { categoryTabs: tabs, categoryCounts: counts, filteredItems: filtered, unbought: u, bought: b, pendingTotal: pending };
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

  const openShare = useCallback(() => {
    setShareOpen(true);
    if (unreadCount > 0) markAllRead();
  }, [unreadCount, markAllRead]);

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

  const totalBadgeCount = unreadCount + pendingInvitations.length;
  const hasSharingMembers = myMembers.length > 0 || sharedWithMe.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/60 via-white to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 flex flex-col">

      {/* ── Header ── */}
      <div className={cn(
        'sticky top-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl',
        'border-b border-gray-100 dark:border-gray-800'
      )}>

        {/* Title row */}
        <div className={cn(
          'flex items-center gap-3 px-4 pt-4 pb-2',
          isRTL ? 'flex-row-reverse' : 'flex-row'
        )}>
          <motion.button whileTap={{ scale: 0.92 }}
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
            className={cn(
              'w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0',
              'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
              'text-gray-600 dark:text-gray-300 hover:bg-gray-100 transition-colors'
            )}
            aria-label={tc('back')}
          >
            <BackIcon className="w-5 h-5" strokeWidth={2} />
          </motion.button>

          <div className={cn('flex-1 min-w-0', isRTL ? 'text-right' : 'text-left')}>
            <h1 className="text-lg font-extrabold text-gray-900 dark:text-white leading-tight">{t('title')}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {t('itemsCount', { count: items.length })}
            </p>
          </div>

          {items.length > 0 && pendingTotal > 0 && (
            <motion.div key={pendingTotal} initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className={cn(
                'flex-shrink-0 px-3 py-1.5 rounded-xl',
                'bg-gradient-to-l from-blue-600 to-indigo-600',
                'text-white text-sm font-extrabold tabular-nums shadow-md shadow-blue-500/25'
              )}>
              {currency.format(pendingTotal)}
            </motion.div>
          )}

          <motion.button whileTap={{ scale: 0.92 }} onClick={openShare}
            className={cn(
              'relative w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0',
              'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
              'text-gray-600 dark:text-gray-300 hover:bg-gray-100 transition-colors'
            )}
            aria-label={t('share.button')}
          >
            <UserPlus className="w-4 h-4" strokeWidth={2} />
            {totalBadgeCount > 0 && (
              <span className={cn(
                'absolute -top-1 min-w-[18px] h-[18px] px-1',
                'bg-red-500 text-white text-[10px] font-extrabold',
                'rounded-full flex items-center justify-center',
                isRTL ? '-left-1' : '-right-1'
              )}>
                {totalBadgeCount > 9 ? '9+' : totalBadgeCount}
              </span>
            )}
          </motion.button>

          <motion.button whileTap={{ scale: 0.92 }} onClick={handleAdd}
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

        {/* Sharing banner — full-width, always visible when sharing */}
        <AnimatePresence>
          {hasSharingMembers && (
            <SharingBanner
              myMembers={myMembers}
              sharedWithMe={sharedWithMe}
              onOpen={openShare}
              isRTL={isRTL}
            />
          )}
        </AnimatePresence>

        {/* Personal / Shared tab switcher */}
        <AnimatePresence>
          {hasSharingMembers && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={cn(
                'flex gap-1.5 px-4 pb-2 overflow-hidden',
                isRTL ? 'flex-row-reverse' : 'flex-row'
              )}
            >
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category filter chips */}
        {items.length > 0 && categoryTabs.length > 1 && (
          <div className={cn(
            'flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-none',
            isRTL ? 'flex-row-reverse' : 'flex-row'
          )}>
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
      </div>

      {/* ── Content ── */}
      <div className="flex-1 px-4 py-4 pb-28 max-w-lg mx-auto w-full">

        <InviteBanner invitations={pendingInvitations} onOpenShare={openShare} isRTL={isRTL} />

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
                <div className={cn('flex items-center gap-2 mb-3', isRTL ? 'flex-row-reverse' : 'flex-row')}>
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
          <div className={cn('max-w-lg mx-auto flex items-center', isRTL ? 'flex-row-reverse' : 'flex-row', 'justify-between')}>
            <div className={cn('flex flex-col', isRTL ? 'items-end' : 'items-start')}>
              <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{t('totalPending')}</span>
              <motion.span key={pendingTotal} initial={{ scale: 0.92 }} animate={{ scale: 1 }}
                className="text-xl font-extrabold text-gray-900 dark:text-white tabular-nums">
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

      <ShoppingBottomSheet isOpen={sheetOpen} onClose={handleClose}
        onSave={handleSave} editItem={editingItem} isSaving={isCreating || isUpdating} />

      <ShoppingShareSheet isOpen={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
};

export default ShoppingWishlistPage;
