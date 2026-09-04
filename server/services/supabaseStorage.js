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
const deleteProfilePicture = async (fileName) => {
  try {
    const supabaseClient = getSupabaseClient();
    const { error } = await supabaseClient.storage
      .from('profiles')
      .remove([fileName]);

    if (error) {
      logger.warn('⚠️ [SUPABASE STORAGE] Delete failed:', error.message);
    } else {
      logger.info('✅ [SUPABASE STORAGE] File deleted:', fileName);
    }
  } catch (error) {
    logger.warn('⚠️ [SUPABASE STORAGE] Delete error:', error.message);
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

// ─── Grocery receipts ────────────────────────────────────────────────────────
// Receipts are personal financial documents, so they go to a PRIVATE bucket.
// Nothing here ever returns a public URL: callers get an object path, and reads
// go through a short-lived signed URL minted for an authorised list member.

const RECEIPT_BUCKET = process.env.SUPABASE_RECEIPT_BUCKET || 'receipts';

const EXTENSION_BY_MIME = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

/**
 * Store a trip receipt.
 * @returns {Promise<{path: string, mime: string, size: number}>}
 */
const uploadGroceryReceipt = async (file, listId, tripId) => {
  const extension = EXTENSION_BY_MIME[file.mimetype];
  if (!extension) {
    throw new Error(`Unsupported receipt type: ${file.mimetype}`);
  }

  const path = `grocery/${listId}/${tripId}-${generateShortToken()}.${extension}`;
  const supabaseClient = getSupabaseClient();

  const { error } = await supabaseClient.storage
    .from(RECEIPT_BUCKET)
    .upload(path, file.buffer, {
      contentType: file.mimetype,
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Receipt upload failed: ${error.message}`);
  }

  // Deliberately logs the trip, not the path — a receipt path is a capability.
  logger.info('[SUPABASE STORAGE] Grocery receipt stored', { listId, tripId, size: file.size });

  return { path, mime: file.mimetype, size: file.size };
};

// Item photos are a picture of a yogurt tub, not a financial document, and they
// are re-read on every list refresh — so they live in a public bucket and the
// list stores a plain URL. Receipts do not; keep the two buckets separate.
const ITEM_IMAGE_BUCKET = process.env.SUPABASE_GROCERY_BUCKET || 'grocery';

/**
 * Store a product photo for a grocery item.
 * @returns {Promise<{publicUrl: string, path: string}>}
 */
const uploadGroceryItemImage = async (file, listId) => {
  const extension = EXTENSION_BY_MIME[file.mimetype];
  if (!extension || extension === 'pdf') {
    throw new Error(`Unsupported image type: ${file.mimetype}`);
  }

  const path = `items/${listId}/${generateShortToken()}.${extension}`;
  const supabaseClient = getSupabaseClient();

  const { error } = await supabaseClient.storage
    .from(ITEM_IMAGE_BUCKET)
    .upload(path, file.buffer, {
      contentType: file.mimetype,
      cacheControl: '86400',
      upsert: false,
    });

  if (error) {
    throw new Error(`Item image upload failed: ${error.message}`);
  }

  const { data } = supabaseClient.storage.from(ITEM_IMAGE_BUCKET).getPublicUrl(path);
  return { publicUrl: data.publicUrl, path };
};

/** Short-lived read URL for a stored receipt. Callers must authorise first. */
const createReceiptSignedUrl = async (path, expiresInSeconds = 300) => {
  const supabaseClient = getSupabaseClient();
  const { data, error } = await supabaseClient.storage
    .from(RECEIPT_BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  if (error) {
    throw new Error(`Could not sign receipt URL: ${error.message}`);
  }
  return data.signedUrl;
};

const deleteGroceryReceipt = async (path) => {
  try {
    const supabaseClient = getSupabaseClient();
    await supabaseClient.storage.from(RECEIPT_BUCKET).remove([path]);
  } catch (error) {
    logger.warn('[SUPABASE STORAGE] Receipt delete failed:', error.message);
  }
};

module.exports = {
  uploadProfilePicture,
  deleteProfilePicture,
  extractFileNameFromUrl,
  uploadGroceryReceipt,
  uploadGroceryItemImage,
  createReceiptSignedUrl,
  deleteGroceryReceipt,
  RECEIPT_BUCKET,
  ITEM_IMAGE_BUCKET,
}; 