import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor

class FinanceAnalyzer:
    def __init__(self, db_config):
        self.conn = psycopg2.connect(**db_config)

    def get_daily_balance(self, user_id, date=None):
        if not date:
            date = datetime.now().date()
        
        query = """
            SELECT 
                COALESCE(SUM(amount), 0) as daily_income
            FROM income 
            WHERE user_id = %s AND date = %s
            UNION ALL
            SELECT 
                COALESCE(SUM(amount), 0) as daily_expenses
            FROM expenses 
            WHERE user_id = %s AND date = %s
        """
        
        with self.conn.cursor() as cur:
            cur.execute(query, (user_id, date, user_id, date))
            income, expenses = cur.fetchall()
            return income[0] - expenses[0]

    def get_monthly_analysis(self, user_id, month=None, year=None):
        if not month or not year:
            today = datetime.now()
            month = today.month
            year = today.year

        query = """
            WITH monthly_data AS (
                SELECT 
                    date,
                    COALESCE(SUM(e.amount), 0) as daily_expense,
                    c.name as category
                FROM expenses e
                JOIN categories c ON e.category_id = c.id
                WHERE user_id = %s 
                AND EXTRACT(MONTH FROM date) = %s
                AND EXTRACT(YEAR FROM date) = %s
                GROUP BY date, c.name
            )
            SELECT 
                category,
                SUM(daily_expense) as total_amount,
                COUNT(DISTINCT date) as active_days,
                AVG(daily_expense) as avg_daily_expense
            FROM monthly_data
            GROUP BY category
        """
        
        df = pd.read_sql(query, self.conn, params=(user_id, month, year))
        return df

    def predict_monthly_expenses(self, user_id):
        query = """
            SELECT date, amount, category_id
            FROM expenses
            WHERE user_id = %s
            ORDER BY date
        """
        
        df = pd.read_sql(query, self.conn, params=(user_id,))
        if df.empty:
            return None
            
        # Simple moving average prediction
        df['month'] = pd.to_datetime(df['date']).dt.to_period('M')
        monthly_expenses = df.groupby(['month', 'category_id'])['amount'].sum().reset_index()
        
        predictions = monthly_expenses.groupby('category_id').agg({
            'amount': ['mean', 'std']
        }).round(2)
        
        return predictions