# SpendWise Calendar-Month Accounting — Product and Engineering Specification

Status: approved direction, implementation in progress  
Replaces the fixed `billing_cycle_day` model as the primary dashboard model.  
Ledger facts remain immutable; attribution is a separate calculation layer.

## 1. The problem we are solving

A single date window cannot honestly represent all three timelines:

1. **Ledger time:** when money actually entered or left the bank.
2. **Activity time:** when a purchase, transfer or expense happened.
3. **Accounting month:** the work/spending month that delayed salary and card
   settlements economically belong to.

Example for this product model:

- Work performed during June is paid as salary on July 9.
- Max purchases made during June are paid as one bank settlement on July 11.
- Max purchases made from July 1 onward belong to July and will settle in August.

The July 9 salary and July 11 bank settlement are real July bank movements, but
they close **June's accounting month**. They must not erase or hide July activity,
and the bank settlement must not be counted again when the connected card already
provided the itemized June purchases.

## 2. Non-negotiable principles

### 2.1 Preserve facts

The transaction ledger always keeps:

- actual transaction timestamp and local calendar date;
- source, account/card and immutable bank identifier;
- actual amount, description, memo, category and status;
- provider `processedDate` as metadata only until its semantics are proven for
  that provider.

Never rewrite a transaction's factual date merely to make it appear in another
month. Economic attribution is computed or stored separately.

### 2.2 Calendar month is the primary user period

The main financial summary is January, February, March, etc. There is no primary
11th→10th or salary-day→salary-day dashboard window.

`billing_cycle_day` is obsolete and does not drive Dashboard, Transactions or
Insights month selection.

### 2.3 Never double-count card spending

When a credit card is connected:

- itemized purchases are the spending truth;
- the later bank settlement is a liability payment/reconciliation event;
- the settlement is excluded from monthly expenses;
- the settlement remains visible in the factual bank ledger;
- itemized total and settlement are compared for reconciliation.

When a card is not connected:

- the bank settlement is the only available spending evidence;
- it is attributed back to the previous accounting month as a clearly labelled
  fallback total because itemized purchase facts are unavailable;
- UI clearly says that itemized card data is unavailable.

## 3. Exact month attribution rules

### 3.1 Salary

- User selects which positive bank transaction is salary.
- SpendWise stores a signature based on normalized description + bank source +
  account, never only on amount or day-of-month.
- By default, a matched salary belongs to the **previous calendar month**.
- The actual transaction remains dated on its real bank date.
- The signature supports a configurable `month_offset`, default `-1`, because a
  future employer may pay in the current month instead.
- Weekend/holiday movement is irrelevant because matching uses description and
  account, not a fixed day.
- Two matching salary transactions attributed to one month require review
  (salary + bonus, correction, duplicate, or a job change).

### 3.2 Other income

- Ordinary non-salary income belongs to its actual local calendar month.
- Loan disbursements (`העמדת הלואה` and equivalents) are financing, not earned
  income, and never inflate the main income/net number.
- Own-account investment/securities transfers are transfers, not earned income.
- Bonus classification can be attached to salary or treated as other earned
  income after user confirmation.

### 3.3 Connected credit-card purchases

- Month is determined from the purchase's actual local `date`.
- July 1–31 purchases are July spending even if paid on August 11.
- Completed and pending totals are returned separately.
- Current-month headline can show `posted + pending` as committed spending, with
  the pending part visibly labelled.
- Closed months use completed facts; unresolved pending items keep the month in a
  review/provisional state rather than silently disappearing.
- Refunds/credits from the card reduce that card month's net spending.

### 3.4 Bank-direct expenses

- Direct debit, transfer, cash withdrawal, loan repayment, fee and similar bank
  expense belongs to its actual local calendar month.
- Card settlements are detected and excluded from bank-direct expenses when the
  corresponding detailed card data is connected.
- Loan repayments remain real expenses and also feed the dedicated Loans sector.

### 3.5 Manual entries

- Manual income/expense belongs to the user-selected calendar date.
- Manual entries can be explicitly marked as an adjustment for another month;
  such overrides must be auditable and reversible.

## 4. June/July canonical example

### June final summary

- Income: salary that entered the bank on July 9 but was attributed to June.
- Card spending: detailed Max/Cal purchases dated June 1–30.
- Bank-direct spending: non-card-settlement bank expenses dated June 1–30.
- Bank settlement on July 11: reconciliation only, not another expense.
- Result: June actual income − June actual itemized/direct spending.

### July current summary on July 11

- Card spending: detailed purchases dated July 1–11.
- Bank-direct spending: real July expenses, excluding July's settlement for June.
- Income: only non-salary income that actually occurred during July. July's
  salary is still unknown and is not invented or copied from another month.
- Result is the factual month-to-date net and is labelled **month still open**.

### Closing July in August

- August salary match is attributed back to July and completes its actual income.
- August card settlement is compared with July's itemized card total.
- July changes from provisional to closed (or `needs_review` if reconciliation
  materially differs).

## 5. Monthly status state machine

Each month returns one of:

- `open` — current calendar month is still accumulating activity.
- `awaiting_salary` — month ended but its next-month salary has not arrived.
- `awaiting_settlement` — salary is known; one or more expected card settlements
  have not arrived yet.
- `provisional` — facts exist but pending transactions or missing card detail make
  the result incomplete.
- `needs_review` — duplicate salary candidate or reconciliation mismatch.
- `closed` — actual salary is known and connected-card reconciliation is complete
  (or no card settlement is expected).
- `insufficient_data` — a new user does not yet have enough factual history to
  complete a prior month.

Closing a month never prevents late facts from being incorporated. A later bank
correction reopens/recalculates the derived summary while retaining an audit trail.

## 6. Calculations

For accounting month `M`:

```text
earned_income_actual = matched salary transactions attributed to M
                     + other earned income occurring in M

card_spend_posted = connected card expenses purchased in M and completed
                  - connected card refunds purchased/credited in M

card_spend_pending = connected card expenses purchased in M and still pending

bank_direct_spend = bank expenses occurring in M
                  - detected card settlements
                  - internal transfers classified as non-spending

monthly_spend_actual = card_spend_posted
                     + bank_direct_spend
                     + manual expenses in M

monthly_spend_committed = monthly_spend_actual + card_spend_pending

actual_net = earned_income_actual - monthly_spend_committed
```

There is no salary or net estimation. A zero current-month salary means only that
the salary economically belonging to this month has not arrived next month yet.

## 7. Card reconciliation

For each connected provider/card where mapping is unambiguous:

```text
itemized_total(M) = net completed purchases whose purchase date is in M
settlement_total(M) = matched bank settlement(s) paid in M+1
difference = settlement_total - itemized_total
```

Statuses:

- `matched`: absolute difference ≤ max(₪5, 0.5% of itemized total).
- `partial`: statement/settlement has not fully arrived or pending items remain.
- `mismatch`: both sides are final and difference exceeds tolerance.
- `ambiguous`: generic bank description cannot safely map to one of several cards.
- `unavailable`: card is not connected; settlement is a fallback total without
  itemized purchase detail.

Differences can be explained by refunds, fees, foreign-currency conversion,
installments, a statement range that is not exactly the calendar month, missing
accounts or provider corrections. Never force equality or silently edit facts.

If a generic settlement such as `לאומי ויזה` cannot be mapped to Max versus Cal,
compare the aggregate connected-card total against aggregate card settlements and
mark provider-level reconciliation ambiguous.

## 8. `processedDate` decision

The existing implementation assumed card `processedDate` was the bank statement
debit date and used it for financial-period membership. That assumption is now
revoked.

- Purchase month always comes from the real purchase `date`.
- `processedDate` is retained for provider-specific audit/reconciliation.
- Each provider must be validated separately before the field is named or used as
  `statement_date`, `posting_date` or `payment_date`.
- Max/Cal raw evidence must be compared with the provider UI/statement before an
  automatic statement-range rule is trusted.

## 9. Database design

### 9.1 `salary_signatures`

```text
id                    bigint identity primary key
user_id               bigint not null references users(id) on delete cascade
bank_source           text not null
bank_account_number   text
normalized_description text not null
display_description   text not null
month_offset          smallint not null default -1 check (-2..0)
active                boolean not null default true
created_from_transaction_id bigint references transactions(id)
created_at / updated_at timestamptz
unique active signature per user/source/account/description
```

### 9.2 `transaction_month_overrides`

Only for explicit reviewed exceptions; ordinary attribution remains derived.

```text
transaction_id        bigint primary key references transactions(id)
user_id               bigint not null references users(id)
economic_month        date not null (first day of month)
classification        salary | bonus | financing | transfer | card_settlement | other
reason                text
created_by             user | system_review
created_at / updated_at timestamptz
```

### 9.3 Reconciliation storage

Start derived, not persisted. Add `monthly_reconciliation_snapshots` only if
performance/history requires it. The source transactions always remain the truth.

### 9.4 Removed legacy field

`users.billing_cycle_day` is removed after all deployed code stops reading it.
Calendar month is the sole primary accounting period; there is no permanent
compatibility layer for the obsolete cycle model.

## 10. Server/API contract

Add an additive service first: `server/services/monthlyAccountingService.js`.

### Endpoints

- `GET /transactions/monthly-accounting?month=YYYY-MM`
- `GET /transactions/monthly-accounting/overview` (previous + current month)
- `GET /transactions/salary-candidates`
- `POST /transactions/salary-signatures`
- `DELETE /transactions/salary-signatures/:id`
- `GET /transactions/monthly-reconciliation?month=YYYY-MM`

### Overview payload

```json
{
  "previous": {
    "month": "2026-06",
    "status": "closed",
    "income": { "actual": 13327.75, "salaryActual": 13327.75, "other": 0 },
    "spending": {
      "bankDirect": 1200,
      "cardPosted": 12000,
      "cardPending": 0,
      "manual": 0,
      "actual": 13200,
      "committed": 13200
    },
    "net": { "actual": 127.75 },
    "dailyAverage": { "income": 444.26, "spending": 440 },
    "reconciliation": { "status": "matched", "difference": 0 }
  },
  "current": {
    "month": "2026-07",
    "status": "open",
    "income": { "actual": 0, "salaryActual": 0, "other": 0 },
    "spending": {
      "bankDirect": 500,
      "cardPosted": 2400,
      "cardPending": 700,
      "manual": 0,
      "actual": 2900,
      "committed": 3600
    },
    "net": { "actual": -3600 },
    "dailyAverage": { "income": 0, "spending": 327.27 }
  }
}
```

The old dashboard payload remains available during shadow rollout.

## 11. Client UX

### Dashboard

Keep the balance hero fully factual and independent.

Replace the single Financial Period card with two compact month cards:

1. **Previous month — finalization**
   - actual salary attributed to that month;
   - itemized spending and bank-direct spending;
   - actual net;
   - settlement reconciliation status;
   - clear incomplete/review state when needed.

2. **Current month — month to date**
   - purchases and bank expenses from the 1st through today;
   - posted and pending split;
   - only actual non-salary income received this month;
   - factual month-to-date net, with no salary forecast.

The user can open either card for its transaction composition. A bank settlement
appears in the factual bank ledger and reconciliation detail, not as another
monthly expense.

### Transactions

- Default date filtering is actual purchase/bank date.
- Optional badges show attributed month for salary and settlements.
- Detail sheet shows purchase date, bank posting/processed metadata, memo,
  connected card, statement reconciliation and installments when available.

### Insights

- Calendar-month history, not fixed cycle offsets.
- Do not render months before the earliest trustworthy data.
- Status badge per month: closed, provisional, awaiting data, needs review.

### Salary setup

- After first sync, show positive bank transactions as candidates.
- User selects salary once and confirms “This payment is for the previous month”.
- Show signature preview (employer description + account), never credentials.
- Allow replacement when job/employer changes.

## 12. New-user behavior

- First sync should request enough history to cover at least the previous full
  calendar month plus the current month; use two months for onboarding/backfill.
- Never estimate salary from prior payments.
- If no salary exists yet, the current month still shows factual zero salary and
  real activity; the previous month displays `awaiting_salary` or
  `insufficient_data` as appropriate.
- If a card is connected, use itemized purchase dates immediately.
- If only a bank is connected, use next-month card settlements as a clearly
  labelled fallback for the previous month.

## 13. Loans

- Loan disbursement is financing and excluded from earned income.
- Loan repayment is bank-direct spending in its actual month.
- Recurring repayment detection feeds the Loans page without changing the monthly
  accounting facts.
- Manual loan definition and later scraper enrichment remain required because the
  current Leumi RAW contains repayment transactions but no principal/term/remaining
  balance.

## 14. Migration and rollout

### Phase 1 — additive shadow model

- Create salary/override tables with RLS and indexes.
- Build `monthlyAccountingService` and tests.
- Return new payload beside the legacy financial-cycle payload.
- Compare June/July results against RAW and production DB.

### Phase 2 — user classification

- Add salary candidate/selection UI.
- Seed user 1 salary signature from the confirmed Horizon transaction only after
  preview.
- Add settlement detection and reconciliation confidence.

### Phase 3 — dashboard switch

- Render previous/current calendar-month cards.
- Keep legacy endpoint available for rollback.
- Verify mobile, Hebrew/English and query invalidation after sync.

### Phase 4 — retire primary cycle-day model

- Remove `billing_cycle_day` from Dashboard/Insights queries and UI.
- Keep column temporarily for compatibility.
- Remove legacy service only after production comparison and rollback window.

## 15. Test matrix

- Salary paid next month and attributed back.
- Salary shifted by weekend/holiday.
- Employer change and two salary candidates.
- New user before first salary.
- Connected card: itemized purchases + later settlement, no double count.
- Unconnected card: settlement fallback attributed to previous month.
- Multiple cards and ambiguous generic bank settlement.
- Purchases on month boundary and local midnight/DST.
- Pending purchase becomes completed or changes amount.
- Refund, fee, foreign currency and installments.
- Loan disbursement excluded; repayment included.
- Deleted/disabled account remains excluded.
- Late correction reopens/recalculates a closed month.

### 15.1 Stabilization edge cases verified on 2026-07-12

- `פריסה לתשלומים` is financing proceeds. Exclude it from earned income and from
  spending even when the bank exposes it as a positive transaction paired with a
  card settlement. Do not invent principal, term, or an installment schedule.
- A loan repayment (`פרעון הלוואה`) is bank-direct spending on its factual date;
  pending means committed but not actual.
- Preserve pending and completed bank rows in the immutable ledger. For derived
  totals only, suppress a pending copy when a completed bank row matches the same
  source, account, direction, cent amount, normalized description, and local date.
  Do not apply this rule to credit-company itemization.
- A final bank settlement cannot be declared mismatched while provider purchases
  for the same statement date are pending. Report reconciliation as `partial` and
  leave calendar spending sourced from the itemized purchase facts.
- The committed-spending equality is exact to cents:
  `bank completed + bank pending + card posted + card pending + manual = committed`.
  Pending is a subset/explanation, never an additional amount on top of committed.
- Transaction detail must retain the factual purchase date while separately
  showing provider processed date, pending/completed state, original currency,
  transaction kind and installment position when captured.

## 16. Definition of done

- June and July can be explained transaction by transaction.
- Current month always shows activity from the 1st through today.
- Delayed salary closes the previous work month.
- Connected-card settlement is never double-counted.
- Reconciliation differences are visible, not hidden or force-balanced.
- New users see real activity immediately and explicit incomplete states, never
  invented income.
- Ledger dates remain factual and auditable.
- Fixed `billing_cycle_day` no longer drives the primary financial result.
