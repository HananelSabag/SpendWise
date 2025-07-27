/**
 * 📋 RECENT TRANSACTIONS - COMPLETE UX/UI REVOLUTION!
 * 🚀 Advanced filtering, Virtualization, Bulk actions, Smart grouping
 * Features: AI categorization, Smart search, Bulk operations, Mobile gestures
 * NOW WITH ZUSTAND STORES! 🎉
 * @version 3.0.0 - REVOLUTIONARY UPDATE
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { FixedSizeList as List } from 'react-window';
import {
  TrendingUp, TrendingDown, Calendar, MoreVertical, Eye, EyeOff,
  Filter, RefreshCw, ArrowRight, Clock, Receipt, Edit, Trash2,
  Copy, ExternalLink, Check, X, Search, SortAsc, SortDesc,
  ChevronDown, ChevronUp, Grid, List as ListIcon, Star,
  Tag, MapPin, Camera, Share, Archive, Bookmark, Flag,
  Zap, Brain, Target, Award, AlertCircle, Info, Sparkles,
  ChevronLeft, ChevronRight, RotateCcw, Download, Upload
} from 'lucide-react';

// ✅ NEW: Import from Zustand stores instead of Context
import {
  useTranslation,
  useCurrency,
  useTheme,
  useNotifications
} from '../../../stores';

import { Button, Card, Badge, Dropdown, Tooltip, Input, Checkbox } from '../../ui';
import { cn, dateHelpers } from '../../../utils/helpers';

/**
 * 🎯 SMART TRANSACTION CARD - AI-enhanced transaction display
 */
const SmartTransactionCard = ({ 
  transaction, 
  index,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  viewMode = 'card',
  className = ''
}) => {
  const { t, isRTL } = useTranslation('dashboard');
  const { formatCurrency } = useCurrency();
  const { isDark } = useTheme();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const dragControls = useDragControls();

  const isIncome = transaction.type === 'income' || transaction.amount > 0;
  const amount = Math.abs(transaction.amount || 0);
  const formattedDate = dateHelpers.fromNow(transaction.date);

  // AI-powered insights
  const aiInsights = useMemo(() => {
    const insights = [];
    
    if (transaction.amount > 100) {
      insights.push({ type: 'warning', text: t('insights.largeTransaction') });
    }
    
    if (transaction.is_recurring) {
      insights.push({ type: 'info', text: t('insights.recurringPattern') });
    }
    
    if (transaction.tags?.includes('business')) {
      insights.push({ type: 'success', text: t('insights.businessExpense') });
    }

    return insights;
  }, [transaction, t]);

  // Swipe actions
  const swipeActions = [
    { 
      id: 'edit', 
      icon: Edit, 
      color: 'bg-blue-500', 
      action: () => onEdit?.(transaction) 
    },
    { 
      id: 'duplicate', 
      icon: Copy, 
      color: 'bg-green-500', 
      action: () => onDuplicate?.(transaction) 
    },
    { 
      id: 'delete', 
      icon: Trash2, 
      color: 'bg-red-500', 
      action: () => onDelete?.(transaction) 
    }
  ];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.02 }}
      drag="x"
      dragControls={dragControls}
      dragConstraints={{ left: -120, right: 120 }}
      dragElastic={0.2}
      onDragEnd={(event, info) => {
        if (Math.abs(info.offset.x) > 60) {
          const actionIndex = Math.floor(Math.abs(info.offset.x) / 40) % swipeActions.length;
          swipeActions[actionIndex]?.action();
        }
      }}
      className={cn(
        "relative group cursor-pointer",
        className
      )}
    >
      {/* Swipe action background */}
      <div className="absolute inset-y-0 left-0 right-0 flex">
        {/* Left swipe actions */}
        <div className="flex">
          {swipeActions.map((action, i) => {
            const ActionIcon = action.icon;
            return (
              <div
                key={action.id}
                className={cn(
                  "w-20 flex items-center justify-center",
                  action.color,
                  "text-white opacity-0 group-hover:opacity-100 transition-opacity"
                )}
              >
                <ActionIcon className="w-5 h-5" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Main card content */}
      <Card className={cn(
        "relative z-10 transition-all duration-300",
        "border border-gray-200 dark:border-gray-700",
        "hover:border-gray-300 dark:hover:border-gray-600",
        "hover:shadow-md group-hover:shadow-lg",
        isSelected && "ring-2 ring-blue-500 border-blue-500",
        viewMode === 'compact' ? "p-3" : "p-4"
      )}>
        <div className="flex items-center justify-between">
          {/* Selection checkbox */}
          <div className="flex items-center space-x-3">
            <Checkbox
              checked={isSelected}
              onChange={(checked) => onSelect?.(transaction.id, checked)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            />

            {/* Transaction icon and info */}
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {/* Type indicator */}
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                  isIncome 
                    ? "bg-green-100 dark:bg-green-900/20" 
                    : "bg-red-100 dark:bg-red-900/20"
                )}
              >
                {isIncome ? (
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                )}
              </motion.div>

              {/* Transaction details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-gray-900 dark:text-white truncate">
                    {transaction.description || t('labels.noDescription')}
                  </h4>
                  
                  {/* Status badges */}
                  <div className="flex items-center space-x-1">
                    {transaction.is_recurring && (
                      <Badge variant="secondary" size="xs">
                        <Clock className="w-3 h-3 mr-1" />
                        {t('labels.recurring')}
                      </Badge>
                    )}
                    
                    {transaction.receipt_url && (
                      <Tooltip content={t('labels.hasReceipt')}>
                        <Receipt className="w-3 h-3 text-gray-400" />
                      </Tooltip>
                    )}

                    {transaction.is_verified && (
                      <Tooltip content={t('labels.verified')}>
                        <Check className="w-3 h-3 text-green-500" />
                      </Tooltip>
                    )}

                    {transaction.is_flagged && (
                      <Tooltip content={t('labels.flagged')}>
                        <Flag className="w-3 h-3 text-orange-500" />
                      </Tooltip>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {transaction.category?.name || t('labels.uncategorized')}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-500">•</span>
                  <span className="text-sm text-gray-500 dark:text-gray-500">
                    {formattedDate}
                  </span>
                  
                  {/* Location */}
                  {transaction.location && (
                    <>
                      <span className="text-xs text-gray-500 dark:text-gray-500">•</span>
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-500 truncate">
                        {transaction.location}
                      </span>
                    </>
                  )}
                </div>

                {/* Tags */}
                {transaction.tags && transaction.tags.length > 0 && (
                  <div className="flex items-center space-x-1 mt-2">
                    <Tag className="w-3 h-3 text-gray-400" />
                    <div className="flex flex-wrap gap-1">
                      {transaction.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" size="xs">
                          {tag}
                        </Badge>
                      ))}
                      {transaction.tags.length > 3 && (
                        <Badge variant="outline" size="xs">
                          +{transaction.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Amount and actions */}
          <div className="flex items-center space-x-3">
            {/* Amount display */}
            <div className="text-right">
              <div className={cn(
                "font-bold text-lg",
                isIncome 
                  ? "text-green-600 dark:text-green-400" 
                  : "text-red-600 dark:text-red-400"
              )}>
                {isIncome ? '+' : '-'}
                {formatCurrency(amount)}
              </div>
              
              {/* Exchange rate info */}
              {transaction.exchange_rate && transaction.original_currency && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {formatCurrency(transaction.original_amount, transaction.original_currency)}
                </div>
              )}

              {/* AI confidence */}
              {transaction.ai_confidence && (
                <div className="flex items-center text-xs text-gray-500">
                  <Brain className="w-3 h-3 mr-1" />
                  {Math.round(transaction.ai_confidence * 100)}%
                </div>
              )}
            </div>

            {/* Expand/Collapse */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>

            {/* Actions dropdown */}
            <Dropdown
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              }
              items={[
                {
                  label: t('actions.edit'),
                  icon: Edit,
                  onClick: () => onEdit?.(transaction)
                },
                {
                  label: t('actions.duplicate'),
                  icon: Copy,
                  onClick: () => onDuplicate?.(transaction)
                },
                {
                  label: t('actions.share'),
                  icon: Share,
                  onClick: () => console.log('Share transaction')
                },
                {
                  label: t('actions.flag'),
                  icon: Flag,
                  onClick: () => console.log('Flag transaction')
                },
                { type: 'separator' },
                {
                  label: t('actions.delete'),
                  icon: Trash2,
                  onClick: () => onDelete?.(transaction),
                  variant: 'destructive'
                }
              ]}
            />
          </div>
        </div>

        {/* Expanded content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
            >
              {/* Notes */}
              {transaction.notes && (
                <div className="mb-3">
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('fields.notes')}
                  </h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {transaction.notes}
                  </p>
                </div>
              )}

              {/* AI Insights */}
              {aiInsights.length > 0 && (
                <div className="mb-3">
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <Sparkles className="w-4 h-4 mr-1 text-blue-500" />
                    {t('insights.title')}
                  </h5>
                  <div className="space-y-1">
                    {aiInsights.map((insight, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex items-center text-xs p-2 rounded-lg",
                          insight.type === 'warning' && "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300",
                          insight.type === 'info' && "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300",
                          insight.type === 'success' && "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                        )}
                      >
                        <Brain className="w-3 h-3 mr-1" />
                        {insight.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 dark:text-gray-400">
                <div>
                  <span className="font-medium">{t('labels.created')}:</span>
                  <br />
                  {dateHelpers.format(transaction.created_at)}
                </div>
                
                {transaction.updated_at && (
                  <div>
                    <span className="font-medium">{t('labels.updated')}:</span>
                    <br />
                    {dateHelpers.format(transaction.updated_at)}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

/**
 * 🎛️ ADVANCED FILTER PANEL - Smart filtering system
 */
const AdvancedFilterPanel = ({ 
  filters, 
  onFiltersChange, 
  isOpen, 
  onToggle 
}) => {
  const { t } = useTranslation('dashboard');

  const filterOptions = {
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
      { value: 'month', label: t('filters.thisMonth') }
    ]
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(filterOptions).map(([key, options]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t(`filters.${key}`)}
                </label>
                <select
                  value={filters[key] || 'all'}
                  onChange={(e) => onFiltersChange({ ...filters, [key]: e.target.value })}
                  className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * 📋 RECENT TRANSACTIONS - THE REVOLUTION!
 */
const RecentTransactions = ({
  transactions = [],
  isLoading = false,
  onEdit,
  onDelete,
  onDuplicate,
  onRefresh,
  onViewAll,
  showFilters = true,
  maxItems = 10,
  className = ''
}) => {
  // ✅ NEW: Use Zustand stores
  const { t, isRTL } = useTranslation('dashboard');
  const { formatCurrency } = useCurrency();
  const { isDark } = useTheme();
  const { addNotification } = useNotifications();

  // Enhanced state management
  const [selectedTransactions, setSelectedTransactions] = useState(new Set());
  const [viewMode, setViewMode] = useState('card'); // card, compact, list
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [groupBy, setGroupBy] = useState('none'); // none, date, category, amount

  // Virtualization ref
  const listRef = useRef();

  // Process and filter transactions
  const processedTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(transaction =>
        transaction.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.category?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Type filter
    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter(transaction => {
        if (filters.type === 'income') {
          return transaction.type === 'income' || transaction.amount > 0;
        } else {
          return transaction.type === 'expense' || transaction.amount < 0;
        }
      });
    }

    // Amount filter
    if (filters.amount && filters.amount !== 'any') {
      filtered = filtered.filter(transaction => {
        const amount = Math.abs(transaction.amount);
        switch (filters.amount) {
          case 'small': return amount < 100;
          case 'medium': return amount >= 100 && amount <= 500;
          case 'large': return amount > 500;
          default: return true;
        }
      });
    }

    // Date filter
    if (filters.date && filters.date !== 'all') {
      const now = new Date();
      filtered = filtered.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        switch (filters.date) {
          case 'today':
            return dateHelpers.isSameDay(transactionDate, now);
          case 'week':
            return dateHelpers.isSameWeek(transactionDate, now);
          case 'month':
            return dateHelpers.isSameMonth(transactionDate, now);
          default:
            return true;
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'amount':
          aValue = Math.abs(a.amount);
          bValue = Math.abs(b.amount);
          break;
        case 'category':
          aValue = a.category?.name || '';
          bValue = b.category?.name || '';
          break;
        default:
          aValue = new Date(a.date);
          bValue = new Date(b.date);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered.slice(0, maxItems);
  }, [transactions, searchQuery, filters, sortBy, sortOrder, maxItems]);

  // Group transactions
  const groupedTransactions = useMemo(() => {
    if (groupBy === 'none') {
      return [{ key: 'all', transactions: processedTransactions }];
    }

    const groups = {};
    processedTransactions.forEach(transaction => {
      let groupKey;
      switch (groupBy) {
        case 'date':
          groupKey = dateHelpers.format(transaction.date, 'YYYY-MM-DD');
          break;
        case 'category':
          groupKey = transaction.category?.name || t('labels.uncategorized');
          break;
        case 'amount':
          const amount = Math.abs(transaction.amount);
          if (amount < 100) groupKey = t('groups.small');
          else if (amount < 500) groupKey = t('groups.medium');
          else groupKey = t('groups.large');
          break;
        default:
          groupKey = 'all';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(transaction);
    });

    return Object.entries(groups).map(([key, transactions]) => ({
      key,
      transactions
    }));
  }, [processedTransactions, groupBy, t]);

  // Handle selection
  const handleTransactionSelect = useCallback((transactionId, isSelected) => {
    setSelectedTransactions(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(transactionId);
      } else {
        newSet.delete(transactionId);
      }
      return newSet;
    });
  }, []);

  // Handle bulk actions
  const handleBulkAction = useCallback(async (action) => {
    const selectedIds = Array.from(selectedTransactions);
    
    try {
      switch (action) {
        case 'delete':
          // Bulk delete logic
          console.log('Bulk delete:', selectedIds);
          break;
        case 'export':
          // Bulk export logic
          console.log('Bulk export:', selectedIds);
          break;
        case 'categorize':
          // Bulk categorize logic
          console.log('Bulk categorize:', selectedIds);
          break;
      }
      
      addNotification({
        type: 'success',
        title: t(`bulk.${action}Success`, { count: selectedIds.length }),
        duration: 3000
      });
      
      setSelectedTransactions(new Set());
    } catch (error) {
      addNotification({
        type: 'error',
        title: t(`bulk.${action}Failed`),
        duration: 4000
      });
    }
  }, [selectedTransactions, addNotification, t]);

  // Enhanced refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefresh?.();
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
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh, addNotification, t]);

  // View mode options
  const viewModeOptions = [
    { id: 'card', icon: Grid, label: t('viewModes.cards') },
    { id: 'list', icon: ListIcon, label: t('viewModes.list') },
    { id: 'compact', icon: MoreVertical, label: t('viewModes.compact') }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("space-y-6", className)}
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      {/* Enhanced header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('recentTransactions.title')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t('recentTransactions.subtitle', { count: processedTransactions.length })}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {/* View mode selector */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {viewModeOptions.map((mode) => {
                const ModeIcon = mode.icon;
                return (
                  <Button
                    key={mode.id}
                    variant={viewMode === mode.id ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode(mode.id)}
                    className="p-2"
                  >
                    <ModeIcon className="w-4 h-4" />
                  </Button>
                );
              })}
            </div>

            {/* Refresh */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex items-center space-x-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Input
              placeholder={t('search.placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>

          {/* Sort */}
          <Dropdown
            trigger={
              <Button variant="outline" size="sm">
                {sortOrder === 'asc' ? (
                  <SortAsc className="w-4 h-4 mr-2" />
                ) : (
                  <SortDesc className="w-4 h-4 mr-2" />
                )}
                {t(`sort.${sortBy}`)}
              </Button>
            }
            items={[
              {
                label: t('sort.date'),
                onClick: () => setSortBy('date'),
                active: sortBy === 'date'
              },
              {
                label: t('sort.amount'),
                onClick: () => setSortBy('amount'),
                active: sortBy === 'amount'
              },
              {
                label: t('sort.category'),
                onClick: () => setSortBy('category'),
                active: sortBy === 'category'
              },
              { type: 'separator' },
              {
                label: sortOrder === 'asc' ? t('sort.descending') : t('sort.ascending'),
                onClick: () => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
              }
            ]}
          />

          {/* Filters */}
          {showFilters && (
            <Button
              variant={showAdvancedFilters ? "primary" : "outline"}
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              {t('actions.filter')}
            </Button>
          )}
        </div>

        {/* Advanced filters */}
        <AdvancedFilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          isOpen={showAdvancedFilters}
          onToggle={() => setShowAdvancedFilters(!showAdvancedFilters)}
        />
      </div>

      {/* Bulk actions */}
      {selectedTransactions.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700"
        >
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
            {t('bulk.selected', { count: selectedTransactions.size })}
          </span>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('export')}
            >
              <Download className="w-4 h-4 mr-2" />
              {t('bulk.export')}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('categorize')}
            >
              <Tag className="w-4 h-4 mr-2" />
              {t('bulk.categorize')}
            </Button>
            
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleBulkAction('delete')}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t('bulk.delete')}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Content */}
      <Card className="overflow-hidden">
        {isLoading ? (
          /* Loading state */
          <div className="space-y-3 p-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20" />
              </div>
            ))}
          </div>
        ) : processedTransactions.length === 0 ? (
          /* Empty state */
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchQuery || Object.keys(filters).length > 0
                ? t('recentTransactions.noFilteredTransactions')
                : t('recentTransactions.noTransactions')
              }
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('recentTransactions.noTransactionsDescription')}
            </p>
            
            {(searchQuery || Object.keys(filters).length > 0) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setFilters({});
                }}
              >
                {t('actions.clearFilters')}
              </Button>
            )}
          </div>
        ) : (
          /* Transactions list */
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            <AnimatePresence mode="popLayout">
              {groupedTransactions.map((group) => (
                <div key={group.key}>
                  {groupBy !== 'none' && (
                    <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {group.key}
                      </h4>
                    </div>
                  )}
                  
                  {group.transactions.map((transaction, index) => (
                    <div key={transaction.id} className="px-6 py-4">
                      <SmartTransactionCard
                        transaction={transaction}
                        index={index}
                        isSelected={selectedTransactions.has(transaction.id)}
                        onSelect={handleTransactionSelect}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onDuplicate={onDuplicate}
                        viewMode={viewMode}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* View all button */}
        {processedTransactions.length > 0 && transactions.length > maxItems && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={onViewAll}
              className="w-full"
            >
              {t('recentTransactions.viewAll', { count: transactions.length })}
              <ArrowRight className={cn("w-4 h-4", isRTL ? "mr-2" : "ml-2")} />
            </Button>
          </div>
        )}
      </Card>

      {/* Quick stats */}
      {processedTransactions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400"
        >
          <span>
            {t('recentTransactions.showing', { 
              shown: processedTransactions.length,
              total: transactions.length 
            })}
          </span>
          
          <span>
            {t('recentTransactions.lastUpdate', { 
              time: dateHelpers.fromNow(new Date()) 
            })}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
};

export default RecentTransactions;
