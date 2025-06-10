/**
 * Transactions Page - CORRECTED & COMPLETE VERSION
 * 
 * ✅ FIXED: All syntax errors resolved
 * ✅ FIXED: All missing imports added
 * ✅ PRESERVED: Every single piece of functionality from original
 * ✅ FIXED: Proper infinite loading integration
 */

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Filter, Plus, Search, RefreshCw, Clock, Sparkles, Activity,
  ArrowUpRight, ArrowDownRight, Settings, ChevronDown
} from 'lucide-react';

// ✅ PRESERVED: All existing imports
import { useTransactions, useRecurringTransactions, useTransactionSearch } from '../hooks/useTransactions';
import { useDate } from '../context/DateContext';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';

import PageContainer from '../components/layout/PageContainer';

import TransactionList from '../components/features/transactions/TransactionList';
import AddTransactions from '../components/features/transactions/AddTransactions';
import TransactionFilters from '../components/features/transactions/TransactionFilters';
import DeleteTransaction from '../components/features/transactions/DeleteTransaction';
import RecurringModal from '../components/features/transactions/RecurringModal';
import EditTransactionPanel from '../components/features/transactions/EditTransactionPanel';

import { Card, Button, Badge, Modal } from '../components/ui';

/**
 * ✅ PRESERVED: All existing animation configurations
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
 * ✅ PRESERVED: All existing configurations
 */
const PERIOD_OPTIONS = [
  { key: 'week', labelKey: 'common.last7Days' },
  { key: 'month', labelKey: 'common.thisMonth' },
  { key: '3months', labelKey: 'common.last90Days' },
  { key: 'year', labelKey: 'common.thisYear' }
];

const TYPE_FILTERS = [
  { key: 'all', icon: Activity, labelKey: 'transactions.all' },
  { key: 'income', icon: ArrowUpRight, labelKey: 'transactions.income' },
  { key: 'expense', icon: ArrowDownRight, labelKey: 'transactions.expense' }
];

/**
 * CORRECTED Transactions Page - All syntax errors fixed
 */
const Transactions = () => {
  const { t, language } = useLanguage();
  const { formatAmount } = useCurrency();

  // ✅ PRESERVED: All existing state management
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [view, setView] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddTransactions, setShowAddTransactions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showActionsPanel, setShowActionsPanel] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [editingSingle, setEditingSingle] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // ✅ PRESERVED: Advanced filters state
  const [advancedFilters, setAdvancedFilters] = useState({
    categories: [],
    minAmount: null,
    maxAmount: null,
    recurring: 'all'
  });

  const isRTL = language === 'he';

  // ✅ PRESERVED: Period date calculation function
  const getPeriodDateRange = useCallback((period) => {
    const today = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'week':
        startDate.setDate(today.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(today.getDate() - 30);
        break;
      case '3months':
        startDate.setDate(today.getDate() - 90);
        break;
      case 'year':
        startDate.setFullYear(today.getFullYear() - 1);
        break;
      default:
        return { startDate: null, endDate: null };
    }
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    };
  }, []);

  // ✅ PRESERVED: Complete filter options building
  const filterOptions = useMemo(() => {
    const periodDates = selectedPeriod ? getPeriodDateRange(selectedPeriod) : { startDate: null, endDate: null };
    
    return {
      type: view !== 'all' ? view : null,
      searchTerm: searchTerm || '',
      startDate: periodDates.startDate,
      endDate: periodDates.endDate,
      ...advancedFilters
    };
  }, [view, searchTerm, selectedPeriod, advancedFilters, getPeriodDateRange]);

  // ✅ NEW: Use optimized useTransactions with infinite loading
  const {
    transactions,
    pagination,
    summary,
    isLoading,
    isLoadingMore,
    error,
    loadMore,
    hasMoreToLoad,
    progressiveStatus,
    clearFilters,
    refreshAll
  } = useTransactions(filterOptions);

  // ✅ PRESERVED: All other hooks exactly as before
  const {
    recurringTransactions,
    isLoading: loadingRecurring,
    refresh: refreshRecurring
  } = useRecurringTransactions();

  const {
    results: searchResults,
    isSearching
  } = useTransactionSearch(searchTerm);

  // ✅ PRESERVED: All event handlers exactly as before
  const handleTypeChange = useCallback((type) => {
    setView(type);
  }, []);

  const handlePeriodChange = useCallback((period) => {
    setSelectedPeriod(period);
  }, []);

  const handleFilterChange = useCallback((newFilters) => {
    setAdvancedFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const handleFilterReset = useCallback(() => {
    setAdvancedFilters({
      categories: [],
      minAmount: null,
      maxAmount: null,
      recurring: 'all'
    });
    setView('all');
    setSearchTerm('');
    setSelectedPeriod('month');
    clearFilters();
  }, [clearFilters]);

  const handleTransactionSuccess = useCallback(() => {
    refreshRecurring();
    setShowSuccess(true);
    
    setTimeout(() => {
      setShowAddTransactions(false);
      setShowSuccess(false);
    }, 2000);
  }, [refreshRecurring]);

  // ✅ PRESERVED: All existing edit handlers exactly as before
  const handleEdit = useCallback((transaction, single = false) => {
    setSelectedTransaction(transaction);
    setEditingSingle(single);
    setShowActionsPanel(false);
    setShowEditModal(true);
  }, []);
  
  const handleEditSingle = useCallback((transaction) => {
    setSelectedTransaction(transaction);
    setEditingSingle(true);
    setShowEditModal(true);
  }, []);

  const handleEditTemplate = useCallback((transaction) => {
    setSelectedTransaction(transaction);
    setEditingSingle(false);
    setShowEditModal(true);
  }, []);

  const handleDelete = useCallback((transaction) => {
    setSelectedTransaction(transaction);
    setShowActionsPanel(true);
  }, []);

  const handleOpenRecurringManager = useCallback(() => {
    setShowRecurringModal(true);
  }, []);

  // ✅ PRESERVED: Mobile filter bar component
  const MobileFilterBar = useMemo(() => (
    <div className="space-y-3">
      {/* Mobile Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder={t('transactions.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Mobile Type & Period Filters */}
      <div className="space-y-3">
        {/* Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('common.transactionType') || 'Type'}
          </label>
          <div className="grid grid-cols-3 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 gap-1">
            {TYPE_FILTERS.map(({ key, icon: Icon, labelKey }) => (
              <button
                key={key}
                onClick={() => handleTypeChange(key)}
                className={`flex items-center justify-center gap-2 py-3 text-sm font-medium rounded-md transition-all ${
                  view === key
                    ? 'bg-white dark:bg-gray-600 text-primary-600 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{t(labelKey)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Period Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('common.timePeriod') || 'Period'}
          </label>
          <div className="grid grid-cols-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 gap-1">
            {PERIOD_OPTIONS.map(({ key, labelKey }) => (
              <button
                key={key}
                onClick={() => handlePeriodChange(key)}
                className={`py-3 px-2 text-sm font-medium rounded-md transition-all ${
                  selectedPeriod === key
                    ? 'bg-white dark:bg-gray-600 text-primary-600 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  ), [searchTerm, view, selectedPeriod, t, handleTypeChange, handlePeriodChange]);

  // ✅ PRESERVED: Desktop filter bar component
  const DesktopFilterBar = useMemo(() => (
    <Card className="p-4 mb-6">
      <div className="flex flex-wrap items-center gap-3">
        
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('transactions.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Type Filters */}
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {TYPE_FILTERS.map(({ key, icon: Icon, labelKey }) => (
            <button
              key={key}
              onClick={() => handleTypeChange(key)}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                view === key
                  ? 'bg-white dark:bg-gray-600 text-primary-600 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t(labelKey)}
            </button>
          ))}
        </div>

        {/* Period Filters */}
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {PERIOD_OPTIONS.map(({ key, labelKey }) => (
            <button
              key={key}
              onClick={() => handlePeriodChange(key)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                selectedPeriod === key
                  ? 'bg-white dark:bg-gray-600 text-primary-600 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
      </div>
    </Card>
  ), [searchTerm, view, selectedPeriod, t, handleTypeChange, handlePeriodChange]);

  return (
    <PageContainer
      title={t('nav.transactions')}
      description={t('transactions.description')}
      className="max-w-7xl"
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        
        {/* ✅ PRESERVED: Beautiful header with ALL animations exactly as before */}
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white border-0 shadow-2xl relative overflow-hidden">
            {/* ✅ PRESERVED: Animated background decoration exactly as before */}
            <div className="absolute inset-0">
              <div className="absolute top-0 -right-4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000" />
              <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse delay-500" />
              <div className="absolute top-1/3 right-1/3 w-16 h-16 bg-white/20 rounded-full blur-xl animate-ping" style={{ animationDuration: '3s' }} />
              
              {/* ✅ PRESERVED: Floating animated particles exactly as before */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-white/30 rounded-full"
                  style={{
                    top: `${10 + i * 10}%`,
                    left: `${5 + i * 12}%`,
                  }}
                  animate={{
                    y: [0, -30, 0],
                    opacity: [0.3, 0.8, 0.3],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 4 + i * 0.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.7,
                  }}
                />
              ))}
            </div>
            
            <div className="relative z-10 p-6 lg:p-8">
              {/* ✅ PRESERVED: Original Title with animations exactly as before */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                  <motion.div 
                    className="p-3 bg-white/20 rounded-xl backdrop-blur-sm"
                    animate={{ 
                      rotate: [0, 5, -5, 0],
                      scale: [1, 1.05, 1]
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Activity className="w-8 h-8" />
                  </motion.div>
                  <div>
                    <motion.h1 
                      className="text-2xl lg:text-3xl font-bold mb-1 flex items-center gap-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      {t('nav.transactions')}
                      <motion.div
                        animate={{ rotate: [0, 15, -15, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      >
                        <Sparkles className="w-6 h-6" />
                      </motion.div>
                    </motion.h1>
                    <motion.div 
                      className="flex items-center gap-2 text-white/90"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Clock className="w-4 h-4" />
                      <span className="text-base">
                        {PERIOD_OPTIONS.find(p => p.key === selectedPeriod)?.labelKey 
                          ? t(PERIOD_OPTIONS.find(p => p.key === selectedPeriod).labelKey)
                          : selectedPeriod}
                      </span>
                      <span className="text-white/70">•</span>
                      <span className="font-medium">
                        {view === 'all' ? t('transactions.all') : 
                         view === 'income' ? t('transactions.income') : 
                         t('transactions.expense')}
                      </span>
                    </motion.div>
                  </div>
                </div>

                {/* ✅ PRESERVED: Action buttons with animations exactly as before */}
                <motion.div 
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Button
                    variant="secondary"
                    size="medium"
                    onClick={() => setShowFilters(!showFilters)}
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    {t('common.filters')}
                    {Object.values(advancedFilters).some(v => v && (Array.isArray(v) ? v.length > 0 : true)) && (
                      <Badge variant="secondary" size="small" className="ml-2 bg-white/20">
                        {Object.values(advancedFilters).filter(v => v && (Array.isArray(v) ? v.length > 0 : true)).length}
                      </Badge>
                    )}
                  </Button>
                </motion.div>
              </div>

              {/* 📱 MOBILE: Filter Section */}
              <div className="lg:hidden">
                {MobileFilterBar}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* 💻 DESKTOP: Filter Section */}
        <div className="hidden lg:block">
          {DesktopFilterBar}
        </div>

        {/* ✅ PRESERVED: Advanced filters panel exactly as before */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <TransactionFilters
                onFilterChange={handleFilterChange}
                hideHeader={true}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ✅ FIXED: TransactionList with proper infinite loading */}
        <motion.div variants={itemVariants}>
          <TransactionList
            transactions={transactions}
            pagination={pagination}
            summary={summary}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            error={error}
            onLoadMore={loadMore}
            hasMoreToLoad={hasMoreToLoad}
            progressiveStatus={progressiveStatus}
            onEdit={handleEdit}
            onEditSingle={handleEditSingle}
            onEditTemplate={handleEditTemplate}
            onDelete={handleDelete}
            onOpenRecurringManager={handleOpenRecurringManager}
            emptyMessage={t('transactions.noTransactions')}
          />
        </motion.div>
      </motion.div>

      {/* ✅ PRESERVED: Beautiful Floating + Button with ALL Animations exactly as before */}
      <motion.div
        initial={{ opacity: 0, scale: 0.3, y: 100 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ 
          delay: 1.2, 
          type: "spring",
          stiffness: 200,
          damping: 20
        }}
        className="fixed bottom-6 right-6 z-50"
      >
        <motion.button
          onClick={() => setShowAddTransactions(true)}
          className="w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 group relative overflow-hidden"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title={t('transactions.addTransaction')}
        >
          {/* ✅ PRESERVED: Animated background pulse exactly as before */}
          <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-60"></div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary-400 to-primary-500 animate-pulse"></div>
          
          {/* ✅ PRESERVED: Rotating plus icon exactly as before */}
          <motion.div
            className="relative z-10"
            animate={{ rotate: [0, 0, 180, 180, 0] }}
            transition={{ duration: 6, repeat: Infinity, repeatDelay: 4 }}
          >
            <Plus className="w-8 h-8" />
          </motion.div>
        </motion.button>
      </motion.div>

      {/* ✅ PRESERVED: ALL existing modals exactly as before */}
      <Modal
        isOpen={showAddTransactions}
        onClose={() => setShowAddTransactions(false)}
        title=""
        className="max-w-4xl w-full"
      >
        <AddTransactions
          onSuccess={handleTransactionSuccess}
          onClose={() => setShowAddTransactions(false)}
        />
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={editingSingle ? t('transactions.editSingleOccurrence') : t('transactions.editTransaction')}
        className="max-w-2xl w-full"
      >
        {selectedTransaction && (
          <EditTransactionPanel
            transaction={selectedTransaction}
            editingSingle={editingSingle}
            onSuccess={() => {
              refreshAll();
              setShowEditModal(false);
            }}
            onClose={() => setShowEditModal(false)}
          />
        )}
      </Modal>

      <Modal
        isOpen={showRecurringModal}
        onClose={() => setShowRecurringModal(false)}
        title={t('transactions.recurringActions')}
        className="max-w-4xl w-full"
      >
        <RecurringModal
          onClose={() => setShowRecurringModal(false)}
          onSuccess={() => {
            refreshAll();
            setShowRecurringModal(false);
          }}
        />
      </Modal>

      <Modal
        isOpen={showActionsPanel}
        onClose={() => setShowActionsPanel(false)}
        title={t('transactions.chooseDeleteOption')}
        className="max-w-md w-full"
      >
        {selectedTransaction && (
          <DeleteTransaction
            transaction={selectedTransaction}
            onSuccess={() => {
              refreshAll();
              setShowActionsPanel(false);
            }}
            onClose={() => setShowActionsPanel(false)}
          />
        )}
      </Modal>

      {/* ✅ PRESERVED: Success animation exactly as before */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          >
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-2xl"
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: 2 }}
                className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <motion.div
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 0.3, repeat: 2 }}
                >
                  ✓
                </motion.div>
              </motion.div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {t('transactions.updateSuccess')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('transactions.transactionUpdated')}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
};

export default Transactions;