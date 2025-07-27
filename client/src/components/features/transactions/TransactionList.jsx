/**
 * 📋 TRANSACTION LIST - MOBILE-FIRST
 * Enhanced transaction list with virtualization and filtering
 * NOW WITH ZUSTAND STORES! 🎉
 * @version 2.0.0
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FixedSizeList as List } from 'react-window';
import {
  Search, Filter, SortAsc, SortDesc, Calendar, DollarSign,
  Grid, List as ListIcon, Eye, EyeOff, RefreshCw, Download,
  ChevronDown, Check, X, ArrowUpDown, Zap
} from 'lucide-react';

// ✅ NEW: Import from Zustand stores instead of Context
import {
  useTranslation,
  useCurrency,
  useTheme,
  useNotifications
} from '../../../stores';

import { Button, Input, Card, Badge, Dropdown, Tooltip } from '../../ui';
import TransactionCard from './TransactionCard';
import { cn, dateHelpers } from '../../../utils/helpers';

const TransactionList = ({
  transactions = [],
  isLoading = false,
  onEdit,
  onDelete,
  onRefresh,
  className = ''
}) => {
  // ✅ NEW: Use Zustand stores
  const { t, isRTL } = useTranslation('transactions');
  const { formatCurrency, currency } = useCurrency();
  const { isDark } = useTheme();
  const { addNotification } = useNotifications();

  // State management
  const [viewMode, setViewMode] = useState('cards'); // cards, list, compact
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedTypes, setSelectedTypes] = useState(['income', 'expense']);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [dateRange, setDateRange] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [isSelectMode, setIsSelectMode] = useState(false);

  // Refs
  const listRef = useRef();
  const containerRef = useRef();

  // Get unique categories
  const categories = useMemo(() => {
    const categorySet = new Set();
    transactions.forEach(transaction => {
      if (transaction.category?.name) {
        categorySet.add(transaction.category.name);
      }
    });
    return Array.from(categorySet).sort();
  }, [transactions]);

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter(transaction => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesDescription = transaction.description?.toLowerCase().includes(searchLower);
        const matchesCategory = transaction.category?.name?.toLowerCase().includes(searchLower);
        const matchesAmount = transaction.amount?.toString().includes(searchTerm);
        
        if (!matchesDescription && !matchesCategory && !matchesAmount) {
          return false;
        }
      }

      // Type filter
      if (!selectedTypes.includes(transaction.type)) {
        return false;
      }

      // Category filter
      if (selectedCategories.length > 0 && !selectedCategories.includes(transaction.category?.name)) {
        return false;
      }

      // Date range filter
      if (dateRange !== 'all') {
        const transactionDate = new Date(transaction.date);
        const now = new Date();
        const startOfPeriod = new Date();

        switch (dateRange) {
          case 'today':
            startOfPeriod.setHours(0, 0, 0, 0);
            break;
          case 'week':
            startOfPeriod.setDate(now.getDate() - 7);
            break;
          case 'month':
            startOfPeriod.setMonth(now.getMonth() - 1);
            break;
          case 'quarter':
            startOfPeriod.setMonth(now.getMonth() - 3);
            break;
          case 'year':
            startOfPeriod.setFullYear(now.getFullYear() - 1);
            break;
          default:
            break;
        }

        if (transactionDate < startOfPeriod) {
          return false;
        }
      }

      return true;
    });

    // Sort transactions
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date) - new Date(b.date);
          break;
        case 'amount':
          comparison = Math.abs(a.amount) - Math.abs(b.amount);
          break;
        case 'description':
          comparison = (a.description || '').localeCompare(b.description || '');
          break;
        case 'category':
          comparison = (a.category?.name || '').localeCompare(b.category?.name || '');
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        default:
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [transactions, searchTerm, selectedTypes, selectedCategories, dateRange, sortBy, sortOrder]);

  // Transaction statistics
  const statistics = useMemo(() => {
    const stats = {
      total: filteredTransactions.length,
      income: 0,
      expenses: 0,
      incomeCount: 0,
      expenseCount: 0
    };

    filteredTransactions.forEach(transaction => {
      if (transaction.type === 'income' || transaction.amount > 0) {
        stats.income += Math.abs(transaction.amount);
        stats.incomeCount++;
      } else {
        stats.expenses += Math.abs(transaction.amount);
        stats.expenseCount++;
      }
    });

    return stats;
  }, [filteredTransactions]);

  // Sort options
  const sortOptions = [
    { value: 'date', label: t('sort.date'), icon: Calendar },
    { value: 'amount', label: t('sort.amount'), icon: DollarSign },
    { value: 'description', label: t('sort.description'), icon: Search },
    { value: 'category', label: t('sort.category'), icon: Filter },
    { value: 'type', label: t('sort.type'), icon: ArrowUpDown }
  ];

  // Date range options
  const dateRangeOptions = [
    { value: 'all', label: t('dateRange.all') },
    { value: 'today', label: t('dateRange.today') },
    { value: 'week', label: t('dateRange.week') },
    { value: 'month', label: t('dateRange.month') },
    { value: 'quarter', label: t('dateRange.quarter') },
    { value: 'year', label: t('dateRange.year') }
  ];

  // View mode options
  const viewModeOptions = [
    { value: 'cards', label: t('viewMode.cards'), icon: Grid },
    { value: 'list', label: t('viewMode.list'), icon: ListIcon },
    { value: 'compact', label: t('viewMode.compact'), icon: Eye }
  ];

  // Handle sort change
  const handleSortChange = useCallback((newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  }, [sortBy, sortOrder]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    
    try {
      await onRefresh();
      addNotification({
        type: 'success',
        title: t('success.refreshed'),
        duration: 2000
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: t('errors.refreshFailed'),
        duration: 4000
      });
    }
  }, [onRefresh, addNotification, t]);

  // Clear filters
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedTypes(['income', 'expense']);
    setSelectedCategories([]);
    setDateRange('all');
    setSortBy('date');
    setSortOrder('desc');
  }, []);

  // Bulk actions
  const handleSelectAll = useCallback(() => {
    if (selectedTransactions.length === filteredTransactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(filteredTransactions.map(t => t.id));
    }
  }, [selectedTransactions, filteredTransactions]);

  // Transaction item renderer for virtualization
  const TransactionItem = useCallback(({ index, style }) => {
    const transaction = filteredTransactions[index];
    
    return (
      <div style={style} className="px-4">
        <TransactionCard
          transaction={transaction}
          viewMode={viewMode}
          isSelected={selectedTransactions.includes(transaction.id)}
          isSelectMode={isSelectMode}
          onEdit={onEdit}
          onDelete={onDelete}
          onSelect={(id) => {
            if (selectedTransactions.includes(id)) {
              setSelectedTransactions(prev => prev.filter(tid => tid !== id));
            } else {
              setSelectedTransactions(prev => [...prev, id]);
            }
          }}
          className="mb-3"
        />
      </div>
    );
  }, [filteredTransactions, viewMode, selectedTransactions, isSelectMode, onEdit, onDelete]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg h-20" />
        ))}
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={cn("space-y-4", className)}
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      {/* Header with search and controls */}
      <Card className="p-4 space-y-4">
        {/* Search and main controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={t('search.placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            {/* Filter toggle */}
            <Button
              variant={showFilters ? "primary" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              {t('actions.filter')}
            </Button>

            {/* View mode */}
            <Dropdown
              trigger={
                <Button variant="outline" size="sm">
                  {React.createElement(
                    viewModeOptions.find(opt => opt.value === viewMode)?.icon || Grid,
                    { className: "w-4 h-4 mr-2" }
                  )}
                  {viewModeOptions.find(opt => opt.value === viewMode)?.label}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              }
              items={viewModeOptions.map(option => ({
                label: option.label,
                icon: option.icon,
                onClick: () => setViewMode(option.value),
                active: viewMode === option.value
              }))}
            />

            {/* Refresh */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Advanced filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4"
            >
              {/* Sort and date range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Sort */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('sort.title')}
                  </label>
                  <div className="flex gap-2">
                    <Dropdown
                      trigger={
                        <Button variant="outline" size="sm" className="flex-1">
                          {React.createElement(
                            sortOptions.find(opt => opt.value === sortBy)?.icon || Calendar,
                            { className: "w-4 h-4 mr-2" }
                          )}
                          {sortOptions.find(opt => opt.value === sortBy)?.label}
                          <ChevronDown className="w-4 h-4 ml-2" />
                        </Button>
                      }
                      items={sortOptions.map(option => ({
                        label: option.label,
                        icon: option.icon,
                        onClick: () => handleSortChange(option.value),
                        active: sortBy === option.value
                      }))}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                      {sortOrder === 'asc' ? 
                        <SortAsc className="w-4 h-4" /> : 
                        <SortDesc className="w-4 h-4" />
                      }
                    </Button>
                  </div>
                </div>

                {/* Date range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('dateRange.title')}
                  </label>
                  <Dropdown
                    trigger={
                      <Button variant="outline" size="sm" className="w-full">
                        <Calendar className="w-4 h-4 mr-2" />
                        {dateRangeOptions.find(opt => opt.value === dateRange)?.label}
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </Button>
                    }
                    items={dateRangeOptions.map(option => ({
                      label: option.label,
                      onClick: () => setDateRange(option.value),
                      active: dateRange === option.value
                    }))}
                  />
                </div>
              </div>

              {/* Type and category filters */}
              <div className="space-y-3">
                {/* Transaction types */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('filter.types')}
                  </label>
                  <div className="flex gap-2">
                    {['income', 'expense'].map(type => (
                      <Button
                        key={type}
                        variant={selectedTypes.includes(type) ? "primary" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (selectedTypes.includes(type)) {
                            setSelectedTypes(prev => prev.filter(t => t !== type));
                          } else {
                            setSelectedTypes(prev => [...prev, type]);
                          }
                        }}
                      >
                        {selectedTypes.includes(type) && <Check className="w-4 h-4 mr-1" />}
                        {t(`types.${type}`)}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Categories */}
                {categories.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('filter.categories')}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {categories.slice(0, 6).map(category => (
                        <Button
                          key={category}
                          variant={selectedCategories.includes(category) ? "primary" : "outline"}
                          size="sm"
                          onClick={() => {
                            if (selectedCategories.includes(category)) {
                              setSelectedCategories(prev => prev.filter(c => c !== category));
                            } else {
                              setSelectedCategories(prev => [...prev, category]);
                            }
                          }}
                        >
                          {selectedCategories.includes(category) && <Check className="w-4 h-4 mr-1" />}
                          {category}
                        </Button>
                      ))}
                      {categories.length > 6 && (
                        <Badge variant="secondary">
                          +{categories.length - 6} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Clear filters */}
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-2" />
                  {t('actions.clearFilters')}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Statistics */}
        {filteredTransactions.length > 0 && (
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center">
              <span className="text-gray-600 dark:text-gray-400 mr-2">
                {t('statistics.total')}:
              </span>
              <Badge variant="secondary">{statistics.total}</Badge>
            </div>
            
            <div className="flex items-center">
              <span className="text-gray-600 dark:text-gray-400 mr-2">
                {t('statistics.income')}:
              </span>
              <Badge variant="success">
                {formatCurrency(statistics.income)} ({statistics.incomeCount})
              </Badge>
            </div>
            
            <div className="flex items-center">
              <span className="text-gray-600 dark:text-gray-400 mr-2">
                {t('statistics.expenses')}:
              </span>
              <Badge variant="destructive">
                {formatCurrency(statistics.expenses)} ({statistics.expenseCount})
              </Badge>
            </div>
          </div>
        )}
      </Card>

      {/* Transaction list */}
      {filteredTransactions.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchTerm ? t('emptyStates.noResults') : t('emptyStates.noTransactions')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchTerm ? t('emptyStates.noResultsDesc') : t('emptyStates.noTransactionsDesc')}
          </p>
          {searchTerm && (
            <Button variant="outline" onClick={clearFilters}>
              {t('actions.clearFilters')}
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Bulk actions */}
          {isSelectMode && (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    {selectedTransactions.length === filteredTransactions.length ? 
                      t('actions.deselectAll') : 
                      t('actions.selectAll')
                    }
                  </Button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {t('selection.count', { count: selectedTransactions.length })}
                  </span>
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    {t('actions.export')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSelectMode(false)}
                  >
                    {t('actions.cancel')}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Virtual list for performance */}
          <div className="h-[600px]">
            <List
              ref={listRef}
              height={600}
              itemCount={filteredTransactions.length}
              itemSize={viewMode === 'compact' ? 60 : viewMode === 'list' ? 80 : 120}
              className="scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
            >
              {TransactionItem}
            </List>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionList;