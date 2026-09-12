import { QueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { shouldRetryQuery } from '../api/errors';

// Domain hooks override freshness only; TanStack Query owns deduplication,
// bounded retries and garbage collection. No second cleanup timer or cache.
export const queryConfigs = {
  dashboard: {
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  },
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: shouldRetryQuery,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
      networkMode: 'offlineFirst',
      structuralSharing: true,
    },
    mutations: {
      // A lost response is not proof a write failed. Never replay a write
      // automatically without a server-side idempotency contract.
      retry: false,
      networkMode: 'online',
      onError: (error) => {
        if (error?.code === 'VALIDATION_ERROR') return;
        const t = window.getTranslation || ((key) => key);
        toast.error(t('common.operation_failed'));
      },
    },
  },
});

if (import.meta.env.DEV) window.queryClient = queryClient;
export default queryClient;
