import React from 'react';
import PageSkeleton from '../ui/PageSkeleton';

// Map Suspense route names → PageSkeleton page types.
// This replaces the old translation-based fallback that showed raw i18n keys
// ("errors.loadingPage", "Loading transactions...") when the translation store
// hadn't initialized yet.
const ROUTE_SKELETON_MAP = {
  dashboard: 'dashboard',
  transactions: 'transactions',
  analytics: 'analytics',
  profile: 'profile',
  shopping: 'shopping',
  'bank sync': 'profile',
  'admin dashboard': 'admin',
  'user management': 'admin',
  'activity log': 'admin',
  'system statistics': 'admin',
  'admin settings': 'admin',
};

export const RouteLoadingFallback = ({ route = 'page' }) => {
  const page = ROUTE_SKELETON_MAP[route];
  if (page) return <PageSkeleton page={page} />;
  // Auth / misc routes — just a plain spinner, no text, no translation dependency
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );
};

export default RouteLoadingFallback;
