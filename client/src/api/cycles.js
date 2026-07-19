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
  list: ({ years = 2 } = {}) => api.get('/cycles', { params: { years } }).then((r) => r.data),

  /** Just the running cycle — the dashboard hot path. */
  current: () => api.get('/cycles/current').then((r) => r.data),

  /** Years backed by either durable aggregates or currently available raw data. */
  years: () => api.get('/cycles/years').then((r) => r.data),

  /** Durable yearly review, with a live fallback for the running year. */
  yearly: (year) => api.get(`/cycles/yearly/${year}`).then((r) => r.data),

  /** Override one automatic cycle decision without changing the bank transaction itself. */
  classifyTransaction: (transactionId, classification) =>
    api.put(`/cycles/transactions/${transactionId}/classification`, classification).then((r) => r.data),

  /** Remove the override and let the engine decide again. */
  resetTransactionClassification: (transactionId) =>
    api.delete(`/cycles/transactions/${transactionId}/classification`).then((r) => r.data),
};

export default cyclesApi;
