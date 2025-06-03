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
  const targetDate = getDateForServer ? getDateForServer(selectedDate) : selectedDate.toISOString().split('T')[0];
  
  // ✅ ADD: Check authentication status
  const isAuthenticated = localStorage.getItem('accessToken');

  const {
    data,
    isLoading: loading,
    error,
    refetch: refreshTransactions
  } = useQuery({
    queryKey: ['transactions-list', period, type, searchTerm, page, limit, targetDate],
    queryFn: async () => {
      console.log('🔍 [useTransactionsList] Fetching transactions for date:', targetDate);
      
      try {
        // ✅ השתמש בשיטה שעובדת - קריאה נפרדת לפי תקופה
        if (period) {
          const response = await transactionAPI.getByPeriod(period, targetDate);
          console.log('📊 [useTransactionsList] Response from getByPeriod:', response);
          
          // ✅ תמיד החזר array
          const transactions = response.data?.data?.transactions || [];
          
          // ✅ Add debug info about the data
          console.log('📊 [useTransactionsList] Processed transactions:', {
            count: transactions.length,
            sample: transactions[0],
            incomeCount: transactions.filter(tx => tx.transaction_type === 'income').length,
            expenseCount: transactions.filter(tx => tx.transaction_type === 'expense').length
          });
          
          return {
            transactions: Array.isArray(transactions) ? transactions : [],
            pagination: { total: transactions.length || 0 },
            totalCount: transactions.length || 0
          };
        }
        
        // אחרת השתמש ב-dashboard
        const dashboardResponse = await transactionAPI.getDashboard(targetDate);
        const recentTx = dashboardResponse.data?.data?.recent_transactions || [];
        
        return {
          transactions: Array.isArray(recentTx) ? recentTx : [],
          pagination: { total: recentTx.length },
          totalCount: recentTx.length
        };
      } catch (error) {
        console.error('🚨 [useTransactionsList] Error fetching transactions:', error);
        // ✅ החזר structure ריק במקרה של שגיאה
        return {
          transactions: [],
          pagination: { total: 0 },
          totalCount: 0
        };
      }
    },
    // ✅ ADD: Only run when authenticated
    enabled: !!isAuthenticated,
    // ✅ ADD: Disable unnecessary refetches for unauthenticated users
    refetchOnWindowFocus: !!isAuthenticated,
    refetchOnMount: !!isAuthenticated,
    staleTime: 30 * 1000,
    retry: 2,
    select: (response) => {
      // ✅ וודא שהנתונים תמיד array
      let transactions = Array.isArray(response?.transactions) ? response.transactions : [];
      
      // סינון לפי סוג אם נדרש
      if (type && type !== 'all') {
        transactions = transactions.filter(tx => tx.transaction_type === type);
      }
      
      // סינון לפי חיפוש אם נדרש
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        transactions = transactions.filter(tx => 
          tx.description?.toLowerCase().includes(search) ||
          tx.category_name?.toLowerCase().includes(search)
        );
      }
      
      return {
        transactions,
        pagination: response?.pagination || { total: 0 },
        totalCount: transactions.length
      };
    }
  });

  // Helper functions
  const getTransactionsByType = (transactionType) => {
    const transactions = data?.transactions || [];
    return transactions.filter(tx => tx.transaction_type === transactionType);
  };

  const searchTransactions = (term) => {
    const transactions = data?.transactions || [];
    if (!term) return transactions;
    return transactions.filter(tx => 
      tx.description?.toLowerCase().includes(term.toLowerCase()) ||
      tx.category_name?.toLowerCase().includes(term.toLowerCase())
    );
  };

  return {
    periodTransactions: data?.transactions || [], // ✅ תמיד array
    totalCount: data?.totalCount || 0,
    pagination: data?.pagination || { total: 0 },
    loading,
    error,
    refreshTransactions,
    getTransactionsByType,
    searchTransactions,
    period
  };
};

export const useRecurringTransactionsList = () => {
  const isAuthenticated = localStorage.getItem('accessToken');
  
  return useQuery({
    queryKey: ['recurring-transactions'],
    queryFn: async () => {
      console.log('🔄 [useRecurringTransactionsList] Fetching recurring transactions');
      const response = await transactionAPI.getRecurring();
      return response;
    },
    // ✅ ADD: Auth guards
    enabled: !!isAuthenticated,
    refetchOnWindowFocus: !!isAuthenticated,
    refetchOnMount: !!isAuthenticated,
    select: (response) => {
      const data = response?.data || response;
      return Array.isArray(data.data) ? data.data : [];
    },
    staleTime: 60 * 1000,
    retry: 1
  });
};
