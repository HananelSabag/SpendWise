/**
 * Supabase Storage Service
 * Handles file uploads to Supabase Storage buckets
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Extract Supabase URL from DATABASE_URL if SUPABASE_URL is not set
const getSupabaseUrl = () => {
  if (process.env.SUPABASE_URL) {
    return process.env.SUPABASE_URL;
  }
  
  // Extract from DATABASE_URL: postgres://postgres:[YOUR-PASSWORD]@db.obsycususrdabscpuhmt.supabase.co:5432/postgres
  if (process.env.DATABASE_URL) {
    const match = process.env.DATABASE_URL.match(/db\.([a-z]+)\.supabase\.co/);
    if (match) {
      return `https://${match[1]}.supabase.co`;
    }
  }
  
  throw new Error('SUPABASE_URL or DATABASE_URL with Supabase host required');
};

// Create Supabase client
const supabase = createClient(
  getSupabaseUrl(),
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

/**
 * Upload profile picture to Supabase Storage
 * @param {Object} file - Multer file object
 * @param {number} userId - User ID for filename
 * @returns {Promise<Object>} Upload result with public URL
 */
const uploadProfilePicture = async (file, userId) => {
  try {
    // Generate unique filename
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const fileExtension = file.originalname.split('.').pop().toLowerCase();
    const fileName = `profile-${userId}-${uniqueSuffix}.${fileExtension}`;
    
    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
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
    const { data: publicUrlData } = supabase.storage
      .from('profiles')
      .getPublicUrl(fileName);

    console.log('✅ [SUPABASE STORAGE] Profile picture uploaded:', {
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
    console.error('❌ [SUPABASE STORAGE] Upload failed:', error);
    throw error;
  }
};

/**
 * Delete profile picture from Supabase Storage
 * @param {string} fileName - File name to delete
 * @returns {Promise<void>}
 */
const deleteProfilePicture = async (fileName) => {
  try {
    const { error } = await supabase.storage
      .from('profiles')
      .remove([fileName]);

    if (error) {
      console.warn('⚠️ [SUPABASE STORAGE] Delete failed:', error.message);
    } else {
      console.log('✅ [SUPABASE STORAGE] File deleted:', fileName);
    }
  } catch (error) {
    console.warn('⚠️ [SUPABASE STORAGE] Delete error:', error.message);
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
    console.warn('⚠️ [SUPABASE STORAGE] Could not extract filename from URL:', url);
    return null;
  }
};

module.exports = {
  uploadProfilePicture,
  deleteProfilePicture,
  extractFileNameFromUrl
}; 