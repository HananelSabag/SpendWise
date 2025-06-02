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
  Eye
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
import TransactionForm from '../components/features/transactions/TransactionForm';
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
  const [view, setView] = useState('all');
  const [period, setPeriod] = useState('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showRecurring, setShowRecurring] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
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
    period,
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
    setShowForm(true);
  }, []);

  const handleDelete = useCallback((transaction) => {
    setTransactionToDelete(transaction);
  }, []);

  const handleFormClose = useCallback(() => {
    setSelectedTransaction(null);
    setShowForm(false);
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
        {/* Header with Stats - Redesigned to match Profile/Dashboard */}
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 text-white p-6 border-0 shadow-md">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">
                  {t('nav.transactions')}
                </h1>
                <p className="text-white/80 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {formatDate(selectedDate, language === 'he' ? 'PPP' : 'PPPP')}
                </p>
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-6">
                {/* Date Selector */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="flex items-center gap-2 bg-white/20 text-white hover:bg-white/30"
                  >
                    <Calendar className="w-4 h-4" />
                    {formatDate(selectedDate, 'MMM dd, yyyy')}
                  </Button>
                  
                  {showCalendar && (
                    <div className="absolute top-full mt-2 z-50 right-0">
                      <CalendarWidget
                        selectedDate={selectedDate}
                        onDateSelect={handleDateChange}
                        onClose={() => setShowCalendar(false)}
                      />
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4">
                  <div className="text-center px-4 py-2 bg-white/10 rounded-lg">
                    <div className="text-lg font-bold text-white flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-green-300" />
                      {formatAmount(totals.income)}
                    </div>
                    <div className="text-xs text-white/80">{t('transactions.income')}</div>
                  </div>
                  
                  <div className="text-center px-4 py-2 bg-white/10 rounded-lg">
                    <div className="text-lg font-bold text-white flex items-center gap-1">
                      <TrendingDown className="w-4 h-4 text-red-300" />
                      {formatAmount(totals.expenses)}
                    </div>
                    <div className="text-xs text-white/80">{t('transactions.expense')}</div>
                  </div>
                  
                  <div className="text-center px-4 py-2 bg-white/10 rounded-lg">
                    <div className="text-lg font-bold text-white">
                      {formatAmount(totals.balance)}
                    </div>
                    <div className="text-xs text-white/80">{t('common.balance')}</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <Input
              placeholder={t('transactions.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
              className="w-full"
            />
          </div>

          {/* View Buttons */}
          <div className="flex gap-2">
            {['all', 'income', 'expense'].map(type => (
              <Button
                key={type}
                variant={view === type ? 'primary' : 'outline'}
                onClick={() => setView(type)}
                icon={type === 'income' ? TrendingUp : type === 'expense' ? TrendingDown : null}
              >
                {t(`transactions.${type}`)}
                {type !== 'all' && (
                  <Badge variant="default" size="small" className="ml-2">
                    {getTransactionsByType(type).length}
                  </Badge>
                )}
              </Button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              icon={Filter}
            >
              {t('common.filters')}
            </Button>

            <Button
              variant="primary"
              onClick={() => setShowForm(true)}
              icon={Plus}
            >
              {t('actions.add')}
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
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

        {/* Transaction List */}
        <Card className="p-0">
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

        {/* Transaction Form Modal */}
        <AnimatePresence>
          {showForm && (
            <Modal
              isOpen={showForm}
              onClose={handleFormClose}
              size="large"
              title={selectedTransaction ? t('transactions.editTransaction') : t('actions.title')}
            >
              <TransactionForm
                transaction={selectedTransaction}
                onClose={handleFormClose}
                onSave={async (data) => {
                  try {
                    if (selectedTransaction) {
                      await updateTransaction(data.transaction_type, selectedTransaction.id, data);
                    } else {
                      await createTransaction(data.transaction_type, data);
                    }
                    handleFormClose();
                    await handleTransactionSuccess();
                  } catch (error) {
                    console.error('Save failed:', error);
                  }
                }}
                loading={false}
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
      </motion.div>
    </PageContainer>
  );
};

export default Transactions;