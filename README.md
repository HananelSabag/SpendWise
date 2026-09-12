# SpendWise

**A personal finance app for Israeli bank and card accounts.**

Transactions arrive on their own from the banks and credit-card issuers, the
month runs salary to salary rather than 1st to 31st, and the card bill is not
counted twice. Hebrew and English, RTL throughout, installable as a PWA.

| Name | GitHub | Role |
|------|--------|------|
| **Hananel Sabag** | [@HananelSabag](https://github.com/HananelSabag) | Lead developer |
| **Yuda Sabag** | yudasabag@gmail.com | Collaborator — bank-scraper integration |

> **Portfolio project.** Clone it, read it, learn from it. Please don't deploy it
> as your own or use it commercially. Production secrets are not in this repo.

---

## What it actually does

### Bank sync, without handing anyone your credentials

Israeli banks have no consumer API, so the data has to be scraped from a real
browser session. That means bank credentials exist somewhere — and the design
question is where.

Here, not on the server. The browser seals them with **X25519** against the
agent's public key, so the server stores ciphertext it has no key for. A local
agent — [spendwise-agent](https://github.com/HananelSabag/spendwise-agent), a
.NET 8 desktop app on your own machine — is the only holder of the private key.
It claims a job, decrypts in memory, scrapes, and posts results back.

```
Browser (seals, X25519)  ──►  bank_connections (ciphertext only)
                              bank_sync_jobs   (queue)
                                     │
                              local agent decrypts in RAM, scrapes,
                              POSTs transactions back
```

Supported: Yahav, Leumi, Discount, Isracard, Max.

**A detail worth knowing:** the scheduler does not run on a timer. Render's free
tier sleeps a dyno, and a sleeping dyno runs no cron — so scheduling is driven
by the agent's own poll. The agent asking for work *is* the tick. That is why
syncs still happen on a plan that has no always-on process.

### A month that matches your life

Most finance apps bill you a calendar month. Salaries do not arrive on the 1st,
so `cycleEngine.js` (~2,000 lines, the largest single file here) computes a
salary-to-salary cycle instead, and reconciles:

- **Credit-card bills against their own charges**, so a ₪4,000 card statement and
  the ₪4,000 of purchases behind it are one event, not two.
- **Recurring patterns** per bank and account, with each monthly date keeping its
  own amount history — a pattern that charges on the 5th and the 20th is two
  series, not one average.
- **Pending authorizations** separately from confirmed amounts, so a hold at a
  petrol station does not rewrite a confirmed recurring charge.

### The rest

- **Family Hub** — a shared monthly plan, kept deliberately apart from bank data
  and cycle accounting. Manual by design: it is what a household agreed to, not
  what the bank observed.
- **Admin** — users, activity and system settings, behind a role check.
- **Export** — CSV, JSON and PDF.
- **Offline** — the client hydrates from a persisted TanStack Query cache, so a
  sleeping free-tier dyno shows last-known data instead of a spinner.

---

## Architecture

A classic three-tier deployment, with a fourth piece that is unusual: a desktop
agent on the user's own machine, because that is the only place bank credentials
may be decrypted.

```
  React + Vite (Vercel)
        │  JWT
  Express (Render, free tier)          ← 90 endpoints across 14 route groups
        │  pg
  Postgres (Supabase, eu-north-1)      ← 27 tables, 46 numbered migrations
        ▲
        │  X-Agent-Key, claims jobs
  spendwise-agent (.NET 8, the user's PC)
```

| | |
|---|---|
| Client | React 18, Vite, Tailwind, Zustand, TanStack Query — 409 files, ~52k lines |
| Server | Express, raw SQL over `pg` — 127 files, ~26k lines |
| Tests | 39 client suites (Vitest), 47 server suites (Jest) |
| Auth | JWT issued by the server; Google OAuth handled in the client |

### Layering, honestly

The server has `routes/ → controllers/ → services/ → models/`, and most requests
follow it. But the boundary is a convention rather than something enforced:
`config/db` is a module any file can require, and a good share of the SQL lives
outside `models/`.

Worth knowing before assuming the model layer is the data-access layer. Closing
that gap means a `repositories/` layer and an ESLint rule restricting who may
import `db` — not a rewrite, but not done yet either.

### There is no ORM

248 hand-written SQL queries, by choice. It costs boilerplate and buys exact
control over what runs — which matters when the free tier gives you one small
instance and a cold start.

### RLS is not the gate here

Row Level Security is enabled on most tables but carries few policies, and the
server connects as the table owner, so it bypasses RLS regardless. **The real
gate is the JWT and the middleware chain** — `auth`, `validate`, `security`,
`rateLimiter`, `requestId`, `maintenance`. Read it that way rather than assuming
the database is enforcing per-user isolation.

---

## Project layout

```
client/src/
  api/            one module per resource, all through a shared error contract
  components/     common · features · layout · routing · ui
  hooks/          data access and app behaviour
  stores/         auth, app, translation  (zustand)
  translations/   he / en, per feature module
server/
  routes/         14 groups, 90 endpoints
  controllers/    request handling
  services/       the real work — cycleEngine, bank sync, classification
  models/         SQL for the core entities
  middleware/     auth, validation, security, rate limiting, logging
  DB Migrations/  46 numbered files, applied in order
```

## Running it

```bash
npm install --prefix client && npm install --prefix server

cp server/.env.example server/.env     # DATABASE_URL, JWT_SECRET, …
cp client/.env.example client/.env     # VITE_API_URL, VITE_GOOGLE_CLIENT_ID

npm run dev --prefix server            # :5000
npm run dev --prefix client            # :5173
```

Testing: `npm test --prefix client` · `npm test --prefix server`
Mobile on your LAN: `npm run dev:mobile --prefix client`

CI runs lint and both suites on every push (`.github/workflows`).

---

## History

The **shared grocery list** used to live here, as a second app inside this one —
its own routes, its own bottom navigation, its own first-run picker asking which
of the two you wanted to open.

It moved out in September 2026 to [grocery](https://github.com/HananelSabag/grocery),
where it has no server at all: the browser talks to Supabase directly and Row
Level Security carries the authorization.

The number that settled it: the bridge between the two — turning a finished shop
into a SpendWise expense — had been built, shipped, and used **zero times**
across every shopping trip ever completed. Two apps that shared a login, and
nothing else.

## Contact

hananel12345@gmail.com
