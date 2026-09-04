import React, { Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../stores';
import { RouteErrorBoundary } from './RouteErrorBoundary';
import { RouteLoadingFallback } from './RouteLoadingFallback';
import * as LazyComponents from '../LazyComponents';
import { HOME_REDIRECT_KEY, getSessionFlag } from '../../utils/sessionFlags';
import { APP_MODE, hasChosenHome, resolveAppMode } from '../../utils/appMode';

const HomePickerScreen = React.lazy(() => import('../common/HomePickerScreen'));

/**
 * Handles "/" for authenticated users:
 *   1. Never asked which home they want → HomePickerScreen
 *   2. Otherwise redirect to their mode once per browser session, then Dashboard
 *
 * The once-per-session guard is what keeps "/" usable as a normal nav target
 * afterwards; without it a user in grocery mode could never reach the dashboard
 * by clicking a link.
 */
export const HomeRoute = () => {
  const { user } = useAuth();

  // Set by HomePickerScreen before it navigates, so this route doesn't bounce
  // back to the picker while the profile cache is still stale.
  const pickerDone = !!getSessionFlag('sw_picker_done');

  if (!hasChosenHome(user) && !user?.isAdmin && !pickerDone) {
    return (
      <Suspense fallback={null}>
        <HomePickerScreen />
      </Suspense>
    );
  }

  if (!sessionStorage.getItem(HOME_REDIRECT_KEY)) {
    sessionStorage.setItem(HOME_REDIRECT_KEY, '1');
    if (resolveAppMode(user) === APP_MODE.GROCERY) return <Navigate to="/grocery" replace />;
    if (user?.preferences?.default_home === 'transactions') return <Navigate to="/transactions" replace />;
    if (user?.isAdmin) return <Navigate to="/admin" replace />;
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
