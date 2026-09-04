/**
 * Shared grocery list API — /api/v1/grocery
 *
 * Two conventions the rest of the feature depends on:
 *
 * 1. Errors come back as `{ code, message, ...context }`. The `code` is stable
 *    and the UI translates it; `message` is an English developer fallback and is
 *    never shown to a user.
 * 2. Mutations carry the edit lease in `X-Grocery-Lease`. The server may mint a
 *    fresh one (when the list was free) and returns it in the same header, which
 *    `useGroceryList` picks up — so a first tap never needs an explicit "Edit".
 */

import apiClient from './client.js';

const SESSION_HEADER = 'X-Grocery-Session';
const LEASE_HEADER = 'X-Grocery-Lease';

/** One id per browser tab, so two tabs of the same user don't fight over a lease. */
const sessionId = (() => {
  try {
    const existing = sessionStorage.getItem('sw_grocery_session');
    if (existing) return existing;
    const fresh = `s-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
    sessionStorage.setItem('sw_grocery_session', fresh);
    return fresh;
  } catch {
    return `s-${Math.random().toString(36).slice(2, 10)}`;
  }
})();

/**
 * Required on every FormData request.
 *
 * The shared axios instance defaults to `Content-Type: application/json`, and
 * axios (1.x, `transformRequest`) reacts to a JSON content type by running
 * `formDataToJSON` — it serialises the FormData and **throws the file away**.
 * Clearing the header lets the browser set `multipart/form-data` with the
 * boundary, which is the only form multer can parse. Setting the header to the
 * literal string 'multipart/form-data' does not work either: without a boundary
 * the server cannot split the parts.
 */
const multipart = { headers: { 'Content-Type': undefined } };

const leaseHeaders = (token) => ({
  [SESSION_HEADER]: sessionId,
  ...(token ? { [LEASE_HEADER]: token } : {}),
});

const ok = (response) => ({
  success: true,
  data: response.data?.data,
  // A mutation that implicitly took the lease hands the token back here.
  leaseToken: response.headers?.[LEASE_HEADER.toLowerCase()] || null,
});

/**
 * Turn an axios failure into the `{ code }` shape the UI translates.
 *
 * Only a request that never got a response is a network problem. Reporting
 * "no connection" for a server response whose body simply had no `error` field
 * sent people to check their wifi over a 413 or a proxy error page — say the
 * status instead, and keep timeouts distinct from being offline.
 */
const failed = (error) => {
  const response = error?.response;

  if (response) {
    return {
      success: false,
      status: response.status,
      error: response.data?.error
        || { code: `HTTP_${response.status}`, message: error.message },
    };
  }

  const timedOut = error?.code === 'ECONNABORTED'
    || /timeout/i.test(error?.message || '');

  return {
    success: false,
    status: 0,
    error: {
      code: timedOut ? 'TIMEOUT' : 'NETWORK_ERROR',
      message: error?.message,
    },
  };
};

const call = async (fn) => {
  try {
    return ok(await fn());
  } catch (error) {
    return failed(error);
  }
};

const groceryAPI = {
  sessionId,

  // ─── State ────────────────────────────────────────────────────────────────

  /**
   * `version` turns the poll into a conditional request: the server answers
   * `{ unchanged: true }` when nothing moved, which is what keeps a 4-second
   * interval cheap on a free-tier dyno.
   */
  getState: (version) => call(() => apiClient.client.get('/grocery/state', {
    params: version != null ? { version } : {},
    headers: leaseHeaders(),
  })),

  // ─── Items ────────────────────────────────────────────────────────────────

  addItem: (data, leaseToken) =>
    call(() => apiClient.client.post('/grocery/items', data, { headers: leaseHeaders(leaseToken) })),

  updateItem: (id, data, leaseToken) =>
    call(() => apiClient.client.patch(`/grocery/items/${id}`, data, { headers: leaseHeaders(leaseToken) })),

  setPurchased: (id, purchased, leaseToken) =>
    call(() => apiClient.client.post(`/grocery/items/${id}/purchase`, { purchased }, { headers: leaseHeaders(leaseToken) })),

  deleteItem: (id, leaseToken) =>
    call(() => apiClient.client.delete(`/grocery/items/${id}`, { headers: leaseHeaders(leaseToken) })),

  // ─── Edit lease ───────────────────────────────────────────────────────────

  acquireLock: () =>
    call(() => apiClient.client.post('/grocery/lock', { sessionId }, { headers: leaseHeaders() })),

  heartbeatLock: (leaseToken) =>
    call(() => apiClient.client.post('/grocery/lock/heartbeat', {}, { headers: leaseHeaders(leaseToken) })),

  releaseLock: (leaseToken) =>
    call(() => apiClient.client.delete('/grocery/lock', { headers: leaseHeaders(leaseToken) })),

  // ─── Trips ────────────────────────────────────────────────────────────────

  completeTrip: (payload, leaseToken) =>
    call(() => apiClient.client.post('/grocery/trips/complete', payload, { headers: leaseHeaders(leaseToken) })),

  getHistory: (params = {}) =>
    call(() => apiClient.client.get('/grocery/trips', { params })),

  getTripDetail: (id) =>
    call(() => apiClient.client.get(`/grocery/trips/${id}`)),

  getReceiptUrl: (id) =>
    call(() => apiClient.client.get(`/grocery/trips/${id}/receipt`)),

  uploadReceipt: (id, file) => {
    const form = new FormData();
    form.append('receipt', file);
    return call(() => apiClient.client.post(`/grocery/trips/${id}/receipt`, form, multipart));
  },

  linkToSpendWise: (id) =>
    call(() => apiClient.client.post(`/grocery/trips/${id}/spendwise`, {})),

  // ─── Item photo + product link ────────────────────────────────────────────

  uploadItemImage: (file) => {
    const form = new FormData();
    form.append('itemImage', file);
    return call(() => apiClient.client.post('/grocery/items/image', form, multipart));
  },

  scrapeUrl: (url) =>
    call(() => apiClient.client.post('/grocery/scrape-url', { url })),

  parseHtml: (html, url) =>
    call(() => apiClient.client.post('/grocery/parse-html', { html, url })),

  // ─── Sharing ──────────────────────────────────────────────────────────────

  // The primary way to share: one recipient-less link, created on demand.
  createShareLink: () =>
    call(() => apiClient.client.post('/grocery/invitations/link', {})),

  getShareLink: () =>
    call(() => apiClient.client.get('/grocery/invitations/link')),

  revokeShareLink: () =>
    call(() => apiClient.client.delete('/grocery/invitations/link')),

  invite: (email) =>
    call(() => apiClient.client.post('/grocery/invitations', { email })),

  cancelInvite: (email) =>
    call(() => apiClient.client.delete('/grocery/invitations', { data: { email } })),

  getMyInvitations: () =>
    call(() => apiClient.client.get('/grocery/invitations')),

  previewInvitation: (token) =>
    call(() => apiClient.client.get(`/grocery/invitations/${token}`)),

  acceptInvitation: (token) =>
    call(() => apiClient.client.post(`/grocery/invitations/${token}/accept`, {})),

  declineInvitation: (token) =>
    call(() => apiClient.client.post(`/grocery/invitations/${token}/decline`, {})),

  getMembers: () =>
    call(() => apiClient.client.get('/grocery/members')),

  removeMember: (userId) =>
    call(() => apiClient.client.delete(`/grocery/members/${userId}`)),

  leave: () =>
    call(() => apiClient.client.post('/grocery/leave', {})),

  disband: () =>
    call(() => apiClient.client.delete('/grocery/members')),
};

export default groceryAPI;
