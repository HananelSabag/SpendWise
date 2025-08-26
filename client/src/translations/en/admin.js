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
    searchPlaceholder: 'Search users by name, email, username...',
    noUsers: 'No users found',
    noUsersDescription: 'Try adjusting your search or filter criteria.',
    userDetails: 'User Details'
  },

  // Table labels
  table: {
    user: 'User',
    role: 'Role',
    status: 'Status',
    activity: 'Activity',
    joinDate: 'Join Date',
    actions: 'Actions',
    selectAll: 'Select all'
  },

  // Filters
  filters: {
    allRoles: 'All Roles',
    allStatuses: 'All Statuses',
    allVerified: 'All',
    allActivity: 'All',
    verified: 'Verified',
    unverified: 'Unverified',
    activeUsers: 'Active (7d)',
    inactiveUsers: 'Inactive',
    filterByRole: 'Filter by role',
    role: 'Role',
    status: 'Status',
    verified: 'Email Verified',
    activity: 'Activity'
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

  // Dialogs
  dialogs: {
    deleteUser: {
      title: 'Delete User',
      message: 'This action is permanent and will remove the user and all related data. You can optionally provide a reason for auditing.',
      reasonLabel: 'Reason (optional)',
      reasonPlaceholder: 'Enter a reason for deletion...',
      confirm: 'Delete User',
      cancel: 'Cancel'
    },
    roleChange: {
      title: 'Change User Role',
      message: 'Select a new role for this user. Changes take effect immediately.',
      selectLabel: 'Select Role',
      confirm: 'Update Role',
      cancel: 'Cancel',
      success: 'User role updated successfully'
    }
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
    never: 'Never',
    users: 'users',
    selected: 'selected',
    filters: 'Filters'
  },

  // Bulk operations
  bulk: {
    block: 'Block Selected',
    unblock: 'Unblock Selected',
    delete: 'Delete Selected',
    export: 'Export Selected',
    actionSuccess: '{{action}} completed for {{count}} users',
    actionError: 'Bulk action failed',
    noSelection: 'No users selected',
    processing: 'Processing {{count}} users...',
    blockSuccess: 'Successfully blocked {{count}} users',
    blockError: 'Failed to block {{count}} users',
    unblockSuccess: 'Successfully unblocked {{count}} users',
    unblockError: 'Failed to unblock {{count}} users',
    deleteSuccess: 'Successfully deleted {{count}} users',
    deleteError: 'Failed to delete {{count}} users',
    exportSuccess: 'Successfully exported {{count}} users',
    exportError: 'Failed to export users',
    noDataToExport: 'No data to export',
    unknownAction: 'Unknown action'
  },

  // Errors shown in admin pages
  errors: {
    statsLoadFailed: 'Failed to load admin statistics',
    usersLoadFailed: 'Failed to load users',
    actionFailed: 'Action failed',
    accessDenied: 'Access Denied',
    adminRequired: 'Admin privileges required to access this page',
    loadFailed: 'Failed to Load Data',
    generic: 'Something went wrong',
    permissionDenied: 'Permission denied'
  },

  // Buttons
  buttons: {
    overview: 'Overview',
    roleChange: 'Role Change',
    block: 'Block',
    unblock: 'Unblock',
    goToDashboard: 'Go to Dashboard',
    refreshPage: 'Refresh Page',
    exportCsv: 'Export CSV'
  },

  // CSV Export Headers
  csvHeaders: {
    name: 'Name',
    email: 'Email',
    role: 'Role',
    status: 'Status',
    transactions: 'Transactions',
    totalAmount: 'Total Amount',
    currency: 'Currency',
    joinDate: 'Join Date'
  },

  // Time formatting
  timeAgo: {
    justNow: 'Just now',
    minutesAgo: '{{minutes}}m',
    hoursAgo: '{{hours}}h',
    daysAgo: '{{days}}d'
  },

  // Accessibility labels
  accessibility: {
    manageUsersLabel: 'Manage users',
    systemSettingsLabel: 'System settings',
    activityLogLabel: 'Activity log'
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
    supportEmail: 'Support Email',
    supportEmailDesc: 'Primary support contact email address',
    emailSenderName: 'Email Sender Name',
    emailSenderNameDesc: 'Display name used in system emails',
    analyticsProvider: 'Analytics Provider',
    analyticsProviderDesc: 'Identifier (e.g., plausible, ga4) for client integration',
    
    // Actions
    save: 'Save Changes',
    saving: 'Saving...',
    saved: 'Settings Saved',
    reset: 'Reset to Defaults'
  },
}; 