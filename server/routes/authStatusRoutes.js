/**
 * 🔐 AUTHENTICATION STATUS ROUTES
 * Simple, bulletproof authentication detection endpoints
 * @version 1.0.0 - CLEAN SLATE
 */

const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate } = require('../middleware/auth');
const AuthStatusService = require('../services/authStatusService');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * 🎯 Get user's authentication status - BULLETPROOF
 * @route GET /api/v1/auth-status
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const start = Date.now();
  const userId = req.user.id;

  try {
    const status = await AuthStatusService.getUserAuthStatus(userId);
    
    const duration = Date.now() - start;
    logger.debug('✅ Auth status served', {
      userId,
      authType: status.authType,
      duration: `${duration}ms`
    });

    res.json({
      success: true,
      data: status,
      metadata: {
        duration: `${duration}ms`,
        source: 'direct_database',
        reliable: true
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const duration = Date.now() - start;
    logger.error('❌ Auth status failed', {
      userId,
      error: error.message,
      duration: `${duration}ms`
    });
    throw error;
  }
}));

/**
 * 🔍 Verify authentication status consistency - DEBUG
 * @route GET /api/v1/auth-status/verify
 */
router.get('/verify', authenticate, asyncHandler(async (req, res) => {
  const start = Date.now();
  const userId = req.user.id;

  try {
    const verification = await AuthStatusService.verifyAuthStatus(userId);
    
    const duration = Date.now() - start;
    logger.info('🔍 Auth status verification', {
      userId,
      passed: verification.verification.passed,
      authType: verification.status?.authType,
      duration: `${duration}ms`
    });

    res.json({
      success: true,
      data: verification,
      metadata: {
        duration: `${duration}ms`,
        verification: true
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const duration = Date.now() - start;
    logger.error('❌ Auth status verification failed', {
      userId,
      error: error.message,
      duration: `${duration}ms`
    });
    throw error;
  }
}));

module.exports = router;
