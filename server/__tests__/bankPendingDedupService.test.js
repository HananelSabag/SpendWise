const {
  CANDIDATE_SQL,
  RETIRE_SQL,
  previewPendingSettledDuplicates,
  retirePendingSettledDuplicate,
} = require('../services/bankPendingDedupService');

describe('pending-to-settled bank dedup preview', () => {
  test('requires a status transition and the exact same day', () => {
    expect(CANDIDATE_SQL).toContain("stale.bank_status = 'pending'");
    expect(CANDIDATE_SQL).toContain("settled.bank_status = 'completed'");
    // The same merchant and amount on two neighbouring days is a real pair of purchases, not a
    // duplicate — a ±3 day window nearly retired a genuine still-pending ₪58 charge as the
    // previous day's ghost. Retirement demands the exact day.
    expect(CANDIDATE_SQL).toContain('settled.date = stale.date');
    expect(CANDIDATE_SQL).not.toContain('ABS(settled.date - stale.date) <= 3');
  });

  test('accepts all three ways a hold loses its identity, not just the suffix re-key', () => {
    // suffix re-key (45061616 -> 61616): the old id survives inside the new one.
    expect(CANDIDATE_SQL).toContain('RIGHT(');
    // silent re-key (416173003 -> 160717) and card holds (no identifier at all) leave no id
    // trail; the proof is that a later sync inserted the twin and never touched this row.
    expect(CANDIDATE_SQL).toContain('stale.updated_at < settled.created_at');
    expect(RETIRE_SQL).toContain('stale.updated_at < settled.created_at');
    // Card holds carry no identifier, so requiring one blinded the tool to every one of them.
    expect(CANDIDATE_SQL).not.toContain('AND stale.bank_sync_id IS NOT NULL');
  });

  test('pairs holds to twins one-to-one so a second real purchase is never swallowed', () => {
    expect(CANDIDATE_SQL).toContain('peer.id <= stale.id');
    expect(CANDIDATE_SQL).toContain('peer.id <= settled.id');
  });

  test('is read-only and returns query rows', async () => {
    const queryable = { query: jest.fn(async () => ({ rows: [{ stale_id: 2470, settled_id: 2885 }] })) };
    await expect(previewPendingSettledDuplicates(1, queryable)).resolves.toEqual([
      { stale_id: 2470, settled_id: 2885 },
    ]);
    expect(queryable.query).toHaveBeenCalledWith(CANDIDATE_SQL, [1]);
    expect(CANDIDATE_SQL).not.toMatch(/\bUPDATE\b|\bDELETE\b/);
  });

  test('retires only an exact still-valid pair and remains reversible', async () => {
    const queryable = { query: jest.fn(async () => ({ rows: [{ retired_id: 2470 }] })) };
    await expect(retirePendingSettledDuplicate(2470, 2885, queryable)).resolves.toEqual({ retired_id: 2470 });
    expect(queryable.query).toHaveBeenCalledWith(RETIRE_SQL, [2470, 2885]);
    expect(RETIRE_SQL).toContain('SET deleted_at = NOW()');
    expect(RETIRE_SQL).not.toMatch(/\bDELETE\s+FROM\b/);
    expect(RETIRE_SQL).toContain("settled.bank_status = 'completed'");
  });

  test('refuses retirement when the pair no longer satisfies every guard', async () => {
    const queryable = { query: jest.fn(async () => ({ rows: [] })) };
    await expect(retirePendingSettledDuplicate(2470, 2885, queryable))
      .rejects.toThrow('no longer matches; nothing retired');
  });
});
