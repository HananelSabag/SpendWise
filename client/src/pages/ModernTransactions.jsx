/**
 * ModernTransactions — transactions management page.
 * Uses useIsMobile() to render separate mobile and desktop layouts.
 * All data hooks and state are shared; only layout differs.
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Search, Filter, ArrowLeftRight,
  X, CheckCircle, List, Grid3X3, Repeat, Receipt, Layers,
  ChevronDown, AlertTriangle, Trash2, RefreshCw, Calendar,
  DollarSign,
} from 'lucide-react';

import { useTranslation, useCurrency, useNotifications } from '../stores';
import { useTransactions } from '../hooks/useTransactions';
import { useDebounce } from '../hooks/useDebounce';
import { useTransactionActions } from '../hooks/useTransactionActions';
import { useCategory } from '../hooks/useCategory';
import { useRecurringTransactions } from '../hooks/useRecurringTransactions';
import { useIsMobile } from '../hooks/useIsMobile';
import { Button, Input, Card, LoadingSpinner, Badge, Modal } from '../components/ui';
import { cn } from '../utils/helpers';

import ModernTransactionCard from '../components/features/transactions/ModernTransactionCard';
import FutureTransactionsCollapsible from '../components/features/transactions/FutureTransactionsCollapsible';
import QuickMonthSelector from '../components/features/transactions/QuickMonthSelector';
import ModernRecurringTransactions from '../components/features/transactions/ModernRecurringTransactions';
import AddTransactionModal from '../components/features/transactions/modals/AddTransactionModal';
import EditTransactionModal from '../components/features/transactions/modals/EditTransactionModal';
import RecurringSetupModal from '../components/features/transactions/modals/RecurringSetupModal';
import DeleteTransaction from '../components/features/transactions/DeleteTransaction';
import ModernRecurringManagerPanel from '../components/features/transactions/recurring/ModernRecurringManagerPanel';
import FloatingAddTransactionButton from '../components/common/FloatingAddTransactionButton';
import BottomSheet from '../components/common/BottomSheet';
import useAutoRegeneration from '../hooks/useAutoRegeneration';

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_FILTERS = {
  category: 'all',
  type: 'all',
  recurring: 'all',
  amountMin: '',
  amountMax: '',
  sortBy: 'date',
  sortOrder: 'desc',
  month: 'all',
};

const countActiveFilters = (filters) =>
  [
    filters.type !== 'all',
    filters.category !== 'all',
    filters.recurring !== 'all',
    filters.amountMin !== '',
    filters.amountMax !== '',
  ].filter(Boolean).length;

// ─── Advanced Filters ─────────────────────────────────────────────────────────

const AdvancedFilters = ({ filters, onFilterChange, onClear, categories }) => {
  const { t } = useTranslation('transactions');
  const activeCount = countActiveFilters(filters);

  const selectClass = (active) => cn(
    'w-full px-3 py-2 border-2 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
    'focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium',
    active
      ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/10'
      : 'border-gray-300 dark:border-gray-600',
  );

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            {t('advancedFilters', 'Filters')}
          </h3>
          {activeCount > 0 && (
            <p className="text-xs text-indigo-600 dark:text-indigo-400">
              {activeCount} active
            </p>
          )}
        </div>
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear}
            className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs">
            <X className="w-3 h-3 mr-1" /> Clear
          </Button>
        )}
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        {/* Type */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
            <ArrowLeftRight className="w-3 h-3" />
            {t('filters.type.label', 'Type')}
            {filters.type !== 'all' && <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />}
          </label>
          <select value={filters.type} onChange={(e) => onFilterChange({ type: e.target.value })}
            className={selectClass(filters.type !== 'all')}>
            <option value="all">{t('filters.type.all', 'All Types')}</option>
            <option value="income">💰 {t('transactions.types.income', 'Income')}</option>
            <option value="expense">💸 {t('transactions.types.expense', 'Expense')}</option>
          </select>
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
            <Layers className="w-3 h-3" />
            {t('filters.category.label', 'Category')}
            {filters.category !== 'all' && <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />}
          </label>
          <select value={filters.category} onChange={(e) => onFilterChange({ category: e.target.value })}
            className={selectClass(filters.category !== 'all')}>
            <option value="all">{t('filters.category.all', 'All Categories')}</option>
            {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Recurring */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
            <Repeat className="w-3 h-3" />
            {t('filters.recurring.label', 'Recurring')}
            {filters.recurring !== 'all' && <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />}
          </label>
          <select value={filters.recurring} onChange={(e) => onFilterChange({ recurring: e.target.value })}
            className={selectClass(filters.recurring !== 'all')}>
            <option value="all">{t('filters.recurring.all', 'All')}</option>
            <option value="recurring">🔄 {t('filters.recurring.recurring', 'Recurring')}</option>
            <option value="oneTime">⚡ {t('filters.recurring.oneTime', 'One-Time')}</option>
          </select>
        </div>
      </div>

      {/* Amount range */}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1 mb-2">
          <DollarSign className="w-3 h-3" />
          {t('filters.amountRangeLabel', 'Amount Range')}
          {(filters.amountMin || filters.amountMax) && <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />}
        </label>
        <div className="grid grid-cols-2 gap-2">
          <Input type="number" placeholder={t('filters.minAmount', 'Min')}
            value={filters.amountMin} onChange={(e) => onFilterChange({ amountMin: e.target.value })}
            className="text-sm" />
          <Input type="number" placeholder={t('filters.maxAmount', 'Max')}
            value={filters.amountMax} onChange={(e) => onFilterChange({ amountMax: e.target.value })}
            className="text-sm" />
        </div>
      </div>
    </div>
  );
};

// ─── Month header ─────────────────────────────────────────────────────────────

const MonthHeader = ({ title, totalIncome, totalExpenses }) => {
  const { formatCurrency } = useCurrency();
  const net = totalIncome - totalExpenses;

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 mb-3 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800 sticky top-0 z-20 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-indigo-500" />
        <span className="font-bold text-gray-900 dark:text-white text-sm">{title}</span>
      </div>
      <div className="flex items-center gap-2 text-xs font-semibold">
        {totalIncome > 0 && <span className="text-green-600 dark:text-green-400">+{formatCurrency(totalIncome)}</span>}
        {totalExpenses > 0 && <span className="text-red-600 dark:text-red-400">-{formatCurrency(totalExpenses)}</span>}
        <span className={cn('pl-2 border-l border-gray-300 dark:border-gray-600',
          net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
          {net >= 0 ? '+' : ''}{formatCurrency(net)}
        </span>
      </div>
    </div>
  );
};

// ─── Day header ───────────────────────────────────────────────────────────────

const DayHeader = ({ title, totalIncome, totalExpenses }) => {
  const { formatCurrency } = useCurrency();
  const net = totalIncome - totalExpenses;

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 mb-2 bg-gray-50 dark:bg-gray-800/60 rounded-lg border border-gray-200 dark:border-gray-700 sticky top-12 z-10">
      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{title}</span>
      <div className="flex items-center gap-2 text-xs">
        {totalIncome > 0 && <span className="text-green-600 dark:text-green-400">+{formatCurrency(totalIncome)}</span>}
        {totalExpenses > 0 && <span className="text-red-600 dark:text-red-400">-{formatCurrency(totalExpenses)}</span>}
        <span className={cn('pl-1.5 border-l border-gray-300 dark:border-gray-600 font-semibold',
          net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
          {net >= 0 ? '+' : ''}{formatCurrency(net)}
        </span>
      </div>
    </div>
  );
};

// ─── Transaction list (grouped month → day) ───────────────────────────────────

const TransactionList = ({
  transactions, loading, onEdit, onDelete, onDuplicate,
  selectedIds, onSelect, multiSelectMode,
}) => {
  const { t, isRTL } = useTranslation('transactions');

  const grouped = useMemo(() => {
    if (!transactions?.length) return [];
    const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const monthMap = {};
    sorted.forEach((tx) => {
      const d = new Date(tx.date);
      const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap[mk]) {
        monthMap[mk] = {
          title: d.toLocaleDateString(isRTL ? 'he-IL' : 'en-US', { month: 'long', year: 'numeric' }),
          date: d, totalIncome: 0, totalExpenses: 0, days: {},
        };
      }
      const m = monthMap[mk];
      let dk, dt;
      if (d.toDateString() === today.toDateString()) {
        dk = 'today'; dt = t('common.date.today', 'Today');
      } else if (d.toDateString() === yesterday.toDateString()) {
        dk = 'yesterday'; dt = t('common.date.yesterday', 'Yesterday');
      } else {
        dk = d.toDateString();
        dt = d.toLocaleDateString(isRTL ? 'he-IL' : 'en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      }
      if (!m.days[dk]) m.days[dk] = { title: dt, date: d, transactions: [], totalIncome: 0, totalExpenses: 0 };
      m.days[dk].transactions.push(tx);
      const amt = Math.abs(tx.amount);
      if (tx.type === 'income') { m.days[dk].totalIncome += amt; m.totalIncome += amt; }
      else { m.days[dk].totalExpenses += amt; m.totalExpenses += amt; }
    });

    return Object.entries(monthMap)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, month]) => ({
        ...month, key,
        days: Object.entries(month.days)
          .sort(([, a], [, b]) => b.date - a.date)
          .map(([dk, day]) => ({ ...day, key: dk })),
      }));
  }, [transactions, t, isRTL]);

  if (loading && !transactions?.length) {
    return (
      <div className="py-8 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!transactions?.length) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <Receipt className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-600 dark:text-gray-400 font-medium">
          {t('empty.noTransactions', 'No transactions found')}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
          {t('empty.noFilteredTransactions', 'Try adjusting your filters or add a new transaction')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {grouped.map((month) => (
        <div key={month.key}>
          <MonthHeader title={month.title} totalIncome={month.totalIncome} totalExpenses={month.totalExpenses} />
          <div className="space-y-4">
            {month.days.map((day) => (
              <div key={day.key}>
                <DayHeader title={day.title} totalIncome={day.totalIncome} totalExpenses={day.totalExpenses} />
                <div className="space-y-2">
                  {day.transactions.map((tx) => (
                    <ModernTransactionCard
                      key={tx.id}
                      transaction={tx}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onDuplicate={onDuplicate}
                      isSelected={selectedIds?.has(tx.id)}
                      onSelect={multiSelectMode ? onSelect : undefined}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Stats row ────────────────────────────────────────────────────────────────

const StatsRow = ({ summary, recurringSummary, activeTab, formatCurrency }) => {
  const items = activeTab === 'all'
    ? [
      { label: 'Transactions', value: summary.count },
      { label: 'Income', value: formatCurrency(summary.totalIncome), color: 'green' },
      { label: 'Expenses', value: formatCurrency(summary.totalExpenses), color: 'red' },
      { label: 'Recurring', value: `${summary.recurringCount} (${Math.round(summary.recurringPercentage)}%)`, color: 'purple' },
    ]
    : [
      { label: 'Templates', value: recurringSummary.totalCount },
      { label: 'Active', value: recurringSummary.activeCount, color: 'green' },
      { label: 'Monthly In', value: formatCurrency(recurringSummary.totalMonthlyIncome), color: 'green' },
      { label: 'Monthly Out', value: formatCurrency(recurringSummary.totalMonthlyExpenses), color: 'red' },
    ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map(({ label, value, color }) => (
        <div key={label} className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className={cn('text-base font-bold',
            color === 'green' && 'text-green-600 dark:text-green-400',
            color === 'red' && 'text-red-600 dark:text-red-400',
            color === 'purple' && 'text-purple-600 dark:text-purple-400',
            !color && 'text-gray-900 dark:text-white',
          )}>{value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
};

// ─── Bulk delete modal ────────────────────────────────────────────────────────

const BulkDeleteModal = ({ isOpen, count, onClose, onConfirm }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Delete Transactions" size="sm">
    <div className="p-4">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{count} selected</p>
      <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
        <div className="flex items-center text-red-800 dark:text-red-200 gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <p className="text-sm">This action cannot be undone.</p>
        </div>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
        <Button variant="destructive" onClick={onConfirm} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
          <Trash2 className="w-4 h-4 mr-2" /> Delete All
        </Button>
      </div>
    </div>
  </Modal>
);

// ─── Load more section ────────────────────────────────────────────────────────

const LoadMoreSection = ({ loadMoreRef, isFetchingNextPage, hasMore, count, onLoadMore }) => (
  <div ref={loadMoreRef} className="mt-6">
    {isFetchingNextPage ? (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
        ))}
      </div>
    ) : hasMore ? (
      <div className="flex justify-center py-4">
        <Button variant="outline" onClick={onLoadMore}
          className="px-8 rounded-xl border-2 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300">
          <ChevronDown className="w-4 h-4 mr-2" />
          Load More
        </Button>
      </div>
    ) : count > 0 ? (
      <div className="flex items-center justify-center gap-2 py-6 text-gray-500 dark:text-gray-400">
        <CheckCircle className="w-4 h-4 text-green-500" />
        <span className="text-sm">All {count} transactions loaded</span>
      </div>
    ) : null}
  </div>
);

// ─── Mobile layout ────────────────────────────────────────────────────────────

const MobileTransactions = ({
  activeTab, setActiveTab,
  searchQuery, setSearchQuery,
  filters, onFilterChange, clearFilters,
  categories, availableMonths,
  transactions, transactionsData, transactionsLoading,
  loadMoreRef, isFetchingNextPage, hasMore, loadMore,
  recurringSummary, summary,
  onEdit, onDelete, onDuplicate,
  selectedIds, onSelect, multiSelectMode,
  setMultiSelectMode, setSelectedIds,
  setShowBulkDeleteModal,
  isRegenerating,
  setShowRecurringManager,
}) => {
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const activeCount = countActiveFilters(filters);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Page header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-700/60">
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm shrink-0">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Transactions</h1>
        </div>
      </div>

      {/* Sticky controls */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm">
        {/* Tab bar */}
        <div className="grid grid-cols-2 p-2 gap-1">
          <button
            onClick={() => setActiveTab('all')}
            className={cn('py-2 rounded-xl text-sm font-medium transition-colors',
              activeTab === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800')}
          >
            <List className="w-4 h-4 inline mr-1.5" />
            All
          </button>
          <button
            onClick={() => setActiveTab('recurring')}
            className={cn('py-2 rounded-xl text-sm font-medium transition-colors',
              activeTab === 'recurring'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800')}
          >
            <Repeat className="w-4 h-4 inline mr-1.5" />
            Recurring
          </button>
        </div>

        {/* Search + filter row (all tab only) */}
        {activeTab === 'all' && (
          <div className="px-3 pb-2 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-400"
              />
            </div>
            <button
              onClick={() => setShowFilterSheet(true)}
              className={cn('relative px-3 py-2 rounded-xl border text-sm font-medium transition-colors',
                activeCount > 0
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800')}
            >
              <Filter className="w-4 h-4" />
              {activeCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {activeCount}
                </span>
              )}
            </button>
            <QuickMonthSelector
              availableMonths={availableMonths}
              selectedMonth={filters.month}
              onMonthChange={(month) => onFilterChange({ month })}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-3 py-3">
        {activeTab === 'all' ? (
          <div className="space-y-3">
            {/* Bulk select bar */}
            {multiSelectMode && selectedIds.size > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {selectedIds.size} selected
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>Clear</Button>
                  <Button variant="destructive" size="sm" onClick={() => setShowBulkDeleteModal(true)}>
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                  </Button>
                </div>
              </div>
            )}

            <FutureTransactionsCollapsible transactions={transactionsData || []} loading={transactionsLoading} />

            <TransactionList
              transactions={transactions}
              loading={transactionsLoading}
              onEdit={onEdit}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              selectedIds={selectedIds}
              onSelect={onSelect}
              multiSelectMode={multiSelectMode}
            />

            <LoadMoreSection
              loadMoreRef={loadMoreRef}
              isFetchingNextPage={isFetchingNextPage}
              hasMore={hasMore}
              count={transactions?.length || 0}
              onLoadMore={loadMore}
            />
          </div>
        ) : (
          <ModernRecurringTransactions
            onOpenRecurringManager={(template) => setShowRecurringManager(true)}
          />
        )}
      </div>

      {/* Filter bottom sheet */}
      <BottomSheet isOpen={showFilterSheet} onClose={() => setShowFilterSheet(false)} title="Filters">
        <AdvancedFilters
          filters={filters}
          onFilterChange={onFilterChange}
          onClear={() => { clearFilters(); setShowFilterSheet(false); }}
          categories={categories}
        />
      </BottomSheet>
    </div>
  );
};

// ─── Desktop layout ───────────────────────────────────────────────────────────

const DesktopTransactions = ({
  activeTab, setActiveTab,
  searchQuery, setSearchQuery,
  filters, onFilterChange, clearFilters,
  showFilters, setShowFilters,
  categories, availableMonths,
  transactions, transactionsData, transactionsLoading,
  loadMoreRef, isFetchingNextPage, hasMore, loadMore,
  recurringSummary, summary,
  formatCurrency,
  onEdit, onDelete, onDuplicate,
  selectedIds, onSelect, multiSelectMode, setMultiSelectMode, setSelectedIds,
  setShowBulkDeleteModal,
  viewMode, setViewMode,
  isRegenerating,
  setShowRecurringManager,
}) => {
  const activeCount = countActiveFilters(filters);
  const hasActiveSearch = searchQuery || Object.values(filters).some((f) => f !== 'all' && f !== '');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-700/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md shrink-0">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Transactions</h1>
            {isRegenerating && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Auto-generating...
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 space-y-5">
        {/* Tabs */}
        <div className="grid grid-cols-2 bg-white dark:bg-gray-800 rounded-2xl p-1 shadow-sm border border-gray-200 dark:border-gray-700 max-w-md">
          <button
            onClick={() => setActiveTab('all')}
            className={cn('rounded-xl px-4 py-2.5 text-sm font-medium transition-all flex items-center justify-center gap-2',
              activeTab === 'all'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700')}
          >
            <List className="w-4 h-4" /> All Transactions
          </button>
          <button
            onClick={() => setActiveTab('recurring')}
            className={cn('rounded-xl px-4 py-2.5 text-sm font-medium transition-all flex items-center justify-center gap-2',
              activeTab === 'recurring'
                ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700')}
          >
            <Repeat className="w-4 h-4" /> Recurring
          </button>
        </div>

        {/* Stats */}
        <StatsRow
          summary={summary}
          recurringSummary={recurringSummary}
          activeTab={activeTab}
          formatCurrency={formatCurrency}
        />

        {/* All tab content */}
        {activeTab === 'all' && (
          <div className="space-y-4">
            {/* Search + controls bar */}
            <Card className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex flex-col lg:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10 rounded-xl"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <QuickMonthSelector
                    availableMonths={availableMonths}
                    selectedMonth={filters.month}
                    onMonthChange={(month) => onFilterChange({ month })}
                  />
                  <Button
                    variant={showFilters ? 'default' : 'outline'}
                    onClick={() => setShowFilters(!showFilters)}
                    className="relative h-10 px-4 rounded-xl"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                    {activeCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {activeCount}
                      </span>
                    )}
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                    className="h-10 px-3 rounded-xl"
                  >
                    {viewMode === 'list' ? <Grid3X3 className="w-4 h-4" /> : <List className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant={multiSelectMode ? 'default' : 'outline'}
                    onClick={() => { setMultiSelectMode(!multiSelectMode); if (multiSelectMode) setSelectedIds(new Set()); }}
                    className="h-10 px-4 rounded-xl"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Select
                  </Button>
                </div>
              </div>

              {/* Clear filters */}
              {hasActiveSearch && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <Button variant="ghost" onClick={clearFilters} className="text-gray-500 hover:text-gray-700 text-sm">
                    <X className="w-4 h-4 mr-2" /> Clear all filters
                  </Button>
                </div>
              )}
            </Card>

            {/* Advanced filters */}
            {showFilters && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <AdvancedFilters
                  filters={filters}
                  onFilterChange={onFilterChange}
                  onClear={clearFilters}
                  categories={categories}
                />
              </div>
            )}

            {/* Bulk select toolbar */}
            {multiSelectMode && selectedIds.size > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-100 dark:bg-blue-800 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      {selectedIds.size} selected
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>Clear</Button>
                    <Button variant="destructive" size="sm" onClick={() => setShowBulkDeleteModal(true)}>
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </Button>
                  </div>
              </div>
            )}

            {/* Future transactions */}
            <FutureTransactionsCollapsible transactions={transactionsData || []} loading={transactionsLoading} />

            {/* Transaction list */}
            <Card className="overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="p-6">
                <TransactionList
                  transactions={transactions}
                  loading={transactionsLoading}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onDuplicate={onDuplicate}
                  selectedIds={selectedIds}
                  onSelect={onSelect}
                  multiSelectMode={multiSelectMode}
                />
                <LoadMoreSection
                  loadMoreRef={loadMoreRef}
                  isFetchingNextPage={isFetchingNextPage}
                  hasMore={hasMore}
                  count={transactions?.length || 0}
                  onLoadMore={loadMore}
                />
              </div>
            </Card>
          </div>
        )}

        {/* Recurring tab content */}
        {activeTab === 'recurring' && (
          <ModernRecurringTransactions
            onOpenRecurringManager={() => setShowRecurringManager(true)}
          />
        )}
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const ModernTransactions = () => {
  const { t } = useTranslation('transactions');
  const { formatCurrency } = useCurrency();
  const { addNotification } = useNotifications();
  const isMobile = useIsMobile();

  // ── UI state (declared before hooks that depend on them) ──
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // ── Modal state ──
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [showRecurringManager, setShowRecurringManager] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [modalMode, setModalMode] = useState('create');

  const loadMoreRef = useRef(null);
  const observerRef = useRef(null);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // ── Data hooks ──
  const {
    transactions: transactionsData,
    loading: transactionsLoading,
    refetch: refetchTransactions,
    hasNextPage: hasMore,
    fetchNextPage: loadMore,
    isFetchingNextPage,
  } = useTransactions({
    search: debouncedSearch,
    filters: {
      type: filters.type,
      category: filters.category,
      month: filters.month,
      search: debouncedSearch,
    },
    pageSize: 50,
  });

  const { deleteTransaction, freshBulkDelete } = useTransactionActions();

  const { categories } = useCategory();
  const { recurringTransactions: recurringTemplates } = useRecurringTransactions();

  // Auto-regeneration of recurring transactions
  const { isRegenerating } = useAutoRegeneration();

  // ── Client-side filtering (recurring + amount range — server can't filter these) ──
  const transactions = useMemo(() => {
    if (!transactionsData || !Array.isArray(transactionsData)) return [];
    let filtered = [...transactionsData];
    if (filters.recurring === 'recurring') {
      filtered = filtered.filter((t) => t.template_id || t.is_recurring);
    } else if (filters.recurring === 'oneTime') {
      filtered = filtered.filter((t) => !t.template_id && !t.is_recurring);
    }
    if (filters.amountMin) {
      const min = parseFloat(filters.amountMin);
      if (!isNaN(min)) filtered = filtered.filter((t) => Math.abs(parseFloat(t.amount)) >= min);
    }
    if (filters.amountMax) {
      const max = parseFloat(filters.amountMax);
      if (!isNaN(max)) filtered = filtered.filter((t) => Math.abs(parseFloat(t.amount)) <= max);
    }
    return filtered;
  }, [transactionsData, filters.recurring, filters.amountMin, filters.amountMax]);

  // ── Derived data ──
  const availableMonths = useMemo(() => {
    if (!Array.isArray(transactionsData)) return [];
    const set = new Set();
    transactionsData.forEach((tx) => {
      const d = new Date(tx.date);
      set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a)).map((mk) => {
      const [year, month] = mk.split('-');
      const d = new Date(parseInt(year), parseInt(month) - 1, 1);
      return {
        key: mk,
        label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        shortLabel: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      };
    });
  }, [transactionsData]);

  const summary = useMemo(() => {
    const txs = transactions || [];
    const totalIncome = txs.filter((t) => t.type === 'income').reduce((s, t) => s + Math.abs(t.amount), 0);
    const totalExpenses = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
    const recurringCount = txs.filter((t) => t.template_id || t.is_recurring).length;
    return {
      count: txs.length,
      totalIncome,
      totalExpenses,
      recurringCount,
      oneTimeCount: txs.length - recurringCount,
      recurringPercentage: txs.length > 0 ? (recurringCount / txs.length) * 100 : 0,
    };
  }, [transactions]);

  const recurringSummary = useMemo(() => {
    if (!recurringTemplates) return { totalCount: 0, activeCount: 0, totalMonthlyIncome: 0, totalMonthlyExpenses: 0 };
    const active = recurringTemplates.filter((t) => t.is_active);
    return {
      totalCount: recurringTemplates.length,
      activeCount: active.length,
      totalMonthlyIncome: active.filter((t) => t.type === 'income').reduce((s, t) => s + (Number(t.amount) || 0), 0),
      totalMonthlyExpenses: active.filter((t) => t.type === 'expense').reduce((s, t) => s + (Number(t.amount) || 0), 0),
    };
  }, [recurringTemplates]);

  // ── Handlers ──
  const handleTransactionSuccess = useCallback(() => {
    refetchTransactions();
    addNotification({ type: 'success', message: t('notifications.transactionUpdated', 'Transaction updated'), duration: 3000 });
  }, [refetchTransactions, addNotification, t]);

  const handleDeleteSuccess = useCallback(async (transactionId, options) => {
    try {
      await deleteTransaction(transactionId, options);
      refetchTransactions();
      addNotification({ type: 'success', message: t('notifications.transactionDeleted', 'Transaction deleted'), duration: 3000 });
    } catch (err) {
      addNotification({ type: 'error', message: err.message || 'Failed to delete', duration: 4000 });
    }
  }, [deleteTransaction, refetchTransactions, addNotification, t]);

  const onEdit = useCallback((transaction, mode = 'edit') => {
    setSelectedTransaction(transaction);
    setModalMode(mode);
    setShowEditModal(true);
  }, []);

  const onDelete = useCallback((transaction) => {
    setSelectedTransaction(transaction);
    setShowDeleteModal(true);
  }, []);

  const onDuplicate = useCallback((transaction) => {
    setSelectedTransaction(transaction);
    setModalMode('duplicate');
    setShowEditModal(true);
  }, []);

  const onSelect = useCallback((id, selected) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(id); else next.delete(id);
      return next;
    });
  }, []);

  const onFilterChange = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSearchQuery('');
  }, []);

  // ── IntersectionObserver for auto load-more ──
  useEffect(() => {
    observerRef.current?.disconnect();
    if (!hasMore || !loadMoreRef.current) return;
    observerRef.current = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && hasMore && !isFetchingNextPage) loadMore(); },
      { threshold: 0.1, rootMargin: '100px' },
    );
    observerRef.current.observe(loadMoreRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, isFetchingNextPage, loadMore]);

  // ── Listen for add transaction event from bottom nav / floating button ──
  useEffect(() => {
    const onAdd = (e) => {
      setModalMode('create');
      setSelectedTransaction(null);
      setShowAddTransaction(true);
    };
    window.addEventListener('transaction:add', onAdd);
    return () => window.removeEventListener('transaction:add', onAdd);
  }, []);

  // ── Shared props ──
  const sharedProps = {
    activeTab, setActiveTab,
    searchQuery, setSearchQuery,
    filters, onFilterChange, clearFilters,
    showFilters, setShowFilters,
    categories, availableMonths,
    transactions, transactionsData, transactionsLoading,
    loadMoreRef, isFetchingNextPage, hasMore, loadMore,
    recurringSummary, summary, formatCurrency,
    onEdit, onDelete, onDuplicate,
    selectedIds, onSelect,
    multiSelectMode, setMultiSelectMode, setSelectedIds,
    setShowBulkDeleteModal,
    viewMode, setViewMode,
    isRegenerating,
    setShowRecurringManager,
  };

  return (
    <>
      {isMobile
        ? <MobileTransactions {...sharedProps} />
        : <DesktopTransactions {...sharedProps} />
      }

      {/* Modals */}
      <AddTransactionModal
        isOpen={showAddTransaction}
        onClose={() => setShowAddTransaction(false)}
        onSuccess={handleTransactionSuccess}
      />

      <EditTransactionModal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedTransaction(null); }}
        onSuccess={handleTransactionSuccess}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        transaction={selectedTransaction}
        mode={modalMode}
      />

      <RecurringSetupModal
        isOpen={showRecurringModal}
        onClose={() => { setShowRecurringModal(false); setSelectedTransaction(null); }}
        onSuccess={handleTransactionSuccess}
        initialData={selectedTransaction}
        mode={modalMode}
      />

      {showDeleteModal && selectedTransaction && (
        <DeleteTransaction
          isOpen={showDeleteModal}
          transaction={selectedTransaction}
          onClose={() => { setShowDeleteModal(false); setSelectedTransaction(null); }}
          onSuccess={handleDeleteSuccess}
        />
      )}

      <ModernRecurringManagerPanel
        isOpen={showRecurringManager}
        onClose={() => setShowRecurringManager(false)}
      />

      <BulkDeleteModal
        isOpen={showBulkDeleteModal}
        count={selectedIds.size}
        onClose={() => setShowBulkDeleteModal(false)}
        onConfirm={async () => {
            const idsToDelete = Array.from(selectedIds);
            try {
              await freshBulkDelete(idsToDelete);
              setSelectedIds(new Set());
              setShowBulkDeleteModal(false);
              addNotification({ type: 'success', message: `Deleted ${idsToDelete.length} transactions`, duration: 4000 });
            } catch (err) {
              addNotification({ type: 'error', message: err.message || 'Failed to delete', duration: 5000 });
            }
          }}
        />

      <FloatingAddTransactionButton onClick={() => setShowAddTransaction(true)} />
    </>
  );
};

export default ModernTransactions;
