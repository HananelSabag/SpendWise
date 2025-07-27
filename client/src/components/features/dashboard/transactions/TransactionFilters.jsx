/**
 * 🔍 TRANSACTION FILTERS - Search & Filtering Component
 * Extracted from RecentTransactions.jsx for better performance and maintainability
 * Features: Smart search, Advanced filters, Real-time filtering, Mobile-first
 * @version 2.0.0
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, X, ChevronDown, Calendar, 
  DollarSign, Tag, SortAsc, SortDesc, Grid, 
  List as ListIcon, RefreshCw, Star
} from 'lucide-react';

// ✅ Import Zustand stores
import { useTranslation } from '../../../../stores';

import { Button, Input, Badge, Dropdown } from '../../../ui';
import { cn } from '../../../../utils/helpers';

/**
 * 🔍 Advanced Filter Panel
 */
const AdvancedFilterPanel = ({ 
  filters, 
  onFiltersChange, 
  isOpen, 
  onToggle,
  className = ''
}) => {
  const { t } = useTranslation('dashboard');

  const filterOptions = useMemo(() => ({
    type: [
      { value: 'all', label: t('filters.all') },
      { value: 'income', label: t('filters.income') },
      { value: 'expense', label: t('filters.expense') }
    ],
    amount: [
      { value: 'any', label: t('filters.anyAmount') },
      { value: 'small', label: t('filters.under100') },
      { value: 'medium', label: t('filters.100to500') },
      { value: 'large', label: t('filters.over500') }
    ],
    date: [
      { value: 'all', label: t('filters.allTime') },
      { value: 'today', label: t('filters.today') },
      { value: 'week', label: t('filters.thisWeek') },
      { value: 'month', label: t('filters.thisMonth') },
      { value: 'quarter', label: t('filters.thisQuarter') },
      { value: 'year', label: t('filters.thisYear') }
    ],
    category: [
      { value: 'all', label: t('filters.allCategories') },
      { value: 'food', label: t('categories.food') },
      { value: 'transport', label: t('categories.transport') },
      { value: 'entertainment', label: t('categories.entertainment') },
      { value: 'shopping', label: t('categories.shopping') },
      { value: 'bills', label: t('categories.bills') }
    ]
  }), [t]);

  const handleFilterChange = useCallback((key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  }, [filters, onFiltersChange]);

  const clearFilters = useCallback(() => {
    onFiltersChange({});
  }, [onFiltersChange]);

  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(value => value && value !== 'all' && value !== 'any').length;
  }, [filters]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700",
            className
          )}
        >
          {/* Filter header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('filters.title')}
            </h3>
            
            <div className="flex items-center space-x-2">
              {activeFiltersCount > 0 && (
                <Badge variant="primary" size="sm">
                  {activeFiltersCount} {t('filters.active')}
                </Badge>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                disabled={activeFiltersCount === 0}
              >
                {t('filters.clear')}
              </Button>
            </div>
          </div>

          {/* Filter options */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(filterOptions).map(([key, options]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t(`filters.${key}`)}
                </label>
                <select
                  value={filters[key] || 'all'}
                  onChange={(e) => handleFilterChange(key, e.target.value)}
                  className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Quick filters */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('filters.quickFilters')}
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'starred', label: t('filters.starred'), icon: Star },
                { key: 'recurring', label: t('filters.recurring'), icon: RefreshCw },
                { key: 'large', label: t('filters.largeAmounts'), icon: DollarSign }
              ].map((quickFilter) => {
                const Icon = quickFilter.icon;
                const isActive = filters[quickFilter.key];
                
                return (
                  <Button
                    key={quickFilter.key}
                    variant={isActive ? "primary" : "outline"}
                    size="sm"
                    onClick={() => handleFilterChange(quickFilter.key, !isActive)}
                    className="flex items-center space-x-2"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{quickFilter.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * 🔍 Transaction Filters Main Component
 */
const TransactionFilters = ({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  groupBy,
  onGroupByChange,
  onRefresh,
  isRefreshing = false,
  className = ''
}) => {
  const { t, isRTL } = useTranslation('dashboard');
  const [showFilters, setShowFilters] = useState(false);

  // Sort options
  const sortOptions = useMemo(() => [
    { value: 'date-desc', label: t('sort.dateNewest'), icon: SortDesc },
    { value: 'date-asc', label: t('sort.dateOldest'), icon: SortAsc },
    { value: 'amount-desc', label: t('sort.amountHighest'), icon: SortDesc },
    { value: 'amount-asc', label: t('sort.amountLowest'), icon: SortAsc },
    { value: 'category', label: t('sort.category'), icon: Tag }
  ], [t]);

  // View mode options
  const viewModeOptions = useMemo(() => [
    { value: 'card', label: t('view.card'), icon: Grid },
    { value: 'list', label: t('view.list'), icon: ListIcon }
  ], [t]);

  // Group by options
  const groupByOptions = useMemo(() => [
    { value: 'none', label: t('groupBy.none') },
    { value: 'date', label: t('groupBy.date') },
    { value: 'category', label: t('groupBy.category') },
    { value: 'amount', label: t('groupBy.amount') }
  ], [t]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(value => value && value !== 'all' && value !== 'any').length;
  }, [filters]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main filter bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Input
            type="text"
            placeholder={t('search.placeholder')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick controls */}
        <div className="flex items-center space-x-2">
          {/* Sort */}
          <Dropdown
            trigger={
              <Button variant="outline" size="sm">
                <SortAsc className="w-4 h-4 mr-2" />
                {t('sort.title')}
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            }
          >
            <div className="p-2 w-48">
              {sortOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => onSortChange(option.value)}
                    className={cn(
                      "w-full flex items-center space-x-3 px-3 py-2 text-left rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
                      sortBy === option.value && "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </Dropdown>

          {/* View mode */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {viewModeOptions.map((mode) => {
              const Icon = mode.icon;
              return (
                <Button
                  key={mode.value}
                  variant={viewMode === mode.value ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => onViewModeChange(mode.value)}
                  className="p-2"
                >
                  <Icon className="w-4 h-4" />
                </Button>
              );
            })}
          </div>

          {/* Filters */}
          <Button
            variant={showFilters ? "primary" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="relative"
          >
            <Filter className="w-4 h-4 mr-2" />
            {t('filters.title')}
            {activeFiltersCount > 0 && (
              <Badge 
                variant="destructive" 
                size="xs" 
                className="absolute -top-2 -right-2 min-w-[1.25rem] h-5"
              >
                {activeFiltersCount}
              </Badge>
            )}
          </Button>

          {/* Refresh */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Group by */}
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('groupBy.title')}:
        </span>
        <div className="flex space-x-2">
          {groupByOptions.map((group) => (
            <Button
              key={group.value}
              variant={groupBy === group.value ? "primary" : "outline"}
              size="sm"
              onClick={() => onGroupByChange(group.value)}
            >
              {group.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Advanced filters panel */}
      <AdvancedFilterPanel
        filters={filters}
        onFiltersChange={onFiltersChange}
        isOpen={showFilters}
        onToggle={() => setShowFilters(!showFilters)}
      />
    </div>
  );
};

export default TransactionFilters;
export { AdvancedFilterPanel }; 