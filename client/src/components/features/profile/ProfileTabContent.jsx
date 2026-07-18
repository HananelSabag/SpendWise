import React from 'react';
import { AvatarSection } from './AvatarSection';
import { PreferencesTab } from './PreferencesTab';
import { SecurityTab } from './SecurityTab';
import { ExportTab } from './ExportTab';
import PersonalInfo from './PersonalInfo';

// Single switch shared by the desktop tab view and the mobile drilled-in
// section — previously duplicated verbatim in both places.
export const ProfileTabContent = ({ sectionId, user, authToasts, updateProfile, t }) => {
  switch (sectionId) {
    // Account = identity + preferences in one place (was two tabs).
    case 'account':
      return (
        <div className="space-y-4">
          <AvatarSection user={user} authToasts={authToasts} />
          <PersonalInfo user={user} onUpdate={updateProfile} />
          <PreferencesTab user={user} authToasts={authToasts} />
        </div>
      );
    case 'security':    return <SecurityTab authToasts={authToasts} />;
    case 'export':      return <ExportTab t={t} />;
    default:             return null;
  }
};

export default ProfileTabContent;
