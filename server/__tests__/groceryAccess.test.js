jest.mock('../config/db', () => ({ query: jest.fn(), getClient: jest.fn() }));

const { GroceryList } = require('../models/GroceryList');
const { attachList, requireOwner } = require('../middleware/groceryAccess');

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

describe('grocery routes', () => {
  const routes = require('fs').readFileSync(
    require('path').join(__dirname, '..', 'routes', 'groceryRoutes.js'),
    'utf8',
  );

  // The list-level lease is gone on purpose: two people adding or checking off
  // different items cannot conflict, and freezing the whole list to defend
  // against that made the app unusable for whoever was not editing. A lost
  // update on ONE item is stopped by `grocery_items.version` instead.
  test('no route is gated on a list-wide lock', () => {
    expect(routes).not.toMatch(/requireLease/);
    expect(routes).not.toMatch(/router\.(post|delete)\('\/lock/);
  });

  test('claiming is scoped to a single item', () => {
    expect(routes).toMatch(/router\.post\('\/items\/:id\/claim'/);
    expect(routes).toMatch(/router\.delete\('\/items\/:id\/claim'/);
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

  test('reading the list needs nothing but membership', () => {
    const stateLine = routes.split('\n').find((l) => l.includes("router.get('/state'"));
    expect(stateLine).toBeDefined();
    expect(stateLine).not.toMatch(/require/);
  });

  /** Line numbers of route declarations, ignoring any mention in a comment. */
  const lineOf = (needle) => routes
    .split('\n')
    .findIndex((line) => !line.trim().startsWith('//') && line.includes(needle));

  test('invitation endpoints work before the caller has a list of their own', () => {
    const attachLine = lineOf('router.use(attachList);');
    expect(attachLine).toBeGreaterThan(-1);

    for (const route of [
      "router.get('/invitations/:token'",
      "router.post('/invitations/:token/accept'",
      "router.post('/invitations/:token/decline'",
    ]) {
      expect(lineOf(route)).toBeGreaterThan(-1);
      expect(lineOf(route)).toBeLessThan(attachLine);
    }
  });

  // Express matches in declaration order, so a `:token` wildcard declared first
  // would swallow the literal "link" segment and try to preview an invitation
  // whose token is the word "link".
  test('the share-link routes are declared before the :token wildcard', () => {
    const wildcard = lineOf("router.get('/invitations/:token'");
    for (const route of [
      "router.post('/invitations/link'",
      "router.get('/invitations/link'",
      "router.delete('/invitations/link'",
    ]) {
      expect(lineOf(route)).toBeGreaterThan(-1);
      expect(lineOf(route)).toBeLessThan(wildcard);
    }
  });

  test('the share-link routes still run the list and owner checks', () => {
    for (const route of [
      "router.post('/invitations/link'",
      "router.get('/invitations/link'",
      "router.delete('/invitations/link'",
    ]) {
      const declaration = routes.split('\n')[lineOf(route)];
      expect(declaration).toMatch(/attachList/);
      expect(declaration).toMatch(/requireOwner/);
    }
  });

  test('there is no GET route that accepts an invitation', () => {
    expect(routes).not.toMatch(/router\.get\([^)]*accept/i);
  });
});

describe('CORS must allow the grocery headers', () => {
  const index = require('fs').readFileSync(
    require('path').join(__dirname, '..', 'index.js'),
    'utf8',
  );

  // Custom request headers turn every list request into a preflighted one. When
  // they are missing from allowedHeaders the browser refuses before the request
  // is ever sent, which reads as a network failure with no server log at all.
  test('X-Grocery-Session is allowed on requests', () => {
    const allowed = index.match(/allowedHeaders:\s*\[([\s\S]*?)\]/);
    expect(allowed).toBeTruthy();
    expect(allowed[1]).toMatch(/'X-Grocery-Session'/);
  });
});
