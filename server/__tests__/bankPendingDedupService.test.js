const {
  CANDIDATE_SQL,
  RETIRE_SQL,
  previewPendingSettledDuplicates,
  retirePendingSettledDuplicate,
} = require('../services/bankPendingDedupService');

describe('pending-to-settled bank dedup preview', () => {
  test('requires a status transition, close date, and identifier suffix', () => {
    expect(CANDIDATE_SQL).toContain("stale.bank_status = 'pending'");
    expect(CANDIDATE_SQL).toContain("settled.bank_status = 'completed'");
    expect(CANDIDATE_SQL).toContain('ABS(settled.date - stale.date) <= 3');
    expect(CANDIDATE_SQL).toContain('RIGHT(');
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
