export default {
  pageTitle: "Financial cycle",
  dashboardEyebrow: "What will be left in your account?",
  balanceNow: "Balance now",
  cardsKnown: "Card charges still to be paid",
  fixedOut: "Loan and recurring payments",
  expectedIncome: "Income still expected",
  openDetails: "Open financial cycle",
  openSetup: "Set up cycle",
  positionTitle: "Your expected checking balance",
  saving: "Saving…",
  syncing: "Updating…",
  partialBalance:
    "The balance is missing for some enabled accounts. The projection may therefore be incomplete.",
  anchorTitle: "When should your cycle start?",
  anchorHint:
    "No monthly card billing day has been identified yet. You can choose a day of the month yourself.",
  noBankTitle: "Start by connecting a bank",
  noBankHint:
    "Bank transactions are needed to calculate the cycle. A checking balance is also needed to show the expected balance.",
  loadError: "We could not load the financial cycle",
  tryAgain: "Try again",
  refresh: "Refresh",
  pageTabs: "Financial cycle sections",
  tab_overview: "Overview",
  tab_recurring: "Recurring",
  tab_loans: "Loans",
  tab_settings: "Settings",
  calculationTitle: "How this balance adds up",
  calculationHint:
    "Your current balance already includes money received and paid. Only movements still to come are added or deducted. A card bill and the purchases behind it are counted once.",
  upcomingTitle: "Still to come before this cycle ends",
  noUpcoming:
    "No further movements were found for the available data and your current selection.",
  billsOn: "Billing day",
  previousBill: "Previous bill · for comparison",
  cardForecast: "Estimated total bill",
  cardSettings: "Card settings",
  billingDay: "Billing day",
  engineTitle: "How is your cycle day chosen?",
  engineHint:
    "Choose a fixed day to separate your cycles. Every salary received in the period counts as income; salaries do not change the cycle dates.",
  automaticEngine: "From your cards",
  manualEngine: "Choose a day",
  manualDay: "Day of the month",
  recurringTitle: "Your recurring transactions",
  noRecurring: "Your recurring transactions will appear here",
  ruleName: "Recurring transaction name",
  saveName: "Save name",
  financing: "Money received as financing",
  recurringExpense: "Recurring expense",
  estimateExtra: "Additional estimated expenses",
  balanceAfterForecast: "Balance based on the forecast",
  balanceAfterKnown: "Balance after known charges",
  alreadyDirect: "Payments made directly from checking",
  cardsOverviewTitle: "Your cards",
  noCardTransactions: "No transactions to show for this charge.",
  alreadyFromBalance: "Already left the balance",
  knownNextCharge: "Awaiting the next bill",
  forecastExtra: "Forecast extra",
  transactionsCount: "Number of transactions",
  directSettingsHint:
    "A debit card charges your checking account for each purchase. There is no extra monthly bill to add to the forecast.",
  cardSettingsHint:
    "Link the bank debit to this card’s purchases so future bills can be matched and counted once.",
  linkBankCharge: "Which bank-account charge belongs to this card?",
  chooseBankCharge: "Choose a bank charge to link",
  bankChargeLinked: "Bank charge linked and saved",
  addRecurringTitle: "Add a recurring transaction",
  addRecurringHint:
    "A recurring checking payment is included in “Known only”. Future income and recurring card purchases not yet accumulated appear only in “With forecast”.",
  loadingTransactions: "Loading transactions…",
  chooseRecurringTransaction: "Which transaction repeats each month?",
  loanPayment: "Loan repayment",
  standingOrder: "Standing order",
  recurringIncome: "Recurring income",
  recurringKnownHint:
    "Monthly payments and income based on transactions you linked. Pause or remove them from future calculations without deleting recorded transactions.",
  searchTransactions: "Search by description, source, date or amount…",
  transactionDirection: "Transaction type to choose",
  picker_all: "All",
  picker_expense: "Expenses",
  picker_income: "Income",
  transactionsFound: "{{count}} transactions found",
  showMoreTransactions: "Show {{count}} more",
  unnamedTransaction: "Unnamed transaction",
  unknownSource: "Unknown source",
  noPickerResults: "No matching transactions",
  linkAnother: "Link another transaction",
  linkToRule: "Which transaction belongs to “{{label}}”?",
  loadingLoans: "Loading loans…",
  loansTitle: "Loans and repayments",
  loansSourceHint:
    "Possible loan series, identified by linked incoming and outgoing bank transactions. This pattern can also be a deposit or transfer; review the source payments before treating it as a loan.",
  paymentCount: "{{count}} recorded payments",
  engineSettingsNote:
    "This only changes the period being calculated and displayed. It does not change bank billing dates or original transactions.",
  scenarioLabel: "What to include in the calculation",
  scenarioKnown: "Known only",
  scenarioForecast: "With forecast",
  scenarioHelp:
    "“Known only” includes accumulated charges and established obligations. “With forecast” adds income not yet received and estimated expenses. The selection is also saved on your home screen.",
  projectionThrough: "Through {{date}}",
  knownScenarioHint:
    "Your current balance, minus unpaid card charges and established recurring payments. Income not yet received is excluded.",
  forecastScenarioHint:
    "Known charges, plus income still expected and additional estimated expenses. This is not money already in the bank.",
  balanceUnavailable:
    "A balance is not available from the bank yet. The upcoming movements are still shown below.",
  noForecastDifference:
    "There is no expected income or additional estimated spending right now, so both choices show the same balance.",
  resultBalance: "Balance after the calculation",
  calculationExplain: "What is included in each line?",
  knownSourceNote:
    "Card charges come from synced purchases. Loan and recurring payments are based on earlier transactions. Final amounts and dates can still change.",
  forecastSourceNote:
    "Adds expected income, detected recurring payments and possible card growth. Each previous card bill is shown for comparison only; it is not added again.",
  soFar: "So far in this cycle",
  received: "Income received",
  spent: "Expenses recorded",
  loadingCycle: "Loading the financial picture…",
  backDashboard: "Home",
  connectBank: "Connect a bank",
  chooseCycleDay: "Choose a day of the month",
  staleData:
    "Refresh failed. The previous snapshot is shown; try refreshing again.",
  upcomingKnownHint:
    "Unpaid charges by expected date. Future income is not included in this selection.",
  upcomingForecastHint:
    "The dates and movements behind the forecast. Estimates and income not yet received are labelled separately.",
  cardRecurringExtra: "Additional recurring card purchases",
  incomeNotSeen: "Expected date has passed · not seen in the latest sync",
  estimateSource: "Estimated · not yet recorded by the bank",
  cardSource: "Purchases already assigned to this charge",
  fixedSource: "Date and amount based on an earlier payment",
  activityTitle: "Already in your balance",
  activityHint:
    "Open a row to see the recorded transactions. These amounts are not deducted again in the forecast.",
  actualCardHint:
    "Card charges already paid are detailed under each card below.",
  financingSeparate:
    "Already included in your bank balance, but not counted as regular income.",
  installment: "Payment {{number}} of {{total}}",
  cardsOverviewHint:
    "For each card: what has been paid, what is still due and what is estimated.",
  directCardLabel: "Immediate debit",
  monthlyCardLabel: "Monthly credit card",
  includeCard: "Include this card in the calculation",
  cardExcluded:
    "This card is excluded from the cycle calculation. Your checking balance remains the amount reported by the bank.",
  chooseDay: "Choose a day",
  changeLinkedCharge: "Change linked bank charge",
  cardLinkPickerHint:
    "Choose the bank-account debit that paid this card bill. This link helps identify the card on future statements.",
  nextChargeDate: "Expected bank debit: {{date}}",
  noCardDueInCycle:
    "No unpaid monthly bill was identified before this cycle ends.",
  cardForecastMedian:
    "Based on {{count}} previous bills (median), never below accumulated charges. This is the total bill, not an additional charge.",
  cardForecastCapped:
    "Based on two previous bills, with up to 25% added to accumulated charges. This is the total bill, not an additional charge.",
  cardForecastKnown:
    "There is not enough history to add an estimate. Only accumulated charges are shown.",
  openCardBreakdown: "View transactions",
  cardBreakdownLabel: "Card transaction period",
  paidThisCycle: "Already paid this cycle",
  upcomingCard: "In the upcoming bill",
  transactionsShort: "transactions",
  matchedBankEvidence: "Matched to the bank debit; counted once",
  noSettledCard: "No paid charges for this card in the current cycle.",
  ruleIncluded: "Included in future calculations",
  rulePaused: "Future occurrences paused",
  ruleDetails: "Details and linked transactions ({{count}})",
  linkedEvidenceHint:
    "These linked transactions identify the payment or income each month. Each amount belongs to an original transaction; it is not the monthly total.",
  removeRuleHint:
    "Remove this recurring transaction from future calculations? Recorded transactions will not be deleted.",
  removeRule: "Remove from recurring",
  cancel: "Cancel",
  loadTransactionsError: "Could not load transactions",
  newRecurring: "Define the recurring transaction",
  recurringType: "Transaction type",
  saveRecurring: "Save recurring transaction",
  recurringSaved: "Recurring transaction saved and the calculation updated.",
  noRecurringHint:
    "Choose a payment or income transaction, give it a clear name, and link it once.",
  automaticEngineHint:
    "Uses the latest monthly billing day among included credit cards.",
  manualEngineHint: "Choose one monthly day that suits your account.",
  shortMonthHint: "If the month is shorter, its last day is used.",
  currentWindow: "Current cycle",
  defaultScenario: "What to include in your expected balance",
  loanRemainderEstimate: "Balance calculated from transactions",
  loanEstimateWarning:
    "Amount received minus repayments we can see. Payments may include interest and history may be incomplete; this is not a payoff balance supplied by the bank.",
  loadLoansError: "Could not load loan information",
  loanFirstSeen: "Amount received on {{date}}",
  loanReceived: "Amount received",
  loanPaid: "Repayments recorded",
  loanNoRemaining:
    "Recorded repayments cover the original amount. This does not confirm closure: payments can include interest and fees. Check the balance with your bank.",
  noDetectedLoans: "No loan series identified",
  noLoansHint:
    "Have a loan that is not shown here? Link one of its repayments as a recurring transaction.",
  manageRepayments: "Manage recurring repayments",
  unmatchedCards: "{{count}} card movements still need bank confirmation",
  unmatchedCardsHint:
    "These card records have not been matched to a bank movement, so they are not counted as settled spending. Check the next bank sync or link the corresponding debit in card settings.",
};
