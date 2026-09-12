/**
 * Supabase Storage Service
 * Handles file uploads to Supabase Storage buckets
 */

const { createClient } = require('@supabase/supabase-js');
const { generateShortToken } = require('../utils/tokenGenerator');
const logger = require('../utils/logger');

// Extract Supabase URL from DATABASE_URL if SUPABASE_URL is not set
const getSupabaseUrl = () => {
  if (process.env.SUPABASE_URL) {
    return process.env.SUPABASE_URL;
  }
  
  // Extract from DATABASE_URL: postgres://postgres:[YOUR-PASSWORD]@db.obsycususrdabscpuhmt.supabase.co:5432/postgres
  if (process.env.DATABASE_URL) {
    const match = process.env.DATABASE_URL.match(/db\.([a-z0-9]+)\.supabase\.co/);
    if (match) {
      return `https://${match[1]}.supabase.co`;
    }
  }
  
  throw new Error('SUPABASE_URL or DATABASE_URL with Supabase host required');
};

// Lazy Supabase client initialization
let supabase = null;
const getSupabaseClient = () => {
  if (!supabase) {
    const url = getSupabaseUrl();
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!key) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY required');
    }
    
    supabase = createClient(url, key);
  }
  
  return supabase;
};

/**
 * Upload profile picture to Supabase Storage
 * @param {Object} file - Multer file object
 * @param {number} userId - User ID for filename
 * @returns {Promise<Object>} Upload result with public URL
 */
const uploadProfilePicture = async (file, userId) => {
  try {
    // Generate unique filename
    const uniqueSuffix = generateShortToken();
    const fileExtension = file.originalname.split('.').pop().toLowerCase();
    const fileName = `profile-${userId}-${uniqueSuffix}.${fileExtension}`;
    
    // Upload file to Supabase Storage
    const supabaseClient = getSupabaseClient();
    const { data, error } = await supabaseClient.storage
      .from('profiles')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = supabaseClient.storage
      .from('profiles')
      .getPublicUrl(fileName);

    logger.info('✅ [SUPABASE STORAGE] Profile picture uploaded:', {
      fileName,
      publicUrl: publicUrlData.publicUrl,
      userId
    });

    return {
      fileName,
      publicUrl: publicUrlData.publicUrl,
      size: file.size,
      path: data.path
    };

  } catch (error) {
    logger.error('❌ [SUPABASE STORAGE] Upload failed:', error.message);
    throw error;
  }
};

/**
 * Delete profile picture from Supabase Storage
 * @param {string} fileName - File name to delete
 * @returns {Promise<void>}
 */
/**
 * Remove one stored picture. Answers whether it actually went.
 *
 * It used to swallow every failure as a warning and tell the caller nothing,
 * which is how 40 orphaned files accumulated in this bucket over a year
 * without anyone noticing: each replaced picture quietly stayed. A failure
 * here is not fatal to the request — the new upload still succeeds — but it
 * has to be visible, and `remove()` reporting zero removed paths has to count
 * as a failure rather than as success.
 *
 * The second argument to a winston call is metadata, not a format value: the
 * old `logger.info(msg, fileName)` spread the string into {"0":"p","1":"r",…},
 * which is a large part of why these log lines were never read.
 */
const deleteProfilePicture = async (fileName) => {
  try {
    const supabaseClient = getSupabaseClient();
    const { data, error } = await supabaseClient.storage
      .from('profiles')
      .remove([fileName]);

    if (error) {
      logger.error('[SUPABASE STORAGE] Profile picture delete failed', {
        fileName, reason: error.message,
      });
      return false;
    }

    // A remove() that matched nothing returns an empty array and no error,
    // which is indistinguishable from success unless it is checked.
    if (!data || data.length === 0) {
      logger.error('[SUPABASE STORAGE] Profile picture delete matched no object', { fileName });
      return false;
    }

    logger.info('[SUPABASE STORAGE] Profile picture deleted', { fileName });
    return true;
  } catch (error) {
    logger.error('[SUPABASE STORAGE] Profile picture delete threw', {
      fileName, reason: error.message,
    });
    return false;
  }
};

/**
 * Extract filename from Supabase Storage URL
 * @param {string} url - Supabase Storage public URL
 * @returns {string|null} - Filename or null
 */
const extractFileNameFromUrl = (url) => {
  if (!url || !url.includes('/storage/')) return null;
  
  try {
    const urlParts = url.split('/');
    return urlParts[urlParts.length - 1];
  } catch (error) {
    logger.warn('⚠️ [SUPABASE STORAGE] Could not extract filename from URL:', url);
    return null;
  }
};

module.exports = {
  uploadProfilePicture,
  deleteProfilePicture,
  extractFileNameFromUrl,
}; 