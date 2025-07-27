/**
 * Centralized Hooks Export
 * Makes imports cleaner and more consistent
 */

// Core hooks
export { default as useApi } from './useApi';
export { 
  useApiQuery, 
  useApiMutation, 
  usePaginatedQuery, 
  useInfiniteApiQuery,
  useRealtimeQuery,
  useDependentQuery,
  usePrefetch,
  useCacheManager
} from './useApi';

// Authentication
export { default as useAuth } from './useAuth';

// Transactions - Export all transaction-related hooks
export { 
  default as useTransactions,
  useTransactions,
  useTransactionSearch,
  useRecurringTransactions,
  useTransactionTemplates,
  useTransactionsByPeriod,
  useCategoryBreakdown
} from './useTransactions';

// Categories
export { 
  default as useCategories,
  useCategories,
  useCategoryStats,
  useCategoriesWithCounts,
  useCategoryIcons
} from './useCategory';

// Other hooks
export { default as useDashboard } from './useDashboard';
export { default as useProfile } from './useProfile';

// Translation hook (re-export from stores for convenience)
export { useTranslation } from '../stores/translationStore';
