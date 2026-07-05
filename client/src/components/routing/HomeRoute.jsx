import React, { Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../stores';
import { RouteErrorBoundary } from './RouteErrorBoundary';
import { RouteLoadingFallback } from './RouteLoadingFallback';
import * as LazyComponents from '../LazyComponents';
import { HOME_REDIRECT_KEY, getSessionFlag } from '../../utils/sessionFlags';

const HomePickerScreen = React.lazy(() => import('../common/HomePickerScreen'));

// Handles "/" for authenticated users:
//   1. New users (no preference set) → HomePickerScreen
//   2. Returning users → redirect to saved preference ONCE per session, then Dashboard
export const HomeRoute = () => {
  const { user } = useAuth();
  const prefs = user?.preferences || {};
  const hasChosen      = prefs.home_preference_set === true;
  const legacyShopping = prefs.shopping_list_as_default_page === true;
  const defaultHome    = prefs.default_home;

  // pickerDone: set by HomePickerScreen before navigating, prevents loop while
  // React Query cache is still stale and hasn't received the updateProfile response yet.
  const pickerDone = !!getSessionFlag('sw_picker_done');

  // Show home picker only to users who haven't chosen yet (and didn't just choose this session)
  if (!hasChosen && !defaultHome && !legacyShopping && !user?.isAdmin && !pickerDone) {
    return (
      <Suspense fallback={null}>
        <HomePickerScreen />
      </Suspense>
    );
  }

  // Once per browser session: redirect to saved preference
  // After that, "/" always shows the Dashboard so nav links work normally
  if (!sessionStorage.getItem(HOME_REDIRECT_KEY)) {
    sessionStorage.setItem(HOME_REDIRECT_KEY, '1');
    if (defaultHome === 'shopping' || legacyShopping) return <Navigate to="/shopping"     replace />;
    if (defaultHome === 'transactions')               return <Navigate to="/transactions" replace />;
    if (user?.isAdmin)                                return <Navigate to="/admin"         replace />;
  }

  return (
    <RouteErrorBoundary routeName="Dashboard">
      <Suspense fallback={<RouteLoadingFallback route="dashboard" />}>
        <LazyComponents.Dashboard />
      </Suspense>
    </RouteErrorBoundary>
  );
};

export default HomeRoute;
