import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import useAuthStore from '../stores/authStore';

export function useShoppingShare() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  const MEMBERS_KEY = ['shopping-members', userId];
  const INVITES_KEY = ['shopping-invitations', userId];
  const ITEMS_KEY   = ['shopping-items', userId];

  const membersQuery = useQuery({
    queryKey: MEMBERS_KEY,
    enabled: !!userId,
    queryFn: async () => {
      const r = await api.shopping.getMembers();
      if (!r.success) throw new Error('Failed to fetch members');
      return r.data; // { myMembers, sharedWithMe, pendingSent }
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const invitationsQuery = useQuery({
    queryKey: INVITES_KEY,
    enabled: !!userId,
    queryFn: async () => {
      const r = await api.shopping.getInvitations();
      if (!r.success) throw new Error('Failed to fetch invitations');
      return r.data; // array of pending received invitations
    },
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: MEMBERS_KEY });
    queryClient.invalidateQueries({ queryKey: INVITES_KEY });
    queryClient.invalidateQueries({ queryKey: ITEMS_KEY });
  };

  const inviteMutation = useMutation({
    mutationFn: (email) => api.shopping.invite(email),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MEMBERS_KEY }),
  });

  const respondMutation = useMutation({
    mutationFn: ({ token, action }) => api.shopping.respondToInvitation(token, action),
    onSuccess: invalidateAll,
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId) => api.shopping.removeMember(userId),
    onSuccess: invalidateAll,
  });

  const cancelInviteMutation = useMutation({
    mutationFn: (email) => api.shopping.cancelInvitation(email),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MEMBERS_KEY }),
  });

  return {
    // Members data
    myMembers:    membersQuery.data?.myMembers    ?? [],
    sharedWithMe: membersQuery.data?.sharedWithMe ?? [],
    pendingSent:  membersQuery.data?.pendingSent  ?? [],
    isMembersLoading: membersQuery.isLoading,

    // Received pending invitations
    pendingInvitations: invitationsQuery.data ?? [],
    pendingInvitationsCount: (invitationsQuery.data ?? []).length,

    // Actions
    invite:         (email)         => inviteMutation.mutateAsync(email),
    respond:        (token, action) => respondMutation.mutateAsync({ token, action }),
    removeMember:   (userId)        => removeMemberMutation.mutateAsync(userId),
    cancelInvite:   (email)         => cancelInviteMutation.mutateAsync(email),

    isInviting:  inviteMutation.isPending,
    isResponding: respondMutation.isPending,
  };
}
