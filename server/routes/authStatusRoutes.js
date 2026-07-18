const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { auth } = require('../middleware/auth');
const AuthStatusService = require('../services/authStatusService');

const router = express.Router();

router.get('/', auth, asyncHandler(async (req, res) => {
  const status = await AuthStatusService.getUserAuthStatus(req.user.id);
  res.json({ success: true, data: status, timestamp: new Date().toISOString() });
}));

module.exports = router;
