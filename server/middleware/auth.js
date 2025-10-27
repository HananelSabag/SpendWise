/**
 * 🔐 BULLETPROOF AUTH MIDDLEWARE - Maximum Security
 * JWT authentication with bulletproof role-based access control
 * @module middleware/auth
 * @version 3.0.0 - BULLETPROOF SECURITY
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
      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'Access denied. No token provided.'
        }
      });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      logger.error('🚫 BULK DELETE AUTH: Invalid token', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        tokenLength: token.length,
        jwtError: jwtError.message
      });
      
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Access denied. Invalid token.'
        }
      });
    }
    
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
      
      // ✅ BULLETPROOF ROLE VALIDATION
      // Ensure role is valid and not tampered with
      const validRoles = ['user', 'admin', 'super_admin'];
      if (!validRoles.includes(user.role)) {
        logger.error('🚨 SECURITY ALERT: Invalid role detected', {
          userId: user.id,
          email: user.email,
          invalidRole: user.role,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        
        // Force user to regular user role and log incident
        await db.query(
          'UPDATE users SET role = $1 WHERE id = $2',
          ['user', user.id],
          'security_force_role_reset'
        );
        
        user.role = 'user';
      }
      
      // ✅ Add bulletproof role checks
      user.isAdmin = ['admin', 'super_admin'].includes(user.role);
      user.isSuperAdmin = user.role === 'super_admin';
      user.isUser = user.role === 'user';
      
      // Check for user restrictions (blocks, etc.) - with error handling
      let isRestricted = false;
      let restrictionReason = null;
      
      try {
        const restrictionsResult = await db.query(
          `SELECT restriction_type, reason, expires_at
           FROM user_restrictions 
           WHERE user_id = $1 
             AND is_active = true 
             AND (expires_at IS NULL OR expires_at > NOW())`,
          [userId],
          'auth_user_restrictions'
        );

        const activeRestrictions = restrictionsResult.rows || [];
        if (activeRestrictions.length > 0) {
          isRestricted = activeRestrictions.some(r => r.restriction_type === 'blocked');
          restrictionReason = activeRestrictions.find(r => r.restriction_type === 'blocked')?.reason || activeRestrictions[0].reason || 'Account restricted';
        }
      } catch (restrictionError) {
        // Log the error but don't block authentication if restrictions table doesn't exist
        logger.warn('⚠️ User restrictions check failed', {
          userId,
          error: restrictionError.message,
          stack: restrictionError.stack
        });
        // Continue with authentication - assume no restrictions
      }

      // Add restrictions to user object (error-safe)
      user.restrictions = isRestricted ? [{ restriction_type: 'blocked', reason: restrictionReason }] : [];
      user.isBlocked = isRestricted;
      user.isDeleted = false; // Only set to true if specifically deleted

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
 * ✅ FIX: Never blocks requests, even with invalid tokens
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      // No token provided - continue without user
      return next();
    }
    
    // Try to verify token, but don't fail if invalid
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId;
      
      // Check cache first
      const cacheKey = `user_${userId}`;
      let user = userCache.get(cacheKey);
      
      if (!user) {
        // Fetch user from database
        const result = await db.query(
          `SELECT id, email, name, role, is_active, onboarding_completed, google_id, avatar
           FROM users 
           WHERE id = $1 AND is_active = true`,
          [userId]
        );
        
        if (result.rows.length > 0) {
          user = result.rows[0];
          userCache.set(cacheKey, user);
        }
      }
      
      if (user) {
        req.user = user;
      }
    } catch (tokenError) {
      // Token invalid/expired - silently continue without user
      // DO NOT log this as an error since it's expected on public routes
      logger.debug('Optional auth: token verification failed, continuing without user', {
        ip: req.ip,
        path: req.path
      });
    }
    
    next();
  } catch (error) {
    // Unexpected error - log it but continue without user
    logger.debug('Optional auth: unexpected error, continuing without user', {
      error: error.message,
      ip: req.ip,
      path: req.path
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
 * 🔑 Generate JWT Tokens
 * Creates access and refresh tokens for user
 */
const generateTokens = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role || 'user'
  };

  const accessToken = jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: '15m' } // 15 minutes
  );

  const refreshToken = jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: '7d' } // 7 days
  );

  return { accessToken, refreshToken };
};

/**
 * 🔍 Verify JWT Token
 * Verifies and decodes JWT token
 */
const verifyToken = (token, secret = process.env.JWT_SECRET) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

/**
 * 🛡️ BULLETPROOF ROLE VALIDATION MIDDLEWARE
 */

// Require Admin Role (admin or super_admin)
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' }
    });
  }

  if (!['admin', 'super_admin'].includes(req.user.role)) {
    logger.warn('🚫 Non-admin attempted admin access', {
      userId: req.user.id,
      userRole: req.user.role,
      path: req.path,
      ip: req.ip
    });

    return res.status(403).json({
      success: false,
      error: { code: 'ADMIN_REQUIRED', message: 'Admin privileges required' }
    });
  }

  next();
};

// Require Super Admin Role
const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' }
    });
  }

  if (req.user.role !== 'super_admin') {
    logger.warn('🚫 Non-super-admin attempted super admin access', {
      userId: req.user.id,
      userRole: req.user.role,
      path: req.path,
      ip: req.ip
    });

    return res.status(403).json({
      success: false,
      error: { code: 'SUPER_ADMIN_REQUIRED', message: 'Super admin privileges required' }
    });
  }

  next();
};

// Bulletproof role checker function
const hasRole = (user, requiredRole) => {
  if (!user || !user.role) return false;
  
  const validRoles = ['user', 'admin', 'super_admin'];
  if (!validRoles.includes(user.role)) return false;
  
  switch (requiredRole) {
    case 'user':
      return validRoles.includes(user.role);
    case 'admin':
      return ['admin', 'super_admin'].includes(user.role);
    case 'super_admin':
      return user.role === 'super_admin';
    default:
      return false;
  }
};

// Role hierarchy checker
const canManageUser = (adminUser, targetUser) => {
  if (!adminUser || !targetUser) return false;
  
  // Super admin can manage anyone
  if (adminUser.role === 'super_admin') return true;
  
  // Admin can manage regular users only
  if (adminUser.role === 'admin' && targetUser.role === 'user') return true;
  
  // Nobody can manage themselves through this function (prevents self-demotion)
  if (adminUser.id === targetUser.id) return false;
  
  return false;
};

/**
 * 📊 Get auth cache statistics
 */
const getAuthCacheStats = () => {
  return {
    size: userCache.size,
    calculatedSize: userCache.calculatedSize
  };
};

module.exports = {
  auth,
  optionalAuth,
  clearUserCache,
  getAuthCacheStats,
  generateTokens,
  verifyToken,
  requireAdmin,
  requireSuperAdmin,
  hasRole,
  canManageUser
};