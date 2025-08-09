/**
 * 📋 ADMIN ACTIVITY - Activity Log & Monitoring
 * @version 2.0.0
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '../../stores';
import { cn } from '../../utils/helpers';
import { api } from '../../api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const AdminActivity = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const res = await api.admin.activity.getLog({ limit: 100 });
      if (!mounted) return;
      if (res.success) {
        setActivities(res.data || []);
        setError(null);
      } else {
        setError(res.error?.message || 'Failed to load activity');
      }
      setLoading(false);
    })();
    return () => { mounted = false; };
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

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Filters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Admin User
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option>All Admins</option>
                <option>hananel12345@gmail.com</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Action Type
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option>All Actions</option>
                <option>User Management</option>
                <option>Settings</option>
                <option>Security</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Range
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option>Last 24 Hours</option>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Custom Range</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Activity List (mobile) + Table (desktop) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-purple-700 dark:text-purple-300">
              Recent Activity
            </h2>
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
                        {a.action_type?.replace(/_/g, ' ')}
                      </div>
                      <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                        {a.admin_username || a.admin_email || 'Admin'} • {new Date(a.created_at).toLocaleString()}
                      </div>
                      <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                        {a.target_user?.email || '-'}
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
                        <tr key={a.id}>
                          <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{new Date(a.created_at).toLocaleString()}</td>
                          <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{a.admin_username || a.admin_email || 'Admin'}</td>
                          <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{a.action_type}</td>
                          <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{a.target_user?.email || '-'}</td>
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