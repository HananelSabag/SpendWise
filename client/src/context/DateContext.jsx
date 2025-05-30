// src/context/DateContext.jsx
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { format, isToday, isTomorrow, isYesterday, addDays, startOfDay } from 'date-fns';
import { he, enUS } from 'date-fns/locale';
import { useLanguage } from './LanguageContext';

const DateContext = createContext(null);

export const DateProvider = ({ children }) => {
  const { language } = useLanguage();
  
  // Initialize with today at noon for consistency
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    now.setHours(12, 0, 0, 0);
    return now;
  });
  
  // Normalize date to noon
  const normalizeDate = useCallback((date) => {
    const normalized = new Date(date);
    normalized.setHours(12, 0, 0, 0);
    return normalized;
  }, []);
  
  // Format date based on locale
  const formatDate = useCallback((date = selectedDate, formatStr = 'PPP') => {
    const locale = language === 'he' ? he : enUS;
    return format(date, formatStr, { locale });
  }, [selectedDate, language]);
  
  // Get relative date string
  const getRelativeDateString = useCallback((date = selectedDate) => {
    if (isToday(date)) {
      return language === 'he' ? 'היום' : 'Today';
    }
    if (isYesterday(date)) {
      return language === 'he' ? 'אתמול' : 'Yesterday';
    }
    if (isTomorrow(date)) {
      return language === 'he' ? 'מחר' : 'Tomorrow';
    }
    return formatDate(date, 'EEEE, d MMMM');
  }, [selectedDate, language, formatDate]);
  
  // Check if selected date is today
  const isSelectedDateToday = useCallback(() => {
    return isToday(selectedDate);
  }, [selectedDate]);
  
  // Update selected date
  const updateSelectedDate = useCallback((date) => {
    const normalizedDate = normalizeDate(date);
    setSelectedDate(normalizedDate);
    
    // Save to localStorage for persistence
    localStorage.setItem('selectedDate', normalizedDate.toISOString());
  }, [normalizeDate]);
  
  // Navigation methods
  const goToPreviousDay = useCallback(() => {
    updateSelectedDate(addDays(selectedDate, -1));
  }, [selectedDate, updateSelectedDate]);
  
  const goToNextDay = useCallback(() => {
    const tomorrow = addDays(selectedDate, 1);
    // Don't go beyond today
    if (!isToday(selectedDate) && startOfDay(tomorrow) <= startOfDay(new Date())) {
      updateSelectedDate(tomorrow);
    }
  }, [selectedDate, updateSelectedDate]);
  
  const resetToToday = useCallback(() => {
    updateSelectedDate(new Date());
  }, [updateSelectedDate]);
  
  // Get date range for period
  const getDateRange = useCallback((period = 'day', date = selectedDate) => {
    const start = startOfDay(date);
    let end = new Date(start);
    
    switch (period) {
      case 'day':
        end = new Date(start);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        // Start from Sunday
        const dayOfWeek = start.getDay();
        const weekStart = addDays(start, -dayOfWeek);
        end = addDays(weekStart, 6);
        end.setHours(23, 59, 59, 999);
        return { start: weekStart, end };
      case 'month':
        end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        const monthStart = new Date(start.getFullYear(), start.getMonth(), 1);
        return { start: monthStart, end };
      case 'year':
        end = new Date(start.getFullYear(), 11, 31);
        end.setHours(23, 59, 59, 999);
        const yearStart = new Date(start.getFullYear(), 0, 1);
        return { start: yearStart, end };
      default:
        end.setHours(23, 59, 59, 999);
    }
    
    return { start, end };
  }, [selectedDate]);
  
  // Can navigate to next day?
  const canGoNext = useMemo(() => {
    return !isSelectedDateToday();
  }, [isSelectedDateToday]);
  
  // Initialize from localStorage
  React.useEffect(() => {
    const savedDate = localStorage.getItem('selectedDate');
    if (savedDate) {
      try {
        const date = new Date(savedDate);
        // Only use saved date if it's not in the future
        if (date <= new Date()) {
          setSelectedDate(normalizeDate(date));
        }
      } catch (error) {
        console.error('Invalid saved date:', error);
      }
    }
  }, [normalizeDate]);
  
  const value = {
    // Current date
    selectedDate,
    updateSelectedDate,
    
    // Navigation
    goToPreviousDay,
    goToNextDay,
    resetToToday,
    canGoNext,
    
    // Utilities
    normalizeDate,
    formatDate,
    getRelativeDateString,
    isToday: isSelectedDateToday,
    getDateRange,
    
    // Additional helpers
    isSelectedDate: (date) => {
      return startOfDay(selectedDate).getTime() === startOfDay(date).getTime();
    }
  };
  
  return (
    <DateContext.Provider value={value}>
      {children}
    </DateContext.Provider>
  );
};

export const useDate = () => {
  const context = useContext(DateContext);
  if (!context) {
    throw new Error('useDate must be used within DateProvider');
  }
  return context;
};

export default DateContext;