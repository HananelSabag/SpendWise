/**
 * Family Hub API — /api/v1/family
 *
 * Errors come back as `{ code, message }`; the `code` is stable and the UI
 * translates it, the `message` is an English developer fallback and is never
 * shown to a user.
 *
 * Every mutation answers with the whole recomputed overview rather than just the
 * row that changed. The dataset is tens of rows, and the totals are the point of
 * the screen — refetching them separately is how two devices end up showing
 * different answers to "what's left this month".
 */

import apiClient from './client.js';

const ok = (response) => ({ success: true, data: response.data?.data });

const failed = (error) => {
  const response = error?.response;
  if (response) {
    return {
      success: false,
      status: response.status,
      error: response.data?.error || { code: `HTTP_${response.status}`, message: error.message },
    };
  }
  const timedOut = error?.code === 'ECONNABORTED' || /timeout/i.test(error?.message || '');
  return {
    success: false,
    status: 0,
    error: { code: timedOut ? 'TIMEOUT' : 'NETWORK_ERROR', message: error?.message },
  };
};

const call = async (fn) => {
  try {
    return ok(await fn());
  } catch (error) {
    return failed(error);
  }
};

const familyAPI = {
  /** Members, monthly rows, balances and the computed summary — one call. */
  getOverview: () => call(() => apiClient.get('/family/overview')),

  addItem: (data) => call(() => apiClient.post('/family/items', data)),
  updateItem: (id, data) => call(() => apiClient.patch(`/family/items/${id}`, data)),
  deleteItem: (id) => call(() => apiClient.delete(`/family/items/${id}`)),

  addBalance: (data) => call(() => apiClient.post('/family/balances', data)),
  updateBalance: (id, data) => call(() => apiClient.patch(`/family/balances/${id}`, data)),
  deleteBalance: (id) => call(() => apiClient.delete(`/family/balances/${id}`)),
};

export default familyAPI;
