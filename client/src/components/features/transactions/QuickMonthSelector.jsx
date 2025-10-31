/**
 * Quick Month Selector Component
 * Allows users to quickly filter transactions by month
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronDown } from 'lucide-react';
import { useTranslation } from '../../../stores';
import { cn } from '../../../utils/helpers';

const QuickMonthSelector = ({ availableMonths, selectedMonth, onMonthChange }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (availableMonths.length === 0) return null;
  
  const selectedMonthLabel = selectedMonth === 'all' 
    ? t('filters.month.all', 'All Months')
    : availableMonths.find(m => m.key === selectedMonth)?.label || t('filters.month.all', 'All Months');
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border-2 transition-all font-medium text-xs sm:text-sm whitespace-nowrap",
          selectedMonth !== 'all'
            ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 shadow-md"
            : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md"
        )}
      >
        <Calendar className="w-4 h-4 shrink-0" />
        <span className="hidden sm:inline truncate max-w-[150px]">{selectedMonthLabel}</span>
        <span className="sm:hidden truncate">
          {selectedMonth === 'all' ? 'All' : availableMonths.find(m => m.key === selectedMonth)?.shortLabel}
        </span>
        <ChevronDown className={cn("w-4 h-4 transition-transform shrink-0", isExpanded && "rotate-180")} />
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsExpanded(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-full mt-2 left-0 right-0 sm:left-0 sm:right-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-gray-200 dark:border-gray-700 py-2 z-50 sm:min-w-[220px] max-h-[320px] overflow-y-auto"
            >
              <button
                onClick={() => {
                  onMonthChange('all');
                  setIsExpanded(false);
                }}
                className={cn(
                  "w-full px-4 py-2.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium",
                  selectedMonth === 'all' && "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300"
                )}
              >
                {t('filters.month.all', 'All Months')}
              </button>
              <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
              {availableMonths.map(month => (
                <button
                  key={month.key}
                  onClick={() => {
                    onMonthChange(month.key);
                    setIsExpanded(false);
                  }}
                  className={cn(
                    "w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                    selectedMonth === month.key && "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-semibold"
                  )}
                >
                  {month.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuickMonthSelector;

