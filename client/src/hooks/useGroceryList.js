/**
 * useGroceryList — the shared grocery list's live state and mutations.
 *
 * Live collaboration
 * ------------------
 * The server keeps a monotonic `version` on the list and bumps it on every
 * change. This hook polls `/grocery/state?version=<known>`; when nothing moved
 * the server answers with a tiny `{ unchanged: true }` body and we keep the
 * exact same object, so the interval costs almost nothing and never re-renders
 * the list. Polling pauses when the tab is in the background.
 *
 * Concurrency
 * -----------
 * There is deliberately no list-level lock. Two people adding different items,
 * or checking off different items, cannot conflict — freezing the whole list to
 * defend against that made the app feel broken for the person who wasn't
 * editing. The one genuine collision is two people editing the same item's
 * fields, and that is handled where it happens:
 *
 *   * opening an item's editor claims THAT item (advisory, ~90s, released on
 *     close or on save)
 *   * every edit carries the item's `version`, so a write that lost the race is
 *     rejected with 409 rather than silently overwriting
 *
 * Everything else is free for everyone, all the time.
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import useAuthStore from '../stores/authStore';
import { useToast } from './useToast';
import { useTranslation } from '../stores';
import { categoryOrder } from '../components/features/grocery/groceryCategories';

const POLL_INTERVAL_MS = 5000;

export function useGroceryList() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const userId = useAuthStore((s) => s.user?.id);
  const { t } = useTranslation('grocery');

  const QUERY_KEY = useMemo(() => ['grocery', 'state', userId], [userId]);
  const claimedItemRef = useRef(null);

  // Which list this client is showing. Every request carries it, so the server
  // never has to guess between the several lists a person may belong to.
  const activeListRef = useRef(null);

  // ─── State query + polling ────────────────────────────────────────────────

  const query = useQuery({
    queryKey: QUERY_KEY,
    enabled: !!userId,
    queryFn: async () => {
      const previous = queryClient.getQueryData(QUERY_KEY);

      // The version is only a valid question about the SAME list. After a
      // switch the cached version belongs to the list we just left, and two
      // lists can easily sit on the same number — asking would get back
      // "unchanged" and leave the old list on screen. Ask for everything.
      const cachedListId = previous?.list?.id == null ? null : String(previous.list.id);
      const sameList = cachedListId !== null
        && (activeListRef.current === null || activeListRef.current === cachedListId);
      const known = sameList ? previous?.list?.version : undefined;

      const result = await api.grocery.getState(known);
      if (!result.success) throw new Error(result.error?.code || 'GROCERY_STATE_FAILED');

      // Same version — hand back the identical object so nothing re-renders.
      if (result.data?.unchanged && previous) return previous;
      return result.data;
    },
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });

  const state = query.data;

  // Keep the API layer pointed at the list currently on screen. Done in an
  // effect rather than inside the query so a cached read updates it too.
  useEffect(() => {
    const id = state?.list?.id == null ? null : String(state.list.id);
    if (activeListRef.current === id) return;
    activeListRef.current = id;
    api.grocery.setActiveList(id);
  }, [state?.list?.id]);

  // ─── Derived view state ───────────────────────────────────────────────────

  const { sections, purchased, pendingCount, purchasedCount, progress } = useMemo(() => {
    const items = state?.items ?? [];
    const open = items.filter((item) => !item.is_purchased);
    const done = items.filter((item) => item.is_purchased);

    const byCategory = new Map();
    open.forEach((item) => {
      if (!byCategory.has(item.category_key)) byCategory.set(item.category_key, []);
      byCategory.get(item.category_key).push(item);
    });

    const ordered = [...byCategory.entries()]
      .sort(([a], [b]) => categoryOrder(a) - categoryOrder(b))
      .map(([key, categoryItems]) => ({ key, items: categoryItems }));

    // Newest purchase on top, so the undo you want is the one you can reach.
    const doneSorted = [...done].sort((a, b) =>
      new Date(b.purchased_at || 0) - new Date(a.purchased_at || 0)
    );

    const total = items.length;
    return {
      sections: ordered,
      purchased: doneSorted,
      pendingCount: open.length,
      purchasedCount: done.length,
      progress: total === 0 ? 0 : Math.round((done.length / total) * 100),
    };
  }, [state?.items]);

  // ─── Mutation plumbing ────────────────────────────────────────────────────

  const patchCache = useCallback((updater) => {
    queryClient.setQueryData(QUERY_KEY, (old) => (old ? updater(old) : old));
  }, [queryClient, QUERY_KEY]);

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  }, [queryClient, QUERY_KEY]);

  const reportFailure = useCallback((result, rollback) => {
    rollback?.();
    const code = result.error?.code;

    if (code === 'GROCERY_ITEM_BUSY') {
      toast.error(t('item.busy', { name: result.error?.editingBy || t('lock.someone') }));
    } else if (code === 'GROCERY_ITEM_STALE') {
      toast.error(t('errors.GROCERY_ITEM_STALE'));
    } else {
      toast.error(t(`errors.${code}`, { fallback: t('errors.generic') }));
    }
    refresh();
  }, [refresh, t, toast]);

  // ─── Item actions ─────────────────────────────────────────────────────────

  const addItem = useCallback(async (payload) => {
    const result = await api.grocery.addItem(payload);
    if (!result.success) { reportFailure(result); return null; }

    const { item, version } = result.data;
    patchCache((old) => ({
      ...old,
      list: { ...old.list, version: version ?? old.list.version },
      // A poll can land between the request and this patch and already carry
      // the new row — appending blindly would show it twice.
      items: old.items.some((existing) => existing.id === item.id)
        ? old.items.map((existing) => (existing.id === item.id ? item : existing))
        : [...old.items, item],
    }));
    return item;
  }, [patchCache, reportFailure]);

  /** Edits always send the item's version, so a lost update is refused. */
  const updateItem = useCallback(async (id, payload, version) => {
    const result = await api.grocery.updateItem(id, { ...payload, version });
    if (!result.success) { reportFailure(result); return null; }

    const { item, version: listVersion } = result.data;
    patchCache((old) => ({
      ...old,
      list: { ...old.list, version: listVersion ?? old.list.version },
      items: old.items.map((existing) => (existing.id === id ? item : existing)),
    }));
    return item;
  }, [patchCache, reportFailure]);

  /**
   * The one-tap action of the whole screen: flip locally first so the row moves
   * the instant a thumb lands on it, then confirm with the server.
   */
  const togglePurchased = useCallback(async (item) => {
    const next = !item.is_purchased;
    const snapshot = queryClient.getQueryData(QUERY_KEY);

    patchCache((old) => ({
      ...old,
      items: old.items.map((current) => (current.id === item.id
        ? {
            ...current,
            is_purchased: next,
            purchased_at: next ? new Date().toISOString() : null,
            purchased_by: next ? userId : null,
          }
        : current)),
    }));

    const result = await api.grocery.setPurchased(item.id, next);
    if (!result.success) {
      reportFailure(result, () => queryClient.setQueryData(QUERY_KEY, snapshot));
      return;
    }

    const { item: saved, version } = result.data;
    patchCache((old) => ({
      ...old,
      list: { ...old.list, version: version ?? old.list.version },
      items: old.items.map((current) => (current.id === item.id ? saved : current)),
    }));
  }, [queryClient, QUERY_KEY, patchCache, reportFailure, userId]);

  const deleteItem = useCallback(async (id) => {
    const snapshot = queryClient.getQueryData(QUERY_KEY);
    patchCache((old) => ({ ...old, items: old.items.filter((item) => item.id !== id) }));

    const result = await api.grocery.deleteItem(id);
    if (!result.success) {
      reportFailure(result, () => queryClient.setQueryData(QUERY_KEY, snapshot));
    }
  }, [queryClient, QUERY_KEY, patchCache, reportFailure]);

  // ─── Per-item edit claim ──────────────────────────────────────────────────

  /** Called when the editor opens. Returns false when someone else has it. */
  const claimItem = useCallback(async (id) => {
    const result = await api.grocery.claimItem(id);
    if (!result.success) {
      reportFailure(result);
      return false;
    }
    claimedItemRef.current = id;
    return true;
  }, [reportFailure]);

  const releaseItem = useCallback(async (id) => {
    const target = id ?? claimedItemRef.current;
    if (!target) return;
    claimedItemRef.current = null;
    await api.grocery.releaseItem(target);
    refresh();
  }, [refresh]);

  // Leaving the screen must not leave an item claimed behind you.
  useEffect(() => () => {
    if (claimedItemRef.current) {
      api.grocery.releaseItem(claimedItemRef.current).catch(() => {});
    }
  }, []);

  // ─── Trip completion ──────────────────────────────────────────────────────

  const completeTrip = useCallback(async ({ storeName, totalIls }) => {
    const result = await api.grocery.completeTrip({ storeName, totalIls });
    if (!result.success) { reportFailure(result); return null; }
    refresh();
    return result.data;
  }, [reportFailure, refresh]);

  /**
   * Open a different one of this user's lists.
   *
   * The cached state is dropped rather than invalidated: it describes the list
   * being left, and keeping it would show the wrong items for one render and
   * make the next poll ask a version question about the wrong list.
   */
  const switchList = useCallback(async (listId) => {
    if (!listId || String(listId) === String(activeListRef.current)) return true;

    const result = await api.grocery.openList(listId);
    if (!result.success) { reportFailure(result); return false; }

    activeListRef.current = String(listId);
    api.grocery.setActiveList(listId);

    queryClient.removeQueries({ queryKey: QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ['grocery', 'lists', userId] });
    queryClient.invalidateQueries({ queryKey: ['grocery', 'history', userId] });
    return true;
  }, [queryClient, QUERY_KEY, reportFailure, userId]);

  return {
    // Data
    state,
    list: state?.list ?? null,
    members: state?.members ?? [],
    pendingInvitations: state?.pendingInvitations ?? [],
    trip: state?.trip ?? null,
    items: state?.items ?? [],
    sections,
    purchased,
    pendingCount,
    purchasedCount,
    progress,
    role: state?.list?.role ?? 'member',

    // Status
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    refresh,

    // Actions
    addItem,
    updateItem,
    togglePurchased,
    deleteItem,
    claimItem,
    releaseItem,
    completeTrip,
    switchList,
  };
}
