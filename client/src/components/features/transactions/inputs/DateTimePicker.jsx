/**
 * 📅 DATE TIME PICKER - Enhanced Date & Time Selection
 * New clean architecture component - eliminates duplication
 * Features: Combined date/time, Quick presets, Mobile-first, Accessibility
 * @version 3.0.0 - TRANSACTION REDESIGN
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, ChevronDown, AlertCircle } from 'lucide-react';

// ✅ Import Zustand stores
import { useTranslation } from '../../../../stores';

import { cn } from '../../../../utils/helpers';

/**
 * 📅 Date Time Picker Component
 */
const DateTimePicker = ({
  date = '',
  time = '',
  onDateChange,
  onTimeChange,
  error = null,
  required = false,
  disabled = false,
  showTime = true,
  showPresets = true,
  className = ''
}) => {
  const { t } = useTranslation('transactions');
  
  const [showDatePresets, setShowDatePresets] = useState(false);

  // ✅ Date presets
  const datePresets = useMemo(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    return [
      {
        label: t('datePicker.today'),
        date: today.toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5)
      },
      {
        label: t('datePicker.yesterday'),
        date: yesterday.toISOString().split('T')[0],
        time: '12:00'
      },
      {
        label: t('datePicker.thisWeek'),
        date: thisWeekStart.toISOString().split('T')[0],
        time: '09:00'
      },
      {
        label: t('datePicker.lastWeek'),
        date: lastWeekStart.toISOString().split('T')[0],
        time: '09:00'
      },
      {
        label: t('datePicker.thisMonth'),
        date: thisMonthStart.toISOString().split('T')[0],
        time: '09:00'
      },
      {
        label: t('datePicker.lastMonth'),
        date: lastMonthStart.toISOString().split('T')[0],
        time: '09:00'
      }
    ];
  }, [t]);

  // ✅ Quick time presets
  const timePresets = [
    '09:00', '12:00', '15:00', '18:00', '21:00'
  ];

  // ✅ Handle preset selection
  const handlePresetSelect = useCallback((preset) => {
    onDateChange?.(preset.date);
    if (showTime && onTimeChange) {
      onTimeChange(preset.time);
    }
    setShowDatePresets(false);
  }, [onDateChange, onTimeChange, showTime]);

  // ✅ Handle time preset
  const handleTimePreset = useCallback((timeValue) => {
    onTimeChange?.(timeValue);
  }, [onTimeChange]);

  // ✅ Format display date
  const formatDisplayDate = useCallback((dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (dateString === today.toISOString().split('T')[0]) {
      return t('datePicker.today');
    }
    
    if (dateString === yesterday.toISOString().split('T')[0]) {
      return t('datePicker.yesterday');
    }
    
    return date.toLocaleDateString();
  }, [t]);

  return (
    <div className={cn("space-y-2", className)}>
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('fields.date.label')}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="grid gap-3 md:grid-cols-2">
        {/* Date Input */}
        <div className="space-y-2">
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Calendar className="w-5 h-5" />
            </div>
            
            <input
              type="date"
              value={date}
              onChange={(e) => onDateChange?.(e.target.value)}
              disabled={disabled}
              className={cn(
                "w-full pl-11 pr-4 py-3 border rounded-lg transition-all duration-200",
                "bg-white dark:bg-gray-800",
                "text-gray-900 dark:text-white",
                "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                
                // Error styles
                error ? [
                  "border-red-300 dark:border-red-600",
                  "bg-red-50 dark:bg-red-900/10"
                ] : [
                  "border-gray-300 dark:border-gray-600",
                  "hover:border-gray-400 dark:hover:border-gray-500"
                ],
                
                // Disabled styles
                disabled && "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-700"
              )}
            />

            {/* Date Presets Button */}
            {showPresets && !disabled && (
              <button
                type="button"
                onClick={() => setShowDatePresets(!showDatePresets)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Date Presets Dropdown */}
          {showPresets && showDatePresets && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto"
            >
              <div className="p-2">
                {datePresets.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => handlePresetSelect(preset)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      {preset.label}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(preset.date).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Current Date Display */}
          {date && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatDisplayDate(date)}
            </p>
          )}
        </div>

        {/* Time Input */}
        {showTime && (
          <div className="space-y-2">
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <Clock className="w-5 h-5" />
              </div>
              
              <input
                type="time"
                value={time}
                onChange={(e) => onTimeChange?.(e.target.value)}
                disabled={disabled}
                className={cn(
                  "w-full pl-11 pr-4 py-3 border rounded-lg transition-all duration-200",
                  "bg-white dark:bg-gray-800",
                  "text-gray-900 dark:text-white",
                  "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                  
                  // Error styles
                  error ? [
                    "border-red-300 dark:border-red-600",
                    "bg-red-50 dark:bg-red-900/10"
                  ] : [
                    "border-gray-300 dark:border-gray-600",
                    "hover:border-gray-400 dark:hover:border-gray-500"
                  ],
                  
                  // Disabled styles
                  disabled && "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-700"
                )}
              />
            </div>

            {/* Time Presets */}
            {showPresets && !disabled && (
              <div className="flex flex-wrap gap-1">
                {timePresets.map((timeValue) => (
                  <button
                    key={timeValue}
                    onClick={() => handleTimePreset(timeValue)}
                    className={cn(
                      "px-2 py-1 text-xs rounded border transition-colors",
                      time === timeValue
                        ? "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300"
                        : "bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    )}
                  >
                    {timeValue}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-600 dark:text-red-400 flex items-center space-x-1"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </motion.p>
      )}

      {/* Helper Text */}
      {!error && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {showTime 
            ? t('fields.date.helperWithTime')
            : t('fields.date.helper')
          }
        </p>
      )}
    </div>
  );
};

export default DateTimePicker; 