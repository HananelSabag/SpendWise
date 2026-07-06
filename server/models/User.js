/**
 * 👤 USER MODEL - SIMPLIFIED & FUNCTIONAL
 * Core user management without over-engineering
 * @version 2.1.0 - SIMPLIFIED FOR STABILITY
 */

const db = require('../config/db');
const bcrypt = require('bcrypt');
const { generateVerificationToken } = require('../utils/tokenGenerator');
const errorCodes = require('../utils/errorCodes');
const logger = require('../utils/logger');
const { UserCache } = require('./UserCache');

// ✅ Simplified User Model - Core Functionality Only
class User {
  // Create user with basic validation
  static async create(email, username, password, { firstName = null, lastName = null } = {}) {
    try {
      // Basic password validation
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Generate verification token
      const verificationToken = generateVerificationToken();

      const query = `
        INSERT INTO users (
          email, username, password_hash, verification_token,
          first_name, last_name,
          language_preference, currency_preference, theme_preference,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING id, email, username, first_name, last_name, created_at, updated_at,
                  email_verified, language_preference, currency_preference, theme_preference
      `;

      const values = [
        email.toLowerCase(),
        username?.toLowerCase(),
        hashedPassword,
        verificationToken,
        firstName || null,
        lastName  || null,
        'en',
        'ILS',
        'system'
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
          id, email, username, password_hash, role, email_verified, is_active,
          last_login_at, created_at, updated_at,
          first_name, last_name, avatar, phone, bio, location,
          website, birthday, preferences,
          language_preference, theme_preference, currency_preference,
          oauth_provider, google_id, oauth_provider_id, profile_picture_url,
          onboarding_completed, login_attempts, locked_until, verification_token,
          billing_cycle_day
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
          user.preferences = typeof user.preferences === 'string' ? JSON.parse(user.preferences) : user.preferences;
        } catch (e) {
          user.preferences = {};
        }
      }

      // Add computed fields that client expects (same as in findByEmail)
      user.isAdmin = ['admin', 'super_admin'].includes(user.role);
      user.isSuperAdmin = user.role === 'super_admin';
      user.name = user.username || user.first_name || 'User'; // Fallback for name field
      
      // ✅ Add computed fields for authentication (same as in findByEmail)
      user.hasPassword = !!(user.password_hash && user.password_hash.length > 0); // ✅ CRITICAL: Check length > 0 for empty strings
      user.has_password = !!(user.password_hash && user.password_hash.length > 0); // Snake case version


      // Normalize field names for client compatibility (same as in findByEmail)
      user.firstName = user.first_name || '';
      user.lastName = user.last_name || '';
      user.emailVerified = user.email_verified;
      user.createdAt = user.created_at;
      user.updatedAt = user.updated_at;
      user.lastLogin = user.last_login_at;

      // Convert dates to ISO strings for consistency (same as in findByEmail)
      if (user.created_at) user.created_at = user.created_at.toISOString();
      if (user.updated_at) user.updated_at = user.updated_at.toISOString();
      if (user.last_login_at) user.last_login_at = user.last_login_at.toISOString();
      if (user.locked_until) user.locked_until = user.locked_until.toISOString();
      if (user.birthday) user.birthday = user.birthday.toISOString();

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
        return user;
      }

      const query = `
        SELECT 
          id, email, username, password_hash, role, email_verified, is_active,
          last_login_at, created_at, updated_at,
          first_name, last_name, avatar, phone, bio, location,
          website, birthday, preferences, login_attempts, locked_until,
          oauth_provider, google_id, oauth_provider_id, profile_picture_url,
          onboarding_completed, verification_token,
          language_preference, theme_preference, currency_preference,
          billing_cycle_day
        FROM users
        WHERE email = $1
      `;

      const result = await db.query(query, [email.toLowerCase()]);
      
      if (result.rows.length === 0) {
        return null;
      }

      user = result.rows[0];
      
      // Parse JSON fields safely
      if (user.preferences) {
        try {
          user.preferences = typeof user.preferences === 'string' ? JSON.parse(user.preferences) : user.preferences;
        } catch (e) {
          user.preferences = {};
        }
      }

      // Add computed fields that client expects (same as in findById)
      user.isAdmin = ['admin', 'super_admin'].includes(user.role);
      user.isSuperAdmin = user.role === 'super_admin';
      user.name = user.username || user.first_name || 'User'; // Fallback for name field

      // ✅ Add computed fields for authentication (same as in findById)
      user.hasPassword = !!(user.password_hash && user.password_hash.length > 0); // ✅ CRITICAL: Check length > 0 for empty strings
      user.has_password = !!(user.password_hash && user.password_hash.length > 0); // Snake case version

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

      if (!user) {
        logger.debug('Authentication failed: User not found', { email });
        throw new Error('Invalid email or password');
      }

      if (!user.is_active) {
        logger.warn('Authentication failed: Account deactivated', { email, userId: user.id });
        throw { ...errorCodes.ACCOUNT_DEACTIVATED };
      }

      // ✅ Check user authentication methods  
      const hasPassword = !!(user.password_hash && user.password_hash.length > 0);
      const isGoogleUser = user.oauth_provider === 'google' || !!user.google_id;
      const isHybridUser = hasPassword && isGoogleUser;

      // ✅ HYBRID SYSTEM: Users with both password and Google ID can use either method

      // ✅ HYBRID LOGIN SUPPORT: Handle different authentication scenarios
      if (!password) {
        // No password provided - suggest appropriate login method
        if (isGoogleUser && !hasPassword) {
          throw { ...errorCodes.GOOGLE_ONLY_USER };
        } else if (!hasPassword) {
          throw { ...errorCodes.PASSWORD_NOT_SET };
        } else {
          throw { ...errorCodes.MISSING_REQUIRED, message: 'Password is required' };
        }
      }
      
      // ✅ PASSWORD LOGIN ATTEMPT: Check if password authentication is possible
      if (!hasPassword) {
        if (isGoogleUser) {
          // Google user without password - provide helpful guidance
          logger.info('Password login attempt for Google-only user', { email, userId: user.id });
          throw { ...errorCodes.GOOGLE_ONLY_USER };
        } else {
          // Regular user without password - account setup issue
          logger.warn('Password login attempt for user without password', { email, userId: user.id });
          throw { ...errorCodes.PASSWORD_NOT_SET };
        }
      }
      
      // ✅ Log authentication type for monitoring
      if (isHybridUser) {
        logger.debug('✅ Hybrid user authentication (Google + password)');
      }
      
      // ✅ HYBRID LOGIN SUCCESS: User has password, allow login regardless of OAuth provider

      // Password validation already handled above - proceed with password verification

      // ✅ Password verification
      logger.debug('Attempting password verification', { 
        email, 
        userId: user.id, 
        hasPassword: !!password,
        passwordLength: password ? password.length : 0,
        hasHash: !!user.password_hash,
        hashLength: user.password_hash ? user.password_hash.length : 0
      });

      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        logger.warn('Authentication failed: Invalid password', { 
          email, 
          userId: user.id,
          passwordProvided: !!password,
          hashExists: !!user.password_hash
        });
        // Increment failed login attempts
        await this.incrementLoginAttempts(user.id);
        throw new Error('Invalid credentials');
      }

      // Reset login attempts on successful login
      await this.resetLoginAttempts(user.id);

      // Update last login
      await this.updateLastLogin(user.id);

      // ✅ SECURITY FIX: Create clean copy instead of mutating cached object
      // This prevents cache corruption that affects authentication detection
      const cleanUser = { ...user };
      delete cleanUser.password_hash;
      delete cleanUser.login_attempts;
      delete cleanUser.locked_until;

      logger.info('User authenticated successfully', { userId: user.id, email: user.email });

      return cleanUser;
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
        'language_preference', 'theme_preference', 'currency_preference',
        'billing_cycle_day'
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
        // Ignore empty updates gracefully for profile endpoint
        logger.warn('No valid fields in update request, returning current user', { userId });
        const current = await db.query(
          `SELECT id, email, username, role, email_verified,
                  first_name, last_name, avatar, phone, bio, location,
                  website, birthday, preferences, created_at, updated_at,
                  onboarding_completed, language_preference, theme_preference, currency_preference,
                  billing_cycle_day, google_id, oauth_provider, oauth_provider_id, profile_picture_url
           FROM users WHERE id = $1`,
          [userId]
        );
        if (current.rows.length === 0) {
          throw new Error('User not found');
        }
        const user = current.rows[0];
        if (user.preferences) {
          try { user.preferences = typeof user.preferences === 'string' ? JSON.parse(user.preferences) : user.preferences; } catch {}
        }
        return user;
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
                 onboarding_completed, language_preference, theme_preference, currency_preference,
                 billing_cycle_day, google_id, oauth_provider, oauth_provider_id, profile_picture_url
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
          user.preferences = typeof user.preferences === 'string' ? JSON.parse(user.preferences) : user.preferences;
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

  // 🆕 Create Google-only user WITHOUT password hash
  static async createGoogleOnlyUser(email, username, googleData = {}) {
    try {
      // Validate required fields
      if (!email || !username) {
        throw new Error('Email and username are required');
      }
      
      if (!googleData.google_id) {
        throw new Error('Google ID is required for Google-only user');
      }

      // Generate verification token
      const verificationToken = generateVerificationToken();

      const query = `
        INSERT INTO users (
          email, username, password_hash, verification_token, 
          email_verified, is_active, created_at, 
          google_id, oauth_provider, oauth_provider_id,
          profile_picture_url, avatar, first_name, last_name,
          language_preference, currency_preference, theme_preference,
          onboarding_completed
        ) VALUES (
          $1, $2, $3, $4, 
          $5, $6, NOW(), 
          $7, $8, $9,
          $10, $11, $12, $13,
          $14, $15, $16,
          $17
        ) RETURNING *
      `;

      const values = [
        email.toLowerCase(),
        username,
        '', // ✅ EMPTY STRING instead of NULL (satisfies NOT NULL constraint)
        verificationToken,
        true, // email_verified (Google verified)
        true, // is_active
        googleData.google_id,
        'google', // oauth_provider
        googleData.google_id, // oauth_provider_id
        googleData.picture || null,
        googleData.picture || null,
        googleData.first_name || '',
        googleData.last_name || '',
        'en', // language_preference
        'ILS', // currency_preference
        'system', // theme_preference
        false // onboarding_completed
      ];

      const result = await db.query(query, values);
      const user = result.rows[0];

      // Add computed fields
      user.firstName = user.first_name || '';
      user.lastName = user.last_name || '';
      user.profilePicture = user.profile_picture_url;
      user.hasPassword = !!(user.password_hash && user.password_hash.length > 0); // ✅ Should be false for empty string
      user.has_password = !!(user.password_hash && user.password_hash.length > 0);

      // Invalidate relevant caches
      UserCache.invalidate(`email:${email.toLowerCase()}`);
      UserCache.invalidate(`google:${googleData.google_id}`);

      logger.info('✅ Google-only user created (NO PASSWORD)', {
        userId: user.id,
        email: user.email,
        google_id: googleData.google_id
      });

      return user;
    } catch (error) {
      logger.error('❌ Google-only user creation failed', {
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

  // ✅ ADD: Mark onboarding as complete
  static async markOnboardingComplete(userId) {
    try {
      logger.debug('🎯 User.markOnboardingComplete called for userId:', userId);
      
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

      logger.debug('✅ User.markOnboardingComplete successful:', {
        userId,
        onboarding_completed: user.onboarding_completed
      });

      logger.info('✅ User onboarding marked as complete', { userId });
      return user;
    } catch (error) {
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
  User
};
