/**
 * 👤 PROFILE PAGE
 * Header-less app → the page owns a sticky top bar: identity + a liquid
 * top-tab selector (same language as the Bank Sync page). One layout for
 * mobile and desktop; the old desktop-sidebar / mobile drill-in split is gone.
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingCart, LogOut } from 'lucide-react';

import { useAuth, useTranslation } from '../stores';
import { useAuthToasts } from '../hooks/useAuthToasts';
import { PageSkeleton, Avatar, LiquidTabs } from '../components/ui';
import { TABS } from '../components/features/profile/ProfileTabsConfig';
import { ProfileTabContent } from '../components/features/profile/ProfileTabContent';

const Profile = () => {
  const { user, updateProfile, logout } = useAuth();
  const { t, isRTL } = useTranslation('profile');
  const { t: tc }    = useTranslation();
  const authToasts   = useAuthToasts();
  const navigate     = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    TABS.some((tab) => tab.id === initialTab) ? initialTab : 'personal'
  );

  // Keep the active tab in sync with the URL (deep links + OS back gesture).
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (TABS.some((x) => x.id === tab)) setActiveTab(tab);
    else if (!tab) setActiveTab('personal');
  }, [searchParams]);

  const handleSelect = useCallback((tabId) => {
    setActiveTab(tabId);
    setSearchParams(tabId !== 'personal' ? { tab: tabId } : {}, { replace: true });
  }, [setSearchParams]);

  const tabItems = useMemo(
    () => TABS.map((tab) => ({ id: tab.id, label: t(tab.labelKey, tab.id), icon: tab.icon })),
    [t]
  );

  const tabContent = useMemo(
    () => <ProfileTabContent sectionId={activeTab} user={user} authToasts={authToasts} updateProfile={updateProfile} t={t} />,
    [activeTab, user, authToasts, updateProfile, t]
  );

  if (!user) return <PageSkeleton page="profile" />;

  return (
    <div className="min-h-screen bg-gray-50 pb-28 dark:bg-gray-950 lg:pb-10" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Sticky top bar — identity + liquid tab nav (there is no app header) */}
      <header className="sticky top-0 z-30 border-b border-gray-200/70 bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-gray-900/90">
        <div className="mx-auto max-w-5xl px-4 py-3 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-2xl ring-2 ring-indigo-100 dark:ring-indigo-900/40">
              <Avatar
                src={user?.avatar}
                alt={user?.name || user?.email}
                size="md"
                fallback={(user?.name || user?.email || '?').charAt(0).toUpperCase()}
                className="h-full w-full"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-gray-950 dark:text-white">
                {user?.name || user?.email?.split('@')[0]}
              </p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
            </div>
            <button
              onClick={() => navigate('/shopping')}
              className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-emerald-600 dark:hover:bg-gray-800"
              aria-label={t('shoppingEntry.title', 'Shopping')}
              title={t('shoppingEntry.title', 'Shopping')}
            >
              <ShoppingCart className="h-5 w-5" />
            </button>
            <button
              onClick={() => logout(true)}
              className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
              aria-label={tc('common.logout', 'Logout')}
              title={tc('common.logout', 'Logout')}
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-3">
            <LiquidTabs tabs={tabItems} active={activeTab} onChange={handleSelect} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5 lg:px-8">{tabContent}</main>
    </div>
  );
};

export default Profile;
