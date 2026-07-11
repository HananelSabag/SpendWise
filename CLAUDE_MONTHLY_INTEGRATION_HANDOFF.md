# Monthly Accounting Integration Handoff

Date: 2026-07-11
Author: Claude (independent auditor lane), continuing after Codex's classification/reconciliation foundation (`d253ed4`).

## What this change does

Rewires `server/services/monthlyAccountingService.js` (`buildMonth`) to compute
the calendar-month result from the **proven** deterministic engine instead of the
old broad `SETTLEMENT`/`FINANCING` regex + the artificial month-M-vs-month-(M+1)
`difference`.

- Calendar totals now come from `financialClassificationService.summarizeCalendar`
  (every economic expense counted once; debit is bank-primary; monthly/immediate
  settlements excluded; loans/securities excluded from earned income).
- Statement reconciliation comes from `cardReconciliationService.reconcile`,
  grouped by provider statement, **kept separate** from the calendar total. A
  pending settlement yields `awaiting_settlement`/`unavailable` — never a
  fabricated `needs_review`.
- Salary is attributed to its economic month by the signature offset (bucketing
  identical to the validated preview script).
- Ledger facts are untouched: no dates rewritten, no rows mutated, no migration.

The **return shape is unchanged**, so the dashboard and client keep working with
no client edit required.

## Files changed (this lane)

- `server/services/monthlyAccountingService.js` — `buildMonth` rewired to the
  engine; salary attributed by economic month; debit identity derived from all
  history (not just the window); returns an additive `breakdown` + `needsReview`.
- `server/services/financialClassificationService.js` — added pure
  `spendingBreakdown(rows, context)` (counts each economic expense once; excludes
  settlements, debit enrichment, income and refunds).
- `server/services/dashboardService.js` — `categoryBreakdown` now prefers
  `monthly.breakdown` (classifier) over the legacy backwards-regex SQL, which is
  kept only as a fallback.
- `ROADMAP.md` — phases C and F marked integrated/done.

`git diff --stat`: 4 files, +233 / −89. No Codex-owned file was touched
(`bankSyncService.js`, `bankPendingDedupService*`, `preview-pending-settled-dedup.js`,
migration 23 all untouched). The classification/reconciliation engine, its tests
and preview script (Codex `d253ed4`) are consumed as-is aside from the additive
`spendingBreakdown` helper.

## Breakdown correctness (verified on production)

The classifier breakdown reconciles to the headline and drops the legacy bugs:
- June full breakdown sum = **15,476.89** = `spending.committed`; July = **8,066.74**.
- No settlement bucket (no ₪12,744 / ₪14,213 / ₪4,734 line); the old backwards
  `visa_cal`↔`max` mapping let those leak in before.
- Debit is a single "Card Spending" bucket from the bank-primary rows; the Max-8345
  enrichment copy is excluded (no double count).

## Contract preserved (verified against consumers)

`buildMonth`/`buildOverview` still return:
`{ ...period, status, income:{actual,salaryActual,other},
spending:{bankDirect,cardPosted,cardPending,manual,actual,committed,cardDataMode},
net:{actual}, dailyAverage:{income,spending},
reconciliation:{status,itemizedTotal,settlementTotal,difference}, transactionCount }`
(+ an additive `needsReview` array).

Consumers verified:
- `dashboardService.js` (lines ~464–468) overrides `summary.total_income/
  total_expenses/net_balance` from `buildMonth` → the **PeriodSummary hero** now
  shows corrected figures.
- `controllers/transactionController.js` `getMonthlyAccounting` → `buildOverview`
  → `useDashboard` → **`MonthlyAccountingSummary`** cards (mounted in
  `ModernDashboard.jsx:113`) now show corrected previous/current months.
- `__tests__/calendarMonthMigration.test.js` guard preserved: the file still
  contains `actualIncome - committed` and no `estimated`/`salary_estimate` token.

## Verification (independent, read-only)

Full server suite: **15 suites / 161 tests passed** (before and after this change).

`buildOverview(1)` run directly against production (SELECT-only) now returns:

| | June (previous) | July (current) |
|---|---:|---:|
| income.actual | 13,497.66 | 0 |
| income.salaryActual | 13,327.75 | 0 |
| spending.cardPosted | 11,714.44 | 4,654.61 |
| spending.bankDirect | 3,762.45 | 1,171.69 |
| spending.cardPending | 0 | 700 |
| spending.committed | **15,476.89** | **8,066.74** |
| net.actual | −1,979.23 | −8,066.74 |
| status | awaiting_settlement | open |
| reconciliation.status | unavailable | unavailable |
| needsReview | 0 | 0 |

These match the forensic audit exactly. Compared to the old model:
- June spending corrected from 15,388.89 → **15,476.89** (+₪88.00: the 2026-06-05
  orphan debit id 1961 that the old model dropped is now counted as bank-direct).
- The artificial **₪2,951.47** `needs_review` is gone; June is
  `awaiting_settlement` (the real July settlement is still pending), and the
  reconciliation "פער" line is hidden (`unavailable`) rather than showing a false
  discrepancy.
- Debit card 8345 is bank-primary; its Max copy is excluded enrichment.

## Behaviour notes

- `reconciliation.status` is deliberately conservative: `matched` only when a
  captured statement matches within tolerance, `mismatch` only when both sides are
  final and differ, otherwise `unavailable` (pending/partial/not-yet-settled).
  This is what keeps a pending settlement from producing a false "פער".
- Month status: `open` (current) → `awaiting_salary` (no salary yet) →
  `awaiting_settlement` (salary in, settlement pending) → `needs_review`
  (real final mismatch or unclassified rows) → `closed`.
- Unconnected-card fallback (spec §2.3) is preserved: when no card of a company is
  connected, the next-month bank settlement is used as a clearly-labelled
  `settlement_fallback` card spend. User 1 has all cards connected → `itemized`.

## Remaining work (not in this change)

1. **Secondary dashboard breakdowns still use legacy regex.** `dashboardService`'s
   `categoryBreakdown`, `bankCosts`, `sources`, and `recurringPatterns` SQL still
   use `BANK_PATTERN_CASE` / `CARD_SETTLEMENT_SOURCE_PATTERNS` /
   `BANK_CARD_SETTLEMENT_PATTERN` (including the backwards `visa_cal`↔`max` brand
   mapping the audit flagged). The **headline** numbers are correct now, but these
   breakdown widgets should be migrated to the classifier next.
2. **Historical metadata is still NULL** on rows synced before migration 23; the
   classifier falls back to base-field signals, so results are correct today, but
   `installment_number`/`original_amount`/`txn_kind` populate only on re-sync.
3. **Persisting `ledger_class`/`settlement_card_*`** should follow a previewed,
   versioned backfill (not done here; nothing was persisted).
4. **Performance:** `buildMonth` now fetches a 4-month window and runs classify +
   reconcile in JS. It is a few hundred rows and fine, but if `buildOverview` (2×
   `buildMonth`) becomes hot, share one fetch across both months.

## Confirmation

- No commit, no push.
- No production data mutated; no migration run; phantom 2470 untouched (already
  retired by Codex in `15cf094`).
- Only `server/services/monthlyAccountingService.js` is modified in the working
  tree; Codex-owned files were not edited.

## 2026-07-12 Runway + Codex review addendum

Claude subsequently added the approved salary-to-salary operational lens:

- `server/services/cycleRunwayService.js`
- `GET /api/v1/transactions/cycle`
- client API/hook wiring
- `RunwayCard` on the dashboard

The current cycle is anchored on the latest confirmed salary and shows the real
checking balance, posted/committed spending, non-salary income, pending spending,
and daily averages. The previous cycle is salary-to-salary when enough confirmed
salary history exists, otherwise it is explicitly labelled as a calendar fallback.

Hananel confirmed that `גלש"ן שווקים-י` was his previous employer. Salary
signature id 2 was created with approval; the classifier now lets a confirmed
salary signature override generic text guesses. The salary-candidate filter was
also corrected so this employer is no longer hardcoded as securities.

Codex reviewed the final worktree before push and fixed mixed connected-card
fallback: itemized sources and unconnected-provider settlement fallback can now
coexist without the former all-or-nothing `hasConnectedCard` decision.
