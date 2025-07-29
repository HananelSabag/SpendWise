/**
 * 🛡️ ADMIN TRANSLATIONS - English
 * Admin dashboard, user management, and system settings translations
 */

export default {
  // Dashboard
  dashboard: {
    title: 'Admin Dashboard',
    subtitle: 'System Overview & Management',
    welcome: 'Welcome back, {{name}}!',
  },

  // Stats
  stats: {
    totalUsers: 'Total Users',
    activeUsers: 'Active Users',
    adminUsers: 'Admin Users',
    verifiedUsers: 'Verified Users',
    totalTransactions: 'Total Transactions',
    totalCategories: 'Total Categories',
    systemHealth: 'System Health',
  },

  // Actions
  actions: {
    manageUsers: 'Manage Users',
    manageUsersDesc: 'View and manage user accounts',
    systemSettings: 'System Settings',
    systemSettingsDesc: 'Configure system parameters',
    activityLog: 'Activity Log',
    activityLogDesc: 'View admin activity history',
    userBlocked: 'User blocked successfully',
    userUnblocked: 'User unblocked successfully',
    userDeleted: 'User deleted successfully',
  },

  // Users Management
  users: {
    title: 'User Management',
    subtitle: 'Manage user accounts and permissions',
    searchPlaceholder: 'Search users...',
    noUsers: 'No users found',
    noUsersDesc: 'No users match your search criteria',
    userDetails: 'User Details',
  },

  // Table
  table: {
    user: 'User',
    role: 'Role',
    status: 'Status',
    joinDate: 'Join Date',
    actions: 'Actions',
  },

  // Filters
  filters: {
    allRoles: 'All Roles',
    filterByRole: 'Filter by Role',
  },

  // Roles
  roles: {
    user: 'User',
    admin: 'Admin',
    superAdmin: 'Super Admin',
  },

  // System
  system: {
    status: 'Status',
    server: 'Server',
    database: 'Database',
    security: 'Security',
    online: 'Online',
    connected: 'Connected',
  },

  // Common
  common: {
    refresh: 'Refresh',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    never: 'Never',
  },

  // Errors
  errors: {
    statsLoadFailed: 'Failed to load admin statistics',
    usersLoadFailed: 'Failed to load users',
    actionFailed: 'Action failed',
    accessDenied: 'Access Denied',
    adminRequired: 'Admin privileges required to access this page',
  },

  // Confirmations
  confirmations: {
    deleteUser: 'Are you sure you want to delete this user?',
  },

  // Status
  status: {
    active: 'Active',
    blocked: 'Blocked',
    pending: 'Pending',
    inactive: 'Inactive',
  },

  // Fields
  fields: {
    joinDate: 'Join Date',
    lastLogin: 'Last Login',
    transactionCount: 'Transaction Count',
    totalSpent: 'Total Spent',
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