import React from 'react';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { shouldRetryQuery } from '../../api/errors';
import { useTransactionActions } from '../useTransactionActions';
import { useTransactions } from '../useTransactions';
import { useDashboard } from '../useDashboard';
import { FINANCIAL_QUERY_ROOTS } from '../useFinancialDataSync';

const mock = vi.hoisted(() => ({
  api: { getAll: vi.fn(), getDashboardData: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), freshBulkDelete: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('../../api', () => ({ api: { transactions: mock.api } }));
vi.mock('../../api/transactions', () => ({ default: mock.api }));
vi.mock('../../auth/tokenStorage', () => ({ getAccessToken: () => 'synthetic' }));
vi.mock('../../stores/authStore', () => ({ useAuthUser: () => ({ id: 99 }), useIsAuthenticated: () => true }));
vi.mock('../useToast', () => ({ useToast: () => mock.toast }));

let client;
const wrapper = ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
beforeEach(() => {
  vi.resetAllMocks();
  client = new QueryClient({ defaultOptions: { queries: { retry: shouldRetryQuery, retryDelay: 0 }, mutations: { retry: false } } });
});
afterEach(() => { cleanup(); client.clear(); });

describe('one transaction write pipeline', () => {
  it('does not load a hidden list, and refreshes each financial cache exactly once after saving', async () => {
    mock.api.create.mockResolvedValue({ success: true, data: { id: 123 } });
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useTransactionActions(), { wrapper });
    await act(async () => { await result.current.createTransaction({ amount: 10, type: 'expense' }); });
    expect(mock.api.getAll).not.toHaveBeenCalled();
    expect(invalidate.mock.calls.map(([input]) => input.queryKey)).toEqual(FINANCIAL_QUERY_ROOTS.map(root => [root]));
    expect(mock.toast.success).toHaveBeenCalledTimes(1);
  });
  it.each(['create', 'update', 'delete'])('rejects a failed %s without a success toast, refresh or retry', async (operation) => {
    mock.api[operation].mockResolvedValue({ success: false, error: { status: 400, code: 'VALIDATION_ERROR', message: 'Rejected' } });
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useTransactionActions(), { wrapper });
    await act(async () => {
      const request = operation === 'create' ? result.current.createTransaction({ amount: 10 })
        : operation === 'update' ? result.current.updateTransaction(1, { amount: 10 })
          : result.current.deleteTransaction(1, { transaction: { type: 'income' } });
      await expect(request).rejects.toMatchObject({ status: 400, code: 'VALIDATION_ERROR' });
    });
    expect(mock.api[operation]).toHaveBeenCalledTimes(1);
    expect(invalidate).not.toHaveBeenCalled();
    expect(mock.toast.success).not.toHaveBeenCalled();
    expect(mock.toast.error).toHaveBeenCalledTimes(1);
  });
  it('exposes list errors instead of presenting an empty successful account', async () => {
    mock.api.getAll.mockResolvedValue({ success: false, error: { status: 403, code: 'FORBIDDEN' } });
    const { result } = renderHook(() => useTransactions(), { wrapper });
    await waitFor(() => expect(result.current.error?.status).toBe(403));
    expect(mock.api.getAll).toHaveBeenCalledTimes(1);
  });
  it('bounds dashboard retries when an API envelope reports a network failure', async () => {
    mock.api.getDashboardData.mockResolvedValue({ success: false, error: { status: 0, code: 'NETWORK_ERROR' } });
    const { result } = renderHook(() => useDashboard(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mock.api.getDashboardData).toHaveBeenCalledTimes(3);
    expect(result.current.data).toBeNull();
  });
});
