import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import path from 'node:path';

import sharp from 'sharp';

import { HEADER_IMAGE_LANDSCAPE_WIDTHS, HEADER_IMAGE_PORTRAIT_WIDTHS } from '../../../config';
import { cropAndResizeImage } from '../../../utils/image';

import type { ConsolaInstance } from 'consola';

/** __dirname workaround for ESM modules */
const __dirname = path.dirname(new URL(import.meta.url).pathname);

/**
 * Helper function to resolve paths relative to current file
 * @param segments - Path segments to resolve relative to current directory
 * @returns Resolved absolute path
 */
export function resolveFromCurrentDir(...segments: string[]): string {
  return path.resolve(__dirname, ...segments);
}

/**
 * Creates a social media card image for a gallery
 * @param headerPhotoPath - Path to the header photo
 * @param title - Title of the gallery
 * @param ouputPath - Output path for the social media card image
 * @param ui - ConsolaInstance for logging
 */
export async function createGallerySocialMediaCardImage(
  headerPhotoPath: string,
  title: string,
  ouputPath: string,
  ui: ConsolaInstance,
): Promise<void> {
  ui.start(`Creating social media card image`);

  if (fs.existsSync(ouputPath)) {
    ui.success(`Social media card image already exists`);
    return;
  }

  // Read and resize the header image to 1200x631 using fit
  const resizedImageBuffer = await sharp(headerPhotoPath)
    .resize(1200, 631, { fit: 'cover' })
    .jpeg({ quality: 90 })
    .toBuffer();

  // Save the resized image as social media card
  const outputPath = ouputPath;
  await sharp(resizedImageBuffer).toFile(outputPath);

  // Create SVG with title and description
  const svgText = `
    <svg width="1200" height="631" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .title { font-family: Arial, sans-serif; font-size: 96px; font-weight: bold; fill: white; text-anchor: middle; }
          .description { font-family: Arial, sans-serif; font-size: 48px; fill: white; text-anchor: middle; }
        </style>
      </defs>
      <text x="600" y="250" class="title">${title}</text>
    </svg>
  `;

  // Composite the text overlay on top of the resized image
  const finalImageBuffer = await sharp(resizedImageBuffer)
    .composite([{ input: Buffer.from(svgText), top: 0, left: 0 }])
    .jpeg({ quality: 90 })
    .toBuffer();

  // Save the final image with text overlay
  await sharp(finalImageBuffer).toFile(outputPath);

  ui.success(`Created social media card image successfully`);
}

export async function createOptimizedHeaderImage(
  headerPhotoPath: string,
  outputFolder: string,
  ui: ConsolaInstance,
): Promise<void> {
  ui.start(`Creating optimized header images`);

  const image = sharp(headerPhotoPath);

  // Create landscape header images
  const landscapeYFactor = 3 / 4;
  for (const width of HEADER_IMAGE_LANDSCAPE_WIDTHS) {
    ui.debug(`Creating landscape header image ${width}`);

    if (fs.existsSync(path.join(outputFolder, `header_landscape_${width}.avif`))) {
      ui.debug(`Landscape header image ${width} AVIF already exists`);
    } else {
      await cropAndResizeImage(
        image.clone(),
        path.join(outputFolder, `header_landscape_${width}.avif`),
        width,
        width * landscapeYFactor,
        'avif',
      );
    }

    if (fs.existsSync(path.join(outputFolder, `header_landscape_${width}.jpg`))) {
      ui.debug(`Landscape header image ${width} JPG already exists`);
    } else {
      await cropAndResizeImage(
        image.clone(),
        path.join(outputFolder, `header_landscape_${width}.jpg`),
        width,
        width * landscapeYFactor,
        'jpg',
      );
    }
  }

  // Create portrait header images
  const portraitYFactor = 4 / 3;
  for (const width of HEADER_IMAGE_PORTRAIT_WIDTHS) {
    ui.debug(`Creating portrait header image ${width}`);

    if (fs.existsSync(path.join(outputFolder, `header_portrait_${width}.avif`))) {
      ui.debug(`Portrait header image ${width} AVIF already exists`);
    } else {
      await cropAndResizeImage(
        image.clone(),
        path.join(outputFolder, `header_portrait_${width}.avif`),
        width,
        width * portraitYFactor,
        'avif',
      );
    }

    if (fs.existsSync(path.join(outputFolder, `header_portrait_${width}.jpg`))) {
      ui.debug(`Portrait header image ${width} JPG already exists`);
    } else {
      await cropAndResizeImage(
        image.clone(),
        path.join(outputFolder, `header_portrait_${width}.jpg`),
        width,
        width * portraitYFactor,
        'jpg',
      );
    }
  }

  ui.success(`Created optimized header image successfully`);
}
