/**
 * Centralized Hooks Export
 * Makes imports cleaner and more consistent
 * ✅ FIXED: Only exports that actually exist
 */

// Authentication - useAuth only has named export
export { useAuth } from './useAuth';

// Transactions - Only actual exports
export {
  default as useTransactions
} from './useTransactions';

// Transaction Actions
export { default as useTransactionActions } from './useTransactionActions';

// Other verified hooks with default exports
export { default as useDashboard } from './useDashboard';
export { default as useExport } from './useExport';
export { default as useToast } from './useToast';

// Translation hook (re-export from stores for convenience)
export { useTranslation } from '../stores/translationStore';

// Toast cleanup utility
export { useToastCleanup, dismissLoadingToasts } from './useToastCleanup';