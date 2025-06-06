/**
 * Authentication Middleware - Production Ready
 * JWT token validation with enhanced security
 * @module middleware/auth
 */

const jwt = require('jsonwebtoken');
const errorCodes = require('../utils/errorCodes');
const logger = require('../utils/logger');

/**
 * Generate access and refresh tokens
 * @param {Object} user - User object
 * @returns {Object} Token pair
 */
const generateTokens = (user) => {
  if (!user?.id || !user?.email) {
    throw { ...errorCodes.VALIDATION_ERROR, details: 'Invalid user data for token generation' };
  }

  try {
    const accessToken = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        iat: Math.floor(Date.now() / 1000)
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
        issuer: 'spendwise-server',
        audience: 'spendwise-client'
      }
    );

    const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
    if (process.env.NODE_ENV === 'production' && !process.env.JWT_REFRESH_SECRET) { // Enforce separate refresh secret in production
      throw new Error('JWT_REFRESH_SECRET must be set in production');
    }

    const refreshToken = jwt.sign(
      { 
        id: user.id,
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000)
      },
      refreshSecret,
      { 
        expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
        issuer: 'spendwise-server',
        audience: 'spendwise-client'
      }
    );

    logger.info('Tokens generated successfully', { userId: user.id });
    
    return { accessToken, refreshToken };
  } catch (error) {
    logger.error('Token generation failed', { 
      userId: user.id, 
      error: error.message 
    });
    throw { ...errorCodes.INTERNAL_ERROR, details: 'Failed to generate tokens' };
  }
};

/**
 * Verify and decode JWT token
 * @param {string} token - JWT token
 * @param {string} secret - JWT secret
 * @returns {Object} Decoded token
 */
const verifyToken = (token, secret) => {
  return jwt.verify(token, secret, {
    issuer: 'spendwise-server',
    audience: 'spendwise-client',
    maxAge: '30d' // Added max age validation
  });
};

/**
 * Authentication middleware
 * Validates JWT tokens and sets req.user
 */
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    // Check for authorization header
    if (!authHeader) {
      logger.warn('Missing authorization header', { 
        ip: req.ip, 
        userAgent: req.get('user-agent') 
      });
      
      return res.status(401).json({ 
        error: {
          code: 'MISSING_TOKEN',
          message: 'Authorization header required',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Extract token from Bearer format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      logger.warn('Invalid authorization header format', { 
        authHeader: authHeader.substring(0, 20) + '...' 
      });
      
      return res.status(401).json({ 
        error: {
          code: 'INVALID_TOKEN_FORMAT',
          message: 'Authorization header must be Bearer token',
          timestamp: new Date().toISOString()
        }
      });
    }

    const token = parts[1];
    
    // Verify token
    const decoded = verifyToken(token, process.env.JWT_SECRET);
    
    // Validate decoded token structure
    if (!decoded.id || !decoded.email) {
      logger.warn('Invalid token payload', { tokenId: decoded.id });
      
      return res.status(401).json({ 
        error: {
          code: 'INVALID_TOKEN_PAYLOAD',
          message: 'Invalid token structure',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Set user in request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      iat: decoded.iat,
      exp: decoded.exp
    };

    // Log successful authentication
    if (req.log) {
      req.log.debug('User authenticated', { userId: decoded.id });
    }

    next();
  } catch (error) {
    // Log authentication failure
    logger.warn('Authentication failed', { 
      error: error.message,
      tokenExpired: error.name === 'TokenExpiredError',
      ip: req.ip
    });

    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Authentication token has expired',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid authentication token',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    if (error.name === 'NotBeforeError') {
      return res.status(401).json({ 
        error: {
          code: 'TOKEN_NOT_ACTIVE',
          message: 'Token not active yet',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Generic auth error
    return res.status(401).json({ 
      error: {
        code: 'AUTHENTICATION_FAILED',
        message: 'Authentication failed',
        timestamp: new Date().toISOString()
      }
    });
  }
};

/**
 * Optional authentication middleware
 * Sets req.user if token is valid, but doesn't fail if missing
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return next();
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token, process.env.JWT_SECRET);
    
    req.user = {
      id: decoded.id,
      email: decoded.email,
      iat: decoded.iat,
      exp: decoded.exp
    };
  } catch (error) {
    // In optional auth, we don't fail on invalid tokens
    logger.debug('Optional auth failed', { error: error.message });
  }
  
  next();
};

/**
 * Role-based authorization middleware
 * @param {Array<string>} roles - Required roles
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required for this resource',
          timestamp: new Date().toISOString()
        }
      });
    }

    // For future role implementation
    if (roles.length > 0 && !req.user.roles?.some(role => roles.includes(role))) {
      return res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Insufficient permissions for this resource',
          timestamp: new Date().toISOString()
        }
      });
    }

    next();
  };
};

module.exports = { 
  auth, 
  generateTokens, 
  verifyToken,
  optionalAuth,
  authorize
};