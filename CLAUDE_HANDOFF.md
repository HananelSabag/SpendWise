# SpendWise — continuation prompt for Claude

Copy the prompt below into a new Claude session. Do not restart the project or
redo completed work.

---

## Prompt

You are continuing the SpendWise production rebuild after Codex and the previous
Claude session. The user does not want to repeat the history.

First read these files completely:

1. `C:\CodingProjects\SpendWise\ROADMAP.md`
2. `C:\CodingProjects\SpendWise\MONTHLY_ACCOUNTING_SPEC.md`
3. `C:\CodingProjects\SpendWise\CLAUDE_HANDOFF.md`
4. `C:\CodingProjects\SpendWise\docs\bank-sync-architecture-map.md`
5. `C:\CodingProjects\spendwise-agent\README.md`

There are two connected repositories:

- `C:\CodingProjects\SpendWise` — React client, Node server, Supabase model.
- `C:\CodingProjects\spendwise-agent` — local bank scraper and Windows Worker.

Continue from the pending checklist below. Update both `ROADMAP.md` and this
handoff after every meaningful phase so Codex can resume later if Claude reaches
its usage limit. Do not claim production data is fixed without comparing RAW,
Supabase and the rendered UI. Do not commit RAW financial files or the existing
ZIP bundles.

### Production baseline — already completed

- GitHub:
  - SpendWise commit `d3f9e19` pushed to `main`.
  - Agent commit `1e5c17d` pushed to `main`.
- Render production is live on `d3f9e19`, with no deploy errors found.
- Vercel production is `READY` on `d3f9e19`.
- Supabase retention migration is installed and scheduled; its current dry run
  reports zero eligible rows.
- RAW captures from 2026-07-11 exist locally and must remain uncommitted:
  - `spendwise-agent/scraped-data/raw-leumi.json` — 23 transactions.
  - `spendwise-agent/scraped-data/raw-max.json` — 101 transactions / two cards.
  - `spendwise-agent/scraped-data/raw-visa_cal.json` — 9 transactions.
- Production reconciliation was applied:
  - Replayed all three RAW captures through the real `ingestAccounts` path for
    user 1.
  - Repaired 136 legacy bank dates to `Asia/Jerusalem` (users 1 and 34).
  - User 1 `billing_cycle_day` changed from workaround 8 back to real salary day 9.
  - Salary now belongs to July 9 and retains the bank memo containing “משכורת”.
  - Pending `לאומי ויזה` refreshed from stale ₪12,523.22 to RAW truth ₪12,744.22.
  - Current period is now `[2026-07-09, 2026-08-09)` with income ₪13,327.75,
    bank cash-flow expenses ₪14,284.66 and itemized card charges ₪14,822.58.

## Completed checklist

### Data truth and ingestion

- [x] Capture Leumi, Max and Visa Cal RAW output before mapping.
- [x] Compare RAW fields against live Supabase rows.
- [x] Normalize transaction `date` in `Asia/Jerusalem`.
- [x] Preserve purchase date and card statement/processed date separately.
- [x] Make deduped re-sync repair date and transaction timestamp.
- [x] Refresh changed pending amount/type/description/status instead of freezing
      the first version.
- [x] Preserve provider `memo` as bank notes (salary markers, transfer recipient,
      PayBox/Bit detail).
- [x] Reconcile existing production rows and restore cycle day 9.
- [x] Add reusable read-only audit script:
      `SpendWise/server/scripts/audit-sync-data.js`.
- [x] Add reusable RAW reconciliation tool:
      `spendwise-agent/tools/reconcile-raw-to-db.js` (preview by default).

### Historical dashboard/cycle groundwork already done

- [x] Period totals use honest bank cash flow, avoiding double-counting the bank
      card settlement plus itemized card purchases.
- [x] Current period visibly says “so far”.
- [x] Period boundaries support historical offsets and valid `minOffset`.
- [x] Period tooltip shows bank movement, bank card bill and manual entries.
- [x] Period tooltip now also shows itemized Max/Cal charges as reconciliation
      detail, explicitly not added twice.
- [!] Legacy period queries use `bank_processed_date` for card membership. The
      approved calendar-month model explicitly replaces this assumption: purchase
      month comes from purchase `date`; processed date is reconciliation metadata.
- [x] Dashboard DB pool now leaves Supabase connection headroom (`DB_POOL_MAX`,
      default 8) instead of allowing one process to consume all 15 sessions.

### Database retention

- [x] `server/DB Migrations/20_data_retention.sql` is installed.
- [x] Daily Supabase cron cleans operational data only.
- [x] Transactions, balances and user-facing financial history are never deleted.
- [x] Dry-run preview, advisory lock, conservative retention windows and cleanup
      audit history exist.

### Windows Worker / Agent

- [x] Default Host redesigned to a clean, softer light UI.
- [x] Removed the tag/badge/explainer overload from Default Host.
- [x] Added real live stages from agent logs and an elapsed timer.
- [x] Fixed disappearing Stop Worker button and added subtle rounded borders.
- [x] Added RAW debug toggle inside the Worker; RAW debug is currently active.
- [x] Automatic checks align to wall-clock `:00` / `:30` instead of drifting
      30 minutes from the moment the Worker happened to start.
- [x] General/personal Worker UI was deliberately left for a later design pass.
- [!] Windows Smart App Control blocks the newly built unsigned single-file EXE.
      The current Default Worker runs the same DLL through Microsoft-signed
      `dotnet`. Distribution needs trusted code signing; do not disable Windows
      security as a workaround.

### Scheduled sync alignment

- [x] Corrected the server default from accidental 07:00/18:00 to intended
      07:00/19:00 in `Asia/Jerusalem`.
- [x] Each wall-clock target now resolves with its own DST offset, including the
      previous-day target around Israel DST transitions.
- [x] Worker polling aligns to `:00` and `:30`; when the PC is online it can hit
      the target minute. If it was asleep/offline, the next poll catches up.

## Pending checklist — continue in this order

### Calendar-month model completed by Codex (2026-07-11)

- [x] Replaced primary cycle-day accounting with calendar months.
- [x] Dashboard shows current month first and previous month directly underneath.
- [x] Current month uses actual income only; salary and net are never estimated.
- [x] Salary paid next month is attributed to the previous work month by a
      confirmed description+account signature.
- [x] Added compact salary-candidate selection for users awaiting classification.
- [x] Purchase `date` determines card month; `processedDate` remains metadata.
- [x] Connected-card bank settlement is reconciliation only and never another
      expense; unconnected cards receive a labelled settlement fallback.
- [x] Added daily income/spending averages and month completion/review statuses.
- [x] Removed cycle-day settings/onboarding/server reads. Render and Vercel reached
      healthy production state on `7918d58`, then migration 22 removed
      `users.billing_cycle_day` from production Supabase.
- [x] Production shadow result for user 1: July income ₪0, committed spending
      ₪7,612.74, net −₪7,612.74; June actual income ₪13,497.66, spending
      ₪15,388.89, reconciliation mismatch ₪2,951.47 (visible as needs review).
- [x] Server 144/144 tests pass and client production build passes.

### P0 — finish the financial model

- [x] Build salary identity onboarding: after first sync, ask which positive bank
      transaction is salary; store normalized description + account signature.
- [x] Match salary by description/account, never by a fixed calendar date.
- [ ] Handle two matching incomes attributed to one month (salary vs bonus prompt).
- [x] Exclude loan disbursements such as `העמדת הלואה` and own
      investment/securities transfers such as `גלש"ן שווקים` from the coveted
      salary/net number.
- [x] Implement `MONTHLY_ACCOUNTING_SPEC.md`: previous-month finalization and
      current calendar month to date, only after salary classification is trustworthy.
- [ ] Keep month navigation limited to months that actually contain data.
- [ ] Audit month boundaries, DST and pending→completed card transitions.

### P1 — Loans sector (explicit user requirement)

- [ ] Build a dedicated Loans section/page, not just the small “loan payments”
      dashboard statistic.
- [ ] RAW truth: Leumi exposes recurring `פרעון הלוואה` transactions, but does
      **not** expose original principal, term, remaining principal or payment
      number through the current scraper.
- [ ] Detect recurring repayments by normalized description/account/amount range.
- [ ] Ask once for loan definition: original amount, monthly amount, payment day,
      number of payments/start date; match future scraped repayments automatically.
- [ ] Show payment N/M, estimated remaining amount, next payment and loan cash-flow.
- [ ] Treat loan disbursement as financing, not salary/income in the core number.
- [ ] Later option: extend the Leumi scraper by capturing the loans portal HTML and
      writing a dedicated extractor, similar to the Yahav patch workflow.

### P1 — preserve additional RAW facts

- [ ] Add a separate schema field for Max `installments` metadata (JSONB or typed
      fields) and expose it in transaction detail.
- [ ] Audit original amount/currency vs charged amount/currency for foreign charges.
- [ ] Keep bank-provided memo/category/status read-only and visually distinguish
      them from user-authored fields.
- [ ] Verify descriptions never render translation keys such as `bank.movement.*`;
      show the real description and memo fallback.

### P1 — Transactions UX

- [ ] Keep the bottom-sheet/detail card for full, uncut transaction information.
- [ ] Display real description, memo, source category, bank/card, account/card last
      digits, purchase date, statement date, pending/completed and installments.
- [ ] Fix untranslated filters/labels such as `source.bank` and `source.cards`.
- [ ] Add merchant monitoring rules from transaction detail:
      all from merchant / above amount / exact amount (Bit/PayBox example ₪500).
- [ ] Improve recurring-expense detection and category/source tracking without
      pretending guessed categories are bank facts.

### P2 — Dashboard full audit (all earlier user requests)

- [ ] Every dashboard widget must consume the same selected calendar month and refresh after
      sync via query invalidation/hooks; remove duplicate dashboard requests/cards.
- [ ] Hero balance: if one bank, show it clearly; if multiple banks/accounts, show
      each separately and a total bank balance. Credit companies never have balance.
- [ ] Keep the exact selected range visible (`from → to`) and explain “so far”.
- [ ] Decide whether connected-bank management belongs on Dashboard; avoid repeating
      the Bank Sync page just to fill space.
- [ ] Re-evaluate placement/need of one-time income/expense actions.
- [ ] Rename/explain “bank costs” clearly; loans/fees/cash must be understandable.
- [ ] Keep recent transactions, spending type/breakdown and useful insights only.
- [ ] Put full historical analytics and period navigation on Insights, not a crowded
      current-month Dashboard.
- [ ] Do not show empty older-period tabs when data does not exist.
- [ ] Ensure SpendWise logo is visible on mobile header/footer/FAB as appropriate.

### P2 — Bank Sync page redesign (all earlier user requests)

- [ ] Compact liquid-glass tabs in one row; animated selected glass pill; no giant
      header, no horizontal scrolling on normal mobile widths.
- [ ] Tabs should be meaningful: Overview / Accounts / Sync activity / Personal
      Agent / Help (exact naming can be refined).
- [ ] Overview: connected bank/card companies, last sync, result, number of accounts,
      new transactions and what was imported — compact, not giant low-info cards.
- [ ] Move per-account/card enable toggles from Overview to Accounts management.
- [ ] Fix mobile toggle layout: turning off must not push controls outside the card.
- [ ] Personal Agent deserves its own complete tab, not a small mixed card.
- [ ] Fix Agent tab lag and scroll-jump-to-bottom bug.
- [ ] Help/onboarding gets its own clear tab/content.
- [ ] Polish each tab body and add real bank/credit-company logos from local assets.
- [ ] Remove `billing_cycle_day` from primary UX after the monthly model is verified;
      keep it temporarily only for compatibility/rollback.

### P2 — General Agent distribution

- [ ] Apply the approved Default Host visual language to the personal Worker without
      losing pairing/onboarding functionality.
- [ ] Add trusted Windows code signing and rebuild both distribution bundles.
- [ ] Never commit or overwrite the existing ZIPs until a new verified release is
      intentionally packaged.

## Working rules

- Prefer evidence from RAW + Supabase + rendered UI over assumptions.
- Use dry-run/preview before any future financial data rewrite.
- Keep operational cleanup separate from permanent financial history.
- Run targeted tests while working; one full test/build pass before push is enough.
- Push coherent commits to both repositories and wait for Render/Vercel production
  status before calling a phase complete.
- When you stop or hit usage limits, update `ROADMAP.md` and this file with exact
  commits, production state, database actions and the next unchecked item.

## 2026-07-12 stabilization handoff update

Fresh provider and production-DB evidence was captured without rewriting or
deleting any financial row. Leumi job 167, Max job 168 and Visa Cal job 163 form
the consistent snapshot at `2026-07-12T13:43:15.817Z`.

The newly observed Leumi `פריסה לתשלומים` +₪12,805.22 movement is classified as
financing proceeds and excluded from earned income. Its exact settlement offset
is reconciliation-only. The separate pending `פרעון הלוואה` −₪1,046.45 remains
committed bank-direct spending. The dedicated Loans section is deliberately still
deferred because the RAW data does not expose principal, term, remaining balance,
or payment position.

July 1–12 production truth after the code changes is: bank completed ₪2,258.13 +
bank pending ₪1,500.45 + card posted ₪4,714.51 + card pending ₪700.00 = committed
₪9,173.09; earned income ₪0; net −₪9,173.09. Salary runway July 9–12 is committed
₪3,346.79, actual ₪1,146.34, pending subset ₪2,200.45, and non-salary income ₪0.
The separate current checking balance is ₪7,241.08.

Local verification before push: server 21 suites / 180 tests; client 8 files / 77
tests; client production build; ESLint 0 errors (276 pre-existing warnings); agent
19 tests; Windows Release worker build 0 warnings / 0 errors. No RAW scrape file,
credential, generated bundle, ZIP, or hard-coded user audit script is included in
the intended commits.

---
