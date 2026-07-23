import { describe, expect, it } from 'vitest';

import { selectRecurringCandidates } from '../CycleRecurringPanelV2';

describe('selectRecurringCandidates', () => {
  it('shows the newest eligible transactions first', () => {
    const decisions = [
      { transactionId: 1, processedDate: '2026-07-10', amount: -100, classification: 'expense' },
      { transactionId: 3, processedDate: '2026-07-21', amount: -300, classification: 'expense' },
      { transactionId: 2, processedDate: '2026-07-20', amount: -200, classification: 'expense' },
    ];

    expect(selectRecurringCandidates(decisions).map((item) => item.transactionId)).toEqual([3, 2, 1]);
  });

  it('includes income but excludes settlements, locked rows, and already-linked transactions', () => {
    const decisions = [
      { transactionId: 1, processedDate: '2026-07-21', amount: -10, classification: 'card_settlement' },
      { transactionId: 2, processedDate: '2026-07-21', amount: 10, classification: 'income' },
      { transactionId: 3, processedDate: '2026-07-21', amount: -10, classification: 'expense', editable: false },
      { transactionId: 4, processedDate: '2026-07-21', amount: -10, classification: 'expense', recurrenceGroupId: 'group-1' },
      { transactionId: 5, processedDate: '2026-07-21', amount: -10, classification: 'expense' },
    ];

    expect(selectRecurringCandidates(decisions).map((item) => item.transactionId)).toEqual([5, 2]);
  });

  it('deduplicates transactions returned in more than one cycle payload', () => {
    const transaction = { transactionId: 8, processedDate: '2026-07-21', amount: -10, classification: 'expense' };
    expect(selectRecurringCandidates([transaction, transaction])).toHaveLength(1);
  });
});
