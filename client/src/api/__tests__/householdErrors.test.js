import { beforeEach, expect, it, vi } from 'vitest';
import familyAPI from '../family';

const mock = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('../client.js', () => ({ default: { ...mock, client: mock } }));
beforeEach(() => { vi.resetAllMocks(); });

it('keeps the normalized family access error through the API envelope', async () => {
  mock.get.mockRejectedValue({ status: 403, code: 'FAMILY_FORBIDDEN', message: 'Forbidden' });
  expect(await familyAPI.getOverview()).toMatchObject({ success: false, status: 403, error: { code: 'FAMILY_FORBIDDEN' } });
});
