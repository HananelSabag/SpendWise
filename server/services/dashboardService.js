/** Minimal dashboard shell: the balance and financial cycle have dedicated cached APIs. */

const { Transaction } = require('../models/Transaction');

const CACHE_TTL_MS = 15_000;
const MAX_CACHE_ENTRIES = 200;
const cache = new Map();

async function buildDashboardData(userId) {
  const key = String(userId);
  const cached = cache.get(key);
  if (cached?.pending) return cached.pending;
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const now = Date.now();
  for (const [candidate, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(candidate);
  }
  while (!cache.has(key) && cache.size >= MAX_CACHE_ENTRIES) {
    cache.delete(cache.keys().next().value);
  }
  const entry = {};
  cache.set(key, entry);
  entry.pending = (async () => {
    try {
      const recentTransactions = await Transaction.getRecent(userId, 10);
      const value = {
        recent_transactions: recentTransactions,
        metadata: { generated_at: new Date().toISOString(), model: 'financial_home_v2' },
      };
      // A mutation may invalidate this entry while its SELECT is still running.
      // That older result must never replace the post-mutation snapshot.
      if (cache.get(key) === entry) {
        entry.value = value;
        entry.expiresAt = Date.now() + CACHE_TTL_MS;
        delete entry.pending;
      }
      return value;
    } catch (error) {
      if (cache.get(key) === entry) cache.delete(key);
      throw error;
    }
  })();
  return entry.pending;
}

function invalidateDashboardCache(userId) {
  cache.delete(String(userId));
}

module.exports = { buildDashboardData, invalidateDashboardCache };
