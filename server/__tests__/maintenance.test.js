/**
 * maintenanceGate middleware tests.
 * Uses jest.resetModules() + jest.doMock() so each test gets a fresh module
 * instance with a fresh in-memory cache (TTL = 5 s).
 */

let maintenanceGate;
let mockDbQuery;

beforeEach(() => {
  jest.resetModules();
  mockDbQuery = jest.fn();

  jest.doMock('../config/db', () => ({ query: mockDbQuery }));
  jest.doMock('../utils/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }));

  ({ maintenanceGate } = require('../middleware/maintenance'));
});

afterEach(() => {
  jest.clearAllMocks();
});

// Helper — build req / res / next mocks
function mocks({ path = '/api/v1/transactions', user = null, accept = 'application/json' } = {}) {
  const req = { path, user, headers: { accept } };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    redirect: jest.fn()
  };
  const next = jest.fn();
  return { req, res, next };
}

// ─────────────────────────────────────────────────────
// Maintenance OFF
// ─────────────────────────────────────────────────────
describe('maintenanceGate — maintenance OFF', () => {
  beforeEach(() => {
    mockDbQuery.mockResolvedValue({ rows: [{ setting_value: false }] });
  });

  it('calls next() and does not send a response', async () => {
    const { req, res, next } = mocks();
    await maintenanceGate(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('works for any authenticated user when maintenance is off', async () => {
    const { req, res, next } = mocks({ user: { id: 1, role: 'user' } });
    await maintenanceGate(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────
// Maintenance ON — blocked paths
// ─────────────────────────────────────────────────────
describe('maintenanceGate — maintenance ON, blocked requests', () => {
  beforeEach(() => {
    mockDbQuery.mockResolvedValue({ rows: [{ setting_value: 'true' }] });
  });

  it('returns 503 JSON for unauthenticated API request', async () => {
    const { req, res, next } = mocks({ path: '/api/v1/transactions' });
    await maintenanceGate(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'MAINTENANCE_MODE' })
      })
    );
  });

  it('redirects to /maintenance for browser (text/html) requests', async () => {
    const { req, res, next } = mocks({
      path: '/api/v1/transactions',
      accept: 'text/html,application/xhtml+xml'
    });
    await maintenanceGate(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith(302, '/maintenance');
  });

  it('blocks a regular authenticated user', async () => {
    const { req, res, next } = mocks({
      path: '/api/v1/transactions',
      user: { id: 2, role: 'user' }
    });
    await maintenanceGate(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(503);
  });
});

// ─────────────────────────────────────────────────────
// Maintenance ON — allowed paths
// ─────────────────────────────────────────────────────
describe('maintenanceGate — maintenance ON, allowed requests', () => {
  beforeEach(() => {
    mockDbQuery.mockResolvedValue({ rows: [{ setting_value: 'true' }] });
  });

  it('passes through /health endpoint', async () => {
    const { req, res, next } = mocks({ path: '/health' });
    await maintenanceGate(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('passes through /api/v1/admin endpoint', async () => {
    const { req, res, next } = mocks({ path: '/api/v1/admin/settings' });
    await maintenanceGate(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('passes through /api/v1/users/login', async () => {
    const { req, res, next } = mocks({ path: '/api/v1/users/login' });
    await maintenanceGate(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('passes through /api/v1/users/register', async () => {
    const { req, res, next } = mocks({ path: '/api/v1/users/register' });
    await maintenanceGate(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('passes through /api/v1/users/refresh-token', async () => {
    const { req, res, next } = mocks({ path: '/api/v1/users/refresh-token' });
    await maintenanceGate(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('passes through /api/v1/users/password-reset', async () => {
    const { req, res, next } = mocks({ path: '/api/v1/users/password-reset' });
    await maintenanceGate(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('allows an authenticated admin user', async () => {
    const { req, res, next } = mocks({
      path: '/api/v1/transactions',
      user: { id: 10, role: 'admin' }
    });
    await maintenanceGate(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('allows an authenticated super_admin user', async () => {
    const { req, res, next } = mocks({
      path: '/api/v1/transactions',
      user: { id: 11, role: 'super_admin' }
    });
    await maintenanceGate(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────
// DB error — fail open
// ─────────────────────────────────────────────────────
describe('maintenanceGate — DB error (fail open)', () => {
  it('calls next() when the DB query throws', async () => {
    mockDbQuery.mockRejectedValue(new Error('DB connection failed'));
    const { req, res, next } = mocks();
    await maintenanceGate(req, res, next);
    // Should fail open — not block the user
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
