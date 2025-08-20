/**
 * 📋 MODERN RECENT TRANSACTIONS WIDGET - Revolutionary Design
 * Features: Advanced animations, Interactive cards, Smart filtering,
 * Gesture support, Real-time updates, Beautiful micro-interactions
 * @version 4.0.0 - REVOLUTIONARY REDESIGN
 */

import React, { useMemo, useCallback, useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useDragControls } from 'framer-motion';
import { 
  ArrowRight, ArrowUpRight, ArrowDownRight, Calendar, RefreshCw,
  TrendingUp, TrendingDown, Filter, Search, MoreHorizontal,
  Sparkles, Clock, Eye, EyeOff, Target, Zap, Star,
  Coffee, Car, ShoppingBag, Home, Heart, Gift, DollarSign,
  Smartphone, Music, Receipt, Plus
} from 'lucide-react';

// ✅ Import stores and hooks
import { 
  useTranslation, 
  useCurrency,
  useNotifications 
} from '../../../stores';
import { useTransactions } from '../../../hooks/useTransactions';
import { Button, Card, LoadingSpinner, Badge, Input } from '../../ui';
import { cn } from '../../../utils/helpers';
import ModernTransactionCard from '../transactions/ModernTransactionCard';

// ✅ Category icons mapping
const CATEGORY_ICONS = {
  'food': Coffee,
  'transport': Car,
  'shopping': ShoppingBag,
  'entertainment': Music,
  'bills': Receipt,
  'health': Heart,
  'home': Home,
  'salary': DollarSign,
  'investment': TrendingUp,
  'freelance': Star,
  'gift': Gift,
  'technology': Smartphone,
  'other': Plus
};

// ✅ Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.23, 1, 0.32, 1]
    }
  }
};

const cardVariants = {
  hover: { 
    scale: 1.02, 
    y: -4,
    transition: { duration: 0.2 }
  },
  tap: { 
    scale: 0.98,
    transition: { duration: 0.1 }
  }
};

// ✅ SIMPLIFIED: Use ModernTransactionCard for consistency
const TransactionItem = ({ transaction, onTransactionClick }) => {
  return (
    <motion.div variants={itemVariants}>
      <ModernTransactionCard
        transaction={transaction}
        viewMode="list"
        onEdit={() => onTransactionClick?.(transaction)}
        className="mb-2"
      />
    </motion.div>
  );
};

// ✅ Enhanced Header Component
const WidgetHeader = ({ 
  title, 
  onViewAll, 
  totalCount, 
  showingCount
}) => {
  return (
    <div className="space-y-4">
      {/* Main header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {title}
            </h3>
            <p className="text-sm text-gray-500">
              Showing {showingCount} of {totalCount} transactions
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View all button */}
          {totalCount > 0 && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={onViewAll}
                className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
              >
                <span className="hidden sm:inline mr-2">View All</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

// ✅ Filter Panel Component
const FilterPanel = ({ onSearchChange, searchValue }) => {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search transactions..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-white dark:bg-gray-700"
            icon={Search}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-green-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            Income
          </Button>
          <Button variant="ghost" size="sm" className="text-red-600">
            <TrendingDown className="w-4 h-4 mr-1" />
            Expense
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * 📋 Modern Recent Transactions Widget Component
 */
const ModernRecentTransactionsWidget = ({ 
  className = '',
  onViewAll,
  onAddTransaction,
  maxItems = 5
}) => {
  const { t, isRTL } = useTranslation('dashboard');
  const { formatCurrency } = useCurrency();
  const { addNotification } = useNotifications();
  
  // ✅ Local state
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // ✅ Get transactions data
  const { 
    transactions: allTransactions, 
    loading, 
    refetch,
    error 
  } = useTransactions({
    pageSize: 50, // Get more for filtering
    enableAI: false,
    context: 'dashboard',
    autoRefresh: true
  });

  // ✅ Filter and process transactions
  const processedTransactions = useMemo(() => {
    if (!allTransactions || !Array.isArray(allTransactions)) return [];
    
    const now = new Date();
    
    let filtered = allTransactions
      // Only include past and present transactions
      .filter(transaction => {
        // ✅ TIMEZONE-AWARE: Use transaction_datetime for filtering
        const transactionDate = new Date(transaction.transaction_datetime || transaction.created_at || transaction.date);
        if (transactionDate > now) return false;
        if (transaction.is_recurring && transactionDate > now) return false;
        if (transaction.is_template) return false;
        return true;
      })
      // Apply search filter
      .filter(transaction => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
          transaction.description?.toLowerCase().includes(searchLower) ||
          transaction.category_name?.toLowerCase().includes(searchLower)
        );
      })
      // Sort by date (most recent first) - TIMEZONE-AWARE
      .sort((a, b) => {
        const dateA = new Date(a.transaction_datetime || a.created_at || a.date);
        const dateB = new Date(b.transaction_datetime || b.created_at || b.date);
        return dateB - dateA;
      });

    return {
      recent: filtered.slice(0, maxItems),
      total: filtered.length
    };
  }, [allTransactions, searchTerm, maxItems]);

  // ✅ Handle refresh
  const handleRefresh = useCallback(async () => {
    try {
      await refetch();
      addNotification({
        type: 'success',
        message: t('recentTransactions.refreshed', 'Transactions updated'),
        duration: 2000
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: t('recentTransactions.refreshFailed', 'Failed to refresh transactions'),
        duration: 3000
      });
    }
  }, [refetch, addNotification, t]);

  // ✅ Handle view all
  const handleViewAll = useCallback(() => {
    if (onViewAll) {
      onViewAll();
    } else {
      window.location.href = '/transactions';
    }
  }, [onViewAll]);

  // ✅ Handle transaction click
  const handleTransactionClick = useCallback((transaction) => {
    // Future: Open transaction details modal
    addNotification({
      type: 'info',
      message: 'Transaction details coming soon!',
      duration: 2000
    });
  }, [addNotification]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn('', className)}
    >
      <Card className="overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-2 border-gray-200 dark:border-gray-700 shadow-2xl">
        <div className="p-6">
          {/* Enhanced Header */}
          <WidgetHeader
            title={t('recentTransactions.title', 'Recent Transactions')}
            onViewAll={handleViewAll}
            totalCount={processedTransactions.total}
            showingCount={processedTransactions.recent.length}
          />

          {/* Filter Panel disabled per product request */}

          {/* Content */}
          <div className="mt-6">
            {loading && processedTransactions.recent.length === 0 ? (
              /* Enhanced Loading State */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center py-12"
              >
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4">
                    <LoadingSpinner size="lg" />
                  </div>
                  <p className="text-gray-500 font-medium">
                    {t('recentTransactions.loading', 'Loading transactions...')}
                  </p>
                </div>
              </motion.div>
            ) : error ? (
              /* Enhanced Error State */
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ArrowUpRight className="w-8 h-8 text-red-600" />
                </div>
                <p className="text-red-600 dark:text-red-400 mb-4 font-medium">
                  {t('recentTransactions.error', 'Failed to load transactions')}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  {t('common.retry', 'Try Again')}
                </Button>
              </motion.div>
            ) : processedTransactions.recent.length === 0 ? (
              /* Enhanced Empty State */
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <Target className="w-8 h-8 text-blue-500" />
                </motion.div>
                <p className="text-gray-500 mb-4 text-lg font-medium">
                  {searchTerm 
                    ? 'No transactions match your search'
                    : t('recentTransactions.noTransactions', 'No transactions yet')}
                </p>
                {!searchTerm && (
                  <>
                    <p className="text-sm text-gray-400 mb-6">
                      {t('recentTransactions.getStarted', 'Start tracking your finances by adding your first transaction')}
                    </p>
                    <Button
                      onClick={onAddTransaction}
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      {t('recentTransactions.addFirst', 'Add Transaction')}
                    </Button>
                  </>
                )}
              </motion.div>
            ) : (
              /* Enhanced Transaction List */
              <motion.div
                variants={containerVariants}
                className="space-y-3"
              >
                {processedTransactions.recent.map((transaction, index) => (
                  <TransactionItem
                    key={transaction.id || index}
                    transaction={transaction}
                    onTransactionClick={handleTransactionClick}
                  />
                ))}
                
                {/* Enhanced Footer */}
                {processedTransactions.total > maxItems && (
                  <motion.div
                    variants={itemVariants}
                    className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          Showing {processedTransactions.recent.length} of {processedTransactions.total}
                        </span>
                      </div>
                      
                      <motion.button
                        whileHover={{ scale: 1.05, x: 4 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleViewAll}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm group"
                      >
                        <span>See all transactions</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default ModernRecentTransactionsWidget;
