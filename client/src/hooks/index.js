/**
 * Centralized Hooks Export
 * Makes imports cleaner and more consistent
 * ✅ FIXED: Only exports that actually exist
 */

// Authentication - re-exported from the Zustand store (single source of truth)
export { useAuth } from '../stores';

// Transactions - Only actual exports
export {
  default as useTransactions
} from './useTransactions';

// Transaction Actions
export { default as useTransactionActions } from './useTransactionActions';

// Other verified hooks with default exports
export { default as useDashboard } from './useDashboard';
export { default as useCycles, useCurrentCycle, useCycleYears, useYearlyReview } from './useCycles';
export { useFinancialDataRefresh, useFinancialDataSync } from './useFinancialDataSync';
export { default as useBankSyncMonitor } from './useBankSyncMonitor';
export { default as useExport } from './useExport';
export { default as useToast } from './useToast';

// Translation hook (re-export from stores for convenience)
export { useTranslation } from '../stores/translationStore';

// Toast cleanup utility
export { useToastCleanup, dismissLoadingToasts } from './useToastCleanup';
