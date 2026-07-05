/**
 * Profile Controller — get/update the authenticated user's own profile
 * @module controllers/auth/profileController
 */

const { User } = require('../../models/User');
const { clearUserCache } = require('../../middleware/auth');
const { normalizeUserData } = require('../../utils/userNormalizer');
const errorCodes = require('../../utils/errorCodes');
const { asyncHandler } = require('../../middleware/errorHandler');
const logger = require('../../utils/logger');

const profileController = {
  /**
   * 🚀 Get user profile with smart caching
   * @route GET /api/v1/users/profile
   */
  getProfile: asyncHandler(async (req, res) => {
    const start = Date.now();
    const userId = req.user.id;

    try {
      // Use optimized User model with caching
      const user = await User.findById(userId);

      if (!user) {
        throw { ...errorCodes.NOT_FOUND, details: 'User not found' };
      }

      // ✅ CLEANED: Use centralized user normalization
      const normalizedUser = normalizeUserData(user);

      const duration = Date.now() - start;
      logger.debug('✅ User profile served', {
        userId,
        duration: `${duration}ms`,
        cached: true,
        performance: duration < 50 ? 'excellent' : duration < 200 ? 'good' : 'slow'
      });

      res.json({
        success: true,
        data: normalizedUser, // ✅ FIX: Return normalized user data
        metadata: {
          duration: `${duration}ms`,
          cached: true,
          optimized: true
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const duration = Date.now() - start;
      logger.error('❌ Get profile failed', {
        userId,
        error: error.message,
        duration: `${duration}ms`
      });
      throw error;
    }
  }),

  /**
   * 🚀 Update user profile with cache invalidation
   * @route PUT /api/v1/users/profile
   */
  updateProfile: asyncHandler(async (req, res) => {
    const start = Date.now();
    const userId = req.user.id;
    const updates = req.body;

    try {
      const user = await User.update(userId, updates);

      // Invalidate the auth cache so changed preferences (e.g.
      // billing_cycle_day, which drives the dashboard financial period) take
      // effect on the very next request instead of after the 10-min TTL.
      clearUserCache(userId);

      const duration = Date.now() - start;
      logger.info('✅ User profile updated', {
        userId,
        fields: Object.keys(updates),
        duration: `${duration}ms`,
        performance: duration < 100 ? 'excellent' : duration < 300 ? 'good' : 'slow'
      });

      res.json({
        success: true,
        data: user,
        metadata: {
          updated: true,
          fields: Object.keys(updates),
          duration: `${duration}ms`,
          cache_invalidated: true,
          optimized: true
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const duration = Date.now() - start;
      logger.error('❌ Update profile failed', {
        userId,
        error: error.message,
        duration: `${duration}ms`
      });
      throw error;
    }
  })
};

module.exports = profileController;
