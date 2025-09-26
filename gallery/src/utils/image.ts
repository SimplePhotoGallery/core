import ExifReader from 'exifreader';

import type { Dimensions } from '../types';
import type { Metadata, Sharp } from 'sharp';

/**
 * Utility function to resize and save thumbnail using Sharp. The functions avoids upscaling the image and only reduces the size if necessary.
 * @param image - Sharp image instance
 * @param outputPath - Path where thumbnail should be saved
 * @param width - Target width for thumbnail
 * @param height - Target height for thumbnail
 */
export async function resizeImage(image: Sharp, outputPath: string, width: number, height: number): Promise<void> {
  // Avoid upscaling the image
  const metadata = await image.metadata();
  const originalWidth = metadata.width || 0;
  const originalHeight = metadata.height || 0;

  if (originalWidth <= width || originalHeight <= height) {
    width = originalWidth;
    height = originalHeight;
  }

  // Resize the image
  await image.resize(width, height, { withoutEnlargement: true }).avif().toFile(outputPath);
}

/**
 * Crops and resizes an image to a target aspect ratio, avoiding upscaling the image.
 * @param image - Sharp image instance
 * @param outputPath - Path where the image should be saved
 * @param width - Target width for the image
 * @param height - Target height for the image
 */
export async function cropAndResizeImage(image: Sharp, outputPath: string, width: number, height: number): Promise<void> {
  // Get original image metadata
  const metadata = await image.metadata();
  const originalWidth = metadata.width || 0;
  const originalHeight = metadata.height || 0;

  // Calculate target aspect ratio
  const targetAspectRatio = width / height;
  const originalAspectRatio = originalWidth / originalHeight;

  // Determine crop dimensions to match target aspect ratio
  let cropWidth: number;
  let cropHeight: number;

  if (originalAspectRatio > targetAspectRatio) {
    // Original is wider, crop width
    cropHeight = originalHeight;
    cropWidth = Math.round(originalHeight * targetAspectRatio);
  } else {
    // Original is taller, crop height
    cropWidth = originalWidth;
    cropHeight = Math.round(originalWidth / targetAspectRatio);
  }

  // Calculate crop position (center crop)
  const left = Math.round((originalWidth - cropWidth) / 2);
  const top = Math.round((originalHeight - cropHeight) / 2);

  // Determine final dimensions (don't enlarge)
  let finalWidth = width;
  let finalHeight = height;

  if (cropWidth < width || cropHeight < height) {
    finalWidth = cropWidth;
    finalHeight = cropHeight;
  }

  // Apply crop and resize
  await image
    .extract({ left, top, width: cropWidth, height: cropHeight })
    .resize(finalWidth, finalHeight, { withoutEnlargement: true })
    .avif()
    .toFile(outputPath);
}

/**
 * Extracts description from image EXIF data
 * @param metadata - Sharp metadata object containing EXIF data
 * @returns Promise resolving to image description or undefined if not found
 */
export async function getImageDescription(imagePath: string): Promise<string | undefined> {
  try {
    const tags = await ExifReader.load(imagePath);

    // Description
    if (tags.description?.description) return tags.description.description;

    // ImageDescription
    if (tags.ImageDescription?.description) return tags.ImageDescription.description;

    // UserComment
    if (
      tags.UserComment &&
      typeof tags.UserComment === 'object' &&
      tags.UserComment !== null &&
      'description' in tags.UserComment
    ) {
      return (tags.UserComment as { description: string }).description;
    }

    // ExtDescrAccessibility
    if (tags.ExtDescrAccessibility?.description) return tags.ExtDescrAccessibility.description;

    // Caption/Abstract
    if (tags['Caption/Abstract']?.description) return tags['Caption/Abstract'].description;

    // XP Title
    if (tags.XPTitle?.description) return tags.XPTitle.description;

    // XP Comment
    if (tags.XPComment?.description) return tags.XPComment.description;
  } catch {
    return undefined;
  }
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
