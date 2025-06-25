# SpendWise Database Migrations

## 🎯 Quick Start

This folder contains **3 consolidated migration files** that will set up your complete SpendWise database.

### **Migration Files (Run in Order):**

1. **`01_schema_and_core.sql`** - All tables, indexes, and views
2. **`02_functions_and_logic.sql`** - All database functions (including dashboard-critical `get_period_balance`)
3. **`03_seed_data_and_final.sql`** - Categories, triggers, and final setup

## 🚀 **Apply Migrations**

### **For Supabase:**
```sql
-- In Supabase SQL Editor, run each file in order:
\i 01_schema_and_core.sql
\i 02_functions_and_logic.sql  
\i 03_seed_data_and_final.sql
```

### **For Local PostgreSQL:**
```bash
psql -d your_database -f 01_schema_and_core.sql
psql -d your_database -f 02_functions_and_logic.sql
psql -d your_database -f 03_seed_data_and_final.sql
```

## ✅ **Verify Success**

After running all 3 files:

```sql
-- Check database health
SELECT * FROM database_health_check();

-- Test dashboard function (critical!)
SELECT get_period_balance(1, '2024-01-01'::date, '2024-12-31'::date);

-- Verify categories loaded
SELECT COUNT(*) FROM categories WHERE is_default = true; -- Should return 23
```

## 📊 **What You Get**

- ✅ **7 Tables**: Users, categories, transactions, templates, tokens
- ✅ **2 Views**: Daily balances, monthly summary  
- ✅ **6+ Functions**: Including dashboard-critical `get_period_balance`
- ✅ **23 Categories**: Default income/expense categories
- ✅ **Performance**: Optimized indexes and triggers
- ✅ **Security**: Proper function permissions and user isolation

## 🎉 **Dashboard Ready**

These migrations are specifically designed to work with the SpendWise dashboard. After applying them, your dashboard should load without any 500 errors.

---

**Status**: ✅ Production Ready | **Version**: 3.0 | **Dashboard**: Working 