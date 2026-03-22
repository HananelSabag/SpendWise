/**
 * Auth middleware logic tests — unit tested in isolation (no DB, no server).
 * Tests JWT extraction, role validation, and token structure.
 */
const jwt = require('jsonwebtoken');

const TEST_SECRET = 'test_secret_key_for_unit_tests';

// Mirrors auth middleware token extraction logic
function extractBearerToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return token || null;
}

// Mirrors role validation logic from auth middleware
function validateRole(role) {
  const validRoles = ['user', 'admin', 'super_admin'];
  return validRoles.includes(role);
}

// Mirrors permission check helpers from auth.js
function hasPermission(user, requiredRole) {
  const roleHierarchy = { user: 1, admin: 2, super_admin: 3 };
  return (roleHierarchy[user.role] || 0) >= (roleHierarchy[requiredRole] || 0);
}

describe('Bearer token extraction', () => {
  it('extracts token from valid Authorization header', () => {
    const token = extractBearerToken('Bearer my.jwt.token');
    expect(token).toBe('my.jwt.token');
  });

  it('returns null for missing header', () => {
    expect(extractBearerToken(null)).toBeNull();
    expect(extractBearerToken(undefined)).toBeNull();
  });

  it('returns null for non-Bearer scheme', () => {
    expect(extractBearerToken('Basic dXNlcjpwYXNz')).toBeNull();
  });

  it('returns null for Bearer with no token', () => {
    expect(extractBearerToken('Bearer ')).toBeNull();
  });
});

describe('Role validation', () => {
  it('accepts valid roles', () => {
    expect(validateRole('user')).toBe(true);
    expect(validateRole('admin')).toBe(true);
    expect(validateRole('super_admin')).toBe(true);
  });

  it('rejects invalid roles', () => {
    expect(validateRole('superadmin')).toBe(false);
    expect(validateRole('ROOT')).toBe(false);
    expect(validateRole('')).toBe(false);
    expect(validateRole(null)).toBe(false);
    expect(validateRole('god_mode')).toBe(false);
  });
});

describe('Role hierarchy / permission checks', () => {
  it('user can access user-level resources', () => {
    expect(hasPermission({ role: 'user' }, 'user')).toBe(true);
  });

  it('admin can access user-level resources', () => {
    expect(hasPermission({ role: 'admin' }, 'user')).toBe(true);
  });

  it('admin can access admin-level resources', () => {
    expect(hasPermission({ role: 'admin' }, 'admin')).toBe(true);
  });

  it('user CANNOT access admin-level resources', () => {
    expect(hasPermission({ role: 'user' }, 'admin')).toBe(false);
  });

  it('admin CANNOT access super_admin-level resources', () => {
    expect(hasPermission({ role: 'admin' }, 'super_admin')).toBe(false);
  });

  it('super_admin can access everything', () => {
    expect(hasPermission({ role: 'super_admin' }, 'user')).toBe(true);
    expect(hasPermission({ role: 'super_admin' }, 'admin')).toBe(true);
    expect(hasPermission({ role: 'super_admin' }, 'super_admin')).toBe(true);
  });

  it('unknown role has no permissions', () => {
    expect(hasPermission({ role: 'hacker' }, 'user')).toBe(false);
  });
});

describe('JWT token structure', () => {
  it('valid token is verifiable with correct secret', () => {
    const token = jwt.sign({ userId: 1, role: 'user' }, TEST_SECRET, { expiresIn: '1h' });
    const decoded = jwt.verify(token, TEST_SECRET);
    expect(decoded.userId).toBe(1);
    expect(decoded.role).toBe('user');
  });

  it('token signed with wrong secret fails verification', () => {
    const token = jwt.sign({ userId: 1 }, 'wrong_secret', { expiresIn: '1h' });
    expect(() => jwt.verify(token, TEST_SECRET)).toThrow();
  });

  it('expired token throws TokenExpiredError', () => {
    const token = jwt.sign({ userId: 1 }, TEST_SECRET, { expiresIn: '-1s' });
    expect(() => jwt.verify(token, TEST_SECRET)).toThrow(jwt.TokenExpiredError);
  });

  it('malformed token throws JsonWebTokenError', () => {
    expect(() => jwt.verify('not.a.valid.token', TEST_SECRET)).toThrow(jwt.JsonWebTokenError);
  });
});
