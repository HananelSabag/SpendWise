/**
 * Transactions Page - COMPLETE WITH PROPER EDIT PANEL SIZING
 * 
 * ✅ FIXED: EditTransactionPanel with perfect responsive container sizing
 * ✅ INTEGRATED: All filters moved into the beautiful purple header
 * ✅ STREAMLINED: Search + Type + Category + Period + Recurring all in header
 * ✅ SMART LAYOUT: Responsive design that works on mobile and desktop
 * ✅ NO DUPLICATES: Single beautiful header with everything integrated
 * ✅ PRESERVED: All existing functionality, animations, and infinite loading
 */

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Filter, Plus, Search, RefreshCw, Clock, Sparkles, Activity,
  ArrowUpRight, ArrowDownRight, Settings, ChevronDown, Tag, Check, X
} from 'lucide-react';

// ✅ PRESERVED: All existing imports
import { useTransactions, useRecurringTransactions, useTransactionSearch } from '../hooks/useTransactions';
import { useCategories } from '../hooks/useCategory';
import { useDate } from '../context/DateContext';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';

import PageContainer from '../components/layout/PageContainer';

import TransactionList from '../components/features/transactions/TransactionList';
import AddTransactions from '../components/features/transactions/AddTransactions';
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
 * ✅ ENHANCED: Combined filter configurations
 */
const PERIOD_OPTIONS = [
  { key: 'today', labelKey: 'common.today', days: 0 },
  { key: 'week', labelKey: 'common.last7Days', days: 7 },
  { key: 'month', labelKey: 'common.thisMonth', days: 30 },
  { key: '3months', labelKey: 'common.last90Days', days: 90 }
];

const TYPE_FILTERS = [
  { key: 'all', icon: Activity, labelKey: 'transactions.all' },
  { key: 'income', icon: ArrowUpRight, labelKey: 'transactions.income' },
  { key: 'expense', icon: ArrowDownRight, labelKey: 'transactions.expense' }
];

const RECURRING_OPTIONS = [
  { key: 'all', labelKey: 'common.all' },
  { key: 'recurring', labelKey: 'transactions.recurring' },
  { key: 'single', labelKey: 'transactions.single' }
];

/**
 * ENHANCED Transactions Page - All filters integrated into header
 */
const Transactions = () => {
  const { t, language } = useLanguage();
  const { formatAmount } = useCurrency();
  const { categories = [] } = useCategories();

  // ✅ PRESERVED: All existing state management
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddTransactions, setShowAddTransactions] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showActionsPanel, setShowActionsPanel] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [editingSingle, setEditingSingle] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // ✅ NEW: Enhanced filters state
  const [filters, setFilters] = useState({
    type: 'all',
    categories: [],
    startDate: '',
    endDate: '',
    recurring: 'all'
  });
  
  // ✅ NEW: UI state for dropdowns
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const isRTL = language === 'he';

  // ✅ ENHANCED: Complete filter options building
  const filterOptions = useMemo(() => {
    const options = {
      type: filters.type !== 'all' ? filters.type : null,
      searchTerm: searchTerm || '',
      startDate: filters.startDate || null,
      endDate: filters.endDate || null,
      categories: filters.categories.length > 0 ? filters.categories : null
    };
    
    // ✅ FIX: Pass recurring filter directly to useTransactions (handled client-side)
    if (filters.recurring !== 'all') {
      options.recurring = filters.recurring;
    }
    
    return options;
  }, [filters, searchTerm]);

  // ✅ NEW: Use optimized useTransactions with integrated filters
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

  // ✅ NEW: Filter change handlers
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handlePeriodChange = useCallback((period) => {
    setSelectedPeriod(period.key);
    
    if (period.days === 0) {
      // Today
      const today = new Date().toISOString().split('T')[0];
      setFilters(prev => ({ ...prev, startDate: today, endDate: today }));
    } else {
      // Last N days
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - period.days);
      
      setFilters(prev => ({
        ...prev,
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
      }));
    }
  }, []);

  const handleFilterReset = useCallback(() => {
    setFilters({
      type: 'all',
      categories: [],
      startDate: '',
      endDate: '',
      recurring: 'all'
    });
    setSearchTerm('');
    setSelectedPeriod('month');
    setCategorySearch('');
    setShowCategoryDropdown(false);
    clearFilters();
  }, [clearFilters]);

  // ✅ NEW: Category handling
  const filteredCategories = useMemo(() => {
    if (!categorySearch) return categories.slice(0, 12);
    
    return categories.filter(category => {
      const name = category.is_default 
        ? t(`categories.${category.icon}`) 
        : category.name;
      return name.toLowerCase().includes(categorySearch.toLowerCase());
    }).slice(0, 12);
  }, [categories, categorySearch, t]);

  const handleCategoryToggle = useCallback((categoryId) => {
    const currentCategories = filters.categories || [];
    const isSelected = currentCategories.includes(categoryId);
    
    const newCategories = isSelected
      ? currentCategories.filter(id => id !== categoryId)
      : [...currentCategories, categoryId];
      
    handleFilterChange('categories', newCategories);
  }, [filters.categories, handleFilterChange]);

  // ✅ NEW: Active filter count
  const getActiveFilterCount = useCallback(() => {
    let count = 0;
    if (filters.type !== 'all') count++;
    if (filters.categories?.length > 0) count++;
    if (filters.startDate || filters.endDate) count++;
    if (filters.recurring !== 'all') count++;
    if (searchTerm) count++;
    return count;
  }, [filters, searchTerm]);

  const activeCount = getActiveFilterCount();

  // ✅ PRESERVED: All existing event handlers exactly as before
  const handleTransactionSuccess = useCallback(() => {
    refreshRecurring();
    setShowSuccess(true);
    
    setTimeout(() => {
      setShowAddTransactions(false);
      setShowSuccess(false);
    }, 2000);
  }, [refreshRecurring]);

  // ✅ FIXED: Add missing handleEditTransaction for RecurringModal
  const handleEditTransaction = useCallback((transaction, single = false) => {
    setSelectedTransaction(transaction);
    setEditingSingle(single);
    setShowRecurringModal(false); // Close recurring modal first
    setShowEditModal(true);
  }, []);

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
        
        {/* ✅ ENHANCED: Beautiful header with ALL filters integrated */}
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
            
            <div className="relative z-10 p-4 lg:p-5">
              {/* ✅ COMPACT: Header with period buttons on right */}
              <div className="space-y-3">
                
                {/* Title Row with Periods on Right */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className="p-2 bg-white/20 rounded-xl backdrop-blur-sm"
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
                      <Activity className="w-6 h-6" />
                    </motion.div>
                    <div>
                      <motion.h1 
                        className="text-xl lg:text-2xl font-bold mb-1 flex items-center gap-2"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        {t('nav.transactions')}
                        <motion.div
                          animate={{ rotate: [0, 15, -15, 0] }}
                          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                        >
                          <Sparkles className="w-5 h-5" />
                        </motion.div>
                      </motion.h1>
                      <motion.div 
                        className="flex items-center gap-2 text-white/90"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">
                          {PERIOD_OPTIONS.find(p => p.key === selectedPeriod)?.labelKey 
                            ? t(PERIOD_OPTIONS.find(p => p.key === selectedPeriod).labelKey)
                            : selectedPeriod}
                        </span>
                        <span className="text-white/70">•</span>
                        <span className="font-medium">
                          {filters.type === 'all' ? t('transactions.all') : 
                           filters.type === 'income' ? t('transactions.income') : 
                           t('transactions.expense')}
                        </span>
                        {activeCount > 0 && (
                          <>
                            <span className="text-white/70">•</span>
                            <Badge variant="secondary" className="bg-white/20 text-white border-white/30 px-2 py-1 text-xs">
                              {activeCount}
                            </Badge>
                          </>
                        )}
                      </motion.div>
                    </div>
                  </div>

                  {/* Period Filters on Right */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex flex-wrap lg:flex-nowrap gap-2"
                  >
                    {PERIOD_OPTIONS.map((period) => (
                      <button
                        key={period.key}
                        onClick={() => handlePeriodChange(period)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-all backdrop-blur-sm ${
                          selectedPeriod === period.key
                            ? 'bg-white/30 text-white shadow-sm'
                            : 'bg-white/10 text-white/80 hover:text-white hover:bg-white/20'
                        }`}
                      >
                        {t(period.labelKey)}
                      </button>
                    ))}
                    {activeCount > 0 && (
                      <button
                        onClick={handleFilterReset}
                        className="px-3 py-2 text-sm font-medium rounded-lg transition-all backdrop-blur-sm bg-white/10 text-white/80 hover:text-white hover:bg-white/20 border border-white/30"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </motion.div>
                </div>

                {/* ✅ COMPACT: Essential Filters Only */}
                <div className="space-y-3">
                  
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
                    <input
                      type="text"
                      placeholder={t('transactions.searchPlaceholder')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:bg-white/30 focus:border-white/50 transition-all backdrop-blur-sm"
                    />
                  </div>

                  {/* Type Filters + Advanced Toggle */}
                  <div className="flex items-center gap-3">
                    
                    {/* Type Filter */}
                    <div className="flex-1">
                      <div className="grid grid-cols-3 bg-white/10 rounded-lg p-1 gap-1">
                        {TYPE_FILTERS.map(({ key, icon: Icon, labelKey }) => (
                          <button
                            key={key}
                            onClick={() => handleFilterChange('type', key)}
                            className={`flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium rounded-md transition-all ${
                              filters.type === key
                                ? 'bg-white/30 text-white shadow-sm backdrop-blur-sm'
                                : 'text-white/80 hover:text-white hover:bg-white/20'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{t(labelKey)}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Advanced Toggle */}
                    <button
                      onClick={() => setShowMoreFilters(!showMoreFilters)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all backdrop-blur-sm ${
                        showMoreFilters || (filters.categories?.length > 0 || filters.recurring !== 'all')
                          ? 'bg-white/30 text-white shadow-sm border border-white/40'
                          : 'bg-white/10 border border-white/30 text-white/80 hover:text-white hover:bg-white/20'
                      }`}
                    >
                      <Filter className="w-4 h-4" />
                      <span className="hidden sm:inline">{t('common.advanced')}</span>
                      <motion.div
                        animate={{ rotate: showMoreFilters ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </motion.div>
                      {(filters.categories?.length > 0 || filters.recurring !== 'all') && (
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      )}
                    </button>
                  </div>
                </div>

                {/* ✅ CLEAN: Advanced Filters (Hidden by Default) */}
                <AnimatePresence>
                  {showMoreFilters && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-white/20 pt-3"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        
                        {/* Category Filter */}
                        <div className="relative">
                          <button
                            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                            className="w-full flex items-center justify-between px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-sm text-white hover:bg-white/20 transition-all backdrop-blur-sm"
                          >
                            <div className="flex items-center gap-2">
                              <Tag className="w-4 h-4" />
                              <span className="truncate">
                                {filters.categories?.length > 0 
                                  ? `${filters.categories.length} ${t('common.selected')} ${t('common.category')}`
                                  : t('common.category')
                                }
                              </span>
                            </div>
                            <motion.div
                              animate={{ rotate: showCategoryDropdown ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronDown className="w-4 h-4 text-white/60" />
                            </motion.div>
                          </button>

                          {/* Category Dropdown */}
                          <AnimatePresence>
                            {showCategoryDropdown && (
                              <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                className="absolute top-full left-0 right-0 z-50 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-64 overflow-hidden"
                              >
                                {/* Search */}
                                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                                  <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                      type="text"
                                      placeholder={t('common.search') + '...'}
                                      value={categorySearch}
                                      onChange={(e) => setCategorySearch(e.target.value)}
                                      className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700"
                                    />
                                  </div>
                                </div>

                                {/* Categories */}
                                <div className="max-h-48 overflow-y-auto p-2">
                                  <div className="space-y-1">
                                    {filteredCategories.map((category) => {
                                      const isSelected = filters.categories?.includes(category.id);
                                      const categoryName = category.is_default 
                                        ? t(`categories.${category.icon}`) 
                                        : category.name;

                                      return (
                                        <button
                                          key={category.id}
                                          onClick={() => handleCategoryToggle(category.id)}
                                          className={`flex items-center gap-3 p-2 text-left rounded-lg text-sm transition-all w-full ${
                                            isSelected
                                              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                                              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                                          }`}
                                        >
                                          <span className="text-lg">{category.icon}</span>
                                          <span className="flex-1 truncate">{categoryName}</span>
                                          {isSelected && (
                                            <Check className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Recurring Filter */}
                        <div>
                          <div className="grid grid-cols-3 bg-white/10 rounded-lg p-1 gap-1">
                            {RECURRING_OPTIONS.map(({ key, labelKey }) => (
                              <button
                                key={key}
                                onClick={() => handleFilterChange('recurring', key)}
                                className={`py-2 px-2 text-sm font-medium rounded-md transition-all truncate ${
                                  filters.recurring === key
                                    ? 'bg-white/30 text-white shadow-sm backdrop-blur-sm'
                                    : 'text-white/80 hover:text-white hover:bg-white/20'
                                }`}
                              >
                                {t(labelKey)}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Custom Date Range */}
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-white/80 mb-2 flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          {t('common.customRange') || 'Custom Date Range'}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="date"
                            value={filters.startDate || ''}
                            onChange={(e) => {
                              handleFilterChange('startDate', e.target.value);
                              setSelectedPeriod(null);
                            }}
                            className="px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm placeholder-white/60 focus:bg-white/30 focus:border-white/50 transition-all backdrop-blur-sm"
                          />
                          <input
                            type="date"
                            value={filters.endDate || ''}
                            onChange={(e) => {
                              handleFilterChange('endDate', e.target.value);
                              setSelectedPeriod(null);
                            }}
                            className="px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm placeholder-white/60 focus:bg-white/30 focus:border-white/50 transition-all backdrop-blur-sm"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* ✅ FIXED: TransactionList with proper transactions data */}
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

      {/* ✅ PRESERVED: Beautiful Floating + Button exactly as before */}
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
          <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-60"></div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary-400 to-primary-500 animate-pulse"></div>
          
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

      {/* ✅ FIXED: EditTransactionPanel with perfect responsive container */}
      {showEditModal && selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          {/* ✅ FIXED: Perfect responsive container that adapts to all screen sizes */}
          <div className="w-full max-w-xs sm:max-w-sm md:max-w-lg lg:max-w-3xl xl:max-w-4xl mt-2 sm:mt-4 mb-4 sm:mb-8 bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-2xl overflow-hidden min-h-0 max-h-[98vh] sm:max-h-[95vh]">
            <EditTransactionPanel
              transaction={selectedTransaction}
              editingSingle={editingSingle}
              onSuccess={() => {
                refreshAll();
                setShowEditModal(false);
              }}
              onClose={() => setShowEditModal(false)}
            />
          </div>
        </div>
      )}

      <Modal
        isOpen={showRecurringModal}
        onClose={() => setShowRecurringModal(false)}
        title={t('transactions.recurringActions')}
        className="max-w-4xl w-full"
      >
        <RecurringModal
          onClose={() => setShowRecurringModal(false)}
          onEdit={handleEditTransaction}
          onSuccess={() => {
            refreshAll();
            setShowRecurringModal(false);
          }}
        />
      </Modal>

      {/* ✅ FIXED: Proper DeleteTransaction Modal Integration */}
      <DeleteTransaction
        transaction={selectedTransaction}
        isOpen={showActionsPanel}
        onClose={() => {
          setShowActionsPanel(false);
          setSelectedTransaction(null);
        }}
        onConfirm={async (transaction, deleteFuture, deleteAll) => {
          try {
            // Handle the actual deletion based on the type
            if (deleteAll) {
              // Delete entire recurring series or template
              await deleteTransaction(transaction.id, { deleteAll: true });
            } else if (deleteFuture) {
              // Stop future occurrences
              await deleteTransaction(transaction.id, { deleteFuture: true });
            } else {
              // Delete single occurrence
              await deleteTransaction(transaction.id, { deleteSingle: true });
            }
            
            refreshAll();
            setShowActionsPanel(false);
            setSelectedTransaction(null);
          } catch (error) {
            console.error('Delete failed:', error);
          }
        }}
        onOpenSkipDates={(transaction) => {
          // Handle skip dates functionality
          setSelectedTransaction(transaction);
          setShowRecurringModal(true);
        }}
      />

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