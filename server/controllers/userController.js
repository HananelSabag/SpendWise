// User controller - handles user-related requests
const User = require('../models/User');

const userController = {
    // Register new user
    register: async (req, res) => {
        try {
            const { email, username, password } = req.body;
            
            // Create new user
            const user = await User.create(email, username, password);
            res.status(201).json(user);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    // Login user
    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            
            // Verify user credentials
            const user = await User.verifyPassword(email, password);
            if (!user) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            res.json(user);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
};

module.exports = userController;