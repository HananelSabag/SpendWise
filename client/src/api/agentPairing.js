/**
 * Agent Pairing API — client wrappers for /agent-pairing
 * Lets a user connect their own computer as their sync agent instead of
 * the shared Default Host. All calls are JWT-authenticated.
 */

import api from './client.js';

export const agentPairingApi = {
  /** Generate a fresh 8-character pairing code (10-minute expiry). */
  start: () =>
    api.post('/agent-pairing/start').then((r) => r.data),

  /** Current pairing state for the logged-in user. */
  status: () =>
    api.get('/agent-pairing/status').then((r) => r.data),

  /** Revert to the Default Host — the paired device's key can no longer be reached. */
  unpair: () =>
    api.post('/agent-pairing/unpair').then((r) => r.data),
};

export default agentPairingApi;
