# Classification and Reconciliation Foundation Handoff

Date: 2026-07-11

Scope: deterministic, read-only financial classification and card reconciliation foundation.

Authors: Claude created the initial services; Codex reviewed, corrected, tested, and verified them against production.

## Status

- Foundation is implemented in new files only.
- No dashboard or API calculation has been switched to it yet.
- No transaction classification was persisted to `ledger_class`.
- Production verification was read-only.
- The previously confirmed phantom transaction `2470` was retired separately by Codex before this preview; it is not part of this change.

## Files added

- `server/services/financialClassificationService.js`
- `server/services/cardReconciliationService.js`
- `server/__tests__/financialClassificationService.test.js`
- `server/__tests__/cardReconciliationService.test.js`
- `server/scripts/preview-financial-classification.js`

## Calendar classification rules

1. Credit-card itemized purchases are economic spending on their factual purchase date.
2. Credit-card refunds reduce card spending; they are not earned income.
3. Monthly and immediate bank settlement rows are reconciliation evidence and are excluded from calendar spending.
4. Debit-card bank rows are primary spending. The card-company copy is optional enrichment and is excluded from spending.
5. ATM, ordinary bank expenses, fees, tax, direct payments, and loan repayments count as bank-direct spending.
6. Loan disbursements and securities transfers are excluded from earned income.
7. Salary is recognized only through a confirmed salary signature or explicit stored ledger class. Its economic-month offset remains auditable and does not rewrite the bank date.
8. Internal transfers are excluded only through an explicit signature, explicit pattern supplied by the caller, or stored ledger class. There is no unsafe broad transfer regex.
9. Unknown sources/types and settlement-looking bank rows without a known mapping remain `needs_review`; they are not silently discarded.
10. Pending spending is separated from posted spending. `netActual` excludes pending; `netCommitted` includes it.

Every classification includes:

- `economicRole`
- `sourceRole`
- `settlementRole`
- `calendarInclusion`
- `direction`
- `confidence`
- explainable `reason`
- reconciliation side/card identity when relevant

## Reconciliation grouping and matching

- Primary grouping key: provider `bank_source` + connected card account + `bank_processed_date`.
- All dates are normalized in `Asia/Jerusalem`; UTC conversion is forbidden for financial date keys.
- Leumi `לאומי ויזה` maps to Max. Only the audit-proven Leumi/Max identifier suffix is used to infer account `2254`.
- Leumi `כרטיסי אשראי` maps to Cal. An arbitrary bank identifier suffix is never treated as a Cal card number; a source with exactly one connected card may resolve safely to that card.
- Statement groups are recognized by installment evidence or a provider group spanning at least seven purchase days.
- Immediate batches are focused processed-date groups and are matched independently by date and amount.
- The former “largest settlement is monthly” heuristic was removed because large immediate batches and small statements exist.
- Missing processed dates are reported as unprocessed candidates. They make a statement `partial`, not a false mismatch.
- Pending bank settlements remain `partial` until finalized.
- Historical bank settlements with no captured provider itemization are `unavailable`, not mismatches.
- Debit is matched one-to-one by amount and date proximity. When exactly one debit card is known, unlabeled bank debit rows can safely belong to it. Bank-only debit rows remain valid spending.

## Tests

Full server suite:

- 15 suites passed
- 161 tests passed
- 0 failed

Fixtures cover:

- Max 2254 monthly statement
- all immediate-batch semantics
- Max 8345 debit
- Cal 9962 historical and forming statements
- pending versus posted
- refunds
- salary attribution
- loan/security/internal-transfer exclusions
- ATM and loan repayment
- unknown/needs-review behavior
- Israel-time date boundaries
- prevention of “multi-row immediate batch = monthly statement” misclassification

## Read-only production preview for user 1

Command:

`node server/scripts/preview-financial-classification.js hananel12345@gmail.com --summary`

June 2026, after the confirmed duplicate retirement:

- earned income: ₪13,497.66
- salary: ₪13,327.75
- other income: ₪169.91
- card spending, excluding debit enrichment: ₪11,714.44
- bank-direct spending, including debit: ₪3,762.45
- total actual spending: ₪15,476.89
- actual net: -₪1,979.23

These exactly match the independent forensic audit.

July 2026 to date:

- posted card spending: ₪4,654.61
- posted bank-direct spending: ₪1,171.69
- pending card spending: ₪700.00
- pending bank-direct spending: ₪1,540.44
- actual spending: ₪5,826.30
- committed spending: ₪8,066.74

Reconciliation preview:

- unresolved bank settlements: 0
- unattributed debit rows: 0
- Max 2254: 7 immediate batches matched exactly
- Max July statement: `partial`; bank pending ₪12,744.22, captured processed group ₪11,746.88, unprocessed candidates ₪539.36
- Max June bank statement: `unavailable` because its provider purchases are outside the captured window
- Cal June settlement ₪4,734.66: `unavailable`, not mismatch
- Cal forming group: completed ₪2,375.70, pending ₪700.00
- Max 8345 debit: 3 bank/card pairs matched; orphan ₪88 and pending ₪454 remain valid bank-only facts

## Remaining uncertainty

1. The scraper still needs a new sync to populate migration-23 metadata on historical rows. Current production rows mostly predate the metadata rollout.
2. The provider is missing Max installment 5/10 (₪518.98); code cannot invent it. The statement correctly remains partial.
3. Automatic debit-card discovery currently relies on a bank memo that names a connected last-four. A future scraper-level card-type field would be stronger.
4. Multiple same-provider credit cards without an explicit settlement account require stored `settlement_card_account` or provider evidence; unresolved rows must stay visible.
5. Internal transfers require explicit user/system-confirmed signatures. Broad text guessing would misclassify Bit/PayBox and genuine third-party transfers.

## Recommended integration order

1. Replace `monthlyAccountingService`'s broad `SETTLEMENT`/`FINANCING` SQL regex model with this classifier or an equivalent SQL projection.
2. Keep reconciliation output separate from calendar totals and remove the artificial month-M versus month-M+1 `difference` from `needs_review`.
3. Expose two API models:
   - calendar Monthly Performance;
   - operational Money Cycle / known commitments.
4. Add card/provider reconciliation to Insights, not the dashboard headline.
5. Persist `ledger_class` and settlement identity only after a previewed, versioned backfill; do not rewrite transaction dates.

## Explicit non-actions

- No production transaction was modified by the preview.
- No migration was run.
- No data was deleted.
- No dashboard/UI file was changed.
- No commit or push was performed before Codex review.
