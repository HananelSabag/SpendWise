// RefreshContext.jsx - Enhanced version with better control and documentation

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const RefreshContext = createContext(null);

/**
 * Manages application-wide refresh states and date synchronization
 * Primary responsibilities:
 * 1. Control refresh triggers between components
 * 2. Maintain selected date across components
 * 3. Prevent redundant updates
 */
export const RefreshProvider = ({ children }) => {
  // Core states
  const [refreshTimestamp, setRefreshTimestamp] = useState(Date.now());
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    now.setHours(12, 0, 0, 0);
    return now;
  });

  // Debounce refresh requests
  const refreshTimeout = useRef(null);
  const lastRefresh = useRef({
    timestamp: null,
    scope: null
  });

  /**
   * Triggers a refresh across components with debouncing
   * @param {string} scope - Refresh scope ('all', 'balance', 'transactions')
   * @param {Date} [date] - Target date for refresh
   */
  const triggerRefresh = useCallback((scope = 'all', date = null) => {
    // Clear any pending refresh
    if (refreshTimeout.current) {
      clearTimeout(refreshTimeout.current);
    }

    // Update selected date if provided
    if (date) {
      const normalizedDate = new Date(date);
      normalizedDate.setHours(12, 0, 0, 0);
      setSelectedDate(normalizedDate);
    }

    // Debounce the refresh trigger
    refreshTimeout.current = setTimeout(() => {
      // Don't trigger if same scope was refreshed recently (within 100ms)
      const now = Date.now();
      if (lastRefresh.current.timestamp && 
          lastRefresh.current.scope === scope &&
          (now - lastRefresh.current.timestamp) < 100) {
        return;
      }

      setRefreshTimestamp(now);
      lastRefresh.current = { timestamp: now, scope };
    }, 50);
  }, []);

  return (
    <RefreshContext.Provider 
      value={{ 
        refreshTimestamp,
        selectedDate,
        triggerRefresh
      }}
    >
      {children}
    </RefreshContext.Provider>
  );
};

/**
 * Hook to access refresh functionality
 * @returns {Object} Refresh context methods and state
 */
export const useRefresh = () => {
  const context = useContext(RefreshContext);
  if (!context) {
    throw new Error('useRefresh must be used within RefreshProvider');
  }
  return context;
};

export default RefreshContext;