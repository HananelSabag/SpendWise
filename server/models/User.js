/**
 * 👤 USER MODEL - SIMPLIFIED & FUNCTIONAL
 * Core user management without over-engineering
 * @version 2.1.0 - SIMPLIFIED FOR STABILITY
 */

const db = require('../config/db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const errorCodes = require('../utils/errorCodes');
const logger = require('../utils/logger');

// ✅ Simple User Cache (no complex LRU)
class UserCache {
  static cache = new Map();
  static TTL = 10 * 60 * 1000; // 10 minutes

  static get(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  static set(key, data) {
    // ✅ Cleanup old entries if cache is getting large
    if (this.cache.size >= 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    // ✅ Store a DEEP COPY to prevent reference corruption
    this.cache.set(key, {
      data: JSON.parse(JSON.stringify(data)), // Deep copy via JSON
      timestamp: Date.now()
    });
  }

  static invalidate(pattern) {
    for (const [key] of this.cache) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  static clear() {
    this.cache.clear();
  }
}

// ✅ Simplified User Model - Core Functionality Only
class User {
  // Create user with basic validation
  static async create(email, username, password) {
    try {
      // Basic password validation
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');

      const query = `
        INSERT INTO users (
          email, username, password_hash, verification_token,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING id, email, username, created_at, updated_at, email_verified
      `;

      const values = [
        email.toLowerCase(),
        username?.toLowerCase(),
        hashedPassword,
        verificationToken
      ];

      const result = await db.query(query, values);
      const user = result.rows[0];

      // Cache the new user
      UserCache.set(`user:${user.id}`, user);
      UserCache.set(`user:email:${user.email}`, user);

      logger.info('User created successfully', { userId: user.id, email: user.email });

      return {
        ...user,
        verificationToken // Return for email verification
      };
    } catch (error) {
      logger.error('User creation failed', { error: error.message, email });
      
      if (error.code === '23505') { // Unique violation
        if (error.detail.includes('email')) {
          throw new Error('Email already exists');
        }
        if (error.detail.includes('username')) {
          throw new Error('Username already exists');
        }
      }
      
      throw error;
    }
  }

  // Find user by ID with caching
  static async findById(userId) {
    try {
      // Check cache first
      const cacheKey = `user:${userId}`;
      let user = UserCache.get(cacheKey);

      if (user) {
        return user;
      }

      const query = `
        SELECT 
          id, email, username, role, email_verified, is_active,
          last_login_at, created_at, updated_at,
          first_name, last_name, avatar, phone, bio, location,
          website, birthday, preferences
        FROM users 
        WHERE id = $1 AND is_active = true
      `;

      const result = await db.query(query, [userId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      user = result.rows[0];
      
      // Parse JSON fields safely
      if (user.preferences) {
        try {
          user.preferences = JSON.parse(user.preferences);
        } catch (e) {
          user.preferences = {};
        }
      }

      // Add computed fields that client expects
      user.isAdmin = ['admin', 'super_admin'].includes(user.role);
      user.isSuperAdmin = user.role === 'super_admin';
      user.name = user.username || user.first_name || 'User'; // Fallback for name field
      
      // Normalize field names for client compatibility
      user.firstName = user.first_name || '';
      user.lastName = user.last_name || '';
      user.emailVerified = user.email_verified;
      user.createdAt = user.created_at;
      user.updatedAt = user.updated_at;
      user.lastLogin = user.last_login_at;

      // Cache the result
      UserCache.set(cacheKey, user);

      return user;
    } catch (error) {
      logger.error('User retrieval failed', { userId, error: error.message });
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      // Check cache first
      const cacheKey = `user:email:${email.toLowerCase()}`;
      let user = UserCache.get(cacheKey);

      if (user) {
        // 🔍 DEBUG: Log what we got from cache
        console.log('🔍 DEBUG: User from CACHE:', {
          email: user?.email,
          hasPasswordHash: !!user?.password_hash,
          passwordHashLength: user?.password_hash?.length,
          oauthProvider: user?.oauth_provider,
          cacheKey: cacheKey
        });
        return user;
      }

      const query = `
        SELECT 
          id, email, username, password_hash, role, email_verified, is_active,
          last_login_at, created_at, updated_at,
          first_name, last_name, avatar, phone, bio, location,
          website, birthday, preferences, login_attempts, locked_until,
          oauth_provider, google_id, onboarding_completed,
          language_preference, theme_preference, currency_preference
        FROM users 
        WHERE email = $1
      `;

      const result = await db.query(query, [email.toLowerCase()]);
      
      if (result.rows.length === 0) {
        return null;
      }

      user = result.rows[0];
      
      // 🔍 DEBUG: Log what we got from DATABASE
      console.log('🔍 DEBUG: User from DATABASE:', {
        email: user?.email,
        hasPasswordHash: !!user?.password_hash,
        passwordHashLength: user?.password_hash?.length,
        oauthProvider: user?.oauth_provider,
        willCacheKey: cacheKey
      });
      
      // Parse JSON fields safely
      if (user.preferences) {
        try {
          user.preferences = JSON.parse(user.preferences);
        } catch (e) {
          user.preferences = {};
        }
      }

      // Add computed fields that client expects (same as in findById)
      user.isAdmin = ['admin', 'super_admin'].includes(user.role);
      user.isSuperAdmin = user.role === 'super_admin';
      user.name = user.username || user.first_name || 'User'; // Fallback for name field

      // Normalize field names for client compatibility (same as in findById)
      user.firstName = user.first_name || '';
      user.lastName = user.last_name || '';
      user.emailVerified = user.email_verified;
      user.createdAt = user.created_at;
      user.updatedAt = user.updated_at;
      user.lastLogin = user.last_login_at;

      // Convert dates to ISO strings for consistency
      if (user.created_at) user.created_at = user.created_at.toISOString();
      if (user.updated_at) user.updated_at = user.updated_at.toISOString();
      if (user.last_login_at) user.last_login_at = user.last_login_at.toISOString();
      if (user.locked_until) user.locked_until = user.locked_until.toISOString();
      if (user.birthday) user.birthday = user.birthday.toISOString();

      // Cache the result
      UserCache.set(cacheKey, user);
      UserCache.set(`user:${user.id}`, user);
      
      // 🔍 DEBUG: Verify what was cached
      const cachedAfterSet = UserCache.get(cacheKey);
      console.log('🔍 DEBUG: User AFTER caching:', {
        email: cachedAfterSet?.email,
        hasPasswordHash: !!cachedAfterSet?.password_hash,
        passwordHashLength: cachedAfterSet?.password_hash?.length,
        oauthProvider: cachedAfterSet?.oauth_provider,
        cacheKey: cacheKey
      });

      return user;
    } catch (error) {
      logger.error('User retrieval by email failed', { email, error: error.message });
      throw error;
    }
  }

  // Authenticate user
  static async authenticate(email, password) {
    try {
      // Find user by email
      const user = await this.findByEmail(email);
      
      // 🔍 DEBUG: Log the exact user data we got
      console.log('🔍 DEBUG: User found:', {
        email: user?.email,
        hasPasswordHash: !!user?.password_hash,
        passwordHashLength: user?.password_hash?.length,
        oauthProvider: user?.oauth_provider,
        googleId: user?.google_id,
        isActive: user?.is_active,
        emailVerified: user?.email_verified
      });

      if (!user) {
        throw new Error('Invalid email or password');
      }

      if (!user.is_active) {
        throw new Error('Account is deactivated');
      }

      // 🔍 DEBUG: Check user authentication methods
      const hasPassword = !!user.password_hash;
      const isGoogleUser = user.oauth_provider === 'google' || !!user.google_id;
      
      console.log('🔍 DEBUG: Authentication methods available:', {
        hasPassword: hasPassword,
        isGoogleUser: isGoogleUser,
        oauthProvider: user.oauth_provider,
        googleId: user.google_id ? 'EXISTS' : 'NULL'
      });

      // ✅ HYBRID LOGIN SUPPORT: Handle different authentication scenarios
      if (!password) {
        // No password provided - suggest appropriate login method
        if (isGoogleUser && !hasPassword) {
          throw new Error('This account uses Google sign-in. Please use the Google login button.');
        } else if (!hasPassword) {
          throw new Error('Password is required for this account.');
        } else {
          throw new Error('Password is required.');
        }
      }
      
      // ✅ PASSWORD LOGIN ATTEMPT: Check if password authentication is possible
      if (!hasPassword) {
        if (isGoogleUser) {
          // Google user without password - provide helpful guidance
          throw new Error(`This account was created with Google sign-in. To use email/password login, please:
1. Sign in with Google first
2. Go to Settings → Security → Set Password
3. Then you can use either login method`);
        } else {
          // Regular user without password - account setup issue
          throw new Error('Password not set for this account. Please reset your password or contact support.');
        }
      }
      
      // ✅ HYBRID LOGIN SUCCESS: User has password, allow login regardless of OAuth provider
      console.log('✅ Password authentication available - proceeding with login');

      // Password validation already handled above - proceed with password verification

      // 🔍 DEBUG: About to compare passwords
      console.log('🔍 DEBUG: About to compare passwords:', {
        providedPasswordLength: password?.length,
        storedHashLength: user.password_hash?.length,
        hashStartsWith: user.password_hash?.substring(0, 7)
      });

      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        // Increment failed login attempts
        await this.incrementLoginAttempts(user.id);
        throw new Error('Invalid credentials');
      }

      // Reset login attempts on successful login
      await this.resetLoginAttempts(user.id);

      // Update last login
      await this.updateLastLogin(user.id);

      // Remove sensitive data
      delete user.password_hash;
      delete user.login_attempts;
      delete user.locked_until;

      logger.info('User authenticated successfully', { userId: user.id, email: user.email });

      return user;
    } catch (error) {
      logger.error('Authentication failed', { email, error: error.message });
      throw error;
    }
  }

  // Update user
  static async update(userId, updateData) {
    try {
      const allowedFields = [
        'email', 'username', 'password_hash', 'email_verified', 'role',
        'first_name', 'last_name', 'avatar', 'phone', 'bio', 'location',
        'website', 'birthday', 'preferences', 'is_active', 'last_login_at',
        'login_attempts', 'locked_until', 'google_id', 'oauth_provider', 
        'oauth_provider_id', 'profile_picture_url', 'onboarding_completed',
        'language_preference', 'theme_preference', 'currency_preference'
      ];

      const updates = {};
      const values = [];
      let paramCount = 1;

      // Build dynamic update query
      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key)) {
          updates[key] = `$${paramCount}`;
          values.push(key === 'preferences' ? JSON.stringify(value) : value);
          paramCount++;
        }
      }

      if (Object.keys(updates).length === 0) {
        throw new Error('No valid fields to update');
      }

      // Add updated_at
      updates.updated_at = 'NOW()';

      const setClause = Object.entries(updates)
        .map(([key, placeholder]) => `${key} = ${placeholder}`)
        .join(', ');

      const query = `
        UPDATE users 
        SET ${setClause}
        WHERE id = $${paramCount} AND is_active = true
        RETURNING id, email, username, role, email_verified,
                 first_name, last_name, avatar, phone, bio, location,
                 website, birthday, preferences, created_at, updated_at,
                 onboarding_completed, language_preference, theme_preference, currency_preference
      `;

      values.push(userId);
      const result = await db.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = result.rows[0];

      // Parse preferences
      if (user.preferences) {
        try {
          user.preferences = JSON.parse(user.preferences);
        } catch (e) {
          user.preferences = {};
        }
      }

      // Add computed fields
      user.isAdmin = ['admin', 'super_admin'].includes(user.role);
      user.isSuperAdmin = user.role === 'super_admin';
      user.name = user.username || user.first_name || 'User';
      
      // Normalize field names
      user.firstName = user.first_name || '';
      user.lastName = user.last_name || '';
      user.emailVerified = user.email_verified;
      user.createdAt = user.created_at;
      user.updatedAt = user.updated_at;

      // Invalidate cache
      UserCache.invalidate(userId);

      // Cache updated user
      UserCache.set(`user:${userId}`, user);

      logger.info('User updated successfully', { userId });

      return user;
    } catch (error) {
      logger.error('User update failed', { userId, error: error.message });
      throw error;
    }
  }

  // Security helper methods
  static async incrementLoginAttempts(userId) {
    const query = `
      UPDATE users 
      SET 
        login_attempts = COALESCE(login_attempts, 0) + 1,
        locked_until = CASE 
          WHEN COALESCE(login_attempts, 0) + 1 >= 5 
          THEN NOW() + INTERVAL '30 minutes'
          ELSE locked_until
        END
      WHERE id = $1
    `;

    await db.query(query, [userId]);
  }

  static async resetLoginAttempts(userId) {
    const query = `
      UPDATE users 
      SET login_attempts = 0, locked_until = NULL
      WHERE id = $1
    `;

    await db.query(query, [userId]);
  }

  static async updateLastLogin(userId) {
    const query = `
      UPDATE users 
      SET last_login_at = NOW()
      WHERE id = $1
    `;

    await db.query(query, [userId]);
  }

  // ✅ CRITICAL: Add the missing getExportData method that exportController.js expects
  static async getExportData(userId) {
    try {
      const user = await this.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get user's transactions for export
      const transactionsQuery = `
        SELECT 
          t.id, t.type, t.amount, t.description, t.category_id,
          t.created_at, t.updated_at,
          c.name as category_name, c.icon as category_icon
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = $1
        ORDER BY t.created_at DESC
      `;

      const transactionsResult = await db.query(transactionsQuery, [userId]);

      // Get user's categories
      const categoriesQuery = `
        SELECT id, name, icon, color, type
        FROM categories
        WHERE user_id = $1 OR user_id IS NULL
        ORDER BY name
      `;

      const categoriesResult = await db.query(categoriesQuery, [userId]);

      return {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          createdAt: user.created_at,
          preferences: user.preferences
        },
        transactions: transactionsResult.rows,
        categories: categoriesResult.rows,
        exportDate: new Date().toISOString(),
        totalTransactions: transactionsResult.rows.length
      };
    } catch (error) {
      logger.error('Export data retrieval failed', { userId, error: error.message });
      throw error;
    }
  }

  // Find user by Google ID
  static async findByGoogleId(googleId) {
    try {
      const cacheKey = `user:google:${googleId}`;
      let user = UserCache.get(cacheKey);

      if (user) {
        return user;
      }

      const query = `
        SELECT 
          id, email, username, role, email_verified, is_active,
          last_login_at, created_at, updated_at,
          first_name, last_name, avatar, phone, bio, location,
          website, birthday, preferences, google_id, oauth_provider,
          oauth_provider_id, profile_picture_url
        FROM users 
        WHERE google_id = $1 AND is_active = true
      `;

      const result = await db.query(query, [googleId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      user = result.rows[0];
      
      // Parse JSON fields safely
      if (user.preferences) {
        try {
          user.preferences = JSON.parse(user.preferences);
        } catch (e) {
          user.preferences = {};
        }
      }

      // Add computed fields
      user.isAdmin = ['admin', 'super_admin'].includes(user.role);
      user.isSuperAdmin = user.role === 'super_admin';
      user.name = user.first_name && user.last_name ? 
        `${user.first_name} ${user.last_name}` : 
        user.username || user.first_name || 'User';
      
      // Normalize field names for client compatibility
      user.firstName = user.first_name || '';
      user.lastName = user.last_name || '';
      user.emailVerified = user.email_verified;
      user.createdAt = user.created_at;
      user.updatedAt = user.updated_at;
      user.lastLogin = user.last_login_at;
      user.profilePicture = user.profile_picture_url || user.avatar;

      // Cache the result
      UserCache.set(cacheKey, user);

      return user;
    } catch (error) {
      logger.error('User retrieval by Google ID failed', { googleId, error: error.message });
      throw error;
    }
  }

  // Create user with OAuth provider info
  static async createWithOAuth(email, username, password, oauthData = {}) {
    try {
      // Validate required fields
      if (!email || !username || !password) {
        throw new Error('Email, username, and password are required');
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');

      const query = `
        INSERT INTO users (
          email, username, password_hash, verification_token,
          google_id, oauth_provider, oauth_provider_id, profile_picture_url,
          first_name, last_name, email_verified, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        RETURNING id, email, username, created_at, updated_at, email_verified, oauth_provider
      `;

      const values = [
        email.toLowerCase(),
        username?.toLowerCase(),
        hashedPassword,
        verificationToken,
        oauthData.google_id || null,
        oauthData.oauth_provider || 'local',
        oauthData.oauth_provider_id || null,
        oauthData.profile_picture_url || null,
        oauthData.first_name || null,
        oauthData.last_name || null,
        oauthData.email_verified || false
      ];

      const result = await db.query(query, values);
      const user = result.rows[0];

      // Invalidate relevant caches
      UserCache.invalidate(`email:${email.toLowerCase()}`);
      if (oauthData.google_id) {
        UserCache.invalidate(`google:${oauthData.google_id}`);
      }

      logger.info('✅ User created with OAuth', {
        userId: user.id,
        email: user.email,
        provider: user.oauth_provider
      });

      return user;
    } catch (error) {
      logger.error('❌ User creation with OAuth failed', {
        email,
        error: error.message
      });

      // Handle unique constraint violations
      if (error.code === '23505') {
        if (error.detail.includes('email')) {
          throw new Error('Email already exists');
        }
        if (error.detail.includes('username')) {
          throw new Error('Username already exists');
        }
        if (error.detail.includes('google_id')) {
          throw new Error('Google account already linked to another user');
        }
      }
      
      throw error;
    }
  }

  // Cache management
  static clearCache() {
    UserCache.clear();
  }

  static getCacheStats() {
    return {
      size: UserCache.cache.size
    };
  }

  // ✅ ADD: Mark onboarding as complete
  static async markOnboardingComplete(userId) {
    try {
      console.log('🎯 User.markOnboardingComplete called for userId:', userId);
      
      if (!userId) {
        throw new Error('User ID is required');
      }

      const user = await this.update(userId, {
        onboarding_completed: true
        // Note: onboarding_completed_at field doesn't exist in DB
      });

      if (!user) {
        throw new Error('Failed to update user - user not found');
      }

      console.log('✅ User.markOnboardingComplete successful:', {
        userId,
        onboarding_completed: user.onboarding_completed
      });

      logger.info('✅ User onboarding marked as complete', { userId });
      return user;
    } catch (error) {
      console.error('❌ User.markOnboardingComplete failed:', {
        userId,
        error: error.message,
        stack: error.stack
      });
      logger.error('❌ Failed to mark onboarding complete', { userId, error: error.message });
      throw error;
    }
  }

  // Soft delete
  static async delete(userId) {
    const query = `
      UPDATE users 
      SET 
        is_active = false,
        deleted_at = NOW(),
        email = email || '.deleted.' || id,
        username = username || '.deleted.' || id
      WHERE id = $1
      RETURNING id
    `;

    const result = await db.query(query, [userId]);
    
    if (result.rows.length > 0) {
      UserCache.invalidate(userId);
      logger.info('User soft deleted', { userId });
    }

    return result.rows.length > 0;
  }
}

module.exports = {
  User,
  UserCache
}; 