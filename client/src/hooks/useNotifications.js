import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import useAuthStore from '../stores/authStore';

export function useNotifications() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  const QUERY_KEY = ['notifications', userId];

  const query = useQuery({
    queryKey: QUERY_KEY,
    enabled: !!userId,
    queryFn: async () => {
      const r = await api.notifications.getAll();
      if (!r.success) throw new Error('Failed to fetch notifications');
      return r.data; // { notifications, unreadCount }
    },
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.notifications.markAllRead(),
    onSuccess: () => {
      queryClient.setQueryData(QUERY_KEY, (old) =>
        old ? {
          ...old,
          unreadCount: 0,
          notifications: old.notifications.map((n) => ({ ...n, is_read: true })),
        } : old
      );
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => api.notifications.markRead(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData(QUERY_KEY, (old) => {
        if (!old) return old;
        const updated = old.notifications.map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        );
        const unreadCount = updated.filter((n) => !n.is_read).length;
        return { notifications: updated, unreadCount };
      });
    },
  });

  return {
    notifications: query.data?.notifications ?? [],
    unreadCount: query.data?.unreadCount ?? 0,
    isLoading: query.isLoading,
    refetch: query.refetch,
    markAllRead: () => markAllReadMutation.mutate(),
    markRead: (id) => markReadMutation.mutate(id),
  };
}
