/**
 * useShoppingItems — TanStack Query hook for the shopping wishlist
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import useAuthStore from '../stores/authStore';
import { useToast } from './useToast';

export function useShoppingItems() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const userId = useAuthStore((s) => s.user?.id);

  // Must match the ITEMS_KEY used in useShoppingShare so cache
  // invalidation after accept/decline/remove propagates to this query.
  const QUERY_KEY = ['shopping-items', userId];

  const query = useQuery({
    queryKey: QUERY_KEY,
    enabled: !!userId,
    queryFn: async () => {
      const result = await api.shopping.getAll();
      if (!result.success) throw new Error(result.error?.message || 'Failed to fetch shopping list');
      return result.data; // { items, total }
    },
    staleTime: 0,              // always stale — fetch fresh from DB every mount
    gcTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const result = await api.shopping.create(data);
      if (!result.success) throw new Error(result.error?.message || 'שגיאה בהוספת פריט');
      return result.data;
    },
    onSuccess: () => { invalidate(); toast.success('הפריט נוסף לרשימה'); },
    onError: (err) => toast.error(err.message || 'שגיאה בהוספת פריט'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const result = await api.shopping.update(id, data);
      if (!result.success) throw new Error(result.error?.message || 'שגיאה בעדכון פריט');
      return result.data;
    },
    onSuccess: () => { invalidate(); toast.success('הפריט עודכן'); },
    onError: (err) => toast.error(err.message || 'שגיאה בעדכון פריט'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const result = await api.shopping.remove(id);
      if (!result.success) throw new Error(result.error?.message || 'שגיאה במחיקת פריט');
      return result;
    },
    onSuccess: () => { invalidate(); toast.success('הפריט נמחק'); },
    onError: (err) => toast.error(err.message || 'שגיאה במחיקת פריט'),
  });

  // Optimistic toggle — flips locally, syncs in background, rolls back on error
  const toggleBought = (item) => {
    const optimisticData = { is_bought: !item.is_bought };
    queryClient.setQueryData(QUERY_KEY, (old) => {
      if (!old) return old;
      return {
        ...old,
        items: old.items.map((i) => i.id === item.id ? { ...i, ...optimisticData } : i),
      };
    });
    return updateMutation.mutateAsync({ id: item.id, data: optimisticData }).catch(() => {
      // Roll back on error
      queryClient.setQueryData(QUERY_KEY, (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((i) => i.id === item.id ? { ...i, is_bought: item.is_bought } : i),
        };
      });
    });
  };

  return {
    items: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    createItem: (data) => createMutation.mutateAsync(data),
    updateItem: (id, data) => updateMutation.mutateAsync({ id, data }),
    deleteItem: (id) => deleteMutation.mutateAsync(id),
    toggleBought,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
