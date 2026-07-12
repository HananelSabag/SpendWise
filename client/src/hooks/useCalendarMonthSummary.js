import { keepPreviousData, useQuery } from '@tanstack/react-query';

import transactionAPI from '../api/transactions';
import { getAccessToken } from '../auth/tokenStorage';
import { queryConfigs } from '../config/queryClient';
import { useAuthStore } from '../stores/authStore';

export function useCalendarMonthSummary(periodOffset = 0) {
  const { isAuthenticated, user } = useAuthStore();
  return useQuery({
    queryKey: ['calendar-month-summary', user?.id, periodOffset],
    enabled: isAuthenticated && !!getAccessToken(),
    queryFn: async () => {
      const result = await transactionAPI.getCalendarMonthSummary({ periodOffset });
      if (!result.success) throw new Error(result.error?.message || 'Failed to load calendar month');
      return result.data;
    },
    placeholderData: keepPreviousData,
    ...queryConfigs.dashboard,
  });
}

export default useCalendarMonthSummary;
