/**
 * Centralized Hooks Export
 * Makes imports cleaner and more consistent
 * ✅ FIXED: Only exports that actually exist
 */

// Core hooks - useApi only has named exports, no default
export { 
  useApiQuery, 
  useApiMutation, 
  usePaginatedQuery, 
  useInfiniteApiQuery,
  useRealtimeQuery,
  useDependentQuery,
  usePrefetch,
  useCacheManager,
  queryKeys,
  mutationKeys,
  useQueryPerformance
} from './useApi';

// Authentication - useAuth only has named export
export { useAuth } from './useAuth';

// Transactions - Only actual exports
export { 
  default as useTransactions,
  useTransactionTemplates
} from './useTransactions';

// Balance Panel - DEDICATED BALANCE HOOK  
export { default as useBalance } from './useBalance';

// Categories - Only actual exports
export { 
  default as useCategory
} from './useCategory';

// Transaction Actions
export { default as useTransactionActions } from './useTransactionActions';

// Other verified hooks with default exports
export { default as useDashboard } from './useDashboard';
export { default as useUpcomingTransactions } from './useUpcomingTransactions';
export { default as useExport } from './useExport';
export { default as useToast } from './useToast';
export { default as useAutoRegeneration } from './useAutoRegeneration';

// Translation hook (re-export from stores for convenience)
export { useTranslation } from '../stores/translationStore';

// Toast cleanup utility
export { useToastCleanup, dismissLoadingToasts } from './useToastCleanup';