// BULLETPROOF: Simple entry point for Render
console.log('=== SPENDWISE SERVER STARTING ===');
console.log('Current dir:', process.cwd());

try {
  console.log('Loading server from ./server/index.js');
  require('./server/index.js');
  console.log('Server loaded successfully');
} catch (error) {
  console.error('FATAL ERROR:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
} 