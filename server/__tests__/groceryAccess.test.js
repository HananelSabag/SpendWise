jest.mock('../config/db', () => ({ query: jest.fn(), getClient: jest.fn() }));

const { GroceryList } = require('../models/GroceryList');
const { attachList, requireOwner, requireLease } = require('../middleware/groceryAccess');

const makeRes = () => {
  const res = { statusCode: null, body: null, headers: {} };
  res.status = jest.fn((code) => { res.statusCode = code; return res; });
  res.json = jest.fn((payload) => { res.body = payload; return res; });
  res.set = jest.fn((key, value) => { res.headers[key] = value; return res; });
  return res;
};

const makeReq = (headers = {}, overrides = {}) => ({
  user: { id: 7, email: 'me@example.com' },
  get: (name) => headers[name] ?? null,
  body: {},
  ...overrides,
});

describe('attachList', () => {
  afterEach(() => jest.restoreAllMocks());

  test('resolves the caller list and role onto the request', async () => {
    jest.spyOn(GroceryList, 'resolveForUser').mockResolvedValue({ id: 5, role: 'owner' });
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    await attachList(req, res, next);

    expect(req.groceryList).toEqual({ id: 5, role: 'owner' });
    expect(req.groceryRole).toBe('owner');
    expect(next).toHaveBeenCalledWith();
  });

  test('refuses when the user has no list at all', async () => {
    jest.spyOn(GroceryList, 'resolveForUser').mockResolvedValue(null);
    const res = makeRes();
    const next = jest.fn();

    await attachList(makeReq(), res, next);

    expect(res.statusCode).toBe(403);
    expect(res.body.error.code).toBe('GROCERY_NO_LIST');
    expect(next).not.toHaveBeenCalled();
  });
});

describe('requireOwner', () => {
  test('lets the owner through', () => {
    const next = jest.fn();
    requireOwner({ groceryRole: 'owner' }, makeRes(), next);
    expect(next).toHaveBeenCalled();
  });

  test('blocks a member from managing membership', () => {
    const res = makeRes();
    const next = jest.fn();

    requireOwner({ groceryRole: 'member' }, res, next);

    expect(res.statusCode).toBe(403);
    expect(res.body.error.code).toBe('GROCERY_OWNER_ONLY');
    expect(next).not.toHaveBeenCalled();
  });
});

describe('requireLease', () => {
  afterEach(() => jest.restoreAllMocks());

  test('passes straight through when the caller still holds the lease', async () => {
    const heartbeat = jest.spyOn(GroceryList, 'heartbeatLease').mockResolvedValue({ id: 5 });
    const acquire = jest.spyOn(GroceryList, 'acquireLease');
    const req = makeReq({ 'X-Grocery-Lease': 'tok' }, { groceryList: { id: 5 } });
    const next = jest.fn();

    await requireLease(req, makeRes(), next);

    expect(heartbeat).toHaveBeenCalledWith(5, 7, 'tok', expect.any(Number));
    expect(acquire).not.toHaveBeenCalled();
    expect(req.groceryLease.token).toBe('tok');
    expect(next).toHaveBeenCalled();
  });

  test('takes a free lease implicitly and returns the token in a header', async () => {
    jest.spyOn(GroceryList, 'heartbeatLease').mockResolvedValue(null);
    jest.spyOn(GroceryList, 'acquireLease').mockResolvedValue({ id: 5, lock_token: 'fresh' });
    const req = makeReq({}, { groceryList: { id: 5 } });
    const res = makeRes();
    const next = jest.fn();

    await requireLease(req, res, next);

    expect(res.set).toHaveBeenCalledWith('X-Grocery-Lease', 'fresh');
    expect(req.groceryLease.token).toBe('fresh');
    expect(next).toHaveBeenCalled();
  });

  test('rejects with 409 and names the holder when someone else is editing', async () => {
    jest.spyOn(GroceryList, 'heartbeatLease').mockResolvedValue(null);
    jest.spyOn(GroceryList, 'acquireLease').mockResolvedValue(null);
    jest.spyOn(GroceryList, 'getLeaseState').mockResolvedValue({
      isLocked: true,
      lockedBy: { userId: 44, firstName: 'Nofar' },
      expiresAt: '2026-09-04T10:00:00.000Z',
      version: 12,
    });
    const res = makeRes();
    const next = jest.fn();

    await requireLease(makeReq({}, { groceryList: { id: 5 } }), res, next);

    expect(res.statusCode).toBe(409);
    expect(res.body.error.code).toBe('GROCERY_LOCKED');
    expect(res.body.error.lockedBy).toEqual({ userId: 44, firstName: 'Nofar' });
    expect(next).not.toHaveBeenCalled();
  });

  test('a stale token does not grant a write when the list is taken', async () => {
    jest.spyOn(GroceryList, 'heartbeatLease').mockResolvedValue(null);
    jest.spyOn(GroceryList, 'acquireLease').mockResolvedValue(null);
    jest.spyOn(GroceryList, 'getLeaseState').mockResolvedValue({ isLocked: true, lockedBy: null });
    const res = makeRes();
    const next = jest.fn();

    await requireLease(
      makeReq({ 'X-Grocery-Lease': 'expired-token' }, { groceryList: { id: 5 } }),
      res,
      next,
    );

    expect(res.statusCode).toBe(409);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('grocery routes', () => {
  const routes = require('fs').readFileSync(
    require('path').join(__dirname, '..', 'routes', 'groceryRoutes.js'),
    'utf8',
  );

  test('every list-content mutation goes through requireLease', () => {
    for (const line of [
      "router.post('/items',",
      "router.patch('/items/:id',",
      "router.post('/items/:id/purchase',",
      "router.delete('/items/:id',",
      "router.post('/trips/complete',",
    ]) {
      const declaration = routes.split('\n').find((l) => l.includes(line));
      expect(declaration).toBeDefined();
      expect(declaration).toMatch(/requireLease/);
    }
  });

  test('membership management is owner-gated', () => {
    for (const line of [
      "router.post('/invitations',",
      "router.delete('/invitations',",
      "router.delete('/members/:userId',",
      "router.delete('/members',",
    ]) {
      const declaration = routes.split('\n').find((l) => l.includes(line));
      expect(declaration).toBeDefined();
      expect(declaration).toMatch(/requireOwner/);
    }
  });

  test('reads are not lease-gated — watching must never need the lock', () => {
    const stateLine = routes.split('\n').find((l) => l.includes("router.get('/state'"));
    expect(stateLine).not.toMatch(/requireLease/);
  });

  test('invitation endpoints work before the caller has a list of their own', () => {
    const attachIndex = routes.indexOf('router.use(attachList)');
    expect(routes.indexOf("router.get('/invitations/:token'")).toBeLessThan(attachIndex);
    expect(routes.indexOf("router.post('/invitations/:token/accept'")).toBeLessThan(attachIndex);
    expect(routes.indexOf("router.post('/invitations/:token/decline'")).toBeLessThan(attachIndex);
  });

  test('there is no GET route that accepts an invitation', () => {
    expect(routes).not.toMatch(/router\.get\([^)]*accept/i);
  });
});

describe('CORS must allow the edit-lease headers', () => {
  const index = require('fs').readFileSync(
    require('path').join(__dirname, '..', 'index.js'),
    'utf8',
  );

  // Custom request headers turn every list request into a preflighted one. When
  // they are missing from allowedHeaders the browser refuses before the request
  // is ever sent, which reads as a network failure with no server log at all.
  test('X-Grocery-Session and X-Grocery-Lease are allowed on requests', () => {
    const allowed = index.match(/allowedHeaders:\s*\[([\s\S]*?)\]/);
    expect(allowed).toBeTruthy();
    expect(allowed[1]).toMatch(/'X-Grocery-Session'/);
    expect(allowed[1]).toMatch(/'X-Grocery-Lease'/);
  });

  // The server mints a lease token and returns it in a header; without an
  // explicit expose the browser hides it and the implicit-lease flow breaks.
  test('X-Grocery-Lease is exposed on responses', () => {
    const exposed = index.match(/exposedHeaders:\s*\[([\s\S]*?)\]/);
    expect(exposed).toBeTruthy();
    expect(exposed[1]).toMatch(/'X-Grocery-Lease'/);
  });
});
