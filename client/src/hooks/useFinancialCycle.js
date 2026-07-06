import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { api } from '../api';
import { useAuthStore } from '../stores/authStore';
import { getAccessToken } from '../auth/tokenStorage';

const normalizeCycle = (raw, userCycleDay) => {
  const cycleDay = Number(raw?.cycleDay ?? raw?.billing_cycle_day ?? userCycleDay) || 1;
  return {
    start: raw?.start || null,
    end: raw?.end || null,
    cycleDay,
    cycleDaySet: raw?.cycleDaySet ?? true,
  };
};

export const useFinancialCycle = () => {
  const { isAuthenticated, user } = useAuthStore();
  const userCycleDay = Number(user?.billing_cycle_day) || 1;
  const queryKey = useMemo(
    () => ['financialCycle', user?.id, userCycleDay],
    [user?.id, userCycleDay]
  );

  return useQuery({
    queryKey,
    enabled: isAuthenticated && !!getAccessToken(),
    queryFn: async () => {
      const result = await api.users.getFinancialCycle();
      if (!result.success) throw new Error(result.error?.message || 'Failed to fetch financial cycle');
      return normalizeCycle(result.data, userCycleDay);
    },
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    initialData: () => normalizeCycle(null, userCycleDay),
  });
};

export default useFinancialCycle;
