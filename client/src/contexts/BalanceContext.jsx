/**
 * 💰 BALANCE CONTEXT - GLOBAL BALANCE & TRANSACTION STATE MANAGEMENT
 * Provides balance and transaction refresh functionality across the entire app
 * Features: Global refresh triggers, Transaction action integration, Performance optimized
 * @version 2.0.0 - ENHANCED FOR TRANSACTIONS
 */

import React, { createContext, useContext, useCallback, useRef } from 'react';

// Create the context
const BalanceContext = createContext(null);

/**
 * Balance Provider Component
 */
export const BalanceProvider = ({ children }) => {
  // Store balance refresh functions from useBalance hooks
  const refreshFunctionsRef = useRef(new Set());
  // Store transaction refresh functions from useTransactions hooks
  const transactionRefreshFunctionsRef = useRef(new Set());

  /**
   * Register a balance refresh function
   * Called by useBalance hooks when they mount
   */
  const registerRefresh = useCallback((refreshFn) => {
    // Support registering either a function or an object with { normal, silent }
    refreshFunctionsRef.current.add(refreshFn);
    
    // Return cleanup function
    return () => {
      refreshFunctionsRef.current.delete(refreshFn);
    };
  }, []);

  /**
   * Register a transaction refresh function
   * Called by useTransactions hooks when they mount
   */
  const registerTransactionRefresh = useCallback((refreshFn) => {
    transactionRefreshFunctionsRef.current.add(refreshFn);
    
    // Return cleanup function
    return () => {
      transactionRefreshFunctionsRef.current.delete(refreshFn);
    };
  }, []);

  /**
   * Trigger all registered balance refreshes
   * Called when transactions are added/edited/deleted
   */
  const triggerBalanceRefresh = useCallback(() => {
    console.log('🔄 BalanceContext: Triggering balance refresh for all components...');
    
    // Call all registered refresh functions
    refreshFunctionsRef.current.forEach((refreshFn) => {
      try {
        if (typeof refreshFn === 'function') {
          // Backward compatibility: direct function
          refreshFn();
        } else if (refreshFn && typeof refreshFn.normal === 'function') {
          // Preferred: object with normal refresher
          refreshFn.normal();
        } else if (refreshFn && typeof refreshFn.silent === 'function') {
          // Fallback: use silent if normal not provided
          refreshFn.silent();
        }
      } catch (error) {
        console.error('❌ Balance refresh failed:', error);
      }
    });
  }, []);

  /**
   * Trigger all registered transaction refreshes
   * Called when transactions are added/edited/deleted
   */
  const triggerTransactionRefresh = useCallback(() => {
    console.log('🔄 BalanceContext: Triggering transaction refresh for all components...');
    
    // Call all registered transaction refresh functions
    transactionRefreshFunctionsRef.current.forEach((refreshFn) => {
      try {
        refreshFn();
      } catch (error) {
        console.error('❌ Transaction refresh failed:', error);
      }
    });
  }, []);

  /**
   * Trigger both balance and transaction refreshes
   * Called when transactions are added/edited/deleted
   */
  const triggerAllRefresh = useCallback(() => {
    console.log('🔄 BalanceContext: Triggering all refreshes...');
    triggerBalanceRefresh();
    triggerTransactionRefresh();
  }, [triggerBalanceRefresh, triggerTransactionRefresh]);

  /**
   * Silent refresh (without loading states)
   * Used for background updates
   */
  const triggerSilentRefresh = useCallback(() => {
    console.log('🔄 BalanceContext: Triggering silent balance refresh...');
    
    refreshFunctionsRef.current.forEach((refreshFn) => {
      try {
        if (typeof refreshFn === 'function') {
          refreshFn();
        } else if (refreshFn && typeof refreshFn.silent === 'function') {
          refreshFn.silent();
        } else if (refreshFn && typeof refreshFn.normal === 'function') {
          refreshFn.normal();
        }
      } catch (error) {
        console.error('❌ Silent balance refresh failed:', error);
      }
    });
  }, []);

  const contextValue = {
    registerRefresh,
    registerTransactionRefresh,
    triggerBalanceRefresh,
    triggerTransactionRefresh,
    triggerAllRefresh,
    triggerSilentRefresh
  };

  return (
    <BalanceContext.Provider value={contextValue}>
      {children}
    </BalanceContext.Provider>
  );
};

/**
 * Hook to use balance context
 */
export const useBalanceContext = () => {
  const context = useContext(BalanceContext);
  
  if (!context) {
    throw new Error('useBalanceContext must be used within a BalanceProvider');
  }
  
  return context;
};

/**
 * Hook for transaction actions to trigger both balance and transaction refresh
 */
export const useBalanceRefresh = () => {
  const { triggerAllRefresh, triggerBalanceRefresh, triggerTransactionRefresh, triggerSilentRefresh } = useBalanceContext();
  
  return {
    refreshBalance: triggerBalanceRefresh,
    refreshTransactions: triggerTransactionRefresh,
    refreshAll: triggerAllRefresh, // Use this for transaction actions
    silentRefreshBalance: triggerSilentRefresh
  };
};

export default BalanceContext;