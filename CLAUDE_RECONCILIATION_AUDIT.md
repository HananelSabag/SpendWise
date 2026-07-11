# SpendWise — Independent Forensic Reconciliation Audit

**Auditor:** Claude (independent, read-only). **Subject:** user 1 (`Hananel`,
hananel12345@gmail.com). **Data date:** 2026-07-11 captures. **DB:** Supabase
`obsycususrdabscpuhmt` (production, read-only). **Nothing was modified,
migrated, deployed, committed, or deleted.**

Every number below is proven from primary sources: provider spreadsheet exports,
the Leumi PDF bank statement, the RAW scraper JSON, and live production rows. The
current implementation was **not** trusted; each of its results was independently
reproduced or disproven.

Sources used:
- Leumi PDF `ייצוא דפי חשבון.pdf` (account 797-04348378, 11.04–11.07.2026).
- Max 2254 export `transaction-details_export_1783789447409.xlsx`.
- Max 8345 (DEBIT) export `transaction-details_export_1783789470673.xlsx`.
- Cal 9962 export `פירוט חיובים לכרטיס ויזה 9962 - 11.07.26 (1).xlsx`.
- RAW `raw-leumi.json` (23 txns), `raw-max.json` (98+3 txns), `raw-visa_cal.json` (9 txns).
- Production `transactions`, `bank_accounts`, `salary_signatures`.

---

## 1. Executive conclusion

The calendar-month rebuild is **directionally correct** (salary signature works,
loan/investment financing is excluded from income, purchase-date card accounting
is right, the headline no longer double-counts the monthly card bill). But the
audit disproves the framing that the model is *reconciled*. Five concrete defects
remain, all proven:

1. **The ₪2,951.47 June "mismatch" is 100% artificial.** It is
   `July settlement-pattern bank total (14,906.89) − June itemized card (11,955.42)`.
   The 14,906.89 lumps the Max **monthly** settlement (which settles a *statement
   cycle*, not June), the Max **immediate** charges (already counted as itemized),
   the **debit** card movements (already counted as itemized), a **phantom
   duplicate** (₪387.29), and a **pending** ₪454 — then compares that to a single
   calendar month. It is not a reconciliation signal; it is five category errors
   added together. It should not drive `needs_review`.

2. **Debit-card handling is inverted and drops real spending.** `כרטיס דביט`
   (Max debit card 8345) posts directly to the bank and is the *primary* ledger
   fact, but the code classifies it as a card *settlement* and excludes it, then
   counts the Max-8345 itemized copy as "card spend." When Max detail is missing
   (e.g. the 2026-06-05 ₪88 debit, id 1961), the expense is counted **nowhere** →
   June is undercounted by **₪88.00**.

3. **One confirmed hard duplicate in production:** row **id 2470** (`כרטיס דביט`
   ₪387.29, 2026-07-06, `bank_sync_id …:45061616`, status/processedDate NULL) is a
   stale phantom of the real settled row **id 2885** (2026-07-08, `…:61616`). The
   Leumi PDF shows this debit **once**. Cause: Leumi changes the transaction
   `identifier` *and* date between pending and settled, defeating dedup.

4. **RAW under-reports the Max statement by ₪1,058.34**, proven against the
   provider export: RAW/DB statement group = ₪11,746.88, provider statement =
   **₪12,805.22**. The gap = June 10–11 purchases (₪539.36, present in DB but with
   `processedDate = NULL`) + municipality installment **5/10** (₪518.98, absent —
   RAW returned the *future* installment 6/10 instead).

5. **The ingest silently drops RAW fields required by the model:** `installments
   {number,total}`, `originalAmount`/`originalCurrency` (foreign FX), and the
   transaction `type` (`installments` vs `normal`). Installment position and
   foreign-currency audit are therefore impossible without re-scraping.

The card **totals** happen to be *almost* right today only because the settlement
regex coincidentally catches the bank's duplicate debit/immediate lines. It is
fragile: it fails the moment a bank uses a different label, and it already fails
for the orphan ₪88 debit. Purchase-month accounting and statement reconciliation
must be split into **two separate models** (working rule 8).

---

## 2. Exact reconciliation tables by provider / card

### 2.1 Max card 2254 (credit) — everything ties to the provider export

| Layer | Provider export (authoritative) | RAW scrape | Production DB | Leumi bank |
|---|---:|---:|---:|---:|
| **Monthly statement, due 2026-07-10** | **12,805.22** | 11,746.88 | 11,746.88 (proc 07-10) + 539.36 (proc NULL) | pending **12,744.22** (`לאומי ויזה`, id 3940) |
| **Immediate charges (07/2026)** | **1,188.13** | 1,188.13 | 1,188.13 | 1,188.13 (7 small `לאומי ויזה`) |

Proven identities:
- `11,746.88 + 539.36 (June 10–11) + 518.98 (installment 5/10) = 12,805.22` (statement).
- Immediate charges `147.99+294.13+290.08+113.89+11.90+23.90+306.24 = 1,188.13`,
  and each small `לאומי ויזה` bank line equals a Max immediate-charge batch grouped
  by `processedDate` (e.g. 3×ALIEXPRESS 230.88+67.6+7.76 = 306.24; 8×ANTHROPIC = 290.08).
- Bank pending 12,744.22 vs provider 12,805.22 = **₪61.00** (pending not yet final).
- Every small `לאומי ויזה` `identifier` ends in **2254** (582254, 882254, 292254,
  262254, 642254, 942254, 132254, 122254) → the bank encodes the card number in the
  reference; this is the reliable settlement→card mapping signal, not the Hebrew text.

### 2.2 Max card 8345 (**DEBIT**, labelled `8345-כרטיס DEBIT`)

| Layer | Provider export | Bank (`כרטיס דביט`) |
|---|---:|---:|
| Foreign / FX | **328.98** (GOOGLE*CLAUDE 88 + ALIEXPRESS 240.98) | posts as `כרטיס דביט` |
| Immediate | **1,357.31** (רמי לוי 997.29 + פז 360.02, 2026-06-01) | posts as `כרטיס דביט` (pre-window) |
| **Combined** | **1,686.29** | |

Debit is **direct bank spending**, not credit-card spending. The DB captured only 3
of these (240.98, 88, 387.29); the June 1–3 immediate debit (1,357.31) is before the
scrape window and absent everywhere.

### 2.3 Cal Visa 9962

| Statement | Provider / bank (authoritative) | Production DB |
|---|---:|---:|
| **Charged 2026-06-10** | **4,734.66** (all MAY purchases) | bank settlement `כרטיסי אשראי-י` **4,734.66** (id 1955) |
| Forming statement (proc 2026-07-10) | not in supplied export (excludes same-day/pending) | itemized **2,375.70** completed + **700.00** pending |

The Cal June-10 settlement (4,734.66) reconciles **May** purchases that were never
itemized (before the scrape window) → this month is `unavailable`/fallback, not a
mismatch. Cal's forming statement is visible only as itemized purchases; its bank
settlement is same-day/pending and excluded from the PDF.

### 2.4 Card purchases by **calendar month** (purchase date) — the spending model

| Card | June (completed) | July (completed) | July (pending) |
|---|---:|---:|---:|
| Max 2254 (credit) | 10,714.44 | 3,278.91 | — |
| Max 8345 (debit) | 240.98 | 475.29 | — |
| Cal 9962 | 1,000.00 | 1,375.70 | 700.00 |
| **card_posted (current model)** | **11,955.42** | **5,129.90** | **700.00** |

### 2.5 Income (Leumi), with salary signature applied

| Row | Amount | Date | Class | Attributed month |
|---|---:|---|---|---|
| הורייזן טכנו-י (id 3681) | +13,327.75 | 2026-07-09 | **salary** (signature id 1, offset −1) | **June** |
| מענק בנק לאומי (id 1947) | +163.12 | 2026-06-26 | other income | June |
| רבית זכות (id 1944) | +6.79 | 2026-06-30 | other income | June |
| גלש"ן שווקים-י (id 1958) | +10,160.00 | 2026-06-09 | **securities transfer** (excluded) | — |
| העמדת הלואה (id 1957) | +16,000.00 | 2026-06-10 | **loan disbursement** (excluded) | — |

June earned income = `13,327.75 + 163.12 + 6.79 = 13,497.66` (loan + securities
correctly excluded). July earned income = `0` (next salary not yet arrived). Both
match the current implementation.

### 2.6 Current model output — reproduced exactly (proven, not trusted)

| Month | income.actual | spending.committed | net.actual | reconciliation |
|---|---:|---:|---:|---|
| **June (offset −1)** | 13,497.66 | **15,388.89** | −1,891.23 | difference **2,951.47** → `needs_review` |
| **July (offset 0)** | 0.00 | **7,612.74** | −7,612.74 | `open` |

- June spending `= itemized 11,955.42 + bank_direct 3,433.47 = 15,388.89`.
- June difference `= July settlement 14,906.89 − June itemized 11,955.42 = 2,951.47`.
- July committed `= itemized 5,129.90 + bank_direct 1,782.84 + pending 700 = 7,612.74`.

---

## 3. Bank-direct expense table (Leumi, by economic class and month)

Classified from the DB and cross-checked against the PDF. **Card-company
settlements are reconciliation, not bank-direct spend** (last two rows excluded
from any spend total). **Debit belongs in bank-direct** (it is the primary fact).

| Class | June | July | Notes |
|---|---:|---:|---|
| Cash withdrawal (`משיכת מזומן`/`משיכה עם קוד`) | 1,260.00 | 600.00 | genuine bank-direct |
| Loan repayment (`פרעון הלוואה`) | 2,154.29 | 1,086.44 (pending) | bank-direct **and** feeds Loans sector |
| Fees / interest (`עמל`/`ריבית`) | 18.16 | 26.40 | bank-direct |
| Tax (`מס הכנסה`) | 1.02 | — | bank-direct |
| Standing order (`טפחות ס.ביטו`) | — | 70.00 | bank-direct |
| **Debit card (`כרטיס דביט`)** | 328.98 | 929.29¹ | **bank-direct** (currently mis-excluded) |
| — subtotal **true bank-direct** | **3,762.45** | **2,712.13** | |
| Max immediate settlement (`לאומי ויזה`, small) | 342.04 | 846.09 | excluded (= itemized Max 2254) |
| Max monthly settlement (`לאומי ויזה`, big) | 14,213.34 | 12,744.22 | excluded (reconciliation only) |
| Cal monthly settlement (`כרטיסי אשראי`) | 4,734.66 | — | excluded (reconciliation only) |

¹ July debit = 929.29 **after removing the phantom duplicate 387.29 (id 2470)**;
the raw DB sum is 1,316.58.

**Current model bank_direct** = 3,433.47 (June) / 1,782.84 (July) — it *excludes*
debit entirely, so it drops the June-05 orphan ₪88 debit and mis-locates the rest.
**Corrected bank_direct** (debit included, Max-8345 dropped from card) = 3,762.45
(June) / 2,712.13 (July). Net effect on June total: `−240.98 (drop 8345 from card)
+ 328.98 (add debit) = +88.00` — i.e. the current model **undercounts June by ₪88**.

---

## 4. Confirmed duplicates and missing records (with transaction IDs)

### 4.1 Confirmed duplicate — DO NOT DELETE (flagged only)

| Phantom row | Real row | Evidence |
|---|---|---|
| **id 2470** `leumi` `כרטיס דביט` 387.29, date 2026-07-06, `bank_sync_id leumi:797-43483_78:45061616`, `bank_status NULL`, `bank_processed_date NULL`, notes empty | **id 2885** `leumi` `כרטיס דביט` 387.29, date 2026-07-08, `…:61616`, status `completed`, proc 2026-07-08, notes "…בכרטיס המסתיים ב-8345 ב-שופרסל דיל גילה" | Leumi PDF shows `כרטיס דביט 387.29` **once** (08.07.2026). Current RAW contains it once (identifier 61616). id 2470 is a stale pending capture whose identifier/date changed on settlement. |

The phantom does **not** inflate the spend total today (it is excluded as a
settlement-pattern line), but it inflates the reconciliation settlement figure and
is a real integrity defect. It must be deduped before debit is moved to bank-direct
(otherwise it *will* double-count).

### 4.2 Debit cross-source double-records (one purchase, two rows)

Every Max-8345 debit purchase also exists as a Leumi `כרטיס דביט` row:

| Purchase | Leumi row | Max 8345 row |
|---|---|---|
| GOOGLE*CLAUDE 88 (2026-07) | id 1940 | id 3024 |
| ALIEXPRESS 240.98 (2026-06) | id 1959 | id 2030 |
| שופרסל 387.29 (2026-07) | id 2885 (+ phantom 2470) | id 3325 |

Not double-counted in the current spend total (bank side excluded), but the design
is inverted (see §1.2). The 2026-06-05 ₪88 debit (id 1961) and 2026-07-09 ₪454
pending debit (id 4200) have **no** Max-8345 counterpart → the ₪88 is dropped.

*(The `כרטיס דביט 88.00` pair — id 1940 @ 07-07 and id 1961 @ 06-05 — are **two
different real purchases**, confirmed by the PDF showing both dates. Not a duplicate.)*

### 4.3 Missing records

| Missing | Amount | Where it should be | Evidence |
|---|---:|---|---|
| Municipality installment **5/10** (`עירית ירושלים גזברות`, "תשלום 5 מתוך 10") | 518.98 | Max 2254 July statement | In provider export (row r6); RAW/DB instead hold **6/10** (future, proc 2026-08-10, id `…_6`). |
| June 10–11 Max 2254 purchases (7 rows) | 539.36 | Max 2254 July statement | In provider export (פיצוציית החברים 52, שילב 239.8, אנג'ל 40, פלאפון 42.56, צור חושן 35, מנשנשים 61, KSP 69). In DB **with `processedDate = NULL`** → not grouped into the statement. |
| Max 8345 early-June immediate debit (רמי לוי 997.29 + פז 360.02) | 1,357.31 | June bank-direct | In provider export + PDF (03.06.2026); before scrape window → absent from DB. |

`518.98 + 539.36 = 1,058.34`, and `11,746.88 + 1,058.34 = 12,805.22` — closes the
Max statement exactly.

---

## 5. RAW-vs-export field discrepancies

The provider exports carry fields that the scraper never captured or that the
scraper reported *differently* from the statement:

| Field | Provider export | RAW / DB | Impact |
|---|---|---|---|
| Installment position | 5/10 on the 07-10 statement (518.98) | RAW returns **6/10** (proc 08-10); 5/10 absent | Statement under-reported 518.98; installment position wrong. |
| Statement completeness | 88 rows, total 12,805.22 | 73 rows (11,746.88); June 10–11 at proc NULL | RAW window truncates the statement head; DB can't group those rows. |
| `originalAmount` / `originalCurrency` | e.g. ANTHROPIC $20 → ₪61.72 (rate 2.996) | only `chargedAmount` (₪61.72) kept | No FX audit; can't show "$20". |
| `installments {number,total}` | structured 5/10, 12/12, 1/12 | **dropped** at mapper (only Hebrew memo "תשלום X מתוך Y" survives in `notes`) | No structured installment model. |
| txn `type` (`installments`/`normal`) | present | **dropped** | Can't classify installment rows without parsing Hebrew. |
| `chargedCurrency` | present | dropped | Minor. |
| Discount memo (הום שופ: orig 139.9 → charged 128.01, "הנחת מועדון −11.89") | present | only charged 128.01 | Loses the original amount / discount. |

Fields the scraper **does** preserve correctly: `date` (purchase), `processedDate`
→ `bank_processed_date`, `status` → `bank_status`, `identifier` → `bank_sync_id`,
`category` → `raw_category`, `memo` → `notes`, `chargedAmount` → `amount`.

---

## 6. Root causes in the current code (file / line)

### 6.1 `server/services/monthlyAccountingService.js`

- **Line 6** — `SETTLEMENT` regex `(דביט|ויזה|מקס|ישראכרט|כאל|אמקס|…|אשראי|…)`.
  - `דביט` makes every `כרטיס דביט` (real debit spending) a "settlement" →
    excluded from `bank_direct` (line 57). When no Max-8345 copy exists, the
    expense vanishes (the ₪88 orphan).
  - bare `ויזה` + `אשראי` lump the Max **monthly** statement, the Max **immediate**
    charges, and the Cal settlement into one bucket with no way to tell them apart.
- **Lines 43–49 + 74** — the `settlement` CTE sums *all* settlement-pattern bank
  expenses in month **M+1** (`t.date >= next.start AND t.date < next.end`), then
  `difference = settlement − itemizedCardPosted`. This is the **2,951.47 generator**:
  it compares month-M calendar purchases against month-M+1 bank lines that include
  the monthly statement (a *statement-cycle* total), immediate charges (already in
  itemized), debit (already in itemized), a phantom duplicate, and a pending item.
- **Line 54** — `card_posted` sums all card-source expenses including **Max 8345
  (debit)**; debit is treated as credit-card spend.
- **Line 70** — `fallbackCardSpend = settlement` for unconnected cards reuses the
  same polluted settlement total (monthly + immediate + debit), overstating.
- **Line 83** — `status … 'needs_review'` fires on the artificial mismatch, so June
  is permanently flagged for review on a non-problem.

### 6.2 `server/services/dashboardService.js`

- **Lines 45–50** — `CARD_SETTLEMENT_SOURCE_PATTERNS`: `visa_cal → (כאל|…|cal)`,
  `max → (מקס|max)`. **Backwards for this bank.** Leumi labels the **Max** card
  `לאומי ויזה` (no מקס/max) and the **Cal** card `כרטיסי אשראי` (no כאל/cal). So
  both settlements resolve to `settlement_card_source = NULL`.
- **Lines 130–136 & 215–223** — exclusion requires `settlement_card_source = ANY(card_sources)`
  **or** (`NULL AND card_source_count = 1`). With two card companies
  (`card_source_count = 2`) and NULL mapping, the bank settlement is **not**
  matched to a card in these breakdown queries — the exact 2026-07-11 failure mode.
- **Lines 60–69** — `BANK_PATTERN_CASE` / `BANK_CARD_SETTLEMENT_PATTERN` repeat the
  same `דביט|ויזה|…|אשראי` conflation for the category breakdown and bank-costs.
- **Lines 466–468** — dashboard overrides `summary.total_income/expenses/net` with
  `monthlyAccountingService.buildMonth`, so it inherits every defect above.

### 6.3 `server/services/bankSyncService.js` (duplicate root cause)

- **Line 101** — `bankSyncId = source:acctKey:identifier`. Leumi assigns a
  *different* `identifier` to the pending vs settled version of the same movement
  (`45061616` → `61616`) **and** shifts the date (07-06 → 07-08).
- **Lines 105 / 113** — the hard dedup keys on `(user_id, bank_sync_id)`; a changed
  identifier is a new key → new row (id 2470 vs 2885).
- **Lines 145–159** — the soft dedup (match on date+amount+description) is **only
  reached when `bank_sync_id` is null**; with an identifier present it never runs,
  and even if it did, the date drift (07-06 vs 07-08) would defeat it.
  → pending→settled bank movements duplicate whenever the provider re-keys them.

### 6.4 `spendwise-agent/src/core/scraper.js` (field drop)

- **Lines 104–147** — `mapped` keeps `date, description, charged_amount, notes,
  processed_date, status, identifier, raw_category` and **silently omits**
  `txn.originalAmount`, `txn.originalCurrency`, `txn.chargedCurrency`, `txn.type`,
  and `txn.installments`. Installment position and FX are lost before the server
  ever sees them.

---

## 7. Recommended schema and matching rules

### 7.1 Two separate models (non-negotiable, working rule 8)

- **Calendar-month spending** — keyed on purchase `date`. Never uses statement
  membership. This is the dashboard number.
- **Statement reconciliation** — keyed on provider statement (`processedDate`
  group / statement id). Compares the provider's own statement total against the
  matched bank settlement. Never uses a calendar month. This is a separate report
  and must never feed `needs_review` on the calendar month.

### 7.2 Transaction classes (classify at ingest, not by fragile regex at read)

Store an explicit `ledger_class`: `card_purchase_monthly`, `card_purchase_immediate`,
`debit_direct`, `card_settlement_monthly`, `cash_withdrawal`, `bank_transfer`,
`fee_interest`, `loan_repayment`, `loan_disbursement`, `salary`, `installment`,
`refund_credit`, `pending`. Derive from source + `type` + provider signals, not from
Hebrew substring matching in the summary query.

### 7.3 Schema additions

`transactions` (additive, nullable — no rewrite of facts):
- `original_amount numeric`, `original_currency text` — foreign-charge audit.
- `installment_number smallint`, `installment_total smallint` — from
  `txn.installments`; alternatively `installments jsonb`.
- `txn_kind text` — `normal` | `installments` (from `txn.type`).
- `ledger_class text` — the class from §7.2 (or compute in a view).
- `settlement_card_source text` — the card a bank settlement pays (resolved once
  at ingest by the rules in §7.4), so read queries never re-guess.

The scraper (`scraper.js`) must forward `originalAmount`, `originalCurrency`,
`chargedCurrency`, `type`, and `installments` for these to be populated.

### 7.4 Settlement → card matching rules (replace the brand-name regex)

1. **Identifier suffix (strongest):** a Leumi settlement whose `identifier` ends in
   a connected card's last-4 maps to that card. `582254`/`882254`/… → card **2254**
   (Max). Proven for all eight `לאומי ויזה` lines.
2. **Amount+date match:** map a bank settlement to the provider statement whose
   authoritative total equals it on the same charge date (Cal `כרטיסי אשראי`
   4,734.66 ↔ Cal statement charged 2026-06-10 = 4,734.66).
3. **Immediate vs monthly:** a `לאומי ויזה` line equals a `processedDate` **batch**
   of Max immediate charges → mark `card_purchase_immediate` reconciled, **never**
   add it to monthly settlement.
4. **Ambiguous fallback:** if neither 1 nor 2 resolves and >1 card company exists,
   mark provider-level reconciliation `ambiguous` (spec §7) — do **not** force a
   calendar mismatch.

### 7.5 Debit rule

`כרטיס דביט` (debit source 8345) is **bank-direct spending counted once from the
bank row**. The Max-8345 itemized row is **enrichment** (merchant/category/FX) and
must not create a second expense. Link them (amount + card-suffix in memo + close
date) rather than counting the card copy.

### 7.6 Dedup rule for pending→settled bank movements

Add a soft-match pass for bank (non-card) rows that runs **even when an identifier
is present**: reconcile a prior `pending` row to a new `completed` row on
`(source, account, amount, normalized description)` within a small date window,
updating in place instead of inserting. This retires id 2470 and prevents recurrence.

---

## 8. Safe migration / deployment order

1. **Additive schema first** (no behaviour change): add the nullable columns in
   §7.3. Deploy. Verify nothing reads them yet.
2. **Scraper forward-fields** (agent): map `originalAmount/Currency`, `type`,
   `installments`. Deploy agent. Confirm a fresh RAW carries them; **backfill is
   only possible for rows re-scraped in-window** — older rows stay null (acceptable).
3. **Ingest classifier + settlement mapping** (`bankSyncService`): populate
   `ledger_class`, `settlement_card_source`, installment fields; add the
   pending→settled soft-dedup for bank rows. Run in **preview/dry-run** first
   (`reconcile-raw-to-db.js` pattern). Compare against this report's numbers.
4. **Split the read models** (`monthlyAccountingService`): calendar spending stops
   using the `M+1` settlement CTE for `difference`/`status`; move reconciliation to
   a separate statement-based function. Debit → bank-direct; Max-8345 → enrichment.
   Keep the legacy endpoint alive behind a flag for rollback.
5. **Fix `dashboardService` settlement mapping** to use `settlement_card_source`
   from the DB (not the backwards brand regex).
6. **Retire the phantom** id 2470 only through the dedup pass (or an explicit,
   reviewed, dry-run-verified cleanup) — never a blind delete.
7. Verify June/July against §9 before switching the dashboard; keep the shadow
   comparison until numbers match.

Do **not** commit RAW financial files or the exports. Do not run migrations until
Codex has reviewed this report.

---

## 9. Concrete tests with expected numeric totals (user 1, this dataset)

**RAW arithmetic (pure, no DB):**
- Max 2254 statement group (proc 2026-07-10, completed) = **11,746.88** (73 rows).
- Max 2254 immediate (proc < 07-10, completed) = **1,188.13** (22 rows).
- Small `לאומי ויזה` bank lines sum = **1,188.13**; each equals its `processedDate` batch.
- Max 2254 future installments (proc 2026-08-10) = **667.98** (muni 6/10 518.98 + insurance 2/12 149).
- Cal 9962 completed (proc 07-10) = **2,375.70**; pending = **700.00**.

**Provider-export invariants:**
- Max 2254 monthly statement total = **12,805.22**; immediate total = **1,188.13**.
- `11,746.88 + 539.36 + 518.98 = 12,805.22`.
- Max 8345 foreign = **328.98**, immediate = **1,357.31**, combined = **1,686.29**.
- Cal 9962 statement charged 2026-06-10 = **4,734.66**.

**Bank (Leumi) invariants:**
- Balance identity: `12,569.66 (PDF post-salary) − 12,744.22 − 1,086.44 − 454.00 = −1,715.00`
  (= live `bank_accounts.balance`).
- Bank pending `לאומי ויזה` 12,744.22 vs provider statement 12,805.22 → **61.00**.

**Calendar-month spending (target = current, except the debit fix):**
- June card_posted = **11,955.42** (Max2254 10,714.44 + Max8345 240.98 + Cal 1,000).
- July card_posted = **5,129.90**; July card_pending = **700.00**.
- June earned income = **13,497.66**; July earned income = **0.00**.
- **Corrected** June bank-direct (debit in) = **3,762.45**; corrected June spend =
  `11,714.44 (card, ex-8345) + 3,762.45 = 15,476.89` → current 15,388.89 is **−88.00**.
- **Corrected** July bank-direct (real debit, ex-phantom) = **2,712.13**.

**Reconciliation (must be a separate model):**
- Statement reconciliation Max 2254 = provider 12,805.22 vs bank pending 12,744.22 →
  `partial` (Δ 61.00, pending), **not** `mismatch`.
- Calendar-month `difference`/`needs_review` must **not** compute 2,951.47; that
  number must not exist once the two models are split.

**Duplicate / dedup:**
- Exactly one hard duplicate in `[2026-06-01, 2026-08-01)`: (id 2470, id 2885),
  `כרטיס דביט` 387.29. Assert count of distinct real 387.29 debit = 1.
- After the pending→settled soft-dedup, id 2470 is retired and July debit bank-direct
  = 929.29 (not 1,316.58).

**Field preservation (after §8 step 2):**
- ANTHROPIC row carries `original_amount = 20, original_currency = USD, amount = 61.72`.
- Municipality statement row carries `installment_number = 5, installment_total = 10`.

---

## 10. Message to Codex

Your calendar-month rebuild is a real improvement and most of it holds up under
primary-source audit — salary signature, financing exclusion, purchase-date card
months, and killing the headline double-count are all correct. The following, from
my evidence, needs correction; some are claims in `CLAUDE_HANDOFF.md` / `ROADMAP.md`
that my data disproves:

1. **The ₪2,951.47 June reconciliation "mismatch" is not real — retract it.** It is
   `July settlement 14,906.89 − June itemized 11,955.42`, and the 14,906.89 mixes
   the Max monthly statement (a statement-cycle total, not June), immediate charges
   and debit (both already counted as itemized), a phantom duplicate (387.29), and a
   pending ₪454. `monthlyAccountingService.js` lines 43–49/74 must stop comparing
   calendar-month itemized against next-month settlement. Reconcile against the
   **provider statement** (`processedDate` group), not the calendar month.

2. **Debit is inverted.** `כרטיס דביט` is direct bank spending (primary fact); Max
   8345 is a DEBIT card and its rows are enrichment. Today the code excludes the
   bank debit (SETTLEMENT regex `דביט`, line 6/57) and counts the Max copy as card
   spend — which **drops the 2026-06-05 ₪88 debit (id 1961)** because it has no Max
   copy. June is undercounted by ₪88. Move debit to bank-direct; treat Max 8345 as
   enrichment.

3. **"Pending `לאומי ויזה` refreshed to RAW truth 12,744.22"** — 12,744.22 is the
   *pending* value, not the truth. The authoritative Max statement is **12,805.22**
   (provider export). The ₪61 gap is the pending-not-final delta, and the RAW is
   *also* missing installment 5/10 (₪518.98, you have 6/10 instead) and the June
   10–11 rows (₪539.36, sitting at `processedDate = NULL`). Don't treat the bank
   pending figure as the statement total.

4. **The settlement→card brand mapping in `dashboardService.js` (lines 45–50) is
   backwards for Leumi.** `לאומי ויזה` = the **Max** card (2254), `כרטיסי אשראי` =
   the **Cal** card (9962). Your patterns map `ויזה→cal` and `מקס→max`, so with two
   card companies both settlements resolve to NULL and don't exclude. Use the
   **identifier suffix** (every `לאומי ויזה` id ends in `2254`) and amount+date
   statement matching instead of the Hebrew brand text.

5. **The ingest drops fields the model needs** (`scraper.js` 104–147): `installments`,
   `originalAmount`/`originalCurrency`, `type`. Your roadmap's installment work and
   FX audit are blocked until these are forwarded and stored.

6. **One confirmed production duplicate: id 2470** (phantom of id 2885, ₪387.29
   debit). Root cause is real and will recur: `bankSyncService.js` line 101 keys
   dedup on a Leumi `identifier` that changes between pending (`45061616`) and
   settled (`61616`), and the date shifts too, so neither hard nor soft dedup
   catches it. Add a pending→settled soft-match for bank rows. **Do not** blind-delete
   2470 — retire it through the dedup pass. (I did not delete it.)

Confirmed correct and not to be re-chased: salary is id 3681 on 2026-07-09
attributed to June; loan disbursement (16,000) and securities transfer (10,160) are
correctly excluded from income; June earned income 13,497.66 and the card
purchase-date totals are right; the Cal June-10 4,734.66 settlement matches the bank
exactly and legitimately has no itemization (May, pre-window) → `unavailable`, not a
mismatch.

Everything in this report is reproducible from the four provider/bank documents, the
three RAW JSON files, and read-only production queries. No production data, schema,
or deployment was touched.
