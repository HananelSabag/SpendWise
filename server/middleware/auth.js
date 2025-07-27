/**
 * 🔐 ENHANCED AUTH MIDDLEWARE - Admin Role Support
 * JWT authentication with admin role handling
 * @module middleware/auth
 */

const jwt = require('jsonwebtoken');
const db = require('../config/db');
const logger = require('../utils/logger');
const { LRUCache } = require('lru-cache');

// Enhanced user cache with role support
const userCache = new LRUCache({
  max: 1000,
  ttl: 10 * 60 * 1000, // 10 minutes TTL
  allowStale: false,
  updateAgeOnGet: false,
  updateAgeOnHas: false
});

/**
 * 🔐 Enhanced Authentication Middleware
 * Verifies JWT token and loads user with role information
 */
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      logger.debug('🚫 No auth token provided', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path
      });
      
      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'Access denied. No token provided.'
        }
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Check cache first
    const cacheKey = `user_${userId}`;
    let user = userCache.get(cacheKey);

    if (!user) {
      // Fetch user with role information from database
      const result = await db.query(
        `SELECT 
          id, 
          email, 
          username, 
          role,
          email_verified, 
          onboarding_completed,
          language_preference,
          currency_preference,
          theme_preference,
          last_login
        FROM users 
        WHERE id = $1`,
        [userId],
        'auth_user_lookup'
      );

      if (result.rows.length === 0) {
        logger.warn('🚫 Invalid token - user not found', {
          userId,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid token. User not found.'
          }
        });
      }

      user = result.rows[0];
      
      // Check for user restrictions (blocks, etc.)
      const restrictionsResult = await db.query(
        `SELECT restriction_type, reason, expires_at
         FROM user_restrictions 
         WHERE user_id = $1 
           AND is_active = true 
           AND (expires_at IS NULL OR expires_at > NOW())`,
        [userId],
        'auth_user_restrictions'
      );

      // Add restrictions to user object
      user.restrictions = restrictionsResult.rows;
      user.isBlocked = restrictionsResult.rows.some(r => r.restriction_type === 'blocked');
      user.isDeleted = restrictionsResult.rows.some(r => r.restriction_type === 'deleted');

      // Cache the user data
      userCache.set(cacheKey, user);
    }

    // Check if user is blocked or deleted
    if (user.isBlocked) {
      const blockInfo = user.restrictions.find(r => r.restriction_type === 'blocked');
      
      logger.warn('🚫 Blocked user attempted access', {
        userId: user.id,
        email: user.email,
        reason: blockInfo?.reason,
        ip: req.ip
      });
      
      return res.status(403).json({
        success: false,
        error: {
          code: 'USER_BLOCKED',
          message: 'Your account has been temporarily blocked.',
          reason: blockInfo?.reason,
          expires_at: blockInfo?.expires_at
        }
      });
    }

    if (user.isDeleted) {
      logger.warn('🚫 Deleted user attempted access', {
        userId: user.id,
        email: user.email,
        ip: req.ip
      });
      
      return res.status(403).json({
        success: false,
        error: {
          code: 'USER_DELETED',
          message: 'This account has been deactivated.'
        }
      });
    }

    // Update last login time periodically (not on every request for performance)
    const now = new Date();
    const lastLogin = new Date(user.last_login);
    const timeSinceLastUpdate = now - lastLogin;
    
    // Update last_login if it's been more than 1 hour
    if (timeSinceLastUpdate > 60 * 60 * 1000) {
      // Don't await this to avoid blocking the request
      db.query(
        'UPDATE users SET last_login = NOW() WHERE id = $1',
        [userId],
        'auth_update_last_login'
      ).catch(error => {
        logger.error('Error updating last_login', { userId, error: error.message });
      });
      
      // Update cache
      user.last_login = now;
      userCache.set(cacheKey, user);
    }

    // Add user to request object
    req.user = user;
    
    // Log admin access for security monitoring
    if (['admin', 'super_admin'].includes(user.role)) {
      logger.info('🛡️ Admin access', {
        adminId: user.id,
        role: user.role,
        path: req.path,
        method: req.method,
        ip: req.ip
      });
    }

    next();

  } catch (error) {
    // Clear cache if JWT verification fails
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      logger.debug('🚫 Invalid or expired token', {
        error: error.message,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token.'
        }
      });
    }

    logger.error('❌ Auth middleware error', {
      error: error.message,
      stack: error.stack,
      ip: req.ip
    });

    return res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication error occurred.'
      }
    });
  }
};

/**
 * 🔐 Optional Authentication Middleware
 * Adds user info if token is provided, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      // Use the main auth middleware logic but don't fail if no token
      await auth(req, res, (error) => {
        if (error) {
          // Log the error but continue without user
          logger.debug('Optional auth failed, continuing without user', {
            error: error.message,
            ip: req.ip
          });
        }
        next();
      });
    } else {
      next();
    }
  } catch (error) {
    // Log error but continue without user
    logger.debug('Optional auth error, continuing without user', {
      error: error.message,
      ip: req.ip
    });
    next();
  }
};

/**
 * 🧹 Clear user cache (useful for cache invalidation)
 */
const clearUserCache = (userId) => {
  const cacheKey = `user_${userId}`;
  userCache.delete(cacheKey);
  logger.debug('🧹 User cache cleared', { userId });
};

/**
 * 📊 Get auth cache statistics
 */
const getAuthCacheStats = () => {
  return {
    size: userCache.size,
    max: userCache.max,
    ttl: userCache.ttl,
    calculatedSize: userCache.calculatedSize
  };
};

module.exports = {
  auth,
  optionalAuth,
  clearUserCache,
  getAuthCacheStats
};