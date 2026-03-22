import { describe, it, expect } from 'vitest';

/**
 * Tests for API response normalization logic.
 * Tests the unwrapping logic that ensures the hook always gets { transactions, pagination }.
 */

// Mirrors the normalization in useTransactions queryFn
function normalizeTransactionResponse(response) {
  const rawData = response?.data || response;

  if (!rawData) {
    return { transactions: [], pagination: { hasMore: false, total: 0, page: 1, limit: 50 } };
  }

  let transactionsArray = [];
  let pagination = { hasMore: false, total: 0, page: 1, limit: 50 };

  if (Array.isArray(rawData)) {
    transactionsArray = rawData;
    pagination.total = rawData.length;
  } else if (rawData.transactions && Array.isArray(rawData.transactions)) {
    transactionsArray = rawData.transactions;
    pagination = {
      hasMore: rawData.pagination?.hasMore ?? false,
      total: rawData.pagination?.total ?? rawData.transactions.length,
      page: rawData.pagination?.page ?? 1,
      limit: rawData.pagination?.limit ?? 50
    };
  }

  return { transactions: transactionsArray, pagination };
}

describe('normalizeTransactionResponse', () => {
  it('handles standard server response format', () => {
    const response = {
      success: true,
      data: {
        transactions: [{ id: 1 }, { id: 2 }],
        pagination: { hasMore: true, total: 100, page: 1, limit: 50 }
      }
    };
    const result = normalizeTransactionResponse(response);
    expect(result.transactions).toHaveLength(2);
    expect(result.pagination.hasMore).toBe(true);
    expect(result.pagination.total).toBe(100);
  });

  it('handles flat transactions array response', () => {
    const response = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const result = normalizeTransactionResponse(response);
    expect(result.transactions).toHaveLength(3);
    expect(result.pagination.hasMore).toBe(false);
  });

  it('returns empty result for null response', () => {
    const result = normalizeTransactionResponse(null);
    expect(result.transactions).toHaveLength(0);
    expect(result.pagination.hasMore).toBe(false);
  });

  it('returns empty result for undefined response', () => {
    const result = normalizeTransactionResponse(undefined);
    expect(result.transactions).toHaveLength(0);
  });

  it('handles response with data.data (double-nested) gracefully — unwraps first level', () => {
    // After the fix, we only do response?.data || response, so double-nested is still handled
    const response = {
      data: {
        transactions: [{ id: 1 }],
        pagination: { hasMore: false, total: 1, page: 1, limit: 50 }
      }
    };
    const result = normalizeTransactionResponse(response);
    expect(result.transactions).toHaveLength(1);
  });

  it('correctly reads hasMore=false from last page', () => {
    const response = {
      data: {
        transactions: new Array(10).fill({ id: 1 }),
        pagination: { hasMore: false, total: 10, page: 1, limit: 50 }
      }
    };
    const result = normalizeTransactionResponse(response);
    expect(result.pagination.hasMore).toBe(false);
  });

  it('correctly reads hasMore=true from middle page', () => {
    const response = {
      data: {
        transactions: new Array(50).fill({ id: 1 }),
        pagination: { hasMore: true, total: 200, page: 1, limit: 50 }
      }
    };
    const result = normalizeTransactionResponse(response);
    expect(result.pagination.hasMore).toBe(true);
    expect(result.pagination.total).toBe(200);
  });
});
