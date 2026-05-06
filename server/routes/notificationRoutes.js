const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

router.use(auth);

router.get('/',             notificationController.getAll);
router.patch('/read-all',   notificationController.markAllRead);
router.patch('/:id/read',   notificationController.markRead);

module.exports = router;
