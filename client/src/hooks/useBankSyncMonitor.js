import { useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';

import bankConnectionsApi from '../api/bankConnections';
import { getAccessToken } from '../auth/tokenStorage';
import { useAuthStore } from '../stores/authStore';
import { emitFinancialDataUpdated } from './useFinancialDataSync';

/**
 * App-level sync monitor. It shares the Bank Sync page's React Query cache,
 * polls quickly only while a job is active, and refreshes every financial
 * surface as soon as a connection's last_sync_at advances.
 */
export function useBankSyncMonitor() {
  const { isAuthenticated, user } = useAuthStore();
  const previousSyncStamp = useRef(null);

  const query = useQuery({
    queryKey: ['bankConnections', user?.id],
    queryFn: bankConnectionsApi.list,
    enabled: isAuthenticated && Boolean(user?.id) && Boolean(getAccessToken()),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    refetchInterval: (currentQuery) => {
      const connections = currentQuery.state.data || [];
      const active = connections.some((connection) =>
        ['pending', 'running'].includes(connection.latest_job_status),
      );
      return active ? 8_000 : 60_000;
    },
  });

  const latestSyncStamp = useMemo(
    () => (query.data || [])
      .map((connection) => connection.last_sync_at || '')
      .sort()
      .slice(-1)[0] || '',
    [query.data],
  );

  useEffect(() => {
    if (
      latestSyncStamp &&
      previousSyncStamp.current &&
      latestSyncStamp !== previousSyncStamp.current
    ) {
      emitFinancialDataUpdated({ source: 'bank-sync', syncedAt: latestSyncStamp });
    }
    if (latestSyncStamp) previousSyncStamp.current = latestSyncStamp;
  }, [latestSyncStamp]);

  return query;
}

export default useBankSyncMonitor;

