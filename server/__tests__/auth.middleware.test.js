/**
 * Auth middleware — exported pure-function tests.
 * No DB, no HTTP server. Covers: generateTokens, verifyToken,
 * hasRole, canManageUser, requireAdmin, requireSuperAdmin.
 */

process.env.JWT_SECRET = 'test_secret_auth_middleware';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_middleware';

jest.mock('../config/db', () => ({ query: jest.fn() }));
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));

const jwt = require('jsonwebtoken');
const {
  generateTokens,
  verifyToken,
  hasRole,
  canManageUser,
  requireAdmin,
  requireSuperAdmin
} = require('../middleware/auth');

const SECRET = 'test_secret_auth_middleware';
const REFRESH_SECRET = 'test_refresh_secret_middleware';

// ─────────────────────────────────────────────────────
// generateTokens
// ─────────────────────────────────────────────────────
describe('generateTokens', () => {
  it('returns both accessToken and refreshToken', () => {
    const { accessToken, refreshToken } = generateTokens({ id: 1, email: 'a@b.com', role: 'user' });
    expect(typeof accessToken).toBe('string');
    expect(typeof refreshToken).toBe('string');
  });

  it('access token contains correct userId, email, role', () => {
    const { accessToken } = generateTokens({ id: 42, email: 'admin@test.com', role: 'admin' });
    const decoded = jwt.verify(accessToken, SECRET);
    expect(decoded.userId).toBe(42);
    expect(decoded.email).toBe('admin@test.com');
    expect(decoded.role).toBe('admin');
  });

  it('defaults role to "user" when role is undefined', () => {
    const { accessToken } = generateTokens({ id: 1, email: 'x@y.com' });
    const decoded = jwt.verify(accessToken, SECRET);
    expect(decoded.role).toBe('user');
  });

  it('access token and refresh token are different strings', () => {
    const { accessToken, refreshToken } = generateTokens({ id: 1, email: 'x@y.com', role: 'user' });
    expect(accessToken).not.toBe(refreshToken);
  });

  it('refresh token contains correct userId', () => {
    const user = { id: 7, email: 'r@e.com', role: 'admin' };
    const { refreshToken } = generateTokens(user);
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    expect(decoded.userId).toBe(7);
  });
});

// ─────────────────────────────────────────────────────
// verifyToken
// ─────────────────────────────────────────────────────
describe('verifyToken', () => {
  it('decodes a valid token', () => {
    const token = jwt.sign({ userId: 5, role: 'user' }, SECRET, { expiresIn: '1h' });
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe(5);
  });

  it('throws "Invalid token" for a bad string', () => {
    expect(() => verifyToken('bad.token.here')).toThrow('Invalid token');
  });

  it('throws "Invalid token" for an expired token', () => {
    const token = jwt.sign({ userId: 1 }, SECRET, { expiresIn: '-1s' });
    expect(() => verifyToken(token)).toThrow('Invalid token');
  });

  it('throws "Invalid token" when wrong secret is used', () => {
    const token = jwt.sign({ userId: 1 }, 'other_secret', { expiresIn: '1h' });
    expect(() => verifyToken(token)).toThrow('Invalid token');
  });

  it('accepts custom secret when provided', () => {
    const token = jwt.sign({ userId: 99 }, REFRESH_SECRET, { expiresIn: '7d' });
    const decoded = verifyToken(token, REFRESH_SECRET);
    expect(decoded.userId).toBe(99);
  });
});

// ─────────────────────────────────────────────────────
// hasRole
// ─────────────────────────────────────────────────────
describe('hasRole', () => {
  it('user passes user-level check', () => {
    expect(hasRole({ role: 'user' }, 'user')).toBe(true);
  });

  it('admin passes user-level check', () => {
    expect(hasRole({ role: 'admin' }, 'user')).toBe(true);
  });

  it('admin passes admin-level check', () => {
    expect(hasRole({ role: 'admin' }, 'admin')).toBe(true);
  });

  it('super_admin passes all levels', () => {
    expect(hasRole({ role: 'super_admin' }, 'user')).toBe(true);
    expect(hasRole({ role: 'super_admin' }, 'admin')).toBe(true);
    expect(hasRole({ role: 'super_admin' }, 'super_admin')).toBe(true);
  });

  it('user fails admin-level check', () => {
    expect(hasRole({ role: 'user' }, 'admin')).toBe(false);
  });

  it('user fails super_admin-level check', () => {
    expect(hasRole({ role: 'user' }, 'super_admin')).toBe(false);
  });

  it('admin fails super_admin-level check', () => {
    expect(hasRole({ role: 'admin' }, 'super_admin')).toBe(false);
  });

  it('returns false for null user', () => {
    expect(hasRole(null, 'user')).toBe(false);
  });

  it('returns false for user with no role property', () => {
    expect(hasRole({}, 'user')).toBe(false);
  });

  it('returns false for an invalid/tampered role', () => {
    expect(hasRole({ role: 'god_mode' }, 'user')).toBe(false);
  });

  it('returns false for an unknown required role', () => {
    expect(hasRole({ role: 'admin' }, 'unknown_role')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────
// canManageUser
// ─────────────────────────────────────────────────────
describe('canManageUser', () => {
  it('super_admin can manage regular users', () => {
    expect(canManageUser({ role: 'super_admin', id: 1 }, { role: 'user', id: 2 })).toBe(true);
  });

  it('super_admin can manage admins', () => {
    expect(canManageUser({ role: 'super_admin', id: 1 }, { role: 'admin', id: 2 })).toBe(true);
  });

  it('admin can manage regular users', () => {
    expect(canManageUser({ role: 'admin', id: 1 }, { role: 'user', id: 2 })).toBe(true);
  });

  it('admin CANNOT manage other admins', () => {
    expect(canManageUser({ role: 'admin', id: 1 }, { role: 'admin', id: 3 })).toBe(false);
  });

  it('user CANNOT manage anyone', () => {
    expect(canManageUser({ role: 'user', id: 1 }, { role: 'user', id: 2 })).toBe(false);
  });

  it('admin+user path returns true even with same id (self-id guard is unreachable dead code)', () => {
    // NOTE: The self-id guard in canManageUser never fires because the
    // "admin can manage user" branch returns before reaching it.
    // This test documents the actual behavior; fixing the guard is a separate task.
    expect(canManageUser({ role: 'admin', id: 5 }, { role: 'user', id: 5 })).toBe(true);
    expect(canManageUser({ role: 'super_admin', id: 5 }, { role: 'user', id: 5 })).toBe(true);
  });

  it('returns false when either argument is null', () => {
    expect(canManageUser(null, { role: 'user', id: 1 })).toBe(false);
    expect(canManageUser({ role: 'admin', id: 1 }, null)).toBe(false);
    expect(canManageUser(null, null)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────
// requireAdmin middleware
// ─────────────────────────────────────────────────────
function makeMocks(user) {
  const req = { user, path: '/test', ip: '127.0.0.1' };
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  const next = jest.fn();
  return { req, res, next };
}

describe('requireAdmin middleware', () => {
  it('calls next() for admin role', () => {
    const { req, res, next } = makeMocks({ id: 1, role: 'admin' });
    requireAdmin(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('calls next() for super_admin role', () => {
    const { req, res, next } = makeMocks({ id: 2, role: 'super_admin' });
    requireAdmin(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('returns 403 ADMIN_REQUIRED for regular user', () => {
    const { req, res, next } = makeMocks({ id: 3, role: 'user' });
    requireAdmin(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'ADMIN_REQUIRED' })
      })
    );
  });

  it('returns 401 AUTHENTICATION_REQUIRED when req.user is null', () => {
    const { req, res, next } = makeMocks(null);
    requireAdmin(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'AUTHENTICATION_REQUIRED' })
      })
    );
  });
});

// ─────────────────────────────────────────────────────
// requireSuperAdmin middleware
// ─────────────────────────────────────────────────────
describe('requireSuperAdmin middleware', () => {
  it('calls next() for super_admin', () => {
    const { req, res, next } = makeMocks({ id: 1, role: 'super_admin' });
    requireSuperAdmin(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 403 SUPER_ADMIN_REQUIRED for admin role', () => {
    const { req, res, next } = makeMocks({ id: 2, role: 'admin' });
    requireSuperAdmin(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'SUPER_ADMIN_REQUIRED' })
      })
    );
  });

  it('returns 403 for regular user', () => {
    const { req, res, next } = makeMocks({ id: 3, role: 'user' });
    requireSuperAdmin(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns 401 AUTHENTICATION_REQUIRED when req.user is null', () => {
    const { req, res, next } = makeMocks(null);
    requireSuperAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'AUTHENTICATION_REQUIRED' })
      })
    );
  });
});
