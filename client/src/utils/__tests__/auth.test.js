/**
 * Client auth utilities — tokenManager & auth helpers.
 * Uses jsdom's localStorage (provided by the vitest jsdom environment).
 * No real network calls — authAPI is mocked.
 */
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock the authAPI before importing auth.js so the module resolves cleanly
vi.mock('../../api', () => ({
  authAPI: {
    login: vi.fn(),
    logout: vi.fn(),
    getProfile: vi.fn()
  }
}));

import { tokenManager, auth } from '../auth';

// ─── Helper: build a real JWT-shaped token ────────────────────────────────────
function buildToken({ exp }) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ userId: 1, role: 'user', exp }));
  return `${header}.${payload}.fakesig`;
}

function validToken() {
  return buildToken({ exp: Math.floor(Date.now() / 1000) + 3600 }); // +1 h
}

function expiredToken() {
  return buildToken({ exp: Math.floor(Date.now() / 1000) - 60 }); // -1 min
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.clearAllMocks();
});

// ─────────────────────────────────────────────────────
// tokenManager.setTokens / getAccessToken / getRefreshToken
// ─────────────────────────────────────────────────────
describe('tokenManager — storage', () => {
  it('setTokens stores both tokens in localStorage', () => {
    tokenManager.setTokens('access123', 'refresh456');
    expect(localStorage.getItem('accessToken')).toBe('access123');
    expect(localStorage.getItem('refreshToken')).toBe('refresh456');
  });

  it('setTokens without refreshToken only writes accessToken', () => {
    tokenManager.setTokens('access123');
    expect(localStorage.getItem('accessToken')).toBe('access123');
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });

  it('getAccessToken returns the stored access token', () => {
    localStorage.setItem('accessToken', 'mytoken');
    expect(tokenManager.getAccessToken()).toBe('mytoken');
  });

  it('getAccessToken returns null when nothing is stored', () => {
    expect(tokenManager.getAccessToken()).toBeNull();
  });

  it('getRefreshToken returns the stored refresh token', () => {
    localStorage.setItem('refreshToken', 'myrefresh');
    expect(tokenManager.getRefreshToken()).toBe('myrefresh');
  });

  it('clearTokens removes both tokens', () => {
    localStorage.setItem('accessToken', 'a');
    localStorage.setItem('refreshToken', 'b');
    tokenManager.clearTokens();
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────
// tokenManager.isTokenExpired
// ─────────────────────────────────────────────────────
describe('tokenManager.isTokenExpired', () => {
  it('returns true for null token', () => {
    expect(tokenManager.isTokenExpired(null)).toBe(true);
  });

  it('returns true for undefined token', () => {
    expect(tokenManager.isTokenExpired(undefined)).toBe(true);
  });

  it('returns true for an empty string', () => {
    expect(tokenManager.isTokenExpired('')).toBe(true);
  });

  it('returns true for a malformed token', () => {
    expect(tokenManager.isTokenExpired('not.a.token')).toBe(true);
  });

  it('returns false for a valid (non-expired) token', () => {
    expect(tokenManager.isTokenExpired(validToken())).toBe(false);
  });

  it('returns true for an expired token', () => {
    expect(tokenManager.isTokenExpired(expiredToken())).toBe(true);
  });

  it('returns true for a token with non-base64 payload', () => {
    expect(tokenManager.isTokenExpired('head.!!!.sig')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────
// auth.isAuthenticated
// ─────────────────────────────────────────────────────
describe('auth.isAuthenticated', () => {
  it('returns false when no token in localStorage', () => {
    expect(auth.isAuthenticated()).toBeFalsy();
  });

  it('returns true when a valid token is stored', () => {
    localStorage.setItem('accessToken', validToken());
    expect(auth.isAuthenticated()).toBeTruthy();
  });

  it('returns false when an expired token is stored', () => {
    localStorage.setItem('accessToken', expiredToken());
    expect(auth.isAuthenticated()).toBeFalsy();
  });
});

// ─────────────────────────────────────────────────────
// auth.getAuthStatus
// ─────────────────────────────────────────────────────
describe('auth.getAuthStatus', () => {
  it('returns hasToken=false, isExpired=true, isAuthenticated=false when no token', () => {
    const status = auth.getAuthStatus();
    expect(status.hasToken).toBe(false);
    expect(status.isExpired).toBe(true);
    expect(status.isAuthenticated).toBe(false);
  });

  it('returns hasToken=true, isExpired=false, isAuthenticated=true for valid token', () => {
    localStorage.setItem('accessToken', validToken());
    const status = auth.getAuthStatus();
    expect(status.hasToken).toBe(true);
    expect(status.isExpired).toBe(false);
    expect(status.isAuthenticated).toBe(true);
  });

  it('returns hasToken=true, isExpired=true, isAuthenticated=false for expired token', () => {
    localStorage.setItem('accessToken', expiredToken());
    const status = auth.getAuthStatus();
    expect(status.hasToken).toBe(true);
    expect(status.isExpired).toBe(true);
    expect(status.isAuthenticated).toBe(false);
  });
});
