// DateContext.jsx
// Centralized date management and synchronization across components

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useRefresh } from './RefreshContext';

const DateContext = createContext(null);

/**
* Provides date management functionality across the application
* Maintains synchronization with RefreshContext
* Handles date normalization and validation
*/
export const DateProvider = ({ children }) => {
 // Integration with RefreshContext
 const { selectedDate: refreshDate, triggerRefresh } = useRefresh();

 // Core date state
 const [selectedDate, setSelectedDate] = useState(() => {
   const now = new Date();
   now.setHours(12, 0, 0, 0);
   return now;
 });

 // Track date changes
 const previousDate = useRef(selectedDate);

 /**
  * Normalize date to noon for consistent comparison
  * @param {Date} date - Date to normalize
  * @returns {Date} Normalized date
  */
 const normalizeDate = useCallback((date) => {
   const normalized = new Date(date);
   normalized.setHours(12, 0, 0, 0);
   return normalized;
 }, []);

 /**
  * Format date based on locale
  * @param {Date} date - Date to format
  * @param {string} language - Target language/locale
  * @returns {string} Formatted date string
  */
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

 /**
  * Check if selected date is today
  * @returns {boolean} True if selected date is today
  */
 const isToday = useCallback(() => {
   const today = new Date();
   return selectedDate.toDateString() === today.toDateString();
 }, [selectedDate]);

 /**
  * Update selected date and trigger refresh
  * @param {Date} date - New date to set
  * @param {boolean} shouldRefresh - Whether to trigger refresh
  */
 const updateSelectedDate = useCallback((date, shouldRefresh = true) => {
   const normalizedDate = normalizeDate(date);
   setSelectedDate(normalizedDate);
   
   if (shouldRefresh) {
     triggerRefresh('all', normalizedDate);
   }
 }, [normalizeDate, triggerRefresh]);

 /**
  * Reset date to today
  */
 const resetToToday = useCallback(() => {
   const today = new Date();
   updateSelectedDate(today);
 }, [updateSelectedDate]);

 /**
  * Navigate to previous day
  */
 const goToPreviousDay = useCallback(() => {
   const newDate = new Date(selectedDate);
   newDate.setDate(newDate.getDate() - 1);
   updateSelectedDate(newDate);
 }, [selectedDate, updateSelectedDate]);

 /**
  * Navigate to next day if not today
  */
 const goToNextDay = useCallback(() => {
   if (!isToday()) {
     const newDate = new Date(selectedDate);
     newDate.setDate(newDate.getDate() + 1);
     updateSelectedDate(newDate);
   }
 }, [selectedDate, isToday, updateSelectedDate]);

 // Sync with RefreshContext date changes
 useEffect(() => {
   if (refreshDate && 
       refreshDate.getTime() !== previousDate.current.getTime()) {
     setSelectedDate(normalizeDate(refreshDate));
     previousDate.current = refreshDate;
   }
 }, [refreshDate, normalizeDate]);

 const value = {
   selectedDate,
   updateSelectedDate,
   resetToToday,
   goToPreviousDay,
   goToNextDay,
   isToday,
   formatDate,
   normalizeDate
 };

 return (
   <DateContext.Provider value={value}>
     {children}
   </DateContext.Provider>
 );
};

/**
* Hook to access date management functionality
* @returns {Object} Date context methods and state
*/
export const useDate = () => {
 const context = useContext(DateContext);
 if (!context) {
   throw new Error('useDate must be used within DateProvider');
 }
 return context;
};

export default DateContext;