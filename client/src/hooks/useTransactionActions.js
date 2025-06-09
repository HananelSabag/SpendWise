// client/src/hooks/useTransactionActions.js - SIMPLE FIX
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTransactions } from './useTransactions';
import toast from 'react-hot-toast';

export const useTransactionActions = () => {
  const queryClient = useQueryClient();
  
  // ✅ FIX: Don't create our own useTransactions instance
  // Just use the mutations from any instance
  const {
    createTransaction: baseCreateTransaction,
    updateTransaction: baseUpdateTransaction,
    deleteTransaction: baseDeleteTransaction,
    isCreating,
    isUpdating,
    isDeleting
  } = useTransactions({ limit: 50 }); // ✅ Match TransactionList default

  const createTransaction = useCallback(async (type, data) => {
    try {
      const result = await baseCreateTransaction(type, data);
      
      // ✅ SIMPLE: Just clear ALL transaction cache
      setTimeout(() => {
        queryClient.removeQueries({ 
          predicate: (query) => query.queryKey[0] === 'transactions' 
        });
        queryClient.removeQueries({ 
          predicate: (query) => query.queryKey[0] === 'dashboard' 
        });
        // Force immediate refetch
        queryClient.refetchQueries({ 
          predicate: (query) => (query.queryKey[0] === 'transactions' || query.queryKey[0] === 'dashboard') && query.getObserversCount() > 0 
        });
      }, 100);
      
      return result;
    } catch (error) {
      throw error;
    }
  }, [baseCreateTransaction, queryClient]);

  // Same for update and delete...
  const updateTransaction = useCallback(async (type, id, data) => {
    const result = await baseUpdateTransaction(type, id, data);
    setTimeout(() => {
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] === 'transactions' });
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] === 'dashboard' });
      queryClient.refetchQueries({ predicate: (query) => (query.queryKey[0] === 'transactions' || query.queryKey[0] === 'dashboard') && query.getObserversCount() > 0 });
    }, 100);
    return result;
  }, [baseUpdateTransaction, queryClient]);

  const deleteTransaction = useCallback(async (id, deleteAll = false) => {
    const result = await baseDeleteTransaction(id, deleteAll);
    setTimeout(() => {
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] === 'transactions' });
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] === 'dashboard' });
      queryClient.refetchQueries({ predicate: (query) => (query.queryKey[0] === 'transactions' || query.queryKey[0] === 'dashboard') && query.getObserversCount() > 0 });
    }, 100);
    return result;
  }, [baseDeleteTransaction, queryClient]);

  return {
    createTransaction,
    updateTransaction, 
    deleteTransaction,
    isCreating,
    isUpdating,
    isDeleting
  };
};

export default useTransactionActions;