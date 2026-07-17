import { describe, expect, it, vi } from 'vitest';

import { invalidateFinancialQueries } from '../useFinancialDataSync';

describe('financial data invalidation', () => {
  it('refreshes both salary-cycle query families after a bank sync', async () => {
    const queryClient = { invalidateQueries: vi.fn().mockResolvedValue(undefined) };

    await invalidateFinancialQueries(queryClient);

    const keys = queryClient.invalidateQueries.mock.calls.map(([input]) => input.queryKey);
    expect(keys).toContainEqual(['financial-cycle']);
    expect(keys).toContainEqual(['cycles']);
  });
});
