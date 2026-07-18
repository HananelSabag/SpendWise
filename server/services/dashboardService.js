/** Minimal dashboard shell: the balance and financial cycle have dedicated cached APIs. */

const { Transaction } = require('../models/Transaction');

const CACHE_TTL_MS = 15_000;
const MAX_CACHE_ENTRIES = 200;
const cache = new Map();

async function buildDashboardData(userId) {
  const cached = cache.get(userId);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const recentTransactions = await Transaction.getRecent(userId, 10);
  const value = {
    recent_transactions: recentTransactions,
    metadata: {
      generated_at: new Date().toISOString(),
      model: 'financial_home_v2',
    },
  };
  const now = Date.now();
  for (const [candidate, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(candidate);
  }
  while (!cache.has(userId) && cache.size >= MAX_CACHE_ENTRIES) {
    cache.delete(cache.keys().next().value);
  }
  cache.set(userId, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}

function invalidateDashboardCache(userId) {
  cache.delete(userId);
}

module.exports = { buildDashboardData, invalidateDashboardCache };
