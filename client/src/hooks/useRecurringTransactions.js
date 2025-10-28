/**
 * 🔄 useRecurringTransactions Hook - Complete Recurring Management
 * Handles fetching, creating, updating, and deleting recurring transactions
 * Features: Real-time data, Cache management, Optimistic updates
 * @version 1.0.0 - RECURRING TRANSACTIONS HOOK
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { api } from '../api';
import { useAuth } from '../stores';
import { useNotifications } from '../stores';

/**
 * 🔄 Main useRecurringTransactions Hook
 */
export const useRecurringTransactions = (options = {}) => {
  const { user, isAuthenticated } = useAuth();
  const { addNotification } = useNotifications();
  const queryClient = useQueryClient();
  
  const {
    enabled = true,
    refetchInterval = 30 * 60 * 1000, // 30 minutes - recurring templates rarely change
    staleTime = 60 * 60 * 1000, // 1 hour
  } = options;

  // ✅ Fetch recurring transactions
  const {
    data: recurringTransactions,
    loading,
    error,
    refetch,
    isLoading
  } = useQuery({
    queryKey: ['recurringTransactions', user?.id],
    queryFn: async () => {
      if (!isAuthenticated) {
        throw new Error('Not authenticated');
      }

      try {
        const response = await api.transactions.getRecurringTemplates();
        
        // Handle different API response structures
        if (response.data?.success && response.data?.data) {
          return response.data.data;
        } else if (response.data && Array.isArray(response.data)) {
          return response.data;
        } else if (response.success && response.data) {
          return response.data;
        } else if (Array.isArray(response)) {
          return response;
        }
        
        return [];
      } catch (error) {
        throw error;
      }
    },
    enabled: enabled && isAuthenticated && !!user?.id,
    refetchInterval,
    staleTime,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // ✅ Create recurring transaction mutation
  const createRecurringMutation = useMutation({
    mutationFn: async (recurringData) => {
      const response = await api.transactions.createRecurringTemplate(recurringData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['recurringTransactions']);
      queryClient.invalidateQueries(['upcomingTransactions']);
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['dashboard']);
      addNotification({
        type: 'success',
        message: 'Recurring transaction created successfully'
      });
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        message: error.message || 'Failed to create recurring transaction'
      });
    }
  });

  // ✅ Update recurring transaction mutation
  const updateRecurringMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      const response = await api.transactions.updateRecurringTemplate(id, updates);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['recurringTransactions']);
      queryClient.invalidateQueries(['upcomingTransactions']);
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['dashboard']);
      addNotification({
        type: 'success',
        message: 'Recurring transaction updated successfully'
      });
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        message: error.message || 'Failed to update recurring transaction'
      });
    }
  });

  // ✅ Delete recurring transaction mutation - ENHANCED WITH SMART DELETE
  const deleteRecurringMutation = useMutation({
    mutationFn: async ({ id, options = {} }) => {
      const response = await api.transactions.deleteRecurringTemplate(id, options);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['recurringTransactions']);
      queryClient.invalidateQueries(['upcomingTransactions']);
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['dashboard']);
      addNotification({
        type: 'success',
        message: 'Recurring transaction deleted successfully'
      });
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        message: error.message || 'Failed to delete recurring transaction'
      });
    }
  });

  // ✅ Helper functions
  const createRecurring = useCallback(async (data) => {
    return createRecurringMutation.mutateAsync(data);
  }, [createRecurringMutation]);

  const updateRecurring = useCallback(async (id, updates) => {
    return updateRecurringMutation.mutateAsync({ id, updates });
  }, [updateRecurringMutation]);

  const deleteRecurring = useCallback(async (id, options = {}) => {
    return deleteRecurringMutation.mutateAsync({ id, options });
  }, [deleteRecurringMutation]);

  const refreshRecurring = useCallback(() => {
    return refetch();
  }, [refetch]);

  // ✅ Statistics - FIXED: Ensure recurringTransactions is always an array before filtering
  const safeRecurringTransactions = Array.isArray(recurringTransactions) ? recurringTransactions : [];
  const stats = {
    total: safeRecurringTransactions.length || 0,
    active: safeRecurringTransactions.filter(r => r.status === 'active')?.length || 0,
    paused: safeRecurringTransactions.filter(r => r.status === 'paused')?.length || 0,
    income: safeRecurringTransactions.filter(r => r.type === 'income')?.length || 0,
    expense: safeRecurringTransactions.filter(r => r.type === 'expense')?.length || 0,
  };

  return {
    // Data
    recurringTransactions: recurringTransactions || [],
    stats,
    
    // State
    loading: isLoading,
    error,
    
    // Actions
    createRecurring,
    updateRecurring,
    deleteRecurring,
    refetch: refreshRecurring,
    
    // Mutation states
    isCreating: createRecurringMutation.isPending,
    isUpdating: updateRecurringMutation.isPending,
    isDeleting: deleteRecurringMutation.isPending,
  };
};

export default useRecurringTransactions;