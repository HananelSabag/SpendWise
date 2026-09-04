/**
 * Shrink a photo in the browser before it is uploaded.
 *
 * A modern phone camera produces 10–20MB files, and none of that resolution
 * survives being drawn as a 40px thumbnail or read as a receipt. Compressing
 * here means the upload never hits a size limit, the storage bucket stays small,
 * and someone on mobile data isn't pushing 15MB up a slow link.
 *
 * Everything degrades safely: if the browser can't decode the file (an exotic
 * format, a corrupt image) the original is returned untouched and the server's
 * own validation has the final say.
 */

/** Photos of a product: shown at 40px in a row, ~256px when expanded. */
export const ITEM_PHOTO_PRESET = {
  maxDimension: 1400,
  maxBytes: 500 * 1024,
  quality: 0.82,
};

/** Receipts have to stay readable — small print, long columns of numbers. */
export const RECEIPT_PRESET = {
  maxDimension: 2400,
  maxBytes: 1500 * 1024,
  quality: 0.85,
};

/** What the storage buckets and the server's filter actually accept. */
export const UPLOADABLE_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export const isUploadableImage = (file) => UPLOADABLE_IMAGE_TYPES.includes(file?.type);

/** Ceiling on the legacy <img> decode path, which can hang instead of erroring. */
const DECODE_TIMEOUT_MS = 8000;

const canEncodeWebp = () => {
  try {
    return document
      .createElement('canvas')
      .toDataURL('image/webp')
      .startsWith('data:image/webp');
  } catch {
    return false;
  }
};

const canvasToBlob = (canvas, type, quality) =>
  new Promise((resolve) => canvas.toBlob(resolve, type, quality));

/** Decode with EXIF orientation applied, so portrait photos don't arrive sideways. */
const decode = async (file) => {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      // Older Safari rejects the options bag rather than ignoring it.
      try {
        return await createImageBitmap(file);
      } catch {
        return null;
      }
    }
  }

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    // A decoder that quietly drops a format fires neither load nor error, which
    // would leave the caller's spinner running forever. Give up and let the
    // original file through instead.
    const timer = setTimeout(() => finish(null), DECODE_TIMEOUT_MS);
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      URL.revokeObjectURL(url);
      resolve(value);
    };

    image.onload = () => finish(image);
    image.onerror = () => finish(null);
    image.src = url;
  });
};

/**
 * @param {File} file
 * @param {{maxDimension:number, maxBytes:number, quality:number}} preset
 * @returns {Promise<File>} the compressed file, or the original when it can't help
 */
export async function compressImage(file, preset = ITEM_PHOTO_PRESET) {
  if (!file?.type?.startsWith('image/')) return file;

  const source = await decode(file);
  if (!source) return file;

  const width = source.width || source.naturalWidth;
  const height = source.height || source.naturalHeight;
  if (!width || !height) return file;

  const scale = Math.min(1, preset.maxDimension / Math.max(width, height));
  const targetWidth = Math.round(width * scale);
  const targetHeight = Math.round(height * scale);

  // Already small enough in both bytes and pixels — re-encoding would only lose
  // detail for nothing.
  if (scale === 1 && file.size <= preset.maxBytes) {
    source.close?.();
    return file;
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext('2d');
  if (!context) {
    source.close?.();
    return file;
  }
  context.drawImage(source, 0, 0, targetWidth, targetHeight);
  source.close?.();

  const type = canEncodeWebp() ? 'image/webp' : 'image/jpeg';
  const extension = type === 'image/webp' ? 'webp' : 'jpg';

  // Step the quality down until it fits. Three tries is plenty: each one is a
  // large drop in size, and below ~0.5 the artefacts start to show.
  let blob = null;
  for (const quality of [preset.quality, 0.7, 0.55]) {
    blob = await canvasToBlob(canvas, type, quality);
    if (!blob) break;
    if (blob.size <= preset.maxBytes) break;
  }

  if (!blob || blob.size >= file.size) return file;

  const name = file.name.replace(/\.[^.]+$/, '') || 'photo';
  return new File([blob], `${name}.${extension}`, { type, lastModified: Date.now() });
}
