/**
 * AdminTabsNav — one liquid tab bar shared by every admin page, so the admin
 * area reads as a single tabbed surface (no per-page back-and-forth). Each tab
 * is a route; the active one is derived from the current path. Settings is
 * super-admin only, matching the route guard.
 */

import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Activity, RefreshCw, BarChart, Settings } from 'lucide-react';

import { useAuth, useTranslation } from '../../../stores';
import { LiquidTabs } from '../../ui';

export default function AdminTabsNav({ className = '' }) {
  const { currentLanguage } = useTranslation('admin');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const he = currentLanguage === 'he';
  const isSuper = user?.role === 'super_admin';

  const sections = useMemo(() => {
    const base = [
      { id: '/admin',          label: he ? 'סקירה'   : 'Overview', icon: LayoutDashboard },
      { id: '/admin/users',    label: he ? 'משתמשים' : 'Users',    icon: Users },
      { id: '/admin/activity', label: he ? 'פעילות'  : 'Activity', icon: Activity },
      { id: '/admin/sync',     label: he ? 'סנכרון'  : 'Sync',     icon: RefreshCw },
      { id: '/admin/stats',    label: he ? 'נתונים'  : 'Stats',    icon: BarChart },
    ];
    if (isSuper) base.push({ id: '/admin/settings', label: he ? 'הגדרות' : 'Settings', icon: Settings });
    return base;
  }, [he, isSuper]);

  // /admin is a prefix of every other route, so match it exactly and the rest
  // by prefix.
  const active = pathname === '/admin'
    ? '/admin'
    : sections.find((s) => s.id !== '/admin' && pathname.startsWith(s.id))?.id;

  return (
    <LiquidTabs
      className={className}
      size="sm"
      tabs={sections}
      active={active}
      onChange={(id) => navigate(id)}
    />
  );
}
