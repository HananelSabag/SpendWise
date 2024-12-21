/**
 * Database Configuration
 * Establishes and manages PostgreSQL database connection using connection pool
 */

// Import required dependencies
const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

// Configure PostgreSQL connection pool with environment variables
const pool = new Pool({
    user: process.env.DB_USER,      // Database username
    password: process.env.DB_PASSWORD, // Database password
    host: process.env.DB_HOST,      // Database host address
    port: process.env.DB_PORT,      // Database port number
    database: process.env.DB_NAME   // Target database name
});

// Verify database connectivity on startup
pool.connect()
    .then(() => console.log('Connected to PostgreSQL database'))
    .catch(err => console.error('Database connection error:', err));

// Export pool instance for use in other modules
module.exports = pool;