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

### C. ⏳ Salary identity + income classification
- First sync (~32d) → ask once: *"Which of these income transactions is your salary?"*
  Store a **signature** (normalized description + account). Match future salaries by
  **description**, not date (robust to weekends/holidays, job changes, net+30).
- Two same-description incomes attributed to one accounting month → ask ("bonus?").
- **Not income:** loan disbursements ("העמדת הלואה"), own-investment/securities
  transfers ("גלש\"ן שווקים"). Exclude from the coveted number.
- Unlocks: actual previous-month income; current month remains factual until the
  next salary arrives.

### D. 🧊 Loans sector + scraper upgrade (separate, large)
- israeli-bank-scrapers returns only txns for Leumi/Max/Cal — **no loan metadata**
  (principal/term/remaining). Structured LoanDetails exists only for OneZero. So:
  derive obligations from recurring "פרעון הלוואה" payments + a **one-time manual
  loan definition** (amount/monthly/day/#payments) auto-matched to scraped payments
  → "payment 4/36, remaining X". Optionally extend the scraper per bank (Leumi has a
  loans section) Yahav-style (capture HTML → extractor → our patch). A loan is like a
  one-time income (disbursement) then a recurring expense (repayment).

### E. 🧊 Merchant monitoring rules (FAB)
- Description ≈ merchant name; auto-categorization is unreliable (random business
  names). Let the user click a transaction (detail sheet) → create a rule:
  *all from this merchant · above amount · exact amount*. Feeds a "watched" view.
  (User example: ₪500 Bit/PayBox.)

### F. ✅ Previous/current calendar-month accounting (dashboard)
- `MONTHLY_ACCOUNTING_SPEC.md` implemented with factual purchase dates.
- Dashboard shows **current month to date first** and a **previous month summary
  underneath**, including daily averages and reconciliation state.
- No salary estimate. Salary selection stores a description/account signature and
  attributes future matches to the prior work month.
- Connected card settlements reconcile only; unconnected cards use a clearly
  labelled bank-settlement fallback.

---

## 3. Deferred UI polish (from live review) 🧊
- **BankSync overview:** the big per-connection cards are low-info / eat the screen —
  rework; the more useful stats live below.
- **Move the sync ENABLE toggles** (per account/card) from the overview tab → the
  **accounts** tab (that's the management surface).
- **Agent tab render bug:** selecting the "agent" tab animates laggy AND the page
  jumps to the bottom (only that tab) — investigate SyncMethodPanel focus/scroll.
- **Real bank/credit-company logos** instead of the default icon, everywhere
  (connect, transactions, details, settings). Store in a project folder. Trademark
  caveat → its own task.
- **Per-tab content polish:** Profile tabs (personal/preferences/security) + BankSync
  tab bodies → bank-sync card design.
- `billing_cycle_day` has been removed from application code and UX; the final DB
  drop migration runs only after the new server deployment is healthy.

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
