import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Activity as ActivityIcon, RefreshCw, Filter, Calendar, User } from 'lucide-react';
import { useTranslation } from '../../stores';
import { api } from '../../api';
import { LoadingSpinner } from '../../components/ui';
import { cn } from '../../utils/helpers';

const ACTION_COLORS = {
  user_delete:      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  user_block:       'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  user_unblock:     'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  user_change_role: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  settings:         'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
};
const actionColor = (type) => ACTION_COLORS[type] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300';

const getTargetUserInfo = (a) => {
  const details = a.action_details || {};
  const isDeleted = a.action_type?.includes('deleted') ||
                    a.target_username?.includes('_deleted_') ||
                    a.target_username?.includes('.deleted.');
  return {
    username: isDeleted && details.target_username_original
      ? `${details.target_username_original} (deleted)`
      : (a.target_username || '-'),
    email: isDeleted && details.target_email_original
      ? details.target_email_original
      : (a.target_user?.email || a.target_email || ''),
  };
};

const AdminActivity = () => {
  const { t, isRTL } = useTranslation('admin');
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activities, setActivities] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [error,      setError]      = useState(null);
  const [filters,    setFilters]    = useState({ actionType: '', dateRange: '24h' });

  const load = async (showLoading = true) => {
    if (showLoading) setLoading(true); else setRefreshing(true);
    try {
      const res = await api.admin.activity.getLog({ limit: 100 });
      if (res.success) {
        const data = Array.isArray(res.data) ? res.data : [];
        setActivities(data);
        setTotalCount(res.pagination?.total || data.length);
        setError(null);
      } else {
        setError(res.error?.message || 'Failed to load');
        setActivities([]);
      }
    } catch {
      setError('Failed to load activity log');
      setActivities([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const pills = [
    { label: t('table.total',     { fallback: 'Total' }),  value: totalCount,                                                              color: 'text-gray-700 dark:text-gray-200',     bg: 'bg-gray-100 dark:bg-gray-800' },
    { label: t('status.today',    { fallback: 'Today' }),   value: activities.filter(a => new Date(a.created_at) > new Date(Date.now() - 86400000)).length, color: 'text-blue-700 dark:text-blue-400',     bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: t('userDelete',      { fallback: 'Deletes' }), value: activities.filter(a => a.action_type === 'user_delete').length,        color: 'text-red-700 dark:text-red-400',       bg: 'bg-red-50 dark:bg-red-900/20' },
    { label: t('userBlock',       { fallback: 'Blocks' }),  value: activities.filter(a => a.action_type === 'user_block').length,         color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
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
              <ActivityIcon className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white flex-1 truncate">
              {t('activity.title', { fallback: 'Activity Log' })}
            </h1>
            <button
              onClick={() => load(false)}
              disabled={loading || refreshing}
              className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
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

        {/* ── Filters ─────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {t('filtersTitle', { fallback: 'Filters' })}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                <ActivityIcon className="w-3.5 h-3.5" />
                {t('actionType', { fallback: 'Action Type' })}
              </label>
              <select
                value={filters.actionType}
                onChange={(e) => setFilters(f => ({ ...f, actionType: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 outline-none"
              >
                <option value="">{t('allActions', { fallback: 'All Actions' })}</option>
                <option value="user_delete">{t('userDelete',    { fallback: 'User Delete' })}</option>
                <option value="user_block">{t('userBlock',      { fallback: 'User Block' })}</option>
                <option value="user_change_role">{t('roleChange',{ fallback: 'Role Change' })}</option>
                <option value="settings">{t('settingsAction',   { fallback: 'Settings' })}</option>
              </select>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {t('dateRange', { fallback: 'Date Range' })}
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(f => ({ ...f, dateRange: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 outline-none"
              >
                <option value="24h">{t('last24Hours', { fallback: 'Last 24 Hours' })}</option>
                <option value="7d">{t('last7Days',   { fallback: 'Last 7 Days' })}</option>
                <option value="30d">{t('last30Days', { fallback: 'Last 30 Days' })}</option>
                <option value="all">{t('allTime',    { fallback: 'All Time' })}</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => load()}
                disabled={loading || refreshing}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50"
              >
                <Filter className="w-3.5 h-3.5" />
                {t('applyFilters', { fallback: 'Apply' })}
              </button>
            </div>
          </div>
        </div>

        {/* ── Activity Table ───────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12"><LoadingSpinner size="large" /></div>
          ) : error ? (
            <div className="py-12 text-center text-sm text-red-500">{error}</div>
          ) : activities.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">
              {t('activity.noActivity', { fallback: 'No activity yet' })}
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="divide-y divide-gray-100 dark:divide-gray-800 md:hidden">
                {activities.map((a) => {
                  const target = getTargetUserInfo(a);
                  return (
                    <div key={a.id} className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-semibold', actionColor(a.action_type))}>
                          {a.action_type?.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-gray-400 shrink-0">
                          {a.created_at ? new Date(a.created_at).toLocaleString() : '-'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                        <User className="w-3 h-3" />
                        <span className="font-medium">{a.admin_username || 'Admin'}</span>
                        {target.username !== '-' && (
                          <><span>→</span><span className="font-medium text-gray-900 dark:text-white">{target.username}</span></>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40">
                      {[
                        t('table.when',   { fallback: 'When' }),
                        t('table.admin',  { fallback: 'Admin' }),
                        t('table.action', { fallback: 'Action' }),
                        t('table.target', { fallback: 'Target' }),
                      ].map((col) => (
                        <th key={col} className="px-4 py-3 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {activities.map((a) => {
                      const target = getTargetUserInfo(a);
                      return (
                        <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            {a.created_at ? (
                              <>
                                <div className="font-medium">{new Date(a.created_at).toLocaleDateString()}</div>
                                <div className="text-xs text-gray-400">{new Date(a.created_at).toLocaleTimeString()}</div>
                              </>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="font-medium text-gray-900 dark:text-white">{a.admin_username || 'Admin'}</div>
                            <div className="text-xs text-gray-400">{a.admin_email || ''}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn('inline-flex px-2.5 py-1 rounded-full text-xs font-semibold', actionColor(a.action_type))}>
                              {a.action_type?.replace(/_/g, ' ') || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="font-medium text-gray-900 dark:text-white">{target.username}</div>
                            <div className="text-xs text-gray-400">{target.email}</div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminActivity;
