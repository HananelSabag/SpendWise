// components/common/CalendarWidget.jsx
import React, { useRef, useEffect, useState } from 'react';
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
  showTodayButton = true
}) => {
  const { t, language } = useLanguage();
  const isRTL = language === 'he';
  const calendarRef = useRef(null);
  
  const [currentMonth, setCurrentMonth] = useState(() => 
    selectedDate ? new Date(selectedDate) : new Date()
  );

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

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
    const dateTime = date.getTime();
    
    if (minDate && dateTime < minDate.getTime()) return false;
    if (maxDate && dateTime > maxDate.getTime()) return false;
    
    return true;
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    if (!date || !selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const weekDays = t('calendar.weekDays') || (
    isRTL 
      ? ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  );

  return (
    <div
      ref={calendarRef}
      className={cn(
        'bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 min-w-[280px]',
        'border border-gray-200 dark:border-gray-700',
        className
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          aria-label={t('calendar.previousMonth')}
        >
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>

        <h3 className="font-semibold text-gray-900 dark:text-white">
          {currentMonth.toLocaleDateString(isRTL ? 'he-IL' : 'en-US', {
            month: 'long',
            year: 'numeric',
          })}
        </h3>

        <button
          onClick={handleNextMonth}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          aria-label={t('calendar.nextMonth')}
        >
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Week days */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2">
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
                'h-9 w-9 flex items-center justify-center rounded-lg text-sm transition-all',
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
            className="w-full px-3 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors flex items-center justify-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            {t('calendar.today')}
          </button>
        </div>
      )}
    </div>
  );
};

export default CalendarWidget;