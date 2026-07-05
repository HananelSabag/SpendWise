/**
 * 👤 PROFILE PAGE
 * Mobile: settings-list → drill-in section (iOS Settings pattern).
 * Desktop: sidebar + content panel with gradient background.
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useAuth, useTranslation } from '../stores';
import { useAuthToasts } from '../hooks/useAuthToasts';
import { useIsMobile } from '../hooks/useIsMobile';
import { PageSkeleton } from '../components/ui';
import { TABS } from '../components/features/profile/ProfileTabsConfig';
import { ProfileTabContent } from '../components/features/profile/ProfileTabContent';
import { SidebarTabs } from '../components/features/profile/SidebarTabs';
import { ProfileMenuList } from '../components/features/profile/ProfileMenuList';
import { ProfileSection } from '../components/features/profile/ProfileSection';

const Profile = () => {
  const { user, updateProfile, logout } = useAuth();
  const { t, isRTL } = useTranslation('profile');
  const { t: tc }    = useTranslation();
  const authToasts   = useAuthToasts();
  const isMobile     = useIsMobile();
  const navigate     = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = searchParams.get('tab');

  // Desktop: always shows a tab (default 'personal')
  const [activeTab, setActiveTab] = useState(
    TABS.some(tab => tab.id === initialTab) ? initialTab : 'personal'
  );

  // Mobile: null = list view, string = drilled-in section
  const [activeSection, setActiveSection] = useState(
    TABS.some(tab => tab.id === initialTab) ? initialTab : null
  );

  // Sync activeSection from URL — handles OS back gesture popping history
  useEffect(() => {
    if (!isMobile) return;
    const tab = searchParams.get('tab');
    setActiveSection(TABS.some(t => t.id === tab) ? tab : null);
  }, [searchParams, isMobile]);

  const handleSelect = useCallback((tabId) => {
    setActiveTab(tabId);
    if (isMobile) {
      // Push a new history entry so OS back gesture returns to list view
      setActiveSection(tabId);
      setSearchParams({ tab: tabId });
    } else {
      setSearchParams(tabId !== 'personal' ? { tab: tabId } : {}, { replace: true });
    }
  }, [isMobile, setSearchParams]);

  const handleBack = useCallback(() => {
    // Pop the history entry — URL reverts → useEffect sets activeSection(null)
    navigate(-1);
  }, [navigate]);

  const tabContent = useMemo(
    () => <ProfileTabContent sectionId={activeTab} user={user} authToasts={authToasts} updateProfile={updateProfile} t={t} />,
    [activeTab, user, authToasts, updateProfile, t]
  );

  if (!user) return <PageSkeleton page="profile" />;

  // ── Mobile ──
  if (isMobile) {
    if (activeSection) {
      return (
        <ProfileSection
          sectionId={activeSection}
          onBack={handleBack}
          user={user}
          authToasts={authToasts}
          updateProfile={updateProfile}
          t={t}
          tc={tc}
          isRTL={isRTL}
        />
      );
    }
    return (
      <ProfileMenuList
        user={user}
        onSelect={handleSelect}
        onLogout={() => logout(true)}
        onShopping={() => navigate('/shopping')}
        t={t}
        tc={tc}
        isRTL={isRTL}
      />
    );
  }

  // ── Desktop ──
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-5xl mx-auto px-6 pt-8 pb-10">

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('tabs.accountSettings') || 'Account Settings'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('tabs.accountSettingsDesc') || 'Manage your profile and preferences'}
          </p>
        </div>

        <div className="flex gap-8 items-start">
          <SidebarTabs active={activeTab} onChange={handleSelect} t={t} onLogout={() => logout(true)} onShopping={() => navigate('/shopping')} tc={tc} />
          <div className="flex-1 min-w-0">{tabContent}</div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
