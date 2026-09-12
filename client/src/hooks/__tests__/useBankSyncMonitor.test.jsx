import React from 'react';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBankSyncMonitor } from '../useBankSyncMonitor';

const mock = vi.hoisted(() => ({ user: { id: 99 }, list: vi.fn(), emit: vi.fn() }));
vi.mock('../../api/bankConnections', () => ({ default: { list: mock.list } }));
vi.mock('../../auth/tokenStorage', () => ({ getAccessToken: () => 'synthetic' }));
vi.mock('../../stores/authStore', () => ({ useAuthUser: () => mock.user, useIsAuthenticated: () => true }));
vi.mock('../useFinancialDataSync', () => ({ emitFinancialDataUpdated: mock.emit }));
let client;
const wrapper = ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
const connections = (second = '2026-09-05') => [
  { id: 1, last_sync_at: '2026-09-07' }, { id: 2, last_sync_at: second },
];
beforeEach(() => {
  vi.resetAllMocks(); mock.user = { id: 99 };
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(['bankConnections', 99], connections());
});
afterEach(() => { cleanup(); client.clear(); });

it('refreshes when any source changes, even if another source has a later sync time', async () => {
  renderHook(() => useBankSyncMonitor(), { wrapper });
  expect(mock.emit).not.toHaveBeenCalled();
  act(() => { client.setQueryData(['bankConnections', 99], connections('2026-09-06')); });
  await waitFor(() => expect(mock.emit).toHaveBeenCalledTimes(1));
  act(() => { client.setQueryData(['bankConnections', 99], connections('2026-09-06').reverse()); });
  expect(mock.emit).toHaveBeenCalledTimes(1);
});

it('does not treat switching accounts as a bank synchronization', () => {
  const { rerender } = renderHook(() => useBankSyncMonitor(), { wrapper });
  client.setQueryData(['bankConnections', 100], connections('2026-09-06'));
  mock.user = { id: 100 }; rerender();
  expect(mock.emit).not.toHaveBeenCalled();
});
