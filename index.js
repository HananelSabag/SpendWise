/**
 * Root entry point for deployment platforms (Render, Heroku, etc.)
 * Redirects to the actual server in the server/ subdirectory
 * FIXED: Correct path after chdir
 */

console.log('🚀 Starting SpendWise Server...');
console.log('📁 Current directory:', process.cwd());

// Change working directory to server and start the app
process.chdir('./server');
console.log('📁 Changed to directory:', process.cwd());

// Require the server (path is now relative to server directory)
require('./index.js'); 