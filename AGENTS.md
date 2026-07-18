# AGENTS.md — SpendWise canonical context primer

> READ-FIRST for any AI agent (Claude, GPT/Codex, Cursor…). This is the token-cheap map of the
> project. Read this fully, then jump straight to the cited files instead of re-exploring. Dense on
> purpose. Keep it updated when the model/architecture changes (not for every small commit).
> Last synced to live DB + code: 2026-07-16. Owner: Hananel (super_admin, user id=1).

---

## 0. WHAT THIS IS
Personal-finance web app for Israeli users. A local desktop worker scrapes Israeli banks/credit-card
companies and pushes transactions to a server; the web app shows balances, calendar-month cash-flow,
and insights. ILS-only. Bilingual EN/HE (RTL). Two git repos:

- `C:\CodingProjects\SpendWise`  → this repo: `client/` (React web) + `server/` (Node/Express API) + `cloudflare-worker/` (scraper proxy). GitHub `HananelSabag/SpendWise`, trunk-based on `main`.
- `C:\CodingProjects\spendwise-agent` → separate repo: the scraper worker. See its own `AGENTS.md`.

## 1. STACK + DEPLOY
- **client**: React + Vite, Zustand (`stores/`), TanStack Query (`config/queryClient.js`), framer-motion, Tailwind. i18n EN+HE. → **Vercel**, auto-deploys on push to `main`.
- **server**: Node/Express. Talks to Postgres via **direct `pg` Pool as the table owner** (`config/db.js`) → **RLS does NOT gate the server**. Also `@supabase/supabase-js` for Storage only. Auth = JWT + Google OAuth (`google-auth-library`). Email via nodemailer/resend. → **Render** free tier (dyno SLEEPS when idle; `utils/keepAlive.js` pings). Deploys on push to `main`.
- **db**: Supabase Postgres. **project_id = `obsycususrdabscpuhmt`**. Use Supabase MCP tools for live inspection/migrations.
- **agent**: Node ESM, `israeli-bank-scrapers@6.7.8` (patched via patch-package), puppeteer, tweetnacl. Runs as a C# WinForms desktop worker that spawns `node src/agent.js` from disk.
- **proxy**: `cloudflare-worker/worker.js` optional scraper egress proxy (header `X-Proxy-Key` ↔ server `SCRAPER_PROXY_KEY` / CF `PROXY_KEY`).

## 2. RUN / BUILD / TEST  (Windows; PowerShell primary, Bash tool available)
- server: `cd server && npm run dev` (nodemon) | prod `npm start`. Tests = jest — **jest is NOT installed in the agent/CI sandbox**; verify with `node --check <file>` instead.
- client: `cd client && npm run dev` (vite) | build `npm run build` | tests `npm test` (vitest, ~72 passing).
- agent: `cd ../spendwise-agent && npm run agent` | `npm run standalone` | keygen `npm run keys`.
- Cannot drive the authenticated UI headless (Google login) → verify UI via build + vitest + screenshots from Hananel.

## 3. DOMAIN MODEL  (⚠ current model — supersedes older "billing_cycle_day" notes)
- **Bank account ≠ credit-card company.** Source of truth = `server/config/institutions.js` (14 sources; `kind` = `bank` | `credit_card`). Banks: yahav, hapoalim, leumi, mizrahi, discount, mercantile, otsar_hahayal, beinleumi, massad, pagi. Cards: isracard, amex, visa_cal, max. **A credit_card NEVER has a balance** — only charges (enforced at ingest, dashboard, hero). Client + agent keep mirror registries.
- **CALENDAR-MONTH accounting** (migrations 21/22): the old per-user `billing_cycle_day` field was **DROPPED** (mig 22). Attribution to an "economic month" now uses `salary_signatures` + `transaction_month_overrides`, computed in `services/monthlyAccountingService.js` / `calendarMonthSummaryService.js` (period helpers in `utils/calendarPeriod.js`, availability in `utils/calendarPeriodAvailability.js`).
- **Headline period totals = BANK cash-flow + manual**: `source_kind <> 'credit_card'`. The monthly card bill is one bank outflow (counted once); itemized card purchases are breakdown/detail only, never added on top. Real reference numbers (Hananel, user 1): income 13,328 / expenses 14,064 / net −736 for a clean cycle.
- **`ledger_class`** (txn col, mig 23) = derived economic class (`services/financialClassificationService.js`); nullable until trustworthy. Loan disbursements + own securities/investment transfers must NOT count as income (classification handles this).
- **Salary identity**: `salary_signatures` (user-confirmed) has `month_offset` (−2..0) → salary paid early/late is attributed to the correct work month. `services/salaryReviewService.js` proposes/reviews.
- **Card reconciliation**: a bank "settlement" row links to its card via `settlement_card_source` / `settlement_card_account` (`services/cardReconciliationService.js`, `monthlyAccountingService.js`). Brand matching is by **account last-digits + amount/date**, NOT Hebrew brand text (brand text is ambiguous: "לאומי ויזה" = a Max card; "כרטיסי אשראי" = Cal).
- **Pending FX** (mig 25): foreign pending card auths carry a temporary ILS estimate — `amount_is_estimated`, `fx_rate_used/source/as_of`, plus `original_amount/original_currency/charged_currency`. `services/bankPendingDedupService.js` handles pending→settled dedup.
- **Installments** (mig 23): `txn_kind`, `installment_number`, `installment_total`.
- **Soft delete**: bank rows delete as **tombstones** (`transactions.deleted_at`); dedup includes tombstones so nothing resurrects. Manual rows hard-delete. Unique key: partial `(user_id, bank_sync_id)`.
- **Merchant watch** (`merchant_watch_rules`, mig 24; `services/merchantWatchService.js`): user rules to flag/notify on merchant + amount condition (all/above/exact).

## 4. DATABASE MAP  (Supabase `obsycususrdabscpuhmt`, schema `public`; server = owner so RLS bypassed)
Notation: `table(rows@2026-07-16): key columns [notes]`. FKs mostly → `users.id`.
- `users(4): id, email, username, password_hash?(null=Google-only), role(user|admin|super_admin), google_id, oauth_*, language_preference(en|he), theme_preference, currency_preference(ILS), timezone_preference, onboarding_completed, first/last_name, avatar…` — id1=Hananel(super_admin), id34=Yehuda(user, **never delete his Yahav data**), id41=verification bot, id44=נופר.
- `transactions(879): id, user_id, amount, type(income|expense), description, notes, date, transaction_datetime(tz, source of truth for day in Asia/Jerusalem), deleted_at(tombstone), bank_sync_id, bank_source, bank_account_number, raw_category, bank_processed_date, bank_status(pending|completed), original_amount/original_currency/charged_currency, txn_kind, installment_number/total, ledger_class, settlement_card_source/account, amount_is_estimated, fx_rate_used/source/as_of` — the central table.
- `bank_connections(6): id, user_id, bank_source(CHECK ∈ 14 sources), encrypted_credentials, display_name, status(active|paused|error), consecutive_failures, last_sync_at, last_error` — UNIQUE(user_id, bank_source). Encrypted creds, never decrypt/exfiltrate.
- `bank_accounts(13): PK(user_id, bank_source, account_number), account_type, balance, enabled, last_synced_at` — per-account balances (banks only).
- `bank_sync_jobs(75): id, connection_id, user_id, status(pending|running|done|failed), trigger(schedule|manual), requested_at, started/finished_at, result(jsonb), claimed_by` — the job queue (see §Scheduling).
- `agent_devices(1): id, user_id, public_key, device_token_hash, status(active|revoked)` — one active device/user (partial unique idx). `agent_pairing_codes(0): code PK, user_id, expires_at` — short-lived pairing.
- `salary_signatures(1): id, user_id, bank_source, bank_account_number?, normalized_description, display_description, month_offset(-2..0), active` — active partial-unique per (user,source,acct,desc).
- `transaction_month_overrides(0): PK transaction_id, user_id, economic_month(day=1), classification(salary|bonus|financing|transfer|card_settlement|other), created_by(user|system_review)` — auditable month-attribution exceptions; never mutates ledger dates.
- `credit_classifications(0): PK/FK transaction_id, user_id, class(income|financing), reason, created/updated_at` — persisted answers for ambiguous credits; keyed by our transaction id so provider identifiers cannot leak a decision across unrelated rows. RLS enabled; server API only.
- `merchant_watch_rules(1): id, user_id, display/normalized_merchant, condition(all|above|exact), amount?, active` — **RLS DISABLED** (see §8 security note).
- `shopping_items(7)`, `shopping_shares(1)`, `shopping_invitations(2)` — shared shopping/wishlist feature (owner↔member sharing).
- `notifications(6): id, user_id, type, title, body, data(jsonb), is_read`.
- `admin_activity_log(23)`, `system_settings(10: key/value jsonb)`, `system_logs(0)`, `user_restrictions(0)`, `password_reset_tokens(0)`, `email_verification_tokens(0)`.
- `data_retention_settings(1, single row id=1)` + `data_retention_runs(7)` — conservative auto-cleanup of operational data (see fn `run_data_retention`).
- **DB functions** (public): `run_data_retention(dry)`, `preview_data_retention`, `run_maintenance`, `database_health_check`, `cleanup_expired_tokens`, admin RPCs (`get_admin_users_overview`, `get_admin_activity_log(_v2)`, `admin_manage_settings`), `get_dashboard_summary` / `get_monthly_summary` (partly legacy — aggregation now in JS `services/dashboardService.js`), plus orphans from dropped features (`generate_recurring_transactions`, `update_future_transactions` — reference dead category/recurring tables; leave alone, trigger deps).
- **Triggers**: only `shopping_items` BEFORE UPDATE → `update_shopping_items_updated_at`.
- **Migrations**: `server/DB Migrations/01..26_*.sql` (26 = persisted credit classifications; 25 = pending FX; 24 = merchant rules; 23 = txn financial metadata; 21 = calendar-month accounting; 22 = remove billing_cycle_day; 16 = expand to 14 sources). Apply new ones via Supabase MCP `apply_migration`.

## 5. SERVER CODE MAP  (`server/`)
- entry `index.js`; DB pool `config/db.js` (idleTimeout 15min + pre-warm — fixes Supabase TLS-handshake slow-query); `config/institutions.js` (bank/card registry).
- **routes/**: `transactionRoutes, bankConnectionsRoutes, bankSyncRoutes, bankAgentRoutes(/bank-agent/* — agent job claim/complete), agentPairingRoutes, authStatusRoutes, userRoutes, adminRoutes, shoppingRoutes, notificationRoutes, exportRoutes, healthRoutes, onboarding`.
- **controllers/**: `transactionController`(slim, ~385L — aggregation moved to services), `notificationController`, `shoppingController`, `shoppingShareController`, `exportController`, `auth/`, `admin/`.
- **services/** (business logic lives here): `bankSyncService`(ingest: dedup, tombstones, kind-gates balance), `syncSchedulingService`(enqueue-on-claim), `dashboardService`(dashboard aggregation), `monthlyAccountingService` + `calendarMonthSummaryService` + `calendarActivityService`(calendar-month rollups), `financialClassificationService`(ledger_class), `salaryReviewService`(salary signatures), `cardReconciliationService`(bank↔card settlement match), `bankPendingDedupService`(pending→settled), `merchantWatchService`, `cycleRunwayService`(projection/runway), `dashboardClassifierWidgetsService`, `accountScopeService` + `agentClaimScope`(scoping), `exchangeRateService`, `exportDataService`, `emailService`, `supabaseStorage`, `authStatusService`.
- **models/**: `Transaction, User, UserCache, ShoppingItem, ShoppingShare` (thin data-access).
- **middleware/**: `auth`(strict — logout/optional handled globally; refresh no longer falls back to JWT_SECRET), `rateLimiter`, `security`, `validate`, `errorHandler`, `maintenance`, `requestId`, `routeLogger`, `upload`.
- **utils/**: `calendarPeriod`, `calendarPeriodAvailability`, `scheduler`(node-cron — mostly inert on sleeping dyno), `keepAlive`, `logger`(winston), `errorCodes`, `tokenGenerator`, `userNormalizer`, `urlScraper`.
- **scripts/** (one-off ops, run with node): `apply-sql-file`, `audit-financial-cycle`, `audit-sync-data`, `preview-financial-classification`, `preview-pending-settled-dedup`, `reset-synced-user-data`, `retire-pending-settled-duplicate`, `set-salary-signature`.

## 6. CLIENT CODE MAP  (`client/src/`)
- entry `main.jsx` / `App.jsx`; API layer `api/` (`client.js` axios core + per-domain: `transactions, bankConnections, agentPairing, auth, authStatus, admin, notifications, shopping, onboarding`).
- **stores/** (Zustand): `authStore`(prefer selectors `useUser`/`useIsAuthenticated`/`useAuthActions`/`useIsAdmin`, not raw `useAuth`), `appStore`(theme/lang/exchange, persist pins ILS), `translationStore`.
- **pages/**: `ModernDashboard`, `ModernTransactions`, `InsightsPage`(retro center), `BankSyncPageV2`, `Profile`, `ShoppingWishlistPage`, `QuickExpensePage`, `admin/`, `auth/`, plus `Blocked/Maintenance/ServerWaking/NotFound`.
- **components/features/**: `dashboard, transactions, bankSync, insights, admin, profile, onboarding, help, exchange, shopping, auth`. Shared UI in `components/ui/` (incl. `LiquidTabs.jsx` — the animated segmented tabs used app-wide; `fill` mode = no horizontal scroll for user pages, scroll allowed for Admin).
- **hooks/**: `useDashboard, useTransactions, useTransactionActions, useFinancialCycle, useFinancialPeriodSelection, useFinancialDataSync, useCalendarMonthSummary, useCalendarMonthDetails, useBankSyncMonitor, useNotifications(=useAppNotifications), useShoppingItems, useShoppingShare, useExport, useOnboarding*, useIsMobile, useToast…`.
- **translations/** `en/` + `he/`: EVERY user-facing string needs both. HE missing keys fall back to EN → looks untranslated. RTL: use logical props (start/end).

## 7. THE AGENT + SYNC SCHEDULING  (see `spendwise-agent/AGENTS.md` for internals)
- **Scheduling = "enqueue-on-claim"**: the agent polls `POST /bank-agent/jobs/claim` (~every 30 min); that poll IS the scheduler tick — `services/syncSchedulingService.js` enqueues due jobs (07:00/18:00 Asia/Jerusalem) at claim time. In-process node-cron never fires on the sleeping Render dyno. Verified in prod (trigger='schedule' jobs complete).
- **Manual "sync now" limits** (`routes/bankConnectionsRoutes.js`): 2/day + 3h gap **per connection**; **admins (Hananel) are exempt**. Agent has its own cooldown gate too (bypassed when RAW-debug on).
- Agent stores creds encrypted (tweetnacl sealed), pairs via `agent_devices`/`agent_pairing_codes`. `bank_processed_date` = provider `processedDate` verbatim.

## 8. CONVENTIONS + GOTCHAS  (read before editing)
- **ILS only** — currency picker removed; don't reintroduce multi-currency UI.
- **i18n**: add EN+HE together, always. **RTL** logical props.
- **`.gitignore` blanket-ignores `**/*.md`** with a whitelist — this `AGENTS.md`, `README.md`, and a few audit docs are explicitly un-ignored. New scratch `.md` files won't be tracked unless whitelisted. `ROADMAP.md` and `CLAUDE_*.md` are force-added.
- **RLS is off on `public.merchant_watch_rules`** (Supabase advisory, critical). It does NOT expose the server (server connects as owner, not via anon key), and no client uses the anon key directly — but if the Supabase anon key is ever used client-side, this table is world-read/write. Remediation (do NOT auto-apply; needs policies first): `ALTER TABLE public.merchant_watch_rules ENABLE ROW LEVEL SECURITY;` + add per-user policies.
- **Verify without jest**: `node --check` server files + `cd client && npm run build` + `npm test` (vitest).
- **Timezone**: derive `date` from `transaction_datetime` in **Asia/Jerusalem** (a UTC truncation bug once shifted salary a day early). ingest stamps Asia/Jerusalem.
- **Password policy**: registration ≥8 chars + letter + number; login untouched.
- **Global singletons**: ONE `AddTransactionModal` (FAB dispatches `transaction:add`); help via `open-help` event; onboarding via `open-onboarding` (auto first-login only).
- **Don't re-chase these as dead** (audited alive): notifications, ExchangeCalculator, scheduler, UserCache, tokenGenerator, security middleware, admin cachedRequest. Legacy `income`/`expenses`/`categories`/`recurring_templates` tables already dropped — don't reference them.

## 9. DEEPER DOCS  (open only when the task needs them)
- **`FINANCIAL_CYCLE_SPEC.md`** — THE normalized cycle-engine spec (processedDate model, card classification, bank↔card reconciliation, salary-anchored financial cycle, 3 links, projection). **Validated to the agora against real bank data (fixture in §7).** Read before touching any cycle/accounting/reconciliation code. This supersedes scattered logic in the older handoff docs.
- `ROADMAP.md` — master plan: cash-flow model, phase roadmap (TZ → raw-scrape validation → salary/income classification → loans → merchant rules → previous-cycle+projection), deferred UI polish. **Keep updated.**
- `CLAUDE_RECONCILIATION_AUDIT.md` — forensic bank/card reconciliation, proven defects, schema/matching rules.
- `MONTHLY_ACCOUNTING_SPEC.md`, `CLAUDE_MONTHLY_INTEGRATION_HANDOFF.md`, `CLAUDE_CLASSIFICATION_HANDOFF.md` — calendar-month + classification design.
- `RENDER_FREE_TIER_NOTES.md`, `RENDER_REGION_MIGRATION.md` — hosting ops. `CODE_AUDIT_FINDINGS.md` / `DEAD_CODE_TO_DELETE.md` — mostly STALE (already fixed), don't act blindly.
- Claude's private cross-session memory: `C:\Users\hanan\.claude\projects\C--CodingProjects\memory\project_spendwise.md` (chronological session log) — richer history; this AGENTS.md is the distilled current state.

## 9b. 2026-07-18 cycle performance + retention update
- `cycleService` now bounds raw loading to two years plus context, prepares card/reconciliation/loan facts once per request, builds only one window for `/cycles/current`, and keeps exact results in a 15-second server cache.
- The live dashboard shell now loads only the recent rows it renders. Balance and current-cycle data keep dedicated user-scoped React Query entries and are prefetched together immediately after login.
- Migration 28 adds `financial_cycle_aggregates`, cycle query indexes, and a disabled-by-default retention gate. It is additive and must be applied before aggregate persistence is available.
- `/cycles/yearly/:year` powers the yearly review. Closed complete cycles are stored durably; current-year data can fall back to live raw calculations.
- Old unused calendar/runway dashboard components, hooks, routes, and services were removed. Do not recreate them; the salary-cycle engine is the financial source of truth.

## 10. ACTIVE WORK / KNOWN OPEN  (as of 2026-07-16; verify against git/ROADMAP before assuming)
- Financial-model phases in progress: salary-identity + income classification (loan/securities exclusion), card reconciliation accuracy, projection/runway for the running cycle, previous-cycle row (blocked on longer backfill + income classification).
- UI polish queued: per-tab content polish (profile + bank-sync bodies), dashboard mobile pass, onboarding visual redesign (only overflow bug fixed), real bank/card logos (trademark caveat).
- Yahav balance patch (`spendwise-agent/patches/…`): offline-verified; **STRICT budget — max 2 live runs with Yehuda's creds, 0 used; the live run is Hananel's to execute; never delete Yehuda's data.**
- Loans = deferred separate project (scrapers return no loan metadata; surfaces only as recurring payment txns).
