#!/usr/bin/env node

/**
 * 🚀 DEV CLEAN SCRIPT
 * Starts Vite dev server and opens browser with clean cache & local storage
 */

import { spawn, exec } from 'child_process';
import { platform } from 'os';

const DEV_URL = 'http://localhost:5173';
const CLEAR_STORAGE_URL = `${DEV_URL}?clear=cache,storage,cookies`;

console.log('🚀 Starting SpendWise with clean cache and storage...\n');

// Start Vite dev server
const viteProcess = spawn('npx', ['vite'], {
  stdio: 'inherit',
  shell: true
});

// Wait for dev server to be ready, then open browser with clean cache
setTimeout(() => {
  console.log('\n🌐 Opening browser with clean cache and local storage...\n');
  
  const os = platform();
  let openCommand = '';
  
  if (os === 'win32') {
    // Windows - Open Chrome/Edge with clean session
    openCommand = `start "" "chrome.exe" --new-window --incognito --disable-web-security --disable-features=VizDisplayCompositor --user-data-dir=%TEMP%/spendwise-clean --clear-token-service "${CLEAR_STORAGE_URL}" || start "" "msedge.exe" --new-window --inprivate --disable-web-security --user-data-dir=%TEMP%/spendwise-clean "${CLEAR_STORAGE_URL}" || start "" "${CLEAR_STORAGE_URL}"`;
  } else if (os === 'darwin') {
    // macOS - Open Chrome/Safari with clean session  
    openCommand = `open -na "Google Chrome" --args --new-window --incognito --user-data-dir=/tmp/spendwise-clean "${CLEAR_STORAGE_URL}" || open -a Safari "${CLEAR_STORAGE_URL}" || open "${CLEAR_STORAGE_URL}"`;
  } else {
    // Linux - Open Chrome/Firefox with clean session
    openCommand = `google-chrome --new-window --incognito --user-data-dir=/tmp/spendwise-clean "${CLEAR_STORAGE_URL}" || firefox --private-window "${CLEAR_STORAGE_URL}" || xdg-open "${CLEAR_STORAGE_URL}"`;
  }
  
  exec(openCommand, (error) => {
    if (error) {
      console.log('⚠️  Could not open browser automatically. Please open:', CLEAR_STORAGE_URL);
      console.log('💡 Tip: Copy this URL to open with clean cache and storage\n');
    } else {
      console.log('✅ Browser opened with clean cache and storage!');
      console.log('🔍 If cache persists, try Ctrl+Shift+R (hard refresh)\n');
    }
  });
}, 3000); // Wait 3 seconds for dev server to start

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down dev server...');
  viteProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  viteProcess.kill('SIGTERM');
  process.exit(0);
});

// Handle vite process exit
viteProcess.on('exit', (code) => {
  console.log(`\n📊 Dev server exited with code ${code}`);
  process.exit(code);
}); 