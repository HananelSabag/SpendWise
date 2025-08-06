/**
 * 📋 TRANSACTION LIST - Virtualized List Rendering Component
 * Extracted from RecentTransactions.jsx for better performance and maintainability
 * Features: Virtual scrolling, Grouping, Selection, Performance optimized
 * @version 2.0.0
 */

import React, { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FixedSizeList as List } from 'react-window';
import {
  Calendar, CheckCircle, AlertCircle, ArrowRight
} from 'lucide-react';

// ✅ Import Zustand stores
import { useTranslation } from '../../../../stores';

import TransactionCard from './TransactionCard';
import { Button, Card, Badge } from '../../../ui';
import { cn, dateHelpers } from '../../../../utils/helpers';

/**
 * 📊 Group Header Component
 */
const GroupHeader = ({ 
  groupKey, 
  count, 
  totalAmount, 
  formatCurrency,
  className = '' 
}) => {
  const { t } = useTranslation('dashboard');

  return (
    <div className={cn(
      "px-6 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700",
      className
    )}>
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900 dark:text-white">
          {groupKey}
        </h4>
        
        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
          <span>
            {count} {t('transaction.count', { count })}
          </span>
          
          {totalAmount !== 0 && (
            <span className={cn(
              "font-medium",
              totalAmount > 0 ? "text-green-600" : "text-red-600"
            )}>
              {totalAmount > 0 ? '+' : ''}{formatCurrency(totalAmount)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * 📋 Empty State Component
 */
const EmptyState = ({
  searchQuery,
  hasFilters,
  onClearFilters,
  onAddTransaction,
  className = ''
}) => {
  const { t } = useTranslation('dashboard');

  return (
    <div className={cn("text-center py-12", className)}>
      <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
        <Calendar className="w-8 h-8 text-gray-400" />
      </div>
      
      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {searchQuery || hasFilters
          ? t('recentTransactions.noFilteredTransactions')
          : t('recentTransactions.noTransactions')
        }
      </h4>
      
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {searchQuery || hasFilters
          ? t('recentTransactions.noFilteredTransactionsDescription')
          : t('recentTransactions.noTransactionsDescription')
        }
      </p>
      
      <div className="flex justify-center space-x-3">
        {(searchQuery || hasFilters) && onClearFilters && (
          <Button
            variant="outline"
            onClick={onClearFilters}
          >
            {t('actions.clearFilters')}
          </Button>
        )}
        
        {onAddTransaction && (
          <Button
            variant="primary"
            onClick={onAddTransaction}
          >
            {t('actions.addTransaction')}
          </Button>
        )}
      </div>
    </div>
  );
};

/**
 * 📋 Transaction List Component
 */
const TransactionList = ({
  transactions = [],
  searchQuery = '',
  filters = {},
  sortBy = 'date-desc',
  groupBy = 'none',
  viewMode = 'card',
  selectedTransactions = new Set(),
  onTransactionSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onClearFilters,
  onAddTransaction,
  maxItems = 10,
  virtualized = false,
  showGroupTotals = true,
  className = ''
}) => {
  const { t, isRTL } = useTranslation('dashboard');

  // Process and filter transactions
  const processedTransactions = useMemo(() => {
    let result = [...transactions];

    // ✅ FILTER OUT FUTURE TRANSACTIONS - Only show past/present
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    result = result.filter(transaction => {
      const transactionDate = new Date(transaction.date || transaction.created_at);
      const transactionDay = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), transactionDate.getDate());
      return transactionDay <= today; // Only show today and past transactions
    });

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(transaction =>
        transaction.description?.toLowerCase().includes(query) ||
        transaction.category?.name?.toLowerCase().includes(query) ||
        transaction.notes?.toLowerCase().includes(query)
      );
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (!value || value === 'all' || value === 'any') return;

      switch (key) {
        case 'type':
          result = result.filter(t => 
            value === 'income' ? t.amount > 0 : t.amount < 0
          );
          break;
        case 'amount':
          result = result.filter(t => {
            const amount = Math.abs(t.amount);
            switch (value) {
              case 'small': return amount < 100;
              case 'medium': return amount >= 100 && amount <= 500;
              case 'large': return amount > 500;
              default: return true;
            }
          });
          break;
        case 'date':
          const now = new Date();
          result = result.filter(t => {
            const transactionDate = new Date(t.date);
            switch (value) {
              case 'today':
                return dateHelpers.isSameDay(transactionDate, now);
              case 'week':
                return dateHelpers.isWithinDays(transactionDate, 7);
              case 'month':
                return dateHelpers.isWithinDays(transactionDate, 30);
              case 'quarter':
                return dateHelpers.isWithinDays(transactionDate, 90);
              case 'year':
                return dateHelpers.isWithinDays(transactionDate, 365);
              default:
                return true;
            }
          });
          break;
        case 'category':
          result = result.filter(t => t.category?.name === value);
          break;
        case 'starred':
          if (value) result = result.filter(t => t.starred);
          break;
        case 'recurring':
          if (value) result = result.filter(t => t.is_recurring);
          break;
      }
    });

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.date) - new Date(a.date);
        case 'date-asc':
          return new Date(a.date) - new Date(b.date);
        case 'amount-desc':
          return Math.abs(b.amount) - Math.abs(a.amount);
        case 'amount-asc':
          return Math.abs(a.amount) - Math.abs(b.amount);
        case 'category':
          return (a.category?.name || '').localeCompare(b.category?.name || '');
        default:
          return 0;
      }
    });

    // Limit results if needed
    if (maxItems && result.length > maxItems) {
      result = result.slice(0, maxItems);
    }

    return result;
  }, [transactions, searchQuery, filters, sortBy, maxItems]);

  // Group transactions
  const groupedTransactions = useMemo(() => {
    if (groupBy === 'none') {
      return [{ key: 'all', transactions: processedTransactions }];
    }

    const groups = {};

    processedTransactions.forEach(transaction => {
      let groupKey;
      
      switch (groupBy) {
        case 'date':
          groupKey = dateHelpers.format(transaction.date, 'MMMM yyyy');
          break;
        case 'category':
          groupKey = transaction.category?.name || t('category.uncategorized');
          break;
        case 'amount':
          const amount = Math.abs(transaction.amount);
          if (amount < 100) groupKey = t('amount.small');
          else if (amount <= 500) groupKey = t('amount.medium');
          else groupKey = t('amount.large');
          break;
        default:
          groupKey = 'all';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(transaction);
    });

    return Object.entries(groups).map(([key, transactions]) => ({
      key,
      transactions,
      count: transactions.length,
      totalAmount: showGroupTotals 
        ? transactions.reduce((sum, t) => sum + t.amount, 0)
        : 0
    }));
  }, [processedTransactions, groupBy, showGroupTotals, t]);

  // Handle selection
  const handleTransactionSelect = useCallback((transactionId, isSelected) => {
    onTransactionSelect?.(transactionId, isSelected);
  }, [onTransactionSelect]);

  // Check if filters are active
  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(value => value && value !== 'all' && value !== 'any');
  }, [filters]);

  // Virtualized row renderer
  const VirtualizedRow = useCallback(({ index, style }) => {
    const group = groupedTransactions[Math.floor(index / 50)]; // Simplified grouping
    const transaction = group?.transactions[index % 50];
    
    if (!transaction) return null;

    return (
      <div style={style}>
        <div className="px-4 py-2 md:px-6 md:py-3">
          <TransactionCard
            transaction={transaction}
            index={index}
            isSelected={selectedTransactions.has(transaction.id)}
            onSelect={handleTransactionSelect}
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            viewMode={viewMode}
          />
        </div>
      </div>
    );
  }, [groupedTransactions, selectedTransactions, handleTransactionSelect, onEdit, onDelete, onDuplicate, viewMode]);

  // Empty state check
  if (processedTransactions.length === 0) {
    return (
      <EmptyState
        searchQuery={searchQuery}
        hasFilters={hasActiveFilters}
        onClearFilters={onClearFilters}
        onAddTransaction={onAddTransaction}
        className={className}
      />
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Transaction list */}
      {virtualized && processedTransactions.length > 100 ? (
        // Virtualized list for large datasets
        <Card className="overflow-hidden">
          <List
            height={600}
            itemCount={processedTransactions.length}
            itemSize={viewMode === 'card' ? 120 : 80}
            className="scrollbar-thin"
          >
            {VirtualizedRow}
          </List>
        </Card>
      ) : (
        // Regular list
        <Card className="divide-y divide-gray-200 dark:divide-gray-700 overflow-visible">
          <AnimatePresence mode="popLayout">
            {groupedTransactions.map((group) => (
              <div key={group.key}>
                {/* Group header */}
                {groupBy !== 'none' && (
                  <GroupHeader
                    groupKey={group.key}
                    count={group.count}
                    totalAmount={group.totalAmount}
                    formatCurrency={(amount) => new Intl.NumberFormat().format(amount)}
                  />
                )}
                
                {/* Group transactions */}
                {group.transactions.map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                    className="px-4 py-3 md:px-6 md:py-4"
                  >
                    <TransactionCard
                      transaction={transaction}
                      index={index}
                      isSelected={selectedTransactions.has(transaction.id)}
                      onSelect={handleTransactionSelect}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onDuplicate={onDuplicate}
                      viewMode={viewMode}
                    />
                  </motion.div>
                ))}
              </div>
            ))}
          </AnimatePresence>
        </Card>
      )}

      {/* Summary footer */}
      {processedTransactions.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>
            {t('recentTransactions.showing', { 
              shown: processedTransactions.length,
              total: transactions.length 
            })}
          </span>
          
          {selectedTransactions.size > 0 && (
            <Badge variant="primary">
              {t('recentTransactions.selected', { count: selectedTransactions.size })}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionList; 