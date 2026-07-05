import { User, Settings, Shield, Download } from 'lucide-react';

export const TABS = [
  { id: 'personal',    icon: User,     labelKey: 'tabs.personal'    },
  { id: 'preferences', icon: Settings, labelKey: 'tabs.preferences' },
  { id: 'security',    icon: Shield,   labelKey: 'tabs.security'    },
  { id: 'export',      icon: Download, labelKey: 'tabs.export'      },
];

export const MENU_META = {
  personal:    { color: 'from-indigo-500 to-indigo-600',  subtitleKey: 'tabs.personalDesc'    },
  preferences: { color: 'from-purple-500 to-purple-600',  subtitleKey: 'tabs.preferencesDesc' },
  security:    { color: 'from-emerald-500 to-emerald-600', subtitleKey: 'tabs.securityDesc'    },
  export:      { color: 'from-amber-500 to-amber-600',    subtitleKey: 'tabs.exportDesc'      },
};

export const MENU_FALLBACKS = {
  personal:    'Name, avatar, contact info',
  preferences: 'Language, theme, home screen',
  security:    'Password & account safety',
  export:      'CSV, JSON, PDF',
};
