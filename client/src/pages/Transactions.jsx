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
  const { t, language } = useLanguage();
  const { selectedDate, formatDate, setSelectedDate } = useDate();
  const { formatAmount } = useCurrency();
  const isRTL = language === 'he';

  const { 
    data: dashboardData, 
    isLoading: dashboardLoading, 
    error: dashboardError 
  } = useDashboard();

  // ✅ Add calendar state
  const [showCalendar, setShowCalendar] = useState(false);

  // ✅ State definitions first
  const [view, setView] = useState('all');
  const [period, setPeriod] = useState('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showRecurring, setShowRecurring] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  const [filters, setFilters] = useState({
    categories: [],
    dateRange: null,
    minAmount: null,
    maxAmount: null,
    recurring: 'all'
  });

  // ✅ Hooks after state
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

  const { 
    createTransaction,
    updateTransaction,
    deleteTransaction
  } = useTransactions();

  // ✅ Filtered transactions calculation with better error handling
  const filteredTransactions = useMemo(() => {
    // ✅ Defensive programming - וודא שיש array
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

  // ✅ השתמש בנתוני Dashboard במקום לחישוב מאזן מקומי
  const {
    periodTransactions: dashboardPeriodTransactions,
    loading: dashboardLoadingTransactions,
    error: dashboardErrorTransactions,
    refreshTransactions: refreshDashboardTransactions,
    getTransactionsByType: getDashboardTransactionsByType,
    searchTransactions: searchDashboardTransactions,
    totalCount: dashboardTotalCount,
    period: currentDashboardPeriod
  } = useTransactionsList({
    period,
    type: view !== 'all' ? view : null,
    searchTerm,
    page: 1,
    limit: 100
  });

  // ✅ קבל נתוני מאזן מ-Dashboard במקום חישוב מקומי
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

  // ✅ הוסף את המשתנה totals שחסר
  const totals = useMemo(() => {
    // בחר את התקופה הנוכחית מהמאזן - השתמש ב-monthly כברירת מחדל
    const currentPeriodData = balanceData.monthly;
    
    return {
      income: currentPeriodData.income || 0,
      expenses: currentPeriodData.expenses || 0,
      balance: currentPeriodData.balance || 0,
      count: dashboardData?.recentTransactions?.length || 0
    };
  }, [balanceData, dashboardData]);

  // ✅ Define handleTransactionSuccess FIRST - רק פעם אחת!
  const handleTransactionSuccess = useCallback(() => {
    refreshTransactions();
  }, [refreshTransactions]);

  // ✅ Now define other handlers that depend on handleTransactionSuccess
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
      await handleTransactionSuccess(); // ✅ Now this is defined!
    } catch (error) {
      console.error('Delete failed:', error);
    }
  }, [deleteTransaction, handleTransactionSuccess]);

  // ✅ בדיקת loading - עכשיו מטפל בשני ההוקים
  if (loading || recurringLoading || dashboardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text={t('common.loading')} />
      </div>
    );
  }

  // ✅ בדיקת שגיאות
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

  // ✅ Debug logging for development
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

  // ✅ Add date change handler
  const handleDateChange = useCallback((newDate) => {
    console.log('[Transactions] 📅 Date changed to:', newDate);
    setSelectedDate(newDate);
    setShowCalendar(false);
  }, [setSelectedDate]);

  return (
    <PageContainer>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header with Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('nav.transactions')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {t('transactions.description')} - {formatDate(selectedDate)}
              </p>
            </div>

            {/* Quick Stats + Date Selector */}
            <div className="flex items-center gap-6">
              {/* Date Selector */}
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="flex items-center gap-2"
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

              {/* Stats - עכשיו עם נתונים מ-Dashboard */}
              <div className="text-center">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  +{formatAmount(totals.income)}
                </div>
                <div className="text-xs text-gray-500">{t('transactions.income')}</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold text-red-600 dark:text-red-400">
                  -{formatAmount(totals.expenses)}
                </div>
                <div className="text-xs text-gray-500">{t('transactions.expense')}</div>
              </div>
              
              <div className="text-center">
                <div className={`text-lg font-bold ${
                  totals.balance >= 0 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-orange-600 dark:text-orange-400'
                }`}>
                  {formatAmount(totals.balance)}
                </div>
                <div className="text-xs text-gray-500">{t('common.balance')}</div>
              </div>
            </div>
          </div>
        </div>

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