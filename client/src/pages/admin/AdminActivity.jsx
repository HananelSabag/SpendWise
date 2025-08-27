/**
 * 📋 ADMIN ACTIVITY - Activity Log & Monitoring
 * @version 2.0.0
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Filter, Calendar, User, Activity as ActivityIcon, RefreshCw } from 'lucide-react';
import { useTranslation } from '../../stores';
import { cn } from '../../utils/helpers';
import { api } from '../../api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';

const AdminActivity = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    adminId: '',
    actionType: '',
    dateRange: '24h'
  });
  const [refreshing, setRefreshing] = useState(false);

  // Load activity log with filters
  const loadActivities = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setRefreshing(!showLoading);
    
    try {
      const res = await api.admin.activity.getLog({ limit: 100 });
      if (res.success) {
        // ✅ Handle unified response format from server
        const activityData = res.data || [];
        setActivities(Array.isArray(activityData) ? activityData : []);
        setTotalCount(res.pagination?.total || activityData.length || 0);
        setError(null);
      } else {
        console.error('Activity log error:', res.error);
        setError(res.error?.message || 'Failed to load activity');
        setActivities([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error('Activity log loading error:', err);
      setError('Failed to load activity log');
      setActivities([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  return (
    <div className={cn("min-h-screen bg-gray-50 dark:bg-gray-900") }>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header banner */}
        <div className="mb-8">
          <div className="overflow-hidden rounded-lg">
            <div className="bg-gradient-to-r from-purple-600 to-fuchsia-600 p-5 text-white">
              <div className="flex items-center gap-3">
                <Link to="/admin" className="text-white/90 hover:text-white">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                  <h1 className="text-xl md:text-2xl font-semibold">{t('admin.activityLog', { fallback: 'Activity Log' })}</h1>
                  <p className="text-white/90 text-sm mt-1">{t('admin.activityDescription', { fallback: 'Monitor admin actions and system activity' })}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Filters with Icons */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-2">
              <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('admin.filters', { fallback: 'Filters' })}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('admin.filtersDescription', { fallback: 'Filter and search activity logs' })}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <User className="w-4 h-4" />
                {t('admin.adminUser', { fallback: 'Admin User' })}
              </label>
              <select 
                value={filters.adminId}
                onChange={(e) => setFilters({...filters, adminId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">{t('admin.allAdmins', { fallback: 'All Admins' })}</option>
                {/* Dynamic admin options will be loaded from API */}
              </select>
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <ActivityIcon className="w-4 h-4" />
                {t('admin.actionType', { fallback: 'Action Type' })}
              </label>
              <select 
                value={filters.actionType}
                onChange={(e) => setFilters({...filters, actionType: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">{t('admin.allActions', { fallback: 'All Actions' })}</option>
                <option value="user_delete">{t('admin.userDelete', { fallback: 'User Delete' })}</option>
                <option value="user_block">{t('admin.userBlock', { fallback: 'User Block' })}</option>
                <option value="user_change_role">{t('admin.roleChange', { fallback: 'Role Change' })}</option>
                <option value="settings">{t('admin.settings', { fallback: 'Settings' })}</option>
              </select>
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4" />
                {t('admin.dateRange', { fallback: 'Date Range' })}
              </label>
              <select 
                value={filters.dateRange}
                onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="24h">{t('admin.last24Hours', { fallback: 'Last 24 Hours' })}</option>
                <option value="7d">{t('admin.last7Days', { fallback: 'Last 7 Days' })}</option>
                <option value="30d">{t('admin.last30Days', { fallback: 'Last 30 Days' })}</option>
                <option value="all">{t('admin.allTime', { fallback: 'All Time' })}</option>
              </select>
            </div>
            
            <div className="flex items-end gap-2">
              <Button 
                onClick={() => loadActivities()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading || refreshing}
              >
                <Filter className="w-4 h-4 mr-2" />
                {t('admin.applyFilters', { fallback: 'Apply Filters' })}
              </Button>
              <Button
                onClick={() => loadActivities(false)}
                variant="outline"
                size="sm"
                disabled={loading || refreshing}
                className="px-3"
              >
                <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
              </Button>
            </div>
          </div>
        </div>

        {/* Activity List (mobile) + Table (desktop) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-2">
                  <ActivityIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t('admin.recentActivity', { fallback: 'Recent Activity' })}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {totalCount > 0 ? `${activities.length} of ${totalCount} activities` : 'No activities found'}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => loadActivities(false)}
                variant="outline"
                size="sm"
                disabled={loading || refreshing}
              >
                <RefreshCw className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")} />
                {refreshing ? t('common.refreshing', { fallback: 'Refreshing...' }) : t('common.refresh', { fallback: 'Refresh' })}
              </Button>
            </div>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-8"><LoadingSpinner size="large" /></div>
            ) : error ? (
              <div className="text-center text-red-600 dark:text-red-400">{error}</div>
            ) : activities.length === 0 ? (
              <div className="text-center text-gray-600 dark:text-gray-400 py-8">No activity yet</div>
            ) : (
              <>
                {/* Mobile cards */}
                <div className="grid grid-cols-1 gap-3 md:hidden">
                  {activities.map((a) => (
                    <div key={a.id} className="rounded-lg border border-purple-200 dark:border-purple-800 p-4">
                      <div className="text-sm font-medium text-purple-700 dark:text-purple-300">
                        {a.action_type?.replace(/_/g, ' ') || 'Unknown Action'}
                      </div>
                      <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                        {a.admin_username || a.admin_email || 'Admin'} • {a.created_at ? new Date(a.created_at).toLocaleString() : 'Invalid Date'}
                      </div>
                      <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                        {a.target_user?.email || a.target_email || '-'}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden md:block overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-purple-50 dark:bg-gray-900/40">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">When</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">Admin</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">Action</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">Target</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {activities.map((a) => (
                        <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {a.created_at ? (
                              <div>
                                <div className="font-medium">{new Date(a.created_at).toLocaleDateString()}</div>
                                <div className="text-xs text-gray-500">{new Date(a.created_at).toLocaleTimeString()}</div>
                              </div>
                            ) : (
                              <span className="text-red-500 italic">Invalid Date</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            <div className="font-medium">{a.admin_username || 'Admin'}</div>
                            <div className="text-xs text-gray-500">{a.admin_email || ''}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                              {a.action_type?.replace(/_/g, ' ') || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            <div className="font-medium">{a.target_username || '-'}</div>
                            <div className="text-xs text-gray-500">{a.target_user?.email || a.target_email || ''}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Activity Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Actions</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">--</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Admins</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">1</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Security Events</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">0</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminActivity; 