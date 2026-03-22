/**
 * Server-side pagination logic tests.
 * Tests the hasMore calculation used in transactionController.getTransactions
 */

// Mirrors the logic in transactionController.js
function calculatePagination(page, limit, totalCount, returnedCount) {
  const offset = (page - 1) * limit;
  const hasMore = (offset + returnedCount) < totalCount;
  return {
    page,
    limit,
    offset,
    total: totalCount,
    hasMore,
    currentPageCount: returnedCount
  };
}

describe('Pagination hasMore calculation', () => {
  it('hasMore=true when more records exist after current page', () => {
    const result = calculatePagination(1, 50, 200, 50);
    expect(result.hasMore).toBe(true);
  });

  it('hasMore=false on the last page', () => {
    const result = calculatePagination(4, 50, 200, 50);
    // page 4: offset=150, returned=50, total=200 → 150+50=200 = not less than 200 → false
    expect(result.hasMore).toBe(false);
  });

  it('hasMore=false when fewer items than limit returned (last page)', () => {
    const result = calculatePagination(3, 50, 110, 10);
    // offset=100, returned=10, total=110 → 110=110 → false
    expect(result.hasMore).toBe(false);
  });

  it('hasMore=false for empty result set', () => {
    const result = calculatePagination(1, 50, 0, 0);
    expect(result.hasMore).toBe(false);
  });

  it('hasMore=true for second page with more remaining', () => {
    const result = calculatePagination(2, 50, 200, 50);
    // offset=50, returned=50, total=200 → 100 < 200 → true
    expect(result.hasMore).toBe(true);
  });

  it('calculates correct offset for page 1', () => {
    const result = calculatePagination(1, 50, 100, 50);
    expect(result.offset).toBe(0);
  });

  it('calculates correct offset for page 3', () => {
    const result = calculatePagination(3, 50, 200, 50);
    expect(result.offset).toBe(100);
  });

  it('returns correct currentPageCount', () => {
    const result = calculatePagination(2, 50, 75, 25);
    expect(result.currentPageCount).toBe(25);
  });

  it('handles single item correctly', () => {
    const result = calculatePagination(1, 50, 1, 1);
    expect(result.hasMore).toBe(false);
    expect(result.total).toBe(1);
  });

  it('handles exactly one full page correctly', () => {
    const result = calculatePagination(1, 50, 50, 50);
    // offset=0, returned=50, total=50 → 50=50 → false
    expect(result.hasMore).toBe(false);
  });
});

describe('Pagination limit clamping', () => {
  function clampLimit(requestedLimit, max = 100, defaultLimit = 50) {
    const parsed = parseInt(requestedLimit, 10);
    if (isNaN(parsed) || parsed <= 0) return defaultLimit;
    return Math.min(parsed, max);
  }

  it('clamps limit to max of 100', () => {
    expect(clampLimit(500)).toBe(100);
    expect(clampLimit(1000)).toBe(100);
  });

  it('uses default limit for invalid input', () => {
    expect(clampLimit('abc')).toBe(50);
    expect(clampLimit(0)).toBe(50);
    expect(clampLimit(-5)).toBe(50);
  });

  it('accepts valid limits', () => {
    expect(clampLimit(10)).toBe(10);
    expect(clampLimit(100)).toBe(100);
    expect(clampLimit(50)).toBe(50);
  });
});
