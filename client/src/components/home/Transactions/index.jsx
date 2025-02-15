// TransactionManagement.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTransactions } from '../../../context/TransactionContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useLocation } from 'react-router-dom';
import { Languages, DollarSign, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../../utils/helpers';
import TransactionList from './TransactionList';
import EditTransactionForm from './EditTransactionForm';
import ActionsPanel from '../ActionsPanel';
import CalendarWidget from './CalendarWidget';
import Header from "../../common/Header";
import FloatingMenu from "../../common/FloatingMenu";
import { useCurrency } from '../../../context/CurrencyContext';

/**
 * TransactionManagement Component
 * Handles the display and management of transactions for a specific date
 * Receives selected date from RecentTransactions when navigating via "View All"
 */
const TransactionManagement = () => {
  // Router and location hooks
  const navigate = useNavigate();
  const { state } = useLocation();
  const dateButtonRef = useRef(null);

  // Core hooks
  const { t, language, toggleLanguage } = useLanguage();
  const { toggleCurrency, currency } = useCurrency();
  const {
    periodTransactions = [],
    fetchPeriodTransactions,
    updateTransaction,
    deleteTransaction,
    loading: globalLoading,
    error: globalError,
  } = useTransactions();

  // UI state
  const isHebrew = language === 'he';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Initialize with passed date or today
  const [selectedDate, setSelectedDate] = useState(() => {
    if (state?.selectedDate) {
      const date = new Date(state.selectedDate);
      date.setHours(12, 0, 0, 0);
      return date;
    }
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    return today;
  });

  // Transaction management state
  const [editDialog, setEditDialog] = useState({ open: false, transaction: null });
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState(null);

  // Refs for tracking mounted state and previous fetches
  const mountedRef = useRef(true);
  const lastFetchRef = useRef(null);

  // Filter state
  const [filters, setFilters] = useState({
    income: false,
    expense: false,
    recurring: false,
    oneTime: false,
  });

  /**
   * Filter transactions based on current filter settings
   */
  const applyFilters = useCallback(() => {
    return periodTransactions.filter((transaction) => {
      const isIncome = transaction.transaction_type === 'income';
      const isExpense = transaction.transaction_type === 'expense';
      const isRecurring = transaction.is_recurring;
      const isOneTime = !transaction.is_recurring;

      if (filters.income && !isIncome) return false;
      if (filters.expense && !isExpense) return false;
      if (filters.recurring && !isRecurring) return false;
      if (filters.oneTime && !isOneTime) return false;

      return true;
    });
  }, [filters, periodTransactions]);

  /**
   * Fetch transactions for the selected date
   */
  const fetchData = useCallback(
    async (date, force = false) => {
      const normalizedDate = new Date(date);
      normalizedDate.setHours(12, 0, 0, 0);
      const dateString = normalizedDate.toISOString().split('T')[0];

      if (!force && lastFetchRef.current === dateString) {
        console.log('Skipping redundant fetch for date:', dateString);
        return;
      }

      try {
        setLocalLoading(true);
        setError(null);
        await fetchPeriodTransactions('day', normalizedDate);
        lastFetchRef.current = dateString;
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError(t('transactions.fetchError'));
      } finally {
        setLocalLoading(false);
      }
    },
    [fetchPeriodTransactions, t]
  );

  // Initial data load
  useEffect(() => {
    mountedRef.current = true;
    fetchData(selectedDate, true);
    return () => {
      mountedRef.current = false;
    };
  }, [fetchData, selectedDate]);

  /**
   * Handle date selection from calendar
   */
  const handleDateSelect = useCallback(
    (date) => {
      const normalizedDate = new Date(date);
      normalizedDate.setHours(12, 0, 0, 0);
      setSelectedDate(normalizedDate);
      setShowCalendar(false);
      fetchData(normalizedDate, true);
    },
    [fetchData]
  );

  /**
   * Open edit dialog for transaction
   */
  const handleEdit = useCallback((transaction) => {
    setEditDialog({ open: true, transaction });
  }, []);

  /**
   * Delete transaction with confirmation
   */
  const handleDelete = useCallback(
    async (id, type) => {
      if (window.confirm(t('transactions.deleteConfirm'))) {
        try {
          setLocalLoading(true);
          await deleteTransaction(id, type);
          await fetchData(selectedDate, true);
        } catch (err) {
          console.error('Error deleting transaction:', err);
          setError(t('transactions.deleteError'));
        } finally {
          setLocalLoading(false);
        }
      }
    },
    [deleteTransaction, fetchData, selectedDate, t]
  );

  /**
   * Update existing transaction
   */
  const handleUpdateTransaction = useCallback(
    async (updatedData) => {
      if (!updatedData.date) {
        setError(t('transactions.dateRequired'));
        return;
      }

      try {
        setLocalLoading(true);
        await updateTransaction(
          updatedData.id,
          updatedData.transaction_type,
          {
            ...updatedData,
            amount: parseFloat(updatedData.amount),
          }
        );
        await fetchData(selectedDate, true);
        setEditDialog({ open: false, transaction: null });
      } catch (err) {
        console.error('Error updating transaction:', err);
        setError(t('transactions.updateError'));
      } finally {
        setLocalLoading(false);
      }
    },
    [updateTransaction, fetchData, selectedDate, t]
  );

  const isLoading = globalLoading || localLoading;
  return (
    <div className="min-h-screen bg-primary-200">
      {/* Header */}
      <Header
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        title={t('transactions.title')}
      />
      <div className="max-w-7xl mx-auto p-4 md:p-6" dir={isHebrew ? 'rtl' : 'ltr'}>
        {/* Navigation Bar */}
        <div className="card bg-gradient-to-br from-primary-400 to-primary-500 p-4 md:p-6 !rounded-b-none shadow-lg">
          <div
            className={`flex flex-col md:flex-row items-center justify-between gap-4 ${isHebrew ? 'flex-row-reverse' : ''
              }`}
          >
            {/* Date and Actions Panel */}
            <div className="flex items-center gap-4">
              <span
                className="text-lg font-bold text-white"
                style={{
                  textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                  fontSize: '26px',
                }}
              >
                {t('transactions.transactionsForDay')}
              </span>

              <div className="relative">
                <button
                  ref={dateButtonRef}
                  data-calendar-toggle
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCalendar(!showCalendar);
                  }}
                  className="flex items-center gap-2 bg-white text-primary-600 px-4 py-2 rounded-xl hover:bg-white/90 transition-colors shadow-sm"
                >
                  <CalendarIcon className="w-5 h-5" />
                  <span>{formatDate(selectedDate, language)}</span>
                </button>

                {showCalendar && (
                  <div
                    className={`absolute ${isHebrew ? 'left-0' : 'right-0'
                      } top-full mt-2 z-50`}
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

            {/* Vertical Divider */}
            <div className="hidden md:block w-px h-12 bg-white/50" />

            {/* Actions Panel */}
            <div className="flex-1">
              <ActionsPanel
                onTransactionAdded={() => {
                  fetchData(selectedDate, true);
                }}
              />
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="card gradient-primary mt-0 !rounded-t-none">
          {periodTransactions.length > 0 && (
            <div
              className={`flex justify px-4 pt-4 relative`}
            >
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="flex items-center gap-2 bg-white text-primary-600 px-4 py-2 rounded-xl hover:bg-white/90 transition-colors shadow-sm"
              >
                <Filter className="w-5 h-5" />
                <span>{t('transactions.filters.filterButton')}</span>
              </button>
              {showFilterDropdown && (
                <div
                  className={`absolute top-full mt-2 z-50 bg-white p-4 rounded-xl shadow-lg`}
                >
                  <h3 className="text-lg font-bold mb-4">
                    {t('transactions.filters.title')}
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filters.income}
                        onChange={() =>
                          setFilters({ ...filters, income: !filters.income })
                        }
                      />
                      {t('transactions.filters.income')}
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filters.expense}
                        onChange={() =>
                          setFilters({ ...filters, expense: !filters.expense })
                        }
                      />
                      {t('transactions.filters.expense')}
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filters.recurring}
                        onChange={() =>
                          setFilters({ ...filters, recurring: !filters.recurring })
                        }
                      />
                      {t('transactions.filters.recurring')}
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filters.oneTime}
                        onChange={() =>
                          setFilters({ ...filters, oneTime: !filters.oneTime })
                        }
                      />
                      {t('transactions.filters.oneTime')}
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="p-4 md:p-6">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div dir="ltr">
                <TransactionList
                  transactions={applyFilters()}
                  loading={false}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  emptyMessage={t('transactions.noTransactions')}
                />
              </div>

            )}
          </div>
        </div>


      </div>

      {/* Edit Dialog */}
      {editDialog.open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 md:max-w-2xl md:mx-auto overflow-hidden">
            <EditTransactionForm
              transaction={editDialog.transaction}
              onClose={() => setEditDialog({ open: false, transaction: null })}
              onSubmit={handleUpdateTransaction}
              loading={localLoading}
            />
          </div>
        </div>
      )}

      {/* Language and Currency Controls */}
      <FloatingMenu
        className="fixed bottom-4 left-4 md:bottom-8 md:left-8 z-[40]"
        buttons={[
          {
            label: t('floatingMenu.changeLanguage'),
            icon: Languages,
            onClick: toggleLanguage,
          },
          {
            label: t('floatingMenu.switchCurrency'),
            icon: DollarSign,
            onClick: toggleCurrency,
          },
        ]}
      />
    </div>
  );



};

export default TransactionManagement;
