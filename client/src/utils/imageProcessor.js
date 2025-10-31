/**
 * 🖼️ IMAGE PROCESSOR UTILITY
 * Handles Live Photos, HEIC conversion, and image compression for profile uploads
 * @version 1.0.0
 */

/**
 * Check if file is a Live Photo (HEIC format)
 * @param {File} file - The file to check
 * @returns {boolean} True if it's a Live Photo
 */
export const isLivePhoto = (file) => {
  const livePhotoExtensions = ['heic', 'heif'];
  const extension = file.name.split('.').pop().toLowerCase();
  return livePhotoExtensions.includes(extension) || file.type.includes('heic') || file.type.includes('heif');
};

/**
 * Convert HEIC/Live Photo to JPEG using canvas
 * @param {File} file - The HEIC file
 * @returns {Promise<File>} Converted JPEG file
 */
const convertHeicToJpeg = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const img = new Image();
        img.onload = () => {
          // Create canvas and compress
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Resize if too large
          const maxDimension = 2048;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to convert image'));
                return;
              }
              
              // Create new file
              const convertedFile = new File(
                [blob],
                file.name.replace(/\.(heic|heif)$/i, '.jpg'),
                { type: 'image/jpeg' }
              );
              
              resolve(convertedFile);
            },
            'image/jpeg',
            0.85 // Quality
          );
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target.result;
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Compress image to reduce file size
 * @param {File} file - The image file to compress
 * @param {Object} options - Compression options
 * @returns {Promise<File>} Compressed file
 */
export const compressImage = async (file, options = {}) => {
  const {
    maxSizeMB = 2, // Target max size: 2MB
    maxWidthOrHeight = 2048, // Max dimension
    quality = 0.85, // JPEG quality
    fileType = 'image/jpeg' // Output type
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions
        if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
          if (width > height) {
            height = (height / width) * maxWidthOrHeight;
            width = maxWidthOrHeight;
          } else {
            width = (width / height) * maxWidthOrHeight;
            height = maxWidthOrHeight;
          }
        }
        
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        // Draw image
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        // Try compression with different quality levels
        const attemptCompression = (currentQuality) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Compression failed'));
                return;
              }
              
              const compressedSize = blob.size / (1024 * 1024); // Size in MB
              
              // If still too large and quality can be reduced, try again
              if (compressedSize > maxSizeMB && currentQuality > 0.5) {
                attemptCompression(currentQuality - 0.1);
                return;
              }
              
              // Create file from blob
              const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^/.]+$/, '') + '.jpg',
                { type: fileType }
              );
              
              resolve(compressedFile);
            },
            fileType,
            currentQuality
          );
        };
        
        attemptCompression(quality);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Process image for upload - handles Live Photos, HEIC, and compression
 * @param {File} file - The original file
 * @param {Object} options - Processing options
 * @returns {Promise<{file: File, wasProcessed: boolean, originalSize: number, newSize: number}>}
 */
export const processImageForUpload = async (file, options = {}) => {
  try {
    const originalSize = file.size;
    let processedFile = file;
    let wasProcessed = false;
    
    // Step 1: Check if it's a Live Photo / HEIC
    if (isLivePhoto(file)) {
      console.log('🔄 Detected Live Photo/HEIC, converting to JPEG...');
      processedFile = await convertHeicToJpeg(file);
      wasProcessed = true;
    }
    
    // Step 2: Check file size and compress if needed
    const fileSizeMB = processedFile.size / (1024 * 1024);
    const targetMaxSize = options.maxSizeMB || 5;
    
    if (fileSizeMB > targetMaxSize * 0.8 || wasProcessed) {
      // Compress if file is > 80% of limit OR if we converted from HEIC
      console.log(`🗜️ Compressing image (${fileSizeMB.toFixed(2)}MB)...`);
      processedFile = await compressImage(processedFile, {
        maxSizeMB: targetMaxSize * 0.9, // Target 90% of limit
        maxWidthOrHeight: options.maxWidthOrHeight || 2048,
        quality: options.quality || 0.85
      });
      wasProcessed = true;
    }
    
    const newSize = processedFile.size;
    const newSizeMB = newSize / (1024 * 1024);
    
    console.log(`✅ Image processed: ${(originalSize / 1024 / 1024).toFixed(2)}MB → ${newSizeMB.toFixed(2)}MB`);
    
    return {
      file: processedFile,
      wasProcessed,
      originalSize,
      newSize
    };
  } catch (error) {
    console.error('❌ Image processing error:', error);
    // Return original file if processing fails
    return {
      file,
      wasProcessed: false,
      originalSize: file.size,
      newSize: file.size,
      error: error.message
    };
  }
};

/**
 * Validate image file before upload
 * @param {File} file - The file to validate
 * @param {Object} options - Validation options
 * @returns {{valid: boolean, error: string|null}}
 */
export const validateImageFile = (file, options = {}) => {
  const {
    maxSizeMB = 10, // Max 10MB before processing
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  } = options;
  
  // Check if file exists
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }
  
  // Check file type
  const isAllowedType = allowedTypes.some(type => 
    file.type.includes(type.split('/')[1]) || 
    file.name.toLowerCase().endsWith(`.${type.split('/')[1]}`)
  );
  
  if (!isAllowedType) {
    return { 
      valid: false, 
      error: 'Invalid file type. Please select a JPEG, PNG, WebP, or HEIC image.' 
    };
  }
  
  // Check file size
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > maxSizeMB) {
    return { 
      valid: false, 
      error: `File too large (${fileSizeMB.toFixed(1)}MB). Maximum size is ${maxSizeMB}MB.` 
    };
  }
  
  return { valid: true, error: null };
};

export default {
  isLivePhoto,
  compressImage,
  processImageForUpload,
  validateImageFile
};

