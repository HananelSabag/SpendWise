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
    console.log('🔍 [SUPABASE STORAGE] Parsing DATABASE_URL:', process.env.DATABASE_URL.replace(/:[^@]*@/, ':***@'));
    const match = process.env.DATABASE_URL.match(/db\.([a-z0-9]+)\.supabase\.co/);
    if (match) {
      const projectId = match[1];
      const supabaseUrl = `https://${projectId}.supabase.co`;
      console.log('✅ [SUPABASE STORAGE] Extracted Supabase URL:', supabaseUrl);
      return supabaseUrl;
    } else {
      console.error('❌ [SUPABASE STORAGE] Could not parse Supabase URL from DATABASE_URL');
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
    console.log('✅ [SUPABASE STORAGE] Client initialized');
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
  console.log('🚀 [SUPABASE STORAGE] Starting upload:', {
    userId,
    fileInfo: {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      bufferLength: file.buffer?.length
    },
    envCheck: {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasAnonKey: !!process.env.SUPABASE_ANON_KEY
    }
  });

  try {
    // Generate unique filename
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const fileExtension = file.originalname.split('.').pop().toLowerCase();
    const fileName = `profile-${userId}-${uniqueSuffix}.${fileExtension}`;
    
    console.log('📝 [SUPABASE STORAGE] Generated filename:', fileName);
    
    // Upload file to Supabase Storage
    console.log('🔄 [SUPABASE STORAGE] Initializing client...');
    const supabaseClient = getSupabaseClient();
    
    console.log('📤 [SUPABASE STORAGE] Starting upload to bucket...');
    const { data, error } = await supabaseClient.storage
      .from('profiles')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ [SUPABASE STORAGE] Upload error details:', {
        error: error.message,
        statusCode: error.statusCode,
        details: error
      });
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    console.log('✅ [SUPABASE STORAGE] Upload successful, getting public URL...');

    // Get public URL
    const { data: publicUrlData } = supabaseClient.storage
      .from('profiles')
      .getPublicUrl(fileName);

    console.log('✅ [SUPABASE STORAGE] Profile picture uploaded successfully:', {
      fileName,
      publicUrl: publicUrlData.publicUrl,
      userId,
      uploadPath: data.path
    });

    return {
      fileName,
      publicUrl: publicUrlData.publicUrl,
      size: file.size,
      path: data.path
    };

  } catch (error) {
    console.error('❌ [SUPABASE STORAGE] Upload failed:', {
      message: error.message,
      stack: error.stack,
      userId,
      fileName: file.originalname
    });
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
    const supabaseClient = getSupabaseClient();
    const { error } = await supabaseClient.storage
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