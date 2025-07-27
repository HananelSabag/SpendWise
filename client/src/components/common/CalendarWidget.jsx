/**
 * 📅 CALENDAR WIDGET - MOBILE-FIRST
 * Enhanced calendar widget with better navigation and events
 * NOW WITH ZUSTAND STORES! 🎉
 * @version 2.0.0
 */

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Calendar, Clock, Plus,
  TrendingUp, TrendingDown, Circle, CheckCircle
} from 'lucide-react';

// ✅ NEW: Import from Zustand stores instead of Context
import {
  useTranslation,
  useCurrency,
  useTheme
} from '../../stores';

import { Button, Badge, Tooltip } from '../ui';
import { cn, dateHelpers } from '../../utils/helpers';

const CalendarWidget = ({
  transactions = [],
  onDateSelect,
  onAddTransaction,
  selectedDate,
  className = ''
}) => {
  // ✅ NEW: Use Zustand stores
  const { t, isRTL, currentLanguage } = useTranslation('common');
  const { formatCurrency } = useCurrency();
  const { isDark } = useTheme();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // month, week

  // Calendar navigation
  const navigateMonth = useCallback((direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  }, []);

  // Get calendar data
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of month and how many days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Get starting day of week (0 = Sunday)
    const startDayOfWeek = firstDay.getDay();
    
    // Create calendar grid
    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      
      // Find transactions for this day
      const dayTransactions = transactions.filter(transaction => 
        transaction.date && transaction.date.startsWith(dateStr)
      );
      
      // Calculate day summary
      const dayIncome = dayTransactions
        .filter(t => t.type === 'income' || t.amount > 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      const dayExpenses = dayTransactions
        .filter(t => t.type === 'expense' || t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      days.push({
        day,
        date,
        dateStr,
        transactions: dayTransactions,
        income: dayIncome,
        expenses: dayExpenses,
        net: dayIncome - dayExpenses,
        isToday: dateHelpers.isToday(date),
        isSelected: selectedDate && dateHelpers.isSameDay(date, new Date(selectedDate)),
        hasTransactions: dayTransactions.length > 0
      });
    }
    
    return {
      year,
      month,
      monthName: date.toLocaleString(currentLanguage === 'he' ? 'he' : 'en', { 
        month: 'long' 
      }),
      days,
      weekdays: Array.from({ length: 7 }, (_, i) => {
        const date = new Date(2024, 0, i); // Start from a Sunday
        return date.toLocaleDateString(currentLanguage === 'he' ? 'he' : 'en', { 
          weekday: 'short' 
        });
      })
    };
  }, [currentDate, transactions, selectedDate, currentLanguage]);

  // Handle date click
  const handleDateClick = useCallback((dayData) => {
    if (onDateSelect) {
      onDateSelect(dayData.dateStr);
    }
  }, [onDateSelect]);

  // Handle add transaction
  const handleAddTransaction = useCallback((dayData) => {
    if (onAddTransaction) {
      onAddTransaction(dayData.dateStr);
    }
  }, [onAddTransaction]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        staggerChildren: 0.02
      }
    }
  };

  const dayVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.2 }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden", className)}
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {calendarData.monthName} {calendarData.year}
            </h3>
            
            <div className="flex items-center space-x-1">
              <Badge variant="secondary" size="xs">
                {transactions.length} {t('calendar.transactions')}
              </Badge>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* View mode toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <Button
                variant={viewMode === 'month' ? "primary" : "ghost"}
                size="sm"
                onClick={() => setViewMode('month')}
                className="px-3 py-1 text-xs"
              >
                {t('calendar.month')}
              </Button>
              <Button
                variant={viewMode === 'week' ? "primary" : "ghost"}
                size="sm"
                onClick={() => setViewMode('week')}
                className="px-3 py-1 text-xs"
              >
                {t('calendar.week')}
              </Button>
            </div>

            {/* Navigation */}
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="p-2"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-2 text-xs"
              >
                {t('calendar.today')}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
                className="p-2"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="p-4">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {calendarData.weekdays.map((weekday, index) => (
            <div
              key={index}
              className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2"
            >
              {weekday}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          <AnimatePresence mode="popLayout">
            {calendarData.days.map((dayData, index) => (
              <motion.div
                key={dayData ? `${dayData.dateStr}` : `empty-${index}`}
                variants={dayVariants}
                layout
                className={cn(
                  "aspect-square relative",
                  dayData ? "cursor-pointer" : ""
                )}
              >
                {dayData ? (
                  <div
                    onClick={() => handleDateClick(dayData)}
                    className={cn(
                      "w-full h-full rounded-lg transition-all p-1 group",
                      "hover:bg-gray-100 dark:hover:bg-gray-700",
                      dayData.isSelected && "bg-blue-100 dark:bg-blue-900/20 ring-2 ring-blue-500",
                      dayData.isToday && "bg-blue-50 dark:bg-blue-900/10 border border-blue-300 dark:border-blue-700",
                      dayData.hasTransactions && "shadow-sm"
                    )}
                  >
                    {/* Day number */}
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "text-sm font-medium",
                        dayData.isToday 
                          ? "text-blue-600 dark:text-blue-400" 
                          : "text-gray-900 dark:text-white"
                      )}>
                        {dayData.day}
                      </span>
                      
                      {/* Transaction count indicator */}
                      {dayData.hasTransactions && (
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                      )}
                    </div>

                    {/* Transaction summary */}
                    {dayData.hasTransactions && (
                      <div className="mt-1 space-y-0.5">
                        {dayData.income > 0 && (
                          <div className="flex items-center text-xs">
                            <TrendingUp className="w-2 h-2 text-green-500 mr-1" />
                            <span className="text-green-600 dark:text-green-400 truncate">
                              {formatCurrency(dayData.income, { compact: true })}
                            </span>
                          </div>
                        )}
                        
                        {dayData.expenses > 0 && (
                          <div className="flex items-center text-xs">
                            <TrendingDown className="w-2 h-2 text-red-500 mr-1" />
                            <span className="text-red-600 dark:text-red-400 truncate">
                              {formatCurrency(dayData.expenses, { compact: true })}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Add transaction button (on hover) */}
                    {onAddTransaction && (
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddTransaction(dayData);
                          }}
                          className="w-6 h-6 p-0 rounded-full"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  // Empty cell for days outside current month
                  <div className="w-full h-full" />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Summary footer */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Circle className="w-3 h-3 text-green-500 fill-current" />
              <span className="text-gray-600 dark:text-gray-400">
                {t('calendar.income')}
              </span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Circle className="w-3 h-3 text-red-500 fill-current" />
              <span className="text-gray-600 dark:text-gray-400">
                {t('calendar.expenses')}
              </span>
            </div>
          </div>

          <div className="text-gray-500 dark:text-gray-400">
            {calendarData.days.filter(d => d?.hasTransactions).length} {t('calendar.activeDays')}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CalendarWidget;