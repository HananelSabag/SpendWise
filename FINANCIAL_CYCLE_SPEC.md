# FINANCIAL_CYCLE_SPEC.md — the normalized cycle engine (validated against real bank data)

> The single source of truth for how SpendWise turns scraped transactions into a user's financial
> cycle. Written to be provider-agnostic (works for every user, not just accounts we happen to hold).
> **Validated to the agora** against real bank debits on 2026-07-16 (see §7 fixture). AI agents:
> read this before touching any cycle/accounting/reconciliation code. Keep the fixture numbers as the
> regression oracle.

## 1. FOUNDATION — one field rules everything: `processedDate`
Every scraped transaction (israeli-bank-scrapers, all providers) carries:
`type` (normal|installments), `date` (purchase date), **`processedDate` (the day it debits the bank)**,
`originalAmount`/`originalCurrency`, `chargedAmount`/`chargedCurrency`, `description`, `memo`,
`category`, `identifier`, `status` (completed|pending), and for installments `installments{number,total}`.

**`processedDate` is the ONLY thing that decides when money moves.** We never "compute" a billing
line — the provider already tells us when each charge hits. We only group by it. This was proven:
grouping card txns by `processedDate` reproduces the bank's actual debit lines exactly (§7).
Spending-cycle attribution is separate: a monthly close-out whose underlying spend belongs before
salary closes the cycle that just ended (§4), without changing its real bank date.

⚠️ **Timezone**: raw dates are Asia/Jerusalem local midnight serialized to UTC (e.g.
`2026-07-09T21:00:00Z` = Israel **2026-07-10**). Always bucket by the **Asia/Jerusalem** calendar date,
or statements land a day off. (Israel statement day for Max/CAL/Isracard in this data = the **10th**.)

## 2a. SETTLEMENT MODE — how a card's charges reach the bank (detect, never assume)
Two modes exist in the wild. **Detect by evidence**: run both against the real bank lines and
keep whichever reconciles more of the card's txns (`detectSettlementMode`). No brand text, no
institution table — works for a provider we've never seen.
- **`aggregated`** (credit card, e.g. Max 2254, CAL 9962): every charge sharing a `processedDate`
  settles as **ONE** bank line — the monthly statement *and* same-day immediate charges alike.
  Proven: 3 immediate txns on 08/07 summing 147.99 ⇒ a single bank line of 147.99.
- **`passthrough`** (debit card / כרטיס דביט, e.g. Max 8345): **each charge is its own bank line**,
  1:1, no monthly bill and no statement day. Proven: 8345's 7 txns on 02/06 appear in Leumi as 7
  separate "כרטיס דביט" lines with exactly those amounts (incl. a +61.41 refund).
- **Debit dedup + description win**: a passthrough card's txns and the bank's "כרטיס דביט" lines are
  the *same money* — count once. Prefer the **card copy**: it carries the real merchant
  ("שופרסל דיל גילה", "ALIEXPRESS") while the bank line only says "כרטיס דביט". Suppress the bank copy.
- A card whose statement day is uncertain **and** that reconciles 1:1 is passthrough — don't guess a
  statement day for it (SPEC §5: ask the user to link only if the evidence is genuinely ambiguous).

## 2. CLASSIFY EACH CARD TXN (per credit-card account)
Detect the card's **statement day** = the mode of `processedDate` day-of-month across its txns
(Max=10, CAL=10, Isracard=10 in current data; per-card, may differ). Then each txn is exactly one of:

| class | rule | economic meaning |
|---|---|---|
| **statement** (מחזור חיוב) | `processedDate` on the card's statement day, current/past month | part of the monthly card bill; settles as one bank line |
| **immediate** (חיוב מיידי) | `processedDate` on any other day (usually foreign / originalCurrency≠ILS) | debits the bank directly on its own date, outside the monthly bill |
| **deferred/installment** (דחוי/תשלומים) | `processedDate` in a **future** month | belongs to that future statement; show as "upcoming", do not count now |

`status='pending'` or `chargedAmount=0` → a not-yet-final authorization (often a temporary FX
estimate). Exclude from settled totals; may show as pending. See migration 25 FX-estimate columns.

## 3. RECONCILE CARD ↔ BANK (kills the double-count)
A bank (checking / עו"ש) statement contains **settlement lines** for each card bill and each immediate
charge. Match them to the card's own txns, then **suppress the bank line** so we count the money once:

- **Match by amount + Asia/Jerusalem date**, NOT by the Hebrew brand text. Brand text is only a label
  and is ambiguous ("לאומי ויזה" = a **Max** card; "כרטיסי אשראי" = **CAL**). Amount+date is exact.
- On match, tag the bank row `settlement_card_source` / `settlement_card_account` (columns exist) and
  exclude it from cash-flow totals; the card's itemized txns (by `processedDate`) ARE the expense.
- Expense for a card statement = Σ `chargedAmount` of its statement-class txns on that `processedDate`.
  This equals the bank settlement line to the agora (proven §7) — so breakdown and total always agree.
- **Debit cards** (e.g. Max 8345 `כרטיס דביט`) have no monthly statement — every txn is its own
  immediate bank debit. Classify all as immediate.

## 3b. SETTLEMENT REVERSAL (פריסה לתשלומים) — a bill that never cost money
A bank credit that exactly reverses a card bill within a day or two: the user spread the bill
into installments, so the bank credits the whole thing back and the bill costs **nothing** this
cycle (the installments land in future windows on their own dates). Proven in real data: Max bill
**−12,805.22 on 10/07** ⇄ credit **"פריסה לתשלומים" +12,805.22 on 12/07** (2 days).
- Match on **exact amount + ≤3 days**, never on text. Guard hard against false positives:
  the credit pool must exclude credits already reconciled to a card (else a debit-card refund
  "cancels itself" — real bug found: ₪61.41, ₪18), and a loose window matches coincidences
  (a ₪1,500 Bit transfer 9 days after a ₪1,500 statement is NOT a reversal — real bug found).
- Miss this and the cycle is wrong by the full bill in *both* directions: count the bill and you
  overstate spending by 12.8k; count the credit as income and you overstate income by 12.8k.

## 3c. THE THREE LINES — income, financing, bank movement
`amount > 0` is **not** income (naively summing one account's credits gives ~₪94k of nonsense:
loans +16,000/+25,000, a +12,805.22 spread credit, Bit ~6,400, grants, refunds). But hiding
borrowed money is just as wrong. **Report three lines that are all true at once:**

```
income      (salary + Bit/Paybox + grants + interest…)   money that is yours
expenses    (card charges + direct bank debits)
──────────────────────────────────────────────────────
operatingNet = income − expenses     ← how you actually live. The number to feel.
financing    (loans drawn, spread credits)               borrowed — you owe it back
──────────────────────────────────────────────────────
timingAdjustment = post-salary close-outs attributed to the prior spending cycle
bankMovement = operatingNet + financing + timingAdjustment   ← real account delta by bank date
```
- **Money in is income** — Bit/Paybox/all digital wallets are ordinary transactions (in = income,
  out = expense). No special logic; the user remembers a given Bit was a refund.
- **Borrowed money is never income.** Counting it turns a −14,129 month into a comfortable +1,870
  lie; hiding it leaves a −14,129 the user cannot explain. Proven on real data: June income 10,330 /
  expenses 24,459 ⇒ operating **−14,129**, financing **+16,000** (a loan) ⇒ the account actually rose
  **+1,870**. Both facts matter, and only three lines can carry them.
- **Financing runs on three levels — suggest, don't decide** (§3e).
- **A spread bill is not netted away.** The bill genuinely came due and the credit is genuinely
  borrowed: count the expense AND the financing. Netting the pair would hide a ₪12,805 bill from the
  user entirely (real bug found — it also inflated bank movement to +20,822 vs the true +8,017).
- The DB already models this: `transactions.ledger_class` and
  `transaction_month_overrides.classification` ∈ salary|bonus|financing|transfer|card_settlement|other.
- **INVARIANT (strongest check we have):** `bankMovement` must equal the independent sum of every
  settled bank txn in the window. Verified for every complete window; if it ever diverges the engine
  is lying about money. Partial windows (§11) are exempt.

## 3e. CLASSIFYING A CREDIT — proven / suggested / asked
We cannot lean on provider linkage: Leumi does **not** share an identifier between a card bill
(`982254`) and its "פריסה לתשלומים" credit (`3111001`), and identifier semantics differ *per
instrument inside one bank* — "לאומי ויזה" ends with the card's digits (21/21), CAL uses one fixed
id (`8547`) for every settlement, debit lines use timestamp-like ids (2/40). So any bill↔credit link
we make is a heuristic built on **one** observed case (Max/Leumi). CAL may well differ.

Therefore three levels, and only the first is automatic:
| level | rule | UX |
|---|---|---|
| **proven** | loan-family disbursement — repayments exist under the same identifier (§3d) | never ask; it's arithmetic |
| **suggested** | a credit exactly reversing a recent bill (§3b) | **pre-filled question**: "₪12,805.22 came in — exactly your Max bill from 2 days ago. Spread into a loan?" → one tap. Defaults to the suggestion so the headline stays sane while it waits |
| **asked** | any other unusual credit | "income beyond your salary — what is it? [one-time income / loan / refund]" |

- **Answer once, remembered forever** (`credit_classifications`, keyed by our `transaction_id`). A
  provider identifier is retained as evidence but is not a safe persistence key: identifiers may be
  reused or change semantics across instruments. Don't ask about small recurring credits (Bit arrives
  weekly); only the unusual.
- **A spread stops asking by itself**: once its repayments arrive they join identifier `3111001`,
  which makes it a *proven* loan family (§3d). The question appears once and never returns.
- **INVARIANT: the user's answer can never break reconciliation.** Verified — answering "financing"
  gives income 13,327.75 / operating −4,788.05; answering "income" gives income 26,132.97 /
  operating +8,017.17; **`bankMovement` = 8,017.17 = reality in both**. Classification only moves
  money between the income and financing lines. A wrong tag misinterprets, it never lies about money.

## 3d. IDENTIFIER FAMILIES — loans derived, not typed in
The provider's `identifier` reuses **one value across a whole related series**, which makes it a far
stronger key than description text. Proven on real Leumi data:
| identifier | what it is |
|---|---|
| `2158001` | loan: **₪25,000** drawn 21/04 + 3 repayments ⇒ repaid 3,085.35, **outstanding ~21,914.65** |
| `3926001` | loan: **₪16,000** drawn 10/06 + 1 repayment ⇒ **outstanding ~14,913.56** |
| `2529001` | loan repayments ~₪1,100 on the 26th, **disbursement predates our history** ⇒ principal unknown |
| `3111001` | the "פריסה לתשלומים" credit (₪12,805.22); its repayments start next month |
| `78691` / `42209` / `8547` / `99012` | employer salary / insurance standing order / CAL settlements / Bit |

- **`deriveLoans`**: a family with a disbursement (in) **and** repayments (out) ⇒ principal, repaid,
  outstanding and payment-day are pure arithmetic. **No manual entry, no scraper change.** This
  overturns the earlier assumption that loans are unobtainable — the data was already there.
- **`deriveRecurringCharges`**: a family with only recurring debits ⇒ we can prove the series and
  predict its next hit, but not what it *is* or what remains. These are the fixed-charge-link
  candidates (§5 link 3): the user labels it and, for a loan, supplies the remaining payments.
  Must exclude txns already reconciled to a card — never ask about money the engine already explains.
- **The spread becomes a tracked loan for free**: when the installments arrive under `3111001` they
  join that family, so it converts into a normal derived loan with no user input.
- Caveat: identifier semantics are the provider's. Treat "≥2 txns share an identifier ⇒ a family" as
  evidence, and degrade gracefully where a provider makes every identifier unique (Max/CAL do).

## 4. THE FINANCIAL CYCLE (מחזור פיננסי) — the only view the user feels
- **Anchor = salary.** Window = `[salaryDate, nextSalaryDate)`. Calendar month is NOT used for the
  headline (it's retro-only, in Insights).
- Direct bank transactions and immediate/debit-card charges use their **bank-hit date**. An
  aggregated monthly statement follows the cycle containing most of its underlying spend, using
  the amount-weighted median purchase date. Installments use their current `processedDate`, because
  each installment is a current-period payment even when the original purchase is old. Therefore
  salary on the 9th + Max/CAL statements on the 10th whose purchases all end on the 8th puts those
  statements (and their purchase breakdown) in the previous cycle. A spread credit linked to that
  statement follows it to the same spending cycle.
  This attribution never rewrites `bankMovement`, which remains the literal sum by bank-hit date;
  `timingAdjustment` explains the difference and is not another charge.
- **Headline = income vs spending attributed to the salary cycle**: direct bank and immediate-card
  movements by bank date, monthly statements by their representative spending date. `bankMovement`
  separately states the literal cash movement between salary dates. One number the user lives by:
  "this cycle: in 13,328 / out 3,841 / net +9,487" without re-counting the bill that already closed.
- Weekend drift: salary/charges may shift ±1–2 days (Fri/Sat). Anchor detection uses tolerance; don't
  treat a 1-day shift as a missed/extra event.

## 5. THE THREE LINKS (one mechanism: pick a txn from the filtered list → link → learn the pattern)
Mirrors the existing salary-signature UX. Each link teaches the engine a recurring monthly event and
lets it **project** the next occurrence into the current/next cycle.
1. **Salary link** (`salary_signatures`, exists): identifies income identity + expected day → projects
   next salary; drives the anchor. `trackSalary` → status `scheduled|due|late|unknown` with a
   weekend-drift tolerance (a Friday/Saturday pay day lands a day or two off — normal, don't cry wolf).
   Late ⇒ "your salary hasn't come in yet".
   **Job change** (`detectSalaryChange`): salary late **and** a new credit of comparable size arrived
   near the same day-of-month ⇒ suggest "did you switch jobs?" — never re-anchor on our own. Must
   exclude financing or a spread credit masquerades as a new employer (real false positive: ₪12,805.22
   landed 3 days from pay day at 1.28× the salary). Verified on the real change in the data
   ("גלש\"ן שווקים" ends 09/06 → "הורייזן טכנו" starts 09/07): exactly one candidate, the real
   employer. With no replacement ⇒ `salary_late_no_replacement` ⇒ warn, never invent a job.
2. **Charge link** (new, per card): user confirms a card's statement charge → locks the card's
   statement day + typical amount → projects the next bill ("Max ~₪12,800 on the 10th, before your
   next salary").
3. **Fixed-charge link** (new): loans / standing orders (הוראות קבע) → recurring bank debit → projects
   next occurrence ("loan ₪1,046 on the 11th"). Loan disbursements & own securities/investment
   transfers must NOT count as income.

## 6. PROJECTION / TRACKING (the "picture before next salary")
`projectUpcoming` — for the running cycle: settled-so-far + what is still expected before the next
salary ⇒ estimated end-of-cycle (labelled שערוך, never mixed into settled numbers).
- Only projects series already **proven** to exist (loan families, recurring identifier series) plus
  the salary. Card charges **inside the current salary window** use the provider's real future dates
  (§2); no invented amount is mixed into the current-cycle result.
- A separate, explicitly estimated **post-salary cash point** answers what the account may hold after
  the next salary and the card statements immediately following it. For every aggregated card, the
  provider's purchases already assigned to that statement are a hard floor; until the statement is
  final, estimate it as `max(known amount, average of up to 3 recent complete statements)`. Debit /
  passthrough cards have no monthly statement and are excluded. Formula: today's real checking
  balance + still-upcoming movements before salary + expected salary − estimated next card bills.
  A statement that already left the bank is therefore never subtracted twice. The UI must keep
  **known accumulated spend** visually separate from the historical estimate and let the user turn
  the estimate off; in that mode the cash point subtracts `knownTotal` only. The preference is
  remembered locally and never changes settled/accounting data.
- **A series can hold more than one rhythm**: insurance `42209` bills on **both the 1st and the 10th**
  under one identifier. Project each recurring day-of-month separately — "last date + 1 month" jumps
  to 10/08 (outside the window) and silently loses the 01/08 hit.
- Verified on the running cycle (asOf 16/07, window 09/07→09/08): settled operating −4,788.05 +
  upcoming (loan 26/07 −1,098.85, insurance 01/08 −73.01) ⇒ **projected −5,959.91**.
- Each item carries `certainty`: `proven` (a real future card date, a loan family) vs `estimated`
  (a recurring series' typical amount).

## 7. REGRESSION FIXTURE — proven numbers (2026-07-16, user1 Hananel + user34 Yehuda)
The engine MUST reproduce these. Source: agent `scraped-data/raw-*.json`.
- Max 2254 statement (Σ statement-class by processedDate) → bank "לאומי ויזה" line:
  - 2026-07-10 = **12,805.22** == bank 12,805.22 ✅ | 2026-06-10 = 14,213.34 == 14,213.34 ✅
  - 2026-05-10 = 9,468.19 vs bank 10,641.27 (Δ1,173 = truncated backfill, oldest statement only)
- CAL 9962 statement → bank "כרטיסי אשראי" line:
  - 2026-07-10 = **2,665.20** == 2,665.20 ✅ | 2026-06-10 = 4,734.66 == 4,734.66 ✅
  - 2026-05-10 = 1,500 vs 1,800 (Δ300 = truncated backfill)
- Immediate charges match individually (Max 2254): 08/07 147.99, 07/07 294.13, 05/07 290.08,
  02/07 113.89, 23/06 11.90, 16/06 306.24 … each == its own bank "לאומי ויזה" line, same date/amount ✅
- `processedDate` present in Max, CAL, Isracard (Isracard 2844: 06-10=23,620.10, 07-10=22,016.67).
- Settlement-mode detection (§2a): Max 2254 → `aggregated`, CAL 9962 → `aggregated`,
  **Max 8345 → `passthrough`, 37/37 charges matched 1:1** against Leumi "כרטיס דביט" lines.
- Statement-day detection: Max 2254 → 10 (confidence 0.85), CAL 9962 → 10 (1.0),
  Max 8345 → none/uncertain (correctly refuses to guess a statement day for a debit card).
- **Rule**: recent statements reconcile to 0; only the earliest visible statement may be short
  (backfill boundary). A non-zero Δ on a recent statement = a real bug to chase.
- Salary-anchored cycles (user1, salary "הורייזן טכנו" 09/07 = 13,327.75; previously "גלש\"ן שווקים"):
  | window | income | expenses | operating net | financing | bank movement | real bank |
  |---|---|---|---|---|---|---|
  | 08/05 → 09/06 | 16,263.37 | 25,551.49 | −9,288.12 | 0 | −9,288.12 | (partial window) |
  | 09/06 → 09/07 | 10,329.91 | 24,458.98 | **−14,129.07** | +16,000.00 | +1,870.93 | **+1,870.93 ✓** |
  | 09/07 → 09/08 (running) | 13,327.75 | 18,115.80 | **−4,788.05** | +12,805.22 | +8,017.17 | **+8,017.17 ✓** |
- Loans derived with no manual entry: #2158001 ₪25,000 → outstanding **21,914.65**; #3926001 ₪16,000
  → outstanding **14,913.56**. Recurring series offered for labelling: #2529001 (old loan, day 26),
  #42209 (insurance) — and card settlements are correctly NOT offered.
- Regression guards in the script: `bankMovement == real bank movement` for every complete window;
  the spread bill must be detected; **zero** bogus reversals (>3 days apart or <₪100); a loan
  disbursement must never land in income; loan principal/outstanding must reproduce exactly.
- **Reproduce anytime**: `node server/scripts/verify-cycle-engine.js` (read-only; reads the agent's
  `scraped-data/raw-*.json`, prints per-card views + reconciliation + cycles, exits non-zero on any
  regression).

## 8. BUILD ORDER (build validated engine alongside, prove parity, THEN retire the old services)
1. `cycleEngine` pure module: raw txns → {classified txns, per-card statements, detected statement day,
   reconciled bank lines}. Unit test against §7 fixture.
2. Financial-cycle aggregation (salary-anchored window) → headline in/out + per-card breakdown.
3. Three links (salary exists; add charge-link, fixed-charge link) + projection.
4. UI: promote `insights/CardBillingCycles.jsx` + `FinancialCycleSummary.jsx` presentation to the
   dashboard financial-cycle component (per-card headers "מחזור חיוב 10 · ₪12,805 · 81 עסקאות" +
   immediate-charge section + provenance). Demote `dashboard/CalendarActivityCard.jsx` to Insights.
5. Consolidate/retire the overlapping services (`monthlyAccountingService`, `cardReconciliationService`,
   `financialClassificationService`, `calendarMonthSummaryService`, `bankPendingDedupService`,
   `cycleRunwayService`) into the one engine — remove duplicate passes. Prove parity vs fixture first.

## 9. EDGE CASES CHECKLIST
- Multiple cards, different statement days (10th / 28th / mixed) → each card its own cycle; the
  financial window collects all of them. If they cluster near one date, great; if not, still one window.
- Foreign pending with FX estimate → excluded from settled totals; shown as pending estimate.
- Installments → only the payment whose `processedDate` is in the window counts there; show "1 of 3".
- Deferred foreign (Yehuda 4297 → charged 08-10/09-10) → future window only.
- Backfill boundary → oldest statement may under-count; never alarm on it → see §11.

## 10. PRESENTATION & USER CONTROL (how the logic reaches the user)
Principle: the engine auto-detects everything it can; where confidence is low it **asks the user to
link**, and everywhere the user can **see the provenance and take control**. Never a black box.

### Dashboard (primary = the financial cycle, salary-to-salary)
- **Hero**: real bank balance(s) (unchanged) — the truth.
- **Financial-cycle card** (replaces the calendar card as primary): the ONE window. Headline
  **in vs out vs net** for `[salary → next salary)`, "so far" + **projection/שערוך** for the running
  cycle. Reuse the nice `insights/CardBillingCycles` presentation here: expandable per-card sections
  with headers "מחזור חיוב · 10 · ₪12,805 · 81 עסקאות", an **immediate-charge (חיוב מיידי)** section,
  and provenance — tap a header → see exactly which txns rolled into it (like the calendar view does).
- Demote the **calendar** view to Insights (retro/archive), not primary.

### Financial-cycle detail page = the control/tracking center
Three tracked streams, each built on the same "pick a txn from the filtered list → link" mechanism:
1. **Salary** — shows linked salary, expected next day, and a **live tracker**: "salary expected ~10th".
   If not arrived by expected+tolerance → banner "your salary hasn't come in yet — heads up".
2. **Cards** — one row per card: auto-detected statement day + typical amount + next-bill projection,
   editable; a **"link a charge" (קישור חיוב)** action if auto-detection is unsure. Breakdown =
   statement / immediate / deferred.
3. **Fixed charges (loans / הוראות קבע)** — user marks a recurring debit → it's projected into the
   cycle ("loan ₪1,046 on the 11th, before your next salary").

### User controls (the "control over what he needs")
- Link/relink **salary**; edit its expected day.
- Per card: **confirm/edit statement day**, link a charge txn, toggle include/exclude.
- **Mark a txn as a fixed charge** (loan/standing order) → recurring projection; and mark loan
  disbursements / own transfers as **not income**.
- **Override a txn's economic month** (`transaction_month_overrides` exists) for exceptions.
- **Set aside / exclude** partial or junk data (§11).
- **Merchant watch**: create a rule AND see a **label/badge on matching txns** in the list + a visible
  tracker (see §12 — currently half-built).

## 11. DATA QUALITY — only whole cycles, set aside the rest (Hananel's rule)
Partial data must never masquerade as a real number.
- A card statement is **complete** only if the full purchase window feeding it was captured. Practically:
  the **earliest** statement per card is suspect (its purchases predate our earliest scraped txn).
- Mark such statements/cycles **`partial`** → exclude from headline totals & projections; show them
  set-aside ("incomplete history") rather than as a real cycle. Recent complete cycles reconcile to 0
  (§7); a non-zero Δ on a *complete* cycle = a real bug to chase, not to hide.
- Provide a way to **purge** clearly-incomplete/junk rows from the DB (admin/user action), so we keep
  "only whole cycles without nonsense". Prefer a longer agent `BACKFILL_MONTHS` to fill history over
  time; until then, set aside.

## 12. FULL REQUIREMENTS LEDGER (every request from Hananel's briefs → status)
S = ✅ locked in logic (§1–7) · ◐ = to build · ○ = half-built, needs surfacing.
| # | Request | Handled by | Status |
|---|---|---|---|
| 1 | Scraped txns are reliable, one-by-one accurate | foundation; reconciled to agora §7 | ✅ |
| 2 | Calendar cycle on dashboard tells the user nothing → make **financial** cycle primary | §4, §10 dashboard | ◐ |
| 3 | Copy the calendar view's nice UI (per-card, which txns, provenance) to the financial-cycle card | §10 (reuse CardBillingCycles) | ◐ |
| 4 | Normalized logic that fits **everyone**, not just us | §1–3 provider-agnostic; processedDate proven in Max/CAL/Isracard | ✅ |
| 5 | Engine does too many calcs / duplicate passes → simplify to rules | one `cycleEngine`, §8 step 5 consolidation | ◐ |
| 6 | Understand each user's own cycle (cards on 10th, salary flows; varies) | §2 per-card statement-day detection + §4 salary anchor | ✅ |
| 7 | Max already gives per-date summaries + immediate-charge section — don't compute, use it | §1 processedDate grouping = the summary; §2 immediate class | ✅ |
| 8 | Different txn TYPES (deferred/installments) — rely on scraped data | §2 deferred/installment class; installments{number,total} | ✅ |
| 9 | Verify our result vs the real bank debit | §7 fixture (reconciles to agora) | ✅ |
| 10 | Credit cards cause the double-count; bank-only is easy | §3 reconcile+suppress settlement line | ✅ |
| 11 | Salary = link a txn → predict next salary + feed cycle + **track** arrival, warn if late | §5 link 1 + §10 tracker | ◐ (link exists, tracker/warn to build) |
| 12 | Per-card **billing cycle via charge-link** (like salary-link); cards on different days | §2 detection + §5 link 2 | ◐ |
| 13 | Add **loans / standing orders** as fixed charges, projected before next salary | §5 link 3 + §10 fixed charges | ◐ |
| 14 | The "gap"/one-window collection problem | §4 window + boundary rule | ✅ (logic); ◐ (surface) |
| 15 | Use the agent RAW debug data as the source of truth | validated §7 from raw-*.json | ✅ |
| 16 | Fallback: if we can't auto-determine a cycle, **ask the user to link** | §5 links as fallback; §10 "link a charge" | ◐ |
| 17 | Backfill/partial: only whole cycles, clean/set-aside the rest | §11 | ◐ |
| 18 | Present the logic to the user + give **control** over what they need | §10 | ◐ |
| 19 | Merchant-watch "condition" tracking is invisible — no label on txn, buried | §10 controls; server done, client `MerchantWatchControl`/`WatchedMerchants` exist but no list badge → surface | ○ |
| 20 | Many half-built features not finished → find & surface/finish | audit pass alongside build | ○ |
