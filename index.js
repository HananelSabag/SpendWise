/**
 * Root entry point for deployment platforms (Render, Heroku, etc.)
 * Redirects to the actual server in the server/ subdirectory
 */

// Change working directory to server and start the app
process.chdir('./server');
require('./server/index.js'); 