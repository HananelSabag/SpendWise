/**
 * BANK SYNC / BANK CONNECT TRANSLATIONS - English
 */

export default {
  // Page / panel title
  title: 'Bank Sync',
  // Dashboard balance hero — deliberately NOT "Bank Sync"; the dashboard is
  // the user's financial home, not a technical sync screen.
  balanceHeroTitle: 'Balance summary',
  refresh: 'Refresh data',

  // Account balance
  accountBalance: 'Account Balance',
  accountsListTitle: 'Bank accounts',
  totalBankBalance: 'Total bank balance',
  totalExcludesUnavailable: 'Total excludes accounts that don\'t share a balance',
  unavailable: 'Not available',
  unavailableNote: '{{bank}} does not expose account balance yet',
  balanceNeedsBank: 'Connect a bank account to see your balance — credit companies show charges only',
  mainAccount: 'Main account',
  balanceUnavailableNote: 'This bank does not expose account balance yet — check your bank\'s website directly',

  // Transaction summary
  income: 'Income',
  expenses: 'Expenses',
  cardCharges: 'Statement charges',
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
  saveError: 'Could not save — try again',
  statsLoadError: "Couldn't load your balance — your data is safe, this is a connection issue",
  connectionsLoadError: "Couldn't load your bank connections — try again",
  retry: 'Retry',

  // ── Bank Connect (self-service connections) ──
  connectBank: 'Connect a Bank',
  connectBankSubtitle: 'Automatic transaction sync, twice a day',
  myConnections: 'My Bank Connections',
  bankAccounts: 'Bank Accounts',
  creditCards: 'Credit companies',
  creditCardShort: 'card',
  cardActivity: 'Card Activity',
  noConnections: 'No banks connected yet',
  noConnectionsHint: 'Connect your bank and your transactions will appear here automatically',

  // What each source kind provides + auto-sync scheduling (E3)
  banksProvide: 'Real account balance and full transaction history',
  cardsProvide: 'Itemized card charges — these later post as one summarized charge in your bank account',
  nextAutoSync: 'Next automatic sync ~{{time}}',
  nextAutoSyncTomorrow: 'Next automatic sync ~{{time}} tomorrow',
  bankSectionEmpty: 'No bank account connected yet',
  cardSectionEmpty: 'No credit company connected yet',
  addBank: 'Add bank',
  addCard: 'Add credit company',

  // Financial cycle — the setting that drives every dashboard period summary
  financialCycleTitle: 'Financial cycle',
  financialCycleValue: 'Your financial month starts on day {{day}}',
  financialCycleHint: 'All dashboard summaries use this period — separate from your live bank balance. Tap a day to change it.',
  financialCycleSaved: 'Financial cycle updated',

  // Wizard steps
  stepPickBank: 'Choose your bank',
  stepPickBankOnly: 'Choose your bank',
  stepPickCard: 'Choose your credit company',
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
  fieldUserCode: 'User code',
  fieldPassword: 'Password',
  fieldNationalID: 'National ID (Teudat Zehut)',
  fieldId: 'ID Number',
  fieldCard6: 'Last 6 digits of card',
  fieldNum: 'Identification code',
  displayNameLabel: 'Nickname (optional)',
  displayNamePlaceholder: 'e.g. My main account',
  replacesExistingNote: 'This institution is already connected — saving here replaces its stored login details.',
  betaBadge: 'beta',
  betaNote: 'This institution is fully supported but has not been battle-tested with a live account yet. If a sync fails, let us know.',

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
  pausedAfterFailures: 'Paused after repeated failures — usually a changed bank password',
  tryAgain: 'Try again',
  lastSyncLabel: 'Last sync',
  neverSynced: 'Never synced',
  pause: 'Pause',
  resume: 'Resume',
  delete: 'Delete',
  deleteConfirmTitle: 'Delete this connection?',
  deleteConfirmBody: 'The encrypted credentials will be erased permanently.',
  deleteKeepsDataNote: 'Synced transactions and balances stay in SpendWise unless you also tick the box below.',
  deletePurgeLabel: 'Also delete all transactions and balances synced from this source',
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
  nextSyncAt: 'Next manual sync available at {{time}}',
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
  accountAsOf: '{{count}} transactions · as of {{date}}',
  accountNoActivity: 'No transactions synced yet',
  chargedLabel: 'charged',

  // Sync method — Default Host vs. the user's own paired computer
  syncMethodTitle: 'How your syncs run',
  syncMethodSubtitle: 'Choose which computer talks to your bank.',
  syncMethodDefaultTitle: "SpendWise's server",
  syncMethodDefaultBody: 'No setup — we handle it for you.',
  syncMethodOwnTitle: 'My own computer',
  syncMethodOwnBody: 'Run the SpendWise Agent yourself; only your computer ever sees your bank login.',
  syncMethodOwnTipLabel: 'How does this work?',
  syncMethodOwnTipStep1: 'Download the Agent and extract the folder anywhere on your PC.',
  syncMethodOwnTipStep2: 'Open SpendWiseWorker and tap "Get a pairing code" here.',
  syncMethodOwnTipStep3: 'Type the code into the Agent — that\'s the whole setup.',
  syncMethodOwnTipStep4: 'Reconnect your banks; from now on syncs run from this computer.',
  syncMethodOwnTipPrivacy: 'A paired computer runs ONLY your own account\'s syncs — it can never see or run another user\'s jobs, and your bank login never leaves it.',
  syncMethodDownload: 'Download the Agent',
  syncMethodSmartScreenHint: 'Windows may show a security warning since the app isn’t code-signed yet — click "More info" then "Run anyway".',
  syncMethodGenerateCode: 'Get a pairing code',
  syncMethodCodeExpires: 'Expires in {{minutes}} minutes',
  syncMethodCodeHint: 'Open the SpendWise Agent on your computer and enter this code.',
  syncMethodWaiting: 'Waiting for your computer to connect...',
  syncMethodPaired: 'Connected — {{label}}',
  syncMethodPairedSince: 'Connected since {{date}}',
  syncMethodUnpair: 'Switch back to SpendWise\'s server',
  syncMethodUnpairConfirmTitle: 'Switch sync method?',
  syncMethodSwitchConfirmTitle: 'Move syncs to your own computer?',
  syncMethodUnpairConfirmBody: "Your banks were connected for {{label}}. After switching you'll need to reconnect them — already-saved logins can't carry over.",
  syncMethodSwitchToOwnConfirmBody: "After connecting your own computer you'll need to reconnect your banks — already-saved logins can't carry over to the new device.",
  syncMethodConfirm: 'Switch anyway',
  syncMethodCancel: 'Cancel',
  syncMethodError: "Couldn't reach the pairing service — try again",

  // Bank account vs credit company — the model explainer on the sync page
  sourceModelTitle: 'Bank account or credit company?',
  sourceModelSubtitle: 'SpendWise keeps them separate so your dashboard shows real cash flow without double-counting card bills.',
  sourceModelBankTitle: 'Bank account',
  sourceModelBankText: 'Shows real balance, salary/income, transfers, cash withdrawals, fees, loans, and the monthly card-payment withdrawal.',
  sourceModelCardTitle: 'Credit company',
  sourceModelCardText: 'Shows itemized card purchases. It has no bank balance; when purchase details exist, SpendWise does not count the bank card-payment withdrawal again.',

  // Stats card scope — money figures follow the financial period, counts don't
  statsScopeNote: 'Income and expenses cover the selected financial period; the transaction count is everything ever synced.',
  cardStatsScopeNote: 'Statement charges use the debit/payment date reported by the credit company, so cycle-day totals match its statement. The transaction count is everything ever synced.',

  // How it works
  howItWorks: 'How does it work?',
  howItWorksStep1: 'You connect your bank — credentials are encrypted in your browser before they are sent',
  howItWorksStep2: 'A secure sync agent logs into your bank twice a day and reads your transactions',
  howItWorksStep3: 'Transactions appear in SpendWise automatically, just like ones you add yourself',
  howItWorksStep4: 'Each transaction is added exactly once — duplicates are impossible',

  // Bank names
  bankNames: {
    yahav: 'Yahav Bank',
    hapoalim: 'Bank Hapoalim',
    leumi: 'Bank Leumi',
    mizrahi: 'Mizrahi Bank',
    discount: 'Discount Bank',
    mercantile: 'Mercantile Bank',
    otsar_hahayal: 'Bank Otsar Hahayal',
    beinleumi: 'Beinleumi',
    massad: 'Massad',
    pagi: 'Pagi',
    isracard: 'Isracard',
    amex: 'Amex',
    visa_cal: 'Visa Cal',
    max: 'Max',
  },
};
