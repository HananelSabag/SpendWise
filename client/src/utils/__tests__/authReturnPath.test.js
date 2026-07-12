import { describe, expect, it } from 'vitest';
import { resolveAuthReturnPath } from '../authReturnPath';

describe('resolveAuthReturnPath', () => {
  it('preserves a protected deep-link and query string', () => {
    expect(resolveAuthReturnPath({ pathname: '/bank-sync', search: '?tab=accounts' }))
      .toBe('/bank-sync?tab=accounts');
  });

  it('supports legacy string state', () => {
    expect(resolveAuthReturnPath('/insights')).toBe('/insights');
  });

  it('rejects external and protocol-relative redirects', () => {
    expect(resolveAuthReturnPath('https://example.com')).toBe('/');
    expect(resolveAuthReturnPath('//example.com')).toBe('/');
  });
});

