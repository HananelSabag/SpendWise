// components/home/RecentTransactions.jsx
import React, { useEffect, useRef } from 'react';
import { ChevronRight, AlertCircle, Clock } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useTransactions } from '../../context/TransactionContext';
import { useDate } from '../../context/DateContext';
import { useRefresh } from '../../context/RefreshContext';
import TransactionList from './Transactions/TransactionList';
import Alert from '../common/Alert';

/**
* RecentTransactions Component
* Displays last 5 transactions with improved loading states and error handling
*/
const RecentTransactions = () => {
 const navigate = useNavigate();
 const { t, language } = useLanguage();
 const { selectedDate } = useDate();
 const {
   recentTransactions, 
   loading,
   error,
   fetchRecentTransactions
 } = useTransactions();
 const { refreshTimestamp, refreshScope } = useRefresh();
 
 // Debounce ref for preventing multiple rapid requests
 const refreshTimeoutRef = useRef(null);
 const lastFetchedDateRef = useRef(null);

 const isHebrew = language === 'he';

 // On mount or date change, fetch last 5 transactions
 useEffect(() => {
   if (!selectedDate) return;
   const dateStr = selectedDate.toISOString().split('T')[0];

   // Only refetch if date changed
   if (lastFetchedDateRef.current !== dateStr) {
     lastFetchedDateRef.current = dateStr;
     // fetch 5 last transactions up to that date
     fetchRecentTransactions(5, selectedDate);
   }
 }, [selectedDate, fetchRecentTransactions]);

 // If refresh triggered externally (RefreshContext)
 useEffect(() => {
   if (!selectedDate) return;
   // if scope is all or transactions => refetch
   if (refreshTimestamp && (refreshScope === 'all' || refreshScope === 'transactions')) {
     if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
     refreshTimeoutRef.current = setTimeout(() => {
       fetchRecentTransactions(5, selectedDate);
     }, 1000);
   }
   return () => {
     if (refreshTimeoutRef.current) {
       clearTimeout(refreshTimeoutRef.current);
     }
   };
 }, [refreshTimestamp, refreshScope, selectedDate, fetchRecentTransactions]);

 // Navigation to transaction management
 const handleViewAll = () => {
   navigate('/transactions', {
     state: {
       selectedDate: selectedDate.toISOString()
     }
   });
 };

 // Skeleton loader for better loading experience
 const TransactionSkeleton = () => (
   <div className="animate-pulse">
     {[1, 2, 3].map((i) => (
       <div key={i} className="flex items-center gap-3 p-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
         <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
         <div className="flex-1">
           <div className="h-4.5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
           <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2"></div>
         </div>
         <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
       </div>
     ))}
   </div>
 );

 return (
   <div className="card gradient-primary animate-fadeIn" dir={isHebrew ? 'rtl' : 'ltr'}>
     <div className="flex items-center justify-between px-4 pt-4">
       <h2 className="text-xl font-semibold text-black dark:text-white flex items-center gap-2">
         <Clock className="w-5 h-5 text-primary-500" />
         {t('home.transactions.recent')}
       </h2>
       <button
         onClick={handleViewAll}
         className="text-primary-500 hover:text-primary-600 flex items-center gap-1 
                    transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 rounded-md px-2 py-1"
         aria-label={t('home.transactions.viewAll')}
       >
         {t('home.transactions.viewAll')}
         <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${isHebrew ? 'rotate-180' : ''}`} />
       </button>
     </div>

     <div className="p-4">
       {/* Loading state */}
       {loading && <TransactionSkeleton />}
       
       {/* Error state with Alert component */}
       {error && !loading && (
         <Alert 
           type="error" 
           message={t('transactions.fetchError')}
           onDismiss={() => {
             // Optional retry functionality
             fetchRecentTransactions(5, selectedDate);
           }}
         />
       )}
       
       {/* Show the 5 transactions in recentTransactions - Fixed HTML nesting issue */}
       {!loading && !error && (
         <TransactionList
           transactions={recentTransactions}
           loading={false}
           showActions={false}
         />
       )}

       {/* Show empty state when no transactions - Separate component to avoid HTML nesting issue */}
       {!loading && !error && recentTransactions.length === 0 && (
         <div className="text-center py-6 text-gray-500 dark:text-gray-400">
           <div className="mb-2 inline-block p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
             <Clock className="w-6 h-6 text-gray-400 dark:text-gray-500" />
           </div>
           <p>{t('home.transactions.noTransactions')}</p>
         </div>
       )}
     </div>
   </div>
 );
};

export default React.memo(RecentTransactions);