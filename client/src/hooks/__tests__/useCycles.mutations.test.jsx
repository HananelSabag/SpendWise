import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import cyclesApi from '../../api/cycles';
import {
  CYCLE_QUERY_VERSION,
  currentCycleQueryKey,
  useCycleControls,
  useCycles,
} from '../useCycles';

const mocks = vi.hoisted(() => ({ error: vi.fn() }));
vi.mock('../../stores/authStore', () => ({
  useAuthUser: () => ({ id: 99 }),
  useIsAuthenticated: () => true,
}));
vi.mock('../../stores', () => ({ useTranslation: () => ({ t: (key) => key }) }));
vi.mock('../useToast', () => ({ useToast: () => ({ error: mocks.error }) }));
vi.mock('../../api/cycles', () => ({ default: { updateSettings: vi.fn(), control: vi.fn() } }));

let client;
const currentKey = currentCycleQueryKey(99);
const controlKey = ['cycles', 99, 'control', CYCLE_QUERY_VERSION];
const wrapper = ({ children }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

beforeEach(() => {
  vi.clearAllMocks();
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  for (const key of [currentKey, controlKey])
    client.setQueryData(key, {
      data: { status: 'ok', settings: { useEstimates: true }, recurringGroups: [] },
    });
});
afterEach(() => {
  cleanup();
  client.clear();
});

describe('cycle mutation lifecycle', () => {
  it('updates every mounted control immediately and revalidates an inactive panel on its next mount', async () => {
    let finish;
    cyclesApi.updateSettings.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    cyclesApi.control.mockResolvedValue({
      data: { status: 'ok', settings: { useEstimates: false }, recurringGroups: [{ id: 'fresh' }] },
    });
    const first = renderHook(() => useCycleControls(), { wrapper });
    const second = renderHook(() => useCycleControls(), { wrapper });
    act(() => first.result.current.updateCycleSettings({ useEstimates: false }));
    await waitFor(() =>
      expect(client.getQueryData(currentKey).data.settings.useEstimates).toBe(false),
    );
    expect(client.getQueryData(controlKey).data.settings.useEstimates).toBe(false);
    await waitFor(() => expect(second.result.current.isUpdatingSettings).toBe(true));
    await act(async () => finish({ data: { useEstimates: false } }));
    await waitFor(() => expect(first.result.current.isUpdatingSettings).toBe(false));
    expect(client.getQueryState(controlKey).isInvalidated).toBe(true);
    const panel = renderHook(() => useCycles(), { wrapper });
    await waitFor(() => expect(panel.result.current.recurringGroups).toEqual([{ id: 'fresh' }]));
    expect(cyclesApi.control).toHaveBeenCalledTimes(1);
  });

  it('restores both cached screens and shows an error when persistence fails', async () => {
    cyclesApi.updateSettings.mockRejectedValue(new Error('offline'));
    const controls = renderHook(() => useCycleControls(), { wrapper });
    await act(async () => {
      await expect(
        controls.result.current.updateCycleSettingsAsync({ useEstimates: false }),
      ).rejects.toThrow('offline');
    });
    for (const key of [currentKey, controlKey])
      expect(client.getQueryData(key).data.settings.useEstimates).toBe(true);
    expect(mocks.error).toHaveBeenCalledTimes(1);
  });
});
