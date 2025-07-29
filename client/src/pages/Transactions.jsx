/**
 * 💳 TRANSACTIONS PAGE - Mobile-First Transaction Management
 * Features: Zustand stores, Advanced filtering, Mobile-responsive, Real-time updates
 * NOW WITH CLEAN MODAL ARCHITECTURE! 🎉
 * @version 3.0.0 - TRANSACTION REDESIGN COMPLETE
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Edit,
  Trash2,
  ArrowUpDown,
  X,
  CheckCircle,
  AlertCircle,
  MoreVertical
} from 'lucide-react';

// ✅ NEW: Import Zustand stores (replaces Context API!)
import { 
  useAuth, 
  useTranslation, 
  useCurrency,
  useNotifications,
  useTheme 
} from '../stores';

// API, hooks and components
import { api } from '../api';
import { useTransactions } from '../hooks/useTransactions';
import { useTransactionActions } from '../hooks/useTransactionActions';
import { 
  Button, 
  Input, 
  Card, 
  LoadingSpinner, 
  Badge,
  Avatar 
} from '../components/ui';

// ✅ UPDATED: Use new dashboard transaction components instead of old duplicates
import TransactionList from '../components/features/dashboard/transactions/TransactionList';
import TransactionCard from '../components/features/dashboard/transactions/TransactionCard';

// ✅ NEW: Import clean modal architecture instead of massive files
import AddTransactionModal from '../components/features/transactions/modals/AddTransactionModal';
import EditTransactionModal from '../components/features/transactions/modals/EditTransactionModal';
import RecurringSetupModal from '../components/features/transactions/modals/RecurringSetupModal';
import DeleteTransaction from '../components/features/transactions/DeleteTransaction';

import { cn } from '../utils/helpers';

const Transactions = () => {
  // ✅ NEW: Zustand stores (replacing Context API)
  const { user } = useAuth();
  const { t, isRTL } = useTranslation();
  const { formatCurrency } = useCurrency();
  const { addNotification } = useNotifications();
  const { isDark } = useTheme();

  // State management
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [modalMode, setModalMode] = useState('create'); // create, edit, duplicate, view
  const [viewMode, setViewMode] = useState('list'); // list | grid | cards
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    dateRange: 'all', // all | week | month | quarter | year | custom
    category: 'all',
    type: 'all', // all | income | expense
    amountMin: '',
    amountMax: '',
    sortBy: 'date', // date | amount | category
    sortOrder: 'desc' // asc | desc
  });

  // Custom date range
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // ✅ Enhanced transactions hook with filtering
  const {
    data: transactionsData,
    loading: transactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions,
    hasMore,
    loadMore
  } = useTransactions({
    search: searchQuery,
    filters: {
      ...filters,
      ...(filters.dateRange === 'custom' ? customDateRange : {})
    },
    limit: 50
  });

  // ✅ Transaction actions
  const {
    createTransaction,
    updateTransaction,
    deleteTransaction,
    bulkActions,
    isLoading: actionsLoading
  } = useTransactionActions();

  // ✅ Derived data with better error handling
  const transactions = React.useMemo(() => {
    if (!transactionsData) return [];
    
    // Handle different response formats
    if (Array.isArray(transactionsData)) return transactionsData;
    if (transactionsData.transactions && Array.isArray(transactionsData.transactions)) {
      return transactionsData.transactions;
    }
    if (transactionsData.data?.transactions && Array.isArray(transactionsData.data.transactions)) {
      return transactionsData.data.transactions;
    }
    
    return [];
  }, [transactionsData]);

  const summary = React.useMemo(() => {
    return transactionsData?.summary || transactionsData?.data?.summary || {
      totalIncome: 0,
      totalExpenses: 0,
      netAmount: 0,
      count: transactions.length
    };
  }, [transactionsData, transactions.length]);

  // ✅ Handle transaction success (refresh data)
  const handleTransactionSuccess = useCallback((transaction) => {
    refetchTransactions();
    
    addNotification({
      type: 'success',
      message: t('notifications.transactionUpdated'),
      duration: 3000
    });
  }, [refetchTransactions, addNotification, t]);

  // ✅ Handle transaction actions
  const handleAddTransaction = useCallback(() => {
    setShowAddTransaction(true);
  }, []);

  const handleEditTransaction = useCallback((transaction, mode = 'edit') => {
    setSelectedTransaction(transaction);
    setModalMode(mode);
    setShowEditModal(true);
  }, []);

  const handleRecurringSetup = useCallback((transaction = null) => {
    setSelectedTransaction(transaction);
    setModalMode(transaction ? 'edit' : 'create');
    setShowRecurringModal(true);
  }, []);

  const handleDeleteTransaction = useCallback((transaction) => {
    setSelectedTransaction(transaction);
    setShowDeleteModal(true);
  }, []);

  // ✅ Handle duplicate transaction
  const handleDuplicateTransaction = useCallback(async (formData) => {
    try {
      const result = await createTransaction(formData);
      handleTransactionSuccess(result);
      return result;
    } catch (error) {
      throw error;
    }
  }, [createTransaction, handleTransactionSuccess]);

  // ✅ Close all modals
  const closeAllModals = useCallback(() => {
    setShowAddTransaction(false);
    setShowEditModal(false);
    setShowRecurringModal(false);
    setShowDeleteModal(false);
    setSelectedTransaction(null);
    setModalMode('create');
  }, []);

  // ✅ Filter handlers
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      dateRange: 'all',
      category: 'all',
      type: 'all',
      amountMin: '',
      amountMax: '',
      sortBy: 'date',
      sortOrder: 'desc'
    });
    setSearchQuery('');
  }, []);

  // ✅ View mode options
  const viewModeOptions = [
    { id: 'list', label: t('views.list'), icon: 'List' },
    { id: 'grid', label: t('views.grid'), icon: 'Grid' },
    { id: 'cards', label: t('views.cards'), icon: 'LayoutGrid' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Page Title */}
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t('pages.transactions.title')}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('pages.transactions.subtitle', { count: summary.count })}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              {/* Add Transaction Button */}
              <Button
                variant="primary"
                onClick={handleAddTransaction}
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">{t('actions.addTransaction')}</span>
              </Button>

              {/* Recurring Setup Button */}
              <Button
                variant="outline"
                onClick={() => handleRecurringSetup()}
                className="flex items-center space-x-2"
              >
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">{t('actions.recurring')}</span>
              </Button>

              {/* Refresh Button */}
              <Button
                variant="ghost"
                onClick={refetchTransactions}
                disabled={transactionsLoading}
                className="p-2"
              >
                <RefreshCw className={cn("w-4 h-4", transactionsLoading && "animate-spin")} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          {/* Total Income */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('summary.totalIncome')}
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(summary.totalIncome)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </Card>

          {/* Total Expenses */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('summary.totalExpenses')}
                </p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(Math.abs(summary.totalExpenses))}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500" />
            </div>
          </Card>

          {/* Net Amount */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('summary.netAmount')}
                </p>
                <p className={cn(
                  "text-2xl font-bold",
                  summary.netAmount >= 0 
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                )}>
                  {formatCurrency(summary.netAmount)}
                </p>
              </div>
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                summary.netAmount >= 0 
                  ? "bg-green-100 dark:bg-green-900/30"
                  : "bg-red-100 dark:bg-red-900/30"
              )}>
                <DollarSign className={cn(
                  "w-5 h-5",
                  summary.netAmount >= 0 
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                )} />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder={t('search.transactions')}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>{t('actions.filters')}</span>
            </Button>

            {/* Clear Filters */}
            {(searchQuery || Object.values(filters).some(f => f !== 'all' && f !== '')) && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>{t('actions.clear')}</span>
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
            >
              <div className="grid gap-4 md:grid-cols-4">
                {/* Date Range */}
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange({ dateRange: e.target.value })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                >
                  <option value="all">{t('filters.dateRange.all')}</option>
                  <option value="week">{t('filters.dateRange.week')}</option>
                  <option value="month">{t('filters.dateRange.month')}</option>
                  <option value="quarter">{t('filters.dateRange.quarter')}</option>
                  <option value="year">{t('filters.dateRange.year')}</option>
                </select>

                {/* Type Filter */}
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange({ type: e.target.value })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                >
                  <option value="all">{t('filters.type.all')}</option>
                  <option value="income">{t('filters.type.income')}</option>
                  <option value="expense">{t('filters.type.expense')}</option>
                </select>

                {/* Sort By */}
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange({ sortBy: e.target.value })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                >
                  <option value="date">{t('filters.sortBy.date')}</option>
                  <option value="amount">{t('filters.sortBy.amount')}</option>
                  <option value="category">{t('filters.sortBy.category')}</option>
                </select>

                {/* Sort Order */}
                <Button
                  variant="outline"
                  onClick={() => handleFilterChange({ 
                    sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' 
                  })}
                  className="flex items-center justify-center space-x-2"
                >
                  <ArrowUpDown className="w-4 h-4" />
                  <span>{filters.sortOrder === 'asc' ? t('filters.ascending') : t('filters.descending')}</span>
                </Button>
              </div>
            </motion.div>
          )}
        </Card>

        {/* Transactions List */}
        <Card>
          {transactionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : transactionsError ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t('errors.loadFailed')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {transactionsError.message}
                </p>
                <Button onClick={refetchTransactions} variant="primary">
                  {t('actions.retry')}
                </Button>
              </div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {searchQuery || Object.values(filters).some(f => f !== 'all' && f !== '') 
                    ? t('empty.noResults') 
                    : t('empty.noTransactions')
                  }
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {searchQuery || Object.values(filters).some(f => f !== 'all' && f !== '')
                    ? t('empty.tryDifferentFilters')
                    : t('empty.getStarted')
                  }
                </p>
                <Button onClick={handleAddTransaction} variant="primary">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('actions.addFirstTransaction')}
                </Button>
              </div>
            </div>
          ) : (
            <TransactionList
              transactions={transactions}
              onEdit={(transaction) => handleEditTransaction(transaction, 'edit')}
              onDuplicate={(transaction) => handleEditTransaction(transaction, 'duplicate')}
              onDelete={handleDeleteTransaction}
              onView={(transaction) => handleEditTransaction(transaction, 'view')}
              loading={transactionsLoading}
              hasMore={hasMore}
              loadMore={loadMore}
              viewMode={viewMode}
            />
          )}
        </Card>
      </div>

      {/* ✅ NEW: Clean Modal Architecture */}
      
      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={showAddTransaction}
        onClose={() => setShowAddTransaction(false)}
        onSuccess={handleTransactionSuccess}
      />

      {/* Edit Transaction Modal */}
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

      {/* Recurring Setup Modal */}
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

      {/* Delete Transaction Modal */}
      {showDeleteModal && selectedTransaction && (
        <DeleteTransaction
          isOpen={showDeleteModal}
          transaction={selectedTransaction}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedTransaction(null);
          }}
          onSuccess={handleTransactionSuccess}
        />
      )}
    </div>
  );
};

export default Transactions;