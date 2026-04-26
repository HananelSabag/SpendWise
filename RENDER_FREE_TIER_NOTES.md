# Render Free Tier — operating notes for SpendWise

**Why this doc exists:** SpendWise runs the API on Render's free tier. The free
tier has hard, non-obvious constraints that the application code must respect
or it visibly breaks. These notes capture what those constraints are and how
the app is designed around them.

## The numbers (Render Free, as of 2026)

| Resource             | Limit                                                 |
| -------------------- | ----------------------------------------------------- |
| RAM                  | **512 MB** per instance                               |
| CPU                  | **0.1 vCPU** (one tenth of a core)                    |
| Idle sleep trigger   | **15 minutes** of no inbound traffic                  |
| Cold-start wake time | **~30–60 seconds**                                    |
| Service hours        | **750 / month** (enough for one always-on service)    |
| Build minutes        | **500 / month**                                       |
| Bandwidth            | **100 GB / month**                                    |
| Persistent disk      | **None** — `server/uploads/` is wiped on every deploy |
| Postgres on Render   | Deleted after 30 days (we use Supabase, so N/A)       |

Sources:
- [Render Pricing](https://render.com/pricing)
- [Deploy for Free — Render Docs](https://render.com/docs/free)
- [Render free-tier guide (community)](https://dashdashhard.com/posts/ultimate-guide-to-renders-free-tier/)

## Implications for SpendWise

### 1. Sleep / cold start (the big one)
After 15 min of zero traffic, the container is unloaded. Next request waits
30–60s for it to spin back up. We mitigate three ways:

- **In-process self-ping** in `server/utils/keepAlive.js` runs every 10 minutes
  via `node-cron` and hits `${APP_URL}/health`. **Requires `APP_URL` env var
  set on Render** to the public service URL (e.g. `https://spendwise-dx8g.onrender.com`).
  Without `APP_URL` the ping just hits `localhost:5001` and does nothing.
- **Client-side cold-start retry** in `client/src/api/client.js` transparently
  retries the failing request once before redirecting to `/server-waking`.
- **`/server-waking` page** polls `/health` for up to 2 min, then surfaces a
  real error (instead of looping forever).

⚠️ **External cron is more reliable than in-process cron.** If keep-alive ever
fails (e.g. APP_URL drift, in-process scheduler skipped during a slow boot),
the service goes back to sleeping. For real uptime, set up a free
cron-job.org / UptimeRobot job hitting `/health` every 10–14 minutes.

### 2. 0.1 vCPU is anemic
Heavy synchronous work blocks all requests. In particular:
- The `select` in `useDashboard.js` runs on every render — keep it cheap.
- Avoid sync JSON parsing of large payloads in middlewares.
- The `recurringService` shouldn't run massive backfills inside a request.

### 3. 512 MB RAM ceiling
Pool sizes and in-memory caches must stay small:
- DB pool `max: 15` in `server/config/db.js` — do **not** raise this.
- `DashboardCache.maxSize = 500` in `server/utils/dbQueries.js` — fine.
- Client API cache `defaultTTL = 5 min` in `client/src/api/client.js` — fine.

### 4. Server must NOT exit on transient failures
If `process.exit(1)` runs, Render restarts the container — which costs another
30–60s of cold-start downtime for users. This is why `server/index.js` was
hardened to:
- start the HTTP server **before** the DB is verified;
- retry the DB connection in the background forever (capped exponential backoff);
- never exit on `uncaughtException` / `unhandledRejection`.

The most common cause of an apparent "infinite restart loop" is the **Supabase
free-tier project pausing after 7 days idle** — the symptom is
`(ENOTFOUND) tenant/user postgres.<projectref> not found` from the pooler.
Fix: open the Supabase dashboard and click **Restore**.

### 5. No persistent disk
`server/uploads/` is wiped on every deploy and after every cold start. For
real avatars/profile images, push uploads to Supabase Storage (the
`supabaseStorage.js` service is already wired for this — make sure the upload
controllers actually use it, not local disk).

## Required Render environment variables

Set in **Render dashboard → service → Environment**:

| Name                  | Required | Notes                                                       |
| --------------------- | -------- | ----------------------------------------------------------- |
| `DATABASE_URL`        | yes      | Supabase pooler URL (port 6543 = transaction mode)          |
| `JWT_SECRET`          | yes      | Server refuses to boot without it                           |
| `JWT_REFRESH_SECRET`  | yes      | Server refuses to boot without it                           |
| `APP_URL`             | yes      | `https://spendwise-dx8g.onrender.com` — keep-alive needs it |
| `ALLOWED_ORIGINS`     | yes      | Must contain the Vercel client URL                          |
| `NODE_ENV`            | yes      | `production`                                                |
| `GMAIL_USER` / pwd    | optional | Email verification / password resets                        |
| `ENABLE_SCHEDULER`    | optional | Set to `false` to disable cron jobs in dev                  |

## Failure-mode cheat sheet

| Symptom                                      | Most likely cause                                                                       |
| -------------------------------------------- | --------------------------------------------------------------------------------------- |
| Site loads UI shell, never finishes loading  | Server sleeping (cold start) — wait ~60s, or check `/health`                            |
| `tenant/user postgres.xxx not found`         | **Supabase project paused** — restore in Supabase dashboard                             |
| Render logs show server starting then exit   | Old behavior; should not happen anymore after the index.js stability rewrite            |
| Keep-alive logs say "ping failed"            | `APP_URL` env var not set / wrong / pointing at the wrong region                        |
| CORS blocked from Vercel                     | `ALLOWED_ORIGINS` missing the Vercel URL                                                |
| User can log in but nothing loads after      | Token refresh recursion (now fixed) or DB reachable from server but slow (>45s timeout) |
| `/maintenance` returns 404 on the API host   | Old behavior; middleware now returns 503 JSON, client routes itself to /maintenance     |
