// components/features/transactions/TransactionFilters.jsx

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter, Calendar, DollarSign, Search, X, ChevronDown, 
  TrendingUp, TrendingDown, Settings, Tag, Clock
} from 'lucide-react';

import { useCategories } from '../../../hooks/useCategory';
import { useTransactions } from '../../../hooks/useTransactions';
import { useLanguage } from '../../../context/LanguageContext';
import { cn } from '../../../utils/helpers';
import { Input, Button, Badge } from '../../ui';

/**
 * Simplified TransactionFilters - Clean & Intuitive UX
 * 
 * ✅ IMPROVEMENTS:
 * - Clean top-level filters (Type, Search, Date)
 * - Advanced filters in collapsible section
 * - Better visual organization
 * - Reduced complexity and options
 * - Working filter validation
 */
const TransactionFilters = ({ 
  onFilterChange,
  className = '',
  hideHeader = false
}) => {
  const { t, language } = useLanguage();
  const isRTL = language === 'he';
  
  // ✅ SIMPLIFIED: Get data from hooks
  const { categories = [], isLoading: categoriesLoading } = useCategories();
  const { filters = {}, updateFilters, clearFilters } = useTransactions();
  
  // ✅ NEW: Advanced filters state
  const [showAdvanced, setShowAdvanced] = useState(false);

  // ✅ SIMPLIFIED: Handle filter changes
  const handleFilterChange = useCallback((key, value) => {
    const newFilters = { ...filters, [key]: value };
    updateFilters(newFilters);
    onFilterChange?.(newFilters);
  }, [filters, updateFilters, onFilterChange]);

  // ✅ SIMPLIFIED: Handle filter reset
  const handleReset = useCallback(() => {
    clearFilters();
    onFilterChange?.({});
  }, [clearFilters, onFilterChange]);

  // ✅ SIMPLIFIED: Get active filter count
  const getActiveFilterCount = useCallback(() => {
    let count = 0;
    if (filters.type && filters.type !== 'all') count++;
    if (filters.searchTerm) count++;
    if (filters.categories?.length > 0) count++;
    if (filters.minAmount || filters.maxAmount) count++;
    if (filters.startDate || filters.endDate) count++;
    if (filters.recurring !== 'all') count++;
    return count;
  }, [filters]);

  const activeCount = getActiveFilterCount();

  // ✅ SIMPLIFIED: Quick date ranges
  const quickRanges = [
    { label: t('common.today'), days: 0 },
    { label: t('common.week'), days: 7 },
    { label: t('common.month'), days: 30 },
    { label: t('common.quarter'), days: 90 }
  ];

  const applyDateRange = (range) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - range.days);
    
    handleFilterChange('startDate', start.toISOString().split('T')[0]);
    handleFilterChange('endDate', end.toISOString().split('T')[0]);
  };

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700', className)}>
      
      {/* ✅ SIMPLIFIED: Clean Header */}
      {!hideHeader && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-primary-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {t('transactions.filters.title')}
            </h3>
            {activeCount > 0 && (
              <Badge variant="primary" size="small" className="bg-primary-100 text-primary-700">
                {activeCount}
              </Badge>
            )}
          </div>
          
          {activeCount > 0 && (
            <Button
              variant="ghost"
              size="small"
              onClick={handleReset}
              className="text-gray-500 hover:text-gray-700 px-2"
            >
              <X className="w-4 h-4 mr-1" />
              {t('common.clear')}
            </Button>
          )}
        </div>
      )}

      <div className="p-4 space-y-4">
        
        {/* ✅ TOP-LEVEL: Essential Filters (Always Visible) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Transaction Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('common.type')}
            </label>
            <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 p-1 bg-gray-50 dark:bg-gray-800">
              {[
                { key: 'all', label: t('transactions.all'), icon: Filter },
                { key: 'income', label: t('transactions.income'), icon: TrendingUp },
                { key: 'expense', label: t('transactions.expense'), icon: TrendingDown }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => handleFilterChange('type', key)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all',
                    (filters.type === key || (!filters.type && key === 'all'))
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('common.search')}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('transactions.searchPlaceholder')}
                value={filters.searchTerm || ''}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
              />
              {filters.searchTerm && (
                <button
                  onClick={() => handleFilterChange('searchTerm', '')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Date Range */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('common.period')}
            </label>
            <div className="grid grid-cols-2 gap-1">
              {quickRanges.map((range) => (
                <button
                  key={range.label}
                  onClick={() => applyDateRange(range)}
                  className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ✅ ADVANCED FILTERS: Collapsible Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {t('transactions.filters.advanced')}
              </span>
              {activeCount > 3 && (
                <Badge variant="secondary" size="small">
                  {activeCount - 3}
                </Badge>
              )}
            </div>
            <ChevronDown className={cn(
              'w-5 h-5 text-gray-400 transition-transform',
              showAdvanced && 'rotate-180'
            )} />
          </button>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="mt-4 space-y-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  
                  {/* Amount Range */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      {t('transactions.filters.amountRange')}
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        placeholder={t('transactions.filters.min')}
                        value={filters.minAmount || ''}
                        onChange={(e) => handleFilterChange('minAmount', e.target.value ? parseFloat(e.target.value) : null)}
                        className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                      />
                      <input
                        type="number"
                        placeholder={t('transactions.filters.max')}
                        value={filters.maxAmount || ''}
                        onChange={(e) => handleFilterChange('maxAmount', e.target.value ? parseFloat(e.target.value) : null)}
                        className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      {t('categories.title')}
                    </label>
                    {categoriesLoading ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                        {categories.slice(0, 12).map(category => { // ✅ LIMIT: Show only top 12 categories
                          const isSelected = filters.categories?.includes(category.id);
                          return (
                            <label
                              key={category.id}
                              className={cn(
                                'flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all text-sm',
                                isSelected
                                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  const newCategories = e.target.checked
                                    ? [...(filters.categories || []), category.id]
                                    : (filters.categories || []).filter(id => id !== category.id);
                                  handleFilterChange('categories', newCategories);
                                }}
                                className="w-3 h-3 rounded text-primary-500"
                              />
                              <span className="truncate">
                                {category.is_default ? t(`categories.${category.name}`) : category.name}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Custom Date Range */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {t('transactions.filters.customDateRange')}
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                          {t('transactions.filters.from')}
                        </label>
                        <input
                          type="date"
                          value={filters.startDate || ''}
                          onChange={(e) => handleFilterChange('startDate', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                          {t('transactions.filters.to')}
                        </label>
                        <input
                          type="date"
                          value={filters.endDate || ''}
                          onChange={(e) => handleFilterChange('endDate', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Recurring Type */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {t('transactions.filters.type')}
                    </label>
                    <div className="flex gap-2">
                      {[
                        { key: 'all', label: t('transactions.filters.all') },
                        { key: 'recurring', label: t('transactions.filters.recurring') },
                        { key: 'oneTime', label: t('transactions.filters.oneTime') }
                      ].map(({ key, label }) => (
                        <button
                          key={key}
                          onClick={() => handleFilterChange('recurring', key)}
                          className={cn(
                            'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                            (filters.recurring === key || (!filters.recurring && key === 'all'))
                              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                              : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-600'
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ✅ ACTIVE FILTERS: Quick View */}
        {activeCount > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            {filters.type && filters.type !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {filters.type === 'income' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {t(`transactions.${filters.type}`)}
                <button onClick={() => handleFilterChange('type', 'all')}>
                  <X className="w-3 h-3 ml-1" />
                </button>
              </Badge>
            )}
            
            {filters.searchTerm && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Search className="w-3 h-3" />
                "{filters.searchTerm}"
                <button onClick={() => handleFilterChange('searchTerm', '')}>
                  <X className="w-3 h-3 ml-1" />
                </button>
              </Badge>
            )}
            
            {(filters.startDate || filters.endDate) && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {filters.startDate} - {filters.endDate}
                <button onClick={() => {
                  handleFilterChange('startDate', null);
                  handleFilterChange('endDate', null);
                }}>
                  <X className="w-3 h-3 ml-1" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionFilters;