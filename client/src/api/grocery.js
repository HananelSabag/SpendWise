/**
 * Shared grocery list API — /api/v1/grocery
 *
 * Two conventions the rest of the feature depends on:
 *
 * 1. Errors come back as `{ code, message, ...context }`. The `code` is stable
 *    and the UI translates it; `message` is an English developer fallback and is
 *    never shown to a user.
 * 2. There is no list-level lock. Adding and checking off items are free for
 *    everyone at once; only editing ONE item is claimed, and a lost update on
 *    it is rejected by the item's `version`.
 */

import apiClient from './client.js';

const SESSION_HEADER = 'X-Grocery-Session';
const LIST_HEADER = 'X-Grocery-List';

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
const multipartFor = () => ({
  headers: { ...groceryHeaders(), 'Content-Type': undefined },
});

/**
 * Which of the user's lists this client is showing.
 *
 * A person can be on more than one list, and the server would otherwise have to
 * guess from "most recently opened" — which is wrong the moment two tabs are on
 * two different lists. `useGroceryList` sets this from whatever `/state` last
 * returned, so requests always name the list the user can actually see.
 *
 * It is a hint, not authority: the server resolves it through membership and
 * falls back to the caller's own list.
 */
let activeListId = null;

const setActiveList = (id) => { activeListId = id == null ? null : String(id); };

/**
 * Headers for every request that operates on a list.
 *
 * Both are custom `X-` headers, which makes these requests preflighted — they
 * must stay listed in the server's CORS `allowedHeaders` or the browser fails
 * them with status 0 and no server log at all.
 */
const groceryHeaders = (extra = {}) => ({
  [SESSION_HEADER]: sessionId,
  ...(activeListId ? { [LIST_HEADER]: activeListId } : {}),
  ...extra,
});

const ok = (response) => ({
  success: true,
  data: response.data?.data,
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
  setActiveList,

  // ─── State ────────────────────────────────────────────────────────────────

  /**
   * `version` turns the poll into a conditional request: the server answers
   * `{ unchanged: true }` when nothing moved, which is what keeps a 4-second
   * interval cheap on a free-tier dyno.
   */
  getState: (version) => call(() => apiClient.client.get('/grocery/state', {
    params: version != null ? { version } : {},
    headers: groceryHeaders(),
  })),

  // ─── Items ────────────────────────────────────────────────────────────────

  addItem: (data) =>
    call(() => apiClient.client.post('/grocery/items', data, { headers: groceryHeaders() })),

  updateItem: (id, data) =>
    call(() => apiClient.client.patch(`/grocery/items/${id}`, data, { headers: groceryHeaders() })),

  setPurchased: (id, purchased) =>
    call(() => apiClient.client.post(`/grocery/items/${id}/purchase`, { purchased }, { headers: groceryHeaders() })),

  deleteItem: (id) =>
    call(() => apiClient.client.delete(`/grocery/items/${id}`, { headers: groceryHeaders() })),

  // ─── Per-item edit claim ──────────────────────────────────────────────────

  claimItem: (id) =>
    call(() => apiClient.client.post(`/grocery/items/${id}/claim`, {}, { headers: groceryHeaders() })),

  releaseItem: (id) =>
    call(() => apiClient.client.delete(`/grocery/items/${id}/claim`, { headers: groceryHeaders() })),

  // ─── Trips ────────────────────────────────────────────────────────────────

  completeTrip: (payload) =>
    call(() => apiClient.client.post('/grocery/trips/complete', payload, { headers: groceryHeaders() })),

  getHistory: (params = {}) =>
    call(() => apiClient.client.get('/grocery/trips', { params, headers: groceryHeaders() })),

  getTripDetail: (id) =>
    call(() => apiClient.client.get(`/grocery/trips/${id}`, { headers: groceryHeaders() })),

  getReceiptUrl: (id) =>
    call(() => apiClient.client.get(`/grocery/trips/${id}/receipt`, { headers: groceryHeaders() })),

  uploadReceipt: (id, file) => {
    const form = new FormData();
    form.append('receipt', file);
    return call(() => apiClient.client.post(`/grocery/trips/${id}/receipt`, form, multipartFor()));
  },

  linkToSpendWise: (id) =>
    call(() => apiClient.client.post(`/grocery/trips/${id}/spendwise`, {}, { headers: groceryHeaders() })),

  // ─── Item photo + product link ────────────────────────────────────────────

  uploadItemImage: (file) => {
    const form = new FormData();
    form.append('itemImage', file);
    return call(() => apiClient.client.post('/grocery/items/image', form, multipartFor()));
  },

  scrapeUrl: (url) =>
    call(() => apiClient.client.post('/grocery/scrape-url', { url }, { headers: groceryHeaders() })),

  parseHtml: (html, url) =>
    call(() => apiClient.client.post('/grocery/parse-html', { html, url }, { headers: groceryHeaders() })),

  // ─── Sharing ──────────────────────────────────────────────────────────────

  // The primary way to share: one recipient-less link, created on demand.
  createShareLink: () =>
    call(() => apiClient.client.post('/grocery/invitations/link', {}, { headers: groceryHeaders() })),

  getShareLink: () =>
    call(() => apiClient.client.get('/grocery/invitations/link', { headers: groceryHeaders() })),

  revokeShareLink: () =>
    call(() => apiClient.client.delete('/grocery/invitations/link', { headers: groceryHeaders() })),

  invite: (email) =>
    call(() => apiClient.client.post('/grocery/invitations', { email }, { headers: groceryHeaders() })),

  cancelInvite: (email) =>
    call(() => apiClient.client.delete('/grocery/invitations', { data: { email }, headers: groceryHeaders() })),

  // ─── The lists this person can open ───────────────────────────────────────
  // Neither is list-scoped: `getLists` is about the person, and `openList` has
  // to work while the list being switched away from is still the current one.

  getLists: () =>
    call(() => apiClient.client.get('/grocery/lists')),

  openList: (id) =>
    call(() => apiClient.client.post(`/grocery/lists/${id}/open`, {})),

  getMyInvitations: () =>
    call(() => apiClient.client.get('/grocery/invitations')),

  previewInvitation: (token) =>
    call(() => apiClient.client.get(`/grocery/invitations/${token}`)),

  acceptInvitation: (token) =>
    call(() => apiClient.client.post(`/grocery/invitations/${token}/accept`, {})),

  declineInvitation: (token) =>
    call(() => apiClient.client.post(`/grocery/invitations/${token}/decline`, {})),

  getMembers: () =>
    call(() => apiClient.client.get('/grocery/members', { headers: groceryHeaders() })),

  removeMember: (userId) =>
    call(() => apiClient.client.delete(`/grocery/members/${userId}`, { headers: groceryHeaders() })),

  leave: () =>
    call(() => apiClient.client.post('/grocery/leave', {}, { headers: groceryHeaders() })),

  disband: () =>
    call(() => apiClient.client.delete('/grocery/members', { headers: groceryHeaders() })),
};

export default groceryAPI;
