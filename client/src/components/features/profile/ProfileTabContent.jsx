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
    case 'personal':
      return (
        <div>
          <AvatarSection user={user} authToasts={authToasts} />
          <PersonalInfo user={user} onUpdate={updateProfile} />
        </div>
      );
    case 'preferences': return <PreferencesTab user={user} authToasts={authToasts} />;
    case 'security':    return <SecurityTab authToasts={authToasts} />;
    case 'export':      return <ExportTab t={t} />;
    default:             return null;
  }
};

export default ProfileTabContent;
