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

  // Bank names
  bankNames: {
    yahav: 'Yahav Bank',
    isracard: 'Isracard',
    max: 'Max',
    discount: 'Discount Bank',
  },
};
