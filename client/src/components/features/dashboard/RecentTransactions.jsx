import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ArrowRight, Package, Eye, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useDate } from '../../../context/DateContext';
import { useCurrency } from '../../../context/CurrencyContext';
import { useDashboard } from '../../../hooks/useDashboard';
import { Card, TransactionCardSkeleton } from '../../../components/ui';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

/**
 * RecentTransactions Component - Compact Space-Efficient Version
 * Shows exactly 5 transactions with better space utilization and mobile support
 */
const RecentTransactions = ({ 
  limit = 5 
}) => {
  const { t, language } = useLanguage();
  
  const { 
    data: dashboardData, 
    isLoading, 
    error 
  } = useDashboard();
  
  const isRTL = language === 'he';

  // ✅ Extract transactions from dashboard data
  const transactions = dashboardData?.recentTransactions || [];

  // ✅ Filter out future transactions and only show past/current transactions
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  const filteredTransactions = transactions
    .filter(transaction => {
      try {
        const transactionDate = new Date(transaction.date);
        return transactionDate <= today && !isNaN(transactionDate.getTime());
      } catch (error) {
        console.warn('Invalid transaction date:', transaction.date);
        return false;
      }
    })
    .slice(0, limit);

  const { formatDate } = useDate();
  const { formatAmount } = useCurrency();
  
  // 🚀 PHASE 16: Enhanced loading with sophisticated skeleton
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative h-full"
        data-component="RecentTransactions"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 opacity-100 rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20 rounded-2xl"></div>
        </div>

        <Card className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-0 shadow-2xl rounded-2xl h-full">
          <div className="p-4">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between mb-4">
              <div className="skeleton-title w-1/2"></div>
              <div className="skeleton-button w-16"></div>
            </div>
            
            {/* Transaction Skeletons */}
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <TransactionCardSkeleton 
                  key={i} 
                  delay={i}
                  className="bg-white/50 dark:bg-gray-800/50"
                />
              ))}
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative h-full"
        data-component="RecentTransactions"
      >
        <Card className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-0 shadow-2xl rounded-2xl h-full flex items-center justify-center">
          <div className="text-center py-8">
            <div className="text-red-600 dark:text-red-400 mb-4">
              {t('dashboard.transactions.error')}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              {t('common.retry')}
            </button>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative h-full"
      data-component="RecentTransactions"
    >
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 opacity-100 rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20 rounded-2xl"></div>
        
        {/* Floating Orbs - optimized */}
        <motion.div 
          className="absolute top-2 right-2 w-8 h-8 bg-white/10 rounded-full blur-xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-2 left-2 w-6 h-6 bg-purple-300/20 rounded-full blur-lg"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.7, 0.4]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      <Card className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-0 shadow-2xl rounded-2xl h-full flex flex-col">
        {/* COMPACT Header - reduced padding */}
        <div className="relative p-3 pb-1">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 blur-xl"></div>
          
          <div className="relative z-10">
            <div className={`flex items-center justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <motion.div 
                  className="relative p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg"
                  whileHover={{ scale: 1.05, rotate: isRTL ? -5 : 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl blur-lg opacity-70"></div>
                  <Activity className="relative w-4 h-4 text-white" />
                </motion.div>
                
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <h3 className="text-base font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
                    {t('dashboard.transactions.recent')}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {t('dashboard.transactions.latestActivity')}
                  </p>
                </div>
              </div>
              
              <Link 
                to="/transactions" 
                className={`text-primary-600 hover:text-primary-700 dark:text-primary-400 text-xs font-medium flex items-center gap-1 px-2 py-1 bg-primary-50 dark:bg-primary-900/30 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-800/40 transition-all ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <Eye className="w-3 h-3" />
                <span className="hidden sm:inline">{t('dashboard.transactions.viewAll')}</span>
                <span className="sm:hidden">{t('dashboard.transactions.viewAll')}</span>
              </Link>
            </div>
          </div>
        </div>
        
        {/* COMPACT Content - reduced spacing and height */}
        <div className="flex-1 px-3 pb-3 overflow-hidden">
          {filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-4">
              <motion.div 
                className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full mb-3"
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Package className="w-5 h-5 text-gray-400" />
              </motion.div>
              <p className="text-gray-500 dark:text-gray-400 text-center text-sm">
                {t('dashboard.transactions.noTransactions')}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 h-full flex flex-col">
              {filteredTransactions.slice(0, 4).map((transaction, index) => {
                const amount = parseFloat(transaction.amount) || 0;
                const isIncome = transaction.transaction_type === 'income' || 
                                transaction.type === 'income';
                const displayAmount = Math.abs(amount);
                
                return (
                  <motion.div 
                    key={`${transaction.id}-${transaction.transaction_type || 'unknown'}-${transaction.date}-${index}`} 
                    className={`group relative overflow-hidden flex items-center justify-between py-2 px-2.5 rounded-lg bg-gradient-to-r from-white/60 to-gray-50/80 dark:from-gray-800/60 dark:to-gray-700/80 hover:from-white/80 hover:to-gray-50/90 dark:hover:from-gray-700/80 dark:hover:to-gray-600/90 border border-gray-100/50 dark:border-gray-700/50 transition-all backdrop-blur-sm ${isRTL ? 'flex-row-reverse' : ''}`}
                    initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.01, x: isRTL ? -2 : 2 }}
                  >
                    {/* Item glow effect */}
                    <div className={`absolute inset-0 rounded-lg blur-sm opacity-0 group-hover:opacity-30 transition-opacity ${
                      isIncome ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}></div>
                    
                    <div className={`relative z-10 flex items-center gap-2 min-w-0 flex-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      {/* Enhanced visual indicator */}
                      <motion.div 
                        className={`relative w-2.5 h-2.5 rounded-full shadow-sm flex-shrink-0 ${
                          isIncome 
                            ? 'bg-gradient-to-br from-green-400 to-green-600' 
                            : 'bg-gradient-to-br from-red-400 to-red-600'
                        }`}
                        whileHover={{ scale: 1.3 }}
                      >
                        <div className={`absolute inset-0 rounded-full blur-sm opacity-60 ${
                          isIncome ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                      </motion.div>
                      
                      <div className={`min-w-0 flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                        <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                          {transaction.description || t('transactions.noDescription')}
                        </p>
                        <div className={`flex items-center gap-1.5 mt-0.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <p className={`text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <Calendar className="w-2.5 h-2.5 flex-shrink-0" />
                            <span className="text-xs">
                              {(() => {
                                try {
                                  const date = new Date(transaction.date);
                                  if (isNaN(date.getTime())) {
                                    return 'Invalid date';
                                  }
                                  
                                  return date.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    timeZone: 'UTC'
                                  });
                                } catch (error) {
                                  console.warn('Date formatting error:', error);
                                  return transaction.date || 'No date';
                                }
                              })()}
                            </span>
                          </p>
                          {transaction.category && (
                            <span className="text-xs text-gray-400 dark:text-gray-500 px-1 py-0.5 bg-gray-100/80 dark:bg-gray-700/80 rounded text-xs truncate max-w-16">
                              {transaction.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Enhanced amount display */}
                    <div className={`relative z-10 flex items-center gap-1 text-xs font-semibold flex-shrink-0 ${isRTL ? 'flex-row-reverse' : ''} ${
                      isIncome 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {isIncome ? (
                        <TrendingUp className="w-2.5 h-2.5" />
                      ) : (
                        <TrendingDown className="w-2.5 h-2.5" />
                      )}
                      <span className="text-xs">{isIncome ? '+' : '-'}{formatAmount(displayAmount)}</span>
                    </div>
                  </motion.div>
                );
              })}
              
              {/* Fill remaining space if less than 4 transactions */}
              {filteredTransactions.length < 4 && filteredTransactions.length > 0 && (
                <div className="flex-1 flex items-center justify-center py-2">
                  <Link 
                    to="/transactions/add"
                    className={`text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs flex items-center gap-1 px-3 py-1.5 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-400 dark:hover:border-primary-500 transition-all ${isRTL ? 'flex-row-reverse' : ''}`}
                  >
                    <TrendingUp className="w-3 h-3" />
                    <span>{t('transactions.addMore')}</span>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default RecentTransactions;
