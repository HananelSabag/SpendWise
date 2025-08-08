/**
 * ❌ ERROR TRANSLATIONS - English
 * Error messages, validation errors, and user feedback
 */

export default {
  // Generic errors
  genericError: 'Something went wrong',
  unexpectedError: 'An unexpected error occurred',
  tryAgain: 'Please try again',
  contactSupport: 'Please contact support if the problem persists',
  
  // Not Found page
  pageNotFound: 'Page Not Found',
  pageNotFoundDesc: "The page you're looking for doesn't exist or has been moved.",
  
  // Network errors
  networkError: 'Network error. Please check your connection.',
  connectionError: 'Unable to connect to server',
  timeoutError: 'Request timed out',
  serverError: 'Server error. Please try again later.',
  serviceUnavailable: 'Service temporarily unavailable',
  
  // Authentication errors
  unauthorized: 'You are not authorized to perform this action',
  accessDenied: 'Access denied',
  sessionExpired: 'Your session has expired. Please login again.',
  invalidToken: 'Invalid authentication token',
  accountBlocked: 'Your account has been blocked',
  accountDeleted: 'Your account has been deleted',
  
  // Validation errors
  required: 'This field is required',
  invalid: 'Invalid value',
  tooShort: 'Value is too short',
  tooLong: 'Value is too long',
  invalidEmail: 'Please enter a valid email address',
  invalidPassword: 'Password must be at least 8 characters',
  passwordsDoNotMatch: 'Passwords do not match',
  invalidAmount: 'Please enter a valid amount',
  invalidDate: 'Please enter a valid date',
  invalidNumber: 'Please enter a valid number',
  
  // Form errors
  formErrors: 'Please correct the errors in the form',
  requiredFields: 'Please fill in all required fields',
  invalidForm: 'Form contains invalid data',
  
  // Data errors
  notFound: 'The requested item was not found',
  alreadyExists: 'Item already exists',
  cannotDelete: 'Cannot delete this item',
  cannotUpdate: 'Cannot update this item',
  noDataAvailable: 'No data available',
  
  // Transaction errors
  invalidTransaction: 'Invalid transaction data',
  transactionNotFound: 'Transaction not found',
  categoryRequired: 'Please select a category',
  amountRequired: 'Amount is required',
  descriptionRequired: 'Description is required',
  cannotDeleteRecurring: 'Cannot delete recurring transaction',
  cannotModifyPast: 'Cannot modify past transactions',
  
  // Category errors
  categoryInUse: 'Cannot delete category that has transactions',
  cannotDeleteDefault: 'Cannot delete default categories',
  categoryNameRequired: 'Category name is required',
  invalidCategoryType: 'Invalid category type',
  
  // File errors
  fileTooLarge: 'File size must be less than 10MB',
  invalidFileType: 'Please select a valid file type',
  uploadFailed: 'Upload failed. Please try again.',
  noFileSelected: 'No file selected',
  
  // Export errors
  exportFailed: 'Export failed. Please try again.',
  noDataToExport: 'No data available to export',
  exportLimitReached: 'Too many export requests. Please wait a moment.',
  
  // Rate limiting
  tooManyRequests: 'Too many requests. Please slow down.',
  rateLimitExceeded: 'Rate limit exceeded. Please try again later.',
  
  // Database errors
  databaseError: 'Database error occurred',
  queryFailed: 'Query failed to execute',
  connectionLost: 'Database connection lost',
  
  // Admin errors
  adminAccessRequired: 'Admin access required',
  superAdminRequired: 'Super admin access required',
  cannotModifyOwnRole: 'Cannot modify your own role',
  cannotDeleteYourself: 'Cannot delete your own account',
  
  // Recurring transaction errors
  cannotSkipNonRecurring: 'Cannot skip non-recurring transaction',
  cannotToggleNonTemplate: 'Cannot toggle non-template transaction',
  cannotSkipNonTemplate: 'Cannot skip non-template transaction',
  unknownInterval: 'Unknown interval type',
  noNextPayment: 'No next payment date available',
  invalidRecurringRule: 'Invalid recurring rule',
  
  // Business logic errors
  insufficientFunds: 'Insufficient funds',
  budgetExceeded: 'Budget exceeded',
  limitReached: 'Limit reached',
  operationNotAllowed: 'Operation not allowed',
  
  // Security errors
  suspiciousActivity: 'Suspicious activity detected',
  securityViolation: 'Security violation',
  ipBlocked: 'Your IP address has been blocked',
  accountLocked: 'Account locked due to security reasons',
  
  // System errors
  maintenanceMode: 'System is under maintenance',
  featureDisabled: 'This feature is currently disabled',
  resourceUnavailable: 'Resource temporarily unavailable',
  capacityExceeded: 'System capacity exceeded',
  
  // Recovery suggestions
  refreshPage: 'Try refreshing the page',
  clearCache: 'Try clearing your browser cache',
  checkConnection: 'Check your internet connection',
  loginAgain: 'Try logging in again',
  contactAdmin: 'Contact your administrator',
  
  // User actions that failed
  operationFailed: 'Operation failed',
  saveFailed: 'Failed to save changes',
  deleteFailed: 'Failed to delete item',
  updateFailed: 'Failed to update item',
  createFailed: 'Failed to create item',
  loadFailed: 'Failed to load data'
}; 