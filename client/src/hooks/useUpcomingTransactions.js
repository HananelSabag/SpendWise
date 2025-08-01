/**
 * 📅 UPCOMING TRANSACTIONS HOOK
 * Manages upcoming transactions with smart 3-month generation system
 * @version 1.0.0 - UPCOMING TRANSACTIONS SYSTEM
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { useNotifications } from '../stores';

export const useUpcomingTransactions = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  // ✅ FETCH UPCOMING TRANSACTIONS
  const {
    data: upcomingTransactions = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['upcomingTransactions'],
    queryFn: async () => {
      const response = await api.transactions.getUpcomingTransactions();
      if (response.success) {
        return response.data.data || [];
      }
      throw new Error(response.error?.message || 'Failed to fetch upcoming transactions');
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false
  });

  // ✅ DELETE UPCOMING TRANSACTION
  const deleteUpcomingMutation = useMutation({
    mutationFn: async (transactionId) => {
      const response = await api.transactions.deleteUpcomingTransaction(transactionId);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to delete upcoming transaction');
      }
      return response.data;
    },
    onSuccess: (data, transactionId) => {
      // Update cache immediately
      queryClient.setQueryData(['upcomingTransactions'], (old = []) =>
        old.filter(transaction => transaction.id !== transactionId)
      );
      
      addNotification({
        type: 'success',
        title: 'Upcoming Transaction Deleted',
        message: 'The upcoming transaction has been removed successfully.'
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries(['transactions']);
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: error.message || 'Failed to delete upcoming transaction'
      });
    }
  });

  // ✅ STOP TEMPLATE GENERATION
  const stopGenerationMutation = useMutation({
    mutationFn: async (templateId) => {
      const response = await api.transactions.stopTemplateGeneration(templateId);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to stop template generation');
      }
      return response.data;
    },
    onSuccess: (data) => {
      // Refetch upcoming transactions to reflect changes
      queryClient.invalidateQueries(['upcomingTransactions']);
      queryClient.invalidateQueries(['recurringTemplates']);
      
      addNotification({
        type: 'success',
        title: 'Template Generation Stopped',
        message: `Stopped generating upcoming transactions. ${data.deletedUpcomingCount || 0} upcoming transactions removed.`
      });
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Stop Generation Failed',
        message: error.message || 'Failed to stop template generation'
      });
    }
  });

  // ✅ COMPUTED VALUES
  const summary = {
    total: upcomingTransactions.length,
    totalIncome: upcomingTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
    totalExpenses: upcomingTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
    byTemplate: upcomingTransactions.reduce((acc, transaction) => {
      const templateName = transaction.template_name || 'Unknown Template';
      if (!acc[templateName]) {
        acc[templateName] = {
          name: templateName,
          templateId: transaction.template_id,
          count: 0,
          transactions: []
        };
      }
      acc[templateName].count++;
      acc[templateName].transactions.push(transaction);
      return acc;
    }, {}),
    nearestDue: upcomingTransactions
      .sort((a, b) => new Date(a.date) - new Date(b.date))[0] || null,
    // Check if buffer is getting low (less than 30 days ahead)
    needsRegeneration: upcomingTransactions.length > 0 
      ? new Date(Math.max(...upcomingTransactions.map(t => new Date(t.date)))) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      : false
  };

  // ✅ ACTION FUNCTIONS
  const deleteUpcoming = useCallback((transactionId) => {
    return deleteUpcomingMutation.mutateAsync(transactionId);
  }, [deleteUpcomingMutation]);

  const stopGeneration = useCallback((templateId) => {
    return stopGenerationMutation.mutateAsync(templateId);
  }, [stopGenerationMutation]);

  return {
    // Data
    upcomingTransactions,
    summary,
    
    // Loading states
    isLoading,
    isDeleting: deleteUpcomingMutation.isPending,
    isStopping: stopGenerationMutation.isPending,
    
    // Error states
    error,
    deleteError: deleteUpcomingMutation.error,
    stopError: stopGenerationMutation.error,
    
    // Actions
    refetch,
    deleteUpcoming,
    stopGeneration
  };
};

export default useUpcomingTransactions;