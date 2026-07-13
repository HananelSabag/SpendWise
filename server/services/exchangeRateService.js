const logger = require('../utils/logger');

const BOI_RATES_URL = 'https://www.boi.org.il/PublicApi/GetExchangeRates?';
const CACHE_MS = 6 * 60 * 60 * 1000;
let cached = null;

function parseRepresentativeRates(payload) {
  const rates = new Map();
  for (const item of payload?.exchangeRates || []) {
    const currency = String(item?.key || '').trim().toUpperCase();
    const rate = Number(item?.currentExchangeRate);
    const unit = Number(item?.unit) || 1;
    if (!currency || !Number.isFinite(rate) || rate <= 0 || unit <= 0) continue;
    rates.set(currency, {
      rate: rate / unit,
      source: 'boi_representative',
      asOf: item.lastUpdate || null,
    });
  }
  return rates;
}

async function getRepresentativeRates() {
  if (cached && cached.expiresAt > Date.now()) return cached.rates;
  try {
    const response = await fetch(BOI_RATES_URL, { signal: AbortSignal.timeout(2500) });
    if (!response.ok) throw new Error(`Bank of Israel returned HTTP ${response.status}`);
    const rates = parseRepresentativeRates(await response.json());
    if (!rates.size) throw new Error('Bank of Israel returned no usable rates');
    cached = { rates, expiresAt: Date.now() + CACHE_MS };
    return rates;
  } catch (error) {
    logger.warn('pending FX: representative-rate lookup unavailable', { error: error.message });
    return new Map();
  }
}

function resetRateCacheForTests() {
  cached = null;
}

module.exports = {
  BOI_RATES_URL,
  getRepresentativeRates,
  parseRepresentativeRates,
  resetRateCacheForTests,
};

