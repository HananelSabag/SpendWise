# SpendWise — deep code audit findings

Generated 2026-04-26. Categorized by impact / effort.

The codebase totals **~78,000 lines** of JS/JSX. That's substantial for a
single-author portfolio project, and most of the issues below stem from the
same root: organic growth without a refactor pass.

---

## 🔥 HIGH IMPACT — already fixed

These were fixed in this pass; included here for the audit trail.

| Issue | Location | Status |
|---|---|---|
| Server `process.exit(1)` on DB failure → infinite Render restart loop | `server/index.js` | ✅ fixed |
| Token refresh recursion → infinite 401 loop when refresh expires | `client/src/api/client.js` | ✅ fixed |
| Logout uses 45s axios timeout → looks frozen for 45s when API is dead | `client/src/stores/authStore.js` | ✅ fixed (3s) |
| `Transaction.update` writes to legacy income/expenses → silent edit failures | `server/models/Transaction.js` | ✅ fixed |
| `findByUser` and `getTotalCount` ran extra COUNT query each call | `server/models/Transaction.js` | ✅ simplified |
| Dashboard fired 3 parallel API calls (50-row over-fetch in widget) | `client/src/pages/ModernDashboard.jsx` | ✅ down to 2 |
| `DashboardError` retried every 8s **forever** | `client/src/pages/ModernDashboard.jsx` | ✅ capped at 3 |
| `ServerWaking` polled forever with no give-up | `client/src/pages/ServerWaking.jsx` | ✅ caps at 2min + diagnostic |
| Maintenance middleware queried DB every 5s + bogus HTML redirect | `server/middleware/maintenance.js` | ✅ 60s cache + 503 JSON |
| ConnectionStatusOverlay polled `__SERVER_WAKING__` every 1s/2s | `client/src/components/common/ConnectionStatusOverlay.jsx` | ✅ throttled to 5s |
| "Use offline mode" button just dismissed with no offline behavior | `client/src/components/common/ConnectionStatusOverlay.jsx` | ✅ relabeled honestly |
| No 5s "server is waking" feedback — silent until 45s timeout | `client/src/api/client.js` | ✅ added |
| Legacy `income`/`expenses` views + dead `get_period_balance` SQL functions | Supabase prod DB | ✅ dropped |
| Composite indexes claimed by migrations but missing in prod | Supabase prod DB | ✅ added |
| `idx_transactions_status_user_date` had wrong column order (status first) | Supabase prod DB | ✅ replaced |
| Postgres collation version mismatch warning spam | Supabase prod DB | ✅ refreshed |
| 533 lines of dead code (unused hook, unused DBQueries class + test) | client/server | ✅ stubbed for `git rm` |

---

## ⚠️ MEDIUM IMPACT — surfaced but not auto-fixed

### N+1 query patterns (9 sites)

Every one of these loops `await`s a DB call per iteration. With Render us-east → Supabase eu-north (~150ms RTT), each iteration costs at least one round-trip.

| File:Line | Loop variable | Why it matters |
|---|---|---|
| `server/controllers/transactionController.js:1244` | `templates` (bulk template create — **runs during onboarding**) | A user setting up 5 templates pays 5×N round-trips. Should batch INSERT. |
| `server/controllers/transactionController.js:1479` | active templates | Generates recurring transactions one by one |
| `server/controllers/transactionController.js:1744` | templates | Same shape |
| `server/controllers/adminController.js:328` | `userIds` (admin bulk user ops) | Admin pages slow under multi-user actions |
| `server/services/recurringService.js:192,247,296` | dates | Generates one transaction per due-date |
| `server/utils/RecurringEngine.js:141` | templates | Cron-driven, less user-facing but same shape |

**Fix pattern**: collect all rows, then run a single `INSERT INTO transactions (...) VALUES ($1,...), ($2,...), ...` or use `db.getClient()` with `BEGIN; ...; COMMIT;`.

**Estimated win on onboarding**: 5 templates × ~150ms = ~750ms cut to ~150ms.

### Oversized files (refactor candidates)

| File | Lines | Recommendation |
|---|---|---|
| `server/controllers/transactionController.js` | 1861 | Split into dashboard / templates / balance / bulk controllers |
| `server/services/emailService.js` | 1146 | Templates inline in JS — extract HTML to separate files |
| `server/controllers/userController.js` | 1141 | Split into auth / profile / preferences |
| `server/controllers/adminController.js` | 980 | Split by domain (users / settings / activity / stats) |
| `server/middleware/validate.js` | 955 | Replace per-route schemas with Zod (already in client deps) |
| `client/src/utils/authRecoveryManager.js` | 638 | Could be ~100 lines — see below |
| `client/src/stores/authStore.js` | 732 | Pull preference-sync logic into its own hook |

Splitting these is not glamorous but reduces cognitive load and makes onboarding new devs (or future-you) much easier.

### `authRecoveryManager.js` is over-engineered

638 lines for what is essentially: "if multiple consecutive 5xx, show a toast; if 401, attempt token refresh." Has duplicate state with the API client interceptor (which now does cold-start retry too). Two systems racing to handle the same failure modes is a recipe for the kind of stuck-toast bugs the file's own comments describe ("✅ FIX: Always dismiss…", "✅ FIX: Don't show…").

Recommendation: delete it. Move its few useful behaviors (the 30s health check ping, the toast dedup) into the API client interceptor where they belong.

### `useAuth` hook causes excessive re-renders

`client/src/stores/authStore.js:702-720`:

```js
export const useAuth = () => {
  const store = useAuthStore();         // ← subscribes to ENTIRE store
  return { ...store, ... };             // ← new object reference every render
};
```

Every component that calls `useAuth` re-renders on **any** auth state change (token refresh timer fires? everything re-renders), and the returned object is a fresh reference every time, breaking `useEffect` deps that include it.

Fix pattern: use Zustand's selector form per-field:
```js
export const useUser = () => useAuthStore(s => s.user);
export const useIsAuthenticated = () => useAuthStore(s => s.isAuthenticated);
// etc
```

Then update consumers to grab only what they need.

### Rate limiter is too tight for Dashboard

`server/middleware/rateLimiter.js`: `getSummaryLimiter` allows **5 requests per 10 seconds** to dashboard/summary endpoints. That's per-IP. If a user has the dashboard open in 2 tabs and both refresh, the 6th request 429s. Likely a contributing factor to "load dashboard failed."

Recommendation: 30/10s or 60/30s. Or remove this limiter — the API rate limiter (100/min) already covers abuse.

### No render.yaml committed

The Render service is configured entirely through their dashboard UI. That means env vars, build commands, region, and all settings live in a place the codebase can't audit. If the service gets recreated or migrated, those settings have to be re-typed.

Recommendation: commit a `render.yaml` to lock the config in code.

---

## 🟢 LOW IMPACT / nice to have

### Server endpoints exposed in prod with no admin gate
- `/api/v1/performance/optimization-summary`
- `/api/v1/test-query`  (per server route grep)
- Various internal stats endpoints

Recommendation: gate behind admin role or `NODE_ENV !== 'production'`.

### Unused devDependency: `pdfkit` in client
`client/package.json` has `pdfkit` and `pdfkit` is also in server. Server-side PDF generation makes sense; client-side does not (wrong runtime — Node-only library). Likely orphaned import attempt.

### `transactionAI` opt-in service ships in bundle but is never enabled
Every callsite passes `enableAI: false`. The whole module compiles into the bundle but never executes. Either start using it or delete `client/src/services/transactionAI.js` + its imports.

### Inconsistent token storage keys
Two key names exist in localStorage: `accessToken` and `authToken`. Code reads "either," writes both. Pick one and migrate.

### Session expiry is a hardcoded 24h
`authStore.js`: `sessionExpiry = Date.now() + 24h`. Should match the JWT's actual `exp` claim.

### `mcp-tools/` folder is dev-only but shipped in repo
Used for the user's local Cursor MCP setup. Not deployed. Fine to keep but worth a top-level note in README.

---

## What I think the next "out of the box" pass should focus on

You asked about UI/UX for the next round. Three ideas worth considering:

1. **Optimistic mutations**: when user adds a transaction, render it instantly in the list before the server confirms. TanStack Query supports this natively. Currently every "Add" waits for the round-trip to Supabase — feels slow on Render us-east + Supabase eu-north.

2. **A single dashboard endpoint**: server returns balance + recent + summary + categories in one response. Drops dashboard mount from 2 calls to 1 (~250ms saved). The DB-side `get_dashboard_summary` function is already 90% of this — just needs to add recent + categories.

3. **PWA install prompt**: you already have Vite PWA configured. Add an install banner so users can keep SpendWise on their phone home screen. Free perf win — once installed, the app becomes shell-cached and the cold-start UX matters less.

The **single biggest perf win available** with no code changes remains: **move Render service to an EU region** to co-locate with Supabase eu-north. See `RENDER_REGION_MIGRATION.md`.
