#!/usr/bin/env node

/**
 * SpendWise Database MCP Server
 * Provides Model Context Protocol tools for interacting with SpendWise Supabase database
 * @version 2.0.0 - MCP 2024-11-05 Compatible
 */

const { Pool } = require('pg');
const { parse } = require('pg-connection-string');
require('dotenv').config();

// MCP Protocol Implementation
class SpendWiseMCPServer {
  constructor() {
    this.tools = new Map();
    this.pool = null;
    this.initializeTools();
  }

  // Initialize database connection
  async initializeDatabase() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    const parsed = parse(process.env.DATABASE_URL);
    
    const dbConfig = {
      user: parsed.user,
      password: parsed.password,
      host: parsed.host,
      port: parsed.port,
      database: parsed.database,
      ssl: {
        rejectUnauthorized: false
      },
      max: parseInt(process.env.DB_MAX_CONNECTIONS, 10) || 10,
      min: parseInt(process.env.DB_MIN_CONNECTIONS, 10) || 2,
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT, 10) || 30000,
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT, 10) || 30000,
      application_name: 'spendwise-mcp-tools'
    };

    this.pool = new Pool(dbConfig);
    
    this.pool.on('error', (err) => {
      console.error('Database pool error:', err);
    });

    // Test connection
    await this.pool.query('SELECT NOW() as connected_at');
    console.log('✅ Database connection initialized for MCP tools');
  }

  // Safe query execution
  async executeQuery(text, params = [], context = 'unknown') {
    const start = Date.now();
    
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      if (process.env.DEBUG_MCP === 'true') {
        console.log(`[MCP] Query executed: ${context} (${duration}ms, ${result.rowCount} rows)`);
      }
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`[MCP] Query failed: ${context} (${duration}ms)`, error.message);
      throw error;
    }
  }

  // Initialize available tools
  initializeTools() {
    this.tools.set('get_user_profile', this.getUserProfile.bind(this));
    this.tools.set('get_transactions', this.getTransactions.bind(this));
    this.tools.set('create_transaction', this.createTransaction.bind(this));
    this.tools.set('get_categories', this.getCategories.bind(this));
    this.tools.set('get_financial_summary', this.getFinancialSummary.bind(this));
    this.tools.set('get_recurring_templates', this.getRecurringTemplates.bind(this));
    this.tools.set('execute_custom_query', this.executeCustomQuery.bind(this));
  }

  // Tool: Get User Profile
  async getUserProfile(userId) {
    const query = `
      SELECT 
        id, username, email, email_verified,
        language_preference, theme_preference, currency_preference,
        preferences, created_at, updated_at, last_login,
        (SELECT COUNT(*) FROM expenses WHERE user_id = $1 AND deleted_at IS NULL) + 
        (SELECT COUNT(*) FROM income WHERE user_id = $1 AND deleted_at IS NULL) as transaction_count,
        (SELECT COUNT(*) FROM categories WHERE id IN 
          (SELECT DISTINCT category_id FROM expenses WHERE user_id = $1 AND deleted_at IS NULL
           UNION SELECT DISTINCT category_id FROM income WHERE user_id = $1 AND deleted_at IS NULL)
        ) as category_count
      FROM users 
      WHERE id = $1
    `;
    
    const result = await this.executeQuery(query, [userId], 'get_user_profile');
    
    if (result.rows.length === 0) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    return result.rows[0];
  }

  // Tool: Get Transactions
  async getTransactions(userId, filters = {}) {
    const { type, startDate, endDate, limit = 50, offset = 0 } = filters;
    
    let query;
    const params = [userId];
    let paramIndex = 2;
    
    if (type === 'expense') {
      query = `
        SELECT 
          e.id, 'expense' as type, e.amount, e.description, e.date, e.created_at, e.notes,
          c.name as category_name, c.icon as category_icon,
          rt.id as recurring_template_id, rt.description as recurring_name
        FROM expenses e
        LEFT JOIN categories c ON e.category_id = c.id
        LEFT JOIN recurring_templates rt ON e.template_id = rt.id
        WHERE e.user_id = $1 AND e.deleted_at IS NULL
      `;
    } else if (type === 'income') {
      query = `
        SELECT 
          i.id, 'income' as type, i.amount, i.description, i.date, i.created_at, i.notes,
          c.name as category_name, c.icon as category_icon,
          rt.id as recurring_template_id, rt.description as recurring_name
        FROM income i
        LEFT JOIN categories c ON i.category_id = c.id
        LEFT JOIN recurring_templates rt ON i.template_id = rt.id
        WHERE i.user_id = $1 AND i.deleted_at IS NULL
      `;
    } else {
      // Get both types
      query = `
        (SELECT 
          e.id, 'expense' as type, e.amount, e.description, e.date, e.created_at, e.notes,
          c.name as category_name, c.icon as category_icon,
          rt.id as recurring_template_id, rt.description as recurring_name
        FROM expenses e
        LEFT JOIN categories c ON e.category_id = c.id
        LEFT JOIN recurring_templates rt ON e.template_id = rt.id
        WHERE e.user_id = $1 AND e.deleted_at IS NULL)
        UNION ALL
        (SELECT 
          i.id, 'income' as type, i.amount, i.description, i.date, i.created_at, i.notes,
          c.name as category_name, c.icon as category_icon,
          rt.id as recurring_template_id, rt.description as recurring_name
        FROM income i
        LEFT JOIN categories c ON i.category_id = c.id
        LEFT JOIN recurring_templates rt ON i.template_id = rt.id
        WHERE i.user_id = $1 AND i.deleted_at IS NULL)
      `;
    }
    
    if (startDate) {
      query = query.replace(/WHERE (.+?) AND/g, `WHERE $1 AND date >= $${paramIndex} AND`);
      params.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      query = query.replace(/WHERE (.+?) AND/g, `WHERE $1 AND date <= $${paramIndex} AND`);
      params.push(endDate);
      paramIndex++;
    }
    
    query += ` ORDER BY date DESC, created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await this.executeQuery(query, params, 'get_transactions');
    return result.rows;
  }

  // Tool: Create Transaction
  async createTransaction(userId, transactionData) {
    const { type, amount, description, category_id, date, notes } = transactionData;
    
    // Validate required fields
    if (!type || !amount || !description || !category_id) {
      throw new Error('Missing required fields: type, amount, description, category_id');
    }
    
    // Validate type
    if (!['income', 'expense'].includes(type)) {
      throw new Error('Type must be either "income" or "expense"');
    }
    
    const transactionDate = date || new Date().toISOString().split('T')[0];
    
    const tableName = type === 'expense' ? 'expenses' : 'income';
    
    const query = `
      INSERT INTO ${tableName} (user_id, amount, description, category_id, date, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, amount, description, category_id, date, notes, created_at
    `;
    
    const params = [userId, amount, description, category_id, transactionDate, notes || null];
    const result = await this.executeQuery(query, params, 'create_transaction');
    
    return { 
      ...result.rows[0], 
      type: type 
    };
  }

  // Tool: Get Categories
  async getCategories(userId, type = null) {
    let query = `
      SELECT c.id, c.name, c.type, c.icon, c.created_at, c.is_default,
             (SELECT COUNT(*) FROM expenses WHERE category_id = c.id AND user_id = $1 AND deleted_at IS NULL) +
             (SELECT COUNT(*) FROM income WHERE category_id = c.id AND user_id = $1 AND deleted_at IS NULL) as usage_count
      FROM categories c
      WHERE c.is_default = true
    `;
    
    const params = [userId];
    
    if (type) {
      query += ` AND (c.type = $2 OR c.type IS NULL)`;
      params.push(type);
    }
    
    query += ` ORDER BY c.name`;
    
    const result = await this.executeQuery(query, params, 'get_categories');
    return result.rows;
  }

  // Tool: Get Financial Summary
  async getFinancialSummary(userId, period = 'month', referenceDate = null) {
    const date = referenceDate || new Date().toISOString().split('T')[0];
    
    let dateFilter;
    switch (period) {
      case 'month':
        dateFilter = `date_trunc('month', date) = date_trunc('month', '${date}'::date)`;
        break;
      case 'quarter':
        dateFilter = `date_trunc('quarter', date) = date_trunc('quarter', '${date}'::date)`;
        break;
      case 'year':
        dateFilter = `date_trunc('year', date) = date_trunc('year', '${date}'::date)`;
        break;
      default:
        throw new Error('Invalid period. Must be "month", "quarter", or "year"');
    }
    
    const summaryQuery = `
      WITH summary_data AS (
        SELECT 
          COALESCE(SUM(i.amount), 0) as total_income,
          COALESCE(COUNT(i.id), 0) as income_count,
          COALESCE(COUNT(DISTINCT i.category_id), 0) as income_categories
        FROM income i
        WHERE i.user_id = $1 AND i.deleted_at IS NULL AND ${dateFilter}
      ),
      expense_data AS (
        SELECT 
          COALESCE(SUM(e.amount), 0) as total_expenses,
          COALESCE(COUNT(e.id), 0) as expense_count,
          COALESCE(COUNT(DISTINCT e.category_id), 0) as expense_categories
        FROM expenses e
        WHERE e.user_id = $1 AND e.deleted_at IS NULL AND ${dateFilter}
      )
      SELECT 
        s.total_income,
        e.total_expenses,
        (s.income_count + e.expense_count) as transaction_count,
        (s.income_categories + e.expense_categories) as categories_used
      FROM summary_data s, expense_data e
    `;
    
    const categoryBreakdownQuery = `
      (SELECT 
        c.name as category_name,
        c.icon as category_icon,
        'income' as type,
        SUM(i.amount) as total_amount,
        COUNT(*) as transaction_count
      FROM income i
      JOIN categories c ON i.category_id = c.id
      WHERE i.user_id = $1 AND i.deleted_at IS NULL AND ${dateFilter}
      GROUP BY c.id, c.name, c.icon)
      UNION ALL
      (SELECT 
        c.name as category_name,
        c.icon as category_icon,
        'expense' as type,
        SUM(e.amount) as total_amount,
        COUNT(*) as transaction_count
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE e.user_id = $1 AND e.deleted_at IS NULL AND ${dateFilter}
      GROUP BY c.id, c.name, c.icon)
      ORDER BY total_amount DESC
    `;
    
    const [summaryResult, categoryResult] = await Promise.all([
      this.executeQuery(summaryQuery, [userId], 'financial_summary'),
      this.executeQuery(categoryBreakdownQuery, [userId], 'category_breakdown')
    ]);
    
    const summary = summaryResult.rows[0];
    const balance = summary.total_income - summary.total_expenses;
    
    return {
      period,
      reference_date: date,
      total_income: parseFloat(summary.total_income),
      total_expenses: parseFloat(summary.total_expenses),
      net_balance: parseFloat(balance),
      transaction_count: parseInt(summary.transaction_count),
      categories_used: parseInt(summary.categories_used),
      category_breakdown: categoryResult.rows.map(row => ({
        ...row,
        total_amount: parseFloat(row.total_amount),
        transaction_count: parseInt(row.transaction_count)
      }))
    };
  }

  // Tool: Get Recurring Templates
  async getRecurringTemplates(userId, activeOnly = true) {
    let query = `
      SELECT 
        rt.id, rt.name, rt.amount, rt.description, rt.frequency_type, rt.frequency_interval,
        rt.next_date, rt.end_date, rt.is_active, rt.created_at,
        c.name as category_name, c.color as category_color,
        (SELECT COUNT(*) FROM transactions WHERE recurring_template_id = rt.id) as generated_count
      FROM recurring_templates rt
      LEFT JOIN categories c ON rt.category_id = c.id
      WHERE rt.user_id = $1
    `;
    
    const params = [userId];
    
    if (activeOnly) {
      query += ` AND rt.is_active = true`;
    }
    
    query += ` ORDER BY rt.next_date ASC, rt.created_at DESC`;
    
    const result = await this.executeQuery(query, params, 'get_recurring_templates');
    return result.rows;
  }

  // Tool: Execute Custom Query (with safety restrictions)
  async executeCustomQuery(userId, args) {
    const { query, params = [] } = args;
    
    if (!query) {
      throw new Error('Query is required');
    }
    
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery.startsWith('select')) {
      throw new Error('Only SELECT queries are allowed for security reasons');
    }
    
    const dangerousKeywords = ['drop', 'delete', 'insert', 'update', 'alter', 'create', 'truncate'];
    const hasDangerous = dangerousKeywords.some(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      return regex.test(trimmedQuery);
    });
    
    if (hasDangerous) {
      throw new Error('Query contains potentially dangerous operations');
    }
    
    let finalQuery = query;
    if (!trimmedQuery.includes('limit')) {
      finalQuery += ' LIMIT 100';
    }
    
    const result = await this.executeQuery(finalQuery, params, 'custom_query');
    return result.rows;
  }

  // Execute tool
  async executeTool(toolName, args) {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Unknown tool: ${toolName}`);
    }
    
    try {
      let result;
      
      // Special handling for different tools based on their parameter structure
      if (toolName === 'get_financial_summary') {
        result = await tool(args.userId, args.period, args.date);
      } else if (toolName === 'get_recurring_templates') {
        result = await tool(args.userId, args.active_only);
      } else if (toolName === 'get_categories') {
        result = await tool(args.userId, args.type);
      } else if (toolName === 'get_transactions') {
        result = await tool(args.userId, args);
      } else if (toolName === 'create_transaction') {
        result = await tool(args.userId, args);
      } else if (toolName === 'execute_custom_query') {
        result = await tool(args.userId, args);
      } else {
        // Default: pass userId and full args
        result = await tool(args.userId, args);
      }
      
      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`[MCP] Tool execution failed: ${toolName}`, error);
      return {
        success: false,
        error: error.message,
        tool: toolName,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get available tools
  getAvailableTools() {
    return Array.from(this.tools.keys());
  }

  // Close database connection
  async close() {
    if (this.pool) {
      await this.pool.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// MCP Protocol Handler
class MCPProtocolHandler {
  constructor(server) {
    this.server = server;
    this.capabilities = {
      tools: {}
    };
  }

  async handleMessage(message) {
    try {
      const { method, params, id } = message;
      
      switch (method) {
        case 'initialize':
          return {
            jsonrpc: '2.0',
            id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: this.capabilities,
              serverInfo: {
                name: 'SpendWise Database MCP Server',
                version: '2.0.0'
              }
            }
          };
          
        case 'tools/list':
          return {
            jsonrpc: '2.0',
            id,
            result: {
              tools: Array.from(this.server.tools.keys()).map(name => ({
                name,
                description: `SpendWise database tool: ${name}`,
                inputSchema: {
                  type: 'object',
                  properties: {},
                  required: []
                }
              }))
            }
          };
          
        case 'tools/call':
          const { name, arguments: args } = params;
          const result = await this.server.executeTool(name, args || {});
          return {
            jsonrpc: '2.0',
            id,
            result: {
              content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }]
            }
          };
          
        default:
          throw new Error(`Unknown method: ${method}`);
      }
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: message.id,
        error: {
          code: -32000,
          message: error.message
        }
      };
    }
  }
}

// Standard input/output MCP handler
async function startMCPServer() {
  const server = new SpendWiseMCPServer();
  const handler = new MCPProtocolHandler(server);
  
  try {
    await server.initializeDatabase();
    console.error('✅ SpendWise Database MCP Server is ready');
    
    // Handle stdin for MCP protocol
    process.stdin.setEncoding('utf8');
    
    let buffer = '';
    process.stdin.on('data', async (chunk) => {
      buffer += chunk;
      
      // Process complete JSON messages
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            const message = JSON.parse(line);
            const response = await handler.handleMessage(message);
            console.log(JSON.stringify(response));
          } catch (error) {
            console.error('❌ Error processing message:', error);
          }
        }
      }
    });
    
    process.stdin.on('end', () => {
      server.close();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to start MCP server:', error);
    process.exit(1);
  }
}

// Command line interface for testing
async function main() {
  console.log('🚀 Starting SpendWise Database MCP Server...');
  
  const server = new SpendWiseMCPServer();
  
  try {
    await server.initializeDatabase();
    console.log('✅ SpendWise Database MCP Server is ready');
    console.log('Available tools:', server.getAvailableTools());
    
    // Keep the process running
    process.stdin.resume();
    
  } catch (error) {
    console.error('❌ Failed to start MCP server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down SpendWise Database MCP Server...');
  process.exit(0);
});

// Export for use as module
module.exports = SpendWiseMCPServer;

// Start if run directly
if (require.main === module) {
  // Check if we're in MCP mode (typical when called by Cursor)
  if (process.argv.includes('--mcp') || process.env.MCP_MODE === 'true' || !process.stdout.isTTY) {
    startMCPServer();
  } else {
    main();
  }
} 