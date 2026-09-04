/**
 * useGroceryList — the shared grocery list's live state, edit lease and mutations.
 *
 * Live collaboration model
 * ------------------------
 * The server keeps a monotonic `version` on the list and bumps it on every
 * change, including someone taking or dropping the edit lease. This hook polls
 * `/grocery/state?version=<known>`; when nothing moved the server answers with a
 * tiny `{ unchanged: true }` body and we keep the exact same object, so a
 * few-second interval costs almost nothing and never re-renders the list.
 * Polling pauses when the tab is in the background.
 *
 * Editing model
 * -------------
 * Only one participant may write at a time. Rather than making that a mode the
 * user has to enter, the first mutation implicitly takes a free lease and the
 * server hands the token back in a response header. A heartbeat keeps it alive
 * while you are actually doing things, and it is released after a short idle
 * period so the other person isn't locked out of a list nobody is touching.
 * Everything is enforced server-side — the disabled buttons here are courtesy,
 * not security.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import useAuthStore from '../stores/authStore';
import { useToast } from './useToast';
import { useTranslation } from '../stores';
import { categoryOrder } from '../components/features/grocery/groceryCategories';

// While someone holds the edit lease their changes are landing right now, so
// poll tightly; otherwise back off. The app-wide rate limiter is 100 req/min
// across every endpoint, and a fixed 4s poll would spend a fifth of it idling.
const POLL_ACTIVE_MS = 4000;
const POLL_IDLE_MS = 9000;
const HEARTBEAT_MS = 20000;
/** Hand the lease back after this long without a change, so nobody waits on an idle tab. */
const IDLE_RELEASE_MS = 45000;

const leaseStorageKey = (listId) => `sw_grocery_lease_${listId}`;

const readStoredLease = (listId) => {
  try { return sessionStorage.getItem(leaseStorageKey(listId)); } catch { return null; }
};
const writeStoredLease = (listId, token) => {
  try {
    if (token) sessionStorage.setItem(leaseStorageKey(listId), token);
    else sessionStorage.removeItem(leaseStorageKey(listId));
  } catch { /* private mode — the lease simply won't survive a refresh */ }
};

export function useGroceryList() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const userId = useAuthStore((s) => s.user?.id);
  const { t } = useTranslation('grocery');

  const QUERY_KEY = useMemo(() => ['grocery', 'state', userId], [userId]);

  const [leaseToken, setLeaseToken] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [lockConflict, setLockConflict] = useState(null);
  const lastActivityRef = useRef(0);
  const editModeRef = useRef(false);
  const leaseRef = useRef(null);

  useEffect(() => { editModeRef.current = isEditMode; }, [isEditMode]);
  useEffect(() => { leaseRef.current = leaseToken; }, [leaseToken]);

  // ─── State query + polling ────────────────────────────────────────────────

  const query = useQuery({
    queryKey: QUERY_KEY,
    enabled: !!userId,
    queryFn: async () => {
      const previous = queryClient.getQueryData(QUERY_KEY);
      const known = previous?.list?.version;

      const result = await api.grocery.getState(known);
      if (!result.success) throw new Error(result.error?.code || 'GROCERY_STATE_FAILED');

      // Same version — hand back the identical object so nothing re-renders.
      if (result.data?.unchanged && previous) return previous;
      return result.data;
    },
    refetchInterval: (query) => (query.state.data?.lock?.isLocked ? POLL_ACTIVE_MS : POLL_IDLE_MS),
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });

  const state = query.data;
  const listId = state?.list?.id ?? null;

  // Adopt a lease stored by an earlier render of this tab (e.g. after a refresh).
  useEffect(() => {
    if (!listId) return;
    const stored = readStoredLease(listId);
    if (stored && !leaseRef.current) setLeaseToken(stored);
  }, [listId]);

  const rememberLease = useCallback((token) => {
    if (!token) return;
    setLeaseToken(token);
    lastActivityRef.current = Date.now();
    if (listId) writeStoredLease(listId, token);
  }, [listId]);

  const forgetLease = useCallback(() => {
    setLeaseToken(null);
    setIsEditMode(false);
    if (listId) writeStoredLease(listId, null);
  }, [listId]);

  // ─── Derived view state ───────────────────────────────────────────────────

  const lock = state?.lock;
  const lockedByOther = !!lock?.isLocked && lock.lockedBy?.userId !== userId;
  const canEdit = !lockedByOther;

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

  /**
   * Shared failure path. A 409 from the lease means someone else took over: drop
   * the optimistic change, surface who, and resync — never silently retry.
   */
  const handleFailure = useCallback((result, rollback) => {
    rollback?.();

    const code = result.error?.code;
    if (code === 'GROCERY_LOCKED' || code === 'GROCERY_LEASE_LOST') {
      forgetLease();
      setLockConflict({
        lockedBy: result.error?.lockedBy || null,
        expiresAt: result.error?.expiresAt || null,
      });
      const name = result.error?.lockedBy?.firstName
        || result.error?.lockedBy?.username
        || t('lock.someone');
      toast.error(t('lock.takenBy', { name }));
      refresh();
      return;
    }

    toast.error(t(`errors.${code}`, { fallback: t('errors.generic') }));
    refresh();
  }, [forgetLease, refresh, t, toast]);

  const runMutation = useCallback(async (fn, rollback) => {
    const result = await fn(leaseRef.current);
    if (!result.success) {
      handleFailure(result, rollback);
      return null;
    }
    if (result.leaseToken) rememberLease(result.leaseToken);
    lastActivityRef.current = Date.now();
    return result.data;
  }, [handleFailure, rememberLease]);

  // ─── Item actions ─────────────────────────────────────────────────────────

  const addItem = useCallback(async (payload) => {
    const data = await runMutation((token) => api.grocery.addItem(payload, token));
    if (data?.item) {
      patchCache((old) => ({
        ...old,
        list: { ...old.list, version: data.version ?? old.list.version },
        items: [...old.items, data.item],
      }));
    }
    return data?.item ?? null;
  }, [runMutation, patchCache]);

  const updateItem = useCallback(async (id, payload) => {
    const data = await runMutation((token) => api.grocery.updateItem(id, payload, token));
    if (data?.item) {
      patchCache((old) => ({
        ...old,
        list: { ...old.list, version: data.version ?? old.list.version },
        items: old.items.map((item) => (item.id === id ? data.item : item)),
      }));
    }
    return data?.item ?? null;
  }, [runMutation, patchCache]);

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

    const rollback = () => queryClient.setQueryData(QUERY_KEY, snapshot);
    const data = await runMutation(
      (token) => api.grocery.setPurchased(item.id, next, token),
      rollback
    );

    if (data?.item) {
      patchCache((old) => ({
        ...old,
        list: { ...old.list, version: data.version ?? old.list.version },
        items: old.items.map((current) => (current.id === item.id ? data.item : current)),
      }));
    }
  }, [queryClient, QUERY_KEY, patchCache, runMutation, userId]);

  const deleteItem = useCallback(async (id) => {
    const snapshot = queryClient.getQueryData(QUERY_KEY);
    patchCache((old) => ({ ...old, items: old.items.filter((item) => item.id !== id) }));

    const rollback = () => queryClient.setQueryData(QUERY_KEY, snapshot);
    await runMutation((token) => api.grocery.deleteItem(id, token), rollback);
  }, [queryClient, QUERY_KEY, patchCache, runMutation]);

  // ─── Explicit lease control ───────────────────────────────────────────────

  /** "Take over" / "Start shopping" — asks for the lease and stays in edit mode. */
  const requestControl = useCallback(async () => {
    const result = await api.grocery.acquireLock();
    if (!result.success) {
      setLockConflict({
        lockedBy: result.error?.lockedBy || null,
        expiresAt: result.error?.expiresAt || null,
      });
      const name = result.error?.lockedBy?.firstName
        || result.error?.lockedBy?.username
        || t('lock.someone');
      toast.error(t('lock.takenBy', { name }));
      refresh();
      return false;
    }

    rememberLease(result.data.token);
    setIsEditMode(true);
    setLockConflict(null);
    refresh();
    return true;
  }, [rememberLease, refresh, t, toast]);

  const releaseControl = useCallback(async () => {
    const token = leaseRef.current;
    forgetLease();
    if (token) await api.grocery.releaseLock(token);
    refresh();
  }, [forgetLease, refresh]);

  // Heartbeat while we hold the lease; hand it back once we go quiet.
  useEffect(() => {
    if (!leaseToken) return undefined;

    const tick = async () => {
      const idleFor = Date.now() - lastActivityRef.current;
      if (!editModeRef.current && idleFor > IDLE_RELEASE_MS) {
        const token = leaseRef.current;
        forgetLease();
        if (token) await api.grocery.releaseLock(token);
        refresh();
        return;
      }

      const result = await api.grocery.heartbeatLock(leaseRef.current);
      if (!result.success) forgetLease();
    };

    const timer = setInterval(tick, HEARTBEAT_MS);
    return () => clearInterval(timer);
  }, [leaseToken, forgetLease, refresh]);

  // Leaving the screen should not hold the list hostage for the full lease TTL.
  useEffect(() => () => {
    const token = leaseRef.current;
    if (token) api.grocery.releaseLock(token).catch(() => {});
  }, []);

  // ─── Trip completion ──────────────────────────────────────────────────────

  const completeTrip = useCallback(async ({ storeName, totalIls }) => {
    const result = await api.grocery.completeTrip({ storeName, totalIls }, leaseRef.current);
    if (!result.success) {
      handleFailure(result);
      return null;
    }
    if (result.leaseToken) rememberLease(result.leaseToken);
    refresh();
    return result.data;
  }, [handleFailure, rememberLease, refresh]);

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

    // Lock
    lock,
    lockedByOther,
    canEdit,
    isEditMode,
    lockConflict,
    dismissLockConflict: () => setLockConflict(null),
    holdsLease: !!leaseToken,
    requestControl,
    releaseControl,

    // Actions
    addItem,
    updateItem,
    togglePurchased,
    deleteItem,
    completeTrip,
  };
}
