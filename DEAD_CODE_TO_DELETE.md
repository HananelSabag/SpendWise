# Dead code to delete

These files are confirmed unused by production code. Per the cleanup request,
delete them as part of the review.

## Confirmed dead (533 lines total)

| File                                                       | Lines | Why it's dead                                                                              |
| ---------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------ |
| `client/src/hooks/useModernOnboardingNavigation.js`        | 265   | **Zero references** anywhere in the codebase. Verified with full grep over all .js/.jsx.   |
| `server/utils/dbQueries.js`                                | 268   | The `DBQueries` class with `getDashboardData`/`DashboardCache` — **only its own test imports it**. The real dashboard route uses `Transaction` model methods, never these. The `get_dashboard_summary` SQL function it wraps does exist in your DB but is never called from app code. |
| `server/__tests__/dbQueries.cache.test.js`                 | —     | Tests the dead module above. Goes with it.                                                 |

## One-command cleanup

```bash
cd C:\CodingProjects\SpendWise
git rm client/src/hooks/useModernOnboardingNavigation.js \
       server/utils/dbQueries.js \
       server/__tests__/dbQueries.cache.test.js
```

## Larger cleanups to consider (not auto-applied)

These are real but more invasive — listed for your review, not deleted:

### Server-side legacy `income` and `expenses` tables (still in DB, not in code)
Migration 07 unified them into `transactions` but didn't drop the originals.
Live data: 21 rows in `income`, 98 rows in `expenses`, last write 2026-03-31.
The unified `transactions` table has 119 rows (=21+98 — matches!), so the
migration completed but never cleaned up. Suggested follow-up:

```sql
-- After confirming no code path still writes to legacy tables (grep for
-- 'INSERT INTO income\|INSERT INTO expenses' in /server should be empty):
DROP TABLE IF EXISTS public.income;
DROP TABLE IF EXISTS public.expenses;
```

### 175 `console.log` calls in client/src/
Mostly in `api/transactions.js` (20), `utils/helpers.js` (12), and
`api/auth.js` (11). Adds bundle weight + slows the 0.1 vCPU client.
A `vite.config.js` `terserOptions: { compress: { drop_console: true } }`
strips them in prod builds without touching source — safer than ripping
them out by hand.

### Server `/test`, `/test-query`, `/optimization-summary` routes
Diagnostic endpoints exposed in production. Reasonable to gate behind an
admin check or `NODE_ENV !== 'production'`.

### `services/transactionAI.js` and the `enableAI` opt-in
Currently every callsite passes `enableAI: false`. The whole AI module
ships in the bundle but is never executed. Either start using it or remove
it (and the imports in `useTransactions.js`).
