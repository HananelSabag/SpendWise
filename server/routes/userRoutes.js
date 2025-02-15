/**
 * User Routes Configuration
 * Defines all user-related API endpoints
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth } = require('../middleware/auth');

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/refresh-token', userController.refreshToken);

// Protected routes
router.use(auth); // Apply authentication middleware to all routes below
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.post('/logout', userController.logout);

module.exports = router;