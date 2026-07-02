/**
 * AdvancedFilters — the filter panel for the transactions page
 * (type, category, recurring, amount range). Extracted from
 * ModernTransactions.jsx to keep the page focused on orchestration.
 */

import React from 'react';
import { ArrowLeftRight, X, Layers, Repeat, DollarSign } from 'lucide-react';

import { useTranslation } from '../../../../stores';
import { Button, Input } from '../../../ui';
import { cn } from '../../../../utils/helpers';
import { countActiveFilters } from './filterUtils';

const AdvancedFilters = ({ filters, onFilterChange, onClear, categories }) => {
  const { t } = useTranslation();
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
            {t('filters.title', 'Filters')}
          </h3>
          {activeCount > 0 && (
            <p className="text-xs text-indigo-600 dark:text-indigo-400">
              {t('filter.activeCount', { count: activeCount }) || `${activeCount} active`}
            </p>
          )}
        </div>
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear}
            className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs">
            <X className="w-3 h-3 mr-1" /> {t('actions.clearFilters') || 'Clear'}
          </Button>
        )}
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        {/* Type — button group */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
            <ArrowLeftRight className="w-3 h-3" />
            {t('filters.type.label', 'Type')}
          </label>
          <div className="flex rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-600 divide-x divide-gray-200 dark:divide-gray-600">
            {[
              { value: 'all',     label: t('filters.type.all', 'All') },
              { value: 'income',  label: t('transactions.types.income', 'Income') },
              { value: 'expense', label: t('transactions.types.expense', 'Expense') },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => onFilterChange({ type: value })}
                className={cn(
                  'flex-1 py-2 text-xs font-semibold transition-colors',
                  filters.type === value
                    ? value === 'income'
                      ? 'bg-green-500 text-white border-green-500'
                      : value === 'expense'
                        ? 'bg-red-500 text-white border-red-500'
                        : 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                )}
              >
                {label}
              </button>
            ))}
          </div>
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

        {/* Recurring — button group */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
            <Repeat className="w-3 h-3" />
            {t('filters.recurring.label', 'Schedule')}
          </label>
          <div className="flex rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-600 divide-x divide-gray-200 dark:divide-gray-600">
            {[
              { value: 'all',       label: t('filters.recurring.all', 'All') },
              { value: 'recurring', label: t('filters.recurring.recurring', 'Recurring') },
              { value: 'oneTime',   label: t('filters.recurring.oneTime', 'One-time') },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => onFilterChange({ recurring: value })}
                className={cn(
                  'flex-1 py-2 text-xs font-semibold transition-colors',
                  filters.recurring === value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                )}
              >
                {label}
              </button>
            ))}
          </div>
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

export default AdvancedFilters;
