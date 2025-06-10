/**
 * TransactionList Component - OPTIMIZED INFINITE SCROLL VERSION
 * 
 * ✅ FIXED: True infinite scroll without re-rendering existing items
 * ✅ FIXED: Stable React keys preventing duplicate warnings
 * ✅ FIXED: Proper infinite scroll intersection observer
 * ✅ FIXED: No more jarring full-list re-renders
 * ✅ PRESERVED: All existing functionality and animations
 */

import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Package, Clock, RefreshCw, ArrowDown, Loader2, 
  ArrowUpRight, ArrowDownRight, ChevronDown, Eye, EyeOff
} from 'lucide-react';

import { useLanguage } from '../../../context/LanguageContext';
import { useDate } from '../../../context/DateContext';
import { useCurrency } from '../../../context/CurrencyContext';

import TransactionCard from './TransactionCard';
import LoadingSpinner from '../../ui/LoadingSpinner';
import { Button, Badge } from '../../ui';
import { cn } from '../../../utils/helpers';

/**
 * ✅ PRESERVED: All existing animation configurations
 */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

const groupVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 25
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20
    }
  }
};

const emptyVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20
    }
  }
};

/**
 * OPTIMIZED TransactionList with TRUE infinite scroll
 */
const TransactionList = ({ 
  // ✅ NEW: Clean data props from infinite query
  transactions = [],
  pagination = {},
  summary = {},
  isLoading = false,
  isLoadingMore = false,
  error = null,
  // ✅ SIMPLIFIED: Infinite scroll controls
  onLoadMore,
  hasMoreToLoad = false,
  progressiveStatus = {},
  // ✅ PRESERVED: All existing handlers
  onEdit,
  onEditSingle,
  onEditTemplate,
  onDelete,
  onOpenRecurringManager,
  emptyMessage,
  className = ''
}) => {
  const { t, language } = useLanguage();
  const { formatDate } = useDate();
  const { formatAmount } = useCurrency();
  
  const [showUpcoming, setShowUpcoming] = useState(false);
  const isRTL = language === 'he';

  // ✅ OPTIMIZED: Efficient transaction separation with memoization
  const { pastTransactions, futureTransactions } = useMemo(() => {
    if (!transactions || !Array.isArray(transactions)) {
      return { pastTransactions: [], futureTransactions: [] };
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const past = [];
    const future = [];
    
    transactions.forEach(transaction => {
      try {
        const transactionDate = new Date(transaction.date);
        if (isNaN(transactionDate.getTime())) {
          past.push(transaction);
          return;
        }
        
        if (transactionDate <= today) {
          past.push(transaction);
        } else {
          future.push(transaction);
        }
      } catch (error) {
        console.warn('Date parsing error:', error);
        past.push(transaction);
      }
    });
    
    return { 
      pastTransactions: past, 
      futureTransactions: future.sort((a, b) => new Date(a.date) - new Date(b.date))
    };
  }, [transactions]);

  // ✅ OPTIMIZED: Stable grouping with unique keys
  const groupedPastTransactions = useMemo(() => {
    if (!pastTransactions.length) return [];

    const groups = {};
    pastTransactions.forEach(transaction => {
      const date = new Date(transaction.date).toDateString();
      if (!groups[date]) {
        groups[date] = {
          transactions: [],
          totalIncome: 0,
          totalExpenses: 0
        };
      }
      groups[date].transactions.push(transaction);
      
      // Calculate daily balance for header summary
      const amount = Math.abs(parseFloat(transaction.amount) || 0);
      if (transaction.transaction_type === 'income' || transaction.type === 'income') {
        groups[date].totalIncome += amount;
      } else {
        groups[date].totalExpenses += amount;
      }
    });

    return Object.entries(groups)
      .sort(([a], [b]) => new Date(b) - new Date(a))
      .map(([date, data]) => ({
        date: new Date(date),
        dateKey: date, // ✅ STABLE: Use date string as stable key
        transactions: data.transactions.sort((a, b) => new Date(b.date) - new Date(a.date)),
        totalIncome: data.totalIncome,
        totalExpenses: data.totalExpenses,
        netBalance: data.totalIncome - data.totalExpenses
      }));
  }, [pastTransactions]);

  // ✅ FIXED: Proper infinite scroll intersection observer
  const loadMoreRef = useRef();
  const observerRef = useRef();

  useEffect(() => {
    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Only setup observer if we have more to load and auto-load is enabled
    if (!hasMoreToLoad || !progressiveStatus.canAutoLoad || !onLoadMore) {
      return;
    }

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoadingMore) {
          console.log('🔄 [TRANSACTION-LIST] Auto-loading more transactions...');
          onLoadMore();
        }
      },
      { 
        threshold: 0.1, 
        rootMargin: '100px' // Start loading 100px before reaching the element
      }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMoreToLoad, progressiveStatus.canAutoLoad, onLoadMore, isLoadingMore]);

  // ✅ PRESERVED: Loading state
  if (isLoading && transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <LoadingSpinner size="large" />
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          {t('common.loading')}
        </p>
      </div>
    );
  }

  // ✅ PRESERVED: Error state  
  if (error) {
    return (
      <motion.div 
        variants={emptyVariants}
        initial="hidden"
        animate="visible"
        className="text-center py-12"
      >
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 max-w-md mx-auto">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <Package className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
            {t('dashboard.transactions.fetchError')}
          </h3>
          <p className="text-red-700 dark:text-red-300 mb-4">
            {error.message || t('errors.server')}
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('common.retry')}
          </Button>
        </div>
      </motion.div>
    );
  }

  // ✅ PRESERVED: Empty state
  if (groupedPastTransactions.length === 0 && futureTransactions.length === 0) {
    return (
      <motion.div 
        variants={emptyVariants}
        initial="hidden"
        animate="visible"
        className="text-center py-12"
      >
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-12 h-12 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {emptyMessage || t('transactions.noTransactions')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('transactions.noTransactionsDesc')}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* ✅ PRESERVED: Future transactions section */}
      {futureTransactions.length > 0 && (
        <motion.div variants={groupVariants} initial="hidden" animate="visible">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl overflow-hidden">
            <div 
              className="cursor-pointer"
              onClick={() => setShowUpcoming(!showUpcoming)}
            >
              <div className="px-4 lg:px-6 py-3 lg:py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                    {t('transactions.upcomingTransactions')}
                  </h3>
                  <Badge variant="secondary" size="small" className="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                    {futureTransactions.length}
                  </Badge>
                </div>
                <motion.div
                  animate={{ rotate: showUpcoming ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </motion.div>
              </div>
            </div>

            <AnimatePresence>
              {showUpcoming && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t border-blue-200 dark:border-blue-800 bg-blue-25 dark:bg-blue-900/10"
                >
                  <div className="p-4 lg:p-6">
                    <div className="grid gap-3 lg:grid-cols-2">
                      {futureTransactions.slice(0, 6).map((transaction) => (
                        <TransactionCard
                          key={`future-${transaction.id}`}
                          transaction={transaction}
                          onEdit={onEdit}
                          onEditSingle={onEditSingle}
                          onEditTemplate={onEditTemplate}
                          onDelete={onDelete}
                          onOpenRecurringManager={onOpenRecurringManager}
                          showActions={false}
                          variant="compact"
                        />
                      ))}
                    </div>
                    {futureTransactions.length > 6 && (
                      <div className="mt-4 text-center">
                        <Badge variant="outline" size="small">
                          +{futureTransactions.length - 6} {t('common.more')}
                        </Badge>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* ✅ FIXED: Main transaction groups with stable keys */}
      {groupedPastTransactions.length > 0 && (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
          {groupedPastTransactions.map(({ date, dateKey, transactions: dayTransactions, totalIncome, totalExpenses, netBalance }) => (
            <motion.div
              key={dateKey} // ✅ STABLE: Use date string as key
              variants={groupVariants}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* ✅ ENHANCED: Date header with small balance summary */}
              <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-3 lg:py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 lg:w-5 h-4 lg:h-5 text-gray-500 dark:text-gray-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm lg:text-base">
                      {formatDate(date)}
                    </h3>
                    <Badge variant="secondary" size="small">
                      {dayTransactions.length}
                    </Badge>
                  </div>
                  
                  {/* ✅ NEW: Small balance summary in header */}
                  <div className="flex items-center gap-3 text-xs lg:text-sm">
                    {totalIncome > 0 && (
                      <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <ArrowUpRight className="w-3 h-3" />
                        <span className="font-medium">{formatAmount(totalIncome)}</span>
                      </div>
                    )}
                    {totalExpenses > 0 && (
                      <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                        <ArrowDownRight className="w-3 h-3" />
                        <span className="font-medium">{formatAmount(totalExpenses)}</span>
                      </div>
                    )}
                    {totalIncome > 0 && totalExpenses > 0 && (
                      <div className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                        netBalance >= 0 
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                      )}>
                        <span>{netBalance >= 0 ? '+' : '-'}{formatAmount(Math.abs(netBalance))}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 📱 MOBILE: Single column transaction list */}
              <div className="lg:hidden p-4">
                <div className="space-y-3">
                  {dayTransactions.map((transaction) => (
                    <motion.div
                      key={`mobile-${transaction.id}`} // ✅ STABLE: Unique mobile key
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <TransactionCard
                        transaction={transaction}
                        onEdit={onEdit}
                        onEditSingle={onEditSingle}
                        onEditTemplate={onEditTemplate}
                        onDelete={onDelete}
                        onOpenRecurringManager={onOpenRecurringManager}
                        variant="mobile"
                      />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* 💻 DESKTOP: 2-column grid layout */}
              <div className="hidden lg:block p-6">
                <div className="grid grid-cols-2 gap-4">
                  {dayTransactions.map((transaction) => (
                    <motion.div
                      key={`desktop-${transaction.id}`} // ✅ STABLE: Unique desktop key
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <TransactionCard
                        transaction={transaction}
                        onEdit={onEdit}
                        onEditSingle={onEditSingle}
                        onEditTemplate={onEditTemplate}
                        onDelete={onDelete}
                        onOpenRecurringManager={onOpenRecurringManager}
                        variant="compact"
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ✅ FIXED: Optimized infinite scroll loading */}
      {hasMoreToLoad && (
        <div className="text-center py-6">
          {progressiveStatus.canAutoLoad ? (
            <div ref={loadMoreRef} className="flex items-center justify-center">
              {isLoadingMore ? (
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="flex items-center gap-2 text-gray-500 dark:text-gray-400"
                >
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">{t('common.loading')}</span>
                </motion.div>
              ) : (
                <motion.div
                  className="text-gray-400 text-sm"
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Scroll for more...
                </motion.div>
              )}
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <ArrowDown className="w-4 h-4 mr-2" />
                  {t('common.loadMore')} ({progressiveStatus.remainingCount} {t('common.more')})
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* ✅ FIXED: Small corner loading indicator for refreshes */}
      <AnimatePresence>
        {isLoading && transactions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-20 right-6 z-30 bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Refreshing...
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TransactionList;