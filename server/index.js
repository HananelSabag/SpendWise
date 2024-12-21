// Required dependencies
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/db'); // Add this line

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

const userRoutes = require('./routes/userRoutes');

// Middleware
app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);

// Basic test route
app.get('/api/test', async (req, res) => {
    try {
        // Test database connection
        const result = await db.query('SELECT NOW()');
        console.log('Database connected successfully:', result.rows[0]);
        res.json({ 
            message: 'SpendWise API is running!',
            dbConnected: true
        });
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({ 
            message: 'Error connecting to database',
            error: error.message
        });
    }
});

// Set port
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Test the API at: http://localhost:${PORT}/api/test`);
});