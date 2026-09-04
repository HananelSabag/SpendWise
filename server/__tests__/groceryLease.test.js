jest.mock('../config/db', () => ({ query: jest.fn(), getClient: jest.fn() }));

const db = require('../config/db');
const { GroceryList, LEASE_TTL_SECONDS } = require('../models/GroceryList');

const lastSql = () => db.query.mock.calls[db.query.mock.calls.length - 1][0];
const lastParams = () => db.query.mock.calls[db.query.mock.calls.length - 1][1];

describe('grocery edit lease', () => {
  beforeEach(() => {
    db.query.mockReset();
    db.getClient.mockReset();
  });

  test('is short-lived, so a closed tab cannot hold the list hostage', () => {
    expect(LEASE_TTL_SECONDS).toBeGreaterThanOrEqual(30);
    expect(LEASE_TTL_SECONDS).toBeLessThanOrEqual(120);
  });

  test('acquires in ONE statement whose WHERE clause is the mutual exclusion', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, lock_token: 'tok' }] });

    await GroceryList.acquireLease(1, 7, 'session-a');

    const sql = lastSql();
    // A read-then-write would let two clients both see "free" and both take it.
    expect(sql).toMatch(/^\s*UPDATE grocery_lists/);
    expect(sql).toMatch(/lock_user_id IS NULL/);
    expect(sql).toMatch(/lock_expires_at <= NOW\(\)/);
    expect(sql).toMatch(/lock_user_id = \$2 AND lock_session_id = \$3/);
    expect(lastParams()).toEqual([1, 7, 'session-a', String(LEASE_TTL_SECONDS)]);
  });

  test('returns null when another member holds a live lease', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(GroceryList.acquireLease(1, 7, 'session-a')).resolves.toBeNull();
  });

  test('re-acquiring from the same session keeps the token and does not bump version', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
    await GroceryList.acquireLease(1, 7, 'session-a');

    const sql = lastSql();
    expect(sql).toMatch(/version = version \+ CASE[\s\S]*THEN 0 ELSE 1\s+END/);
    expect(sql).toMatch(/THEN lock_token/);
  });

  test('heartbeat only extends a lease the caller still holds', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const result = await GroceryList.heartbeatLease(1, 7, 'tok');

    expect(result).toBeNull();
    const sql = lastSql();
    expect(sql).toMatch(/lock_user_id = \$2/);
    expect(sql).toMatch(/lock_token = \$3/);
    expect(sql).toMatch(/lock_expires_at > NOW\(\)/);
    // A heartbeat every 20s must not look like a change to polling viewers.
    expect(sql).not.toMatch(/version = version \+ 1/);
  });

  test('release requires the matching token and bumps version', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
    await GroceryList.releaseLease(1, 7, 'tok');

    const sql = lastSql();
    expect(sql).toMatch(/version = version \+ 1/);
    expect(sql).toMatch(/WHERE id = \$1 AND lock_user_id = \$2 AND lock_token = \$3/);
  });

  test('an expired lease is swept lazily and only then bumps version', async () => {
    db.query.mockResolvedValueOnce({ rowCount: 1 });

    await expect(GroceryList.clearExpiredLease(1)).resolves.toBe(true);

    const sql = lastSql();
    expect(sql).toMatch(/lock_expires_at <= NOW\(\)/);
    expect(sql).toMatch(/version = version \+ 1/);
  });

  test('sweeping when nothing expired reports no change', async () => {
    db.query.mockResolvedValueOnce({ rowCount: 0 });
    await expect(GroceryList.clearExpiredLease(1)).resolves.toBe(false);
  });

  test('lease state reports an expired holder as free', async () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    db.query.mockResolvedValueOnce({
      rows: [{ lock_user_id: 9, lock_expires_at: past, version: '12', first_name: 'Nofar' }],
    });

    const state = await GroceryList.getLeaseState(1);

    expect(state.isLocked).toBe(false);
    expect(state.lockedBy).toBeNull();
    expect(state.version).toBe(12);
  });

  test('lease state names the live holder', async () => {
    const future = new Date(Date.now() + 30_000).toISOString();
    db.query.mockResolvedValueOnce({
      rows: [{ lock_user_id: 9, lock_expires_at: future, version: '3', first_name: 'Nofar' }],
    });

    const state = await GroceryList.getLeaseState(1);

    expect(state.isLocked).toBe(true);
    expect(state.lockedBy).toMatchObject({ userId: 9, firstName: 'Nofar' });
  });
});

describe('grocery membership', () => {
  beforeEach(() => db.query.mockReset());

  test('the active list prefers one shared with you over your own', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 5, role: 'member' }] });

    await GroceryList.findForUser(7);

    expect(lastSql()).toMatch(/ORDER BY \(m\.role = 'member'\) DESC/);
  });

  test('an owner cannot be removed as if they were a member', async () => {
    db.query.mockResolvedValueOnce({ rowCount: 0 });

    await GroceryList.removeMember(1, 7, 7);

    expect(lastSql()).toMatch(/m\.role <> 'owner'/);
    expect(lastSql()).toMatch(/l\.owner_id = \$2/);
  });

  test('leaving is only for non-owners', async () => {
    db.query.mockResolvedValueOnce({ rowCount: 1 });
    await GroceryList.leave(1, 7);
    expect(lastSql()).toMatch(/role <> 'owner'/);
  });
});
