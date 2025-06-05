// components/common/CalendarWidget.jsx
import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom'; // ✅ ADD: Portal for escaping parent constraints
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { cn } from '../../utils/helpers';

const CalendarWidget = ({ 
  selectedDate,
  onDateSelect,
  onClose,
  minDate,
  maxDate = new Date(),
  className = '',
  showTodayButton = true,
  triggerRef // ✅ NEW: Add triggerRef prop to position relative to button
}) => {
  const { t, language } = useLanguage();
  const isRTL = language === 'he';
  const calendarRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0, show: false });
  
  const [currentMonth, setCurrentMonth] = useState(() => 
    selectedDate ? new Date(selectedDate) : new Date()
  );

  // ✅ NEW: Calculate dynamic position with better overflow handling
  useEffect(() => {
    if (triggerRef?.current) {
      const updatePosition = () => {
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const calendarWidth = 320; // Known calendar width
        const calendarHeight = 400; // Estimated calendar height
        
        let top = triggerRect.bottom + 8; // 8px gap below button
        let left = triggerRef.current.offsetWidth >= calendarWidth 
          ? triggerRect.left // Align left if trigger is wide enough
          : triggerRect.left + (triggerRect.width / 2) - (calendarWidth / 2); // Center align
        
        // ✅ SMART OVERFLOW HANDLING
        // Check right edge overflow
        if (left + calendarWidth > viewportWidth - 16) {
          left = viewportWidth - calendarWidth - 16;
        }
        
        // Check left edge overflow
        if (left < 16) {
          left = 16;
        }
        
        // Check bottom overflow - show above if needed
        if (top + calendarHeight > viewportHeight - 16) {
          top = triggerRect.top - calendarHeight - 8;
          
          // If still overflows top, position at top with max height
          if (top < 16) {
            top = 16;
          }
        }
        
        setPosition({ top, left, show: true });
      };

      // Calculate position immediately and on scroll/resize
      updatePosition();
      
      const handleResize = () => updatePosition();
      const handleScroll = () => updatePosition();
      
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, true);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [triggerRef]);

  // ✅ NEW: Refine position after calendar renders
  useEffect(() => {
    if (triggerRef?.current && calendarRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const calendarRect = calendarRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let top = triggerRect.bottom + 8;
      let left = triggerRect.left;
      
      // Check if calendar would overflow right edge
      if (left + calendarRect.width > viewportWidth) {
        left = triggerRect.right - calendarRect.width;
      }
      
      // Check if calendar would overflow bottom edge
      if (top + calendarRect.height > viewportHeight) {
        top = triggerRect.top - calendarRect.height - 8;
      }
      
      // Ensure minimum margins from viewport edges
      left = Math.max(8, Math.min(left, viewportWidth - calendarRect.width - 8));
      top = Math.max(8, Math.min(top, viewportHeight - calendarRect.height - 8));
      
      setPosition({ top, left });
    }
  }, [calendarRef.current, triggerRef]); // Run when calendar mounts

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target) && 
          triggerRef?.current && !triggerRef.current.contains(event.target)) {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, triggerRef]);

  // Get days in month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Add empty slots for days before first of month
    const firstDayOfWeek = firstDay.getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days in month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateSelect = (date) => {
    if (!date || !isDateSelectable(date)) return;
    
    const normalizedDate = new Date(date);
    normalizedDate.setHours(12, 0, 0, 0);
    onDateSelect(normalizedDate);
  };

  const isDateSelectable = (date) => {
    if (!date) return false;
    
    // ✅ FIX: Normalize dates to same timezone for proper comparison
    const dateTime = new Date(date);
    dateTime.setHours(12, 0, 0, 0); // Normalize to noon
    
    if (minDate) {
      const minDateTime = new Date(minDate);
      minDateTime.setHours(12, 0, 0, 0);
      if (dateTime < minDateTime) return false;
    }
    
    if (maxDate) {
      const maxDateTime = new Date(maxDate);
      maxDateTime.setHours(12, 0, 0, 0);
      if (dateTime > maxDateTime) return false;
    }
    
    return true;
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    const compareDate = new Date(date);
    
    return compareDate.getFullYear() === today.getFullYear() &&
           compareDate.getMonth() === today.getMonth() &&
           compareDate.getDate() === today.getDate();
  };

  const isSelected = (date) => {
    if (!date || !selectedDate) return false;
    const compareDate = new Date(date);
    const selectedDateTime = new Date(selectedDate);
    
    return compareDate.getFullYear() === selectedDateTime.getFullYear() &&
           compareDate.getMonth() === selectedDateTime.getMonth() &&
           compareDate.getDate() === selectedDateTime.getDate();
  };

  // ✅ שימוש במפתח הנכון לימי השבוע עם fallback
  const weekDays = t('calendar.weekDays');

  // נוודא שweekDays הוא תמיד מערך עם fallback מפורש
  const weekDaysArray = Array.isArray(weekDays) ? weekDays : (
    language === 'he' ? 
      ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'] :
      ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  );

  // ✅ NEW: Portal rendering to escape parent constraints
  const calendarContent = (
    <div
      ref={calendarRef}
      className={cn(
        'bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4 min-w-[320px]',
        'border border-gray-200 dark:border-gray-700',
        'fixed z-[99999]', // ✅ Maximum z-index
        className
      )}
      style={{
        position: 'fixed',
        zIndex: 99999,
        top: `${position.top}px`,
        left: `${position.left}px`,
        maxHeight: 'calc(100vh - 32px)', // ✅ Prevent full viewport overflow
        maxWidth: 'calc(100vw - 32px)',
        opacity: position.show ? 1 : 0, // ✅ Hide until positioned
        pointerEvents: position.show ? 'auto' : 'none'
      }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          aria-label={t('calendar.previousMonth')}
        >
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>

        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
          {currentMonth.toLocaleDateString(isRTL ? 'he-IL' : 'en-US', {
            month: 'long',
            year: 'numeric',
          })}
        </h3>

        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          aria-label={t('calendar.nextMonth')}
        >
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Week days */}
      <div className="grid grid-cols-7 gap-1 mb-3">
        {weekDaysArray.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {getDaysInMonth(currentMonth).map((date, i) => {
          const selectable = isDateSelectable(date);
          return (
            <button
              key={i}
              onClick={() => date && handleDateSelect(date)}
              disabled={!date || !selectable}
              className={cn(
                'h-10 w-10 flex items-center justify-center rounded-lg text-sm transition-all font-medium',
                !date && 'invisible',
                date && selectable && 'hover:bg-gray-100 dark:hover:bg-gray-700',
                isToday(date) && 'ring-2 ring-primary-500 ring-offset-1',
                isSelected(date) && 'bg-primary-500 text-white hover:bg-primary-600',
                date && !selectable && 'text-gray-300 dark:text-gray-600 cursor-not-allowed',
                date && selectable && !isSelected(date) && 'text-gray-700 dark:text-gray-300'
              )}
            >
              {date?.getDate()}
            </button>
          );
        })}
      </div>

      {/* Today button */}
      {showTodayButton && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => handleDateSelect(new Date())}
            className="w-full px-4 py-3 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <Calendar className="w-4 h-4" />
            {t('calendar.today')}
          </button>
        </div>
      )}
    </div>
  );

  // ✅ Render calendar in portal to escape parent constraints
  return position.show ? createPortal(calendarContent, document.body) : null;
};

export default CalendarWidget;