/**
 * categoryHelper tests
 * Tests findOrCreateCategory — the unified category lookup/creation logic.
 */

jest.mock('../config/db', () => ({ query: jest.fn() }));
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));

const db = require('../config/db');
const { findOrCreateCategory } = require('../utils/categoryHelper');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('findOrCreateCategory — categoryId provided', () => {
  it('returns categoryId directly without any DB query', async () => {
    const result = await findOrCreateCategory(1, 42, null);
    expect(result).toBe(42);
    expect(db.query).not.toHaveBeenCalled();
  });

  it('ignores categoryName when categoryId is present', async () => {
    const result = await findOrCreateCategory(1, 7, 'Food');
    expect(result).toBe(7);
    expect(db.query).not.toHaveBeenCalled();
  });
});

describe('findOrCreateCategory — exact name match', () => {
  it('returns existing category ID on exact match', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 99 }] }); // exact match

    const result = await findOrCreateCategory(1, null, 'Food');
    expect(result).toBe(99);
    expect(db.query).toHaveBeenCalledTimes(1);
  });
});

describe('findOrCreateCategory — ILIKE fallback', () => {
  it('uses ILIKE when exact match returns empty', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })        // exact match: no result
      .mockResolvedValueOnce({ rows: [{ id: 77 }] }); // ILIKE: found

    const result = await findOrCreateCategory(1, null, 'food');
    expect(result).toBe(77);
    expect(db.query).toHaveBeenCalledTimes(2);
  });
});

describe('findOrCreateCategory — creates new category', () => {
  it('inserts a new category when neither exact nor ILIKE find a match', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })         // exact: not found
      .mockResolvedValueOnce({ rows: [] })         // ilike: not found
      .mockResolvedValueOnce({ rows: [{ id: 200 }] }); // INSERT RETURNING

    const result = await findOrCreateCategory(1, null, 'Vacation');
    expect(result).toBe(200);
    expect(db.query).toHaveBeenCalledTimes(3);
    // Confirm the third call was an INSERT
    const insertCall = db.query.mock.calls[2][0];
    expect(insertCall).toMatch(/INSERT INTO categories/i);
  });
});

describe('findOrCreateCategory — no id, no name (fallback to General)', () => {
  it('returns the General category ID when nothing is provided', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // General found

    const result = await findOrCreateCategory(1, null, null);
    expect(result).toBe(1);
    // Only one query: looking up General
    expect(db.query).toHaveBeenCalledTimes(1);
    expect(db.query.mock.calls[0][0]).toMatch(/General/);
  });

  it('returns null when General category does not exist', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const result = await findOrCreateCategory(1, null, null);
    expect(result).toBeNull();
  });
});
