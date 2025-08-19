/**
 * 🔧 CLIENT-SIDE USER NORMALIZATION UTILITY
 * Mirrors server-side normalization for consistency
 * @module utils/userNormalizer
 */

/**
 * Normalize user data from server response
 * @param {Object} user - Raw user object from server
 * @returns {Object} - Normalized user object for client use
 */
export const normalizeUserData = (user) => {
  if (!user) {
    throw new Error('User data is required for normalization');
  }

  return {
    // ✅ Core Identity
    id: user.id,
    email: user.email,
    username: user.username || user.name || user.display_name || user.first_name || 'User',
    firstName: user.first_name || user.firstName || user.username || '',
    lastName: user.last_name || user.lastName || '',
    
    // ✅ Role & Permissions  
    role: user.role || 'user',
    isAdmin: ['admin', 'super_admin'].includes(user.role || 'user'),
    isSuperAdmin: (user.role || 'user') === 'super_admin',
    
    // ✅ Verification Status
    email_verified: user.email_verified || user.emailVerified || false,
    
    // ✅ Preferences - FIXED defaults to match user requirements
    language_preference: user.language_preference || user.languagePreference || 'en',
    theme_preference: user.theme_preference || user.themePreference || 'system',
    currency_preference: user.currency_preference || user.currencyPreference || 'ILS',
    onboarding_completed: user.onboarding_completed || user.onboardingCompleted || false,
    preferences: user.preferences || {},
    
    // ✅ Timestamps
    created_at: user.created_at || user.createdAt || new Date().toISOString(),
    createdAt: user.created_at || user.createdAt || new Date().toISOString(),
    updated_at: user.updated_at || user.updatedAt || new Date().toISOString(),
    last_login: user.last_login || user.lastLogin || new Date().toISOString(),
    
    // ✅ Optional Profile Data
    avatar: user.avatar || null,
    profile_picture_url: user.profile_picture_url || null,
    profilePicture: user.profile_picture_url || user.avatar || null, // Unified profile picture access
    phone: user.phone || '',
    bio: user.bio || '',
    location: user.location || '',
    website: user.website || '',
    birthday: user.birthday || null,
    isPremium: user.isPremium || false,
    
    // ✅ OAuth Fields
    oauth_provider: user.oauth_provider || null,
    google_id: user.google_id || null,
    oauth_provider_id: user.oauth_provider_id || null,
    
    // ✅ Password Status - CRITICAL for auth detection
    hasPassword: user.hasPassword || user.has_password || false,
    has_password: user.hasPassword || user.has_password || false
  };
};