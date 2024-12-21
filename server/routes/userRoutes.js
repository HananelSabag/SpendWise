// User routes - defines user-related endpoints
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Register new user route
router.post('/register', userController.register);

// Login route (we'll implement this later)
router.post('/login', userController.login);

module.exports = router;