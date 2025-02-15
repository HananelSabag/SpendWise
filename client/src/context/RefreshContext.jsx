// RefreshContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';

const RefreshContext = createContext(null);

export const RefreshProvider = ({ children }) => {
  const [refreshTimestamp, setRefreshTimestamp] = useState(Date.now());
  const [refreshScope, setRefreshScope] = useState(null);
  const [refreshDate, setRefreshDate] = useState(new Date());

  const triggerRefresh = useCallback((scope = 'all', date = new Date()) => {
    setRefreshTimestamp(Date.now());
    setRefreshScope(scope);
    setRefreshDate(date);
    console.log('Triggering refresh with date:', date); // Debug log
  }, []);

  return (
    <RefreshContext.Provider 
      value={{ 
        refreshTimestamp, 
        refreshScope, 
        refreshDate,
        triggerRefresh 
      }}
    >
      {children}
    </RefreshContext.Provider>
  );
};

export const useRefresh = () => {
  const context = useContext(RefreshContext);
  if (!context) {
    throw new Error('useRefresh must be used within RefreshProvider');
  }
  return context;
};

export default RefreshContext;