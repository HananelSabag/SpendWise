/**
 * Database Configuration
 * Establishes and manages PostgreSQL database connection using connection pool
 */

// Import required dependencies
const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

// Database configuration object
const dbConfig = {
    user: process.env.DB_USER,      // Database username
    password: process.env.DB_PASSWORD, // Database password
    host: process.env.DB_HOST,      // Database host address
    port: process.env.DB_PORT,      // Database port number
    database: process.env.DB_NAME   // Target database name
};

// Configure PostgreSQL connection pool
const pool = new Pool(dbConfig);

// Verify database connectivity on startup
pool.connect()
    .then(() => console.log('Connected To SpendWise DataBase!'))
    .catch(err => console.error('Database connection error:', err));

// Export pool instance and config for use in other modules
module.exports = {
    query: (text, params) => pool.query(text, params),
    pool,
    ...dbConfig  // Export config for Python script
};