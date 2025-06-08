/**
 * Transactions Page - Complete Transaction Management
 * 
 * Features:
 * - Smart filtering and search with real-time results
 * - Period-based transaction views with optimized queries
 * - Advanced filters for comprehensive data analysis
 * - CRUD operations with optimistic updates
 * - Recurring transaction management
 * - Mobile-responsive design with floating actions
 * - Multi-language support with RTL layout
 * - Performance optimized with memoization and debouncing
 * 
 * ✅ UPDATED: Compatible with redesigned component system
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar,
  Filter,
  Plus,
  Search,
  RefreshCw,
  Clock,
  Sparkles,
  Activity,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Hooks for data management
import { useTransactions, useRecurringTransactions, useTransactionSearch } from '../hooks/useTransactions';
import { useDate } from '../context/DateContext';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';

// Layout components
import PageContainer from '../components/layout/PageContainer';

// ✅ UPDATED: Import redesigned components
import TransactionList from '../components/features/transactions/TransactionList';
import AddTransactions from '../components/features/transactions/AddTransactions';
import TransactionFilters from '../components/features/transactions/TransactionFilters';
import DeleteTransaction from '../components/features/transactions/DeleteTransaction';
import RecurringModal from '../components/features/transactions/RecurringModal';
import EditTransactionPanel from '../components/features/transactions/EditTransactionPanel';
// UI components
import { Card, Button, Badge, Modal, LoadingSpinner } from '../components/ui';


/**
 * Animation configurations for smooth user experience
 */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

/**
 * Period configuration for transaction filtering
 */
const PERIOD_OPTIONS = [
  { key: 'week', labelKey: 'common.last7Days' },
  { key: 'month', labelKey: 'common.thisMonth' },
  { key: '3months', labelKey: 'common.last90Days' },
  { key: 'year', labelKey: 'common.thisYear' }
];

/**
 * Transaction type filter configuration
 */
const TYPE_FILTERS = [
  { key: 'all', icon: Activity, labelKey: 'transactions.all' },
  { key: 'income', icon: ArrowUpRight, labelKey: 'transactions.income' },
  { key: 'expense', icon: ArrowDownRight, labelKey: 'transactions.expense' }
];

const Transactions = () => {
  // Context hooks for global state
  const { t, language } = useLanguage();
  const { selectedDate, setSelectedDate } = useDate();
  const { formatAmount } = useCurrency();

  // Local state management
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [view, setView] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showActionsPanel, setShowActionsPanel] = useState(false);
  const [showRecurring, setShowRecurring] = useState(false);
  const [showRecurringManager, setShowRecurringManager] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedTransactionForRecurring, setSelectedTransactionForRecurring] = useState(null);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [showFloatingMenu, setShowFloatingMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  // ✅ ADD: Missing editingSingle state
  const [editingSingle, setEditingSingle] = useState(false);
  
  // Advanced filter state
  const [filters, setFilters] = useState({
    type: null,
    categories: [],
    startDate: null,
    endDate: null,
    minAmount: null,
    maxAmount: null,
    recurring: 'all'
  });

  // Main data hooks - optimized with proper caching
  const {
    transactions,
    pagination,
    summary,
    isLoading,
    isRefetching,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    updateFilters,
    setSearchTerm: setHookSearchTerm,
    clearFilters: clearHookFilters,
    refresh
  } = useTransactions({
    period: selectedPeriod,
    type: view !== 'all' ? view : null,
    searchTerm,
    ...filters,
    limit: 100
  });

  const {
    recurringTransactions,
    isLoading: recurringLoading,
    error: recurringError,
    refresh: refreshRecurring
  } = useRecurringTransactions();

  const {
    results: searchResults,
    isSearching
  } = useTransactionSearch(searchTerm, { limit: 50 });

  // Computed values for UI
  const isRTL = language === 'he';
  const periods = PERIOD_OPTIONS.map(period => ({
    ...period,
    label: t(period.labelKey) || period.key,
    icon: Calendar
  }));

  // Memoized calculations for performance
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.type && filters.type !== 'all') count++;
    if (filters.categories?.length > 0) count++;
    if (filters.startDate || filters.endDate) count++;
    if (filters.minAmount !== null || filters.maxAmount !== null) count++;
    if (filters.recurring !== 'all') count++;
    if (searchTerm) count++;
    if (selectedPeriod !== 'month') count++;
    return count;
  }, [filters, searchTerm, selectedPeriod]);

  const balanceData = useMemo(() => {
    if (!summary) {
      return {
        income: 0,
        expenses: 0,
        balance: 0,
        count: transactions?.length || 0
      };
    }

    return {
      income: summary.totalIncome || 0,
      expenses: summary.totalExpenses || 0,
      balance: (summary.totalIncome || 0) - (summary.totalExpenses || 0),
      count: transactions?.length || 0
    };
  }, [summary, transactions]);

  // Sync effects for filter coordination
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      type: view !== 'all' ? view : null
    }));
  }, [view]);

  useEffect(() => {
    setHookSearchTerm(searchTerm);
  }, [searchTerm, setHookSearchTerm]);

  // ✅ UPDATED: Event handlers compatible with new component system
  const handleTypeChange = useCallback((type) => {
    setView(type);
    setFilters(prev => ({
      ...prev,
      type: type !== 'all' ? type : null
    }));
  }, []);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    updateFilters(newFilters);
  }, [updateFilters]);

  const handleFilterReset = useCallback(() => {
    const resetFilters = {
      type: null,
      categories: [],
      startDate: null,
      endDate: null,
      minAmount: null,
      maxAmount: null,
      recurring: 'all'
    };
    setFilters(resetFilters);
    setView('all');
    setSearchTerm('');
    setSelectedPeriod('month');
    clearHookFilters();
  }, [clearHookFilters]);

  const handleTransactionSuccess = useCallback(() => {
    refresh();
    refreshRecurring();
  }, [refresh, refreshRecurring]);

  // ✅ UPDATED: Handle edit with proper scope setting
  const handleEdit = useCallback((transaction, single = false) => {
    setSelectedTransaction(transaction);
    setEditingSingle(single);
    setShowActionsPanel(false); // ✅ FIX: Don't use actions panel for editing
    setShowEditModal(true); // ✅ FIX: Use dedicated edit modal
  }, []);
  
  // ✅ NEW: Separate handlers for different edit types
  const handleEditSingle = useCallback((transaction) => {
    setSelectedTransaction(transaction);
    setEditingSingle(true); // ✅ FORCE: Always true for single edits
    setShowActionsPanel(false);
    setShowEditModal(true);
  }, []);

  const handleEditTemplate = useCallback((transaction) => {
    setSelectedTransaction(transaction);
    setEditingSingle(false); // ✅ FORCE: Always false for template edits
    setShowActionsPanel(false);
    setShowEditModal(true);
  }, []);
  
  // ✅ NEW: Handle add transaction separately  
  const handleAddTransaction = useCallback(() => {
    setSelectedTransaction(null);
    setEditingSingle(false);
    setShowEditModal(false);
    setShowActionsPanel(true);
  }, []);

  const handleDelete = useCallback((transaction) => {
    setTransactionToDelete(transaction);
  }, []);

  const handleFormClose = useCallback(() => {
    setSelectedTransaction(null);
    setEditingSingle(false);
    setShowActionsPanel(false);
    setShowEditModal(false); // ✅ FIX: Close edit modal too
  }, []);

  const handleDeleteConfirm = useCallback(async (transactionToDelete, deleteFuture = false) => {
    try {
      await deleteTransaction(transactionToDelete.transaction_type, transactionToDelete.id, deleteFuture);
      setTransactionToDelete(null);
      await handleTransactionSuccess();
    } catch (error) {
      console.error('Delete operation failed:', error);
    }
  }, [deleteTransaction, handleTransactionSuccess]);

  const handleDateChange = useCallback((newDate) => {
    setSelectedDate(newDate);
  }, [setSelectedDate]);

  const handleClearAllFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedPeriod('month');
    handleFilterReset();
  }, [handleFilterReset]);

  // ✅ UPDATED: Handle recurring modal with focus
  const handleOpenRecurringManager = useCallback((focusTransaction = null) => {
    setSelectedTransactionForRecurring(focusTransaction);
    setShowRecurringManager(true);
  }, []);

  // Loading and error states
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text={t('common.loading') || 'Loading...'} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{t('transactions.fetchError') || 'Failed to load transactions'}</p>
          <Button onClick={refresh} variant="outline">
            {t('common.retry') || 'Retry'}
          </Button>
        </div>
      </div>
    );
  }

  // Safe access to recurring transactions with fallback
  const safeRecurringTransactions = Array.isArray(recurringTransactions) ? recurringTransactions : [];

  return (
    <PageContainer>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header with enhanced design and balance display */}
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white border-0 shadow-2xl relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0">
              <div className="absolute top-0 -right-4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000" />
              <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse delay-500" />
              <div className="absolute top-1/3 right-1/3 w-16 h-16 bg-white/20 rounded-full blur-xl animate-ping" style={{ animationDuration: '3s' }} />
            </div>
            
            <div className="relative z-10 p-6 lg:p-8">
              {/* Title and action buttons */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Activity className="w-8 h-8" />
                  </div>
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold mb-1 flex items-center gap-2">
                      {t('transactions.title') || 'Transactions'}
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                      >
                        <Sparkles className="w-5 h-5" />
                      </motion.div>
                    </h1>
                    <div className="flex items-center gap-2 text-white/90">
                      <Clock className="w-4 h-4" />
                      <span className="text-base">
                        {periods.find(p => p.key === selectedPeriod)?.label}
                      </span>
                      <span className="text-white/70">•</span>
                      <span className="font-medium">
                        {view === 'all' ? (t('transactions.all') || 'All') : (t(`transactions.${view}`) || view)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowRecurring(true)}
                    className="bg-white/10 text-white border-white/20 hover:bg-white/20 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all px-4 py-3 font-semibold whitespace-nowrap backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Clock className="w-5 h-5" />
                        {safeRecurringTransactions.length > 0 && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                        )}
                      </div>
                      <span className="hidden sm:inline">{t('transactions.recurringManagement') || 'Recurring'}</span>
                      <span className="sm:hidden">{t('transactions.manage') || 'Manage'}</span>
                      <Badge variant="default" size="small" className="bg-white/20 text-white border-white/30">
                        {safeRecurringTransactions.length}
                      </Badge>
                    </div>
                  </Button>
                  
                  <Button
                    variant="default"
                    onClick={handleAddTransaction}
                    className="bg-white text-indigo-600 hover:bg-gray-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all px-6 py-3 font-semibold whitespace-nowrap"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    {t('actions.add') || 'Add Transaction'}
                  </Button>
                </div>
              </div>

              {/* Period selector and stats */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <span>{t('transactions.showing') || 'Showing'} {transactions?.length || 0} {t('transactions.items') || 'items'}</span>
                  {pagination?.total && pagination.total > (transactions?.length || 0) && (
                    <span className="text-amber-200">
                      ({t('transactions.of') || 'of'} {pagination.total} {t('transactions.total') || 'total'})
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl p-1 border border-white/20">
                  {periods.map((periodOption) => (
                    <button
                      key={periodOption.key}
                      onClick={() => setSelectedPeriod(periodOption.key)}
                      className={`px-3 py-2 rounded-lg font-medium transition-all text-sm whitespace-nowrap ${
                        selectedPeriod === periodOption.key 
                          ? 'bg-white text-indigo-600 shadow-sm' 
                          : 'text-white/80 hover:text-white hover:bg-white/20'
                      }`}
                    >
                      {periodOption.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Search and filter controls */}
        <motion.div variants={itemVariants}>
          <Card className="p-4 lg:p-6 bg-gradient-to-br from-white via-gray-50 to-blue-50 dark:from-gray-800 dark:via-gray-900 dark:to-blue-900 border-0 shadow-lg">
            <div className="space-y-4 lg:space-y-6">
              {/* Search bar */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder={t('transactions.searchPlaceholder') || 'Search transactions...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 lg:py-4 text-base lg:text-lg bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl lg:rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all placeholder-gray-400"
                />
                {searchTerm && (
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    <Badge variant="primary" size="small">
                      {transactions.length}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Filter controls */}
              <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {t('transactions.type') || 'Type'}:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {TYPE_FILTERS.map(({ key, icon: Icon, labelKey }) => (
                      <Button
                        key={key}
                        variant={view === key ? 'primary' : 'outline'}
                        size="small"
                        onClick={() => handleTypeChange(key)}
                        className="rounded-full px-3 py-2 flex items-center gap-2 transition-all hover:scale-105 text-sm"
                      >
                        <Icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{t(labelKey) || key}</span>
                        <Badge variant="default" size="small" className="ml-1 bg-white/20">
                          {key === 'all' ? transactions?.length || 0 : 
                           transactions?.filter(tx => tx.transaction_type === key).length || 0}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <Button
                    variant={showFilters ? 'primary' : 'outline'}
                    size="small"
                    onClick={() => setShowFilters(!showFilters)}
                    className="rounded-full px-4 py-2 flex items-center gap-2 transition-all hover:scale-105"
                  >
                    <Filter className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('common.filters') || 'Filters'}</span>
                    <span className="sm:hidden">{t('common.filters') || 'Filters'}</span>
                    {activeFilterCount > 0 && (
                      <Badge variant="default" size="small" className="bg-white/20">
                        {activeFilterCount}
                      </Badge>
                    )}
                    {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={refresh}
                    className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    title={t('common.refresh') || 'Refresh'}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Active filters summary */}
              {(searchTerm || activeFilterCount > 0 || selectedPeriod !== 'month') && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap items-center gap-2 lg:gap-3 pt-4 border-t border-gray-200 dark:border-gray-700"
                >
                  <span className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2 lg:mb-0">
                    <Activity className="w-4 h-4" />
                    {t('common.active') || 'Active'}:
                  </span>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedPeriod !== 'month' && (
                      <Badge variant="outline" size="small" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                        📅 {periods.find(p => p.key === selectedPeriod)?.label}
                      </Badge>
                    )}
                    
                    {searchTerm && (
                      <Badge variant="outline" size="small" className="bg-blue-50 text-blue-700 border-blue-200">
                        🔍 "{searchTerm.length > 15 ? searchTerm.slice(0, 15) + '...' : searchTerm}"
                      </Badge>
                    )}
                    
                    {filters.type !== 'all' && (
                      <Badge variant="primary" size="small">
                        📊 {t(`transactions.${filters.type}`) || filters.type}
                      </Badge>
                    )}

                    {filters.categories.length > 0 && (
                      <Badge variant="outline" size="small" className="bg-purple-50 text-purple-700 border-purple-200">
                        🏷️ {filters.categories.length} {t('categories.selected') || 'selected'}
                      </Badge>
                    )}

                    {(filters.startDate || filters.endDate) && (
                      <Badge variant="outline" size="small" className="bg-green-50 text-green-700 border-green-200">
                        📅 {t('common.dateRange') || 'Date Range'}
                      </Badge>
                    )}

                    {(filters.minAmount !== null || filters.maxAmount !== null) && (
                      <Badge variant="outline" size="small" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        💰 {t('common.amountRange') || 'Amount Range'}
                      </Badge>
                    )}

                    {filters.recurring !== 'all' && (
                      <Badge variant="outline" size="small" className="bg-cyan-50 text-cyan-700 border-cyan-200">
                        🔄 {t(`common.${filters.recurring}`) || filters.recurring}
                      </Badge>
                    )}

                    <Badge variant="outline" size="small" className="bg-green-50 text-green-700 border-green-200">
                      ✅ {transactions.length} {t('common.results') || 'results'}
                    </Badge>
                    
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={handleClearAllFilters}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full px-2 py-1 text-xs"
                    >
                      <X className="w-3 h-3 mr-1" />
                      {t('common.clearAll') || 'Clear All'}
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Advanced filters panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              variants={itemVariants}
            >
              <Card className="border-2 border-primary-200 dark:border-primary-800 shadow-lg bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/20 dark:to-gray-800">
                <div className="p-4 border-b border-primary-200 dark:border-primary-700 bg-primary-100 dark:bg-primary-900/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      <h3 className="font-semibold text-primary-900 dark:text-primary-100">
                        {t('common.advancedFilters') || 'Advanced Filters'}
                      </h3>
                      {activeFilterCount > 0 && (
                        <Badge variant="primary" size="small">
                          {activeFilterCount} {t('common.active') || 'active'}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {activeFilterCount > 0 && (
                        <Button
                          variant="ghost"
                          size="small"
                          onClick={handleFilterReset}
                          className="text-primary-700 hover:text-primary-800 dark:text-primary-300 dark:hover:text-primary-200"
                        >
                          <X className="w-4 h-4 mr-1" />
                          {t('common.reset') || 'Reset'}
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="small"
                        onClick={() => setShowFilters(false)}
                        className="text-primary-700 hover:text-primary-800 dark:text-primary-300 dark:hover:text-primary-200"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="p-0">
                  <TransactionFilters
                    filters={filters}
                    onChange={handleFilterChange}
                    onReset={handleFilterReset}
                    className="border-0 shadow-none bg-transparent"
                  />
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results summary */}
        {transactions && transactions.length > 0 && (
          <motion.div variants={itemVariants}>
            <Card className="p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('transactions.showing') || 'Showing'} <span className="font-bold text-indigo-600">{transactions.length}</span> {t('transactions.items') || 'items'}
                  </span>
                  
                  {activeFilterCount > 0 && (
                    <Badge variant="primary" size="small" className="flex items-center gap-1">
                      <Filter className="w-3 h-3" />
                      {activeFilterCount} {t('common.applied') || 'applied'}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {transactions.filter(tx => tx.transaction_type === 'income').length} {t('transactions.income') || 'income'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {transactions.filter(tx => tx.transaction_type === 'expense').length} {t('transactions.expense') || 'expense'}
                    </span>
                  </div>
                  
                  <div className="hidden lg:flex items-center gap-4 pl-4 border-l border-gray-200 dark:border-gray-700">
                    <div className="text-sm">
                      <span className="text-gray-500 dark:text-gray-400">{t('transactions.totalAmount') || 'Total'}:</span>
                      <span className="font-semibold ml-1 text-gray-900 dark:text-white">
                        {formatAmount(transactions.reduce((sum, tx) => sum + Math.abs(parseFloat(tx.amount)), 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ✅ UPDATED: Transaction list with new component integration */}
        <motion.div variants={itemVariants}>
          <Card className="p-0 overflow-hidden shadow-xl border-0">
            <TransactionList
              onEdit={handleEdit}
              onEditSingle={handleEditSingle}
              onEditTemplate={handleEditTemplate}
              onDelete={handleDelete}
              onOpenRecurringManager={handleOpenRecurringManager}
              emptyMessage={
                searchTerm 
                  ? (t('transactions.noSearchResults') || `No results for "${searchTerm}"`)
                  : view !== 'all'
                    ? (t('transactions.noTransactionsOfType') || `No ${view} transactions`)
                    : undefined
              }
            />
          </Card>
        </motion.div>

        {/* Mobile floating action menu */}
        <div className={`fixed ${isRTL ? 'left-6' : 'right-6'} bottom-6 z-40 lg:hidden`}>
          <div className="flex flex-col items-end space-y-3">
            <AnimatePresence>
              {showFloatingMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.9 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-3 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex flex-col space-y-2">
                    <Button 
                      variant="ghost" 
                      size="small" 
                      className="justify-start"
                      onClick={() => {
                        handleAddTransaction();
                        setShowFloatingMenu(false);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {t('actions.add') || 'Add Transaction'}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="small" 
                      className="justify-start"
                      onClick={() => {
                        setShowRecurring(true);
                        setShowFloatingMenu(false);
                      }}
                    >
                      <div className="flex items-center mr-2">
                        <Clock className="w-4 h-4" />
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                      </div>
                      {t('transactions.recurringManagement') || 'Recurring'}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="small" 
                      className="justify-start"
                      onClick={() => {
                        refresh();
                        setShowFloatingMenu(false);
                      }}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      {t('common.refresh') || 'Refresh'}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <Button
              variant="primary"
              className="w-14 h-14 rounded-full shadow-2xl flex items-center justify-center bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              onClick={() => setShowFloatingMenu(!showFloatingMenu)}
              aria-label={t('actions.quickAdd') || 'Quick Add'}
            >
              <motion.div
                animate={{ rotate: showFloatingMenu ? 45 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <Plus className="w-6 h-6" />
              </motion.div>
            </Button>
          </div>
        </div>

        {/* ✅ FIXED: Separate modals - no more overlapping */}
        
        {/* Add Transaction Modal - Only when adding */}
        <Modal
          isOpen={showActionsPanel && !selectedTransaction}
          onClose={handleFormClose}
          size="xxl"
          className="max-w-6xl max-h-[95vh]"
          hideHeader={true}
        >
          <AddTransactions 
            onClose={handleFormClose}
            context="transactions"
            onSuccess={handleTransactionSuccess}
          />
        </Modal>

        {/* ✅ FIXED: Edit Transaction Modal - Only when editing */}
        <Modal
          isOpen={showEditModal && !!selectedTransaction}
          onClose={handleFormClose}
          size="xxl"
          className="max-w-6xl max-h-[95vh]"
          hideHeader={true}
        >
          <EditTransactionPanel
            transaction={selectedTransaction}
            editingSingle={editingSingle}
            onClose={handleFormClose}
            onSuccess={handleTransactionSuccess}
          />
        </Modal>

        {/* Delete Transaction Modal */}
        <DeleteTransaction
          transaction={transactionToDelete}
          isOpen={!!transactionToDelete}
          onClose={() => setTransactionToDelete(null)}
          onConfirm={handleDeleteConfirm}
          loading={isDeleting}
        />

        {/* Recurring Management Modal */}
        <RecurringModal
          isOpen={showRecurring}
          onClose={() => setShowRecurring(false)}
          onEdit={(transaction) => {
            setSelectedTransaction(transaction);
            setEditingSingle(false);
            setShowRecurring(false);
            setShowActionsPanel(true);
          }}
          onSuccess={handleTransactionSuccess}
        />

        {/* ✅ UPDATED: Recurring Manager Modal with focused transaction */}
        <RecurringModal
          isOpen={showRecurringManager}
          onClose={() => {
            setShowRecurringManager(false);
            setSelectedTransactionForRecurring(null);
          }}
          focusedTransaction={selectedTransactionForRecurring}
          onEdit={(template) => {
            // When editing from recurring manager, close it and open edit modal
            setShowRecurringManager(false);
            setSelectedTransactionForRecurring(null);
            handleEdit(template);
          }}
          onSuccess={() => {
            // Refresh transactions when recurring operations succeed
            refresh();
          }}
        />
      </motion.div>
    </PageContainer>
  );
};

export default Transactions;