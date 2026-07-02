/**
 * Bank Connections API — client wrappers for /bank-connections
 * All calls are JWT-authenticated via the shared api client.
 */

import api from './client.js';

export const bankConnectionsApi = {
  /** Agent public key used to seal credentials in the browser. */
  getPublicKey: () =>
    api.get('/bank-connections/public-key').then((r) => r.data.publicKey),

  /** List the user's connections (never includes credentials). */
  list: () =>
    api.get('/bank-connections').then((r) => r.data.connections || []),

  /**
   * Create/replace a connection.
   * @param {string} bankSource - yahav | isracard | max | discount
   * @param {string} encryptedCredentials - base64 envelope from sealCredentials()
   * @param {string} [displayName]
   */
  create: (bankSource, encryptedCredentials, displayName) =>
    api.post('/bank-connections', {
      bank_source: bankSource,
      encrypted_credentials: encryptedCredentials,
      display_name: displayName || undefined,
    }).then((r) => r.data.connection),

  /** Pause or resume. */
  setStatus: (id, status) =>
    api.patch(`/bank-connections/${id}`, { status }).then((r) => r.data.connection),

  rename: (id, displayName) =>
    api.patch(`/bank-connections/${id}`, { display_name: displayName }).then((r) => r.data.connection),

  /** Permanent delete — the ciphertext is gone forever. */
  remove: (id) =>
    api.delete(`/bank-connections/${id}`).then((r) => r.data),

  /** Enable/disable syncing a specific account under a connection. */
  setAccountEnabled: (id, accountNumber, enabled) =>
    api.patch(`/bank-connections/${id}/accounts/${encodeURIComponent(accountNumber)}`, { enabled })
      .then((r) => r.data.account),

  /** Queue a manual sync (server enforces 2/day + 3h gap). */
  syncNow: (id) =>
    api.post(`/bank-connections/${id}/sync`).then((r) => r.data.job),

  /** Recent sync jobs for the status UI. */
  jobs: () =>
    api.get('/bank-connections/jobs').then((r) => r.data.jobs || []),
};

export default bankConnectionsApi;
