/**
 * useShoppingItems — TanStack Query hook for the shopping wishlist
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { useToast } from './useToast';

const QUERY_KEY = ['shopping-items'];

export function useShoppingItems() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const result = await api.shopping.getAll();
      if (!result.success) throw new Error(result.error?.message || 'Failed to fetch shopping list');
      return result.data; // { items, total }
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  const createMutation = useMutation({
    mutationFn: (data) => api.shopping.create(data),
    onSuccess: (result) => {
      if (!result.success) { toast.error(result.error?.message || 'שגיאה בהוספת פריט'); return; }
      invalidate();
      toast.success('הפריט נוסף לרשימה');
    },
    onError: () => toast.error('שגיאה בהוספת פריט'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.shopping.update(id, data),
    onSuccess: (result) => {
      if (!result.success) { toast.error(result.error?.message || 'שגיאה בעדכון פריט'); return; }
      invalidate();
      toast.success('הפריט עודכן');
    },
    onError: () => toast.error('שגיאה בעדכון פריט'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.shopping.remove(id),
    onSuccess: (result) => {
      if (!result.success) { toast.error(result.error?.message || 'שגיאה במחיקת פריט'); return; }
      invalidate();
      toast.success('הפריט נמחק');
    },
    onError: () => toast.error('שגיאה במחיקת פריט'),
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
