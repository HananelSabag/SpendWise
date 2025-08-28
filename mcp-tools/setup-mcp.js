#!/usr/bin/env node

/**
 * SpendWise MCP Setup Script
 * Helps configure Cursor MCP settings for SpendWise tools
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

function getCursorConfigPath() {
  const homeDir = os.homedir();
  
  if (process.platform === 'win32') {
    return path.join(homeDir, '.cursor', 'mcp.json');
  } else if (process.platform === 'darwin') {
    return path.join(homeDir, '.cursor', 'mcp.json');
  } else {
    return path.join(homeDir, '.cursor', 'mcp.json');
  }
}

function getCurrentDirectory() {
  // Get the parent directory (project root)
  return path.dirname(__dirname);
}

function createMCPConfig() {
  const projectRoot = getCurrentDirectory();
  const configPath = getCursorConfigPath();
  
  console.log('🚀 Setting up SpendWise MCP Tools...');
  console.log('📁 Project root:', projectRoot);
  console.log('⚙️  Config path:', configPath);
  
  // Create the config directory if it doesn't exist
  const configDir = path.dirname(configPath);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
    console.log('📁 Created config directory:', configDir);
  }
  
  // Check if config file already exists
  let existingConfig = {};
  if (fs.existsSync(configPath)) {
    try {
      const configContent = fs.readFileSync(configPath, 'utf8');
      existingConfig = JSON.parse(configContent);
      console.log('📖 Found existing MCP config');
    } catch (error) {
      console.log('⚠️  Could not parse existing config, creating new one');
    }
  }
  
  // Ensure mcpServers object exists
  if (!existingConfig.mcpServers) {
    existingConfig.mcpServers = {};
  }
  
  // Add SpendWise MCP server configuration
  existingConfig.mcpServers['spendwise-db'] = {
    command: 'node',
    args: ['./mcp-tools/spendwise-db-server.js', '--mcp'],
    cwd: projectRoot,
    env: {
      DATABASE_URL: '${DATABASE_URL}',
      NODE_ENV: 'development',
      MCP_MODE: 'true'
    }
  };
  
  // Write the updated config
  try {
    fs.writeFileSync(configPath, JSON.stringify(existingConfig, null, 2));
    console.log('✅ Successfully updated Cursor MCP configuration!');
    console.log('\n📋 Next steps:');
    console.log('1. Set your DATABASE_URL environment variable');
    console.log('2. Restart Cursor to load the new MCP tools');
    console.log('3. The SpendWise database tools will be available in Cursor');
    
    console.log('\n🔧 Configuration added:');
    console.log(JSON.stringify(existingConfig.mcpServers['spendwise-db'], null, 2));
    
  } catch (error) {
    console.error('❌ Failed to write MCP configuration:', error.message);
    console.log('\n📝 Manual configuration:');
    console.log('Add this to your Cursor MCP config at:', configPath);
    console.log(JSON.stringify({ mcpServers: existingConfig.mcpServers }, null, 2));
  }
}

function main() {
  console.log('🎯 SpendWise MCP Setup Script v2.0.0\n');
  
  try {
    createMCPConfig();
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { createMCPConfig, getCursorConfigPath };

