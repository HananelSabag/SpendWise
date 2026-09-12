import React from 'react';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { shouldRetryQuery } from '../../api/errors';
import { familyOverviewQueryKey, useFamilyBudget } from '../useFamilyBudget';

const mock = vi.hoisted(() => ({ user: { id: 99 }, api: { getOverview: vi.fn(), addItem: vi.fn() }, toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../../api', () => ({ api: { family: mock.api } }));
vi.mock('../../stores/authStore', () => ({ useAuthUser: () => mock.user }));
vi.mock('../../stores', () => ({ useTranslation: () => ({ t: key => key }) }));
vi.mock('../useToast', () => ({ useToast: () => mock.toast }));
let client;
const wrapper = ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
const overview = (available) => ({ members: [], items: [], balances: [], summary: { monthly: { available } } });
beforeEach(() => {
  vi.resetAllMocks(); mock.user = { id: 99 };
  client = new QueryClient({ defaultOptions: { queries: { retry: shouldRetryQuery, retryDelay: 0 }, mutations: { retry: false } } });
});
afterEach(() => { cleanup(); client.clear(); });

it('recognizes a forbidden account without retrying it as a network failure', async () => {
  mock.api.getOverview.mockResolvedValue({ success: false, status: 403, error: { code: 'FAMILY_FORBIDDEN' } });
  const { result } = renderHook(() => useFamilyBudget(), { wrapper });
  await waitFor(() => expect(result.current.forbidden).toBe(true));
  expect(mock.api.getOverview).toHaveBeenCalledTimes(1);
});

it('does not overwrite a successful save with a slower focus refresh', async () => {
  const key = familyOverviewQueryKey(99);
  client.setQueryData(key, overview(100));
  let finishRead; let finishWrite;
  mock.api.getOverview.mockImplementation(() => new Promise(resolve => { finishRead = resolve; }));
  mock.api.addItem.mockImplementation(() => new Promise(resolve => { finishWrite = resolve; }));
  const { result } = renderHook(() => useFamilyBudget(), { wrapper });
  let write; let read;
  act(() => { write = result.current.addItem({ name: 'Salary' }); });
  await waitFor(() => expect(mock.api.addItem).toHaveBeenCalledTimes(1));
  act(() => { read = result.current.refetch(); });
  await waitFor(() => expect(mock.api.getOverview).toHaveBeenCalledTimes(1));
  await act(async () => { finishWrite({ success: true, data: overview(200) }); await write; });
  await act(async () => { finishRead({ success: true, data: overview(100) }); await read; });
  expect(client.getQueryData(key).summary.monthly.available).toBe(200);
  await waitFor(() => expect(result.current.summary.monthly.available).toBe(200));
});

it('separates cache entries when the signed-in account changes', () => {
  client.setQueryData(familyOverviewQueryKey(99), overview(100));
  const { result, rerender } = renderHook(() => useFamilyBudget({ enabled: false }), { wrapper });
  expect(result.current.summary.monthly.available).toBe(100);
  mock.user = { id: 100 }; rerender();
  expect(result.current.summary).toBeNull();
});
