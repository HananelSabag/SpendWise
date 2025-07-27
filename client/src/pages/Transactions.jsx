/**
 * 💳 TRANSACTIONS PAGE - Mobile-First Transaction Management
 * Features: Zustand stores, Advanced filtering, Mobile-responsive, Real-time updates
 * @version 2.0.0
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
import TransactionList from '../components/features/transactions/TransactionList';
import TransactionCard from '../components/features/transactions/TransactionCard';
import AddTransactions from '../components/features/transactions/AddTransactions';
import EditTransactionPanel from '../components/features/transactions/EditTransactionPanel';
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
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
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

  // ✅ Derived data
  const stats = useMemo(() => {
    if (!transactionsData?.transactions) return null;

    const transactions = transactionsData.transactions;
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const netAmount = totalIncome - totalExpenses;

    return {
      total: transactions.length,
      totalIncome,
      totalExpenses,
      netAmount,
      categories: [...new Set(transactions.map(t => t.category))].length
    };
  }, [transactionsData?.transactions]);

  // ✅ Filter options
  const dateRangeOptions = [
    { value: 'all', label: t('transactions.allTime', { fallback: 'All Time' }) },
    { value: 'week', label: t('transactions.lastWeek', { fallback: 'Last 7 days' }) },
    { value: 'month', label: t('transactions.lastMonth', { fallback: 'Last 30 days' }) },
    { value: 'quarter', label: t('transactions.lastQuarter', { fallback: 'Last 3 months' }) },
    { value: 'year', label: t('transactions.lastYear', { fallback: 'Last year' }) },
    { value: 'custom', label: t('transactions.customRange', { fallback: 'Custom Range' }) }
  ];

  const typeOptions = [
    { value: 'all', label: t('transactions.allTypes', { fallback: 'All Types' }) },
    { value: 'income', label: t('transactions.income', { fallback: 'Income' }) },
    { value: 'expense', label: t('transactions.expenses', { fallback: 'Expenses' }) }
  ];

  const sortOptions = [
    { value: 'date', label: t('transactions.sortByDate', { fallback: 'Date' }) },
    { value: 'amount', label: t('transactions.sortByAmount', { fallback: 'Amount' }) },
    { value: 'category', label: t('transactions.sortByCategory', { fallback: 'Category' }) }
  ];

  // ✅ Handle filter changes
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // ✅ Clear all filters
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
    setCustomDateRange({ startDate: '', endDate: '' });
    setSearchQuery('');
  }, []);

  // ✅ Handle transaction actions
  const handleEditTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setShowEditPanel(true);
  };

  const handleDeleteTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDeleteModal(true);
  };

  const handleTransactionSuccess = useCallback(() => {
    refetchTransactions();
    setShowAddTransaction(false);
    setShowEditPanel(false);
    setShowDeleteModal(false);
    setSelectedTransaction(null);
  }, [refetchTransactions]);

  // ✅ Refresh data
  const handleRefresh = async () => {
    try {
      await refetchTransactions();
      addNotification({
        type: 'success',
        message: t('transactions.refreshed', { fallback: 'Transactions refreshed' })
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: t('errors.refreshFailed', { fallback: 'Failed to refresh data' })
      });
    }
  };

  // ✅ Export transactions
  const handleExport = async () => {
    try {
      addNotification({
        type: 'info',
        message: t('transactions.exportStarted', { fallback: 'Export started...' })
      });
      
      const blob = await api.transactions.export({
        ...filters,
        search: searchQuery
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      addNotification({
        type: 'success',
        message: t('transactions.exportSuccess', { fallback: 'Transactions exported successfully' })
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: t('transactions.exportFailed', { fallback: 'Failed to export transactions' })
      });
    }
  };

  return (
    <div className={cn(
      'min-h-screen bg-gray-50 dark:bg-gray-900 pb-6',
      isRTL && 'rtl'
    )}>
      {/* ✅ Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex flex-col gap-4">
              {/* Title and actions */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    {t('nav.transactions', { fallback: 'Transactions' })}
                  </h1>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {t('transactions.subtitle', { fallback: 'Manage your financial transactions' })}
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  {/* View mode toggle - Desktop only */}
                  <div className="hidden sm:flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('list')}
                      className={cn(
                        'px-3 py-2 text-sm rounded-md transition-colors',
                        viewMode === 'list'
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      )}
                    >
                      {t('transactions.listView', { fallback: 'List' })}
                    </button>
                    <button
                      onClick={() => setViewMode('cards')}
                      className={cn(
                        'px-3 py-2 text-sm rounded-md transition-colors',
                        viewMode === 'cards'
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      )}
                    >
                      {t('transactions.cardView', { fallback: 'Cards' })}
                    </button>
                  </div>

                  {/* Actions */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    loading={transactionsLoading}
                    icon={<RefreshCw />}
                  />

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    icon={<Download />}
                    className="hidden sm:inline-flex"
                  >
                    {t('common.export', { fallback: 'Export' })}
                  </Button>

                  <Button
                    onClick={() => setShowAddTransaction(true)}
                    icon={<Plus />}
                    className="hidden sm:inline-flex"
                  >
                    {t('transactions.addNew', { fallback: 'Add Transaction' })}
                  </Button>
                </div>
              </div>

              {/* Search and filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder={t('transactions.searchPlaceholder', { fallback: 'Search transactions...' })}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Filter toggle */}
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  icon={<Filter />}
                  className={cn(
                    'sm:w-auto w-full',
                    showFilters && 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700'
                  )}
                >
                  {t('transactions.filters', { fallback: 'Filters' })}
                  {Object.values(filters).some(v => v !== 'all' && v !== '' && v !== 'date' && v !== 'desc') && (
                    <Badge variant="primary" size="xs" className="ml-2">
                      {Object.values(filters).filter(v => v !== 'all' && v !== '' && v !== 'date' && v !== 'desc').length}
                    </Badge>
                  )}
                </Button>
              </div>

              {/* Statistics */}
              {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {t('transactions.total', { fallback: 'Total' })}
                        </p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {stats.total}
                        </p>
                      </div>
                      <DollarSign className="w-8 h-8 text-gray-400" />
                    </div>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wider">
                          {t('transactions.income', { fallback: 'Income' })}
                        </p>
                        <p className="text-lg font-semibold text-green-700 dark:text-green-300">
                          {formatCurrency(stats.totalIncome)}
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-green-500" />
                    </div>
                  </div>

                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wider">
                          {t('transactions.expenses', { fallback: 'Expenses' })}
                        </p>
                        <p className="text-lg font-semibold text-red-700 dark:text-red-300">
                          {formatCurrency(stats.totalExpenses)}
                        </p>
                      </div>
                      <TrendingDown className="w-8 h-8 text-red-500" />
                    </div>
                  </div>

                  <div className={cn(
                    'rounded-lg p-4',
                    stats.netAmount >= 0 
                      ? 'bg-blue-50 dark:bg-blue-900/20' 
                      : 'bg-orange-50 dark:bg-orange-900/20'
                  )}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={cn(
                          'text-xs font-medium uppercase tracking-wider',
                          stats.netAmount >= 0 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : 'text-orange-600 dark:text-orange-400'
                        )}>
                          {t('transactions.net', { fallback: 'Net' })}
                        </p>
                        <p className={cn(
                          'text-lg font-semibold',
                          stats.netAmount >= 0 
                            ? 'text-blue-700 dark:text-blue-300' 
                            : 'text-orange-700 dark:text-orange-300'
                        )}>
                          {formatCurrency(stats.netAmount)}
                        </p>
                      </div>
                      <ArrowUpDown className={cn(
                        'w-8 h-8',
                        stats.netAmount >= 0 ? 'text-blue-500' : 'text-orange-500'
                      )} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Filters panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('transactions.dateRange', { fallback: 'Date Range' })}
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {dateRangeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('transactions.type', { fallback: 'Type' })}
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {typeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('transactions.sortBy', { fallback: 'Sort By' })}
                  </label>
                  <div className="flex space-x-2">
                    <select
                      value={filters.sortBy}
                      onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {sortOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Clear filters */}
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    fullWidth
                    icon={<X />}
                  >
                    {t('common.clear', { fallback: 'Clear' })}
                  </Button>
                </div>
              </div>

              {/* Custom date range */}
              {filters.dateRange === 'custom' && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    type="date"
                    label={t('transactions.startDate', { fallback: 'Start Date' })}
                    value={customDateRange.startDate}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                  <Input
                    type="date"
                    label={t('transactions.endDate', { fallback: 'End Date' })}
                    value={customDateRange.endDate}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✅ Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Loading state */}
        {transactionsLoading && !transactionsData && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner 
              size="lg" 
              text={t('transactions.loading', { fallback: 'Loading transactions...' })} 
            />
          </div>
        )}

        {/* Error state */}
        {transactionsError && !transactionsData && (
          <Card className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t('transactions.loadError', { fallback: 'Failed to Load Transactions' })}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {transactionsError.message || t('errors.genericError', { fallback: 'Something went wrong' })}
            </p>
            <Button onClick={handleRefresh} variant="primary">
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('common.retry', { fallback: 'Try Again' })}
            </Button>
          </Card>
        )}

        {/* Transactions content */}
        {transactionsData && (
          <>
            {transactionsData.transactions?.length === 0 ? (
              /* Empty state */
              <Card className="p-8 text-center">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {searchQuery || Object.values(filters).some(v => v !== 'all' && v !== '' && v !== 'date' && v !== 'desc')
                    ? t('transactions.noResults', { fallback: 'No transactions found' })
                    : t('transactions.noTransactions', { fallback: 'No transactions yet' })
                  }
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {searchQuery || Object.values(filters).some(v => v !== 'all' && v !== '' && v !== 'date' && v !== 'desc')
                    ? t('transactions.tryDifferentFilters', { fallback: 'Try adjusting your search or filters' })
                    : t('transactions.getStarted', { fallback: 'Add your first transaction to get started' })
                  }
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {(searchQuery || Object.values(filters).some(v => v !== 'all' && v !== '' && v !== 'date' && v !== 'desc')) && (
                    <Button variant="outline" onClick={clearFilters}>
                      {t('transactions.clearFilters', { fallback: 'Clear Filters' })}
                    </Button>
                  )}
                  <Button onClick={() => setShowAddTransaction(true)} icon={<Plus />}>
                    {t('transactions.addFirst', { fallback: 'Add Transaction' })}
                  </Button>
                </div>
              </Card>
            ) : (
              /* Transactions list/grid */
              <div className="space-y-6">
                {viewMode === 'list' ? (
                  <TransactionList
                    transactions={transactionsData.transactions}
                    onEdit={handleEditTransaction}
                    onDelete={handleDeleteTransaction}
                    loading={transactionsLoading}
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {transactionsData.transactions.map((transaction) => (
                      <TransactionCard
                        key={transaction.id}
                        transaction={transaction}
                        onEdit={handleEditTransaction}
                        onDelete={handleDeleteTransaction}
                      />
                    ))}
                  </div>
                )}

                {/* Load more */}
                {hasMore && (
                  <div className="text-center">
                    <Button
                      variant="outline"
                      onClick={loadMore}
                      loading={transactionsLoading}
                      size="lg"
                    >
                      {t('common.loadMore', { fallback: 'Load More' })}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ✅ Mobile floating action button */}
      <div className="fixed bottom-6 right-6 sm:hidden z-40">
        <Button
          variant="primary"
          size="lg"
          onClick={() => setShowAddTransaction(true)}
          className="rounded-full w-14 h-14 shadow-lg"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      {/* ✅ Modals */}
      {showAddTransaction && (
        <AddTransactions
          isOpen={showAddTransaction}
          onClose={() => setShowAddTransaction(false)}
          onSuccess={handleTransactionSuccess}
        />
      )}

      {showEditPanel && selectedTransaction && (
        <EditTransactionPanel
          isOpen={showEditPanel}
          transaction={selectedTransaction}
          onClose={() => {
            setShowEditPanel(false);
            setSelectedTransaction(null);
          }}
          onSuccess={handleTransactionSuccess}
        />
      )}

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