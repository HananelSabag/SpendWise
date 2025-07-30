/**
 * 🔧 USER DATA NORMALIZATION UTILITY
 * Centralized user data normalization for consistent client-server communication
 * @module utils/userNormalizer
 */

/**
 * Normalize user data for client consumption
 * Handles both snake_case (database) and camelCase (client) field naming
 * @param {Object} user - Raw user object from database
 * @returns {Object} - Normalized user object for client
 */
const normalizeUserData = (user) => {
  if (!user) {
    throw new Error('User data is required for normalization');
  }

  return {
    // ✅ Core Identity
    id: user.id,
    email: user.email,
    username: user.username || user.first_name || 'User',
    name: user.username || user.first_name || 'User', // Client expects 'name' field
    
    // ✅ Personal Info (both formats for compatibility)
    firstName: user.first_name || user.firstName || '',
    first_name: user.first_name || user.firstName || '',
    lastName: user.last_name || user.lastName || '',
    last_name: user.last_name || user.lastName || '',
    
    // ✅ Role & Permissions
    role: user.role || 'user',
    isAdmin: ['admin', 'super_admin'].includes(user.role || 'user'),
    isSuperAdmin: (user.role || 'user') === 'super_admin',
    
    // ✅ Verification Status (both formats)
    email_verified: user.email_verified || false,
    emailVerified: user.email_verified || false,
    
    // ✅ Onboarding (both formats)
    onboarding_completed: user.onboarding_completed || false,
    onboardingCompleted: user.onboarding_completed || false,
    
    // ✅ Preferences (both formats) - FIXED defaults
    language_preference: user.language_preference || 'en',
    languagePreference: user.language_preference || 'en',
    theme_preference: user.theme_preference || 'system',
    themePreference: user.theme_preference || 'system',
    currency_preference: user.currency_preference || 'shekel',
    currencyPreference: user.currency_preference || 'shekel',
    preferences: user.preferences || {},
    
    // ✅ Timestamps (both formats)
    created_at: user.created_at,
    createdAt: user.created_at,
    updated_at: user.updated_at,
    updatedAt: user.updated_at,
    last_login: user.last_login_at || user.last_login,
    lastLogin: user.last_login_at || user.last_login,
    
    // ✅ Optional Profile Data
    avatar: user.avatar || user.profile_picture_url || null,
    phone: user.phone || '',
    bio: user.bio || '',
    location: user.location || '',
    website: user.website || '',
    birthday: user.birthday || null,
    
    // ✅ OAuth Info
    oauth_provider: user.oauth_provider || 'local',
    google_id: user.google_id || null,
    
    // ✅ Account Status
    is_active: user.is_active !== false, // Default to true
    isPremium: user.isPremium || false
  };
};

/**
 * Normalize multiple users
 * @param {Array} users - Array of user objects
 * @returns {Array} - Array of normalized user objects
 */
const normalizeUsersData = (users) => {
  if (!Array.isArray(users)) {
    throw new Error('Users must be an array');
  }
  
  return users.map(normalizeUserData);
};

module.exports = {
  normalizeUserData,
  normalizeUsersData
};