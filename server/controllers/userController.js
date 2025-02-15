/**
 * User Controller
 * Handles all user-related HTTP requests and responses
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Register a new user
 * @route POST /api/users/register
 */
const register = async (req, res, next) => {
    try {
        const { email, username, password } = req.body;
        
        // Check for existing user
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new user
        const newUser = await User.create(email, username, password);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * Login user
 * @route POST /api/users/login
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        
        // Verify credentials
        const user = await User.verifyPassword(email, password);
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, username: user.username }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' }
        );

        // Send response
        res.status(200).json({ 
            token, 
            user: { 
                id: user.id, 
                email: user.email, 
                username: user.username 
            } 
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get user profile
 * @route GET /api/users/profile
 */
const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            id: user.id,
            email: user.email,
            username: user.username
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Update user profile
 * @route PUT /api/users/profile
 */
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const updatedUser = await User.updateProfile(userId, req.body);

        res.json({
            id: updatedUser.id,
            email: updatedUser.email,
            username: updatedUser.username
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ 
            message: 'Profile update failed',
            error: error.message 
        });
    }
};

/**
 * Refresh JWT token
 * @route POST /api/users/refresh-token
 */
const refreshToken = async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        // Verify existing token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate new token
        const newToken = jwt.sign(
            { id: user.id, email: user.email, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token: newToken });
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

/**
 * Logout user
 * @route POST /api/users/logout
 */
const logout = async (req, res) => {
    res.json({ message: 'Logged out successfully' });
};

module.exports = {
    register,
    login,
    logout,
    refreshToken,
    getProfile,
    updateProfile
};