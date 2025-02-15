// RecentTransactions.jsx
// Component for displaying recent transactions on the home page
import React, { useEffect, useRef } from 'react';
import { ChevronRight, Clock } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useTransactions } from '../../context/TransactionContext';
import { useRefresh } from '../../context/RefreshContext';
import TransactionList from './Transactions/TransactionList';

const RecentTransactions = ({ selectedDate }) => {
  useEffect(() => {
    console.log('RecentTransactions received date:', selectedDate);
  }, [selectedDate]);

  // Hooks
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const isHebrew = language === 'he';
  const { recentTransactions, loading, fetchRecentTransactions } = useTransactions();
  const { refreshTimestamp } = useRefresh();
  const refreshTimeoutRef = useRef(null);
  const lastHandledDateRef = useRef(null);

  // Initial load and date change handler with redundancy prevention
  const lastFetchedDate = useRef(null);

  useEffect(() => {
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      if (lastFetchedDate.current !== formattedDate) {
        lastFetchedDate.current = formattedDate;
        fetchRecentTransactions(5, selectedDate);
      }
    }
  }, [selectedDate, fetchRecentTransactions]);

  // Refresh handler - ensures refreshes happen at the right time with selectedDate
  useEffect(() => {
    if (refreshTimestamp && selectedDate) {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
  
      refreshTimeoutRef.current = setTimeout(() => {
        fetchRecentTransactions(5, selectedDate);
      }, 1000);
    }
  
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [refreshTimestamp, selectedDate, fetchRecentTransactions]);
  

  // Loading state
  if (loading) {
    return (
      <div className="card gradient-primary" dir={isHebrew ? 'rtl' : 'ltr'}>
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card gradient-primary">
      <div dir={isHebrew ? 'rtl' : 'ltr'}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-black">
            {t('home.transactions.recent')}
          </h2>
          <button
            onClick={() => navigate('/transactions', { state: { selectedDate } })}
            className="text-primary-500 hover:text-primary-600 flex items-center gap-1"
          >
            {t('home.transactions.viewAll')}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <TransactionList
        transactions={recentTransactions}
        loading={false}
        showActions={false}
        emptyMessage={t('home.transactions.noTransactions')}
      />
    </div>
  );
};

export default React.memo(RecentTransactions);
