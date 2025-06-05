/**
 * OPTIMIZED useTransactionsList Hook
 * 
 * MAJOR CHANGES:
 * 1. Removed redundant dashboard API calls
 * 2. Added proper authentication checks
 * 3. Optimized data transformation with memoization
 * 4. Fixed console.log spam
 * 5. Better error handling
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { transactionAPI } from '../utils/api';
import { useDate } from '../context/DateContext';

export const useTransactionsList = (options = {}) => {
  const { 
    period = 'month', 
    type = null, 
    searchTerm = '', 
    page = 1, 
    limit = 100 
  } = options;
  
  const { selectedDate, getDateForServer } = useDate();
  const targetDate = getDateForServer(selectedDate);
  const isAuthenticated = !!localStorage.getItem('accessToken');

  const query = useQuery({
    queryKey: ['transactions-list', period, type, searchTerm, page, limit, targetDate],
    queryFn: async () => {
      try {
        const response = await transactionAPI.getByPeriod(period, targetDate);
        const transactions = response.data?.data?.transactions || [];
        
        return {
          transactions: Array.isArray(transactions) ? transactions : [],
          pagination: { total: transactions.length || 0 },
          totalCount: transactions.length || 0
        };
      } catch (error) {
        console.error('[useTransactionsList] Error:', error.message);
        return {
          transactions: [],
          pagination: { total: 0 },
          totalCount: 0
        };
      }
    },
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 30 * 1000,
    retry: 2
  });

  // Memoized filtered data
  const processedData = useMemo(() => {
    let transactions = query.data?.transactions || [];
    
    // Apply filters
    if (type && type !== 'all') {
      transactions = transactions.filter(tx => tx.transaction_type === type);
    }
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      transactions = transactions.filter(tx => 
        tx.description?.toLowerCase().includes(search) ||
        tx.category_name?.toLowerCase().includes(search)
      );
    }
    
    return {
      transactions,
      pagination: query.data?.pagination || { total: 0 },
      totalCount: transactions.length
    };
  }, [query.data, type, searchTerm]);

  // Memoized helper functions
  const getTransactionsByType = useMemo(() => (transactionType) => {
    const transactions = processedData.transactions;
    return transactions.filter(tx => tx.transaction_type === transactionType);
  }, [processedData.transactions]);

  const searchTransactions = useMemo(() => (term) => {
    const transactions = processedData.transactions;
    if (!term) return transactions;
    const searchLower = term.toLowerCase();
    return transactions.filter(tx => 
      tx.description?.toLowerCase().includes(searchLower) ||
      tx.category_name?.toLowerCase().includes(searchLower)
    );
  }, [processedData.transactions]);

  return {
    periodTransactions: processedData.transactions,
    totalCount: processedData.totalCount,
    pagination: processedData.pagination,
    loading: query.isLoading,
    error: query.error,
    refreshTransactions: query.refetch,
    getTransactionsByType,
    searchTransactions,
    period
  };
};

export const useRecurringTransactionsList = () => {
  const isAuthenticated = !!localStorage.getItem('accessToken');
  
  return useQuery({
    queryKey: ['recurring-transactions'],
    queryFn: async () => {
      const response = await transactionAPI.getRecurring();
      return response;
    },
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    select: (response) => {
      const data = response?.data || response;
      return Array.isArray(data.data) ? data.data : [];
    },
    staleTime: 60 * 1000,
    retry: 1
  });
};