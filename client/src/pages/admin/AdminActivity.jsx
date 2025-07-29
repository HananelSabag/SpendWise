/**
 * 📋 ADMIN ACTIVITY - Activity Log & Monitoring
 * @version 2.0.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '../../stores';
import { cn } from '../../utils/helpers';

const AdminActivity = () => {
  const { t, isRTL } = useTranslation();

  return (
    <div className={cn(
      "min-h-screen bg-gray-50 dark:bg-gray-900",
      isRTL && 'rtl'
    )}
    dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className={cn(
            'flex items-center mb-4',
            isRTL && 'flex-row-reverse'
          )}
          dir={isRTL ? 'rtl' : 'ltr'}>
            <Link 
              to="/admin" 
              className={cn(
                'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mr-4',
                isRTL && 'ml-4 mr-0'
              )}
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className={cn(isRTL && "text-right")} dir={isRTL ? 'rtl' : 'ltr'}>
              <h1 className={cn(
                "text-3xl font-bold text-gray-900 dark:text-white",
                isRTL && "text-right"
              )}>
                {t('admin.activityLog', { fallback: 'Activity Log' })}
              </h1>
            </div>
          </div>
          <p className={cn(
            "text-gray-600 dark:text-gray-400",
            isRTL && "text-right"
          )} dir={isRTL ? 'rtl' : 'ltr'}>
            {t('admin.activityDescription', { fallback: 'Monitor admin actions and system activity' })}
          </p>
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

        {/* Activity Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Activity
            </h2>
          </div>
          
          <div className="p-6">
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Activity Monitoring System
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Real-time activity logging connected to the admin API system.
              </p>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Features being implemented:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Real-time activity feed from admin API</li>
                  <li>Advanced filtering and search</li>
                  <li>Activity timeline visualization</li>
                  <li>Admin action tracking</li>
                  <li>Security event monitoring</li>
                  <li>Export activity reports</li>
                </ul>
              </div>
            </div>
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