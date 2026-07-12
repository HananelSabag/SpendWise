/** Provider-captured FX facts for display; never estimates a market exchange rate. */
export function getForeignExchangeMetadata(transaction) {
  const originalAmount = Math.abs(Number(transaction?.original_amount));
  const chargedAmount = Math.abs(Number(transaction?.amount));
  const originalCurrency = String(transaction?.original_currency || '').trim().toUpperCase();
  const chargedCurrency = String(transaction?.charged_currency || '').trim().toUpperCase();

  if (!Number.isFinite(originalAmount) || originalAmount <= 0
    || !Number.isFinite(chargedAmount) || chargedAmount <= 0
    || !originalCurrency || !chargedCurrency || originalCurrency === chargedCurrency) {
    return null;
  }

  return {
    originalAmount,
    originalCurrency,
    chargedAmount,
    chargedCurrency,
    effectiveRate: chargedAmount / originalAmount,
  };
}
