// MINIMAL TEST: Just start a basic HTTP server
console.log('=== TESTING RENDER DEPLOYMENT ===');

const http = require('http');
const port = process.env.PORT || 3000;

console.log('Creating basic HTTP server...');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('SpendWise Server is ALIVE!\n');
});

server.listen(port, () => {
  console.log(`✅ TEST SERVER RUNNING ON PORT ${port}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Keep server alive
server.on('error', (err) => {
  console.error('❌ Server error:', err.message);
  process.exit(1);
}); 