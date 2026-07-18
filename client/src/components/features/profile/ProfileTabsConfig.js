import { User, Shield, Download } from 'lucide-react';

// Two tabs: everything about the account (identity + preferences) in one place,
// and security on its own because a password is sensitive. Export stays a
// header button, not a tab.
export const TABS = [
  { id: 'account',  icon: User,     labelKey: 'tabs.account'  },
  { id: 'security', icon: Shield,   labelKey: 'tabs.security' },
  { id: 'export',   icon: Download, labelKey: 'tabs.export'   },
];

export const MENU_META = {
  account:  { color: 'from-indigo-500 to-indigo-600',   subtitleKey: 'tabs.accountDesc'  },
  security: { color: 'from-emerald-500 to-emerald-600', subtitleKey: 'tabs.securityDesc' },
  export:   { color: 'from-amber-500 to-amber-600',     subtitleKey: 'tabs.exportDesc'   },
};

export const MENU_FALLBACKS = {
  account:  'Name, language, theme & home screen',
  security: 'Password & account safety',
  export:   'CSV, JSON, PDF',
};
