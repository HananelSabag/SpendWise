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

console.log('4. Setting up basic middleware...');
app.use(express.json());

console.log('5. Creating test route...');
app.get('/', (req, res) => {
  res.json({ message: 'SpendWise Server is running!' });
});

console.log('6. Getting port...');
const PORT = process.env.PORT || 3000;

console.log('7. Starting server...');
app.listen(PORT, () => {
  console.log(`✅ MINIMAL SERVER RUNNING ON PORT ${PORT}`);
});

console.log('8. Server setup complete');

module.exports = app;