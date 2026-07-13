# SpendWise — Roadmap & Decisions

> **2026-07-13 final simplification decision (supersedes the older models below):**
> Dashboard shows calendar-month activity on each movement's real local date.
> Connected-card itemization is included, and a bank card debit is reduced only by
> the same-month itemized amount already represented inside that debit. Unmatched
> bank debit remains visible. The former Insights page is now Financial Cycle, anchored one day
> after the latest observed card billing date. Loans remain deferred for a separate
> product and data-model study.

## 2026-07-13 Dashboard / Financial Cycle simplification

- Dashboard answers “what happened in this calendar month?” with every real bank
  inflow/outflow and itemized card fact from the 1st through month end. Previous/next
  arrows navigate calendar months, and next stops at the current month.
- For a connected-card bank debit, subtract only the same-month provider activity
  already represented in that debit. Keep the unmatched debit. A matching refund
  or installment-financing inflow remains visible, so the raw debit and credit
  offset naturally instead of both disappearing from the headline.
- Dashboard Runway remains a compact snapshot. Full analysis lives only in
  Financial Cycle (`/financial-cycle`; `/insights` redirects for compatibility).
- Financial Cycle answers “how am I doing since the last card bill?” The boundary
  is derived from each provider/account's dominant processed date, preserving real
  weekend/holiday shifts, and the cycle starts the following day.
- The cycle counts all raw income and expenses in the window. The only business
  exclusion is a summarized bank card settlement when connected itemized card
  purchases already represent it.
- Expected end balance is checking balance + explicit expected income − upcoming
  card charges − pending bank expenses − an optional planned charge.
- Explanations are collapsed by default and open/close on demand.

> **2026-07-11 model decision:** the fixed billing-cycle window is being replaced
> as the primary dashboard model by calendar-month accounting. Delayed salary is
> attributed to the previous work month; connected-card settlements reconcile the
> previous month's itemized purchases and are never counted twice. The exact
> approved specification is in `MONTHLY_ACCOUNTING_SPEC.md`.

Living plan for the financial-model rebuild. The **heart** is one honest answer:
*"for this calendar month, what actually entered, left and was committed?"* —
layered over real balances and ledger facts, with no salary forecast.

Status: ✅ done · 🔜 next · ⏳ planned · 🧊 deferred

### 2026-07-13 16:05 Asia/Jerusalem — clean import and calendar v4

- User 1 financial rows were reset without touching the user, password hash or the
  three encrypted bank connections. Fresh jobs imported Leumi **113/113**, Max
  **374/374** and Visa Cal **53/53**, with zero skipped rows and zero zero-amount rows.
- The clean ledger contains **540** transactions. Nine Max pending purchases total
  **₪1,857.76** and are included in the current-month totals.
- Leumi contains a completed **−₪12,805.22** `לאומי ויזה` movement on July 10 and
  a completed **+₪12,805.22** `פריסה לתשלומים` movement on July 12. Calendar v3
  incorrectly hid both and fully removed the connected settlement even though only
  **₪2,558.61** was represented by same-month Max itemization.
- Calendar v4 keeps both real bank movements, subtracts only the **₪2,558.61**
  overlap, and counts the remaining **₪10,246.61** bank debit. July then reports
  inflows **₪26,150.97**, expenses **₪22,807.34**, net **+₪3,343.63**, with total
  card-debit overlap adjustments of **₪4,666.51**.
- `פריסה לתשלומים` remains classified as financing rather than earned income for
  Financial Cycle analysis. Its appearance in Calendar Month is raw cash activity,
  not a claim that it is salary or profit. The full Loans product remains deferred.
- Calendar rows are now compact drill-down controls. A dedicated lazy
  `/calendar-month-details` endpoint returns only the selected card/bank/adjustment
  group; desktop opens a centered modal and mobile opens a full-height bottom sheet.
  Each row exposes the exact transactions, factual dates, pending state, raw amount,
  counted amount and any duplicate-card adjustment without downloading the full ledger.

### 2026-07-13 21:08 Asia/Jerusalem — second-user Yahav fixture

- With Yehuda Sabag's consent, user 34 was reset only at the synchronized-data
  layer. The user/auth record, three encrypted Yahav/Max/Isracard connections and
  all nine account enable choices were preserved; disabled Yahav account
  `120-511509` remained disabled.
- Clean worker jobs completed for Yahav, Max and Isracard. The initial ledger had
  **306** rows: Yahav **68**, Max **45**, Isracard **193**. Max's two initially
  non-inserted RAW rows were a factual completed zero-charge cancellation and a USD
  pending authorization without a provider-supplied ILS charge.
- Yahav describes settlements by provider (`מקס איט פיננסים`, `ישראכרט בע"מ`,
  `כרטיסי אשראי לי`, `פרימיום אקספרס`) and does not expose card last-four in the
  bank row. Reconciliation now supports account scope when identity is explicit,
  provider scope across all enabled connected cards when it is not, and full bank
  expense when that provider is unconnected.
- July provider-level overlap is **₪3,741.59**; raw expenses **₪40,779.06** become
  **₪37,037.47**, with income **₪33,524.01** and net **−₪3,513.46**. The previous
  Financial Cycle is now income **₪35,329.01**, expenses **₪35,759.58**, net
  **−₪430.57**, with no unresolved settlement rows. The current cycle remains
  income **₪0**, expenses **₪499.69**, and known upcoming card charges **₪1,624.70**.
- Provider-level reconciliation is scoped to the selected Financial Cycle and
  preserves distinct pending settlement rows. Loans remain deferred.

### 2026-07-13 21:50 Asia/Jerusalem — pending FX and automatic salary forecast

- A pending foreign-card authorization whose provider amount is still zero is no
  longer dropped. It receives a clearly marked temporary ILS estimate from the
  Bank of Israel representative rate (with a recent provider-history median as an
  offline fallback). The estimate, source and timestamp are stored explicitly.
- When the issuer later posts the completed transaction, pending-to-completed rekey
  matching also uses original amount/currency, replaces the estimate with the final
  provider ILS amount and clears all estimate metadata. A completed zero-charge
  cancellation remains excluded.
- Yahav's explicit `משכורת` label is now a high-confidence salary fact even before
  the user creates a salary signature. Overrides remain authoritative. This fixed
  the clean-onboarding gap where all six real salary deposits were ordinary income.
- Yehuda's previous cycle (June 11–July 10) contains salary **₪33,075.01**, other
  income **₪2,254.00**, total income **₪35,329.01**, expenses **₪35,759.58** and net
  **−₪430.57**.
- The current-cycle forecast detects the two salary streams independently from
  three months of history: **₪14,263.04** expected August 1 and **₪15,333.21**
  expected August 5. Total automatic expected income is **₪29,596.25**; a manual
  planning value, when provided, still overrides it.

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

### 2026-07-12 hardening completion

- `npm audit` is clean across client, server and agent (zero vulnerabilities at
  every severity). The two GitHub push warnings are not reproduced by any current
  lockfile tree, so no blind dependency upgrade was applied.
- Salary-versus-bonus ambiguity is already end-to-end: dashboard prompt, auditable
  override API and tests. It remains real income without creating a false Runway
  salary anchor.
- Insights navigation now receives the actual transaction-bearing month offsets,
  skips gaps, and always keeps the current month available for a new user.
- Calendar tests cover Israel-local UTC boundaries, year rollover, leap February,
  factual purchase dates and pending→completed reconciliation/dedup behavior.
- Production FX audit found 15 captured Max USD charges. Transaction details now
  show original amount, charged amount and the provider-observed effective
  conversion; no market rate is invented.
- Recurring signals now average spend per active month (not per transaction),
  preserve multiple card sources and label amount stability. They remain clearly
  described as signals rather than guaranteed bills.
- Accounts-tab polling no longer remounts cards or replays entry animations.

Still intentionally separate from core stabilization:

- Loans research/product work (principal, term, payment N/M and Leumi portal).
- Official institution logo assets pending a deliberate trademark/source review;
  current branded colors and bank/card glyphs remain the safe fallback.
- Trusted Windows code-signing certificate and signed release ZIPs. The active
  Default Worker is current, but existing distribution ZIPs remain untouched.

### 2026-07-12 pre-Loans closure audit

- Bank Sync Overview is now an actionable control center: overall health, next
  automatic sync, last completed sync, connected sources, included-account scope,
  latest imports, source-level status and a direct route to account management.
- Account/card toggles now drive every financial engine consistently: Dashboard,
  Runway, calendar-month accounting, salary discovery/review and available-month
  navigation. Turning a source off stops future imports and excludes its saved
  rows from totals while retaining the historical ledger for audit/re-enable.
- Runway loads one immutable ledger snapshot and derives both current and previous
  salary cycles from it. Monthly accounting likewise reuses one snapshot for the
  current/previous summaries, and Dashboard no longer requests the same monthly
  overview through a duplicate endpoint.
- Protected deep-links now preserve their original path through login. Refreshing
  or opening `/bank-sync` and `/insights` no longer lands an admin on `/admin`.
- The current balance hero already lists multiple enabled bank accounts separately,
  totals only real bank balances, and never treats credit-company activity as cash.
- Mobile Bank Sync tabs fit on a 390px viewport without horizontal scrolling or
  truncated labels; the personal-computer section is named `Agent` / `סוכן`.

The pre-Loans product/accounting scope is now closed. Two distribution/brand items
remain externally gated rather than application defects: approved trademark logo
assets, and a publicly trusted Windows code-signing identity for release ZIPs.

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

### 2026-07-12 16:43 Asia/Jerusalem — fresh production stabilization snapshot

- Completed user-scoped syncs: Leumi job 167 (25 scraped, 3 new), Max job 168
  (105 scraped, 0 new), Visa Cal job 163 (9 scraped, 0 new). The consistent
  read-only Supabase snapshot was captured at `2026-07-12T13:43:15.817Z`.
- Current Leumi checking balance is **₪7,241.08**. This is a live balance fact and
  is never added to or subtracted from calendar-month performance.
- New financing evidence: Leumi row 5902 is a pending **+₪12,805.22**
  `פריסה לתשלומים`, exactly offsetting the completed **−₪12,805.22** `לאומי ויזה`
  settlement in row 5906. It is financing proceeds, not earned income and not
  spending. The later installment purchases will count on their factual dates.
- New row 5903 is a separate pending **−₪1,046.45** `פרעון הלוואה`. It remains
  ordinary bank-direct committed spending. Building the full Loans product from
  recurring repayments is still deferred.
- Derived July 1–12 totals after classification: earned income **₪0**; completed
  bank-direct **₪2,258.13**; pending bank-direct **₪1,500.45**; posted card
  purchases **₪4,714.51**; pending card purchases **₪700.00**; committed spending
  **₪9,173.09**; net **−₪9,173.09**. The full category distribution equals the
  headline exactly.
- Current salary runway (July 9–12): committed out **₪3,346.79**, actual out
  **₪1,146.34**, pending subset **₪2,200.45**, non-salary income **₪0**, while the
  checking balance stays the separate **₪7,241.08** fact.
- Derived totals now ignore a stale pending bank row only when an exact completed
  same-source/account/type/amount/description/date fact exists. Both immutable
  ledger rows remain visible. This removes the stale duplicate ₪1,086.44 loan
  repayment from calculations without deleting history.
- Card reconciliation remains separate from spending. A completed settlement is
  `partial`, not a mismatch, while provider rows near its statement date remain
  pending. The former Visa Cal ₪289.50 false mismatch is gone.
- UX now spells out every additive committed-spending component, reconciles the
  popover to cents, uses factual calendar dates, exposes bank status/processed/
  installment/FX metadata in transaction details, and labels raw ledger statistics
  as inflows/outflows. Bank Sync has Overview / Accounts / Private agent / Help.
