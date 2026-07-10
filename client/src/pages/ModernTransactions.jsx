/**
 * ModernTransactions — transactions management page.
 * Uses useIsMobile() to render separate mobile and desktop layouts.
 * All data hooks and state are shared; only layout differs.
 *
 * Composition only — the visual pieces live in
 * components/features/transactions/list/:
 *   SourceFilterChips · TransactionList · StatsRow · BulkDeleteModal ·
 *   LoadMoreSection · AdvancedFilters
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Search, Filter, X, CheckCircle, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { useTranslation, useCurrency } from '../stores';
import { useTransactions } from '../hooks/useTransactions';
import { useDebounce } from '../hooks/useDebounce';
import { useTransactionActions } from '../hooks/useTransactionActions';
import { useIsMobile } from '../hooks/useIsMobile';
import { Button, Input, Card, PageSkeleton } from '../components/ui';
import { cn } from '../utils/helpers';
import apiClient from '../api/client';
import { api } from '../api';

import QuickMonthSelector from '../components/features/transactions/QuickMonthSelector';
import EditTransactionModal from '../components/features/transactions/modals/EditTransactionModal';
import DeleteTransaction from '../components/features/transactions/DeleteTransaction';
import FloatingAddTransactionButton from '../components/common/FloatingAddTransactionButton';
import BottomSheet from '../components/common/BottomSheet';

import { DEFAULT_FILTERS, countActiveFilters } from '../components/features/transactions/list/filterUtils';
import AdvancedFilters from '../components/features/transactions/list/AdvancedFilters';
import SourceFilterChips from '../components/features/transactions/list/SourceFilterChips';
import TransactionList from '../components/features/transactions/list/TransactionList';
import StatsRow from '../components/features/transactions/list/StatsRow';
import BulkDeleteModal from '../components/features/transactions/list/BulkDeleteModal';
import LoadMoreSection from '../components/features/transactions/list/LoadMoreSection';

// ─── Mobile layout ────────────────────────────────────────────────────────────

const MobileTransactions = ({
  searchQuery, setSearchQuery,
  sourceFilter, setSourceFilter,
  filters, onFilterChange, clearFilters,
  availableMonths,
  transactions, syncedSources, transactionsLoading,
  loadMoreRef, isFetchingNextPage, hasMore, loadMore,
  onEdit, onDelete, onDuplicate,
  lang,
}) => {
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const { t } = useTranslation('transactions');
  const activeCount = countActiveFilters(filters);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* ONE sticky glass control block — no separate page header (the
          bottom nav already tells you where you are; the old logo+title
          row was 48px of dead weight) */}
      <div className="glass-card sticky top-0 z-20 rounded-none border-x-0 border-t-0">
        {/* Search + filter + month */}
        <div className="px-3 pt-3 flex gap-2">
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
              <span className="absolute -top-1 -end-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
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
        <div className="px-3 py-2">
          <SourceFilterChips
            syncedSources={syncedSources}
            sourceFilter={sourceFilter}
            setSourceFilter={setSourceFilter}
            t={t}
            lang={lang}
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-3 py-3 pb-28">
        <div className="space-y-3">
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
      </div>

      {/* Filter bottom sheet */}
      <BottomSheet isOpen={showFilterSheet} onClose={() => setShowFilterSheet(false)} title={t('actions.filter') || 'Filters'}>
        <AdvancedFilters
          filters={filters}
          onFilterChange={onFilterChange}
          onClear={() => { clearFilters(); setShowFilterSheet(false); }}
        />
      </BottomSheet>
    </div>
  );
};

// ─── Desktop layout ───────────────────────────────────────────────────────────

const DesktopTransactions = ({
  searchQuery, setSearchQuery,
  sourceFilter, setSourceFilter,
  filters, onFilterChange, clearFilters,
  showFilters, setShowFilters,
  availableMonths,
  transactions, syncedSources, transactionsLoading,
  loadMoreRef, isFetchingNextPage, hasMore, loadMore,
  summary,
  formatCurrency,
  onEdit, onDelete, onDuplicate,
  selectedIds, onSelect, multiSelectMode, setMultiSelectMode, setSelectedIds,
  setShowBulkDeleteModal,
  lang,
}) => {
  const { t } = useTranslation('transactions');
  const activeCount = countActiveFilters(filters);
  const hasActiveSearch = Boolean(searchQuery) || activeCount > 0 || filters.month !== 'all' || sourceFilter !== 'all';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-6 pb-0">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title') || 'Transactions'}</h1>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 space-y-5">
        {/* Stats */}
        <StatsRow summary={summary} formatCurrency={formatCurrency} />

        <div className="space-y-4">
          {/* Search + controls bar */}
          <Card className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder={t('search.placeholder') || 'Search transactions...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-10 h-10 rounded-xl"
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
                  <Filter className="w-4 h-4 me-2" />
                  {t('actions.filter') || 'Filters'}
                  {activeCount > 0 && (
                    <span className="absolute -top-1.5 -end-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {activeCount}
                    </span>
                  )}
                </Button>
                <Button
                  variant={multiSelectMode ? 'default' : 'outline'}
                  onClick={() => { setMultiSelectMode(!multiSelectMode); if (multiSelectMode) setSelectedIds(new Set()); }}
                  className="h-10 px-4 rounded-xl"
                >
                  <CheckCircle className="w-4 h-4 me-2" />
                  {t('actions.select') || 'Select'}
                </Button>
              </div>
            </div>

            {/* Source chips — the bank-aware quick filter */}
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <SourceFilterChips
                syncedSources={syncedSources}
                sourceFilter={sourceFilter}
                setSourceFilter={setSourceFilter}
                t={t}
                lang={lang}
              />
            </div>

            {/* Clear filters */}
            {hasActiveSearch && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <Button variant="ghost" onClick={() => { clearFilters(); setSourceFilter('all'); }} className="text-gray-500 hover:text-gray-700 text-sm">
                  <X className="w-4 h-4 me-2" /> {t('actions.clearFilters') || 'Clear all filters'}
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
                    <Trash2 className="w-4 h-4 me-2" /> {t('actions.delete') || 'Delete'}
                  </Button>
                </div>
            </div>
          )}

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
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const ModernTransactions = () => {
  const { t, isRTL, currentLanguage } = useTranslation('transactions');
  const { formatCurrency } = useCurrency();
  const isMobile = useIsMobile();

  // ── UI state (declared before hooks that depend on them) ──
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sourceFilter, setSourceFilter] = useState('all'); // all | manual | <bank_source>[::account]
  const [showFilters, setShowFilters] = useState(false);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // ── Modal state ── (Add lives in the global UnifiedTransactionActions —
  // the FAB dispatches 'transaction:add'; this page only owns edit/delete)
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [modalMode, setModalMode] = useState('create');

  const loadMoreRef = useRef(null);
  const observerRef = useRef(null);

  const debouncedSearch = useDebounce(searchQuery, 300);
  // Amount inputs are typed — debounce so we don't refetch per keystroke.
  const debouncedAmountMin = useDebounce(filters.amountMin, 400);
  const debouncedAmountMax = useDebounce(filters.amountMax, 400);

  const [selectedSource, selectedAccount] = sourceFilter.split('::');

  // ── Data hooks ── (source/account/amount are server-side filters now, so
  // the list, the stats tiles and pagination all describe the same set)
  const {
    transactions,
    summary: serverSummary,
    loading: transactionsLoading,
    refetch: refetchTransactions,
    hasNextPage: hasMore,
    fetchNextPage: loadMore,
    isFetchingNextPage,
  } = useTransactions({
    search: debouncedSearch,
    filters: {
      type: filters.type,
      month: filters.month,
      search: debouncedSearch,
      source: selectedSource !== 'all' ? selectedSource : null,
      account: selectedAccount || null,
      amountMin: debouncedAmountMin,
      amountMax: debouncedAmountMax,
    },
    pageSize: 50,
  });

  const { deleteTransaction, freshBulkDelete } = useTransactionActions();

  // Synced sources (+ their accounts) for the filter chips — from
  // /bank-sync/stats, shared with the dashboard's cache key.
  const { data: syncedSources = [] } = useQuery({
    queryKey: ['bankSyncStats'],
    queryFn: () => apiClient.get('/bank-sync/stats').then((r) => r.data.sources || []),
    staleTime: 5 * 60_000,
  });

  // ── Derived data ──
  // Month options from the server (all months with data), not from whichever
  // pages happen to be loaded.
  const { data: monthKeys = [] } = useQuery({
    queryKey: ['transactionMonths'],
    queryFn: async () => {
      const res = await api.transactions.getMonths();
      return res.success ? res.data?.months || [] : [];
    },
    staleTime: 5 * 60_000,
  });
  const availableMonths = useMemo(() => {
    const locale = isRTL ? 'he-IL' : 'en-US';
    return monthKeys.map((mk) => {
      const [year, month] = mk.split('-');
      const d = new Date(parseInt(year), parseInt(month) - 1, 1);
      return {
        key: mk,
        label: d.toLocaleDateString(locale, { month: 'long', year: 'numeric' }),
        shortLabel: d.toLocaleDateString(locale, { month: 'short', year: 'numeric' }),
      };
    });
  }, [monthKeys, isRTL]);

  const summary = useMemo(() => {
    if (serverSummary) {
      return {
        count: serverSummary.count ?? 0,
        totalIncome: serverSummary.totalIncome ?? 0,
        totalExpenses: serverSummary.totalExpenses ?? 0,
        net: serverSummary.netAmount ?? (serverSummary.totalIncome ?? 0) - (serverSummary.totalExpenses ?? 0),
      };
    }
    // Fallback (older server / offline cache): compute from loaded rows.
    const txs = transactions || [];
    const totalIncome = txs.filter((t) => t.type === 'income').reduce((s, t) => s + Math.abs(t.amount), 0);
    const totalExpenses = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
    return { count: txs.length, totalIncome, totalExpenses, net: totalIncome - totalExpenses };
  }, [serverSummary, transactions]);

  // ── Handlers ──
  // Create/update/delete mutations (useTransactions) show their own toasts,
  // so these just refetch the list.
  const handleTransactionSuccess = useCallback(() => {
    refetchTransactions();
  }, [refetchTransactions]);

  const handleDeleteSuccess = useCallback(async (transactionId, options) => {
    try {
      await deleteTransaction(transactionId, options);
      refetchTransactions();
    } catch (err) {
      // mutation error toast is handled by the mutation itself
    }
  }, [deleteTransaction, refetchTransactions]);

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
    searchQuery, setSearchQuery,
    sourceFilter, setSourceFilter,
    filters, onFilterChange, clearFilters,
    showFilters, setShowFilters,
    availableMonths,
    transactions, syncedSources, transactionsLoading,
    loadMoreRef, isFetchingNextPage, hasMore, loadMore,
    summary, formatCurrency,
    onEdit, onDelete, onDuplicate,
    selectedIds, onSelect,
    multiSelectMode, setMultiSelectMode, setSelectedIds,
    setShowBulkDeleteModal,
    lang: currentLanguage,
  };

  // Show skeleton on first load before any data has arrived
  if (transactionsLoading && (!transactions || transactions.length === 0)) {
    return <PageSkeleton page="transactions" />;
  }

  return (
    <>
      {isMobile
        ? <MobileTransactions {...sharedProps} />
        : <DesktopTransactions {...sharedProps} />
      }

      {/* Modals */}
      <EditTransactionModal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedTransaction(null); }}
        onSuccess={handleTransactionSuccess}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        transaction={selectedTransaction}
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

      <BulkDeleteModal
        isOpen={showBulkDeleteModal}
        count={selectedIds.size}
        onClose={() => setShowBulkDeleteModal(false)}
        onConfirm={async () => {
            const idsToDelete = Array.from(selectedIds);
            try {
              await freshBulkDelete(idsToDelete); // toasts its own result
              setSelectedIds(new Set());
              setShowBulkDeleteModal(false);
            } catch (err) {
              // mutation error toast is handled by freshBulkDelete
            }
          }}
        />

      {/* No onClick — the FAB dispatches 'transaction:add', handled by the
          global UnifiedTransactionActions; it broadcasts 'transactions:refetch'
          on success, which this page already listens for. */}
      <FloatingAddTransactionButton />
    </>
  );
};

export default ModernTransactions;
