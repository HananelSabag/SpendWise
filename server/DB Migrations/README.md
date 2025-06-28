# SpendWise – Database Migrations

> **One-stop, three-file setup** ⏱️  
> All the DDL, logic, seed data and safety checks you need to spin up a fully-functional SpendWise database—locally **or** on Supabase.

---

## 📂 Files in this folder

| Order | File | Purpose |
|-------|------|---------|
| 1 | **`01_schema_and_core.sql`** | Creates every table, index and essential view. |
| 2 | **`02_functions_and_logic.sql`** | Adds all PL/pgSQL functions, triggers, and core business logic. |
| 3 | **`03_seed_data_and_final.sql`** | Seeds the 18 default categories (9 HE / 9 EN), sets up generic triggers, runs a health-check, and writes version metadata. |

> ⚠️ The former incremental migrations (`001_add_user_id_to_categories.sql`, `002_balanced_categories_he_en.sql`) have been merged into the three files above. They're no longer required when setting up a fresh database.

---

## 🚀 How to apply

### On Supabase
```sql
-- Open SQL Editor and run in this exact order:
\i 01_schema_and_core.sql
\i 02_functions_and_logic.sql
\i 03_seed_data_and_final.sql
```

### On local PostgreSQL
```bash
psql -d spendwise -f 01_schema_and_core.sql
psql -d spendwise -f 02_functions_and_logic.sql
psql -d spendwise -f 03_seed_data_and_final.sql
```

The scripts are idempotent—running them twice won't break anything. They include `DROP ... IF EXISTS`/`CREATE OR REPLACE` as appropriate.

---

## ✅ Post-migration checklist
After the three files finish successfully:

```sql
-- 1. Holistic health-check
SELECT * FROM database_health_check();

-- 2. Key dashboard function
SELECT get_period_balance(1, DATE '2024-01-01', DATE '2024-12-31');

-- 3. Default categories loaded?
SELECT COUNT(*)
FROM   categories
WHERE  is_default = true;  -- Expect **18**
```

If all three queries return sensible results, the DB is ready for production / dashboard use.

---

## 📊 What's inside?

- **7 Tables** – users, categories, expenses, income, recurring_templates, password_reset_tokens, email_verification_tokens
- **2 Views** – `daily_balances`, `monthly_summary`
- **6+ Functions** – including the dashboard-critical `get_period_balance`
- **18 Default Categories** – balanced Hebrew/English set; safe foreign-keys (`ON DELETE SET NULL`)
- **Performance** – carefully chosen indexes
- **Security** – functions created with `SECURITY DEFINER` where needed

---

### Versioning
Current schema version: **3.0**  
A `_database_version` table is populated automatically, so you can track deployments programmatically.

---

Crafted with ❤️ for SpendWise – because clean finances deserve a clean database. 