const COMPONENT_KEYS = [
  'bankDirect',
  'bankDirectPending',
  'cardPosted',
  'cardPending',
  'manual',
];

const toAmount = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
};

const toCents = (value) => Math.round((toAmount(value) + Number.EPSILON) * 100);

export function getCommittedSpendingComposition(spending = {}) {
  const parts = COMPONENT_KEYS.map((key) => ({ key, value: toAmount(spending[key]) }));
  const partsCents = parts.reduce((sum, part) => sum + toCents(part.value), 0);
  const committedCents = toCents(spending.committed);

  return {
    parts,
    partsTotal: partsCents / 100,
    committed: committedCents / 100,
    reconciles: partsCents === committedCents,
  };
}

