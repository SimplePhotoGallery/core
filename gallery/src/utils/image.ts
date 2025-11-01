import sharp from 'sharp';

import type { Dimensions, ImageWithMetadata } from '../types';
import type { FormatEnum, Metadata, Sharp } from 'sharp';

/**
 * Loads an image and auto-rotates it based on EXIF orientation.
 * @param imagePath - Path to the image file
 * @returns Promise resolving to Sharp image instance
 */
export async function loadImage(imagePath: string): Promise<Sharp> {
  return sharp(imagePath).rotate();
}

/**
 * Loads an image and its metadata, auto-rotating it based on EXIF orientation and swapping dimensions if needed.
 * @param imagePath - Path to the image file
 * @returns Promise resolving to ImageWithMetadata object containing Sharp image instance and metadata
 */
export async function loadImageWithMetadata(imagePath: string): Promise<ImageWithMetadata> {
  const image = sharp(imagePath);
  const metadata = await image.metadata();

  // Auto-rotate based on EXIF orientation
  image.rotate();

  // EXIF orientation values 5, 6, 7, 8 require dimension swap after rotation
  const needsDimensionSwap = metadata.orientation && metadata.orientation >= 5 && metadata.orientation <= 8;

  // Update metadata with swapped dimensions if needed
  if (needsDimensionSwap) {
    const originalWidth = metadata.width;
    metadata.width = metadata.height;
    metadata.height = originalWidth;
  }

  return { image, metadata };
}

/**
 * Utility function to resize and save thumbnail using Sharp. The functions avoids upscaling the image and only reduces the size if necessary.
 * @param image - Sharp image instance
 * @param outputPath - Path where thumbnail should be saved
 * @param width - Target width for thumbnail
 * @param height - Target height for thumbnail
 */
export async function resizeImage(
  image: Sharp,
  outputPath: string,
  width: number,
  height: number,
  format: keyof FormatEnum = 'avif',
): Promise<void> {
  // Resize the image without enlarging it
  await image.resize(width, height, { withoutEnlargement: true }).toFormat(format).toFile(outputPath);
}

/**
 * Crops and resizes an image to a target aspect ratio, avoiding upscaling the image.
 * @param image - Sharp image instance
 * @param outputPath - Path where the image should be saved
 * @param width - Target width for the image
 * @param height - Target height for the image
 */
export async function cropAndResizeImage(
  image: Sharp,
  outputPath: string,
  width: number,
  height: number,
  format: keyof FormatEnum = 'avif',
): Promise<void> {
  // Apply resize with cover fit and without enlargement
  await image
    .resize(width, height, {
      fit: 'cover',
      withoutEnlargement: true,
    })
    .toFormat(format)
    .toFile(outputPath);
}

/**
 * Creates regular and retina thumbnails for an image while maintaining aspect ratio
 * @param image - Sharp image instance
 * @param metadata - Image metadata containing dimensions
 * @param outputPath - Path where thumbnail should be saved
 * @param outputPathRetina - Path where retina thumbnail should be saved
 * @param size - Target size of the longer side of the thumbnail
 * @returns Promise resolving to thumbnail dimensions
 */
export async function createImageThumbnails(
  image: Sharp,
  metadata: Metadata,
  outputPath: string,
  outputPathRetina: string,
  size: number,
): Promise<Dimensions> {
  // Get the original dimensions
  const originalWidth = metadata.width || 0;
  const originalHeight = metadata.height || 0;

  if (originalWidth === 0 || originalHeight === 0) {
    throw new Error('Invalid image dimensions');
  }

  // Calculate the new size maintaining aspect ratio
  const aspectRatio = originalWidth / originalHeight;

  let width: number;
  let height: number;

  if (originalWidth > originalHeight) {
    width = size;
    height = Math.round(size / aspectRatio);
  } else {
    width = Math.round(size * aspectRatio);
    height = size;
  }

  // Resize the image and create the thumbnails
  await resizeImage(image, outputPath, width, height);
  await resizeImage(image, outputPathRetina, width * 2, height * 2);

  // Return the dimensions of the thumbnail
  return { width, height };
}
