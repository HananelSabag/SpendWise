import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import ModernDashboard from '../ModernDashboard';

const mock = vi.hoisted(() => ({ refresh: null, dashboard: vi.fn(), cycle: vi.fn(), balance: vi.fn(), notify: vi.fn() }));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('../../stores', () => ({
  useTranslation: () => ({ t: key => key, currentLanguage: 'he' }),
  useCurrency: () => ({ formatCurrency: String }),
  useNotifications: () => ({ addNotification: mock.notify }),
}));
vi.mock('../../hooks/useDashboard', () => ({ useDashboard: () => ({ data: { recentTransactions: [] }, refresh: mock.dashboard }) }));
vi.mock('../../hooks/useCycles', () => ({ useCurrentCycle: () => ({ refetch: mock.cycle }), useCycleControls: () => ({}) }));
vi.mock('../../hooks/useBankBalance', () => ({ useBankBalance: () => ({ refetch: mock.balance }) }));
vi.mock('../../hooks/useIsMobile', () => ({ useIsMobile: () => true }));
vi.mock('../../components/ui', () => ({ PageSkeleton: () => null }));
vi.mock('../../components/features/dashboard/usePullToRefresh', () => ({ usePullToRefresh: (refresh) => { mock.refresh = refresh; return { pull: 0 }; } }));
vi.mock('../../components/features/dashboard/ModernBalancePanel', () => ({ default: () => null }));
vi.mock('../../components/features/dashboard/FinancialCycleSnapshotV2', () => ({ default: () => null }));
vi.mock('../../components/features/dashboard/OverdraftRunwayCard', () => ({ default: () => null }));
vi.mock('../../components/features/dashboard/ModernRecentTransactionsWidget', () => ({ default: () => <div>Recent</div> }));
beforeEach(() => {
  vi.resetAllMocks();
  mock.dashboard.mockResolvedValue({ success: true });
  mock.cycle.mockResolvedValue({ isError: false });
  mock.balance.mockResolvedValue({ isError: false });
});
afterEach(cleanup);

it('refreshes recent transactions, cycle and bank balance exactly once', async () => {
  render(<ModernDashboard />);
  await act(async () => { await mock.refresh(); });
  for (const refresh of [mock.dashboard, mock.cycle, mock.balance]) expect(refresh).toHaveBeenCalledTimes(1);
  expect(mock.notify).not.toHaveBeenCalled();
});

it('reports a failed balance refresh without hiding the last rendered dashboard', async () => {
  mock.balance.mockResolvedValue({ isError: true });
  render(<ModernDashboard />);
  await act(async () => { await mock.refresh(); });
  expect(mock.notify).toHaveBeenCalledWith(expect.objectContaining({ type: 'error', message: 'refreshError' }));
  expect(screen.getByText('Recent')).toBeInTheDocument();
});
