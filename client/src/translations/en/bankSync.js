/**
 * BANK SYNC / BANK CONNECT TRANSLATIONS - English
 */

export default {
  // Page / panel title
  title: 'Bank Sync',
  refresh: 'Refresh data',

  // Account balance
  accountBalance: 'Account Balance',
  unavailable: 'Not available',
  unavailableNote: '{{bank}} does not expose account balance yet',
  mainAccount: 'Main account',
  balanceUnavailableNote: 'This bank does not expose account balance yet — check your bank\'s website directly',

  // Transaction summary
  income: 'Income',
  expenses: 'Expenses',
  netActivity: 'Net Activity',
  transactions: '{{count}} transactions',
  transactionsShort: 'Txns',

  // Time
  justNow: 'Just now',
  minutesAgo: '{{n}}m ago',
  hoursAgo: '{{n}}h ago',
  daysAgo: '{{n}}d ago',
  updatedAt: 'Updated {{time}}',
  syncedDaily: 'Synced automatically · twice a day',

  // Errors
  loadError: 'Could not load sync data',

  // ── Bank Connect (self-service connections) ──
  connectBank: 'Connect a Bank',
  connectBankSubtitle: 'Automatic transaction sync, twice a day',
  myConnections: 'My Bank Connections',
  noConnections: 'No banks connected yet',
  noConnectionsHint: 'Connect your bank and your transactions will appear here automatically',

  // Wizard steps
  stepPickBank: 'Choose your bank',
  stepCredentials: 'Login details',
  stepConfirm: 'Review & confirm',
  back: 'Back',
  next: 'Next',
  connect: 'Connect',
  connecting: 'Connecting...',
  connected: 'Bank connected!',
  connectedNote: 'The first sync will run within a few hours. Transactions appear automatically.',
  done: 'Done',

  // Credential fields (per bank)
  fieldUsername: 'Username',
  fieldPassword: 'Password',
  fieldNationalID: 'National ID (Teudat Zehut)',
  fieldId: 'ID Number',
  fieldCard6: 'Last 6 digits of card',
  fieldNum: 'Identification code',
  displayNameLabel: 'Nickname (optional)',
  displayNamePlaceholder: 'e.g. My main account',

  // Security explainer
  securityTitle: 'Your credentials are safe',
  securityPoint1: 'Encrypted in your browser before they leave this device',
  securityPoint2: 'Our servers store only encrypted data they cannot read',
  securityPoint3: 'Only the sync machine can decrypt — and it keeps nothing on disk',
  securityPoint4: 'Delete the connection anytime — the encrypted data is erased forever',
  consentLabel: 'I understand SpendWise will log into my bank account on my behalf to read transactions',

  // Connection card
  statusActive: 'Active',
  statusPaused: 'Paused',
  statusError: 'Needs attention',
  pausedAfterFailures: 'Paused after repeated failures — check your credentials and resume',
  lastSyncLabel: 'Last sync',
  neverSynced: 'Never synced',
  pause: 'Pause',
  resume: 'Resume',
  delete: 'Delete',
  deleteConfirmTitle: 'Delete this connection?',
  deleteConfirmBody: 'The encrypted credentials will be erased permanently. Synced transactions stay in SpendWise.',
  cancel: 'Cancel',

  // Live job states (shown on the connection card)
  jobWaiting: 'Sync queued — waiting for the sync agent',
  jobWaitingHint: 'Runs when your sync computer is on (within ~30 min)',
  jobSyncing: 'Syncing now…',
  lastAttemptFailed: 'Last sync failed: {{error}}',

  // Sync now / rate limits
  syncNow: 'Sync Now',
  syncQueued: 'Sync queued! It will run within ~30 minutes',
  syncQuotaReached: 'Daily sync limit reached (2/day) — protects your bank account from lockouts',
  syncTooSoon: 'Please wait at least 3 hours between syncs',
  syncInFlight: 'A sync is already in progress',
  connectionPaused: 'This connection is paused',

  // Jobs history
  recentSyncs: 'Recent syncs',
  jobDone: 'Completed',
  jobFailed: 'Failed',
  jobPending: 'Waiting',
  jobRunning: 'Running',
  triggerManual: 'Manual',
  triggerSchedule: 'Scheduled',
  newTransactions: '{{n}} new',

  // Update credentials
  updateCredentials: 'Update credentials',

  // Per-account sync toggle
  accounts: 'Accounts',
  accountSyncOn: 'Syncing',
  accountSyncOff: 'Not syncing',
  accountDisabledHint: 'Transactions from this account are not imported',

  // How it works
  howItWorks: 'How does it work?',
  howItWorksStep1: 'You connect your bank — credentials are encrypted in your browser before they are sent',
  howItWorksStep2: 'A secure sync agent logs into your bank twice a day and reads your transactions',
  howItWorksStep3: 'Transactions appear in SpendWise automatically, just like ones you add yourself',
  howItWorksStep4: 'Each transaction is added exactly once — duplicates are impossible',

  // Bank names
  bankNames: {
    yahav: 'Yahav Bank',
    leumi: 'Bank Leumi',
    isracard: 'Isracard',
    max: 'Max',
    discount: 'Discount Bank',
  },
};
