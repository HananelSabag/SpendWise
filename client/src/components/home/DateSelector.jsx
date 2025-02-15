// src/components/home/DateSelector.jsx
import React, { useState } from 'react';
import { Calendar as CalendarIcon, RotateCcw, HelpCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useDate } from '../../context/DateContext';
import CalendarWidget from './Transactions/CalendarWidget';

const DateSelector = () => {
  // Hooks
  const { t, language } = useLanguage();
  const { selectedDate, updateSelectedDate, resetToToday, formatDate, isCustomDate } = useDate();
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  
  const isHebrew = language === 'he';

  // Handle date selection
  const handleDateSelect = (date) => {
    updateSelectedDate(date);
    setShowCalendar(false);
  };

  return (
    <div className="relative flex items-center gap-2" dir={isHebrew ? 'rtl' : 'ltr'}>
      {/* Date selection button */}
      <button
        onClick={() => setShowCalendar(!showCalendar)}
        className="flex items-center gap-2 bg-white text-primary-600 px-4 py-2.5 rounded-xl 
                   hover:bg-white/90 transition-colors shadow-sm"
      >
        <CalendarIcon className="w-5 h-5" />
        <span>{formatDate(selectedDate, language)}</span>
      </button>

      {/* Reset to today button */}
      {isCustomDate && (
        <button
          onClick={resetToToday}
          className="p-2 rounded-full bg-white hover:bg-white/90 transition-colors shadow-sm"
          title={t('home.backToToday')}
        >
          <RotateCcw className="w-5 h-5 text-primary-600" />
        </button>
      )}

      {/* Help tooltip */}
      <div className="relative">
        <button
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="p-2 rounded-full bg-white hover:bg-white/90 transition-colors shadow-sm"
        >
          <HelpCircle className="w-5 h-5 text-primary-600" />
        </button>

        {showTooltip && (
          <div className="absolute bottom-full mb-2 p-2 bg-gray-900 text-white text-sm rounded-lg 
                        shadow-lg whitespace-nowrap">
            {t('home.dateSelector.tooltip')}
          </div>
        )}
      </div>

      {/* Calendar widget popup */}
      {showCalendar && (
        <div className="absolute top-full mt-2 z-50">
          <CalendarWidget
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onClose={() => setShowCalendar(false)}
          />
        </div>
      )}
    </div>
  );
};

export default DateSelector;