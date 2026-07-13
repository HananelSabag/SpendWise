import { useQuery } from '@tanstack/react-query';

import transactionAPI from '../api/transactions';
import { getAccessToken } from '../auth/tokenStorage';
import { queryConfigs } from '../config/queryClient';
import { useAuthStore } from '../stores/authStore';

export function useCalendarMonthDetails(periodOffset = 0, group = null) {
  const { isAuthenticated, user } = useAuthStore();
  return useQuery({
    queryKey: ['calendar-month-details', user?.id, periodOffset, group],
    enabled: isAuthenticated && !!getAccessToken() && Boolean(group),
    queryFn: async () => {
      const result = await transactionAPI.getCalendarMonthDetails({ periodOffset, group });
      if (!result.success) throw new Error(result.error?.message || 'Failed to load calendar details');
      return result.data;
    },
    ...queryConfigs.dashboard,
  });
}

export default useCalendarMonthDetails;
