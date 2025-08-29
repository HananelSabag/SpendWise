/**
 * 🚀 MODERN TRANSACTIONS PAGE - Revolutionary UI/UX Design
 * Features: Stunning visuals, Perfect animations, Mobile-first, Advanced filtering
 * Visual differences for recurring vs one-time, Comprehensive functionality
 * @version 1.0.0 - REVOLUTIONARY DESIGN
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Filter, ArrowLeftRight, TrendingUp, TrendingDown,
  RefreshCw, DollarSign, Download, Edit, Trash2, ArrowUpDown,
  X, CheckCircle, AlertCircle, MoreVertical, Calendar, Clock,
  Repeat, Zap, Eye, EyeOff, BarChart3, Grid3X3, List,
  SortAsc, SortDesc, Users, Target, Settings, Sparkles,
  CreditCard, Receipt, PiggyBank, Wallet, ArrowUp, ArrowDown,
  ChevronDown, ChevronUp, FilterX, Layers, Archive, AlertTriangle
} from 'lucide-react';

// ✅ Import Zustand stores
import { 
  useAuth, useTranslation, useCurrency, useNotifications, useTheme 
} from '../stores';

// API, hooks and components
import { useTransactions } from '../hooks/useTransactions';
import { useTransactionActions } from '../hooks/useTransactionActions';
import { useCategory } from '../hooks/useCategory';
import { 
  Button, Input, Card, LoadingSpinner, Badge, Avatar,
  Tooltip, Switch
} from '../components/ui';

// Transaction components
import ModernTransactionCard from '../components/features/transactions/ModernTransactionCard';
import ModernUpcomingTransactions from '../components/features/transactions/ModernUpcomingTransactions';
import ModernRecurringTransactions from '../components/features/transactions/ModernRecurringTransactions';
import AddTransactionModal from '../components/features/transactions/modals/AddTransactionModal';
import EditTransactionModal from '../components/features/transactions/modals/EditTransactionModal';
import RecurringSetupModal from '../components/features/transactions/modals/RecurringSetupModal';
import DeleteTransaction from '../components/features/transactions/DeleteTransaction';
import FloatingAddTransactionButton from '../components/common/FloatingAddTransactionButton.jsx';
import UnifiedRecurringControlCenter from '../components/features/transactions/recurring/UnifiedRecurringControlCenter';
import useAutoRegeneration from '../hooks/useAutoRegeneration';

import { cn } from '../utils/helpers';

// ✨ Enhanced Animation Variants
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1],
      staggerChildren: 0.1
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: { duration: 0.4 }
  }
};

const headerVariants = {
  initial: { opacity: 0, y: -40, scale: 0.95 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      duration: 0.7,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
};

const cardVariants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1]
    }
  },
  hover: {
    y: -4,
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
};

const filterVariants = {
  initial: { opacity: 0, height: 0, scale: 0.95 },
  animate: { 
    opacity: 1, 
    height: 'auto', 
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1]
    }
  },
  exit: { 
    opacity: 0, 
    height: 0, 
    scale: 0.95,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
};

// ✨ Modern Stats Card Component
const ModernStatsCard = ({ title, value, change, icon: Icon, color = 'blue', trend }) => {
  const { formatCurrency } = useCurrency();
  const isPositive = trend === 'up';
  
  return (
    <motion.div
      variants={cardVariants}
      whileHover="hover"
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 shadow-xl border-2",
        "bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900",
        "border-gray-200 dark:border-gray-700",
        "hover:shadow-2xl transition-all duration-300"
      )}
    >
      {/* Gradient Background */}
      <div className={cn(
        "absolute inset-0 opacity-5",
        color === 'green' && "bg-gradient-to-br from-green-400 to-emerald-600",
        color === 'red' && "bg-gradient-to-br from-red-400 to-rose-600",
        color === 'blue' && "bg-gradient-to-br from-blue-400 to-indigo-600",
        color === 'purple' && "bg-gradient-to-br from-purple-400 to-violet-600"
      )} />
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {typeof value === 'number' ? formatCurrency(value) : value}
          </p>
          {change && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium",
              isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            )}>
              {isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{change}</span>
            </div>
          )}
        </div>
        
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg",
          color === 'green' && "bg-gradient-to-br from-green-500 to-emerald-600 text-white",
          color === 'red' && "bg-gradient-to-br from-red-500 to-rose-600 text-white",
          color === 'blue' && "bg-gradient-to-br from-blue-500 to-indigo-600 text-white",
          color === 'purple' && "bg-gradient-to-br from-purple-500 to-violet-600 text-white"
        )}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
};

// ✨ Advanced Filter Component
const AdvancedFilters = ({ 
  filters, 
  onFilterChange, 
  onClear, 
  categories, 
  showRecurringFilter = true 
}) => {
  const { t } = useTranslation();
  
  return (
    <motion.div
      variants={filterVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
            <Filter className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('transactions.advancedFilters', 'Advanced Filters')}
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <FilterX className="w-4 h-4 mr-2" />
          {t('actions.clearAll', 'Clear All')}
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Date Range */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('filters.dateRange.label', 'Date Range')}
          </label>
          <select
            value={filters.dateRange}
            onChange={(e) => onFilterChange({ dateRange: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
          >
            <option value="all">{t('filters.dateRange.all', 'All Time')}</option>
            <option value="today">{t('filters.dateRange.today', 'Today')}</option>
            <option value="week">{t('filters.dateRange.week', 'This Week')}</option>
            <option value="month">{t('filters.dateRange.month', 'This Month')}</option>
            <option value="quarter">{t('filters.dateRange.quarter', 'This Quarter')}</option>
            <option value="year">{t('filters.dateRange.year', 'This Year')}</option>
          </select>
        </div>

        {/* Transaction Type */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('filters.type.label', 'Type')}
          </label>
          <select
            value={filters.type}
            onChange={(e) => onFilterChange({ type: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
          >
            <option value="all">{t('filters.type.all', 'All Types')}</option>
            <option value="income">{t('transactions.types.income', 'Income')}</option>
            <option value="expense">{t('transactions.types.expense', 'Expense')}</option>
          </select>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('filters.category.label', 'Category')}
          </label>
          <select
            value={filters.category}
            onChange={(e) => onFilterChange({ category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
          >
            <option value="all">{t('filters.category.all', 'All Categories')}</option>
            {categories?.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Recurring Filter */}
        {showRecurringFilter && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('filters.recurring.label', 'Recurring Status')}
            </label>
            <select
              value={filters.recurring || 'all'}
              onChange={(e) => onFilterChange({ recurring: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="all">{t('filters.recurring.all', 'All Transactions')}</option>
              <option value="recurring">{t('filters.recurring.recurring', 'Recurring Only')}</option>
              <option value="oneTime">{t('filters.recurring.oneTime', 'One-Time Only')}</option>
            </select>
          </div>
        )}
      </div>

      {/* Amount Range */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
          {t('filters.amountRange', 'Amount Range')}
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Input
              type="number"
              placeholder={t('filters.minAmount', 'Min Amount')}
              value={filters.amountMin}
              onChange={(e) => onFilterChange({ amountMin: e.target.value })}
            />
          </div>
          <div>
            <Input
              type="number"
              placeholder={t('filters.maxAmount', 'Max Amount')}
              value={filters.amountMax}
              onChange={(e) => onFilterChange({ amountMax: e.target.value })}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ✨ Modern Transaction List Component
// ✨ Modern Day Header Component
const ModernDayHeader = ({ title, date, totalIncome, totalExpenses, count }) => {
  const { formatCurrency } = useCurrency();
  const { t } = useTranslation();
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 mb-4 sticky top-0 z-10"
    >
      <div className="flex items-start sm:items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
          <Calendar className="w-5 h-5" />
        </div>
        
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg">{title}</h3>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <Badge variant="outline" className="bg-white dark:bg-gray-800 whitespace-nowrap">
              {count} {t('transactions.count', 'transactions')}
            </Badge>
            
            {totalIncome > 0 && (
              <span className="text-sm font-medium text-green-600 dark:text-green-400 whitespace-nowrap tabular-nums">
                +{formatCurrency(totalIncome)}
              </span>
            )}
            
            {totalExpenses > 0 && (
              <span className="text-sm font-medium text-red-600 dark:text-red-400 whitespace-nowrap tabular-nums">
                -{formatCurrency(totalExpenses)}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="text-right shrink-0 ml-2">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {t('transactions.net', 'Net')}
        </div>
        <div className={cn(
          "font-semibold whitespace-nowrap tabular-nums text-base sm:text-lg",
          totalIncome - totalExpenses >= 0 
            ? "text-green-600 dark:text-green-400" 
            : "text-red-600 dark:text-red-400"
        )}>
          {totalIncome - totalExpenses >= 0 ? '+' : ''}{formatCurrency(totalIncome - totalExpenses)}
        </div>
      </div>
    </motion.div>
  );
};

const ModernTransactionsList = ({ 
  transactions, 
  loading, 
  viewMode, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  selectedIds, 
  onSelect, 
  multiSelectMode 
}) => {
  const { t, isRTL } = useTranslation();
  
  // ✨ Group transactions by day
  const groupedTransactions = useMemo(() => {
    if (!transactions || !Array.isArray(transactions)) return {};
    
    // Sort transactions by date (newest first)
    const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return sorted.reduce((groups, transaction) => {
      const date = new Date(transaction.date);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let groupKey;
      let groupTitle;
      
      if (date.toDateString() === today.toDateString()) {
        groupKey = 'today';
        groupTitle = t('common.date.today', 'Today');
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = 'yesterday';
        groupTitle = t('common.date.yesterday', 'Yesterday');
      } else {
        // Use the date as key for other days
        groupKey = date.toDateString();
        groupTitle = date.toLocaleDateString(isRTL ? 'he-IL' : 'en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
          year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = {
          title: groupTitle,
          date: date,
          transactions: [],
          totalIncome: 0,
          totalExpenses: 0,
          count: 0
        };
      }
      
      groups[groupKey].transactions.push(transaction);
      groups[groupKey].count += 1;
      
      if (transaction.type === 'income') {
        groups[groupKey].totalIncome += Math.abs(transaction.amount);
      } else {
        groups[groupKey].totalExpenses += Math.abs(transaction.amount);
      }
      
      return groups;
    }, {});
  }, [transactions, t, isRTL]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {t('transactions.loading', 'Loading transactions...')}
          </p>
        </motion.div>
      </div>
    );
  }

  if (!transactions?.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-20"
      >
        <div className="w-20 h-20 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
          <Receipt className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {t('transactions.empty.title', 'No Transactions Found')}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          {t('transactions.empty.description', 'Start tracking your finances by adding your first transaction.')}
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <AnimatePresence mode="popLayout">
        {Object.entries(groupedTransactions).map(([groupKey, group], groupIndex) => (
          <motion.div
            key={groupKey}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ 
              duration: 0.4, 
              delay: groupIndex * 0.1,
              layout: { duration: 0.3 }
            }}
            className="space-y-4"
          >
            {/* Day Header */}
            <ModernDayHeader
              title={group.title}
              date={group.date}
              totalIncome={group.totalIncome}
              totalExpenses={group.totalExpenses}
              count={group.count}
            />
            
            {/* Transactions for this day */}
            <div className={cn(
              "space-y-3 pl-3 sm:pl-4", // compact padding on mobile
              viewMode === 'grid' && "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 space-y-0 pl-0"
            )}>
              <AnimatePresence mode="popLayout">
                {group.transactions.map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ 
                      duration: 0.3, 
                      delay: index * 0.05,
                      layout: { duration: 0.3 }
                    }}
                  >
                    <ModernTransactionCard
                      transaction={transaction}
                      onEdit={() => onEdit(transaction)}
                      onDelete={() => onDelete(transaction)}
                      onDuplicate={() => onDuplicate(transaction)}
                      isSelected={selectedIds?.has(transaction.id)}
                      onSelect={multiSelectMode ? onSelect : undefined}
                      viewMode={viewMode}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// 🚀 MAIN MODERN TRANSACTIONS COMPONENT
const ModernTransactions = () => {
  // ✅ Zustand stores
  const { user } = useAuth();
  const { t, isRTL } = useTranslation();
  const { formatCurrency } = useCurrency();
  const { addNotification } = useNotifications();
  const { isDark } = useTheme();

  // ✅ State management
  const [activeTab, setActiveTab] = useState('all'); // all | upcoming | recurring
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRecurringManager, setShowRecurringManager] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [modalMode, setModalMode] = useState('create');
  const [viewMode, setViewMode] = useState('list'); // list | grid
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // ✅ Filter states with enhanced recurring support
  const [filters, setFilters] = useState({
    dateRange: 'all',
    category: 'all',
    type: 'all',
    recurring: 'all', // all | recurring | oneTime
    amountMin: '',
    amountMax: '',
    sortBy: 'date',
    sortOrder: 'desc'
  });

  // ✅ Custom date range
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // ✅ Hooks
  const {
    transactions: transactionsData,
    loading: transactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions,
    hasNextPage: hasMore,
    fetchNextPage: loadMore
  } = useTransactions({
    search: searchQuery,
    filters: {
      ...filters,
      ...(filters.dateRange === 'custom' ? customDateRange : {})
    },
    limit: 50
  });

  const {
    createTransaction,
    updateTransaction,
    deleteTransaction,
    bulkDelete
  } = useTransactionActions();

  const { categories } = useCategory();

  const {
    regenerationStatus,
    isRegenerating,
    triggerRegeneration
  } = useAutoRegeneration();

  // ✅ Processed transactions with recurring/one-time distinction (ONLY current and past)
  const transactions = useMemo(() => {
    if (!transactionsData || !Array.isArray(transactionsData)) return [];
    
    const now = new Date();
    now.setHours(23, 59, 59, 999); // End of today
    
    let filtered = transactionsData
      // ✅ FILTER OUT FUTURE TRANSACTIONS - only show current and past
      .filter(t => new Date(t.date) <= now);
    
    // Apply recurring filter
    if (filters.recurring === 'recurring') {
      filtered = filtered.filter(t => t.template_id || t.is_recurring);
    } else if (filters.recurring === 'oneTime') {
      filtered = filtered.filter(t => !t.template_id && !t.is_recurring);
    }
    
    return filtered;
  }, [transactionsData, filters.recurring]);

  // ✅ Enhanced summary with recurring insights
  const summary = useMemo(() => {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    // ✅ Enhanced recurring detection - also check for 'recurring' template names
    const recurringTransactions = transactions.filter(t => 
      t.template_id || 
      t.is_recurring || 
      t.category_name?.toLowerCase().includes('recurring') ||
      t.description?.toLowerCase().includes('recurring')
    );
    
    const recurringCount = recurringTransactions.length;
    const oneTimeCount = transactions.length - recurringCount;
    
    // Debug logging to help identify recurring transactions
    if (transactions.length > 0) {
      console.log('📊 Transaction Summary Debug:', {
        totalTransactions: transactions.length,
        recurringCount,
        oneTimeCount,
        sampleTransactions: transactions.slice(0, 3).map(t => ({
          id: t.id,
          description: t.description,
          template_id: t.template_id,
          is_recurring: t.is_recurring,
          category_name: t.category_name
        }))
      });
    }
    
    return {
      totalIncome,
      totalExpenses,
      netAmount: totalIncome - totalExpenses,
      count: transactions.length,
      recurringCount,
      oneTimeCount,
      recurringPercentage: transactions.length > 0 ? (recurringCount / transactions.length) * 100 : 0
    };
  }, [transactions]);

  // ✅ Event handlers
  const handleTransactionSuccess = useCallback((transaction) => {
    refetchTransactions();
    addNotification({
      type: 'success',
      message: t('notifications.transactionUpdated', 'Transaction updated successfully'),
      duration: 3000
    });
  }, [refetchTransactions, addNotification, t]);

  // ✅ Handle delete success
  const handleDeleteSuccess = useCallback(async (transactionId, options) => {
    try {
      await deleteTransaction(transactionId, options);
      refetchTransactions();
      addNotification({
        type: 'success',
        message: t('notifications.transactionDeleted', 'Transaction deleted successfully'),
        duration: 3000
      });
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      addNotification({
        type: 'error',
        message: error.message || t('errors.deletingFailed', 'Failed to delete transaction'),
        duration: 4000
      });
    }
  }, [deleteTransaction, refetchTransactions, addNotification, t]);

  const handleAddTransaction = useCallback(() => {
    setShowAddTransaction(true);
  }, []);

  const handleEditTransaction = useCallback((transaction, mode = 'edit') => {
    setSelectedTransaction(transaction);
    setModalMode(mode);
    setShowEditModal(true);
  }, []);

  const handleDeleteTransaction = useCallback((transaction) => {
    setSelectedTransaction(transaction);
    setShowDeleteModal(true);
  }, []);

  const handleDuplicateTransaction = useCallback((transaction) => {
    handleEditTransaction(transaction, 'duplicate');
  }, [handleEditTransaction]);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      dateRange: 'all',
      category: 'all',
      type: 'all',
      recurring: 'all',
      amountMin: '',
      amountMax: '',
      sortBy: 'date',
      sortOrder: 'desc'
    });
    setSearchQuery('');
  }, []);

  const handleTransactionSelect = useCallback((id, selected) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  }, []);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950"
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      {/* ✨ Enhanced Header */}
      <motion.div
        variants={headerVariants}
        className="sticky top-0 z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Enhanced Title */}
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0.8, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="relative"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <ArrowLeftRight className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </motion.div>
              
              <div>
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent"
                >
                  {t('transactions.title', 'Transactions')}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-sm text-gray-600 dark:text-gray-400 mt-1"
                >
                  {t('transactions.subtitle', 'Manage your financial transactions')} • {summary.count} {t('transactions.total', 'total')}
                </motion.p>
              </div>
            </div>

            {/* Enhanced Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-3"
            >
              {/* Auto-Regeneration Status */}
              <AnimatePresence>
                {isRegenerating && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-800"
                  >
                    <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                      {t('transactions.autoGenerating', 'Auto-generating...')}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                onClick={handleAddTransaction}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('actions.add', 'Add')}
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ✨ Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ✨ Enhanced Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <ModernStatsCard
            title={t('transactions.stats.totalTransactions', 'Total Transactions')}
            value={summary.count}
            icon={Receipt}
            color="blue"
          />
          <ModernStatsCard
            title={t('transactions.stats.totalIncome', 'Total Income')}
            value={summary.totalIncome}
            icon={TrendingUp}
            color="green"
            trend="up"
          />
          <ModernStatsCard
            title={t('transactions.stats.totalExpenses', 'Total Expenses')}
            value={summary.totalExpenses}
            icon={TrendingDown}
            color="red"
            trend="down"
          />
          <ModernStatsCard
            title={t('transactions.stats.recurringTransactions', 'Recurring')}
            value={`${summary.recurringCount} (${Math.round(summary.recurringPercentage)}%)`}
            icon={Repeat}
            color="purple"
          />
        </motion.div>

        {/* ✨ Enhanced Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-8"
        >
          <div className="w-full">
            <div className="grid w-full grid-cols-3 bg-white dark:bg-gray-800 rounded-2xl p-1 shadow-lg border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('all')}
                className={cn(
                  "rounded-xl px-4 py-3 flex items-center justify-center gap-2 font-medium transition-all duration-200",
                  activeTab === 'all'
                    ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
              >
                <List className="w-4 h-4" />
                {t('transactions.tabs.all', 'All Transactions')}
              </button>
              <button
                onClick={() => setActiveTab('upcoming')}
                className={cn(
                  "rounded-xl px-4 py-3 flex items-center justify-center gap-2 font-medium transition-all duration-200",
                  activeTab === 'upcoming'
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
              >
                <Calendar className="w-4 h-4" />
                {t('transactions.tabs.upcoming', 'Upcoming')}
              </button>
              <button
                onClick={() => setActiveTab('recurring')}
                className={cn(
                  "rounded-xl px-4 py-3 flex items-center justify-center gap-2 font-medium transition-all duration-200",
                  activeTab === 'recurring'
                    ? "bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
              >
                <Repeat className="w-4 h-4" />
                {t('transactions.tabs.recurring', 'Recurring')}
              </button>
            </div>

            {/* ✨ All Transactions Content */}
            {activeTab === 'all' && (
              <div className="mt-8 space-y-6">
              {/* ✨ Enhanced Search and Controls */}
              <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-xl">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="text"
                        placeholder={t('search.placeholder', 'Search transactions...')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 h-12 rounded-xl border-2 focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex gap-3">
                    <Button
                      variant={showFilters ? 'default' : 'outline'}
                      onClick={() => setShowFilters(!showFilters)}
                      className="h-12 px-6 rounded-xl"
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      {t('actions.filters', 'Filters')}
                    </Button>

                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                      className="h-12 px-4 rounded-xl"
                    >
                      {viewMode === 'list' ? (
                        <Grid3X3 className="w-4 h-4" />
                      ) : (
                        <List className="w-4 h-4" />
                      )}
                    </Button>

                    <Button
                      variant={multiSelectMode ? 'default' : 'outline'}
                      onClick={() => {
                        setMultiSelectMode(!multiSelectMode);
                        if (!multiSelectMode) setSelectedIds(new Set());
                      }}
                      className="h-12 px-6 rounded-xl"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {t('actions.select', 'Select')}
                    </Button>
                  </div>
                </div>

                {/* Clear Filters */}
                <AnimatePresence>
                  {(searchQuery || Object.values(filters).some(f => f !== 'all' && f !== '')) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
                    >
                      <Button
                        variant="ghost"
                        onClick={clearFilters}
                        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        <X className="w-4 h-4 mr-2" />
                        {t('actions.clearFilters', 'Clear all filters')}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>

              {/* ✨ Advanced Filters */}
              <AnimatePresence>
                {showFilters && (
                  <AdvancedFilters
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onClear={clearFilters}
                    categories={categories}
                    showRecurringFilter={true}
                  />
                )}
              </AnimatePresence>

              {/* ✨ Bulk Selection Toolbar */}
              <AnimatePresence>
                {multiSelectMode && selectedIds.size > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-xl flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-blue-900 dark:text-blue-100">
                            {selectedIds.size} {t('transactions.selected', 'selected')}
                          </p>
                          <p className="text-sm text-blue-600 dark:text-blue-400">
                            {t('transactions.bulkActions', 'Choose an action to apply to selected transactions')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedIds(new Set())}
                        >
                          {t('actions.clearSelection', 'Clear')}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (selectedIds.size === 0) return;
                            setShowBulkDeleteModal(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {t('actions.delete', 'Delete')}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ✨ Transactions List */}
              <Card className="overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-xl">
                <div className="p-6">
                  <ModernTransactionsList
                    transactions={transactions}
                    loading={transactionsLoading}
                    viewMode={viewMode}
                    onEdit={handleEditTransaction}
                    onDelete={handleDeleteTransaction}
                    onDuplicate={handleDuplicateTransaction}
                    selectedIds={selectedIds}
                    onSelect={handleTransactionSelect}
                    multiSelectMode={multiSelectMode}
                  />
                </div>
              </Card>
              </div>
            )}

            {/* ✨ Upcoming Transactions Content */}
            {activeTab === 'upcoming' && (
              <div className="mt-8">
                <ModernUpcomingTransactions 
                  onOpenRecurringManager={() => setShowRecurringManager(true)}
                />
              </div>
            )}

            {/* ✨ Recurring Transactions Content */}
            {activeTab === 'recurring' && (
              <div className="mt-8">
                <ModernRecurringTransactions 
                  onOpenRecurringManager={(template) => {
                    if (template) {
                      setSelectedTransaction(template);
                      setModalMode(template.id ? 'edit' : 'duplicate');
                    } else {
                      setSelectedTransaction(null);
                      setModalMode('create');
                    }
                    setShowRecurringManager(true);
                  }}
                />
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ✨ Modals */}
      <AddTransactionModal
        isOpen={showAddTransaction}
        onClose={() => setShowAddTransaction(false)}
        onSuccess={handleTransactionSuccess}
      />

      <EditTransactionModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTransaction(null);
        }}
        onSuccess={handleTransactionSuccess}
        onDelete={handleDeleteTransaction}
        onDuplicate={handleDuplicateTransaction}
        transaction={selectedTransaction}
        mode={modalMode}
      />

      <RecurringSetupModal
        isOpen={showRecurringModal}
        onClose={() => {
          setShowRecurringModal(false);
          setSelectedTransaction(null);
        }}
        onSuccess={handleTransactionSuccess}
        initialData={selectedTransaction}
        mode={modalMode}
      />

      {showDeleteModal && selectedTransaction && (
        <DeleteTransaction
          isOpen={showDeleteModal}
          transaction={selectedTransaction}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedTransaction(null);
          }}
          onSuccess={handleDeleteSuccess}
        />
      )}

      {/* 🎛️ Unified Recurring Control Center - NO TABS! */}
      <UnifiedRecurringControlCenter 
        isOpen={showRecurringManager} 
        onClose={() => setShowRecurringManager(false)} 
      />

      {/* 🗑️ NICE Bulk Delete Modal - NO MORE UGLY ALERTS! */}
      {showBulkDeleteModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowBulkDeleteModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('bulk.delete.title', 'Delete Transactions')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedIds.size} {t('bulk.delete.count', selectedIds.size === 1 ? 'transaction' : 'transactions')}
                </p>
              </div>
            </div>

            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
              <div className="flex items-center text-red-800 dark:text-red-200">
                <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
                <p className="text-sm">
                  {t('bulk.delete.warning', 'This action cannot be undone. All selected transactions will be permanently deleted.')}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => setShowBulkDeleteModal(false)}
                className="flex-1"
              >
                {t('actions.cancel', 'Cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  try {
                    await bulkDelete(Array.from(selectedIds));
                    setSelectedIds(new Set());
                    setShowBulkDeleteModal(false);
                    addNotification({
                      type: 'success',
                      message: t('bulk.delete.success', `Successfully deleted ${selectedIds.size} transactions`),
                      duration: 5000
                    });
                  } catch (error) {
                    console.error('Bulk delete failed:', error);
                    addNotification({
                      type: 'error',
                      message: t('bulk.delete.error', 'Failed to delete transactions. Please try again.'),
                      duration: 5000
                    });
                  }
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 border-red-600 hover:border-red-700 text-white"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t('bulk.delete.confirm', 'Delete All')}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ✨ Floating Add Button */}
      <FloatingAddTransactionButton />
    </motion.div>
  );
};

export default ModernTransactions;
