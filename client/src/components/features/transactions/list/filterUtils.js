/**
 * Shared transaction filter constants and helpers.
 * Used by ModernTransactions (page state) and AdvancedFilters (UI).
 */

export const DEFAULT_FILTERS = {
  category: 'all',
  type: 'all',
  recurring: 'all',
  amountMin: '',
  amountMax: '',
  sortBy: 'date',
  sortOrder: 'desc',
  month: 'all',
};

export const countActiveFilters = (filters) =>
  [
    filters.type !== 'all',
    filters.category !== 'all',
    filters.recurring !== 'all',
    filters.amountMin !== '',
    filters.amountMax !== '',
  ].filter(Boolean).length;
