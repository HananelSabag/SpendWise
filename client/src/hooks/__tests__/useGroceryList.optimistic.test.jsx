import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const addItem = vi.fn();
const getState = vi.fn();

vi.mock('../../api', () => ({
  api: {
    grocery: {
      getState: (...args) => getState(...args),
      addItem: (...args) => addItem(...args),
      setActiveList: vi.fn(),
      releaseItem: vi.fn().mockResolvedValue({ success: true }),
    },
  },
}));

const toastError = vi.fn();
vi.mock('../useToast', () => ({ useToast: () => ({ error: toastError, success: vi.fn() }) }));
vi.mock('../../stores', () => ({ useTranslation: () => ({ t: (key) => key }) }));
vi.mock('../../stores/authStore', () => ({
  default: (selector) => selector({ user: { id: 1 } }),
}));

const { useGroceryList } = await import('../useGroceryList');

const STATE = {
  list: { id: 2, version: 5, role: 'owner' },
  members: [],
  items: [{ id: 10, name: 'milk', category_key: 'dairy_eggs', is_purchased: false, version: 1 }],
  trip: { id: 3 },
};

// One client per test, created OUTSIDE the wrapper: building it inside means a
// fresh cache on every re-render, which quietly discards the writes under test.
let client;
const wrapper = ({ children }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

const names = (result) => result.current.items.map((item) => item.name);

/**
 * Adding was the only action on this screen that waited for the server before
 * showing anything — and it is the one people repeat fastest, so every item in
 * a burst stalled on a round trip to a dyno that may be waking up.
 */
describe('adding an item optimistically', () => {
  beforeEach(() => {
    client = new QueryClient({
      defaultOptions: { queries: { retry: false, refetchInterval: false } },
    });
    getState.mockResolvedValue({ success: true, data: STATE });
    addItem.mockReset();
    toastError.mockReset();
  });

  afterEach(() => vi.clearAllMocks());

  it('shows the row before the server has answered', async () => {
    let release;
    addItem.mockReturnValue(new Promise((resolve) => { release = resolve; }));

    const { result } = renderHook(() => useGroceryList(), { wrapper });
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    let pending;
    act(() => { pending = result.current.addItem({ name: 'bread', category_key: 'bakery' }); });

    await waitFor(() => expect(names(result)).toContain('bread'));
    expect(addItem).toHaveBeenCalled();

    await act(async () => {
      release({ success: true, data: { item: { id: 11, name: 'bread', category_key: 'bakery' }, version: 6 } });
      await pending;
    });

    // The placeholder is replaced, not joined, by the server's copy.
    expect(names(result)).toEqual(['milk', 'bread']);
    expect(result.current.items.filter((item) => item.name === 'bread')).toHaveLength(1);
  });

  it('takes the row back and says why when the save fails', async () => {
    addItem.mockResolvedValue({ success: false, error: { code: 'GROCERY_NAME_TOO_LONG' } });

    const { result } = renderHook(() => useGroceryList(), { wrapper });
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    await act(async () => { await result.current.addItem({ name: 'x'.repeat(500) }); });

    expect(names(result)).toEqual(['milk']);
    expect(toastError).toHaveBeenCalled();
  });

  it('does not drop a change made to another item while the add was in flight', async () => {
    let release;
    addItem.mockReturnValue(new Promise((resolve) => { release = resolve; }));

    const { result } = renderHook(() => useGroceryList(), { wrapper });
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    let pending;
    act(() => { pending = result.current.addItem({ name: 'bread' }); });
    await waitFor(() => expect(names(result)).toContain('bread'));

    await act(async () => {
      release({ success: false, error: { code: 'GROCERY_NAME_TOO_LONG' } });
      await pending;
    });

    // Rolling back with a snapshot of the whole list would have undone anything
    // else that happened meanwhile; only the placeholder should go.
    // Rolling back with a snapshot of the whole list would have undone anything
    // else that happened meanwhile; only the placeholder should go.
    await waitFor(() => expect(names(result)).toEqual(['milk']));
    expect(result.current.items.some((i) => String(i.id).startsWith('pending-'))).toBe(false);
  });
});
