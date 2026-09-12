import { beforeEach, expect, it, vi } from 'vitest';
import familyAPI from '../family';
import groceryAPI from '../grocery';

const mock = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('../client.js', () => ({ default: { ...mock, client: mock } }));
beforeEach(() => { vi.resetAllMocks(); });

it('keeps the normalized family access error through the API envelope', async () => {
  mock.get.mockRejectedValue({ status: 403, code: 'FAMILY_FORBIDDEN', message: 'Forbidden' });
  expect(await familyAPI.getOverview()).toMatchObject({ success: false, status: 403, error: { code: 'FAMILY_FORBIDDEN' } });
});

it('keeps grocery edit-claim conflict context instead of reporting a network outage', async () => {
  const error = { status: 409, code: 'ITEM_CLAIMED', editingBy: { id: 44 }, message: 'Claimed' };
  mock.post.mockRejectedValue(error);
  expect(await groceryAPI.claimItem(10)).toEqual({ success: false, status: 409, error });
});
