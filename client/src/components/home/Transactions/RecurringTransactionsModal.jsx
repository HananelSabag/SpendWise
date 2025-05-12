/**
 * RecurringTransactionsModal.jsx
 * Enhanced modal for viewing and managing recurring transactions
 * With improved UI, filtering, and more detailed information.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { useCurrency } from '../../../context/CurrencyContext';
import {
  X,
  Search,
  RefreshCw,
  Loader,
  Clock,
  TrendingUp,
  TrendingDown,
  ChevronDown,
} from 'lucide-react';
import TransactionCard from './TransactionCard';

const RecurringTransactionsModal = ({
  open,
  onClose,
  transactions = [],
  loading = false,
  onEdit,
  onDelete
}) => {
  const { t, language } = useLanguage();
  const { formatAmount } = useCurrency();
  const isRTL = language === 'he';
  
  // State for search and filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Group transactions by type for filter counts
  const transactionCounts = useMemo(() => {
    if (!transactions || !transactions.length) return { all: 0, expense: 0, income: 0 };
    
    return transactions.reduce((acc, tx) => {
      acc.all++;
      acc[tx.transaction_type]++;
      return acc;
    }, { all: 0, expense: 0, income: 0 });
  }, [transactions]);
  
  // Apply filters and search
  useEffect(() => {
    if (!transactions) return;
    
    // Filter by type and search term
    let filtered = [...transactions];
    
    // Apply type filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(tx => tx.transaction_type === activeFilter);
    }
    
    // Apply search term if present
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(tx => 
        (tx.description && tx.description.toLowerCase().includes(term)) || 
        (tx.category_name && tx.category_name.toLowerCase().includes(term))
      );
    }
    
    // Sort by date (next occurrence first)
    filtered.sort((a, b) => {
      // First sort by next_recurrence_date if available
      if (a.next_recurrence_date && b.next_recurrence_date) {
        return new Date(a.next_recurrence_date) - new Date(b.next_recurrence_date);
      }
      // Fall back to regular date
      return new Date(a.date) - new Date(b.date);
    });
    
    setFilteredTransactions(filtered);
  }, [transactions, searchTerm, activeFilter]);

  if (!open) return null;

  // Calculate total monthly impact
  const totalMonthlyImpact = filteredTransactions.reduce((sum, tx) => {
    const amount = Number(tx.recurring_amount || tx.amount);
    if (tx.transaction_type === 'income') return sum + amount;
    return sum - amount;
  }, 0);

  // Helper function to get appropriate icon for the monthly impact
  const ImpactIcon = totalMonthlyImpact > 0 ? TrendingUp : 
                     totalMonthlyImpact < 0 ? TrendingDown : 
                     RefreshCw;

// RecurringTransactionsModal.jsx - Updated return section with translations
// Replace ONLY the return section in your existing file

return (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
    {/* Main container with max width */}
    <div 
      className="relative w-full max-w-3xl rounded-2xl shadow-xl border border-primary-300 mx-2 sm:mx-0 max-h-[90vh] flex flex-col animate-fadeIn"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      
      {/* Gradient Header */}
      <div className="bg-gradient-to-br from-primary-400 to-primary-500 px-6 py-4 sm:py-6 rounded-t-2xl flex-shrink-0">
        {/* Title & Close Button row */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
              {t('transactions.recurringSection.title')}
            </h2>
            <p className="text-white/80 text-sm">
              {t('transactions.recurringSection.management')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/90 rounded-full hover:bg-white transition"
          >
            <X className="w-5 h-5 text-primary-600" />
          </button>
        </div>
        
        {/* Search & Filter Bar */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={t('common.search') + '...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl border-0 focus:ring-2 focus:ring-white/50 focus:outline-none bg-white/10 text-white placeholder-white/60"
            />
            <Search className="w-4 h-4 text-white/60 absolute left-3 top-3" />
          </div>
          
          {/* Filter tabs */}
          <div className="flex bg-white/20 backdrop-blur-sm rounded-xl p-1">
            <button
              onClick={() => setActiveFilter('all')}
              className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                activeFilter === 'all' ? 'bg-white text-primary-600' : 'text-white'
              }`}
            >
              {t('common.all')} ({transactionCounts.all})
            </button>
            <button
              onClick={() => setActiveFilter('income')}
              className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                activeFilter === 'income' ? 'bg-white text-primary-600' : 'text-white'
              }`}
            >
              {t('transactions.filters.income')} ({transactionCounts.income})
            </button>
            <button
              onClick={() => setActiveFilter('expense')}
              className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                activeFilter === 'expense' ? 'bg-white text-primary-600' : 'text-white'
              }`}
            >
              {t('transactions.filters.expense')} ({transactionCounts.expense})
            </button>
          </div>
        </div>
      </div>

      {/* Content area - scrollable */}
      <div className="bg-white rounded-b-2xl overflow-y-auto flex-1">
        {/* Monthly Impact Summary */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-primary-500" />
              <span className="font-medium text-gray-700">{t('transactions.recurringSection.impact')}</span>
            </div>
            <div className={`font-bold text-lg ${
              totalMonthlyImpact > 0 ? 'text-success' : 
              totalMonthlyImpact < 0 ? 'text-error' : 'text-gray-600'
            }`}>
              {formatAmount(totalMonthlyImpact)}
            </div>
          </div>
        </div>
        
        {/* Loading State */}
        {loading && (
          <div className="py-16 flex flex-col items-center justify-center">
            <Loader className="w-8 h-8 text-primary-500 animate-spin mb-3" />
            <p className="text-gray-600">{t('common.loading')}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredTransactions.length === 0 && (
          <div className="py-16 flex flex-col items-center justify-center">
            <Clock className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-700 mb-2">
              {searchTerm ? t('transactions.noMatchingTransactions') : t('transactions.noRecurringTransactions')}
            </h3>
            <p className="text-gray-500 max-w-sm text-center">
              {searchTerm 
                ? t('transactions.tryDifferentSearch')
                : t('transactions.createRecurringNote')}
            </p>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="mt-4 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg"
              >
                {t('common.reset')} {t('common.search')}
              </button>
            )}
          </div>
        )}

        {/* Transaction List */}
        {!loading && filteredTransactions.length > 0 && (
          <div className="p-4 space-y-3">
            {filteredTransactions.map((tx) => (
              <TransactionCard
                key={`${tx.id}-${tx.transaction_type}`}
                transaction={tx}
                onEdit={() => onEdit(tx)}
                onDelete={onDelete}
                showActions
              />
            ))}
          </div>
        )}

        {/* Bottom Action Bar */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary-100 hover:bg-primary-200 text-primary-700 text-sm rounded-xl transition-colors"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  </div>
);
};

export default RecurringTransactionsModal;