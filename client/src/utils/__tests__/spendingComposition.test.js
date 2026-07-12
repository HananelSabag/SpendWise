import { describe, expect, it } from 'vitest';

import { getCommittedSpendingComposition } from '../spendingComposition';

describe('getCommittedSpendingComposition', () => {
  it('reconciles every additive calendar-spending component to committed', () => {
    const result = getCommittedSpendingComposition({
      bankDirect: 1171.69,
      bankDirectPending: 1540.44,
      cardPosted: 4654.61,
      cardPending: 700,
      manual: 0,
      committed: 8066.74,
    });

    expect(result.partsTotal).toBe(8066.74);
    expect(result.reconciles).toBe(true);
  });

  it('detects a server/client composition mismatch at cent precision', () => {
    const result = getCommittedSpendingComposition({ bankDirect: 10, committed: 9.99 });
    expect(result.reconciles).toBe(false);
  });
});

