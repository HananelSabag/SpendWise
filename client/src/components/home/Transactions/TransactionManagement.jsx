/**
 * TransactionManagement.jsx
 * Main page for managing transactions by day, applying filters, 
 * and viewing/managing recurring transactions.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Filter,
  Eye,
  Languages,
  DollarSign,
  RefreshCw,
  Search,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  Loader,
} from 'lucide-react';
import { useTransactions } from '../../../context/TransactionContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useCurrency } from '../../../context/CurrencyContext';
import { useDate } from '../../../context/DateContext';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from "../../common/Header";
import FloatingMenu from '../../common/FloatingMenu';
import Footer from '../../common/Footer';
import AccessibilityMenu from '../../common/AccessibilityMenu';
import ActionsPanel from '../ActionsPanel';
import CalendarWidget from '../Transactions/CalendarWidget';
import EditTransactionForm from '../Transactions/EditTransactionForm';
import TransactionList from '../Transactions/TransactionList';
import RecurringTransactionsModal from '../Transactions/RecurringTransactionsModal';

/**
 * Main TransactionManagement component
 * Enhanced with better UI, improved error handling, and better mobile experience
 */
const TransactionManagement = () => {
  const navigate = useNavigate();
  const { state } = useLocation();

  // Context Hooks
  const { t, language, toggleLanguage } = useLanguage();
  const { toggleCurrency } = useCurrency();
  const { selectedDate, updateSelectedDate, formatDate } = useDate();
  const {
    periodTransactions,
    getByPeriod,
    getRecurringTransactions,
    updateTransaction,
    deleteTransaction,
    loading: globalLoading,
    error: globalError
  } = useTransactions();

  // Local UI state
  const isHebrew = language === 'he';
  const dateButtonRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [editDialog, setEditDialog] = useState({ open: false, transaction: null });
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState(null);

  // Recurring transactions modal
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [recurringList, setRecurringList] = useState([]);
  const [recurringLoading, setRecurringLoading] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    income: false,
    expense: false,
    recurring: false,
    oneTime: false
  });

  // For avoiding repeated fetch calls
  const lastFetchRef = useRef(null);

  /**
   * fetchData(date, force)
   * Fetch transactions for a given date, optionally forcing a fresh fetch.
   */
  const fetchData = useCallback(async (date, force = false) => {
    const normalized = new Date(date);
    normalized.setHours(12, 0, 0, 0);
    const dateStr = normalized.toISOString().split('T')[0];

    // Prevent redundant fetch calls
    if (!force && lastFetchRef.current === dateStr) return;

    try {
      setLocalLoading(true);
      setError(null);
      await getByPeriod('day', normalized);
      lastFetchRef.current = dateStr;
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(t('transactions.fetchError'));
    } finally {
      setLocalLoading(false);
    }
  }, [getByPeriod, t]);

  /**
   * fetchRecurringTransactions()
   * Fetch all recurring transactions for the recurring modal
   */
  const fetchRecurringTransactions = useCallback(async () => {
    try {
      setRecurringLoading(true);
      setError(null);
      const rec = await getRecurringTransactions();
      setRecurringList(rec || []);
      return rec;
    } catch (err) {
      console.error('Error fetching recurring transactions:', err);
      setError(t('transactions.fetchError'));
      return [];
    } finally {
      setRecurringLoading(false);
    }
  }, [getRecurringTransactions, t]);

  // Initial load - fetch data for selected date
  useEffect(() => {
    const initDate = state?.selectedDate ? new Date(state.selectedDate) : selectedDate;
    fetchData(initDate, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Whenever selectedDate changes
  useEffect(() => {
    fetchData(selectedDate);
  }, [selectedDate, fetchData]);

  // Apply filters to transaction list
  const filteredTransactions = useMemo(() => {
    return periodTransactions.filter((tx) => {
      if (filters.income && tx.transaction_type !== 'income') return false;
      if (filters.expense && tx.transaction_type !== 'expense') return false;
      if (filters.recurring && !tx.is_recurring) return false;
      if (filters.oneTime && tx.is_recurring) return false;
      return true;
    });
  }, [periodTransactions, filters]);

  /**
   * Handlers for user interactions
   */
  // Date selection handler
  const handleDateSelect = (date) => {
    const norm = new Date(date);
    norm.setHours(12, 0, 0, 0);
    updateSelectedDate(norm);
    setShowCalendar(false);
  };

  // Edit transaction handler
  const handleEdit = (transaction) => {
    setEditDialog({ open: true, transaction });
  };

  // Delete transaction handler
  const handleDeleteTransaction = async (transaction, deleteFuture = false) => {
    try {
      setLocalLoading(true);
      await deleteTransaction(transaction.transaction_type, transaction.id, deleteFuture);
      
      // Refresh relevant data
      await fetchData(selectedDate, true);
      if (transaction.is_recurring) {
        await fetchRecurringTransactions();
      }
    } catch (err) {
      console.error('Error deleting transaction:', err);
      setError(t('transactions.deleteError'));
    } finally {
      setLocalLoading(false);
    }
  };

  // Update transaction handler
  const handleUpdateTransaction = async (data) => {
    try {
      setLocalLoading(true);
      await updateTransaction(
        data.transaction_type,
        data.id,
        data,
        data.updateFuture || false
      );
      
      // Refresh data
      await fetchData(selectedDate, true);
      
      // If this was a recurring transaction, refresh that list too
      if (data.is_recurring) {
        await fetchRecurringTransactions();
      }
      
      setEditDialog({ open: false, transaction: null });
    } catch (err) {
      console.error('Error updating transaction:', err);
      setError(t('transactions.updateError'));
    } finally {
      setLocalLoading(false);
    }
  };

  // Handle view recurring transactions
  const handleViewRecurring = async () => {
    await fetchRecurringTransactions();
    setShowRecurringModal(true);
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      income: false,
      expense: false,
      recurring: false,
      oneTime: false
    });
  };

  // Combined loading state
  const isLoading = globalLoading || localLoading;

  return (
    <div className="min-h-screen bg-primary-200 flex flex-col">
      <Header
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        title={t('transactions.title')}
      />

      <main className="max-w-7xl mx-auto p-4 md:p-6 flex-grow" dir={isHebrew ? 'rtl' : 'ltr'}>
        {/* Top bar with date selector and actions */}
        <div className="card bg-gradient-to-br from-primary-400 to-primary-500 p-4 md:p-6 !rounded-b-none shadow-lg">
          <div
            className={`flex flex-col md:flex-row items-center justify-between gap-4 ${
              isHebrew ? 'md:flex-row-reverse' : ''
            }`}
          >
            {/* Date selector & label */}
            <div className="flex items-center gap-4 w-full md:w-auto">
              <span
                className="text-lg font-bold text-white whitespace-nowrap"
                style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)' }}
              >
                {t('transactions.transactionsForDay')}
              </span>

              <div className="relative flex-1 md:flex-initial">
                <button
                  ref={dateButtonRef}
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="flex items-center justify-between w-full md:w-auto gap-2 bg-white text-primary-600 
                             px-4 py-2 rounded-xl hover:bg-white/90 
                             transition-colors shadow-sm"
                >
                  <CalendarIcon className="w-5 h-5" />
                  <span>
                    {formatDate(selectedDate, language)}
                  </span>
                </button>
                {showCalendar && (
                  <div
                    className={`absolute z-50 mt-2 ${
                      isHebrew ? 'right-0' : 'left-0'
                    }`}
                  >
                    <CalendarWidget
                      selectedDate={selectedDate}
                      onDateSelect={handleDateSelect}
                      onClose={() => setShowCalendar(false)}
                      toggleRef={dateButtonRef}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Vertical divider on desktop */}
            <div className="hidden md:block w-px h-12 bg-white/50" />

            {/* Actions (Add Transaction + View Recurring) */}
            <div className="flex-1 flex flex-col md:flex-row items-center gap-4 md:gap-6 w-full md:w-auto">
              <div className="w-full md:w-auto flex-1">
                <ActionsPanel />
              </div>

              <button
                onClick={handleViewRecurring}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-white text-primary-600 
                           px-4 py-2 rounded-xl hover:bg-white/90 
                           transition-colors shadow-sm"
              >
                <Eye className="w-5 h-5" />
                <span>
                  {t('transactions.recurringTransactions')} 
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="card gradient-primary mt-0 !rounded-t-none">
          {/* Filter toggle */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="bg-white text-primary-600 px-4 py-2 
                       rounded-xl shadow-sm hover:bg-gray-50 
                       flex items-center gap-2 transition-colors"
            >
              <Filter className="w-5 h-5" />
              <span>{t('transactions.filters.filterButton')}</span>
              {showFilter ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Filter panel (collapsible) */}
          {showFilter && (
            <div className="p-4 bg-white rounded-xl mx-4 mb-4 shadow-sm border border-gray-100 
                           transition-all duration-300 animate-slideDown">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                  <input
                    type="checkbox"
                    checked={filters.income}
                    onChange={() =>
                      setFilters((prev) => ({ ...prev, income: !prev.income }))
                    }
                    className="rounded text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-gray-700">{t('transactions.filters.income')}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                  <input
                    type="checkbox"
                    checked={filters.expense}
                    onChange={() =>
                      setFilters((prev) => ({
                        ...prev,
                        expense: !prev.expense
                      }))
                    }
                    className="rounded text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-gray-700">{t('transactions.filters.expense')}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                  <input
                    type="checkbox"
                    checked={filters.recurring}
                    onChange={() =>
                      setFilters((prev) => ({
                        ...prev,
                        recurring: !prev.recurring
                      }))
                    }
                    className="rounded text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-gray-700">{t('transactions.filters.recurring')}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                  <input
                    type="checkbox"
                    checked={filters.oneTime}
                    onChange={() =>
                      setFilters((prev) => ({
                        ...prev,
                        oneTime: !prev.oneTime
                      }))
                    }
                    className="rounded text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-gray-700">{t('transactions.filters.oneTime')}</span>
                </label>
              </div>
              
              {/* Reset filters button */}
              {(filters.income || filters.expense || filters.recurring || filters.oneTime) && (
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={resetFilters}
                    className="text-sm text-primary-600 hover:text-primary-800 hover:underline 
                              flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-primary-50
                              transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {t('common.reset')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Transaction list area */}
          <div className="p-4">
            {/* Loading state */}
            {isLoading && (
              <div className="py-8 flex justify-center items-center">
                <div className="flex flex-col items-center">
                  <Loader className="w-8 h-8 text-primary-500 animate-spin mb-2" />
                  <p className="text-gray-600">{t('common.loading')}</p>
                </div>
              </div>
            )}

            {/* Error state */}
            {!isLoading && error && (
              <div className="bg-error-light text-error p-4 rounded-xl flex items-center gap-3 mb-4 animate-fadeIn">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="font-medium">{error}</p>
                  <button 
                    onClick={() => fetchData(selectedDate, true)}
                    className="text-sm underline mt-1"
                  >
                    {t('common.retry')}
                  </button>
                </div>
              </div>
            )}

            {/* Back to today button */}
            {!isLoading && !error && selectedDate.toDateString() !== new Date().toDateString() && (
              <div className="mb-4">
                <button
                  onClick={() => handleDateSelect(new Date())}
                  className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-800
                            px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t('transactions.currentDate')}</span>
                </button>
              </div>
            )}

            {/* Transaction list */}
            {!isLoading && !error && (
              <TransactionList
                transactions={filteredTransactions}
                showActions
                onEdit={handleEdit}
                onDelete={handleDeleteTransaction}
              />
            )}
          </div>
        </div>
      </main>

      {/* Edit Transaction Form popup */}
      {editDialog.open && (
        <EditTransactionForm
          transaction={editDialog.transaction}
          loading={localLoading}
          onClose={() => setEditDialog({ open: false, transaction: null })}
          onSubmit={handleUpdateTransaction}
          onDelete={handleDeleteTransaction}
        />
      )}

      {/* Recurring Transaction Modal */}
      <RecurringTransactionsModal
        open={showRecurringModal}
        onClose={() => setShowRecurringModal(false)}
        transactions={recurringList}
        loading={recurringLoading}
        onEdit={(tx) => {
          setShowRecurringModal(false);
          handleEdit(tx);
        }}
        onDelete={handleDeleteTransaction}
      />

      {/* Accessibility Menu */}
      <AccessibilityMenu />

      {/* Floating menu with language/currency toggles */}
      <FloatingMenu
        buttons={[
          {
            label: t('floatingMenu.changeLanguage'),
            icon: Languages,
            onClick: toggleLanguage
          },
          {
            label: t('floatingMenu.switchCurrency'),
            icon: DollarSign,
            onClick: toggleCurrency
          }
        ]}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default TransactionManagement;