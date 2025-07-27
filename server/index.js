/**
 * SpendWise Server - MINIMAL TEST VERSION
 * Finding what's causing the crash
 */

console.log('=== STARTING MINIMAL SERVER TEST ===');

// Step 1: Basic requires
console.log('1. Loading dotenv...');
require('dotenv').config();

console.log('2. Loading express...');
const express = require('express');

console.log('3. Creating app...');
const app = express();

console.log('4. Loading safe modules...');
const cors = require('cors');

console.log('5. Setting up middleware...');
app.use(express.json());
app.use(cors());

console.log('6. Creating basic routes...');
app.get('/', (req, res) => {
  res.json({ message: 'SpendWise Server is running!' });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

console.log('7. Getting port...');
const PORT = process.env.PORT || 3000;

console.log('8. Starting server...');
app.listen(PORT, () => {
  console.log(`✅ MINIMAL SERVER RUNNING ON PORT ${PORT}`);
});

console.log('9. Server setup complete');

module.exports = app;