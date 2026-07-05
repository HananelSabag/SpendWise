import React, { useMemo } from 'react';
import { User, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '../../../utils/helpers';
import { TABS, MENU_META } from './ProfileTabsConfig';
import { ProfileTabContent } from './ProfileTabContent';

// Mobile: drilled-in section (iOS Settings pattern)
export const ProfileSection = ({ sectionId, onBack, user, authToasts, updateProfile, t, tc, isRTL }) => {
  const tab  = TABS.find(t => t.id === sectionId);
  const Icon = tab?.icon || User;
  const meta = MENU_META[sectionId] || MENU_META.personal;

  const content = useMemo(
    () => <ProfileTabContent sectionId={sectionId} user={user} authToasts={authToasts} updateProfile={updateProfile} t={t} />,
    [sectionId, user, authToasts, updateProfile, t]
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Sticky mini-header */}
      <div className="sticky top-0 z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 active:scale-95 transition-transform cursor-pointer shrink-0"
            aria-label="Back"
          >
            {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br shrink-0', meta.color)}>
            <Icon className="w-3.5 h-3.5 text-white" />
          </div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            {t(tab?.labelKey) || sectionId}
          </h2>
        </div>
      </div>
      <div className="px-4 py-4 pb-28">{content}</div>
    </div>
  );
};

export default ProfileSection;
