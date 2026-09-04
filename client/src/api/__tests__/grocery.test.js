import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGet, mockPost, mockPatch, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockPatch: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock('../client.js', () => ({
  default: { client: { get: mockGet, post: mockPost, patch: mockPatch, delete: mockDelete } },
}));

import groceryAPI from '../grocery.js';

const ok = (data, headers = {}) => ({ data: { success: true, data }, headers });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('live state polling', () => {
  it('sends the known version so the server can answer "unchanged"', async () => {
    mockGet.mockResolvedValue(ok({ unchanged: true, version: 12 }));

    const result = await groceryAPI.getState(12);

    expect(mockGet).toHaveBeenCalledWith('/grocery/state', expect.objectContaining({
      params: { version: 12 },
    }));
    expect(result.data).toEqual({ unchanged: true, version: 12 });
  });

  it('omits the version on a first load', async () => {
    mockGet.mockResolvedValue(ok({ items: [] }));

    await groceryAPI.getState(undefined);

    expect(mockGet.mock.calls[0][1].params).toEqual({});
  });

  it('sends a version of 0 rather than dropping it', async () => {
    mockGet.mockResolvedValue(ok({}));
    await groceryAPI.getState(0);
    expect(mockGet.mock.calls[0][1].params).toEqual({ version: 0 });
  });
});

describe('edit lease headers', () => {
  it('carries a stable per-tab session id on every call', async () => {
    mockGet.mockResolvedValue(ok({}));
    mockPost.mockResolvedValue(ok({}));

    await groceryAPI.getState();
    await groceryAPI.addItem({ name: 'Milk' });

    const stateHeaders = mockGet.mock.calls[0][1].headers;
    const addHeaders = mockPost.mock.calls[0][2].headers;

    expect(stateHeaders['X-Grocery-Session']).toBe(groceryAPI.sessionId);
    expect(addHeaders['X-Grocery-Session']).toBe(groceryAPI.sessionId);
  });

  it('attaches the lease token to mutations and not to reads', async () => {
    mockGet.mockResolvedValue(ok({}));
    mockPost.mockResolvedValue(ok({}));

    await groceryAPI.getState();
    await groceryAPI.setPurchased(3, true, 'lease-token');

    expect(mockGet.mock.calls[0][1].headers['X-Grocery-Lease']).toBeUndefined();
    expect(mockPost.mock.calls[0][2].headers['X-Grocery-Lease']).toBe('lease-token');
  });

  it('picks up a lease the server minted on an implicit acquire', async () => {
    mockPost.mockResolvedValue(ok({ item: { id: 1 } }, { 'x-grocery-lease': 'fresh-token' }));

    const result = await groceryAPI.addItem({ name: 'Milk' });

    expect(result.leaseToken).toBe('fresh-token');
  });

  it('reports no token when the server did not send one', async () => {
    mockPost.mockResolvedValue(ok({ item: { id: 1 } }));
    const result = await groceryAPI.addItem({ name: 'Milk' });
    expect(result.leaseToken).toBeNull();
  });
});

describe('error shape', () => {
  it('surfaces the server code and status so the UI can localize', async () => {
    mockPost.mockRejectedValue({
      response: {
        status: 409,
        data: { error: { code: 'GROCERY_LOCKED', lockedBy: { userId: 44, firstName: 'Nofar' } } },
      },
    });

    const result = await groceryAPI.setPurchased(3, true, 'stale');

    expect(result.success).toBe(false);
    expect(result.status).toBe(409);
    expect(result.error.code).toBe('GROCERY_LOCKED');
    expect(result.error.lockedBy.firstName).toBe('Nofar');
  });

  it('turns a transport failure into a NETWORK_ERROR code, not a crash', async () => {
    mockGet.mockRejectedValue(new Error('Network Error'));

    const result = await groceryAPI.getState();

    expect(result.success).toBe(false);
    expect(result.error.code).toBe('NETWORK_ERROR');
    expect(result.status).toBe(0);
  });
});

describe('invitation endpoints', () => {
  it('previews with a GET — opening a link must not join anything', async () => {
    mockGet.mockResolvedValue(ok({ token: 'abc' }));

    await groceryAPI.previewInvitation('abc');

    expect(mockGet).toHaveBeenCalledWith('/grocery/invitations/abc');
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('accepts and declines with an explicit POST', async () => {
    mockPost.mockResolvedValue(ok({}));

    await groceryAPI.acceptInvitation('abc');
    await groceryAPI.declineInvitation('abc');

    expect(mockPost.mock.calls[0][0]).toBe('/grocery/invitations/abc/accept');
    expect(mockPost.mock.calls[1][0]).toBe('/grocery/invitations/abc/decline');
  });

  it('cancels an invitation by email in the request body', async () => {
    mockDelete.mockResolvedValue(ok({}));

    await groceryAPI.cancelInvite('nofar@example.com');

    expect(mockDelete).toHaveBeenCalledWith('/grocery/invitations', {
      data: { email: 'nofar@example.com' },
    });
  });
});

describe('trips', () => {
  it('completes the trip through the lease-guarded endpoint', async () => {
    mockPost.mockResolvedValue(ok({ trip: { id: 9 } }));

    await groceryAPI.completeTrip({ storeName: 'Rami Levy', totalIls: 312.4 }, 'tok');

    expect(mockPost).toHaveBeenCalledWith(
      '/grocery/trips/complete',
      { storeName: 'Rami Levy', totalIls: 312.4 },
      expect.objectContaining({ headers: expect.objectContaining({ 'X-Grocery-Lease': 'tok' }) }),
    );
  });

  it('uploads a receipt as multipart form data', async () => {
    mockPost.mockResolvedValue(ok({ hasReceipt: true }));
    const file = new File(['x'], 'receipt.pdf', { type: 'application/pdf' });

    await groceryAPI.uploadReceipt(9, file);

    const [url, body] = mockPost.mock.calls[0];
    expect(url).toBe('/grocery/trips/9/receipt');
    expect(body).toBeInstanceOf(FormData);
    expect(body.get('receipt')).toBe(file);
  });

  it('asks for a receipt URL instead of holding a permanent one', async () => {
    mockGet.mockResolvedValue(ok({ url: 'https://signed', expiresInSeconds: 300 }));

    const result = await groceryAPI.getReceiptUrl(9);

    expect(mockGet).toHaveBeenCalledWith('/grocery/trips/9/receipt');
    expect(result.data.expiresInSeconds).toBe(300);
  });
});

describe('multipart uploads', () => {
  // The shared axios instance defaults to Content-Type: application/json, and
  // axios 1.x reacts to that by running formDataToJSON on a FormData body —
  // serialising it and throwing the file away. The upload then reached the
  // server with no file at all. Clearing the header is the only thing that lets
  // the browser write `multipart/form-data; boundary=...`.
  it('clears the JSON content type when uploading an item photo', async () => {
    mockPost.mockResolvedValue(ok({ imageUrl: 'https://cdn/x.png' }));
    const file = new File(['x'], 'photo.png', { type: 'image/png' });

    await groceryAPI.uploadItemImage(file);

    const [, body, config] = mockPost.mock.calls[0];
    expect(body).toBeInstanceOf(FormData);
    expect(config.headers).toHaveProperty('Content-Type', undefined);
  });

  it('clears it for receipts too', async () => {
    mockPost.mockResolvedValue(ok({ hasReceipt: true }));
    const file = new File(['x'], 'receipt.pdf', { type: 'application/pdf' });

    await groceryAPI.uploadReceipt(9, file);

    const [, body, config] = mockPost.mock.calls[0];
    expect(body).toBeInstanceOf(FormData);
    expect(config.headers).toHaveProperty('Content-Type', undefined);
  });

  it('never sends a literal multipart content type — it would carry no boundary', async () => {
    mockPost.mockResolvedValue(ok({}));
    await groceryAPI.uploadItemImage(new File(['x'], 'p.png', { type: 'image/png' }));

    const [, , config] = mockPost.mock.calls[0];
    expect(config.headers['Content-Type']).not.toBe('multipart/form-data');
  });
});

describe('failure reporting is honest', () => {
  it('reports a timeout as a timeout, not as being offline', async () => {
    mockGet.mockRejectedValue(Object.assign(new Error('timeout of 45000ms exceeded'), {
      code: 'ECONNABORTED',
    }));

    const result = await groceryAPI.getState();

    expect(result.error.code).toBe('TIMEOUT');
    expect(result.status).toBe(0);
  });

  // Telling someone to check their wifi over a 413 or a proxy error page sent
  // them looking in entirely the wrong place.
  it('reports a server response without an error body by its status', async () => {
    mockPost.mockRejectedValue({ response: { status: 413, data: '<html>too large</html>' } });

    const result = await groceryAPI.uploadItemImage(new File(['x'], 'p.png', { type: 'image/png' }));

    expect(result.status).toBe(413);
    expect(result.error.code).toBe('HTTP_413');
  });

  it('still uses the server code when there is one', async () => {
    mockPost.mockRejectedValue({
      response: { status: 400, data: { error: { code: 'GROCERY_FILE_REQUIRED' } } },
    });

    const result = await groceryAPI.uploadItemImage(new File(['x'], 'p.png', { type: 'image/png' }));

    expect(result.error.code).toBe('GROCERY_FILE_REQUIRED');
  });

  it('only calls it a network error when no response came back at all', async () => {
    mockGet.mockRejectedValue(new Error('Network Error'));

    const result = await groceryAPI.getState();

    expect(result.error.code).toBe('NETWORK_ERROR');
  });
});
