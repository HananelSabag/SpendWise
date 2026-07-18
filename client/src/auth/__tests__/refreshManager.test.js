import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';

vi.mock('axios', () => ({ default: { post: vi.fn() } }));

const jwt = (expOffsetSec = 900) => {
  const encode = (value) => btoa(JSON.stringify(value)).replaceAll('=', '').replaceAll('+', '-').replaceAll('/', '_');
  return `${encode({ alg: 'none' })}.${encode({ exp: Math.floor(Date.now() / 1000) + expOffsetSec })}.signature`;
};

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  localStorage.clear();
});

describe('refreshManager', () => {
  it('clears stale blocked-account state when a new session starts', async () => {
    localStorage.setItem('blockedSession', '1');
    const manager = await import('../refreshManager.js');

    manager.sessionStarted();

    expect(localStorage.getItem('blockedSession')).toBeNull();
    manager.sessionEnded();
  });

  it('rotates and stores both tokens on a successful refresh', async () => {
    localStorage.setItem('accessToken', jwt(-10));
    localStorage.setItem('refreshToken', 'old-refresh');
    const newAccess = jwt();
    axios.post.mockResolvedValue({
      data: { data: { accessToken: newAccess, refreshToken: 'new-refresh' } },
    });
    const { ensureFreshToken, sessionEnded } = await import('../refreshManager.js');

    await expect(ensureFreshToken()).resolves.toEqual({ ok: true, token: newAccess });
    expect(localStorage.getItem('accessToken')).toBe(newAccess);
    expect(localStorage.getItem('refreshToken')).toBe('new-refresh');
    sessionEnded();
  });

  it('adopts tokens rotated by another tab when the server returns 409', async () => {
    localStorage.setItem('accessToken', jwt(-10));
    localStorage.setItem('refreshToken', 'old-refresh');
    const otherTabAccess = jwt();
    axios.post.mockImplementation(async () => {
      localStorage.setItem('accessToken', otherTabAccess);
      localStorage.setItem('refreshToken', 'other-tab-refresh');
      throw { response: { status: 409, data: { error: { code: 'SESSION_ALREADY_ROTATED' } } } };
    });
    const { ensureFreshToken, sessionEnded } = await import('../refreshManager.js');

    await expect(ensureFreshToken()).resolves.toEqual({ ok: true, token: otherTabAccess });
    expect(localStorage.getItem('refreshToken')).toBe('other-tab-refresh');
    sessionEnded();
  });

  it('clears a rejected session but preserves tokens on a transient failure', async () => {
    localStorage.setItem('accessToken', jwt(-10));
    localStorage.setItem('refreshToken', 'refresh');
    axios.post.mockRejectedValueOnce({ response: { status: 503 } });
    const manager = await import('../refreshManager.js');

    await expect(manager.ensureFreshToken()).resolves.toMatchObject({ transient: true });
    expect(localStorage.getItem('refreshToken')).toBe('refresh');
    manager.sessionEnded();

    vi.resetModules();
    axios.post.mockRejectedValueOnce({ response: { status: 401, data: { error: { code: 'INVALID_REFRESH_TOKEN' } } } });
    const fatalManager = await import('../refreshManager.js');
    await expect(fatalManager.ensureFreshToken()).resolves.toMatchObject({ fatal: true });
    expect(localStorage.getItem('refreshToken')).toBeNull();
    fatalManager.sessionEnded();
  });

  it('preserves blocked-account state when refresh is rejected', async () => {
    localStorage.setItem('accessToken', jwt(-10));
    localStorage.setItem('refreshToken', 'refresh');
    axios.post.mockRejectedValue({
      response: { status: 403, data: { error: { code: 'USER_BLOCKED' } } },
    });
    const manager = await import('../refreshManager.js');

    await expect(manager.ensureFreshToken()).resolves.toMatchObject({ fatal: true });
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(localStorage.getItem('blockedSession')).toBe('1');
    manager.sessionEnded();
  });
});
