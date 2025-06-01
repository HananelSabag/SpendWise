// pages/Transactions.jsx
import React, { useState, useEffect, useMemo } from 'react';
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
import { useLanguage } from '../context/LanguageContext';
import { useTransactions } from '../context/TransactionContext';
import { useDate } from '../context/DateContext';
import { useCurrency } from '../context/CurrencyContext';

// Layout
import PageContainer from '../components/layout/PageContainer';

// Features
import TransactionList from '../components/features/transactions/TransactionList';
import TransactionForm from '../components/features/transactions/TransactionForm';
import TransactionFilters from '../components/features/transactions/TransactionFilters';
import DeleteTransaction from '../components/features/transactions/DeleteTransaction';
import RecurringModal from '../components/features/transactions/RecurringModal';

// UI
import { Card, Button, Input, Badge, Modal } from '../components/ui';

/**
 * Transactions Page Component
 * Main page for managing all transactions with filtering, searching, and CRUD operations
 */
const Transactions = () => {
  const { t, language } = useLanguage();
  const { 
    periodTransactions, 
    recurringTransactions,
    loading,
    getByPeriod,
    getRecurringTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction
  } = useTransactions();
  const { selectedDate, formatDate } = useDate();
  const { formatAmount } = useCurrency();
  
  const isRTL = language === 'he';

  // State
  const [view, setView] = useState('all'); // all, income, expense
  const [period, setPeriod] = useState('month'); // day, week, month, year
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showRecurring, setShowRecurring] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [transactionToDelete, setTransactionToDelete] = useState(null); // שיניתי את השם מ-deleteTransaction ל-transactionToDelete

  // Filters
  const [filters, setFilters] = useState({
    categories: [],
    dateRange: null,
    minAmount: null,
    maxAmount: null,
    recurring: 'all' // all, recurring, oneTime
  });

  // Load data
  useEffect(() => {
    getByPeriod(period, selectedDate);
    getRecurringTransactions();
  }, [period, selectedDate]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
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

    // Apply other filters...
    if (filters.categories.length > 0) {
      filtered = filtered.filter(tx => 
        filters.categories.includes(tx.category_id)
      );
    }

    if (filters.recurring !== 'all') {
      filtered = filtered.filter(tx => 
        filters.recurring === 'recurring' ? tx.is_recurring : !tx.is_recurring
      );
    }

    return filtered;
  }, [periodTransactions, view, searchTerm, filters]);

  // Calculate totals
  const totals = useMemo(() => {
    const income = filteredTransactions
      .filter(tx => tx.transaction_type === 'income')
      .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    
    const expenses = filteredTransactions
      .filter(tx => tx.transaction_type === 'expense')
      .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

    return { income, expenses, balance: income - expenses };
  }, [filteredTransactions]);

  // Recurring impact
  const recurringImpact = useMemo(() => {
    // Make sure recurringTransactions is an array
    const recArray = Array.isArray(recurringTransactions) ? 
                    recurringTransactions : 
                    (recurringTransactions?.data && Array.isArray(recurringTransactions.data)) ?
                    recurringTransactions.data : [];
    
    const monthlyIncome = recArray
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + (tx.monthly_amount || 0), 0);
    
    const monthlyExpenses = recArray
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + (tx.monthly_amount || 0), 0);

    return { monthlyIncome, monthlyExpenses, monthlyBalance: monthlyIncome - monthlyExpenses };  
  }, [recurringTransactions]);

  // Handlers
  const handleEdit = (transaction) => {
    setSelectedTransaction(transaction);
    setShowForm(true);
  };

  const handleDelete = (transaction) => {
    setTransactionToDelete(transaction); // שיניתי כאן גם
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedTransaction(null);
  };

  const handleDeleteConfirm = async (deleteFuture = false) => {
    if (!transactionToDelete) return; // שיניתי כאן
    
    try {
      await deleteTransaction(
        transactionToDelete.transaction_type, // שיניתי כאן
        transactionToDelete.id, // שיניתי כאן
        deleteFuture
      );
      setTransactionToDelete(null); // שיניתי כאן
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

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
        stiffness: 100
      }
    }
  };

  return (
    <PageContainer maxWidth="7xl">
      <motion.div
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {t('transactions.title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {t('transactions.subtitle')}
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowRecurring(true)}
                className="group"
              >
                <Clock className="w-4 h-4 mr-2 group-hover:animate-spin" />
                {t('transactions.recurring')}
                <Badge variant="primary" className="ml-2">
                  {Array.isArray(recurringTransactions) ? 
                    recurringTransactions.length : 
                    (recurringTransactions?.data && Array.isArray(recurringTransactions.data)) ?
                    recurringTransactions.data.length : 0}
                </Badge>
              </Button>
              
              <Button
                variant="primary"
                onClick={() => setShowForm(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('transactions.addNew')}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('home.balance.income')}
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatAmount(totals.income)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('home.balance.expenses')}
                </p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatAmount(totals.expenses)}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('home.balance.total')}
                </p>
                <p className={`text-2xl font-bold ${
                  totals.balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'
                }`}>
                  {formatAmount(totals.balance)}
                </p>
              </div>
              <div className={`w-8 h-8 rounded-full ${
                totals.balance >= 0 ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-orange-100 dark:bg-orange-900/30'
              }`} />
            </div>
          </Card>
        </motion.div>

        {/* Filters Bar */}
        <motion.div variants={itemVariants}>
          <Card className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder={t('common.search')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={Search}
                />
              </div>

              {/* View Tabs */}
              <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                {['all', 'income', 'expense'].map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`px-4 py-2 rounded-md font-medium transition-all ${
                      view === v 
                        ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {t(`transactions.view.${v}`)}
                  </button>
                ))}
              </div>

              {/* Period Selector */}
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="day">{t('home.balance.daily')}</option>
                <option value="week">{t('home.balance.weekly')}</option>
                <option value="month">{t('home.balance.monthly')}</option>
                <option value="year">{t('home.balance.yearly')}</option>
              </select>

              {/* Filter Button */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? 'ring-2 ring-primary-500' : ''}
              >
                <Filter className="w-4 h-4 mr-2" />
                {t('transactions.filters.title')}
                {Object.values(filters).some(f => f && f !== 'all' && (Array.isArray(f) ? f.length > 0 : true)) && (
                  <Badge variant="primary" className="ml-2">
                    {Object.values(filters).filter(f => f && f !== 'all' && (Array.isArray(f) ? f.length > 0 : true)).length}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Expanded Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                    <TransactionFilters
                      filters={filters}
                      onChange={setFilters}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Recurring Impact Card - if there are recurring transactions */}
        {recurringTransactions.length > 0 && (
          <motion.div variants={itemVariants}>
            <Card className="p-4 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {t('transactions.recurringSection.impact')}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('transactions.recurringSection.management')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('home.balance.income')}</p>
                    <p className="font-semibold text-green-600 dark:text-green-400">
                      +{formatAmount(recurringImpact.monthlyIncome)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('home.balance.expenses')}</p>
                    <p className="font-semibold text-red-600 dark:text-red-400">
                      -{formatAmount(recurringImpact.monthlyExpenses)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('home.balance.total')}</p>
                    <p className={`font-semibold ${
                      recurringImpact.monthlyBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'
                    }`}>
                      {formatAmount(recurringImpact.monthlyBalance)}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Transactions List */}
        <motion.div variants={itemVariants}>
          <TransactionList
            transactions={filteredTransactions}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </motion.div>

        {/* Modals */}
        <AnimatePresence>
          {/* Transaction Form Modal */}
          {showForm && (
            <Modal
              isOpen={showForm}
              onClose={handleFormClose}
              size="large"
              title={selectedTransaction ? t('transactions.edit') : t('transactions.addNew')}
            >
              <TransactionForm
                transaction={selectedTransaction}
                onClose={handleFormClose}
                onSave={async (data) => {
                  if (selectedTransaction) {
                    await updateTransaction(
                      data.transaction_type,
                      selectedTransaction.id,
                      data
                    );
                  } else {
                    await createTransaction(data.transaction_type, data);
                  }
                  handleFormClose();
                }}
              />
            </Modal>
          )}

          {/* Delete Confirmation */}
          {transactionToDelete && ( // שיניתי כאן
            <DeleteTransaction
              transaction={transactionToDelete} // שיניתי כאן
              onClose={() => setTransactionToDelete(null)} // שיניתי כאן
              onConfirm={handleDeleteConfirm}
            />
          )}

          {/* Recurring Transactions Modal */}
          {showRecurring && (
            <RecurringModal
              isOpen={showRecurring}
              onClose={() => setShowRecurring(false)}
              transactions={Array.isArray(recurringTransactions) ? 
                           recurringTransactions : 
                           (recurringTransactions?.data && Array.isArray(recurringTransactions.data)) ?
                           recurringTransactions.data : []}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </PageContainer>
  );
};

export default Transactions;