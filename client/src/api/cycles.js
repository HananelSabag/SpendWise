/**
 * Financial cycles API — client wrappers for /cycles.
 *
 * This is the salary-anchored view (FINANCIAL_CYCLE_SPEC.md): every cycle runs from one
 * salary to the next, and reports three lines that are all true at once — operating net
 * (how you actually live), financing (borrowed money you owe back), and bank movement
 * (which always equals the real account delta).
 */

import api from './client.js';

export const cyclesApi = {
  /**
   * Every cycle for the user, newest last, plus the standing facts the control centre needs:
   * derived loans, series awaiting a label, salary tracking and job-change suspicion.
   */
  list: () => api.get('/cycles').then((r) => r.data),

  /** Just the running cycle — the dashboard hot path. */
  current: () => api.get('/cycles/current').then((r) => r.data),

  /** Persist the user's answer about one ambiguous credit. */
  classifyCredit: (transactionId, classification) =>
    api.put(`/cycles/credits/${transactionId}/classification`, classification).then((r) => r.data),
};

export default cyclesApi;
