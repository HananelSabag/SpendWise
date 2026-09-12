import React, { Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../stores';
import { RouteErrorBoundary } from './RouteErrorBoundary';
import { RouteLoadingFallback } from './RouteLoadingFallback';
import * as LazyComponents from '../LazyComponents';
import { HOME_REDIRECT_KEY } from '../../utils/sessionFlags';

/**
 * Handles "/" for authenticated users: the dashboard, unless this account has
 * somewhere else it prefers to land — honoured once per browser session, so "/"
 * stays usable as an ordinary nav target afterwards rather than always bouncing.
 *
 * This used to also ask, on a first run, which of two apps the account should
 * open as. There is one app now; the grocery list moved out to its own.
 */
export const HomeRoute = () => {
  const { user } = useAuth();

  if (!sessionStorage.getItem(HOME_REDIRECT_KEY)) {
    sessionStorage.setItem(HOME_REDIRECT_KEY, '1');
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
