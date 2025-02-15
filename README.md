
1. יש לנו משתמש אחד - Test User
2. 8 קטגוריות ברירת מחדל
3. הכנסות:
   - הכנסה חוזרת: משכורת חודשית של 15,000₪ 
   - שתי הכנסות חד פעמיות: פרילנס (2,500₪) ודיבידנד (500₪)
4. הוצאות:
   - הוצאה חוזרת: שכירות חודשית של 4,000₪
   - שלוש הוצאות חד פעמיות: קניות (200₪), אוטובוס (50₪), חשמל (100₪)

החישוב היומי עובד כמו שצריך:
- הכנסה יומית: ~483.87₪ (15,000₪/31 ימים)
- הוצאה יומית: ~329.03₪ (4,000₪/31 ימים + 200₪)
- מאזן נטו: ~154.84₪

בוא נכתוב הוראות התקנה מפורטות ל-README:

```markdown
# SpendWise - Personal Finance Tracker

## התקנת הפרויקט

### דרישות מקדימות
- Node.js (גרסה 16 ומעלה)
- PostgreSQL (גרסה 12 ומעלה)
- npm או yarn

### שלבי התקנה

1. **שכפול המאגר**
```bash
git clone https://github.com/your-username/spendwise.git
cd spendwise
```

2. **התקנת חבילות**
```bash
# התקנת חבילות צד שרת
cd server
npm install

# התקנת חבילות צד לקוח
cd ../client
npm install
```

3. **הגדרת בסיס הנתונים**
- פתח את PostgreSQL:
```bash
psql -U postgres
```

- צור בסיס נתונים חדש:
```sql
CREATE DATABASE spendwise;
```

- חבר לבסיס הנתונים:
```sql
\c spendwise
```

- הרץ את קבצי המיגרציה לפי הסדר:
```sql
\i 'path/to/server/db/migrations/init.sql'
\i 'path/to/server/db/migrations/003_all_tables.sql'
\i 'path/to/server/db/migrations/004_recurring_transactions.sql'
\i 'path/to/server/db/migrations/005_balance_calculations.sql'
```

- הכנס נתוני דוגמה (אופציונלי):
```sql
\i 'path/to/server/db/seeds/development.sql'
```

4. **הגדרת משתני סביבה**
- צור קובץ `.env` בתיקיית השרת:
```env
PORT=5000
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=spendwise
JWT_SECRET=your_secret_key
DEFAULT_TIMEZONE=Asia/Jerusalem
```

5. **הרצת הפרויקט**
```bash
# הרצת השרת
cd server
npm run dev

# הרצת הלקוח (בטרמינל נפרד)
cd client
npm run dev
```

הפרויקט יהיה זמין ב:
- לקוח: http://localhost:5173
- שרת: http://localhost:5000
```

