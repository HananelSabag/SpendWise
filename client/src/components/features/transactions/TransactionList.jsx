// components/features/transactions/TransactionList.jsx
import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Package, Clock, Search } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useDate } from '../../../context/DateContext';
import TransactionCard from './TransactionCard';
import LoadingSpinner from '../../ui/LoadingSpinner';

/**
 * TransactionList Component
 * Displays a list of transactions grouped by date with animations
 * Supports empty states, loading states, and grouping by date
 */
const TransactionList = ({ 
  transactions = [], 
  loading = false,
  onEdit,
  onDelete,
  emptyMessage 
}) => {
  const { t, language } = useLanguage();
  const { formatDate } = useDate();
  const isRTL = language === 'he';

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups = {};
    
    transactions.forEach(transaction => {
      const dateKey = new Date(transaction.date).toISOString().split('T')[0];
      
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: transaction.date,
          transactions: [],
          totalIncome: 0,
          totalExpenses: 0
        };
      }
      
      groups[dateKey].transactions.push(transaction);
      
      if (transaction.transaction_type === 'income') {
        groups[dateKey].totalIncome += parseFloat(transaction.amount);
      } else {
        groups[dateKey].totalExpenses += parseFloat(transaction.amount);
      }
    });
    
    // Sort by date (newest first)
    return Object.values(groups).sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );
  }, [transactions]);

  // Animation variants
  const listVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
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
        stiffness: 100,
        damping: 15
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, x: isRTL ? 20 : -20 },
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

  // Empty state variants
  const emptyVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="large" text={t('common.loading')} />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <motion.div
        variants={emptyVariants}
        initial="hidden"
        animate="visible"
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
          <Package className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {t('transactions.noTransactions')}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
          {emptyMessage || t('transactions.noTransactionsDesc')}
        </p>
        
        {/* Helpful tips */}
        <div className="mt-6 bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-sm text-primary-700 dark:text-primary-300">
            💡 {t('transactions.tip')}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={listVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {groupedTransactions.map((group, groupIndex) => (
        <motion.div
          key={group.date}
          variants={groupVariants}
          custom={groupIndex}
          className="space-y-3"
        >
          {/* Date Header */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {formatDate(new Date(group.date), 'PPPP')}
              </h3>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                ({group.transactions.length} {t('transactions.items')})
              </span>
            </div>
            
            {/* Daily Summary */}
            <div className="flex items-center gap-4 text-sm">
              {group.totalIncome > 0 && (
                <span className="text-green-600 dark:text-green-400 font-medium">
                  +{group.totalIncome.toFixed(2)}
                </span>
              )}
              {group.totalExpenses > 0 && (
                <span className="text-red-600 dark:text-red-400 font-medium">
                  -{group.totalExpenses.toFixed(2)}
                </span>
              )}
              <span className={`font-bold ${
                (group.totalIncome - group.totalExpenses) >= 0 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-orange-600 dark:text-orange-400'
              }`}>
                = {(group.totalIncome - group.totalExpenses).toFixed(2)}
              </span>
            </div>
          </div>
          
          {/* Transactions */}
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {group.transactions.map((transaction, index) => (
                <motion.div
                  key={`${transaction.id}-${transaction.transaction_type}`}
                  variants={cardVariants}
                  custom={index}
                  layout
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <TransactionCard
                    transaction={transaction}
                    onEdit={() => onEdit?.(transaction)}
                    onDelete={() => onDelete?.(transaction)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      ))}
      
      {/* End of list indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center py-4"
      >
        <div className="inline-flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
          <Clock className="w-4 h-4" />
          <span>{t('transactions.endOfList')}</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TransactionList;