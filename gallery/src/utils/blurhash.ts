import { encode } from 'blurhash';
import sharp from 'sharp';

/**
 * Generates a BlurHash from an image file or Sharp instance
 * @param imagePath - Path to image file or Sharp instance
 * @param componentX - Number of x components (default: 4)
 * @param componentY - Number of y components (default: 3)
 * @returns Promise resolving to BlurHash string
 */
export async function generateBlurHash(imagePath: string, componentX: number = 4, componentY: number = 3): Promise<string> {
  const image = sharp(imagePath);

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
