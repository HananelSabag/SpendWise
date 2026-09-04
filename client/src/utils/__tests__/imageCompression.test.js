import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ITEM_PHOTO_PRESET,
  RECEIPT_PRESET,
  compressImage,
  isUploadableImage,
} from '../imageCompression';

const fileOf = (bytes, type, name = 'photo.jpg') =>
  new File([new Uint8Array(bytes)], name, { type });

/** Stand in for a decoded bitmap of a given size. */
const bitmapOf = (width, height) => ({ width, height, close: vi.fn() });

/**
 * jsdom has no real canvas, so drive the encode step directly: `toBlob` yields a
 * blob of whatever size the test asks for at each quality step.
 */
const stubCanvas = (sizesByCall) => {
  let call = 0;
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ({ drawImage: vi.fn() }),
    toDataURL: () => 'data:image/png;base64,', // no webp support → JPEG path
    toBlob: (cb, type, quality) => {
      const size = sizesByCall[Math.min(call, sizesByCall.length - 1)];
      call += 1;
      cb(new Blob([new Uint8Array(size)], { type }), type, quality);
    },
  };
  vi.spyOn(document, 'createElement').mockImplementation((tag) =>
    (tag === 'canvas' ? canvas : document.createElement.wrappedMethod?.call(document, tag) ?? canvas));
  return canvas;
};

afterEach(() => {
  vi.restoreAllMocks();
  delete globalThis.createImageBitmap;
});

describe('presets', () => {
  it('keeps receipts sharper than product thumbnails', () => {
    expect(RECEIPT_PRESET.maxDimension).toBeGreaterThan(ITEM_PHOTO_PRESET.maxDimension);
    expect(RECEIPT_PRESET.maxBytes).toBeGreaterThan(ITEM_PHOTO_PRESET.maxBytes);
  });

  it('targets a size that comfortably clears the upload limit', () => {
    // The server's ceiling is 20MB; a compressed photo should be orders below it.
    expect(ITEM_PHOTO_PRESET.maxBytes).toBeLessThan(1024 * 1024);
  });
});

describe('isUploadableImage', () => {
  it('accepts what the buckets and the server filter allow', () => {
    expect(isUploadableImage(fileOf(1, 'image/jpeg'))).toBe(true);
    expect(isUploadableImage(fileOf(1, 'image/png'))).toBe(true);
    expect(isUploadableImage(fileOf(1, 'image/webp'))).toBe(true);
  });

  it('rejects formats the browser could not convert', () => {
    expect(isUploadableImage(fileOf(1, 'image/heic'))).toBe(false);
    expect(isUploadableImage(fileOf(1, 'application/pdf'))).toBe(false);
    expect(isUploadableImage(undefined)).toBe(false);
  });
});

describe('compressImage', () => {
  it('leaves a non-image alone', async () => {
    const pdf = fileOf(10, 'application/pdf', 'receipt.pdf');
    await expect(compressImage(pdf)).resolves.toBe(pdf);
  });

  it('returns the original when the browser cannot decode it', async () => {
    globalThis.createImageBitmap = vi.fn().mockRejectedValue(new Error('unsupported'));
    const heic = fileOf(5_000_000, 'image/heic', 'IMG_1234.heic');

    await expect(compressImage(heic)).resolves.toBe(heic);
  });

  it('gives up rather than hanging when the decoder never answers', async () => {
    // No createImageBitmap, and an <img> that fires neither load nor error —
    // exactly what a silently-dropped format does. Without the timeout this
    // never resolves and the caller's upload spinner runs forever.
    vi.useFakeTimers();
    try {
      const heic = fileOf(5_000_000, 'image/heic', 'IMG_1234.heic');
      const pending = compressImage(heic);
      await vi.advanceTimersByTimeAsync(9000);
      await expect(pending).resolves.toBe(heic);
    } finally {
      vi.useRealTimers();
    }
  });

  it('skips re-encoding an image that is already small in both bytes and pixels', async () => {
    globalThis.createImageBitmap = vi.fn().mockResolvedValue(bitmapOf(800, 600));
    const small = fileOf(50 * 1024, 'image/jpeg');

    await expect(compressImage(small, ITEM_PHOTO_PRESET)).resolves.toBe(small);
  });

  it('shrinks a large phone photo and reports the new type', async () => {
    globalThis.createImageBitmap = vi.fn().mockResolvedValue(bitmapOf(4032, 3024));
    const canvas = stubCanvas([300 * 1024]);
    const huge = fileOf(15 * 1024 * 1024, 'image/jpeg', 'IMG_9999.jpeg');

    const result = await compressImage(huge, ITEM_PHOTO_PRESET);

    expect(result).not.toBe(huge);
    expect(result.size).toBeLessThan(huge.size);
    expect(result.type).toBe('image/jpeg');
    expect(result.name).toBe('IMG_9999.jpg');
    // Longest edge scaled to the preset, aspect ratio preserved.
    expect(canvas.width).toBe(ITEM_PHOTO_PRESET.maxDimension);
    expect(canvas.height).toBe(Math.round(3024 * (ITEM_PHOTO_PRESET.maxDimension / 4032)));
  });

  it('steps the quality down until the result fits the budget', async () => {
    globalThis.createImageBitmap = vi.fn().mockResolvedValue(bitmapOf(4000, 3000));
    // First two attempts overshoot; the third lands under maxBytes.
    const canvas = stubCanvas([2_000_000, 900_000, 400 * 1024]);
    const toBlob = vi.spyOn(canvas, 'toBlob');
    const huge = fileOf(15 * 1024 * 1024, 'image/jpeg');

    const result = await compressImage(huge, ITEM_PHOTO_PRESET);

    expect(toBlob).toHaveBeenCalledTimes(3);
    expect(result.size).toBeLessThanOrEqual(ITEM_PHOTO_PRESET.maxBytes);
    const qualities = toBlob.mock.calls.map((call) => call[2]);
    expect(qualities).toEqual([...qualities].sort((a, b) => b - a));
  });

  it('keeps the original when compression would make it bigger', async () => {
    globalThis.createImageBitmap = vi.fn().mockResolvedValue(bitmapOf(3000, 2000));
    stubCanvas([900 * 1024]);
    // An already-optimised 600KB image: re-encoding is a loss, not a win.
    const tight = fileOf(600 * 1024, 'image/jpeg');

    await expect(compressImage(tight, ITEM_PHOTO_PRESET)).resolves.toBe(tight);
  });

  it('rotates a portrait photo using its EXIF orientation', async () => {
    const decode = vi.fn().mockResolvedValue(bitmapOf(3000, 4000));
    globalThis.createImageBitmap = decode;
    stubCanvas([200 * 1024]);

    await compressImage(fileOf(9 * 1024 * 1024, 'image/jpeg'), ITEM_PHOTO_PRESET);

    expect(decode).toHaveBeenCalledWith(expect.any(File), { imageOrientation: 'from-image' });
  });
});
