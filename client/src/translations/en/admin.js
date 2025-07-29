/**
 * 🛡️ ADMIN TRANSLATIONS - English
 * Admin dashboard, user management, and system settings translations
 */

export const admin = {
  // Navigation
  dashboard: 'Admin Dashboard',
  userManagement: 'User Management',
  systemStats: 'System Statistics', 
  activityLog: 'Activity Log',
  
  // System Status
  system: {
    status: 'System Status',
    server: 'Server',
    online: 'Online',
    database: 'Database',
    connected: 'Connected',
    security: 'Security'
  },
  
  // Admin Settings
  settings: {
    title: 'System Settings',
    description: 'Configure system-wide settings and preferences (Super Admin Only)',
    categories: 'Categories',
    general: 'General',
    security: 'Security',
    email: 'Email',
    features: 'Features',
    analytics: 'Analytics',
    
    // General Settings
    siteName: 'Site Name',
    siteNameDesc: 'The name of your application',
    userRegistration: 'User Registration',
    userRegistrationDesc: 'Allow new users to register',
    emailVerification: 'Email Verification Required',
    emailVerificationDesc: 'Require email verification for new accounts',
    googleOAuth: 'Google OAuth',
    googleOAuthDesc: 'Enable Google OAuth authentication',
    
    // Security Settings
    maintenanceMode: 'Maintenance Mode',
    maintenanceModeDesc: 'Enable maintenance mode to restrict access',
    
    // Feature Settings
    analytics: 'Analytics Tracking',
    analyticsDesc: 'Enable analytics and usage tracking',
    notifications: 'System Notifications',
    notificationsDesc: 'Enable system-wide notifications',
    
    // Status Messages
    loaded: 'Settings loaded successfully',
    loadError: 'Failed to load settings',
    saved: 'Settings saved successfully',
    saveError: 'Failed to save settings',
    
    // API Integration
    apiReady: 'Settings System Ready',
    apiDesc: 'This interface is ready for backend API integration. Settings are currently in demo mode.'
  },
}; 