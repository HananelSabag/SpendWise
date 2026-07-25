function finiteNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

/**
 * Compare a projected checking balance with a positive overdraft facility.
 *
 * Example: projected balance -6,000 and facility 5,000 leaves -1,000 of
 * headroom, meaning the account is expected to exceed the facility by 1,000.
 */
export function getOverdraftRunway(projectedBalance, overdraftLimit) {
  const balance = finiteNumber(projectedBalance);
  const limit = finiteNumber(overdraftLimit);
  const configured = limit !== null && limit >= 0;

  if (balance === null || !configured) {
    return {
      configured,
      balance,
      limit: configured ? limit : null,
      remaining: null,
      exceededBy: 0,
      used: null,
      usedPercent: null,
      status: 'unknown',
    };
  }

  const used = Math.max(0, -balance);
  const remaining = balance + limit;
  const exceededBy = Math.max(0, -remaining);
  const usedPercent = limit === 0
    ? (used > 0 ? Infinity : 0)
    : (used / limit) * 100;

  let status = 'safe';
  if (exceededBy > 0) status = 'exceeded';
  else if (usedPercent >= 70) status = 'warning';
  else if (used > 0) status = 'using';

  return {
    configured: true,
    balance,
    limit,
    remaining,
    exceededBy,
    used,
    usedPercent,
    status,
  };
}

export default getOverdraftRunway;
