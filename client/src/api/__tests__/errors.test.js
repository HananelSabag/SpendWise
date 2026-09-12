import { describe, expect, it } from 'vitest';
import { apiResultError, normalizeApiError, shouldRetryQuery } from '../errors';

describe('one API error contract', () => {
  it('preserves status, error code and conflict context through repeated normalization', () => {
    const normalized = normalizeApiError({ response: {
      status: 409, data: { error: { code: 'GROCERY_ITEM_BUSY', editingBy: 'Alex' } },
    } });
    expect(normalized).toMatchObject({ status: 409, code: 'GROCERY_ITEM_BUSY', editingBy: 'Alex' });
    expect(normalizeApiError(normalized)).toBe(normalized);
    expect(apiResultError({ success: false, error: normalized })).toMatchObject(normalized);
  });
  it('preserves flat server error responses and proxy statuses', () => {
    expect(normalizeApiError({ response: { status: 429, data: { error: 'Wait', code: 'SYNC_QUOTA' } } }))
      .toMatchObject({ status: 429, code: 'SYNC_QUOTA', message: 'Wait' });
    expect(normalizeApiError({ response: { status: 413, data: '<html>too large</html>' } }).code).toBe('HTTP_413');
  });
  it.each([400, 401, 403, 404, 409, 422, 429])('does not retry an HTTP %s error in either shape', (status) => {
    expect(shouldRetryQuery(0, { status })).toBe(false);
    expect(shouldRetryQuery(0, { response: { status } })).toBe(false);
  });
  it('bounds both network and server failures, even when no HTTP response exists', () => {
    for (const error of [new Error('offline'), { status: 0 }, { status: 503 }]) {
      expect(shouldRetryQuery(0, error)).toBe(true);
      expect(shouldRetryQuery(1, error)).toBe(true);
      expect(shouldRetryQuery(2, error)).toBe(false);
    }
  });
  it.each(['ERR_CANCELED', 'NO_TOKEN', 'MAINTENANCE_MODE'])('does not retry %s', (code) => {
    expect(shouldRetryQuery(0, { code })).toBe(false);
  });
});
