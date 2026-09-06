/**
 * GroceryListPage — the shared household grocery list.
 *
 * Vertical space is the scarce resource here. On a phone the bottom navigation
 * already owns ~60px, so the page keeps its own chrome to a single scrolling
 * header row and a hairline progress bar: nothing is sticky, because a sticky
 * header plus a sticky composer plus the nav left less than half the screen for
 * the list itself. Adding an item is one floating button that opens one sheet.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle, ChevronDown, ClipboardList, Flag, Plus, ShoppingCart, Users,
} from 'lucide-react';
import { cn } from '../utils/helpers';
import { isGroceryMode } from '../utils/appMode';
import { useTranslation, useAuth } from '../stores';
import { useToast } from '../hooks/useToast';
import { useGroceryList } from '../hooks/useGroceryList';
import { useGroceryLists, useMyGroceryInvitations } from '../hooks/useGrocerySharing';
import { PageSkeleton, LiquidTabs } from '../components/ui';
import GroceryItemRow from '../components/features/grocery/GroceryItemRow';
import GroceryItemSheet from '../components/features/grocery/GroceryItemSheet';
import GroceryFinishSheet from '../components/features/grocery/GroceryFinishSheet';
import GroceryShareSheet from '../components/features/grocery/GroceryShareSheet';
import GroceryHistoryPanel from '../components/features/grocery/GroceryHistoryPanel';
import GroceryListSwitcher, { listLabel } from '../components/features/grocery/GroceryListSwitcher';
import { hasLearnedGesture, onGestureLearned } from '../components/features/grocery/gestureHint';
import { CATEGORY_BY_KEY, DEFAULT_CATEGORY } from '../components/features/grocery/groceryCategories';

/**
 * How high the add button floats above the bottom navigation. Grocery mode's
 * bar is a flat row; full SpendWise mode's has a centre FAB that protrudes
 * about 28px above it and would collide with a button sitting any lower.
 */
const FAB_OFFSET = {
  grocery: 'calc(84px + env(safe-area-inset-bottom, 0px))',
  full: 'calc(112px + env(safe-area-inset-bottom, 0px))',
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
    list, members, sections, purchased,
    pendingCount, purchasedCount, progress, role,
    addItem, updateItem, togglePurchased, deleteItem,
    claimItem, releaseItem, completeTrip, switchList,
  } = useGroceryList();

  const { invitations: myInvitations } = useMyGroceryInvitations();
  const { lists, hasMultiple } = useGroceryLists();

  const [tab, setTab] = useState(searchParams.get('tab') === 'history' ? 'history' : 'list');
  const [sheetItem, setSheetItem] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [listsOpen, setListsOpen] = useState(false);
  const [switchingTo, setSwitchingTo] = useState(null);
  const [showGestureHint, setShowGestureHint] = useState(() => !hasLearnedGesture());
  const sectionRefs = useRef({});

  useEffect(() => onGestureLearned(() => setShowGestureHint(false)), []);

  const activeListId = list?.id ?? null;
  const activeList = lists.find((entry) => String(entry.id) === String(activeListId));

  const handleSwitchList = useCallback(async (id) => {
    setSwitchingTo(id);
    const switched = await switchList(id);
    setSwitchingTo(null);
    if (switched) setListsOpen(false);
  }, [switchList]);

  const changeTab = useCallback((next) => {
    setTab(next);
    const params = new URLSearchParams(searchParams);
    if (next === 'history') params.set('tab', 'history');
    else params.delete('tab');
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  const openAdd = useCallback(() => { setSheetItem(null); setSheetOpen(true); }, []);

  /** Editing one item claims it, so two people can't type into it at once. */
  const openItem = useCallback(async (item) => {
    if (!(await claimItem(item.id))) return;
    setSheetItem(item);
    setSheetOpen(true);
  }, [claimItem]);

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    if (sheetItem) releaseItem(sheetItem.id);
    setSheetItem(null);
  }, [sheetItem, releaseItem]);

  const handleSaveItem = useCallback(async (payload) => {
    const saved = sheetItem
      ? await updateItem(sheetItem.id, payload, sheetItem.version)
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

  // Error before loading: a query that keeps failing stays pending across its
  // retry and poll cycles, so checking isLoading first showed a skeleton that
  // never resolved instead of the error and its retry button.
  //
  // `&& !list` matters as much. A poll failing while a list is already on
  // screen is routine — a sleeping free-tier dyno takes half a minute to wake,
  // and mobile data drops — and replacing a perfectly good list with a full
  // error page over one timed-out background request is the wrong trade. It
  // also used to be actively destructive: swapping the page out unmounted any
  // open bottom sheet mid-use, which is how "open manage list and the page
  // goes" happened. Poll failures now stay quiet and the next one recovers.
  if (isError && !list) {
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

  /** One line of status under the title, instead of a card of its own. */
  const statusLine = isEmpty
    ? (members.length > 1 ? t('subtitle') : t('share.alone'))
    : [
        t('progress.remaining', { count: pendingCount }),
        purchasedCount > 0 ? t('progress.done', { count: purchasedCount }) : null,
      ].filter(Boolean).join(' · ');

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className="min-h-screen bg-gray-50 pb-36 dark:bg-gray-950 lg:pb-10"
    >
      <div className="mx-auto w-full max-w-6xl px-3 sm:px-5 lg:px-6">

        {/* ── Header — scrolls away with the content ─────────────────── */}
        <header className="pt-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white lg:hidden">
              <ShoppingCart className="h-4 w-4 rtl:-scale-x-100" />
            </span>
            <div className="min-w-0 flex-1">
              {/* With one list the title is just a title. With two it is the
                  only place a switch belongs — right where you read which list
                  you are on. */}
              {hasMultiple ? (
                <button
                  type="button"
                  onClick={() => setListsOpen(true)}
                  aria-label={t('lists.switchTo')}
                  className="flex max-w-full items-center gap-1 text-start"
                >
                  <span className="truncate text-base font-extrabold leading-tight text-gray-900 dark:text-gray-50">
                    {activeList ? listLabel(activeList, t) : t('title')}
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
                </button>
              ) : (
                <h1 className="truncate text-base font-extrabold leading-tight text-gray-900 dark:text-gray-50">
                  {t('title')}
                </h1>
              )}
              <p className="truncate text-xs text-gray-400 dark:text-gray-500">{statusLine}</p>
            </div>

            <button
              type="button"
              onClick={() => setShareOpen(true)}
              aria-label={t('share.title')}
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-colors hover:text-gray-700 lg:hidden dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
            >
              <Users className="h-4 w-4" />
              {myInvitations.length > 0 && (
                <span className="absolute -end-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-extrabold text-white">
                  {myInvitations.length}
                </span>
              )}
            </button>
          </div>

          <div className="mt-2 lg:max-w-sm">
            <LiquidTabs
              fill
              size="sm"
              tabs={[
                { id: 'list', label: t('tabs.list'), icon: ClipboardList },
                { id: 'history', label: t('tabs.history'), icon: Flag },
              ]}
              active={tab}
              onChange={changeTab}
            />
          </div>

          {/* Progress as a hairline rather than a card — it was spending 50px to
              repeat what the status line above already says in words. */}
          {tab === 'list' && !isEmpty && (
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
              <motion.div
                className={cn('h-full rounded-full', pendingCount === 0 ? 'bg-emerald-500' : 'bg-blue-500')}
                animate={{ width: `${progress}%` }}
                transition={{ type: 'spring', stiffness: 200, damping: 30 }}
              />
            </div>
          )}
        </header>

        {tab === 'history' ? (
          <div className="pt-3">
            <GroceryHistoryPanel active={tab === 'history'} />
          </div>
        ) : (
          <div className="pt-3 lg:flex lg:items-start lg:gap-6">

            {/* ── Main column ─────────────────────────────────────── */}
            <div className="min-w-0 flex-1">
              {invitationBanner && (
                <div className="mb-2.5">
                  {(
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
                </div>
              )}

              {/* Aisle jump strip — inline, so it scrolls out of the way once
                  you are inside a section. */}
              {sections.length > 1 && (
                <nav
                  aria-label={t('aisles.jumpTo')}
                  className="-mx-3 mb-2 overflow-x-auto px-3 pb-1 sm:-mx-5 sm:px-5 lg:mx-0 lg:px-0"
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
                              'flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 text-xs font-semibold',
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

              {isEmpty ? (
                <div className="flex flex-col items-center justify-center px-8 py-14 text-center">
                  <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-gray-300 shadow-sm dark:bg-gray-800 dark:text-gray-600">
                    <ShoppingCart className="h-7 w-7 rtl:-scale-x-100" strokeWidth={1.5} />
                  </span>
                  <h2 className="mb-1.5 text-base font-bold text-gray-700 dark:text-gray-200">
                    {t('empty.title')}
                  </h2>
                  <p className="mb-5 max-w-xs text-sm leading-relaxed text-gray-400 dark:text-gray-500">
                    {t('empty.description')}
                  </p>
                  <button
                    type="button"
                    onClick={openAdd}
                    className="flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white"
                  >
                    <Plus className="h-4 w-4" strokeWidth={2.5} />
                    {t('empty.addFirst')}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Taught at the top, because a long-press is not a gesture
                      anyone discovers on their own — and retired the first time
                      they use it, because a permanent tip is just clutter on the
                      screen with the least room to spare. */}
                  {showGestureHint && (
                    <p className="px-1 text-[11px] text-gray-400 dark:text-gray-500">
                      {t('empty.gestureHint')}
                    </p>
                  )}

                  {sections.map(({ key, items }) => {
                    const category = CATEGORY_BY_KEY[key] || CATEGORY_BY_KEY[DEFAULT_CATEGORY];
                    const Icon = category.icon;
                    return (
                      <section
                        key={key}
                        ref={(node) => { sectionRefs.current[key] = node; }}
                        className="scroll-mt-3"
                      >
                        <h2 className="mb-1.5 flex items-center gap-2 px-1 text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                          <span className={cn('flex h-5 w-5 items-center justify-center rounded-md', category.chip)}>
                            <Icon className={cn('h-3 w-3', category.tint)} />
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
                                onOpen={openItem}
                                onDelete={deleteItem}
                                currentUserId={user?.id}
                              />
                            ))}
                          </AnimatePresence>
                        </ul>
                      </section>
                    );
                  })}

                  {/* In the cart — collapsed, with Finish sitting right where you
                      already look once things start landing in it. */}
                  {purchased.length > 0 && (
                    <section className="pt-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCartOpen((open) => !open)}
                          aria-expanded={cartOpen}
                          className="flex flex-1 items-center gap-1.5 rounded-xl px-1 py-2 text-[11px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400"
                        >
                          <motion.span animate={{ rotate: cartOpen ? 180 : 0 }} transition={{ duration: 0.18 }}>
                            <ChevronDown className="h-4 w-4" />
                          </motion.span>
                          {t('sections.inCart', { count: purchased.length })}
                        </button>

                        <button
                          type="button"
                          onClick={() => setFinishOpen(true)}
                          className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <Flag className="h-3.5 w-3.5 rtl:-scale-x-100" />
                          {t('finish.button')}
                        </button>
                      </div>

                      <AnimatePresence initial={false}>
                        {cartOpen && (
                          <motion.ul
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-1.5 overflow-hidden pt-1"
                          >
                            {purchased.map((item) => (
                              <GroceryItemRow
                                key={item.id}
                                item={item}
                                onToggle={togglePurchased}
                                onOpen={openItem}
                                onDelete={deleteItem}
                                currentUserId={user?.id}
                              />
                            ))}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </section>
                  )}
                </div>
              )}
            </div>

            {/* ── Desktop rail ────────────────────────────────────── */}
            <aside className="hidden w-72 shrink-0 space-y-3 lg:block xl:w-80">
              <button
                type="button"
                onClick={openAdd}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                {t('quickAdd.add')}
              </button>

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

      {/* ── Add button — one floating control, mobile only ──────────── */}
      {tab === 'list' && !isEmpty && (
        <motion.button
          type="button"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          whileTap={{ scale: 0.92 }}
          onClick={openAdd}
          aria-label={t('quickAdd.aria')}
          className={cn(
            'fixed z-40 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl lg:hidden',
            isRTL ? 'start-4' : 'end-4',
            'bg-blue-600 text-white shadow-xl shadow-blue-600/30',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2'
          )}
          style={{ bottom: FAB_OFFSET[groceryMode ? 'grocery' : 'full'] }}
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </motion.button>
      )}

      <GroceryItemSheet
        isOpen={sheetOpen}
        onClose={closeSheet}
        onSave={handleSaveItem}
        onDelete={deleteItem}
        item={sheetItem}
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
        role={role}
        currentUserId={user?.id}
      />

      <GroceryListSwitcher
        isOpen={listsOpen}
        onClose={() => setListsOpen(false)}
        lists={lists}
        activeListId={activeListId}
        onSwitch={handleSwitchList}
        busyId={switchingTo}
      />
    </div>
  );
};

export default GroceryListPage;
