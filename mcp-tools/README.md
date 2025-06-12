# SpendWise MCP Tools

Model Context Protocol (MCP) tools for interacting with your SpendWise Supabase database. These tools allow AI assistants to directly query and interact with your database safely and efficiently.

## 🎯 Overview

The SpendWise MCP Tools provide:
- ✅ **Safe database access** with read-only operations
- ✅ **User profile management** 
- ✅ **Transaction querying and creation**
- ✅ **Financial analytics and summaries**
- ✅ **Category management**
- ✅ **Recurring transaction templates**
- ✅ **Custom SQL queries** (SELECT only, with safety restrictions)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Access to your Supabase database
- SpendWise database schema already deployed

### 1. Install Dependencies
```bash
cd mcp-tools
npm install
```

### 2. Environment Setup
Create a `.env` file in the `mcp-tools` directory:

```env
# Supabase Database Connection
DATABASE_URL=postgresql://postgres:[PASSWORD]@[PROJECT_REF].supabase.co:5432/postgres
NODE_ENV=production

# Optional: For development/testing
DEBUG_MCP=true
```

### 3. Test the Setup
```bash
npm test
```

### 4. Start MCP Server
```bash
npm start
```

## 📋 Available Tools

### 1. `get_user_profile`
Get comprehensive user information including preferences and statistics.

**Parameters:**
- `userId` (integer) - User ID to fetch profile for

**Example Response:**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "full_name": "John Doe",
  "language_preference": "en",
  "theme_preference": "dark",
  "currency_preference": "USD",
  "transaction_count": 45,
  "category_count": 8
}
```

### 2. `get_transactions`
Retrieve transactions with filtering and pagination.

**Parameters:**
- `userId` (integer, required) - User ID
- `type` (string, optional) - "income" or "expense"
- `startDate` (date, optional) - Start date (YYYY-MM-DD)
- `endDate` (date, optional) - End date (YYYY-MM-DD)
- `limit` (integer, optional) - Number of results (default: 50)
- `offset` (integer, optional) - Pagination offset (default: 0)

### 3. `create_transaction`
Create a new transaction.

**Parameters:**
- `userId` (integer, required) - User creating the transaction
- `type` (string, required) - "income" or "expense"
- `amount` (number, required) - Transaction amount
- `description` (string, required) - Transaction description
- `category_id` (integer, required) - Category ID
- `date` (date, optional) - Transaction date (defaults to today)

### 4. `get_categories`
Get all categories for a user with usage statistics.

**Parameters:**
- `userId` (integer, required) - User ID
- `type` (string, optional) - "income" or "expense" filter

### 5. `get_financial_summary`
Get financial analytics for a specific period.

**Parameters:**
- `userId` (integer, required) - User ID
- `period` (string, optional) - "month", "quarter", or "year" (default: "month")
- `date` (date, optional) - Reference date (defaults to today)

**Example Response:**
```json
{
  "period": "month",
  "reference_date": "2024-01-15",
  "total_income": 5000.00,
  "total_expenses": 3200.00,
  "net_balance": 1800.00,
  "transaction_count": 23,
  "categories_used": 6,
  "category_breakdown": [...]
}
```

### 6. `get_recurring_templates`
Get recurring transaction templates.

**Parameters:**
- `userId` (integer, required) - User ID
- `active_only` (boolean, optional) - Only active templates (default: true)

### 7. `execute_custom_query`
Execute custom SQL SELECT queries with safety restrictions.

**Parameters:**
- `query` (string, required) - SQL SELECT query
- `params` (array, optional) - Query parameters

**Safety Features:**
- ✅ Only SELECT statements allowed
- ✅ Blocks dangerous keywords (DROP, DELETE, UPDATE, etc.)
- ✅ Automatic LIMIT 100 if not specified
- ✅ Parameter binding for injection prevention

## 🔧 Configuration

### For Local Development

1. **Environment Variables:**
```env
DATABASE_URL=your_supabase_connection_string
NODE_ENV=development
DEBUG_MCP=true
```

2. **Run with your existing SpendWise setup:**
```bash
# In SpendWise root directory
cp mcp-tools/.env.example mcp-tools/.env
# Edit mcp-tools/.env with your credentials
cd mcp-tools && npm test
```

### For Render Deployment

1. **Add MCP tools to your Render service:**

**Option A: Separate Service**
- Create new Render service for MCP tools
- Connect your GitHub repo
- Set build command: `cd mcp-tools && npm install`
- Set start command: `cd mcp-tools && npm start`

**Option B: Integrate with existing server**
- Copy MCP tools to your server deployment
- Update your server's package.json to include MCP dependencies
- Add MCP endpoint to your Express server

2. **Environment Variables in Render:**
```
DATABASE_URL=your_supabase_connection_string
NODE_ENV=production
PORT=10000
```

3. **Render Deploy Example:**
```yaml
# render.yaml
services:
  - type: web
    name: spendwise-mcp-tools
    env: node
    buildCommand: cd mcp-tools && npm install
    startCommand: cd mcp-tools && npm start
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: spendwise-db
          property: connectionString
      - key: NODE_ENV
        value: production
```

## 🛠️ Integration Examples

### With Cursor/Claude
Add to your MCP client configuration:
```json
{
  "mcpServers": {
    "spendwise-db": {
      "command": "node",
      "args": ["./mcp-tools/spendwise-db-server.js"],
      "env": {
        "DATABASE_URL": "your_connection_string"
      }
    }
  }
}
```

### With Custom AI Application
```javascript
const SpendWiseMCPServer = require('./mcp-tools/spendwise-db-server');

const mcpServer = new SpendWiseMCPServer();
await mcpServer.initializeDatabase();

// Get user transactions
const result = await mcpServer.executeTool('get_transactions', {
  userId: 1,
  type: 'expense',
  limit: 10
});

console.log(result.data);
```

## 🔒 Security Features

- **Read-only operations**: Most tools are read-only
- **User isolation**: All queries require userId parameter
- **SQL injection protection**: Parameterized queries
- **Query restrictions**: Only SELECT statements for custom queries
- **Rate limiting**: Built into connection pooling
- **Audit logging**: All operations are logged

## 🚨 What I Need From You

To complete the setup, please provide:

1. **Your Supabase connection string:**
   ```
   DATABASE_URL=postgresql://postgres:[PASSWORD]@[PROJECT_REF].supabase.co:5432/postgres
   ```

2. **Your Render service details:**
   - Service name/URL
   - Preferred deployment method (separate service vs integrated)

3. **Any specific requirements:**
   - Additional tools needed?
   - Special security requirements?
   - Integration preferences?

## 📞 Testing

Run the comprehensive test suite:
```bash
cd mcp-tools
npm test
```

This will test:
- ✅ Database connectivity
- ✅ All available tools
- ✅ Security restrictions
- ✅ Data validation
- ✅ Error handling

## 🎯 Next Steps

1. **Provide your database credentials**
2. **Test locally:** `cd mcp-tools && npm test`
3. **Deploy to Render** (I'll help with this)
4. **Configure MCP client** (Cursor, Claude, etc.)
5. **Start using AI-powered database queries!**

---

**Need help?** Just ask! I can help with:
- Render deployment configuration
- Custom tool development
- Integration with specific AI clients
- Security and performance optimization 