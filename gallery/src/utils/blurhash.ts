import { encode } from 'blurhash';

import { loadImage, type ImageSource } from './image';

/**
 * Generates a BlurHash from an image file path or its contents as a Buffer
 * @param source - Path to the image file or its contents as a Buffer
 * @param componentX - Number of x components (default: 4)
 * @param componentY - Number of y components (default: 3)
 * @returns Promise resolving to BlurHash string
 */
export async function generateBlurHash(
  source: ImageSource,
  componentX: number = 4,
  componentY: number = 3,
): Promise<string> {
  const image = await loadImage(source);

  // Resize to small size for BlurHash computation to improve performance
  // BlurHash doesn't need high resolution
  const { data, info } = await image
    .resize(32, 32, { fit: 'inside' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Convert to Uint8ClampedArray format expected by blurhash
  const pixels = new Uint8ClampedArray(data.buffer);

  // Generate BlurHash
  return encode(pixels, info.width, info.height, componentX, componentY);
}
