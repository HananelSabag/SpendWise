/**
 * useGrocerySharing — invitations and membership for the shared grocery list.
 *
 * Membership itself is already part of the list state (`useGroceryList`), so
 * this hook owns only the things that change it, plus the invitations addressed
 * to *me* — which are polled separately because they must be visible from
 * anywhere in the app, not just the grocery screen.
 */

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import useAuthStore from '../stores/authStore';
import { useToast } from './useToast';
import { useTranslation } from '../stores';

export function useMyGroceryInvitations() {
  const userId = useAuthStore((s) => s.user?.id);

  const query = useQuery({
    queryKey: ['grocery', 'my-invitations', userId],
    enabled: !!userId,
    queryFn: async () => {
      const result = await api.grocery.getMyInvitations();
      if (!result.success) throw new Error(result.error?.code || 'GROCERY_INVITES_FAILED');
      return result.data;
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  return {
    invitations: query.data ?? [],
    count: (query.data ?? []).length,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

/**
 * The lists this user can open.
 *
 * Usually one. A second appears when someone shares theirs — which used to be
 * refused outright, so this is the hook that turns that refusal into a choice.
 * Read-only: switching lives in `useGroceryList.switchList`, next to the state
 * cache it has to clear.
 */
export function useGroceryLists() {
  const userId = useAuthStore((s) => s.user?.id);

  const query = useQuery({
    queryKey: ['grocery', 'lists', userId],
    enabled: !!userId,
    queryFn: async () => {
      const result = await api.grocery.getLists();
      if (!result.success) throw new Error(result.error?.code || 'GROCERY_LISTS_FAILED');
      return result.data;
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  const lists = query.data ?? [];

  return {
    lists,
    // One list is the normal case and needs no switcher at all.
    hasMultiple: lists.length > 1,
    isLoading: query.isLoading,
  };
}

export function useGrocerySharing() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const userId = useAuthStore((s) => s.user?.id);
  const { t } = useTranslation('grocery');

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['grocery', 'state', userId] });
    queryClient.invalidateQueries({ queryKey: ['grocery', 'my-invitations', userId] });
    // Accepting, leaving and disbanding all change WHICH lists exist for this
    // user, not just what is on one of them.
    queryClient.invalidateQueries({ queryKey: ['grocery', 'lists', userId] });
    queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
  }, [queryClient, userId]);

  const reportFailure = useCallback((result) => {
    const code = result.error?.code;
    toast.error(t(`errors.${code}`, { fallback: t('errors.generic') }));
    return null;
  }, [toast, t]);

  const inviteMutation = useMutation({
    mutationFn: async (email) => {
      const result = await api.grocery.invite(email);
      if (!result.success) throw result;
      return result.data;
    },
    onSuccess: invalidate,
  });

  /**
   * Anything that changes WHICH list you are on has to stop the client naming
   * the old one. The server already moved you; the cached state and the header
   * the API layer sends would otherwise keep pointing at the list you left.
   */
  const forgetCurrentList = useCallback(() => {
    api.grocery.setActiveList(null);
    queryClient.removeQueries({ queryKey: ['grocery', 'state', userId] });
    queryClient.removeQueries({ queryKey: ['grocery', 'history', userId] });
  }, [queryClient, userId]);

  const respondMutation = useMutation({
    mutationFn: async ({ token, action }) => {
      const result = action === 'accept'
        ? await api.grocery.acceptInvitation(token)
        : await api.grocery.declineInvitation(token);
      if (!result.success) throw result;
      return result.data;
    },
    onSuccess: (_data, variables) => {
      // Accepting lands you on the list you just joined.
      if (variables?.action === 'accept') forgetCurrentList();
      invalidate();
    },
  });

  // These four differ only in the call they make, but each still needs its own
  // useMutation at the top level — no loops, no helper that hides the hook call.
  const cancelInviteMutation = useMutation({
    mutationFn: async (email) => {
      const result = await api.grocery.cancelInvite(email);
      if (!result.success) throw result;
      return result.data;
    },
    onSuccess: invalidate,
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId) => {
      const result = await api.grocery.removeMember(memberId);
      if (!result.success) throw result;
      return result.data;
    },
    onSuccess: invalidate,
  });

  const leaveMutation = useMutation({
    mutationFn: async () => {
      const result = await api.grocery.leave();
      if (!result.success) throw result;
      return result.data;
    },
    onSuccess: () => { forgetCurrentList(); invalidate(); },
  });

  const disbandMutation = useMutation({
    mutationFn: async () => {
      const result = await api.grocery.disband();
      if (!result.success) throw result;
      return result.data;
    },
    onSuccess: invalidate,
  });

  const run = useCallback(async (mutation, arg) => {
    try {
      return await mutation.mutateAsync(arg);
    } catch (thrown) {
      return reportFailure(thrown?.error ? thrown : { error: {} });
    }
  }, [reportFailure]);

  return {
    invite: (email) => run(inviteMutation, email),
    respond: (token, action) => run(respondMutation, { token, action }),
    cancelInvite: (email) => run(cancelInviteMutation, email),
    removeMember: (memberId) => run(removeMemberMutation, memberId),
    leaveList: () => run(leaveMutation),
    disband: () => run(disbandMutation),

    isInviting: inviteMutation.isPending,
    isResponding: respondMutation.isPending,
    isDisbanding: disbandMutation.isPending,
  };
}
