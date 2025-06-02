/**
 * Category Routes
 * @module routes/categoryRoutes
 * ADDRESSES GAP #4: Category API endpoints
 */

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const categoryController = require('../controllers/categoryController');
const { apiLimiter } = require('../middleware/rateLimiter');

// Apply auth to all routes
router.use(auth);
router.use(apiLimiter);

// Category CRUD routes
router.get('/', categoryController.getAll);
router.post('/', categoryController.create);
router.put('/:id', categoryController.update);
router.delete('/:id', categoryController.delete);

module.exports = router;