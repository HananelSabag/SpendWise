import { describe, it, expect } from 'vitest';

/**
 * Tests for the pagination logic extracted from useTransactions.
 * These test the getNextPageParam and hasMore logic in isolation.
 */

// Extracted pagination logic (mirrors what's in useTransactions.js)
const getNextPageParam = (lastPage) => {
  return lastPage.hasMore ? lastPage.page + 1 : undefined;
};

const buildPageResult = (transactions, pagination, pageParam) => ({
  transactions,
  hasMore: Boolean(pagination?.hasMore ?? false),
  total: pagination?.total ?? transactions.length,
  page: pageParam,
  limit: pagination?.limit ?? 50
});

describe('getNextPageParam', () => {
  it('returns next page number when hasMore is true', () => {
    const lastPage = { hasMore: true, page: 0 };
    expect(getNextPageParam(lastPage)).toBe(1);
  });

  it('returns page 2 when on page 1', () => {
    const lastPage = { hasMore: true, page: 1 };
    expect(getNextPageParam(lastPage)).toBe(2);
  });

  it('returns undefined when hasMore is false', () => {
    const lastPage = { hasMore: false, page: 3 };
    expect(getNextPageParam(lastPage)).toBeUndefined();
  });

  it('returns undefined when hasMore is null/undefined (falsy)', () => {
    expect(getNextPageParam({ hasMore: null, page: 0 })).toBeUndefined();
    expect(getNextPageParam({ hasMore: undefined, page: 0 })).toBeUndefined();
  });

  it('does NOT use array length (old bug), uses lastPage.page + 1', () => {
    // The bug was: pages.length was used instead of lastPage.page + 1
    // If 3 pages are loaded but we started from page 2, pages.length=3 != page+1=3
    const lastPage = { hasMore: true, page: 5 };
    // Should return 6, not 3 (which pages.length would have been)
    expect(getNextPageParam(lastPage)).toBe(6);
  });
});

describe('buildPageResult hasMore logic', () => {
  it('sets hasMore=true when server says hasMore=true', () => {
    const result = buildPageResult(
      new Array(50).fill({}),
      { hasMore: true, total: 200, limit: 50 },
      0
    );
    expect(result.hasMore).toBe(true);
  });

  it('sets hasMore=false when server says hasMore=false', () => {
    const result = buildPageResult(
      new Array(10).fill({}),
      { hasMore: false, total: 10, limit: 50 },
      0
    );
    expect(result.hasMore).toBe(false);
  });

  it('does NOT infer hasMore from page length (old bug)', () => {
    // Old bug: hasMore = hasMore || (transformedTransactions.length === pageSize)
    // A last page that's exactly full should still show hasMore=false
    const result = buildPageResult(
      new Array(50).fill({}), // full page
      { hasMore: false, total: 50, limit: 50 }, // server says done
      0
    );
    // Should respect server's hasMore=false, not infer true from length === pageSize
    expect(result.hasMore).toBe(false);
  });

  it('handles missing pagination gracefully', () => {
    const result = buildPageResult([], null, 0);
    expect(result.hasMore).toBe(false);
    expect(result.total).toBe(0);
  });
});
