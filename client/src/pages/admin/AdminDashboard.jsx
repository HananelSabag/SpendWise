import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Users, Activity, Settings, LayoutDashboard,
  RefreshCw, ArrowRight, ArrowLeft, Clock, UserPlus,
} from 'lucide-react';

import { useAuth, useTranslation, useNotifications } from '../../stores';
import { api } from '../../api';
import { PageSkeleton } from '../../components/ui';
import { cn } from '../../utils/helpers';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { t, isRTL } = useTranslation('admin');
  const { addNotification } = useNotifications();

  const { data: dashRes, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'dashboard-stats'],
    queryFn: async () => {
      const r = await api.admin.getDashboard();
      if (!r.success) throw new Error(r.error?.message || 'Failed');
      return r;
    },
    refetchInterval: 30000,
    onError: () => addNotification({ type: 'error', message: t('errors.statsLoadFailed') }),
  });

  const { data: actRes } = useQuery({
    queryKey: ['admin', 'recent-activity'],
    queryFn: async () => {
      const r = await api.admin.activity.getLog({ limit: 8 });
      return r;
    },
    refetchInterval: 30000,
  });

  if (isLoading) return <PageSkeleton page="admin" />;

  const s = dashRes?.data?.data?.users?.summary || {};
  const stats = {
    totalUsers:       s.total_users       || 0,
    verifiedUsers:    s.verified_users    || 0,
    newUsersMonth:    s.new_users_month   || 0,
    totalTransactions:s.total_transactions|| 0,
    transactionsMonth:s.transactions_month|| 0,
    totalAmount:      s.total_amount      || 0,
    adminUsers:       s.admin_users       || 0,
  };
  const recentActivity = actRes?.success ? (actRes.data || []) : [];

  const formatTimeAgo = (val) => {
    if (!val) return '';
    const diff = Math.floor((Date.now() - new Date(val)) / 1000);
    if (diff < 60)   return t('timeAgo.justNow',    { fallback: 'Just now' });
    if (diff < 3600) return t('timeAgo.minutesAgo', { fallback: `${Math.floor(diff/60)}m`, minutes: Math.floor(diff/60) });
    if (diff < 86400)return t('timeAgo.hoursAgo',   { fallback: `${Math.floor(diff/3600)}h`, hours: Math.floor(diff/3600) });
    return new Date(val).toLocaleDateString();
  };

  const quickActions = [
    {
      to: '/admin/users',
      icon: Users,
      gradient: 'from-blue-500 to-indigo-600',
      title: t('actions.manageUsers',    { fallback: 'Manage Users' }),
      desc:  t('actions.manageUsersDesc',{ fallback: 'View, edit and manage accounts' }),
      badge: stats.totalUsers,
      badgeLabel: t('stats.totalUsers', { fallback: 'users' }),
    },
    {
      to: '/admin/activity',
      icon: Activity,
      gradient: 'from-purple-500 to-violet-600',
      title: t('actions.activityLog',    { fallback: 'Activity Log' }),
      desc:  t('actions.activityLogDesc',{ fallback: 'Monitor admin actions' }),
      badge: stats.transactionsMonth,
      badgeLabel: t('timeAgo.thisMonth', { fallback: 'this month' }),
    },
    {
      to: '/admin/settings',
      icon: Settings,
      gradient: 'from-emerald-500 to-teal-600',
      title: t('actions.systemSettings',    { fallback: 'System Settings' }),
      desc:  t('actions.systemSettingsDesc',{ fallback: 'Configure system preferences' }),
      badge: null,
      badgeLabel: null,
    },
  ];

  const pills = [
    { label: t('stats.totalUsers',       { fallback: 'Users' }),       value: stats.totalUsers,        color: 'text-gray-700 dark:text-gray-200',     bg: 'bg-gray-100 dark:bg-gray-800' },
    { label: t('stats.totalTransactions',{ fallback: 'Transactions' }), value: stats.totalTransactions, color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: t('stats.newThisMonth',     { fallback: 'New / Month' }),  value: `+${stats.newUsersMonth}`,color: 'text-green-700 dark:text-green-400',  bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: t('roles.admin',            { fallback: 'Admins' }),       value: stats.adminUsers,        color: 'text-amber-700 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-900/20' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* ── Compact Header ─────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
              <LayoutDashboard className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white flex-1 truncate">
              {t('dashboardPage.title', { fallback: 'Admin Dashboard' })}
            </h1>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
            </button>
          </div>

          {/* Stats pills */}
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

        {/* ── Quick Actions ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {quickActions.map(({ to, icon: Icon, gradient, title, desc, badge, badgeLabel }) => (
            <Link key={to} to={to}>
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all group">
                <div className="flex items-start gap-3">
                  <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0', gradient)}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{title}</h3>
                      {isRTL
                        ? <ArrowLeft className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 shrink-0 transition-colors" />
                        : <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 shrink-0 transition-colors" />}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{desc}</p>
                    {badge != null && (
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-2">
                        {badge.toLocaleString()} <span className="font-normal text-gray-400">{badgeLabel}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Recent Activity ─────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {t('dashboardPage.recentActivity', { fallback: 'Recent Activity' })}
              </span>
            </div>
            <Link
              to="/admin/activity"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {t('actions.viewAll', { fallback: 'View all' })}
            </Link>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentActivity.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                {t('activity.empty', { fallback: 'No recent activity' })}
              </div>
            ) : recentActivity.slice(0, 6).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {item.action_type?.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {item.admin_username || 'Admin'}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-400 shrink-0 ms-2">
                  {formatTimeAgo(item.created_at)}
                </span>
              </div>
            ))}
          </div>

          {recentActivity.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5 text-green-500" />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  <span className="font-semibold text-gray-900 dark:text-white">+{stats.newUsersMonth}</span>
                  {' '}{t('stats.newThisMonth', { fallback: 'new users this month' })}
                </span>
              </div>
              <div className="h-3 w-px bg-gray-300 dark:bg-gray-700" />
              <div className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-purple-500" />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  <span className="font-semibold text-gray-900 dark:text-white">+{stats.transactionsMonth}</span>
                  {' '}{t('stats.transactionsThisMonth', { fallback: 'transactions this month' })}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
