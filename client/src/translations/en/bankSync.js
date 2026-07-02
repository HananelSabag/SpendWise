/**
 * BANK SYNC TRANSLATIONS - English
 */

export default {
  // Panel / page title
  title: 'Bank Sync',
  subtitle: 'bank-scraper integration',
  refresh: 'Refresh data',

  // Account balance
  accountBalance: 'Account Balance',
  unavailable: 'Not available',
  unavailableNote: '{{bank}} does not expose account balance via the scraper library',
  mainAccount: 'Main account',
  balanceUnavailableNote: 'This bank does not expose account balance via the library — check your bank\'s website directly',

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
  lastSync: 'Last sync',
  syncedDaily: 'Synced via bank-scraper · 3× daily',

  // Empty / not synced
  notSynced: 'No banks synced yet',
  notSyncedYet: 'Not synced yet',
  runScraper: 'Run bank-scraper to pull your transactions',

  // Bank card
  enableBank: 'Enable bank',
  disableBank: 'Disable bank',
  bankDisabledNote: 'Transactions from this bank are hidden from calculations',

  // Load error
  loadError: 'Could not load sync data',

  // Remote trigger section
  remoteTrigger: 'Remote Trigger (serve.js)',
  serverUrl: 'Server URL',
  enterServerAndKey: 'Enter server address and API Key',
  syncNow: 'Sync Now',
  syncing: 'Syncing...',
  syncStarted: 'Sync started! Data will appear here in a few minutes',
  errorStatus: 'Error: {{status}}',
  cannotConnect: 'Cannot connect to server — make sure it is running',
  serverSessionNote: 'URL is stored only for this session (never sent to SpendWise server)',

  // How it works
  howItWorks: 'How does it work?',
  howItWorksStep1: 'bank-scraper runs on your computer (or server) and connects to the bank',
  howItWorksStep2: 'It pulls the last 30 days of transactions and sends them here automatically',
  howItWorksStep3: 'Bank transactions appear in SpendWise just like regular transactions',
  howItWorksStep4: 'Each transaction is added only once — dedup prevents duplicates',
  manualSyncTitle: 'Manual sync',
  manualSyncOr: 'or',
  doubleClickBat: 'double-click run.bat',
  mobileTrigger: 'Trigger from mobile',
  mobileTriggerNote: 'Start node serve.js on your computer, then tap "Sync Now" in the app',

  // Footer note
  toggleNote: 'Toggles control what is displayed — data is always in the database',

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

  // Sync now / rate limits
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

  // Bank names
  bankNames: {
    yahav: 'Yahav Bank',
    isracard: 'Isracard',
    max: 'Max',
    discount: 'Discount Bank',
  },
};
