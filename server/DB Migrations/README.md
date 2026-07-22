# SpendWise database migrations

The numbered SQL files are the ordered history of the production PostgreSQL schema. New changes must be added as a new, idempotent migration; old migrations are historical records and must not be rewritten after deployment.

## Current model

The live schema uses a unified `transactions` ledger plus separate operational tables for bank connections/accounts, card-cycle settings, recurring merchant rules, salary signatures, cycle overrides/aggregates, authentication sessions, shopping, notifications, and retention runs.

Legacy recurring/category tables are no longer part of the application model. The old database functions `generate_recurring_transactions` and `update_future_transactions` remain intentionally because PostgreSQL still reports dependencies; do not drop them without a dependency audit and a dedicated migration.

## Applying changes

1. Inspect the live schema and Supabase advisors.
2. Add the next numbered `.sql` file with idempotent statements where practical.
3. Apply it through the migration runner or Supabase migration API, never as an untracked console edit.
4. Re-run security/performance advisors and the server test suite.

Migrations must not delete user financial data. Data cleanup scripts belong in `server/scripts` and must provide a preview/dry-run path before mutation.

## Security note

Do not enable RLS on an existing table without first defining the intended access policies. Enabling RLS alone can block all client access; policy changes require a dedicated reviewed migration.
