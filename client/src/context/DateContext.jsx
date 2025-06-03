// src/context/DateContext.jsx
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { format, isToday, isTomorrow, isYesterday, addDays, startOfDay } from 'date-fns';
import { he, enUS } from 'date-fns/locale';
import { useLanguage } from './LanguageContext';

const DateContext = createContext(null);

export const DateProvider = ({ children }) => {
  const { language } = useLanguage();
  
  // Initialize with today at noon for consistency
  const [selectedDate, setSelectedDateState] = useState(() => {
    // בדיקה אם יש תאריך שמור ב-localStorage
    const savedDate = localStorage.getItem('selectedDate');
    
    // ביצוע בדיקת תאריך חכמה יותר - אם התאריך שמור הוא מיום קודם ועכשיו בוקר, נאפס ליום הנוכחי
    if (savedDate) {
      try {
        const date = new Date(savedDate);
        const today = new Date();
        const savedDay = new Date(date).setHours(0, 0, 0, 0);
        const currentDay = new Date(today).setHours(0, 0, 0, 0);
        
        // אם זה יום חדש או אם התאריך השמור הוא בעתיד, השתמש בתאריך הנוכחי
        if (savedDay < currentDay || savedDay > currentDay) {
          console.log('[INFO] Starting with today\'s date');
          const now = new Date();
          now.setHours(12, 0, 0, 0);
          return now;
        }
        
        // אחרת השתמש בתאריך השמור
        date.setHours(12, 0, 0, 0);
        return date;
      } catch (error) {
        console.error('Invalid saved date:', error);
      }
    }
    
    // ברירת מחדל: היום הנוכחי בשעה 12:00
    const now = new Date();
    now.setHours(12, 0, 0, 0);
    return now;
  });
  
  // נירמול תאריכים לפורמט אחיד - שיפור עם תיעוד
  const normalizeDate = useCallback((date) => {
    if (!date) return new Date();
    
    // וודא שהתאריך הוא אובייקט Date
    const dateObj = date instanceof Date ? new Date(date) : new Date(date);
    
    // קבע שעה ל-12:00 לעקביות
    dateObj.setHours(12, 0, 0, 0);
    
    return dateObj;
  }, []);
  
  // Format date based on locale
  const formatDate = useCallback((date = selectedDate, formatStr = 'PPP') => {
    const locale = language === 'he' ? he : enUS;
    return format(date, formatStr, { locale });
  }, [selectedDate, language]);

  // ✅ Fix date setter with proper naming
  const setSelectedDate = useCallback((date) => {
    const normalizedDate = normalizeDate(date);
    setSelectedDateState(normalizedDate);
    
    // Save to localStorage
    localStorage.setItem('selectedDate', normalizedDate.toISOString());
    
    console.log('[DateContext] Date changed to:', normalizedDate);
  }, [normalizeDate]);

  // ✅ FIXED: Format date for server using local timezone methods
  const getDateForServer = useCallback((date = selectedDate) => {
    const normalizedDate = normalizeDate(date);
    
    // Use local timezone methods instead of UTC to prevent date shifts
    const year = normalizedDate.getFullYear();
    const month = String(normalizedDate.getMonth() + 1).padStart(2, '0');
    const day = String(normalizedDate.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }, [selectedDate, normalizeDate]);

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
  
  // Update selected date - חיזוק הנירמול והדיבאג
  const updateSelectedDate = useCallback((date) => {
    if (!date) return;
    
    // וודא שהתאריך הוא אובייקט Date
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // הדפס את התאריך לפני הנירמול לצורכי דיבוג
    console.log('[DEBUG] updateSelectedDate - before normalize:', dateObj.toISOString());
    
    // נרמל את התאריך ל-12:00
    const normalizedDate = normalizeDate(dateObj);
    
    console.log('[DEBUG] updateSelectedDate - after normalize:', normalizedDate.toISOString());
    
    // עדכן את הסטייט
    setSelectedDateState(normalizedDate);

    // שמור ב-localStorage לשימור בין טעינות
    localStorage.setItem('selectedDate', normalizedDate.toISOString());
    
    // הדפס את התאריך בפורמט ISO שנשלח לשרת
    console.log('[DEBUG] Date for server API:', normalizedDate.toISOString().split('T')[0]);
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
  
  // הפונקציה לאיפוס התאריך להיום - שיפור כדי לוודא שזה באמת עובד
  const resetToToday = useCallback(() => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    
    console.log('[DEBUG] Resetting to today:', today.toISOString());
    
    // עדכן את הסטייט ישירות במקום להשתמש ב-updateSelectedDate
    setSelectedDateState(today);
    
    // עדכן את ה-localStorage
    localStorage.setItem('selectedDate', today.toISOString());
    
    // רענן את הדף אם נדרש
    window.dispatchEvent(new CustomEvent('date-reset'));
  }, []);

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
  
  // שיפור: הוספת בדיקה יומית לתאריך
  React.useEffect(() => {
    // פונקציה שבודקת אם היום השתנה מאז הביקור האחרון
    const checkForNewDay = () => {
      const lastVisit = localStorage.getItem('lastVisitDate');
      const today = new Date().toISOString().split('T')[0];
      
      // אם היום השתנה, אפס את התאריך הנבחר להיום
      if (lastVisit && lastVisit !== today && isSelectedDateToday()) {
        resetToToday();
      }
      
      // עדכן את תאריך הביקור האחרון
      localStorage.setItem('lastVisitDate', today);
    };
    
    // הפעל את הבדיקה בטעינה
    checkForNewDay();
    
    // גם בדוק אם היום הנוכחי שונה מהתאריך הנבחר, הצג זאת בלוג
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];
    
    if (selectedDateStr !== todayStr) {
      console.log(`[INFO] Currently viewing ${selectedDateStr} instead of today (${todayStr})`);
    }
  }, [selectedDate, isSelectedDateToday, resetToToday]);

  // Value object
  const value = useMemo(() => ({
    selectedDate,
    setSelectedDate,
    updateSelectedDate,
    formatDate,
    getDateForServer,
    getRelativeDateString,
    normalizeDate,
    getDateRange,
    goToPreviousDay,
    goToNextDay,
    resetToToday,
    canGoNext,
    // Date status helpers
    isToday: (date = selectedDate) => isToday(normalizeDate(date)),
    isYesterday: (date = selectedDate) => isYesterday(normalizeDate(date)),
    isTomorrow: (date = selectedDate) => isTomorrow(normalizeDate(date)),
    isSelectedDateToday,
  }), [
    selectedDate, 
    setSelectedDate, 
    updateSelectedDate,
    formatDate, 
    getDateForServer, 
    getRelativeDateString,
    normalizeDate,
    getDateRange,
    goToPreviousDay,
    goToNextDay,
    resetToToday,
    canGoNext,
    isSelectedDateToday
  ]);

  return (
    <DateContext.Provider value={value}>
      {children}
    </DateContext.Provider>
  );
};

export const useDate = () => {
  const context = useContext(DateContext);
  if (!context) {
    throw new Error('useDate must be used within a DateProvider');
  }
  return context;
};

export default DateContext;