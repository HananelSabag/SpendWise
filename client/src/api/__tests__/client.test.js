import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CanceledError } from 'axios';
vi.mock('../../auth/tokenStorage.js', () => ({ getAccessToken: () => null }));
vi.mock('../../auth/refreshManager.js', () => ({ ensureFreshToken: vi.fn() }));
vi.mock('../../auth/serverHealth.js', () => ({ markWarm: vi.fn(), isRecentlyWarm: () => true }));
vi.mock('react-hot-toast', () => ({ toast: { dismiss: vi.fn() } }));
import api from '../client';

beforeEach(() => { vi.restoreAllMocks(); api.clearCache(); window.__SERVER_WAKING__ = true; });

describe('transport safety and bounded admin cache', () => {
  it('does not silently repeat writes after a timeout', async () => {
    api.serverState.isWarm = false;
    const retry = vi.spyOn(api, 'retryColdStartRequest');
    for (const method of ['post', 'patch', 'put', 'delete']) {
      await expect(api.handleResponseError({ config: { method }, code: 'ECONNABORTED', message: 'timeout' }))
        .rejects.toMatchObject({ code: 'TIMEOUT' });
    }
    expect(retry).not.toHaveBeenCalled();
  });
  it('still allows one transport cold-start retry for safe reads', async () => {
    api.serverState.isWarm = false;
    const retry = vi.spyOn(api, 'retryColdStartRequest').mockResolvedValue({ data: 'awake' });
    expect(await api.handleResponseError({ config: { method: 'get' }, code: 'ECONNABORTED' }))
      .toEqual({ data: 'awake' });
    expect(retry).toHaveBeenCalledTimes(1);
  });
  it('keeps cancellations as cancellations and does not mark the server failed', async () => {
    const failures = api.serverState.consecutiveFailures;
    const cancelled = new CanceledError('navigation');
    await expect(api.handleResponseError(cancelled)).rejects.toBe(cancelled);
    expect(api.serverState.consecutiveFailures).toBe(failures);
  });
  it('uses the default TTL when null is passed and caps retained admin results', () => {
    api.cache.set('first', 'valid', null);
    expect(api.cache.get('first')).toBe('valid');
    for (let i = 0; i < 110; i++) api.cache.set(`key-${i}`, i);
    expect(api.cache.getStats().size).toBe(100);
    api.cache.set('expired', 'gone', 0);
    expect(api.cache.get('expired')).toBeNull();
  });
  it('does not repopulate a cleared cache or join the previous account request', async () => {
    let finishOld;
    const request = vi.spyOn(api.client, 'request')
      .mockImplementationOnce(() => new Promise((resolve) => { finishOld = resolve; }))
      .mockResolvedValueOnce({ data: { user: 'new' } });
    const old = api.cachedRequest('/admin/dashboard', {}, 'admin-dashboard');
    api.clearCache();
    const fresh = await api.cachedRequest('/admin/dashboard', {}, 'admin-dashboard');
    finishOld({ data: { user: 'old' } });
    await old;
    expect(fresh.data.user).toBe('new');
    expect(api.cache.get('admin-dashboard')).toEqual({ user: 'new' });
    expect(request).toHaveBeenCalledTimes(2);
  });
});
