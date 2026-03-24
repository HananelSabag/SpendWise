/**
 * authStore tests — state machine, permissions, setUser, reset.
 *
 * We mock all external dependencies so the store logic runs in isolation.
 * jsdom provides localStorage/sessionStorage.
 */
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// ── mock external deps before importing the store ──────────────────────────────
vi.mock('../../api', () => ({
  authAPI: {
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    refreshToken: vi.fn(),
    verifyEmail: vi.fn(),
    googleLogin: vi.fn()
  }
}));

vi.mock('jwt-decode', () => ({
  jwtDecode: vi.fn(() => ({
    exp: Math.floor(Date.now() / 1000) + 3600,
    userId: 1,
    role: 'user'
  }))
}));

vi.mock('../appStore', () => ({
  useAppStore: {
    getState: vi.fn(() => ({
      currency: 'USD',
      theme: 'light',
      actions: {
        setCurrency: vi.fn(),
        setTheme: vi.fn(),
        clearGuestPreferences: vi.fn(),
        initializeGuestPreferences: vi.fn()
      }
    }))
  }
}));

vi.mock('../translationStore', () => ({
  useTranslationStore: {
    getState: vi.fn(() => ({
      currentLanguage: 'en',
      actions: { setLanguage: vi.fn() }
    }))
  }
}));

import { useAuthStore } from '../authStore';

// Helper — get a fresh store reference and clear state between tests
function getStore() {
  return useAuthStore.getState();
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  // Reset store to initial blank state
  useAuthStore.setState({
    isAuthenticated: false,
    isLoading: false,
    user: null,
    userRole: 'user',
    isAdmin: false,
    isSuperAdmin: false,
    error: null,
    initialized: false,
    permissions: [],
    sessionExpiry: null,
    autoLogoutTimer: null,
    tokenRefreshTimer: null
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

// ─────────────────────────────────────────────────────
// Initial state
// ─────────────────────────────────────────────────────
describe('authStore — initial state', () => {
  it('is not authenticated by default', () => {
    const store = getStore();
    expect(store.isAuthenticated).toBe(false);
  });

  it('user is null by default', () => {
    expect(getStore().user).toBeNull();
  });

  it('isLoading is false by default', () => {
    expect(getStore().isLoading).toBe(false);
  });

  it('isAdmin is false by default', () => {
    expect(getStore().isAdmin).toBe(false);
  });

  it('isSuperAdmin is false by default', () => {
    expect(getStore().isSuperAdmin).toBe(false);
  });
});

// ─────────────────────────────────────────────────────
// getPermissionsForRole
// ─────────────────────────────────────────────────────
describe('authStore — getPermissionsForRole', () => {
  it('user role gets read:own and write:own', () => {
    const perms = getStore().actions.getPermissionsForRole('user');
    expect(perms).toContain('read:own');
    expect(perms).toContain('write:own');
    expect(perms).not.toContain('manage:users');
  });

  it('admin role gets user permissions plus manage:users', () => {
    const perms = getStore().actions.getPermissionsForRole('admin');
    expect(perms).toContain('read:own');
    expect(perms).toContain('write:own');
    expect(perms).toContain('read:users');
    expect(perms).toContain('manage:users');
    expect(perms).not.toContain('manage:system');
  });

  it('super_admin role gets all permissions including manage:system', () => {
    const perms = getStore().actions.getPermissionsForRole('super_admin');
    expect(perms).toContain('manage:system');
    expect(perms).toContain('manage:users');
    expect(perms).toContain('read:users');
  });

  it('unknown role falls back to user permissions', () => {
    const perms = getStore().actions.getPermissionsForRole('hacker');
    expect(perms).toContain('read:own');
    expect(perms).not.toContain('manage:users');
  });
});

// ─────────────────────────────────────────────────────
// setUser
// ─────────────────────────────────────────────────────
describe('authStore — setUser', () => {
  it('sets isAuthenticated=true and stores user object', () => {
    const user = { id: 1, email: 'a@b.com', role: 'user' };
    getStore().actions.setUser(user);
    const state = getStore();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(user);
  });

  it('sets isAdmin=true for admin role', () => {
    getStore().actions.setUser({ id: 2, email: 'admin@b.com', role: 'admin' });
    expect(getStore().isAdmin).toBe(true);
    expect(getStore().isSuperAdmin).toBe(false);
  });

  it('sets isAdmin=true and isSuperAdmin=true for super_admin role', () => {
    getStore().actions.setUser({ id: 3, email: 'root@b.com', role: 'super_admin' });
    const state = getStore();
    expect(state.isAdmin).toBe(true);
    expect(state.isSuperAdmin).toBe(true);
  });

  it('sets isAdmin=false and isSuperAdmin=false for user role', () => {
    getStore().actions.setUser({ id: 4, email: 'u@b.com', role: 'user' });
    const state = getStore();
    expect(state.isAdmin).toBe(false);
    expect(state.isSuperAdmin).toBe(false);
  });

  it('sets userRole from user.role', () => {
    getStore().actions.setUser({ id: 5, email: 'x@y.com', role: 'admin' });
    expect(getStore().userRole).toBe('admin');
  });

  it('clears isLoading and error', () => {
    useAuthStore.setState({ isLoading: true, error: { message: 'old error' } });
    getStore().actions.setUser({ id: 6, email: 'a@a.com', role: 'user' });
    expect(getStore().isLoading).toBe(false);
    expect(getStore().error).toBeNull();
  });
});

// ─────────────────────────────────────────────────────
// reset
// ─────────────────────────────────────────────────────
describe('authStore — reset', () => {
  beforeEach(() => {
    // Put the store in an authenticated state first
    getStore().actions.setUser({ id: 1, email: 'a@b.com', role: 'admin' });
  });

  it('clears user', () => {
    getStore().actions.reset();
    expect(getStore().user).toBeNull();
  });

  it('sets isAuthenticated=false', () => {
    getStore().actions.reset();
    expect(getStore().isAuthenticated).toBe(false);
  });

  it('clears isAdmin and isSuperAdmin', () => {
    getStore().actions.reset();
    expect(getStore().isAdmin).toBe(false);
    expect(getStore().isSuperAdmin).toBe(false);
  });

  it('clears error state', () => {
    useAuthStore.setState({ error: { message: 'some error' } });
    getStore().actions.reset();
    expect(getStore().error).toBeNull();
  });

  it('clears permissions', () => {
    getStore().actions.reset();
    expect(getStore().permissions).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────
// initialize
// ─────────────────────────────────────────────────────
describe('authStore — initialize', () => {
  it('sets initialized=true', () => {
    getStore().actions.initialize();
    expect(getStore().initialized).toBe(true);
  });

  it('sets isAuthenticated=true when a token exists in localStorage', () => {
    localStorage.setItem('accessToken', 'some-token');
    getStore().actions.initialize();
    expect(getStore().isAuthenticated).toBe(true);
  });

  it('sets isAuthenticated=false when no token exists', () => {
    getStore().actions.initialize();
    expect(getStore().isAuthenticated).toBe(false);
  });
});

// ─────────────────────────────────────────────────────
// login — error handling (mocked API)
// ─────────────────────────────────────────────────────
describe('authStore — login action', () => {
  it('sets isLoading=true during login, false after', async () => {
    const { authAPI } = await import('../../api');
    authAPI.login.mockResolvedValueOnce({
      success: true,
      user: { id: 1, email: 'a@b.com', role: 'user' },
      accessToken: 'tok',
      refreshToken: 'ref'
    });

    const loginPromise = getStore().actions.login('a@b.com', 'pass');
    // isLoading should be true while the promise is pending
    expect(getStore().isLoading).toBe(true);
    await loginPromise;
    expect(getStore().isLoading).toBe(false);
  });

  it('returns { success: false } and stores error on API failure', async () => {
    const { authAPI } = await import('../../api');
    authAPI.login.mockResolvedValueOnce({
      success: false,
      error: { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' }
    });

    const result = await getStore().actions.login('bad@user.com', 'wrongpass');
    expect(result.success).toBe(false);
    expect(getStore().error).toBeTruthy();
    expect(getStore().isAuthenticated).toBe(false);
  });
});
