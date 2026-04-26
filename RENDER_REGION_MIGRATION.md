# Migrating the Render service to an EU region

## Why

Your Render service runs in **us-east** (Oregon/Ohio). Your Supabase Postgres is in **eu-north-1** (Stockholm). Every API call your client makes hits this path:

```
User's browser   ─►  Vercel (global CDN, fast)
                ─►  Render us-east     (~50-200ms from EU users)
                ─►  Supabase eu-north  (~150ms transatlantic round-trip)
                ─►  Render us-east
                ─►  back to user
```

The transatlantic Render ↔ Supabase hop costs ~150ms **every single DB query**. Your `/transactions/balance` endpoint makes 5 DB queries → ~750ms of pure network latency before any computation. The `/transactions/dashboard` endpoint makes 2 → ~300ms.

Co-locating Render with Supabase eliminates this. Same-region intra-AWS latency is ~5ms vs ~150ms transatlantic — **30× faster per query**.

Expected wins after the migration:
- `/transactions/balance`: ~750ms → ~25ms (5 queries × 5ms)
- `/transactions/dashboard`: ~300ms → ~10ms
- Warm dashboard load: drops from current 5–10s to **probably under 1s**

## What changes

Just one thing: the Render service runs in a different physical datacenter. Your code, env vars, and Vercel client are all unaffected. The service URL **stays the same**.

## How (Render free tier)

⚠️ Render's free tier doesn't allow region changes on existing services. You have to **create a new service in the new region**, then swap.

### Steps

1. **Pick the EU region** in the Render dashboard. The closest to Supabase eu-north is **Frankfurt** (`frankfurt`). Stockholm isn't a Render option.

2. **Create a new web service** with these exact settings (copy from your existing service):
   - Repository: `https://github.com/HananelSabag/SpendWise`
   - Branch: `main` (or whatever you deploy from)
   - Root Directory: `server`
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `node index.js`
   - Region: **Frankfurt**
   - Plan: Free

3. **Copy ALL environment variables** from old service → new service:
   ```
   DATABASE_URL=…
   JWT_SECRET=…
   JWT_REFRESH_SECRET=…
   APP_URL=https://<new-service-url>.onrender.com   ← UPDATE TO NEW URL
   ALLOWED_ORIGINS=https://spend-wise-kappa.vercel.app,…
   NODE_ENV=production
   GMAIL_USER=…
   GMAIL_APP_PASSWORD=…
   ```
   Note: `APP_URL` must match the **new** URL or in-process keep-alive pings the wrong host.

4. **Wait for first deploy to succeed** on the new service. Verify `/health` returns `{ status: "healthy", database: "connected" }`.

5. **Update Vercel env var** to point at the new service:
   - Vercel project → Settings → Environment Variables
   - `VITE_API_URL` → `https://<new-service-url>.onrender.com/api/v1`
   - Redeploy the Vercel client.

6. **Delete the old us-east service** in Render (or pause it to keep the URL as a safety net for a few days).

7. **Update `client/src/api/client.js`** fallback URL:
   ```js
   const rawApiUrl = import.meta.env.VITE_API_URL || 'https://<new-service-url>.onrender.com/api/v1';
   ```
   And `client/vite.config.js` `define` block — same fallback.
   And `RENDER_FREE_TIER_NOTES.md` — failure-mode cheat sheet references the URL.

### Total downtime

Zero, if you do it in this order:
- New service is live before you change Vercel
- Vercel re-deploy is instant
- DNS doesn't change
- Old service kept running until verified

### Risks

- **`APP_URL` typo** → keep-alive pings localhost again, sleep returns. Double-check.
- **Forgot to copy an env var** → new service crashes with missing-secret message. Fix and redeploy.
- **CORS** → the new service URL won't be allowed if `ALLOWED_ORIGINS` only listed the old one. Update before swapping.

### After

Watch your `/health` endpoint timings via:
```bash
curl -w "@-" -o /dev/null -s https://<new-service-url>.onrender.com/health <<'EOF'
  time_total: %{time_total}\n
EOF
```

If a warm `/health` returns in <100ms (vs the ~300-500ms you're seeing now), the migration paid off.
