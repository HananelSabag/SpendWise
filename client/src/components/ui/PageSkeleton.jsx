/**
 * PageSkeleton — single, centralised skeleton loader for every page.
 *
 * Usage:
 *   import PageSkeleton from '@components/ui/PageSkeleton';
 *   if (isLoading && !data) return <PageSkeleton page="dashboard" />;
 *
 * Supported pages: dashboard | transactions | analytics | profile | shopping | admin
 *
 * Design rules:
 *  • Pure Tailwind — no custom CSS class dependencies
 *  • Matches each page's real background gradient and layout structure
 *  • animate-pulse shimmer, fully dark-mode aware
 *  • Mobile-first with responsive desktop adjustments
 */

import React from 'react';
import { cn } from '../../utils/helpers';

// ─── Atoms ────────────────────────────────────────────────────────────────────

const S = ({ className }) => (
  <div className={cn('animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700/60', className)} />
);

const T = ({ className }) => (
  <div className={cn('animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700/60', className)} />
);

// Every page uses this gradient background
const Shell = ({ children, className }) => (
  <div
    className={cn(
      'min-h-screen',
      'bg-gradient-to-br from-blue-50 via-white to-indigo-50',
      'dark:from-gray-950 dark:via-gray-900 dark:to-gray-950',
      className,
    )}
  >
    {children}
  </div>
);

// A bordered card box — matches the white cards on every page
const Card = ({ children, className }) => (
  <div
    className={cn(
      'bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700',
      className,
    )}
  >
    {children}
  </div>
);

// ─── Dashboard ────────────────────────────────────────────────────────────────

const DashboardSkeleton = () => (
  <Shell>
    <div className="max-w-2xl mx-auto px-4 pt-4 pb-32 space-y-4 lg:max-w-6xl lg:pt-6">
      {/* Balance card — large gradient card */}
      <S className="h-44 rounded-3xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700" />

      {/* 2×2 stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map(i => (
          <Card key={i} className="p-4">
            <S className="w-8 h-8 rounded-lg mb-3" />
            <T className="h-5 w-16 mb-2" />
            <T className="h-3 w-20" />
          </Card>
        ))}
      </div>

      {/* Quick-add row (mobile only) */}
      <div className="grid grid-cols-2 gap-3 lg:hidden">
        <S className="h-11 rounded-2xl" />
        <S className="h-11 rounded-2xl" />
      </div>

      {/* "Recent" section header */}
      <T className="h-5 w-36 mt-1" />

      {/* Transaction rows */}
      {[0, 1, 2, 3, 4].map(i => (
        <Card key={i} className="flex items-center gap-3 p-4">
          <S className="w-10 h-10 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2 min-w-0">
            <T className="h-4 w-32" />
            <T className="h-3 w-20" />
          </div>
          <T className="h-4 w-16 shrink-0" />
        </Card>
      ))}
    </div>
  </Shell>
);

// ─── Transactions ─────────────────────────────────────────────────────────────

const TransactionsSkeleton = () => (
  <Shell>
    <div className="max-w-2xl mx-auto px-4 pt-4 pb-32 space-y-3 lg:max-w-4xl lg:pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <T className="h-7 w-44" />
        <S className="h-9 w-28 rounded-xl" />
      </div>

      {/* Filter / date bar */}
      <div className="flex gap-2">
        {[0, 1, 2, 3].map(i => (
          <S key={i} className="h-9 flex-1 rounded-xl" />
        ))}
      </div>

      {/* Month label */}
      <T className="h-3.5 w-24 mt-2" />

      {/* 7 transaction rows */}
      {[0, 1, 2, 3, 4, 5, 6].map(i => (
        <Card key={i} className="flex items-center gap-3 p-4">
          <S className="w-10 h-10 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2 min-w-0">
            <T className="h-4 w-36" />
            <T className="h-3 w-24" />
          </div>
          <T className="h-4 w-16 shrink-0" />
        </Card>
      ))}
    </div>
  </Shell>
);

// ─── Analytics ────────────────────────────────────────────────────────────────

const AnalyticsSkeleton = () => (
  <Shell>
    <div className="max-w-5xl mx-auto px-4 pt-4 pb-32 space-y-4 lg:pt-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map(i => (
          <Card key={i} className="p-4 space-y-2">
            <S className="w-8 h-8 rounded-lg" />
            <T className="h-6 w-20" />
            <T className="h-3 w-16" />
          </Card>
        ))}
      </div>

      {/* Main chart */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <T className="h-5 w-36" />
          <S className="h-8 w-32 rounded-lg" />
        </div>
        <S className="h-52 rounded-xl" />
      </Card>

      {/* Second chart */}
      <Card className="p-5">
        <T className="h-5 w-44 mb-4" />
        <S className="h-40 rounded-xl" />
      </Card>

      {/* Category breakdown 2-col */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[0, 1].map(i => (
          <Card key={i} className="p-5 space-y-3">
            <T className="h-5 w-36" />
            {[0, 1, 2, 3].map(j => (
              <div key={j} className="flex items-center gap-3">
                <S className="w-3 h-3 rounded-full shrink-0" />
                <T className="h-3 flex-1" />
                <T className="h-3 w-12 shrink-0" />
              </div>
            ))}
          </Card>
        ))}
      </div>
    </div>
  </Shell>
);

// ─── Profile ──────────────────────────────────────────────────────────────────

const ProfileSkeleton = () => (
  <Shell>
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-32 space-y-5">
      {/* Avatar + name */}
      <div className="flex flex-col items-center gap-3 py-4">
        <S className="w-24 h-24 rounded-3xl" />
        <T className="h-6 w-40" />
        <T className="h-4 w-28" />
      </div>

      {/* Tab selector */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl">
        {[0, 1, 2].map(i => (
          <S key={i} className="h-9 flex-1 rounded-xl" />
        ))}
      </div>

      {/* Form card */}
      <Card className="p-5 space-y-4">
        <T className="h-5 w-32" />
        {[0, 1, 2].map(i => (
          <div key={i} className="space-y-1.5">
            <T className="h-3 w-20" />
            <S className="h-11 rounded-xl" />
          </div>
        ))}
        <S className="h-11 rounded-xl" />
      </Card>
    </div>
  </Shell>
);

// ─── Shopping ─────────────────────────────────────────────────────────────────

const ShoppingSkeleton = () => (
  <Shell>
    <div className="max-w-2xl mx-auto px-4 pt-4 pb-32 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <T className="h-7 w-36" />
        <S className="h-9 w-24 rounded-xl" />
      </div>

      {/* Share / members bar */}
      <S className="h-14 rounded-2xl" />

      {/* Item rows */}
      {[0, 1, 2, 3, 4, 5].map(i => (
        <Card key={i} className="flex items-center gap-3 p-4">
          <S className="w-5 h-5 rounded shrink-0" />
          <T className="h-4 flex-1" />
          <T className="h-4 w-16 shrink-0" />
        </Card>
      ))}
    </div>
  </Shell>
);

// ─── Admin ────────────────────────────────────────────────────────────────────

const AdminSkeleton = () => (
  <Shell>
    <div className="max-w-6xl mx-auto px-4 pt-4 pb-24 space-y-5 lg:pt-6">
      {/* Page heading + action button */}
      <div className="flex items-center justify-between">
        <T className="h-7 w-48" />
        <S className="h-9 w-28 rounded-xl" />
      </div>

      {/* 4-stat summary row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map(i => (
          <Card key={i} className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <S className="w-8 h-8 rounded-lg" />
              <T className="h-3 w-12" />
            </div>
            <T className="h-6 w-20" />
            <T className="h-3 w-24" />
          </Card>
        ))}
      </div>

      {/* Main table card */}
      <Card className="p-5 space-y-3">
        {/* Table header */}
        <div className="flex items-center justify-between mb-2">
          <T className="h-5 w-32" />
          <S className="h-8 w-40 rounded-lg" />
        </div>
        {/* Table rows */}
        {[0, 1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="flex items-center gap-4 py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
            <S className="w-8 h-8 rounded-full shrink-0" />
            <T className="h-4 w-32" />
            <T className="h-4 w-24 hidden sm:block" />
            <T className="h-4 flex-1 hidden lg:block" />
            <S className="h-6 w-16 rounded-full shrink-0" />
            <S className="h-7 w-7 rounded-lg shrink-0" />
          </div>
        ))}
      </Card>
    </div>
  </Shell>
);

// ─── Registry ─────────────────────────────────────────────────────────────────

const SKELETONS = {
  dashboard:    DashboardSkeleton,
  transactions: TransactionsSkeleton,
  analytics:    AnalyticsSkeleton,
  profile:      ProfileSkeleton,
  shopping:     ShoppingSkeleton,
  admin:        AdminSkeleton,
};

/**
 * PageSkeleton
 * @param {'dashboard'|'transactions'|'analytics'|'profile'|'shopping'|'admin'} page
 */
const PageSkeleton = ({ page = 'dashboard' }) => {
  const Comp = SKELETONS[page] ?? DashboardSkeleton;
  return <Comp />;
};

export default PageSkeleton;
