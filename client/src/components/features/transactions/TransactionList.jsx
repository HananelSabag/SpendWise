/**
 * Enhanced TransactionList Component - Separate Future Transactions
 * 
 * ✅ NEW FEATURES:
 * - Future transactions in separate collapsible section
 * - Clean main transaction view (past/present only)
 * - Better UX with clear visual separation
 * - Optional upcoming transactions preview
 */

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Package, Clock, Search, TrendingUp, TrendingDown, 
  DollarSign, ChevronDown, ChevronUp, Eye, EyeOff, Zap
} from 'lucide-react';

import { useTransactions } from '../../../hooks/useTransactions';
import { useLanguage } from '../../../context/LanguageContext';
import { useDate } from '../../../context/DateContext';
import { useCurrency } from '../../../context/CurrencyContext';

import TransactionCard from './TransactionCard';
import LoadingSpinner from '../../ui/LoadingSpinner';
import { Button, Badge } from '../../ui';
import { cn } from '../../../utils/helpers';

/**
 * Enhanced TransactionList - Now with Future Transaction Management
 */
const TransactionList = ({ 
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
  
  // ✅ NEW: State for upcoming transactions visibility
  const [showUpcoming, setShowUpcoming] = useState(false);
  
  const {
    transactions = [],
    isLoading: loading,
    error
  } = useTransactions();

  const isRTL = language === 'he';

  // ✅ NEW: Separate past/present and future transactions
  const { pastTransactions, futureTransactions } = useMemo(() => {
    if (!transactions || !Array.isArray(transactions)) {
      return { pastTransactions: [], futureTransactions: [] };
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    const past = [];
    const future = [];
    
    transactions.forEach(transaction => {
      try {
        const transactionDate = new Date(transaction.date);
        if (isNaN(transactionDate.getTime())) {
          // Invalid date, put in past by default
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
        past.push(transaction); // Default to past on error
      }
    });
    
    return { 
      pastTransactions: past, 
      futureTransactions: future.sort((a, b) => new Date(a.date) - new Date(b.date)) // Sort future by date ascending
    };
  }, [transactions]);

  // ✅ ENHANCED: Group past transactions by date (existing logic)
  const groupedPastTransactions = useMemo(() => {
    if (!pastTransactions || !Array.isArray(pastTransactions)) {
      return [];
    }

    const groups = {};
    
    pastTransactions.forEach(transaction => {
      const dateKey = new Date(transaction.date).toISOString().split('T')[0];
      
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: transaction.date,
          transactions: [],
          totalIncome: 0,
          totalExpenses: 0,
          count: 0
        };
      }
      
      groups[dateKey].transactions.push(transaction);
      groups[dateKey].count++;
      
      const amount = Math.abs(parseFloat(transaction.amount) || 0);
      if (transaction.transaction_type === 'income') {
        groups[dateKey].totalIncome += amount;
      } else {
        groups[dateKey].totalExpenses += amount;
      }
    });
    
    return Object.values(groups).sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );
  }, [pastTransactions]);

  // ✅ NEW: Group future transactions by month for better organization
  const groupedFutureTransactions = useMemo(() => {
    if (!futureTransactions || !Array.isArray(futureTransactions)) {
      return [];
    }

    const groups = {};
    
    futureTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
      
      if (!groups[monthKey]) {
        groups[monthKey] = {
          monthKey,
          monthName,
          transactions: [],
          totalIncome: 0,
          totalExpenses: 0,
          count: 0
        };
      }
      
      groups[monthKey].transactions.push(transaction);
      groups[monthKey].count++;
      
      const amount = Math.abs(parseFloat(transaction.amount) || 0);
      if (transaction.transaction_type === 'income') {
        groups[monthKey].totalIncome += amount;
      } else {
        groups[monthKey].totalExpenses += amount;
      }
    });
    
    return Object.values(groups).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [futureTransactions, language]);

  // Animation variants
  const listVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const groupVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
        staggerChildren: 0.05
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, x: isRTL ? 30 : -30 },
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

  // Error state
  if (error) {
    return (
      <motion.div
        variants={emptyVariants}
        initial="hidden"
        animate="visible"
        className="bg-gradient-to-br from-red-50 via-white to-red-50 dark:from-red-900/20 dark:via-gray-800 dark:to-red-900/20 rounded-2xl shadow-sm border border-red-200 dark:border-red-800 p-12 text-center"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/50 dark:to-red-800/50 rounded-2xl mb-6 shadow-sm">
          <Search className="w-10 h-10 text-red-500 dark:text-red-400" />
        </div>
        
        <h3 className="text-xl font-bold text-red-900 dark:text-red-100 mb-3">
          {t('transactions.loadError')}
        </h3>
        
        <p className="text-red-700 dark:text-red-300 max-w-md mx-auto mb-6 leading-relaxed">
          {error.message || t('transactions.loadErrorDesc')}
        </p>
      </motion.div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="text-center space-y-4">
          <LoadingSpinner size="large" />
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
              {t('common.loading')}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('transactions.loadingTransactions')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!pastTransactions.length && !futureTransactions.length) {
    return (
      <motion.div
        variants={emptyVariants}
        initial="hidden"
        animate="visible"
        className={cn(
          'bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center',
          className
        )}
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-2xl mb-6 shadow-sm">
          <Search className="w-10 h-10 text-gray-400 dark:text-gray-500" />
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
          {t('transactions.noTransactions')}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6 leading-relaxed">
          {emptyMessage || t('transactions.noTransactionsDesc')}
        </p>
      </motion.div>
    );
  }

  return (
    <div className={cn('space-y-8', className)}>
      
      {/* ✅ NEW: Future Transactions Section (Collapsible) */}
      {futureTransactions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/10 dark:via-indigo-900/10 dark:to-purple-900/10 rounded-2xl border border-blue-200 dark:border-blue-800 overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-blue-200 dark:border-blue-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-1">
                    {t('transactions.upcomingTransactions')}
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {futureTransactions.length} {t('transactions.scheduledTransactions')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge variant="primary" className="bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300">
                  <Clock className="w-3 h-3 mr-1" />
                  {t('transactions.automated')}
                </Badge>
                
                <Button
                  variant="ghost"
                  size="small"
                  onClick={() => setShowUpcoming(!showUpcoming)}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                >
                  {showUpcoming ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      {t('common.hide')}
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      {t('common.show')}
                    </>
                  )}
                  {showUpcoming ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                </Button>
              </div>
            </div>
          </div>
          
          {/* Collapsible Content */}
          <AnimatePresence>
            {showUpcoming && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="p-6 space-y-6">
                  {groupedFutureTransactions.map((group, groupIndex) => (
                    <div key={group.monthKey} className="space-y-4">
                      {/* Month Header */}
                      <div className="flex items-center justify-between p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-blue-200 dark:border-blue-700">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                            {group.monthName}
                          </h4>
                          <Badge variant="secondary" size="small">
                            {group.count} {t('transactions.items')}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-3 text-sm">
                          {group.totalIncome > 0 && (
                            <span className="text-green-600 font-medium">
                              +{formatAmount(group.totalIncome)}
                            </span>
                          )}
                          {group.totalExpenses > 0 && (
                            <span className="text-red-600 font-medium">
                              -{formatAmount(group.totalExpenses)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Future Transactions */}
                      <div className="space-y-3">
                        {group.transactions.map((transaction, index) => (
                          <motion.div
                            key={`future-${transaction.id}-${transaction.date}`}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <TransactionCard
                              transaction={transaction}
                              onEdit={onEdit}
                              onEditSingle={onEditSingle}
                              onEditTemplate={onEditTemplate}
                              onDelete={onDelete}
                              onOpenRecurringManager={onOpenRecurringManager}
                              variant="future"
                              className="border-l-4 border-l-blue-400 bg-white/80 dark:bg-gray-800/80"
                            />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ✅ ENHANCED: Past/Present Transactions (Existing Logic) */}
      {pastTransactions.length > 0 && (
        <motion.div
          variants={listVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {groupedPastTransactions.map((group, groupIndex) => (
            <motion.div
              key={group.date}
              variants={groupVariants}
              custom={groupIndex}
              className="space-y-4"
            >
              {/* Enhanced Date Header */}
              <div className="bg-gradient-to-r from-white via-gray-50 to-white dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-900/50 rounded-xl">
                      <Calendar className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                        {formatDate(new Date(group.date), 'EEEE, MMMM dd')}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {group.count} {t('transactions.items')} • {formatDate(new Date(group.date), 'yyyy')}
                      </p>
                    </div>
                  </div>
                  
                  {/* Daily Summary */}
                  <div className="flex items-center gap-4">
                    {group.totalIncome > 0 && (
                      <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-xl border border-green-200 dark:border-green-800">
                        <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-bold text-green-700 dark:text-green-300">
                          +{formatAmount(group.totalIncome)}
                        </span>
                      </div>
                    )}
                    
                    {group.totalExpenses > 0 && (
                      <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl border border-red-200 dark:border-red-800">
                        <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <span className="text-sm font-bold text-red-700 dark:text-red-300">
                          -{formatAmount(group.totalExpenses)}
                        </span>
                      </div>
                    )}
                    
                    <div className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl border font-bold text-sm",
                      (group.totalIncome - group.totalExpenses) >= 0 
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300' 
                        : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300'
                    )}>
                      <DollarSign className="w-4 h-4" />
                      <span>
                        {(group.totalIncome - group.totalExpenses) >= 0 ? '+' : ''}
                        {formatAmount(group.totalIncome - group.totalExpenses)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Transactions Grid */}
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {group.transactions.map((transaction, index) => (
                    <motion.div
                      key={`${transaction.id}-${transaction.transaction_type}`}
                      variants={cardVariants}
                      custom={index}
                      layout
                      exit={{ 
                        opacity: 0, 
                        scale: 0.9,
                        x: isRTL ? 50 : -50,
                        transition: { duration: 0.2 }
                      }}
                    >
                      <TransactionCard
                        transaction={transaction}
                        onEdit={onEdit}
                        onEditSingle={onEditSingle}
                        onEditTemplate={onEditTemplate}
                        onDelete={onDelete}
                        onOpenRecurringManager={onOpenRecurringManager}
                        variant="default"
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
      
      {/* Enhanced End of list indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-center py-8"
      >
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('transactions.endOfList')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('transactions.totalItems', { 
                count: pastTransactions.length + (showUpcoming ? futureTransactions.length : 0)
              })}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TransactionList;