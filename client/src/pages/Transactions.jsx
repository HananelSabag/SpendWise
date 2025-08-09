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
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  DollarSign,
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
import FloatingAddTransactionButton from '../components/common/FloatingAddTransactionButton.jsx';

// ✅ NEW: Upcoming Transactions System
import UpcomingTransactionsSimple from '../components/features/transactions/UpcomingTransactionsSimple';
import useAutoRegeneration from '../hooks/useAutoRegeneration';

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
  const [selectedIds, setSelectedIds] = useState(new Set());

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

  // ✅ Enhanced transactions hook with filtering - FIXED destructuring
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

  // ✅ Transaction actions
  const {
    createTransaction,
    updateTransaction,
    deleteTransaction,
    bulkOperations
  } = useTransactionActions();

  // ✅ Auto-regeneration system
  const {
    regenerationStatus,
    isRegenerating,
    triggerRegeneration
  } = useAutoRegeneration();

  // ✅ Derived data - FIXED since transactionsData is now already the transactions array
  const transactions = React.useMemo(() => {
    if (!transactionsData || !Array.isArray(transactionsData)) return [];
    return transactionsData;
  }, [transactionsData]);

  const summary = React.useMemo(() => {
    // ✅ FIXED: Calculate summary from transactions array since transactionsData is now just the array
    const totalIncome = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    return {
      totalIncome,
      totalExpenses,
      netAmount: totalIncome - totalExpenses,
      count: transactions.length
    };
  }, [transactions]);

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

  // ✅ Selection handlers
  const handleTransactionSelect = useCallback((id, isSelected) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (isSelected) next.add(id); else next.delete(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(transactions.map(t => t.id)));
  }, [transactions]);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    await bulkOperations('delete', Array.from(selectedIds));
    setSelectedIds(new Set());
    refetchTransactions();
  }, [selectedIds, bulkOperations, refetchTransactions]);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Page Title */}
            <div className="flex items-center gap-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg"
              >
                <ArrowLeftRight className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <motion.h1 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl font-bold text-gray-900 dark:text-white"
                >
                  {t('pages.transactions.title')}
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm text-gray-600 dark:text-gray-400 mt-1"
                >
                  {t('pages.transactions.subtitle', { count: summary.count })}
                </motion.p>
              </div>
            </div>

            {/* Actions */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-3"
            >
              {/* Removed: Add Transaction Button (replaced by FAB) */}

              {/* Refresh Button */}
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  onClick={refetchTransactions}
                  disabled={transactionsLoading}
                  className="p-2.5 h-auto rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <RefreshCw className={cn("w-4 h-4", transactionsLoading && "animate-spin")} />
                </Button>
              </motion.div>

              {/* Auto-Regeneration Status */}
              {isRegenerating && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/20 rounded-xl"
                >
                  <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                    Auto-generating...
                  </span>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >

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

        {/* ✅ UPCOMING TRANSACTIONS - SIMPLIFIED */}
        <UpcomingTransactionsSimple />

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
            <>
              {/* Bulk selection toolbar */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {t('actions.bulkActions')}
                  {selectedIds.size > 0 && (
                    <span className="ml-2 font-medium">{t('selection.count', { count: selectedIds.size })}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {selectedIds.size === transactions.length && transactions.length > 0 ? (
                    <Button variant="ghost" onClick={handleClearSelection} className="h-8 px-3">
                      {t('actions.deselectAll')}
                    </Button>
                  ) : (
                    <Button variant="ghost" onClick={handleSelectAll} className="h-8 px-3" disabled={transactions.length === 0}>
                      {t('actions.selectAll')}
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    onClick={handleBulkDelete}
                    disabled={selectedIds.size === 0}
                    className="h-8 px-3"
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> {t('actions.delete')}
                  </Button>
                </div>
              </div>

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
                selectedTransactions={selectedIds}
                onTransactionSelect={handleTransactionSelect}
              />
            </>
          )}
        </Card>
      </motion.div>

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

      {/* Floating Add Transaction Button (bottom-left) */}
      <FloatingAddTransactionButton onClick={handleAddTransaction} />
    </div>
  );
};

export default Transactions;