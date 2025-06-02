// pages/Transactions.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar,
  Filter,
  Plus,
  Search,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  Download,
  Eye,
  Sparkles,
  Activity,
  X,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import { useTransactionsList, useRecurringTransactionsList } from '../hooks/useTransactionsList';
import { useTransactions } from '../context/TransactionContext';
import { useDate } from '../context/DateContext';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';

// Layout
import PageContainer from '../components/layout/PageContainer';

// Features
import TransactionList from '../components/features/transactions/TransactionList';
import ActionsPanel from '../components/features/dashboard/ActionsPanel';
import TransactionFilters from '../components/features/transactions/TransactionFilters';
import DeleteTransaction from '../components/features/transactions/DeleteTransaction';
import RecurringModal from '../components/features/transactions/RecurringModal';
import CalendarWidget from '../components/common/CalendarWidget';

// UI
import { Card, Button, Input, Badge, Modal, LoadingSpinner } from '../components/ui';

/**
 * Transactions Page Component
 * Main page for managing all transactions with filtering, searching, and CRUD operations
 */
const Transactions = () => {
  // ✅ ALL HOOKS MUST BE CALLED IN THE EXACT SAME ORDER EVERY TIME
  // Context hooks first - always called
  const { t, language } = useLanguage();
  const { selectedDate, formatDate, setSelectedDate } = useDate();
  const { formatAmount } = useCurrency();
  const { 
    createTransaction,
    updateTransaction,
    deleteTransaction
  } = useTransactions();

  // ✅ State hooks - always called in same order
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [view, setView] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showActionsPanel, setShowActionsPanel] = useState(false); // Changed from showForm
  const [showRecurring, setShowRecurring] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [showFloatingMenu, setShowFloatingMenu] = useState(false);
  const [filters, setFilters] = useState({
    categories: [],
    dateRange: null,
    minAmount: null,
    maxAmount: null,
    recurring: 'all'
  });

  // ✅ Data hooks - always called in same order
  const { 
    data: dashboardData, 
    isLoading: dashboardLoading, 
    error: dashboardError 
  } = useDashboard();

  const {
    periodTransactions,
    loading,
    error,
    refreshTransactions,
    getTransactionsByType,
    searchTransactions,
    totalCount,
    period: currentPeriod
  } = useTransactionsList({
    period: selectedPeriod, // ✅ Use selectedPeriod instead of period
    type: view !== 'all' ? view : null,
    searchTerm,
    page: 1,
    limit: 100
  });

  const {
    data: recurringTransactions = [],
    isLoading: recurringLoading
  } = useRecurringTransactionsList();

  // ✅ Computed values - always calculated
  const isRTL = language === 'he';

  // ✅ Memoized values - always calculated in same order
  const filteredTransactions = useMemo(() => {
    if (!periodTransactions || !Array.isArray(periodTransactions)) {
      console.warn('[Transactions] periodTransactions is not an array:', periodTransactions);
      return [];
    }

    let filtered = [...periodTransactions];

    // View filter
    if (view !== 'all') {
      filtered = filtered.filter(tx => tx.transaction_type === view);
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.description?.toLowerCase().includes(search) ||
        tx.category_name?.toLowerCase().includes(search)
      );
    }

    // Apply other filters
    if (filters.categories.length > 0) {
      filtered = filtered.filter(tx => 
        filters.categories.includes(tx.category_id)
      );
    }

    if (filters.recurring !== 'all') {
      if (filters.recurring === 'recurring') {
        filtered = filtered.filter(tx => tx.template_id !== null);
      } else if (filters.recurring === 'oneTime') {
        filtered = filtered.filter(tx => tx.template_id === null);
      }
    }

    return filtered;
  }, [periodTransactions, view, searchTerm, filters]);

  const balanceData = useMemo(() => {
    if (!dashboardData?.balances) {
      return {
        daily: { income: 0, expenses: 0, balance: 0 },
        weekly: { income: 0, expenses: 0, balance: 0 },
        monthly: { income: 0, expenses: 0, balance: 0 },
        yearly: { income: 0, expenses: 0, balance: 0 }
      };
    }
    return dashboardData.balances;
  }, [dashboardData]);

  const totals = useMemo(() => {
    const currentPeriodData = balanceData.monthly;
    
    return {
      income: currentPeriodData.income || 0,
      expenses: currentPeriodData.expenses || 0,
      balance: currentPeriodData.balance || 0,
      count: dashboardData?.recentTransactions?.length || 0
    };
  }, [balanceData, dashboardData]);

  // ✅ Callback hooks - always called in same order
  const handleTransactionSuccess = useCallback(() => {
    refreshTransactions();
  }, [refreshTransactions]);

  const handleEdit = useCallback((transaction) => {
    setSelectedTransaction(transaction);
    setShowActionsPanel(true);
  }, []);

  const handleDelete = useCallback((transaction) => {
    setTransactionToDelete(transaction);
  }, []);

  const handleFormClose = useCallback(() => {
    setSelectedTransaction(null);
    setShowActionsPanel(false); // Updated
  }, []);

  const handleDeleteConfirm = useCallback(async (transactionToDelete, deleteFuture = false) => {
    try {
      await deleteTransaction(transactionToDelete.transaction_type, transactionToDelete.id, deleteFuture);
      setTransactionToDelete(null);
      await handleTransactionSuccess();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  }, [deleteTransaction, handleTransactionSuccess]);

  const handleDateChange = useCallback((newDate) => {
    console.log('[Transactions] 📅 Date changed to:', newDate);
    setSelectedDate(newDate);
    setShowCalendar(false);
  }, [setSelectedDate]);

  // ✅ Effect hooks - always called in same order
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Transactions] 🔍 Data Debug:', {
        selectedDate: selectedDate,
        periodTransactions: periodTransactions,
        isArray: Array.isArray(periodTransactions),
        length: periodTransactions?.length,
        loading,
        error,
        totals
      });
    }
  }, [periodTransactions, loading, error, totals, selectedDate]);

  // ✅ Add debug info to identify what's displayed by default
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.group('🔍 [TRANSACTIONS-DEBUG] Default Display Analysis');
      console.log('📅 Selected Period:', selectedPeriod);
      console.log('👁️ Current View:', view);
      console.log('📊 Transactions Count:', periodTransactions?.length || 0);
      console.log('🎯 Transaction Types:', {
        income: periodTransactions?.filter(tx => tx.transaction_type === 'income').length || 0,
        expense: periodTransactions?.filter(tx => tx.transaction_type === 'expense').length || 0
      });
      console.log('📋 Sample Transactions:', periodTransactions?.slice(0, 3));
      console.groupEnd();
    }
  }, [selectedPeriod, view, periodTransactions]);

  // Use selectedPeriod instead of period
  const periods = [
    { key: 'week', label: t('common.last7Days'), icon: Calendar },
    { key: 'month', label: t('common.thisMonth'), icon: Calendar },
    { key: '3months', label: t('common.last90Days'), icon: Calendar },
    { key: 'year', label: t('common.thisYear'), icon: Calendar }
  ];

  // ✅ Early returns AFTER all hooks are called
  if (loading || recurringLoading || dashboardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text={t('common.loading')} />
      </div>
    );
  }

  if (error || dashboardError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{t('transactions.fetchError')}</p>
          <Button onClick={refreshTransactions} variant="outline">
            {t('common.retry')}
          </Button>
        </div>
      </div>
    );
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
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

  return (
    <PageContainer>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* HEADER with clarification of what's displayed */}
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white p-8 border-0 shadow-2xl relative overflow-hidden">
            {/* Enhanced Background Pattern */}
            <div className="absolute inset-0">
              <div className="absolute top-0 -right-4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000" />
              <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse delay-500" />
              <div className="absolute top-1/3 right-1/3 w-16 h-16 bg-white/20 rounded-full blur-xl animate-ping" style={{ animationDuration: '3s' }} />
            </div>
            
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                {/* Left Section - Title with clear info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <Activity className="w-8 h-8" />
                    </div>
                    <div>
                      <h1 className="text-3xl lg:text-4xl font-bold mb-2 flex items-center gap-2">
                        {t('nav.transactions')}
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                        >
                          <Sparkles className="w-6 h-6" />
                        </motion.div>
                      </h1>
                      {/* Display clearly what's shown by default */}
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        <span className="text-white/90 text-lg">
                          {periods.find(p => p.key === selectedPeriod)?.label} - 
                          <span className="font-bold ml-2">
                            {view === 'all' ? t('transactions.all') : t(`transactions.${view}`)}
                          </span>
                        </span>
                      </div>
                      {/* Display quick statistics */}
                      <div className="text-white/70 text-sm mt-1">
                        {t('transactions.showing')} {filteredTransactions.length} {t('transactions.items')}
                        {periodTransactions?.length !== filteredTransactions.length && (
                          <span className="text-amber-200">
                            {' '}({t('transactions.filtered')} {periodTransactions?.length})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats Row with accurate data */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-green-300" />
                        <span className="text-white/80 text-sm">{t('transactions.income')}</span>
                      </div>
                      <div className="text-xl font-bold text-green-300">
                        {formatAmount(totals.income)}
                      </div>
                      <div className="text-white/60 text-xs">
                        {getTransactionsByType('income').length} {t('transactions.items')}
                      </div>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="w-4 h-4 text-red-300" />
                        <span className="text-white/80 text-sm">{t('transactions.expense')}</span>
                      </div>
                      <div className="text-xl font-bold text-red-300">
                        {formatAmount(totals.expenses)}
                      </div>
                      <div className="text-white/60 text-xs">
                        {getTransactionsByType('expense').length} {t('transactions.items')}
                      </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-blue-300" />
                        <span className="text-white/80 text-sm">{t('common.balance')}</span>
                      </div>
                      <div className={`text-xl font-bold ${totals.balance >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                        {formatAmount(totals.balance)}
                      </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-purple-300" />
                        <span className="text-white/80 text-sm">{periods.find(p => p.key === selectedPeriod)?.label}</span>
                      </div>
                      <div className="text-xl font-bold text-purple-300">
                        {periodTransactions?.length || 0}
                      </div>
                      <div className="text-white/60 text-xs">
                        {t('transactions.totalTransactions')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Section - Period Selector */}
                <div className="flex flex-col lg:flex-row items-center gap-4">
                  {/* Period selector with clear indication */}
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl p-2 border border-white/30">
                    {periods.map((periodOption) => (
                      <button
                        key={periodOption.key}
                        onClick={() => setSelectedPeriod(periodOption.key)}
                        className={`px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                          selectedPeriod === periodOption.key 
                            ? 'bg-white text-indigo-600 shadow-sm' 
                            : 'text-white/80 hover:text-white hover:bg-white/20'
                        }`}
                      >
                        {periodOption.label}
                      </button>
                    ))}
                  </div>

                  <Button
                    variant="default"
                    onClick={() => setShowActionsPanel(true)}
                    className="bg-white text-indigo-600 hover:bg-gray-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all px-8 py-3 font-semibold"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    {t('transactions.addTransaction')}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* CONTROL PANEL with filter clarification */}
        <motion.div variants={itemVariants}>
          <Card className="p-6 bg-gradient-to-br from-white via-gray-50 to-blue-50 dark:from-gray-800 dark:via-gray-900 dark:to-blue-900 border-0 shadow-lg">
            <div className="space-y-6">
              {/* Search Bar */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder={t('transactions.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 text-lg bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all placeholder-gray-400"
                />
                {searchTerm && (
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    <Badge variant="primary" size="small">
                      {filteredTransactions.length}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Filter Controls */}
              <div className="flex flex-wrap items-center gap-4">
                {/* Type Filter Pills */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {t('transactions.filters.type')}:
                  </span>
                  <div className="flex items-center gap-2">
                    {[
                      { key: 'all', icon: Activity, label: t('transactions.all') },
                      { key: 'income', icon: ArrowUpRight, label: t('transactions.income') },
                      { key: 'expense', icon: ArrowDownRight, label: t('transactions.expense') }
                    ].map(({ key, icon: Icon, label }) => (
                      <Button
                        key={key}
                        variant={view === key ? 'primary' : 'outline'}
                        size="small"
                        onClick={() => setView(key)}
                        className="rounded-full px-4 py-2 flex items-center gap-2 transition-all hover:scale-105"
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                        <Badge variant="default" size="small" className="ml-1 bg-white/20">
                          {key === 'all' ? periodTransactions?.length || 0 : getTransactionsByType(key).length}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 ml-auto">
                  <Button
                    variant={showFilters ? 'primary' : 'outline'}
                    size="small"
                    onClick={() => setShowFilters(!showFilters)}
                    className="rounded-full px-4 py-2"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    {t('common.filters')}
                    {/* ✅ אינדיקטור פילטרים פעילים */}
                    {(filters.categories.length > 0 || filters.dateRange || filters.minAmount || filters.maxAmount) && (
                      <Badge variant="default" size="small" className="ml-2 bg-primary-100 text-primary-600">
                        {[
                          filters.categories.length,
                          filters.dateRange ? 1 : 0,
                          filters.minAmount ? 1 : 0,
                          filters.maxAmount ? 1 : 0
                        ].filter(Boolean).length}
                      </Badge>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="small"
                    onClick={() => setShowRecurring(true)}
                    className="rounded-full px-4 py-2"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    {t('transactions.recurring')}
                    <Badge variant="default" size="small" className="ml-2">
                      {recurringTransactions.length}
                    </Badge>
                  </Button>

                  <Button
                    variant="outline"
                    size="small"
                    onClick={refreshTransactions}
                    className="rounded-full px-4 py-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* ✅ Active Filters Summary with detailed info */}
              {(searchTerm || view !== 'all' || filters.categories.length > 0 || selectedPeriod !== 'month') && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700"
                >
                  <span className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    {t('common.active')}:
                  </span>
                  
                  {/* Period Badge */}
                  {selectedPeriod !== 'month' && (
                    <Badge variant="outline" size="small" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                      📅 {periods.find(p => p.key === selectedPeriod)?.label}
                    </Badge>
                  )}
                  
                  {searchTerm && (
                    <Badge variant="outline" size="small" className="bg-blue-50 text-blue-700 border-blue-200">
                      🔍 "{searchTerm}"
                    </Badge>
                  )}
                  
                  {view !== 'all' && (
                    <Badge variant="primary" size="small">
                      📊 {t(`transactions.${view}`)}
                    </Badge>
                  )}

                  {/* ✅ Display results summary */}
                  <Badge variant="outline" size="small" className="bg-green-50 text-green-700 border-green-200">
                    ✅ {filteredTransactions.length} {t('transactions.results')}
                  </Badge>
                  
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => {
                      setSearchTerm('');
                      setView('all');
                      setSelectedPeriod('month');
                      setFilters({
                        categories: [],
                        dateRange: null,
                        minAmount: null,
                        maxAmount: null,
                        recurring: 'all'
                      });
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full px-3 py-1"
                  >
                    <X className="w-3 h-3 mr-1" />
                    {t('transactions.filters.clearAll')}
                  </Button>
                </motion.div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Advanced Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <TransactionFilters
                filters={filters}
                onChange={setFilters}
                onReset={() => setFilters({
                  categories: [],
                  dateRange: null,
                  minAmount: null,
                  maxAmount: null,
                  recurring: 'all'
                })}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ENHANCED RESULTS SUMMARY */}
        {filteredTransactions.length > 0 && (
          <motion.div variants={itemVariants}>
            <Card className="p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('transactions.showing')} <span className="font-bold text-indigo-600">{filteredTransactions.length}</span> {t('transactions.of')} {periodTransactions?.length || 0} {t('transactions.items')}
                  </span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {filteredTransactions.filter(tx => tx.transaction_type === 'income').length} {t('transactions.income')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {filteredTransactions.filter(tx => tx.transaction_type === 'expense').length} {t('transactions.expense')}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ENHANCED TRANSACTION LIST */}
        <motion.div variants={itemVariants}>
          <Card className="p-0 overflow-hidden shadow-xl border-0">
            <TransactionList
              transactions={filteredTransactions}
              loading={loading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              emptyMessage={
                searchTerm 
                  ? t('transactions.noSearchResults', { term: searchTerm })
                  : view !== 'all'
                    ? t('transactions.noTransactionsOfType', { type: t(`transactions.${view}`) })
                    : undefined
              }
            />
          </Card>
        </motion.div>

        {/* FLOATING ACTION BUTTON - Mobile Friendly */}
        <div className={`fixed ${isRTL ? 'left-6' : 'right-6'} bottom-6 z-40 lg:hidden`}>
          <div className="flex flex-col items-end space-y-3">
            {/* Floating Menu */}
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
                        setShowActionsPanel(true);
                        setShowFloatingMenu(false);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {t('transactions.addTransaction')}
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
                      <Clock className="w-4 h-4 mr-2" />
                      {t('transactions.recurring')}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="small" 
                      className="justify-start"
                      onClick={() => {
                        refreshTransactions();
                        setShowFloatingMenu(false);
                      }}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      {t('common.refresh')}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Main Floating Button */}
            <Button
              variant="primary"
              className="w-14 h-14 rounded-full shadow-2xl flex items-center justify-center bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              onClick={() => setShowFloatingMenu(!showFloatingMenu)}
              aria-label={t('actions.quickAdd')}
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

        {/* ACTIONS PANEL MODAL - no changes */}
        <AnimatePresence>
          {showActionsPanel && (
            <Modal
              isOpen={showActionsPanel}
              onClose={handleFormClose}
              size="large"
              className="max-w-4xl"
              hideHeader={true}
            >
              <ActionsPanel 
                onClose={handleFormClose}
                context="transactions"
                initialActionType={selectedTransaction ? {
                  type: selectedTransaction.transaction_type,
                  isRecurring: !!selectedTransaction.template_id
                } : null}
              />
            </Modal>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <DeleteTransaction
          transaction={transactionToDelete}
          isOpen={!!transactionToDelete}
          onClose={() => setTransactionToDelete(null)}
          onConfirm={handleDeleteConfirm}
          loading={false}
        />

        {/* Recurring Transactions Modal */}
        <AnimatePresence>
          {showRecurring && (
            <RecurringModal
              isOpen={showRecurring}
              onClose={() => setShowRecurring(false)}
              transactions={recurringTransactions}
              onEdit={(transaction) => {
                setSelectedTransaction(transaction);
                setShowRecurring(false);
                setShowActionsPanel(true);
              }}
              onDelete={(transaction) => {
                setTransactionToDelete(transaction);
                setShowRecurring(false);
              }}
              loading={recurringLoading}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </PageContainer>
  );
};

export default Transactions;