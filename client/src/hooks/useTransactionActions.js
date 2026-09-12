/**
 * Single owner of transaction writes: API result → one cache refresh → one toast.
 * Action dialogs never mount a hidden transaction-list query.
 */
import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import transactionAPI from '../api/transactions';
import { apiResultError } from '../api/errors';
import { invalidateFinancialQueries } from './useFinancialDataSync';
import { useToast } from './useToast';

export const useTransactionActions = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const refresh = () => invalidateFinancialQueries(queryClient);
  const unwrap = (response) => {
    if (!response?.success) throw apiResultError(response);
    return response.data;
  };

  const create = useMutation({
    mutationFn: async (data) => unwrap(await transactionAPI.create(data.type || 'expense', data)),
    onSuccess: async () => { await refresh(); toast.success('transactions.createSuccess'); },
    onError: () => toast.error('transactions.createFailed'),
  });
  const update = useMutation({
    mutationFn: async ({ id, data }) => unwrap(await transactionAPI.update(data.type || 'expense', id, data)),
    onSuccess: async () => { await refresh(); toast.success('transactions.updateSuccess'); },
    onError: () => toast.error('transactions.updateFailed'),
  });
  const remove = useMutation({
    mutationFn: async ({ id, transaction }) => {
      const type = transaction?.type || (Number(transaction?.amount) > 0 ? 'income' : 'expense');
      return unwrap(await transactionAPI.delete(type, id));
    },
    onSuccess: async () => { await refresh(); toast.success('transactions.deleteSuccess'); },
    onError: () => toast.error('transactions.deleteFailed'),
  });
  const bulkRemove = useMutation({
    mutationFn: async (ids) => {
      const response = await transactionAPI.freshBulkDelete(ids);
      unwrap(response);
      return response;
    },
    onSuccess: async (response, ids) => {
      await refresh();
      const count = response.data?.deleted_count ?? response.data?.summary?.successful ?? ids.length;
      toast.success('transactions.bulkDeleteSuccess', { params: { count } });
    },
    onError: () => toast.error('transactions.deleteFailed'),
  });

  const createTransaction = useCallback((data) => create.mutateAsync(data), [create.mutateAsync]);
  const updateTransaction = useCallback((id, data) => update.mutateAsync({ id, data }), [update.mutateAsync]);
  const deleteTransaction = useCallback((id, options = {}) =>
    remove.mutateAsync({ id, transaction: options.transaction }), [remove.mutateAsync]);

  return {
    createTransaction,
    updateTransaction,
    deleteTransaction,
    freshBulkDelete: bulkRemove.mutateAsync,
    isCreating: create.isPending,
    isUpdating: update.isPending,
    isDeleting: remove.isPending || bulkRemove.isPending,
    isOperating: create.isPending || update.isPending || remove.isPending || bulkRemove.isPending,
  };
};
