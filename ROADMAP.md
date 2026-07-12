# SpendWise — Roadmap & Decisions

> **2026-07-11 model decision:** the fixed billing-cycle window is being replaced
> as the primary dashboard model by calendar-month accounting. Delayed salary is
> attributed to the previous work month; connected-card settlements reconcile the
> previous month's itemized purchases and are never counted twice. The exact
> approved specification is in `MONTHLY_ACCOUNTING_SPEC.md`.

Living plan for the financial-model rebuild. The **heart** is one honest answer:
*"for this calendar month, what actually entered, left and was committed?"* —
layered over real balances and ledger facts, with no salary forecast.

Status: ✅ done · 🔜 next · ⏳ planned · 🧊 deferred

---

## 0. The model (agreed)

Layered, not one number:

1. **Real picture (always true):** bank balances and every ledger transaction on
   its real local date. No attribution changes these facts.
2. **Accounting month:** activity is grouped by calendar purchase/bank date.
   Salary paid next month is attributed back to the work month. Connected-card
   settlements are reconciliation events, never a second expense.
3. **Current month:** actual spending and non-salary income from the 1st through
   today. Salary is never estimated; next month's real salary closes this month.
4. **Previous month:** actual salary + itemized/direct spending + card settlement
   reconciliation, with closed/provisional/review status.
5. **Insights:** calendar-month history, transaction detail and reconciliation.

---

## 1. Done ✅

- **Phase 0 — cash-flow totals (commit 683781c):** period income/expenses now count
  what moved through the bank (`source_kind <> 'credit_card'`), killing the
  double-count of the card bill vs itemized charges. Verified on real data:
  income 13,328 / expenses 14,064 / net −736 (was −28k, no income).
- **PeriodCountingPopover** rewritten to the cash-flow explanation.
- **"so far" badge** on the current cycle (commit 0830392) — the running total is
  not the final month.
- **UX wave:** LiquidTabs (Profile/BankSync fit one row, Admin scrolls), Help center
  split from onboarding, onboarding mobile-cutoff fix, transaction detail sheet,
  FAB → Insights, localization, valid-period bound.
- **Worker distribution cleanup (2026-07-12):** one self-contained personal
  Windows edition with pairing, bundled Node/Chrome and a clean release ZIP;
  Hananel's managed Default Worker keeps its private operator profile outside Git.
- Historical note: cycle day was temporarily used as a workaround. The new model
  is calendar-month only and the obsolete column is removed after deployment.

---

## 2. Roadmap (dependency-ordered)

### A. ✅ Timezone normalization — Asia/Jerusalem everywhere (FOUNDATION)
Everything date-based sits on this.
- **Confirmed bug:** salary hit at 2026-07-09 00:00 Israel (= 07-08 21:00 UTC); the
  `date` column was truncated in **UTC** → stored 07-**08**. `bank_processed_date`
  was correct (09). This is why "Supabase put it on the 8th".
- **Fix:** derive `date` from `transaction_datetime` **in Asia/Jerusalem** at ingest;
  one-time backfill of existing rows (needs explicit go — it moves transaction dates);
  audit all business logic (period boundaries already use `PERIOD_TZ`, verify the rest).
- Render/Supabase/Vercel all differ — normalize to Israel before any logic.
- **2026-07-11 progress:** live RAW + Supabase comparison proved the exact legacy
  shift (salary `2026-07-08T21:00Z` = July 9 Israel, stored `date` = July 8).
  Ingest and dedup now derive Israel dates and refresh corrected bank facts on
  re-sync. The one-time historical row repair + user 1 cycle day 8 → 9 still
  were applied after deploy verification: 136 legacy bank rows repaired across
  users 1 and 34, and user 1 cycle day restored from workaround 8 to salary day 9.

### B. ✅ Raw scrape validation (see the truth first)
- Tool built: `spendwise-agent/tools/raw-scrape-report.js` → RAW HTML report, no
  mapping/POST. Hananel runs Leumi + Max + Cal locally; we inspect together:
  which fields exist, `date` vs `processedDate`, whether loans/installments/memo
  appear, description reliability, per provider.
- Reminder: **scrape time ≠ transaction time** (first sync ≈ 30–32 days back).
- **2026-07-11 captured:** Leumi 23 txns, Max 101 across two cards, Visa Cal 9.
  Leumi exposes real salary/transfer detail in `memo` and loan repayments only
  (no principal/term/remaining balance). Max exposes provider categories and
  some installment metadata. Agent mapping now preserves `memo` as bank notes.
  Pending bank amounts can change between scrapes; dedup now refreshes amount,
  description, local date, statement date and status instead of freezing the
  first version forever.

### C. ✅ Salary identity + income classification integration
- First sync (~32d) → ask once: *"Which of these income transactions is your salary?"*
  Store a **signature** (normalized description + account). Match future salaries by
  **description**, not date (robust to weekends/holidays, job changes, net+30).
- Two same-description incomes attributed to one accounting month → ask ("bonus?").
- **Not income:** loan disbursements ("העמדת הלואה") and confirmed
  own-investment/securities transfers. Never hardcode an employer name as an
  investment pattern; גלש"ן was Hananel's previous employer and is salary.
- Unlocks: actual previous-month income; current month remains factual until the
  next salary arrives.
- **2026-07-11 foundation complete:** pure classification now separates salary,
  other income, financing, securities, confirmed internal transfers, bank-direct,
  debit-primary, card itemized/enrichment and settlement evidence. Production
  preview reproduces the forensic June totals exactly.
- **2026-07-11 INTEGRATED into `monthlyAccountingService`:** `buildMonth` now
  drives calendar income/spend/net and the spending breakdown from the classifier
  + reconciliation engine (not the old regex). Salary attributed by signature
  offset. Debit-card identity derived from all history. Verified on production:
  June income 13,497.66 / committed 15,476.89 / net −1,979.23; July committed
  8,066.74. 171/171 server tests pass.
- **2026-07-12 duplicate-income review complete:** when the same confirmed
  employer produces multiple deposits for one economic month, the dashboard asks
  the user to classify every deposit as salary, bonus/addition or other income.
  Decisions are stored as auditable records in `transaction_month_overrides`; a bonus remains
  real income in the selected work month but no longer creates a false salary
  anchor for Runway. Explicitly confirming both as salaries also resolves the
  prompt without silently guessing.

### D. 🧊 Loans sector + scraper upgrade (separate, large)
- israeli-bank-scrapers returns only txns for Leumi/Max/Cal — **no loan metadata**
  (principal/term/remaining). Structured LoanDetails exists only for OneZero. So:
  derive obligations from recurring "פרעון הלוואה" payments + a **one-time manual
  loan definition** (amount/monthly/day/#payments) auto-matched to scraped payments
  → "payment 4/36, remaining X". Optionally extend the scraper per bank (Leumi has a
  loans section) Yahav-style (capture HTML → extractor → our patch). A loan is like a
  one-time income (disbursement) then a recurring expense (repayment).

### E. ✅ Merchant monitoring rules (FAB / Insights)
- Description ≈ merchant name; auto-categorization is unreliable (random business
  names). Let the user click a transaction (detail sheet) → create a rule:
  *all from this merchant · above amount · exact amount*. Feeds a "watched" view.
  (User example: ₪500 Bit/PayBox.)
- **2026-07-12 DONE:** transaction details now create an explicit watch from the
  real ledger description, with all/above/exact matching and an editable amount.
  Insights shows active rules and their latest matching transactions; rules can
  be removed there. Migration 24 stores user-owned, auditable rules linked to the
  source transaction. Monitoring never edits categories, transactions or any
  financial total.

### F. ✅ Previous/current calendar-month accounting (dashboard integration)
- `MONTHLY_ACCOUNTING_SPEC.md` baseline uses factual purchase dates.
- Dashboard shows **current month to date first** and a **previous month summary
  underneath**, including daily averages and reconciliation state.
- No salary estimate. Salary selection stores a description/account signature and
  attributes future matches to the prior work month.
- Connected card settlements reconcile only; unconnected cards use a clearly
  labelled bank-settlement fallback.
- **2026-07-11 DONE:** `monthlyAccountingService.buildMonth` rewired to the
  classification + reconciliation engine. The artificial month-M/month-M+1
  difference and the broad settlement regex are gone; the ₪2,951.47 false
  `needs_review` no longer exists. The dashboard PeriodSummary hero, the
  MonthlyAccountingSummary cards, and the SpendingBreakdown all consume the same
  engine (breakdown reconciles to the headline; no settlement/debit double-count).
  Reconciliation is kept separate and only surfaces a discrepancy when a captured
  statement is final. Client needed no change (reads the same API fields). See
  `CLAUDE_MONTHLY_INTEGRATION_HANDOFF.md`.
- **2026-07-12 secondary widgets migrated:** dashboard `bankCosts`, per-source
  activity and `recurringPatterns` now use the same classifier and unique-economic-
  fact rules as the headline. Settlements/debit enrichment are not counted twice;
  salary attribution matches the selected accounting month; generic settlements,
  loans, cash and fees no longer masquerade as recurring merchants.

### G. ✅ Runway / daily-balance cycle (the "coveted number")
The number Hananel wanted since day one: salary-to-salary, "since my last paycheck
how much left the checking, and how am I doing." A separate lens from the calendar
month; anchored on the SALARY date (the refill), not the 1st.
- **2026-07-12 DONE (backend + card):** `cycleRunwayService.buildCycle` — cycle
  window anchored on the most recent salary deposit; sums money out (each expense
  once, via the engine) and money in EXCLUDING salary; pairs with the REAL checking
  balance (current cycle only). `GET /transactions/cycle` + `RunwayCard` on the
  dashboard. Verified: current cycle [09/07→today] balance −1,715, committed-out
  2,240.44; previous cycle [09/06→09/07] real (anchored on the two salaries).
- **2026-07-12 גלש"ן two-employer fix:** removed the hardcoded employer name from
  the securities pattern; a user-confirmed salary signature now beats any text
  guess. גלש"ן (previous employer) marked as salary (signature id 2) → recognised
  as income, attributed to its work month; June income unchanged (13,497.66) and it
  gave the 09/06 anchor for the previous runway cycle.
- **2026-07-12 DONE (history + planning):** every salary cycle now exposes a
  classifier-backed daily ledger (actual/committed out, non-salary income,
  salary, pending, cumulative net and review count), including empty days.
  Insights renders current/previous cycles as a daily chart and ledger. An
  explicitly opt-in planning layer stores an expected salary and one manual
  expected charge in user preferences, shows a separately labelled projected
  checking balance, and never changes factual transactions or accounting totals.
- Edge case handled: an unconnected card company's bank charge counts as real spend
  (not just reconciliation) — the classifier takes `connectedCardSources`.

---

## 3. Deferred UI polish (from live review) 🧊
- **✅ Financial UI i18n completed (2026-07-12):** Runway, previous-month
  accounting, salary selection/review, daily-flow history, optional projection,
  the Insights page and merchant watches now read all user-facing copy from the
  shared Hebrew/English dashboard dictionary. Language switches no longer leave
  newly added cards stuck in Hebrew; locale-only date formatting and RTL arrows
  remain intentionally language-aware in component code.
- **✅ BankSync overview compacted (2026-07-12):** the oversized repeated cards
  are now one compact operational summary plus one row per connection, with last
  sync/new/processed/status information and a direct path to management.
- **✅ Sync ENABLE toggles moved (2026-07-12):** per-account/card controls now live
  inside each connection on the **accounts** tab, not in the read-only overview.
- **✅ Agent tab jump fixed (2026-07-12):** tab changes deliberately restore the
  page to the top after the shorter panel renders, preventing browser scroll
  clamping from leaving the Agent content at its bottom edge.
- **Real bank/credit-company logos** instead of the default icon, everywhere
  (connect, transactions, details, settings). Store in a project folder. Trademark
  caveat → its own task.
- **Per-tab content polish:** Profile tabs (personal/preferences/security) + BankSync
  tab bodies → bank-sync card design.
- `billing_cycle_day` has been removed from application code, UX and production
  Supabase. Migration 22 ran only after Render was live on `7918d58`.

---

## 4. Edge cases & decisions
- **Salary by description/account, not date** — the anchor. Survives
  weekends/holidays and job changes. Default attribution is the previous calendar
  work month, configurable when an employer pays differently.
- **Job change (real):** "גלש\"ן שווקים" = previous employer, "הורייזן טכנו" = current.
- **Loan as income:** technically money in, but excluded from the coveted number;
  belongs in the Loans sector.
- **Scrape time ≠ transaction time.** Use transaction date, never `created_at`.
- **Timezone:** `transaction_datetime` (UTC) is the source of truth; derive local
  `date` in Asia/Jerusalem.

---

## 5. Key findings on user 1 (evidence)
- cycle_day 9 (was) split salary (9th) out → income 0. Salary = "הורייזן טכנו" ~13,328.
- Card bill "לאומי ויזה" 12,523 didn't map to a card company (pattern needs "כאל", not
  "ויזה") + 2 card companies → settlement double-counted with itemized → 28k.
- Card charge date IS in the scrape (`bank_processed_date` = provider statement date):
  Max 2254 → 73 txns on the 10th (clean); Cal noisier (per-txn + pending/null). Auto-
  detect charge day = mode of processed_date, editable.
- Accounts: Leumi (bank, balance −1,715), Max ×2 + Visa Cal (cards). 3 loans (~11th ×2,
  ~26th ×1, ~1,048–1,107).
