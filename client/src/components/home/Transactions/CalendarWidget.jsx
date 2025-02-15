import React, { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

/**
 * CalendarWidget Component
 * Custom calendar component with click-outside detection and date selection
 * 
 * @param {Date} selectedDate - Currently selected date
 * @param {Function} onDateSelect - Callback when date is selected
 * @param {Function} onClose - Callback to close calendar
 * @param {string} className - Additional CSS classes
 */
const CalendarWidget = ({ selectedDate, onDateSelect, onClose, className = '', toggleRef }) => {
  const { language } = useLanguage();
  const isHebrew = language === 'he';
  const calendarRef = useRef(null);
  
  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target) &&
        (!toggleRef || !toggleRef.current || !toggleRef.current.contains(event.target))
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, toggleRef]);

  // Update currentMonth when selectedDate changes
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));
  useEffect(() => {
    setCurrentMonth(new Date(selectedDate));
  }, [selectedDate]);

  // Get days in the current month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Add empty slots for days before first of the month
    const firstDayOfWeek = firstDay.getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days in the month
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date <= today) {
      const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
      onDateSelect(normalizedDate);
    }
  };

  let weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  if (isHebrew) {
    weekDays = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  }

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date) => {
    if (!date) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isFutureDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  };

  return (
    <div
      ref={calendarRef}
      className={`bg-white rounded-xl shadow-lg p-6 min-w-[320px] ${className}`}
      dir={isHebrew ? 'rtl' : 'ltr'}
    >
      {/* Month/Year Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-1 hover:bg-gray-100 rounded-full"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <span className="font-medium">
          {currentMonth.toLocaleDateString(isHebrew ? 'he-IL' : 'en-US', {
            month: 'long',
            year: 'numeric',
          })}
        </span>

        <button
          onClick={handleNextMonth}
          className="p-1 hover:bg-gray-100 rounded-full"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Week days header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-sm text-gray-500">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {getDaysInMonth(currentMonth).map((date, i) => (
          <button
            key={i}
            onClick={() => date && handleDateSelect(date)}
            disabled={!date || isFutureDate(date)}
            className={`
              h-8 w-8 flex items-center justify-center rounded-full text-sm
              ${!date ? 'invisible' : 'hover:bg-primary-50'}
              ${isToday(date) ? 'bg-primary-100 text-primary-600' : ''}
              ${isSelected(date) ? 'bg-primary-500 text-white hover:bg-primary-600' : ''}
              ${isFutureDate(date) ? 'text-gray-300 cursor-not-allowed' : ''}
            `}
          >
            {date?.getDate()}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CalendarWidget;
