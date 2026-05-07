import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, BarChart3, RefreshCw, Users, Activity, TrendingUp, DollarSign } from 'lucide-react';
import { useTranslation } from '../../stores';
import { api } from '../../api';
import { PageSkeleton } from '../../components/ui';
import { cn } from '../../utils/helpers';

const AdminStats = () => {
  const { t, isRTL } = useTranslation('admin');

  const { data: dashRes, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'dashboard-stats'],
    queryFn: async () => {
      const r = await api.admin.getDashboard();
      if (!r.success) throw new Error(r.error?.message || 'Failed');
      return r;
    },
    staleTime: 60000,
  });

  if (isLoading) return <PageSkeleton page="admin" />;

  const s   = dashRes?.data?.data?.users?.summary || {};
  const recent = dashRes?.data?.data?.users?.recent_users || [];

  const metrics = [
    {
      icon: Users,
      gradient: 'from-blue-500 to-indigo-600',
      label: t('stats.totalUsers',       { fallback: 'Total Users' }),
      value: (s.total_users || 0).toLocaleString(),
      sub:   `${s.verified_users || 0} ${t('stats.verified', { fallback: 'verified' })}`,
      subColor: 'text-green-600 dark:text-green-400',
    },
    {
      icon: TrendingUp,
      gradient: 'from-green-500 to-emerald-600',
      label: t('stats.newThisMonth', { fallback: 'New This Month' }),
      value: `+${s.new_users_month || 0}`,
      sub:   t('stats.registrations', { fallback: 'registrations' }),
      subColor: 'text-gray-500 dark:text-gray-400',
    },
    {
      icon: Activity,
      gradient: 'from-purple-500 to-violet-600',
      label: t('stats.totalTransactions', { fallback: 'Total Transactions' }),
      value: (s.total_transactions || 0).toLocaleString(),
      sub:   `+${s.transactions_month || 0} ${t('timeAgo.thisMonth', { fallback: 'this month' })}`,
      subColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      icon: DollarSign,
      gradient: 'from-orange-500 to-amber-600',
      label: t('stats.totalAmount', { fallback: 'Total Amount' }),
      value: `₪${(s.total_amount || 0).toLocaleString()}`,
      sub:   t('stats.allTime', { fallback: 'all time' }),
      subColor: 'text-gray-500 dark:text-gray-400',
    },
  ];

  const pills = [
    { label: t('stats.totalUsers',       { fallback: 'Users' }),       value: s.total_users || 0,        color: 'text-gray-700 dark:text-gray-200',     bg: 'bg-gray-100 dark:bg-gray-800' },
    { label: t('stats.totalTransactions',{ fallback: 'Transactions' }), value: s.total_transactions || 0, color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: t('stats.verified',         { fallback: 'Verified' }),     value: s.verified_users || 0,     color: 'text-green-700 dark:text-green-400',   bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: t('roles.admin',            { fallback: 'Admins' }),       value: s.admin_users || 0,        color: 'text-amber-700 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-900/20' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* ── Compact Header ─────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-3">
            <Link
              to="/admin"
              className="p-1.5 -ms-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors shrink-0"
            >
              {isRTL ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
            </Link>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white flex-1 truncate">
              {t('stats.title', { fallback: 'System Statistics' })}
            </h1>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
            </button>
          </div>

          <div className="flex gap-2 mt-3 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {pills.map(({ label, value, color, bg }) => (
              <div key={label} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full shrink-0', bg)}>
                <span className={cn('text-sm font-bold tabular-nums', color)}>{value}</span>
                <span className={cn('text-xs font-medium opacity-90', color)}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">

        {/* ── Metric Cards ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {metrics.map(({ icon: Icon, gradient, label, value, sub, subColor }) => (
            <div key={label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={cn('w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0', gradient)}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 leading-tight">{label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{value}</p>
              <p className={cn('text-xs mt-1 font-medium', subColor)}>{sub}</p>
            </div>
          ))}
        </div>

        {/* ── Recent Users ────────────────────────────────────────── */}
        {recent.length > 0 && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t('users.recentlyJoined', { fallback: 'Recently Joined' })}
                </span>
              </div>
              <Link to="/admin/users" className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
                {t('actions.viewAll', { fallback: 'View all' })}
              </Link>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {recent.slice(0, 5).map((u) => (
                <div key={u.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-white">
                        {(u.first_name?.[0] || u.email?.[0] || '?').toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : u.email}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0 ms-2">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminStats;
