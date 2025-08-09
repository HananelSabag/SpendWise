/**
 * 🛡️ ADMIN TRANSLATIONS - English
 * Admin dashboard, user management, and system settings translations
 */

export default {
  // Navigation
  dashboard: 'Admin Dashboard',
  userManagement: 'User Management',
  systemStats: 'System Statistics', 
  statsDescription: 'Comprehensive system metrics and analytics',
  activityLog: 'Activity Log',
  activityDescription: 'Monitor admin actions and system activity',
  
  // Dashboard
  dashboardPage: {
    title: 'Admin Dashboard',
    subtitle: 'Complete system administration and user management',
    welcome: 'Welcome back',
    roleStatus: 'Administrator Access'
  },
  
  // Stats
  stats: {
    totalUsers: 'Total Users',
    activeUsers: 'Verified Users',
    totalTransactions: 'Total Transactions',
    systemHealth: 'System Health',
    totalRevenue: 'Total Amount',
    thisMonth: 'this month',
    today: 'today',
    verified: 'verified',
    fromAllTransactions: 'from all transactions'
  },
  
  // System Status
  system: {
    status: 'System Status',
    server: 'Server',
    online: 'Online',
    database: 'Database',
    connected: 'Connected',
    security: 'Security'
  },
  
  // Actions (for quick links/cards inside admin pages)
  actions: {
    manageUsers: 'Manage Users',
    manageUsersDesc: 'View, edit, and manage user accounts',
    systemSettings: 'System Settings',
    systemSettingsDesc: 'Configure system-wide settings',
    activityLog: 'Activity Log',
    activityLogDesc: 'Monitor system activity and logs',
    userBlocked: 'User blocked successfully',
    userUnblocked: 'User unblocked successfully',
    userDeleted: 'User deleted successfully'
  },

  // Users Management
  users: {
    title: 'User Management',
    subtitle: 'Manage {{total}} users across the platform',
    searchPlaceholder: 'Search users by name, email...',
    noUsers: 'No users found',
    noUsersDesc: 'No users match your search criteria',
    userDetails: 'User Details'
  },

  // Table labels
  table: {
    user: 'User',
    role: 'Role',
    status: 'Status',
    joinDate: 'Join Date',
    actions: 'Actions'
  },

  // Filters
  filters: {
    allRoles: 'All Roles',
    filterByRole: 'Filter by role'
  },

  // Roles
  roles: {
    user: 'User',
    admin: 'Admin',
    superAdmin: 'Super Admin'
  },

  // Confirmations
  confirmations: {
    deleteUser: 'Are you sure you want to delete this user?'
  },

  // Status values for users
  status: {
    active: 'Active',
    blocked: 'Blocked',
    pending: 'Pending',
    inactive: 'Inactive'
  },

  // Fields in user modal/details
  fields: {
    joinDate: 'Join Date',
    lastLogin: 'Last Login',
    transactionCount: 'Transactions',
    totalSpent: 'Total Spent'
  },

  // Common strings when using admin-scoped translator
  common: {
    refresh: 'Refresh',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    never: 'Never'
  },

  // Errors shown in admin pages
  errors: {
    statsLoadFailed: 'Failed to load admin statistics',
    usersLoadFailed: 'Failed to load users',
    actionFailed: 'Action failed',
    accessDenied: 'Access Denied',
    adminRequired: 'Admin privileges required to access this page',
    loadFailed: 'Failed to Load Data',
    generic: 'Something went wrong'
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
    
    // Actions
    save: 'Save Changes',
    saving: 'Saving...',
    saved: 'Settings Saved',
    reset: 'Reset to Defaults'
  },
}; 