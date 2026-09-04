/**
 * useGroceryHistory — completed shopping trips.
 *
 * History is read-only by construction: the server never lets a completed trip's
 * items change, so this hook only reads, plus the two actions that attach
 * something to a finished trip (a receipt, or a SpendWise expense).
 */

import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import useAuthStore from '../stores/authStore';
import { useToast } from './useToast';
import { useTranslation } from '../stores';
import { invalidateFinancialQueries, emitFinancialDataUpdated } from './useFinancialDataSync';

export function useGroceryHistory({ enabled = true, limit = 20 } = {}) {
  const userId = useAuthStore((s) => s.user?.id);

  const query = useQuery({
    queryKey: ['grocery', 'history', userId, limit],
    enabled: enabled && !!userId,
    queryFn: async () => {
      const result = await api.grocery.getHistory({ limit });
      if (!result.success) throw new Error(result.error?.code || 'GROCERY_HISTORY_FAILED');
      return result.data;
    },
    staleTime: 60 * 1000,
    retry: 1,
  });

  return {
    trips: query.data?.trips ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useGroceryTripDetail(tripId) {
  const query = useQuery({
    queryKey: ['grocery', 'trip', tripId],
    enabled: !!tripId,
    queryFn: async () => {
      const result = await api.grocery.getTripDetail(tripId);
      if (!result.success) throw new Error(result.error?.code || 'GROCERY_TRIP_FAILED');
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  return {
    trip: query.data?.trip ?? null,
    items: query.data?.items ?? [],
    isLoading: query.isLoading,
  };
}

/** Receipt upload/open and the explicit one-shot push into SpendWise. */
export function useGroceryTripActions() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const userId = useAuthStore((s) => s.user?.id);
  const { t } = useTranslation('grocery');
  const [busyTripId, setBusyTripId] = useState(null);

  const invalidate = useCallback((tripId) => {
    queryClient.invalidateQueries({ queryKey: ['grocery', 'history', userId] });
    if (tripId) queryClient.invalidateQueries({ queryKey: ['grocery', 'trip', tripId] });
  }, [queryClient, userId]);

  const uploadReceipt = useCallback(async (tripId, file) => {
    setBusyTripId(tripId);
    try {
      const result = await api.grocery.uploadReceipt(tripId, file);
      if (!result.success) {
        toast.error(t(`errors.${result.error?.code}`, { fallback: t('errors.generic') }));
        return false;
      }
      invalidate(tripId);
      toast.success(t('history.receiptSaved'));
      return true;
    } finally {
      setBusyTripId(null);
    }
  }, [invalidate, t, toast]);

  /** Receipts live in a private bucket — this fetches a short-lived signed URL. */
  const openReceipt = useCallback(async (tripId) => {
    const result = await api.grocery.getReceiptUrl(tripId);
    if (!result.success) {
      toast.error(t(`errors.${result.error?.code}`, { fallback: t('errors.generic') }));
      return null;
    }
    return result.data.url;
  }, [t, toast]);

  const addToSpendWise = useCallback(async (tripId) => {
    setBusyTripId(tripId);
    try {
      const result = await api.grocery.linkToSpendWise(tripId);
      if (!result.success) {
        toast.error(t(`errors.${result.error?.code}`, { fallback: t('errors.generic') }));
        return null;
      }
      invalidate(tripId);
      // Exactly what a manual expense invalidates — the trip just created one.
      await invalidateFinancialQueries(queryClient);
      emitFinancialDataUpdated({ source: 'grocery-trip' });

      toast.success(result.data.created ? t('history.addedToSpendWise') : t('history.alreadyLinked'));
      return result.data.transactionId;
    } finally {
      setBusyTripId(null);
    }
  }, [invalidate, queryClient, t, toast]);

  return { uploadReceipt, openReceipt, addToSpendWise, busyTripId };
}
