/**
 * 🔍 DEBUG TEST SCRIPT - Test SpendWise API Functionality
 * Tests authentication, user data, and database connectivity
 */

const { User } = require('./models/User');
const db = require('./config/db');

async function debugTest() {
  console.log('🔍 Starting SpendWise Debug Test...\n');

  try {
    // Test 1: Database connectivity
    console.log('1️⃣ Testing database connectivity...');
    const dbTest = await db.query('SELECT NOW() as current_time');
    console.log('✅ Database connected:', dbTest.rows[0].current_time);
    console.log('');

    // Test 2: Check if hananel12345@gmail.com exists
    console.log('2️⃣ Checking for hananel12345@gmail.com...');
    const targetUser = await User.findByEmail('hananel12345@gmail.com');
    
    if (targetUser) {
      console.log('✅ User found:');
      console.log('   ID:', targetUser.id);
      console.log('   Email:', targetUser.email);
      console.log('   Username:', targetUser.username);
      console.log('   Name:', targetUser.name);
      console.log('   Role:', targetUser.role);
      console.log('   Email Verified:', targetUser.email_verified);
      console.log('   Created:', targetUser.created_at);
      console.log('');
    } else {
      console.log('❌ User hananel12345@gmail.com not found');
      
      // List existing users
      console.log('📋 Checking existing users...');
      const allUsers = await db.query('SELECT id, email, username, created_at FROM users LIMIT 5');
      if (allUsers.rows.length > 0) {
        console.log('   Existing users:');
        allUsers.rows.forEach(user => {
          console.log(`   - ${user.email} (${user.username}) - ID: ${user.id}`);
        });
      } else {
        console.log('   No users found in database');
      }
      console.log('');
    }

    // Test 3: Check transactions for the user (if user exists)
    if (targetUser) {
      console.log('3️⃣ Checking transactions for user...');
      const transactionsQuery = `
        SELECT 
          COUNT(*) as total_transactions,
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses
        FROM transactions 
        WHERE user_id = $1
      `;
      
      const transactionStats = await db.query(transactionsQuery, [targetUser.id]);
      const stats = transactionStats.rows[0];
      
      console.log('📊 Transaction Statistics:');
      console.log('   Total Transactions:', stats.total_transactions);
      console.log('   Total Income:', parseFloat(stats.total_income).toFixed(2));
      console.log('   Total Expenses:', parseFloat(stats.total_expenses).toFixed(2));
      console.log('   Net Balance:', (parseFloat(stats.total_income) - parseFloat(stats.total_expenses)).toFixed(2));
      console.log('');

      // Get recent transactions
      const recentQuery = `
        SELECT type, amount, description, created_at
        FROM transactions 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT 5
      `;
      
      const recentTransactions = await db.query(recentQuery, [targetUser.id]);
      if (recentTransactions.rows.length > 0) {
        console.log('📝 Recent Transactions:');
        recentTransactions.rows.forEach((tx, index) => {
          console.log(`   ${index + 1}. ${tx.type.toUpperCase()}: $${parseFloat(tx.amount).toFixed(2)} - ${tx.description} (${new Date(tx.created_at).toLocaleDateString()})`);
        });
      } else {
        console.log('📝 No transactions found for user');
      }
      console.log('');
    }

    // Test 4: Test API endpoints (simulate what client calls)
    if (targetUser) {
      console.log('4️⃣ Testing API endpoints...');
      
      // Test analytics summary
      const analyticsQuery = `
        WITH date_range AS (
          SELECT 
            NOW() - INTERVAL '30 days' as start_date,
            NOW() as end_date
        ),
        transaction_summary AS (
          SELECT 
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses,
            COUNT(*) as transaction_count
          FROM transactions t, date_range dr
          WHERE t.user_id = $1 
            AND t.created_at >= dr.start_date 
            AND t.created_at <= dr.end_date
        )
        SELECT * FROM transaction_summary
      `;
      
      const analyticsResult = await db.query(analyticsQuery, [targetUser.id]);
      const analytics = analyticsResult.rows[0];
      
      console.log('📈 Analytics API Test:');
      console.log('   30-Day Income:', parseFloat(analytics.total_income).toFixed(2));
      console.log('   30-Day Expenses:', parseFloat(analytics.total_expenses).toFixed(2));
      console.log('   30-Day Transactions:', analytics.transaction_count);
      console.log('');
    }

    // Test 5: Database schema check
    console.log('5️⃣ Checking database schema...');
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    const tables = await db.query(tablesQuery);
    console.log('📋 Database tables:');
    tables.rows.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });
    console.log('');

    console.log('✅ Debug test completed successfully!');
    console.log('');
    
    if (!targetUser) {
      console.log('🔧 RECOMMENDATIONS:');
      console.log('   1. Create a test user account by registering through the client');
      console.log('   2. Check if the database tables exist and have proper structure');
      console.log('   3. Verify that the client is connecting to the correct server URL');
      console.log('');
    }

  } catch (error) {
    console.error('❌ Debug test failed:', error.message);
    console.error('Stack:', error.stack);
  }

  process.exit(0);
}

// Run the debug test
debugTest(); 