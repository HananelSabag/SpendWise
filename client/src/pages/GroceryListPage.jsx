/**
 * GroceryListPage — the shared household grocery list.
 *
 * Layout is built around one-handed use in a supermarket: a compact header with
 * progress, a sticky aisle strip to jump between departments, dense rows, and a
 * composer pinned within thumb reach above the bottom navigation. Desktop gets a
 * second column rather than a stretched phone layout.
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown, ClipboardList, Flag, ShoppingCart, Users, AlertCircle,
} from 'lucide-react';
import { cn } from '../utils/helpers';
import { isGroceryMode } from '../utils/appMode';
import { useTranslation, useAuth } from '../stores';
import { useToast } from '../hooks/useToast';
import { useGroceryList } from '../hooks/useGroceryList';
import { useMyGroceryInvitations } from '../hooks/useGrocerySharing';
import { PageSkeleton, LiquidTabs } from '../components/ui';
import GroceryItemRow from '../components/features/grocery/GroceryItemRow';
import GroceryQuickAdd from '../components/features/grocery/GroceryQuickAdd';
import GroceryItemSheet from '../components/features/grocery/GroceryItemSheet';
import GroceryLockBanner from '../components/features/grocery/GroceryLockBanner';
import GroceryFinishSheet from '../components/features/grocery/GroceryFinishSheet';
import GroceryShareSheet from '../components/features/grocery/GroceryShareSheet';
import GroceryHistoryPanel from '../components/features/grocery/GroceryHistoryPanel';
import { CATEGORY_BY_KEY, DEFAULT_CATEGORY } from '../components/features/grocery/groceryCategories';

/**
 * How far the composer sits above the bottom navigation.
 *
 * Grocery mode's bar is a flat row. Full SpendWise mode's bar has a raised
 * centre FAB that protrudes about 28px above it, so the composer has to clear
 * that too — this is the collision the old wishlist screen had between its FAB,
 * its sticky total bar and the tab bar.
 */
const COMPOSER_OFFSET = {
  grocery: 'calc(60px + env(safe-area-inset-bottom, 0px))',
  full: 'calc(92px + env(safe-area-inset-bottom, 0px))',
};

const ProgressBar = ({ progress, pendingCount, purchasedCount }) => {
  const { t } = useTranslation('grocery');
  const allDone = pendingCount === 0 && purchasedCount > 0;

  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
        <motion.div
          className={cn('h-full rounded-full', allDone ? 'bg-emerald-500' : 'bg-blue-500')}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 30 }}
        />
      </div>
      <span className={cn(
        'shrink-0 text-xs font-bold tabular-nums',
        allDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'
      )}>
        {allDone ? t('progress.allDone') : t('progress.remaining', { count: pendingCount })}
      </span>
    </div>
  );
};

const GroceryListPage = () => {
  const { t, isRTL } = useTranslation('grocery');
  const { t: tc } = useTranslation('common');
  const { user } = useAuth();
  const groceryMode = isGroceryMode(user);
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    isLoading, isError, refetch,
    members, pendingInvitations, sections, purchased,
    pendingCount, purchasedCount, progress, role,
    lock, lockedByOther, canEdit, isEditMode, holdsLease,
    requestControl, releaseControl,
    addItem, updateItem, togglePurchased, deleteItem, completeTrip,
  } = useGroceryList();

  const { invitations: myInvitations } = useMyGroceryInvitations();

  const [tab, setTab] = useState(searchParams.get('tab') === 'history' ? 'history' : 'list');
  const [sheetItem, setSheetItem] = useState(null);
  const [sheetSeed, setSheetSeed] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const sectionRefs = useRef({});

  const changeTab = useCallback((next) => {
    setTab(next);
    const params = new URLSearchParams(searchParams);
    if (next === 'history') params.set('tab', 'history');
    else params.delete('tab');
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleAdd = useCallback(async (payload) => {
    const created = await addItem(payload);
    return !!created;
  }, [addItem]);

  const handleOpenItem = useCallback((item) => {
    setSheetItem(item);
    setSheetSeed(null);
    setSheetOpen(true);
  }, []);

  const handleOpenDetails = useCallback((seed) => {
    setSheetItem(null);
    setSheetSeed(seed);
    setSheetOpen(true);
  }, []);

  const handleSaveItem = useCallback(async (payload) => {
    const saved = sheetItem
      ? await updateItem(sheetItem.id, payload)
      : await addItem(payload);
    return !!saved;
  }, [sheetItem, updateItem, addItem]);

  const handleFinish = useCallback(async (payload) => {
    const result = await completeTrip(payload);
    if (result) {
      toast.success(t('finish.success'));
      if (result.carriedOver > 0) {
        toast.success(t('finish.carriedOver', { count: result.carriedOver }));
      }
    }
    return result;
  }, [completeTrip, toast, t]);

  const scrollToSection = useCallback((key) => {
    sectionRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const invitationBanner = useMemo(() => {
    if (myInvitations.length === 0) return null;
    const first = myInvitations[0];
    return {
      name: first.inviter_first_name || first.inviter_username,
      extra: myInvitations.length - 1,
    };
  }, [myInvitations]);

  // Error first: a query that keeps failing stays pending across its retry and
  // poll cycles, so checking isLoading first showed a skeleton that never
  // resolved instead of telling the user anything.
  if (isError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-8 text-center">
        <AlertCircle className="mb-3 h-10 w-10 text-red-400" strokeWidth={1.5} />
        <p className="mb-4 text-gray-600 dark:text-gray-300">{t('errors.generic')}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white"
        >
          {tc('retry')}
        </button>
      </div>
    );
  }

  if (isLoading) return <PageSkeleton page="grocery" />;

  const isEmpty = sections.length === 0 && purchased.length === 0;
  const composerDisabled = lockedByOther;

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-full bg-gray-50/60 dark:bg-gray-900">
      <div className="mx-auto w-full max-w-6xl px-3 pb-4 sm:px-5 lg:px-6">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 -mx-3 bg-gray-50/95 px-3 pb-2 pt-3 backdrop-blur-sm sm:-mx-5 sm:px-5 lg:-mx-6 lg:px-6 dark:bg-gray-900/95">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
              <ShoppingCart className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-extrabold leading-tight text-gray-900 dark:text-gray-50">
                {t('title')}
              </h1>
              <p className="truncate text-xs text-gray-400 dark:text-gray-500">
                {members.length > 1 ? t('subtitle') : t('share.alone')}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShareOpen(true)}
              aria-label={t('share.title')}
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-500 transition-colors hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
            >
              <Users className="h-4 w-4" />
              {myInvitations.length > 0 && (
                <span className="absolute -end-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-extrabold text-white">
                  {myInvitations.length}
                </span>
              )}
            </button>
          </div>

          <div className="mt-2.5">
            <LiquidTabs
              fill
              tabs={[
                { id: 'list', label: t('tabs.list'), icon: ClipboardList },
                { id: 'history', label: t('tabs.history'), icon: Flag },
              ]}
              active={tab}
              onChange={changeTab}
            />
          </div>
        </header>

        {tab === 'history' ? (
          <div className="pt-3">
            <GroceryHistoryPanel active={tab === 'history'} />
          </div>
        ) : (
          <div className="pt-3 lg:flex lg:items-start lg:gap-6">

            {/* ── Main column ─────────────────────────────────────── */}
            <div className="min-w-0 flex-1">
              <div className="space-y-2.5">
                {invitationBanner && (
                  <button
                    type="button"
                    onClick={() => setShareOpen(true)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-start dark:border-blue-500/30 dark:bg-blue-500/10"
                  >
                    <Users className="h-4 w-4 shrink-0 text-blue-500" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-blue-900 dark:text-blue-200">
                        {t('banner.invitation', { name: invitationBanner.name })}
                      </span>
                      {invitationBanner.extra > 0 && (
                        <span className="block text-xs text-blue-600 dark:text-blue-300">
                          {t('banner.invitationMore', { count: invitationBanner.extra })}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-xs font-bold text-blue-600 dark:text-blue-300">
                      {t('banner.view')}
                    </span>
                  </button>
                )}

                <GroceryLockBanner
                  lockedByOther={lockedByOther}
                  lockedBy={lock?.lockedBy}
                  expiresAt={lock?.expiresAt}
                  isEditMode={isEditMode}
                  holdsLease={holdsLease}
                  onRequestControl={requestControl}
                  onReleaseControl={releaseControl}
                />

                {!isEmpty && (
                  <div className="rounded-2xl border border-gray-100 bg-white px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800/60">
                    <ProgressBar
                      progress={progress}
                      pendingCount={pendingCount}
                      purchasedCount={purchasedCount}
                    />
                  </div>
                )}
              </div>

              {/* Aisle jump strip */}
              {sections.length > 1 && (
                <nav
                  aria-label={t('aisles.jumpTo')}
                  className="sticky top-[104px] z-20 -mx-3 mt-2.5 overflow-x-auto px-3 py-1.5 sm:-mx-5 sm:px-5 lg:static lg:mx-0 lg:px-0"
                >
                  <ul className="flex gap-1.5">
                    {sections.map(({ key, items }) => {
                      const category = CATEGORY_BY_KEY[key] || CATEGORY_BY_KEY[DEFAULT_CATEGORY];
                      const Icon = category.icon;
                      return (
                        <li key={key}>
                          <button
                            type="button"
                            onClick={() => scrollToSection(key)}
                            className={cn(
                              'flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-xs font-semibold',
                              'border-gray-200 bg-white text-gray-600 hover:border-gray-300',
                              'dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
                            )}
                          >
                            <Icon className={cn('h-3.5 w-3.5', category.tint)} />
                            {t(`categories.${key}`)}
                            <span className="tabular-nums text-gray-400">{items.length}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              )}

              {/* Sections */}
              {isEmpty ? (
                <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
                  <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-gray-300 shadow-sm dark:bg-gray-800 dark:text-gray-600">
                    <ShoppingCart className="h-8 w-8" strokeWidth={1.5} />
                  </span>
                  <h2 className="mb-1.5 text-base font-bold text-gray-700 dark:text-gray-200">
                    {lockedByOther ? t('empty.readOnly') : t('empty.title')}
                  </h2>
                  {!lockedByOther && (
                    <p className="max-w-xs text-sm leading-relaxed text-gray-400 dark:text-gray-500">
                      {t('empty.description')}
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-3 space-y-5">
                  {sections.map(({ key, items }) => {
                    const category = CATEGORY_BY_KEY[key] || CATEGORY_BY_KEY[DEFAULT_CATEGORY];
                    const Icon = category.icon;
                    return (
                      <section
                        key={key}
                        ref={(node) => { sectionRefs.current[key] = node; }}
                        className="scroll-mt-[150px]"
                      >
                        <h2 className="mb-1.5 flex items-center gap-2 px-1 text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                          <span className={cn('flex h-6 w-6 items-center justify-center rounded-lg', category.chip)}>
                            <Icon className={cn('h-3.5 w-3.5', category.tint)} />
                          </span>
                          {t(`categories.${key}`)}
                          <span className="tabular-nums font-semibold">{items.length}</span>
                        </h2>
                        <ul className="space-y-1.5">
                          <AnimatePresence initial={false}>
                            {items.map((item) => (
                              <GroceryItemRow
                                key={item.id}
                                item={item}
                                onToggle={togglePurchased}
                                onOpen={handleOpenItem}
                                disabled={!canEdit}
                              />
                            ))}
                          </AnimatePresence>
                        </ul>
                      </section>
                    );
                  })}

                  {/* In the cart — collapsed, out of the way, one tap to undo. */}
                  {purchased.length > 0 && (
                    <section className="pt-1">
                      <button
                        type="button"
                        onClick={() => setCartOpen((open) => !open)}
                        aria-expanded={cartOpen}
                        className="flex w-full items-center gap-2 rounded-xl px-1 py-2 text-[11px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400"
                      >
                        <motion.span animate={{ rotate: cartOpen ? 180 : 0 }} transition={{ duration: 0.18 }}>
                          <ChevronDown className="h-4 w-4" />
                        </motion.span>
                        {t('sections.inCart', { count: purchased.length })}
                      </button>

                      <AnimatePresence initial={false}>
                        {cartOpen && (
                          <motion.ul
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-1.5 overflow-hidden"
                          >
                            {purchased.map((item) => (
                              <GroceryItemRow
                                key={item.id}
                                item={item}
                                onToggle={togglePurchased}
                                onOpen={handleOpenItem}
                                disabled={!canEdit}
                              />
                            ))}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </section>
                  )}
                </div>
              )}

              {/* Space for the fixed composer on mobile. */}
              <div className={cn('lg:hidden', groceryMode ? 'h-24' : 'h-32')} aria-hidden />
            </div>

            {/* ── Desktop rail ────────────────────────────────────── */}
            <aside className="hidden w-80 shrink-0 space-y-3 lg:block">
              <div className="rounded-2xl border border-gray-100 bg-white p-3.5 dark:border-gray-700 dark:bg-gray-800/60">
                <GroceryQuickAdd
                  onAdd={handleAdd}
                  onOpenDetails={handleOpenDetails}
                  disabled={composerDisabled}
                />
              </div>

              {purchasedCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFinishOpen(true)}
                  disabled={!canEdit}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Flag className="h-4 w-4" />
                  {t('finish.button')}
                </button>
              )}

              <div className="rounded-2xl border border-gray-100 bg-white p-3.5 dark:border-gray-700 dark:bg-gray-800/60">
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  {t('share.members')}
                </h3>
                <ul className="space-y-1.5">
                  {members.map((member) => (
                    <li key={member.user_id} className="flex items-center gap-2 text-sm">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-[11px] font-bold text-white">
                        {(member.first_name || member.username || '?').charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-gray-700 dark:text-gray-200">
                        {[member.first_name, member.last_name].filter(Boolean).join(' ') || member.username}
                      </span>
                      {member.role === 'owner' && (
                        <span className="shrink-0 text-[10px] font-bold uppercase text-gray-400">
                          {t('share.roleOwner')}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => setShareOpen(true)}
                  className="mt-3 h-10 w-full rounded-xl border border-gray-200 text-xs font-bold text-gray-600 dark:border-gray-700 dark:text-gray-300"
                >
                  {t('share.title')}
                </button>
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* ── Mobile composer + finish, pinned above the bottom nav ───── */}
      {tab === 'list' && (
        <div
          className="fixed inset-x-0 z-40 border-t border-gray-100 bg-white/95 px-3 py-2 backdrop-blur-md lg:hidden dark:border-gray-700 dark:bg-gray-900/95"
          style={{ bottom: COMPOSER_OFFSET[groceryMode ? 'grocery' : 'full'] }}
        >
          {purchasedCount > 0 && (
            <button
              type="button"
              onClick={() => setFinishOpen(true)}
              disabled={!canEdit}
              className="mb-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white disabled:opacity-50"
            >
              <Flag className="h-4 w-4" />
              {t('finish.button')}
              <span className="text-xs font-semibold opacity-80">
                {t('progress.done', { count: purchasedCount })}
              </span>
            </button>
          )}
          <GroceryQuickAdd
            onAdd={handleAdd}
            onOpenDetails={handleOpenDetails}
            disabled={composerDisabled}
          />
        </div>
      )}

      <GroceryItemSheet
        isOpen={sheetOpen}
        onClose={() => { setSheetOpen(false); setSheetItem(null); setSheetSeed(null); }}
        onSave={handleSaveItem}
        onDelete={deleteItem}
        item={sheetItem}
        seed={sheetSeed}
      />

      <GroceryFinishSheet
        isOpen={finishOpen}
        onClose={() => setFinishOpen(false)}
        onConfirm={handleFinish}
        purchasedCount={purchasedCount}
        pendingCount={pendingCount}
      />

      <GroceryShareSheet
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        members={members}
        pendingInvitations={pendingInvitations}
        role={role}
        currentUserId={user?.id}
      />
    </div>
  );
};

export default GroceryListPage;
