# SpendWise — Roadmap & Decisions

Living plan for the financial-model rebuild. The **heart** is one honest answer:
*"this cycle, how much came in vs went out, and where is it heading?"* — layered
over the real picture (balances, real transactions).

Status: ✅ done · 🔜 next · ⏳ planned · 🧊 deferred

---

## 0. The model (agreed)

Layered, not one number:

1. **Real picture (always true):** account balances + total (hero), how much sits
   in the bank, how much was charged on cards this cycle. No interpretation.
2. **The coveted number (cycle):** money **in vs out of the bank** (+ manual),
   anchored on the **salary** so income is always captured. The card **bill** is
   counted once as a bank outflow; itemized card purchases are the **breakdown**,
   never re-added. Shown as running ("so far") with a projection.
3. **Projection:** for the running cycle, estimate the end from known salary/charge
   dates + history. Clearly labelled "שערוך / estimate".
4. **Insights = retro center:** full history, per-cycle, per-day, breakdowns.

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
- **cycle_day** for user 1 set to 8 → revisit to 9 after the TZ fix (real salary = 9th).

---

## 2. Roadmap (dependency-ordered)

### A. 🔜 Timezone normalization — Asia/Jerusalem everywhere (FOUNDATION)
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
  require an explicit production apply after the deploy is verified.

### B. 🔜 Raw scrape validation (see the truth first)
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
- Two same-description incomes in one cycle → ask ("bonus?").
- **Not income:** loan disbursements ("העמדת הלואה"), own-investment/securities
  transfers ("גלש\"ן שווקים"). Exclude from the coveted number.
- Unlocks: correct income, the previous-cycle row, and the projection.

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

### F. ⏳ Previous-cycle row + projection (dashboard)
- Dashboard shows **previous cycle (real/closed)** + **current cycle (so far + projection)**.
- Blocked on A (TZ) + C (income classification) + a longer backfill — otherwise old
  cycles show loan/investment as income and miss the real salary (1-month scrape).

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
- **billing_cycle_day placement:** currently Profile→Preferences; consider moving to
  BankSync. Low priority.

---

## 4. Edge cases & decisions
- **Salary by description, not date** — the anchor. Survives weekends/holidays, job
  changes (old employer signature stops matching), and net+30 (the txn belongs to the
  cycle it lands in — that's what the user manages by).
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
