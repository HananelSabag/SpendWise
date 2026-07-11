const {
  CANDIDATE_SQL,
  previewPendingSettledDuplicates,
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
});
