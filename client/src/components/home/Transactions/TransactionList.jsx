/**
 * TransactionList.jsx
 * Displays a list of transactions grouped by date with enhanced grouping,
 * daily summaries, and improved display of recurring transactions.
 */
import React, { useMemo, useState } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { useCurrency } from '../../../context/CurrencyContext';
import { Clock, CalendarIcon, ArrowDownUp, TrendingUp, TrendingDown, ChevronRight, ChevronDown, Filter } from 'lucide-react';
import TransactionCard from './TransactionCard';

const TransactionList = ({
  transactions = [],
  loading = false,
  showActions = true,
  onEdit,
  onDelete,
  emptyMessage,
  className = ''
}) => {
  const { t, language } = useLanguage();
  const { formatAmount } = useCurrency();
  const isHebrew = language === 'he';
  
  // State for collapsible date groups
  const [collapsedGroups, setCollapsedGroups] = useState({});
  
  // State for filtering options
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    showRecurring: true,
    showOneTime: true,
    showExpense: true,
    showIncome: true,
  });

  /**
   * Toggle group collapse state
   * @param {string} dateKey - Date key to toggle
   */
  const toggleGroup = (dateKey) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [dateKey]: !prev[dateKey]
    }));
  };

  /**
   * Handle filter changes
   * @param {string} filterName - Name of filter to toggle
   */
  const handleFilterChange = (filterName) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  /**
   * Group transactions by date and calculate daily summaries
   */
  const groupedTransactions = useMemo(() => {
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return [];
    }

    // Apply filters
    const filteredTransactions = transactions.filter(tx => {
      // Filter by transaction type
      if (tx.transaction_type === 'expense' && !filters.showExpense) return false;
      if (tx.transaction_type === 'income' && !filters.showIncome) return false;
      
      // Filter by recurring status
      if (tx.is_recurring && !filters.showRecurring) return false;
      if (!tx.is_recurring && !filters.showOneTime) return false;
      
      return true;
    });
    
    // Group transactions by date
    const groups = filteredTransactions.reduce((acc, transaction) => {
      // Create a local date key in YYYY-MM-DD format
      const localDate = new Date(transaction.date);
      const dateKey = localDate.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD

      if (!acc[dateKey]) {
        // Initialize group with summary data
        acc[dateKey] = {
          transactions: [],
          date: localDate,
          totalIncome: 0,
          totalExpense: 0,
          netBalance: 0
        };
      }

      // Add transaction to group
      acc[dateKey].transactions.push(transaction);

      // Update group summaries
      if (transaction.transaction_type === 'income') {
        acc[dateKey].totalIncome += Number(transaction.amount);
      } else {
        acc[dateKey].totalExpense += Number(transaction.amount);
      }

      return acc;
    }, {});

    // Calculate net balance for each group and sort transactions
    Object.keys(groups).forEach(dateKey => {
      const group = groups[dateKey];
      group.netBalance = group.totalIncome - group.totalExpense;
      
      // Sort transactions by amount (descending) for better visual hierarchy
      group.transactions.sort((a, b) => b.amount - a.amount);
    });

    // Convert to array and sort by date (newest first)
    return Object.entries(groups)
      .map(([dateKey, group]) => ({ dateKey, ...group }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, filters]);

  /**
   * Format date header with localized day name and date
   * @param {Date} date - Date to format
   * @returns {string} - Formatted date string
   */
  const formatDateHeader = (date) => {
    // Check if date is today
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    // Format with long weekday, month and day
    const formattedDate = date.toLocaleDateString(
      isHebrew ? 'he-IL' : 'en-US', 
      { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric',
        year: today.getFullYear() !== date.getFullYear() ? 'numeric' : undefined
      }
    );
    
    // Add "Today" prefix if applicable
    return isToday ? `${t('transactions.today')} - ${formattedDate}` : formattedDate;
  };

  // If loading, display a spinner
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If there are no transactions to display
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return (
      <div className="text-center py-8 px-4">
        <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <p className="text-gray-600 text-sm md:text-base">
          {emptyMessage || t('transactions.noTransactions')}
        </p>
      </div>
    );
  }

  // If there are transactions but none match the current filters
  if (groupedTransactions.length === 0) {
    return (
      <div className="space-y-4">
        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <button 
            className="flex items-center gap-2 text-primary-600 font-medium"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
            <span>{t('transactions.filters.title')}</span>
            {showFilters ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          {showFilters && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.showExpense}
                  onChange={() => handleFilterChange('showExpense')}
                  className="rounded text-primary-500"
                />
                <span className="text-sm">{t('transactions.filters.expense')}</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.showIncome}
                  onChange={() => handleFilterChange('showIncome')}
                  className="rounded text-primary-500"
                />
                <span className="text-sm">{t('transactions.filters.income')}</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.showRecurring}
                  onChange={() => handleFilterChange('showRecurring')}
                  className="rounded text-primary-500"
                />
                <span className="text-sm">{t('transactions.filters.recurring')}</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.showOneTime}
                  onChange={() => handleFilterChange('showOneTime')}
                  className="rounded text-primary-500"
                />
                <span className="text-sm">{t('transactions.filters.oneTime')}</span>
              </label>
            </div>
          )}
        </div>

        <div className="text-center py-8 px-4">
          <p className="text-gray-600">No transactions match the current filters</p>
          <button 
            className="mt-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg text-sm"
            onClick={() => setFilters({
              showRecurring: true,
              showOneTime: true,
              showExpense: true,
              showIncome: true,
            })}
          >
            Reset Filters
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Transaction Groups */}
      {groupedTransactions.map((group) => (
        <div key={group.dateKey} className="space-y-2">
          {/* Date Header with Daily Summary */}
          <div className="bg-white rounded-xl shadow-sm p-3">
            <button
              onClick={() => toggleGroup(group.dateKey)}
              className="flex items-center justify-between w-full"
            >
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary-500" />
                <h3 className="text-sm md:text-base font-medium text-gray-800">
                  {formatDateHeader(group.date)}
                </h3>
              </div>
              
              {/* Group collapse indicator */}
              <div className="flex items-center gap-2">
                {/* Net balance for the day */}
                <div 
                  className={`flex items-center gap-1 font-medium 
                    ${group.netBalance > 0 ? 'text-success' : 
                      group.netBalance < 0 ? 'text-error' : 'text-gray-600'}`}
                >
                  {group.netBalance > 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : group.netBalance < 0 ? (
                    <TrendingDown className="w-4 h-4" />
                  ) : (
                    <ArrowDownUp className="w-4 h-4" />
                  )}
                  <span className="text-sm">
                    {formatAmount(Math.abs(group.netBalance))}
                  </span>
                </div>
                
                {/* Expand/collapse icon */}
                {collapsedGroups[group.dateKey] ? (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </button>
          </div>

          {/* Transactions for this date */}
          {!collapsedGroups[group.dateKey] && (
            <div className="space-y-2">
              {group.transactions.map((transaction) => (
                <TransactionCard
                  key={`${transaction.id}-${transaction.transaction_type}`}
                  transaction={transaction}
                  onEdit={showActions ? onEdit : undefined}
                  onDelete={showActions ? onDelete : undefined}
                  showActions={showActions}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default React.memo(TransactionList);