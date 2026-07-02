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
  DollarSign, Landmark,
} from 'lucide-react';

import { useTranslation, useCurrency, useNotifications } from '../stores';
import { useTransactions } from '../hooks/useTransactions';
import { useDebounce } from '../hooks/useDebounce';
import { useTransactionActions } from '../hooks/useTransactionActions';
import { useCategory } from '../hooks/useCategory';
import { useRecurringTransactions } from '../hooks/useRecurringTransactions';
import { useIsMobile } from '../hooks/useIsMobile';
import { Button, Input, Card, LoadingSpinner, Badge, Modal, PageSkeleton } from '../components/ui';
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

import { DEFAULT_FILTERS, countActiveFilters } from '../components/features/transactions/list/filterUtils';
import AdvancedFilters from '../components/features/transactions/list/AdvancedFilters';
import { MonthHeader, DayHeader } from '../components/features/transactions/list/ListHeaders';

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
          {t('emptyStates.noTransactions', 'No transactions found')}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
          {t('emptyStates.noResultsDesc', 'Try adjusting your filters or add a new transaction')}
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
  const { t } = useTranslation('transactions');
  const items = activeTab === 'all'
    ? [
      { label: t('title') || 'Transactions', value: summary.count },
      { label: t('types.income') || 'Income', value: formatCurrency(summary.totalIncome), color: 'green' },
      { label: t('types.expense') || 'Expenses', value: formatCurrency(summary.totalExpenses), color: 'red' },
      { label: t('labels.recurring') || 'Recurring', value: `${summary.recurringCount} (${Math.round(summary.recurringPercentage)}%)`, color: 'purple' },
    ]
    : [
      { label: t('recurring.templates') || 'Templates', value: recurringSummary.totalCount },
      { label: t('recurring.active') || 'Active', value: recurringSummary.activeCount, color: 'green' },
      { label: t('recurring.monthlyIncome') || 'Monthly In', value: formatCurrency(recurringSummary.totalMonthlyIncome), color: 'green' },
      { label: t('recurring.monthlyExpenses') || 'Monthly Out', value: formatCurrency(recurringSummary.totalMonthlyExpenses), color: 'red' },
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

const BulkDeleteModal = ({ isOpen, count, onClose, onConfirm }) => {
  const { t } = useTranslation('transactions');
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('bulkDelete.title') || 'Delete Transactions'} size="sm">
      <div className="p-4">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          {t('selection.count', { count }) || `${count} selected`}
        </p>
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
          <div className="flex items-center text-red-800 dark:text-red-200 gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <p className="text-sm">{t('bulkDelete.cannotUndo') || 'This action cannot be undone.'}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">{t('actions.cancel') || 'Cancel'}</Button>
          <Button variant="destructive" onClick={onConfirm} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
            <Trash2 className="w-4 h-4 mr-2" /> {t('bulkDelete.deleteAll') || 'Delete All'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ─── Load more section ────────────────────────────────────────────────────────

const LoadMoreSection = ({ loadMoreRef, isFetchingNextPage, hasMore, count, onLoadMore }) => {
  const { t } = useTranslation('transactions');
  return (
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
            {t('loadMore') || 'Load More'}
          </Button>
        </div>
      ) : count > 0 ? (
        <div className="flex items-center justify-center gap-2 py-6 text-gray-500 dark:text-gray-400">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-sm">{t('allLoaded', { count }) || `All ${count} transactions loaded`}</span>
        </div>
      ) : null}
    </div>
  );
};

// ─── Mobile layout ────────────────────────────────────────────────────────────

const MobileTransactions = ({
  activeTab, setActiveTab,
  searchQuery, setSearchQuery,
  sourceFilter, setSourceFilter,
  filters, onFilterChange, clearFilters,
  categories, availableMonths,
  transactions, transactionsData, transactionsLoading,
  loadMoreRef, isFetchingNextPage, hasMore, loadMore,
  onEdit, onDelete, onDuplicate,
  setShowRecurringManager,
}) => {
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const { t } = useTranslation('transactions');
  const activeCount = countActiveFilters(filters);

  // Bank-aware source chips: everything / from the bank / entered manually
  const sourceChips = [
    { key: 'all',    label: t('source.all', 'All') },
    { key: 'bank',   label: t('source.bank', 'Bank'), icon: Landmark },
    { key: 'manual', label: t('source.manual', 'Manual') },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* ONE sticky glass control block — no separate page header (the
          bottom nav already tells you where you are; the old logo+title
          row was 48px of dead weight) */}
      <div className="glass-card sticky top-0 z-20 rounded-none border-x-0 border-t-0">
        {/* Tab bar — quiet segmented control */}
        <div className="px-2 pt-2">
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-gray-100/80 dark:bg-gray-800/80">
            <button
              onClick={() => setActiveTab('all')}
              className={cn('py-1.5 rounded-lg text-sm font-medium transition-all',
                activeTab === 'all'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400')}
            >
              <List className="w-4 h-4 inline me-1.5" />
              {t('tabs.all') || 'All'}
            </button>
            <button
              onClick={() => setActiveTab('recurring')}
              className={cn('py-1.5 rounded-lg text-sm font-medium transition-all',
                activeTab === 'recurring'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400')}
            >
              <Repeat className="w-4 h-4 inline me-1.5" />
              {t('tabs.recurring') || 'Recurring'}
            </button>
          </div>
        </div>

        {activeTab === 'all' && (
          <>
            {/* Search + filter + month */}
            <div className="px-3 pt-2 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('actions.search') || 'Search...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full ps-9 pe-3 py-2 text-sm border border-gray-200/70 dark:border-gray-700/70 rounded-xl bg-white/60 dark:bg-gray-800/60 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-400"
                />
              </div>
              <button
                onClick={() => setShowFilterSheet(true)}
                className={cn('relative px-3 py-2 rounded-xl border text-sm font-medium transition-colors',
                  activeCount > 0
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-gray-200/70 dark:border-gray-700/70 text-gray-500 dark:text-gray-400 bg-white/60 dark:bg-gray-800/60')}
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

            {/* Source chips — the bank-aware quick filter */}
            <div className="px-3 py-2 flex gap-1.5">
              {sourceChips.map(({ key, label, icon: ChipIcon }) => (
                <button
                  key={key}
                  onClick={() => setSourceFilter(key)}
                  className={cn(
                    'flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors',
                    sourceFilter === key
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                      : 'bg-gray-100/80 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400',
                  )}
                >
                  {ChipIcon && <ChipIcon className="w-3 h-3" />}
                  {label}
                </button>
              ))}
            </div>
          </>
        )}
        {activeTab !== 'all' && <div className="pb-2" />}
      </div>

      {/* Content */}
      <div className="px-3 py-3 pb-28">
        {activeTab === 'all' ? (
          <div className="space-y-3">
            <FutureTransactionsCollapsible transactions={transactionsData || []} loading={transactionsLoading} />

            <TransactionList
              transactions={transactions}
              loading={transactionsLoading}
              onEdit={onEdit}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
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
      <BottomSheet isOpen={showFilterSheet} onClose={() => setShowFilterSheet(false)} title={t('actions.filter') || 'Filters'}>
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
  const { t } = useTranslation('transactions');
  const activeCount = countActiveFilters(filters);
  const hasActiveSearch = searchQuery || Object.values(filters).some((f) => f !== 'all' && f !== '');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-6 pb-0 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title') || 'Transactions'}</h1>
        {isRegenerating && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            {t('autoGenerating') || 'Auto-generating...'}
          </div>
        )}
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
            <List className="w-4 h-4" /> {t('tabs.all') || 'All Transactions'}
          </button>
          <button
            onClick={() => setActiveTab('recurring')}
            className={cn('rounded-xl px-4 py-2.5 text-sm font-medium transition-all flex items-center justify-center gap-2',
              activeTab === 'recurring'
                ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700')}
          >
            <Repeat className="w-4 h-4" /> {t('tabs.recurring') || 'Recurring'}
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
                    placeholder={t('search.placeholder') || 'Search transactions...'}
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
                    {t('actions.filter') || 'Filters'}
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
                    {t('actions.select') || 'Select'}
                  </Button>
                </div>
              </div>

              {/* Clear filters */}
              {hasActiveSearch && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <Button variant="ghost" onClick={clearFilters} className="text-gray-500 hover:text-gray-700 text-sm">
                    <X className="w-4 h-4 mr-2" /> {t('actions.clearFilters') || 'Clear all filters'}
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
                      {t('selection.count', { count: selectedIds.size }) || `${selectedIds.size} selected`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>{t('clearSelection') || 'Clear'}</Button>
                    <Button variant="destructive" size="sm" onClick={() => setShowBulkDeleteModal(true)}>
                      <Trash2 className="w-4 h-4 mr-2" /> {t('actions.delete') || 'Delete'}
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
  const [sourceFilter, setSourceFilter] = useState('all'); // all | bank | manual
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

  // ── Client-side filtering (recurring + amount range + source — server can't filter these) ──
  const transactions = useMemo(() => {
    if (!transactionsData || !Array.isArray(transactionsData)) return [];
    let filtered = [...transactionsData];
    if (filters.recurring === 'recurring') {
      filtered = filtered.filter((t) => t.template_id || t.is_recurring);
    } else if (filters.recurring === 'oneTime') {
      filtered = filtered.filter((t) => !t.template_id && !t.is_recurring);
    }
    // Bank-aware source filter: bank-imported vs manually entered
    if (sourceFilter === 'bank') {
      filtered = filtered.filter((t) => t.bank_source);
    } else if (sourceFilter === 'manual') {
      filtered = filtered.filter((t) => !t.bank_source);
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
  }, [transactionsData, filters.recurring, filters.amountMin, filters.amountMax, sourceFilter]);

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

  // ── 'transaction:add' on mobile is handled globally by UnifiedTransactionActions.
  // Desktop FAB below uses direct onClick. After UnifiedTransactionActions closes its
  // modal it dispatches 'transactions:refetch' so we stay in sync.
  useEffect(() => {
    const onRefetch = () => refetchTransactions();
    window.addEventListener('transactions:refetch', onRefetch);
    return () => window.removeEventListener('transactions:refetch', onRefetch);
  }, [refetchTransactions]);

  // ── Shared props ──
  const sharedProps = {
    activeTab, setActiveTab,
    searchQuery, setSearchQuery,
    sourceFilter, setSourceFilter,
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

  // Show skeleton on first load before any data has arrived
  if (transactionsLoading && (!transactionsData || transactionsData.length === 0)) {
    return <PageSkeleton page="transactions" />;
  }

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
