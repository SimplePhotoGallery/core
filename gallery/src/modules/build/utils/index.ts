import { Buffer } from 'node:buffer';
import path from 'node:path';

import sharp from 'sharp';

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
