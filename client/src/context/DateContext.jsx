// src/context/DateContext.jsx
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

// Create base context
const DateContext = createContext(null);

// Create and export the hook first
export const useDate = () => {
  const context = useContext(DateContext);
  if (!context) {
    throw new Error('useDate must be used within a DateProvider');
  }
  return context;
};

// Create and export the provider
export const DateProvider = ({ children }) => {
  // Basic date state
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    now.setHours(12, 0, 0, 0);
    return now;
  });
  const [isCustomDate, setIsCustomDate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Cache management
  const cache = useRef(new Map());

  // Cache management functions
  const getDateKey = useCallback((date) => {
    return date.toISOString().split('T')[0];
  }, []);

  const setCacheData = useCallback((date, data) => {
    cache.current.set(getDateKey(date), {
      data,
      timestamp: Date.now()
    });
  }, [getDateKey]);

  const getCacheData = useCallback((date) => {
    return cache.current.get(getDateKey(date));
  }, [getDateKey]);

  const cleanCache = useCallback(() => {
    const fiveMinutes = 5 * 60 * 1000;
    const now = Date.now();
    
    for (const [key, value] of cache.current.entries()) {
      if (now - value.timestamp > fiveMinutes) {
        cache.current.delete(key);
      }
    }
  }, []);

  // Date management functions
  const updateSelectedDate = useCallback((date) => {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(12, 0, 0, 0);
  
    // Check if the date has actually changed before updating state
    if (selectedDate.toISOString().split('T')[0] !== normalizedDate.toISOString().split('T')[0]) {
      setSelectedDate(normalizedDate);
    }
  
    // Determine if the selected date is a custom date
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    
    setIsCustomDate(normalizedDate.toDateString() !== today.toDateString());
  }, [selectedDate]);
  

  const resetToToday = useCallback(() => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    setSelectedDate(today);
    setIsCustomDate(false);
  }, []);

  const formatDate = useCallback((date = selectedDate, language = 'en') => {
    return date.toLocaleDateString(
      language === 'he' ? 'he-IL' : 'en-US',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }
    );
  }, [selectedDate]);

  const value = {
    selectedDate,
    updateSelectedDate,
    resetToToday,
    formatDate,
    isCustomDate,
    isLoading,
    setIsLoading,
    setCacheData,
    getCacheData,
    cleanCache
  };

  return <DateContext.Provider value={value}>{children}</DateContext.Provider>;
};