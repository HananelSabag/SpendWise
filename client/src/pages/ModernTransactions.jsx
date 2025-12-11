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
  ChevronDown, ChevronUp, FilterX, Layers, Archive, AlertTriangle,
  Loader2
} from 'lucide-react';

// ✅ Import Zustand stores
import { 
  useAuth, useTranslation, useCurrency, useNotifications, useTheme 
} from '../stores';

// API, hooks and components
import { useTransactions } from '../hooks/useTransactions';
import { useTransactionActions } from '../hooks/useTransactionActions';
import { useCategory } from '../hooks/useCategory';
import { useRecurringTransactions } from '../hooks/useRecurringTransactions';
import { 
  Button, Input, Card, LoadingSpinner, Badge, Avatar,
  Tooltip, Switch
} from '../components/ui';

// Transaction components
import ModernTransactionCard from '../components/features/transactions/ModernTransactionCard';
import ModernUpcomingTransactions from '../components/features/transactions/ModernUpcomingTransactions';
import ModernRecurringTransactions from '../components/features/transactions/ModernRecurringTransactions';
import FutureTransactionsCollapsible from '../components/features/transactions/FutureTransactionsCollapsible';
import QuickMonthSelector from '../components/features/transactions/QuickMonthSelector';
import AddTransactionModal from '../components/features/transactions/modals/AddTransactionModal';
import EditTransactionModal from '../components/features/transactions/modals/EditTransactionModal';
import RecurringSetupModal from '../components/features/transactions/modals/RecurringSetupModal';
import DeleteTransaction from '../components/features/transactions/DeleteTransaction';
import FloatingAddTransactionButton from '../components/common/FloatingAddTransactionButton.jsx';
import ModernRecurringManagerPanel from '../components/features/transactions/recurring/ModernRecurringManagerPanel';
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
        "relative overflow-hidden rounded-2xl p-3 sm:p-6 shadow-lg border-2",
        "bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900",
        "border-gray-200 dark:border-gray-700",
        "hover:shadow-xl transition-all duration-300"
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
          <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
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
          "w-8 h-8 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-lg",
          color === 'green' && "bg-gradient-to-br from-green-500 to-emerald-600 text-white",
          color === 'red' && "bg-gradient-to-br from-red-500 to-rose-600 text-white",
          color === 'blue' && "bg-gradient-to-br from-blue-500 to-indigo-600 text-white",
          color === 'purple' && "bg-gradient-to-br from-purple-500 to-violet-600 text-white"
        )}>
          <Icon className="w-4 h-4 sm:w-6 sm:h-6" />
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
      <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shrink-0">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">
              {t('transactions.advancedFilters', 'Filters')}
            </h3>
            {(() => {
              const activeCount = [
                filters.type !== 'all',
                filters.category !== 'all',
                filters.recurring !== 'all',
                filters.amountMin,
                filters.amountMax
              ].filter(Boolean).length;
              return activeCount > 0 && (
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  {activeCount} {activeCount === 1 ? 'filter' : 'filters'} active
                </p>
              );
            })()}
          </div>
        </div>
        {(() => {
          const hasActiveFilters = [
            filters.type !== 'all',
            filters.category !== 'all',
            filters.recurring !== 'all',
            filters.amountMin,
            filters.amountMax
          ].some(Boolean);
          return hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs sm:text-sm shrink-0"
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{t('actions.clearAll', 'Clear')}</span>
              <span className="sm:hidden">Clear</span>
            </Button>
          );
        })()}
      </div>
      
      <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {/* Transaction Type */}
        <div className="space-y-2">
          <label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1 sm:gap-2">
            <ArrowLeftRight className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
            <span>{t('filters.type.label', 'Type')}</span>
            {filters.type !== 'all' && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-indigo-600 rounded-full shrink-0 animate-pulse" />}
          </label>
          <select
            value={filters.type}
            onChange={(e) => onFilterChange({ type: e.target.value })}
            className={cn(
              "w-full px-3 py-2 border-2 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all text-xs sm:text-sm font-medium",
              filters.type !== 'all' 
                ? "border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/10"
                : "border-gray-300 dark:border-gray-600"
            )}
          >
            <option value="all">{t('filters.type.all', 'All Types')}</option>
            <option value="income">💰 {t('transactions.types.income', 'Income')}</option>
            <option value="expense">💸 {t('transactions.types.expense', 'Expense')}</option>
          </select>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1 sm:gap-2">
            <Layers className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
            <span>{t('filters.category.label', 'Category')}</span>
            {filters.category !== 'all' && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-indigo-600 rounded-full shrink-0 animate-pulse" />}
          </label>
          <select
            value={filters.category}
            onChange={(e) => onFilterChange({ category: e.target.value })}
            className={cn(
              "w-full px-3 py-2 border-2 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all text-xs sm:text-sm font-medium",
              filters.category !== 'all' 
                ? "border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/10"
                : "border-gray-300 dark:border-gray-600"
            )}
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
            <label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1 sm:gap-2">
              <Repeat className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
              <span>{t('filters.recurring.label', 'Type')}</span>
              {filters.recurring !== 'all' && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-indigo-600 rounded-full shrink-0 animate-pulse" />}
            </label>
            <select
              value={filters.recurring || 'all'}
              onChange={(e) => onFilterChange({ recurring: e.target.value })}
              className={cn(
                "w-full px-3 py-2 border-2 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all text-xs sm:text-sm font-medium",
                filters.recurring !== 'all' 
                  ? "border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/10"
                  : "border-gray-300 dark:border-gray-600"
              )}
            >
              <option value="all">{t('filters.recurring.all', 'All')}</option>
              <option value="recurring">🔄 {t('filters.recurring.recurring', 'Recurring')}</option>
              <option value="oneTime">⚡ {t('filters.recurring.oneTime', 'One-Time')}</option>
            </select>
          </div>
        )}
      </div>

      {/* Amount Range */}
      <div className="mt-3 sm:mt-4 md:mt-6 pt-3 sm:pt-4 md:pt-6 border-t-2 border-gray-300 dark:border-gray-600">
        <label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3 flex items-center gap-1 sm:gap-2">
          <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
          <span>{t('filters.amountRange', 'Amount Range')}</span>
          {(filters.amountMin || filters.amountMax) && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-indigo-600 rounded-full shrink-0 animate-pulse" />}
        </label>
        <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-2">
          <Input
            type="number"
            placeholder={t('filters.minAmount', 'Min')}
            value={filters.amountMin}
            onChange={(e) => onFilterChange({ amountMin: e.target.value })}
            className={cn(
              "text-xs sm:text-sm font-medium",
              filters.amountMin && "border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/10"
            )}
          />
          <Input
            type="number"
            placeholder={t('filters.maxAmount', 'Max')}
            value={filters.amountMax}
            onChange={(e) => onFilterChange({ amountMax: e.target.value })}
            className={cn(
              "text-xs sm:text-sm font-medium",
              filters.amountMax && "border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/10"
            )}
          />
        </div>
      </div>
    </motion.div>
  );
};

// ✨ Modern Transaction List Component
// ✨ Modern Month Header Component
const ModernMonthHeader = ({ title, totalIncome, totalExpenses, count }) => {
  const { formatCurrency } = useCurrency();
  const { t } = useTranslation();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between gap-3 p-4 mb-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/30 dark:via-purple-900/30 dark:to-pink-900/30 rounded-xl border-2 border-indigo-200 dark:border-indigo-700 shadow-md sticky top-0 z-20 backdrop-blur-sm"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">
          <Calendar className="w-5 h-5" />
        </div>
        
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg">{title}</h2>
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <Badge variant="secondary" className="bg-white dark:bg-gray-800">
              {count} {t('transactions.count', 'transactions')}
            </Badge>
          </div>
        </div>
      </div>
      
      <div className="text-right shrink-0">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
          {t('transactions.monthTotal', 'Month Total')}
        </div>
        <div className="space-y-0.5">
          {totalIncome > 0 && (
            <div className="text-sm font-semibold text-green-600 dark:text-green-400 tabular-nums">
              +{formatCurrency(totalIncome)}
            </div>
          )}
          {totalExpenses > 0 && (
            <div className="text-sm font-semibold text-red-600 dark:text-red-400 tabular-nums">
              -{formatCurrency(totalExpenses)}
            </div>
          )}
        </div>
        <div className={cn(
          "text-sm font-bold mt-1 pt-1 border-t border-gray-300 dark:border-gray-600 tabular-nums",
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

// ✨ Modern Day Header Component
const ModernDayHeader = ({ title, date, totalIncome, totalExpenses, count }) => {
  const { formatCurrency } = useCurrency();
  const { t } = useTranslation();
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between gap-2 p-2 sm:p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 mb-2 sm:mb-3 sticky top-0 z-10"
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg">
          <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
        </div>
        
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm truncate">{title}</h3>
          <div className="flex items-center gap-1 sm:gap-2 text-xs">
            <Badge variant="outline" className="bg-white dark:bg-gray-800 text-xs px-1 py-0">
              {count}
            </Badge>
            
            {totalIncome > 0 && (
              <span className="font-medium text-green-600 dark:text-green-400 tabular-nums">
                +{formatCurrency(totalIncome)}
              </span>
            )}
            
            {totalExpenses > 0 && (
              <span className="font-medium text-red-600 dark:text-red-400 tabular-nums">
                -{formatCurrency(totalExpenses)}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="text-right shrink-0">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {t('transactions.net', 'Net')}
        </div>
        <div className={cn(
          "font-bold whitespace-nowrap tabular-nums text-xs sm:text-sm",
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
  
  // ✨ Group transactions by Month → Day
  const groupedTransactions = useMemo(() => {
    if (!transactions || !Array.isArray(transactions)) return {};
    
    // ✅ SIMPLE SORTING: Newest first (server already filters by date)
    const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // First, group by month
    const monthGroups = {};
    
    sorted.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthTitle = date.toLocaleDateString(isRTL ? 'he-IL' : 'en-US', {
        month: 'long',
        year: 'numeric'
      });
      
      if (!monthGroups[monthKey]) {
        monthGroups[monthKey] = {
          title: monthTitle,
          date: date,
          totalIncome: 0,
          totalExpenses: 0,
          count: 0,
          days: {}
        };
      }
      
      // Then group by day within the month
      let dayGroupKey;
      let dayGroupTitle;
      
      if (date.toDateString() === today.toDateString()) {
        dayGroupKey = 'today';
        dayGroupTitle = t('common.date.today', 'Today');
      } else if (date.toDateString() === yesterday.toDateString()) {
        dayGroupKey = 'yesterday';
        dayGroupTitle = t('common.date.yesterday', 'Yesterday');
      } else {
        dayGroupKey = date.toDateString();
        dayGroupTitle = date.toLocaleDateString(isRTL ? 'he-IL' : 'en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
          year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
      }
      
      if (!monthGroups[monthKey].days[dayGroupKey]) {
        monthGroups[monthKey].days[dayGroupKey] = {
          title: dayGroupTitle,
          date: date,
          transactions: [],
          totalIncome: 0,
          totalExpenses: 0,
          count: 0
        };
      }
      
      // Add transaction to day
      monthGroups[monthKey].days[dayGroupKey].transactions.push(transaction);
      monthGroups[monthKey].days[dayGroupKey].count += 1;
      
      // Update month totals
      monthGroups[monthKey].count += 1;
      
      const amount = Math.abs(transaction.amount);
      if (transaction.type === 'income') {
        monthGroups[monthKey].days[dayGroupKey].totalIncome += amount;
        monthGroups[monthKey].totalIncome += amount;
      } else {
        monthGroups[monthKey].days[dayGroupKey].totalExpenses += amount;
        monthGroups[monthKey].totalExpenses += amount;
      }
    });
    
    return monthGroups;
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

  // Get array of month keys for navigation
  const monthKeys = Object.keys(groupedTransactions);
  
  return (
    <div className="space-y-8">
      <AnimatePresence mode="popLayout">
        {Object.entries(groupedTransactions).map(([monthKey, month], monthIndex) => {
          // Find if there's a previous month
          const currentIndex = monthKeys.indexOf(monthKey);
          const nextMonthKey = monthKeys[currentIndex + 1]; // Next in array is previous in time (sorted newest first)
          
          return (
            <motion.div
              key={monthKey}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ 
                duration: 0.5, 
                delay: monthIndex * 0.1,
                layout: { duration: 0.3 }
              }}
              className="space-y-4"
            >
            {/* Month Header with data attribute for scrolling */}
            <div data-month-key={monthKey}>
              <ModernMonthHeader
                title={month.title}
                totalIncome={month.totalIncome}
                totalExpenses={month.totalExpenses}
                count={month.count}
              />
            </div>
              
              {/* Days within the month */}
              <div className="space-y-6 pl-2 sm:pl-4">
                <AnimatePresence mode="popLayout">
                  {Object.entries(month.days).map(([dayKey, day], dayIndex) => (
                    <motion.div
                      key={`${monthKey}-${dayKey}`}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ 
                        duration: 0.4, 
                        delay: dayIndex * 0.05,
                        layout: { duration: 0.3 }
                      }}
                      className="space-y-3"
                    >
                      {/* Day Header */}
                      <ModernDayHeader
                        title={day.title}
                        date={day.date}
                        totalIncome={day.totalIncome}
                        totalExpenses={day.totalExpenses}
                        count={day.count}
                      />
                      
                      {/* Transactions for this day */}
                      <div className={cn(
                        "space-y-3 pl-3 sm:pl-4",
                        viewMode === 'grid' && "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 space-y-0 pl-0"
                      )}>
                        <AnimatePresence mode="popLayout">
                          {day.transactions.map((transaction, index) => (
                            <motion.div
                              key={`${transaction.id}-${monthKey}-${dayKey}-${index}`}
                              layout
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              transition={{ 
                                duration: 0.3, 
                                delay: index * 0.03,
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
              
              {/* Month Separator - Visual only, no misleading button */}
            </motion.div>
          );
        })}
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

  // ✅ Refs for IntersectionObserver
  const loadMoreRef = useRef(null);
  const observerRef = useRef(null);

  // ✅ State management
  const [activeTab, setActiveTab] = useState('all'); // all | recurring
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

  // ✅ Filter states - simplified (dateRange removed - handled automatically per tab)
  const [filters, setFilters] = useState({
    category: 'all',
    type: 'all',
    recurring: 'all', // all | recurring | oneTime
    amountMin: '',
    amountMax: '',
    sortBy: 'date',
    sortOrder: 'desc',
    month: 'all' // NEW: Month filter
  });

  // Custom date range removed - not needed for simplified tab-based filtering

  // ✅ Hooks - Pass filters to server for efficient pagination
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
      type: filters.type,
      category: filters.category,
      month: filters.month,
      search: searchQuery
    },
    activeTab: 'all', // ✅ Server-side date filtering based on tab
    pageSize: 50 // ✅ Increased page size for better UX
  });



  const {
    createTransaction,
    updateTransaction,
    deleteTransaction,
    freshBulkDelete
  } = useTransactionActions();

  const { categories } = useCategory();

  const {
    regenerationStatus,
    isRegenerating,
    triggerRegeneration
  } = useAutoRegeneration();

  // ✅ Client-side filtering - MINIMAL (server does most work now)
  // Only filter things server can't handle: recurring/oneTime, amount range
  const transactions = useMemo(() => {
    if (!transactionsData || !Array.isArray(transactionsData)) return [];
    
    let filtered = [...transactionsData];
    
    // Apply recurring filter (client-side only - based on template_id presence)
    if (filters.recurring === 'recurring') {
      filtered = filtered.filter(t => t.template_id || t.is_recurring);
    } else if (filters.recurring === 'oneTime') {
      filtered = filtered.filter(t => !t.template_id && !t.is_recurring);
    }
    
    // Apply amount range filter (client-side for now)
    if (filters.amountMin) {
      const minAmount = parseFloat(filters.amountMin);
      if (!isNaN(minAmount)) {
        filtered = filtered.filter(t => Math.abs(parseFloat(t.amount)) >= minAmount);
      }
    }
    if (filters.amountMax) {
      const maxAmount = parseFloat(filters.amountMax);
      if (!isNaN(maxAmount)) {
        filtered = filtered.filter(t => Math.abs(parseFloat(t.amount)) <= maxAmount);
      }
    }
    
    return filtered;
  }, [transactionsData, filters.recurring, filters.amountMin, filters.amountMax]);

  // ✅ Get available months from all transactions
  const availableMonths = useMemo(() => {
    if (!transactionsData || !Array.isArray(transactionsData)) return [];
    
    const monthsSet = new Set();
    transactionsData.forEach(t => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthsSet.add(monthKey);
    });
    
    // Convert to array and sort (newest first)
    return Array.from(monthsSet).sort((a, b) => b.localeCompare(a)).map(monthKey => {
      const [year, month] = monthKey.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return {
        key: monthKey,
        label: date.toLocaleDateString(isRTL ? 'he-IL' : 'en-US', { month: 'long', year: 'numeric' }),
        shortLabel: date.toLocaleDateString(isRTL ? 'he-IL' : 'en-US', { month: 'short', year: 'numeric' })
      };
    });
  }, [transactionsData, isRTL]);

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

  // Upcoming summary removed - future transactions now shown in collapsible card

  // ✅ Recurring templates summary (using hook)
  const { recurringTransactions: recurringTemplates } = useRecurringTransactions();
  const recurringSummary = useMemo(() => {
    if (!recurringTemplates) return { totalCount: 0, activeCount: 0, totalMonthlyIncome: 0, totalMonthlyExpenses: 0 };
    
    const active = recurringTemplates.filter(t => t.is_active);
    
    return {
      totalCount: recurringTemplates.length,
      activeCount: active.length,
      totalMonthlyIncome: active.filter(t => t.type === 'income').reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
      totalMonthlyExpenses: active.filter(t => t.type === 'expense').reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
    };
  }, [recurringTemplates]);

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
      category: 'all',
      type: 'all',
      recurring: 'all',
      amountMin: '',
      amountMax: '',
      sortBy: 'date',
      sortOrder: 'desc',
      month: 'all'
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

  // ✅ FIX: Proper IntersectionObserver setup with cleanup
  useEffect(() => {
    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Only create observer if we have more to load and not currently loading
    if (!hasMore || transactionsLoading || !loadMoreRef.current) {
      return;
    }

    // Create new observer
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !transactionsLoading) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    // Observe the element
    observerRef.current.observe(loadMoreRef.current);

    // Cleanup function
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, transactionsLoading, loadMore]);

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
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ✨ Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ✨ Enhanced Tabs - Moved to top */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-8"
        >
          <div className="w-full">
            <div className="grid w-full grid-cols-2 bg-white dark:bg-gray-800 rounded-2xl p-1 shadow-lg border border-gray-200 dark:border-gray-700">
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
                onClick={() => setActiveTab('recurring')}
                className={cn(
                  "rounded-xl px-4 py-3 flex items-center justify-center gap-2 font-medium transition-all duration-200",
                  activeTab === 'recurring'
                    ? "bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
              >
                <Repeat className="w-4 h-4" />
                {t('transactions.tabs.recurring', 'Recurring Templates')}
              </button>
            </div>

        {/* ✨ Dynamic Stats Grid - Changes based on active tab */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-8 mt-6"
        >
          {activeTab === 'all' && (
            <>
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
            </>
          )}
          
          {activeTab === 'recurring' && (
            <>
              <ModernStatsCard
                title={t('transactions.recurring.totalTemplates', 'Total Templates')}
                value={recurringSummary.totalCount}
                icon={Target}
                color="blue"
              />
              <ModernStatsCard
                title={t('transactions.recurring.activeTemplates', 'Active Templates')}
                value={recurringSummary.activeCount}
                icon={CheckCircle}
                color="green"
              />
              <ModernStatsCard
                title={t('transactions.recurring.monthlyIncome', 'Monthly Income')}
                value={recurringSummary.totalMonthlyIncome}
                icon={TrendingUp}
                color="green"
              />
              <ModernStatsCard
                title={t('transactions.recurring.monthlyExpenses', 'Monthly Expenses')}
                value={recurringSummary.totalMonthlyExpenses}
                icon={TrendingDown}
                color="red"
              />
            </>
          )}
        </motion.div>

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
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {/* Month Selector */}
                    <QuickMonthSelector
                      availableMonths={availableMonths}
                      selectedMonth={filters.month}
                      onMonthChange={(month) => handleFilterChange({ month })}
                    />
                    
                    <Button
                      variant={showFilters ? 'default' : 'outline'}
                      onClick={() => setShowFilters(!showFilters)}
                      className="h-10 sm:h-12 px-3 sm:px-6 rounded-xl text-xs sm:text-sm"
                    >
                      <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">{t('actions.filters', 'Filters')}</span>
                      <span className="sm:hidden">Filter</span>
                    </Button>

                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                      className="h-10 sm:h-12 px-3 sm:px-4 rounded-xl hidden sm:flex"
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
                      className="h-10 sm:h-12 px-3 sm:px-6 rounded-xl text-xs sm:text-sm hidden sm:flex"
                    >
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
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

              {/* ✨ Future Transactions Collapsible Card */}
              <FutureTransactionsCollapsible 
                transactions={transactionsData || []}
                loading={transactionsLoading}
              />

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
                  
                  {/* ✅ Smart Load More - Manual button + auto-trigger */}
                  <div ref={loadMoreRef} className="mt-8">
                    {transactionsLoading ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-8"
                      >
                        <LoadingSpinner size="lg" />
                        <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm">
                          {t('transactions.loadingMore', 'Loading more transactions...')}
                        </p>
                      </motion.div>
                    ) : hasMore ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-6 space-y-4"
                      >
                        <Button
                          variant="outline"
                          onClick={() => loadMore()}
                          className="group relative px-8 py-4 rounded-2xl border-2 border-indigo-300 dark:border-indigo-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900/40 dark:hover:to-purple-900/40 text-indigo-700 dark:text-indigo-300 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          <div className="flex items-center gap-3">
                            <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                            <span className="text-sm sm:text-base">
                              {t('transactions.loadMore', 'Load More Transactions')}
                            </span>
                            <ChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                          </div>
                        </Button>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {t('transactions.scrollHint', 'or scroll down to auto-load')}
                        </p>
                      </motion.div>
                    ) : transactions?.length > 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-8 text-center"
                      >
                        <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full flex items-center justify-center mb-4">
                          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 font-medium">
                          {t('transactions.allLoaded', 'All transactions loaded')}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                          {t('transactions.totalCount', '{{count}} transactions', { count: transactions.length })}
                        </p>
                      </motion.div>
                    ) : null}
                  </div>

                </div>
              </Card>
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

      {/* 🎛️ Modern Recurring Manager Panel */}
      <ModernRecurringManagerPanel 
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
                        const idsToDelete = Array.from(selectedIds);
                        await freshBulkDelete(idsToDelete);
                        
                        // ✅ Clear selection and close modal on success
                        setSelectedIds(new Set());
                        setShowBulkDeleteModal(false);
                        
                        addNotification({
                          type: 'success',
                          message: t('bulk.delete.success', `Successfully deleted ${idsToDelete.length} transactions`),
                          duration: 4000
                        });
                      } catch (error) {
                        addNotification({
                          type: 'error',
                          message: error.message || t('bulk.delete.failed', 'Failed to delete transactions'),
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
