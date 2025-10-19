import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import path from 'node:path';

import sharp from 'sharp';

import { HEADER_IMAGE_LANDSCAPE_WIDTHS, HEADER_IMAGE_PORTRAIT_WIDTHS } from '../../../config';
import { cropAndResizeImage, loadImage } from '../../../utils/image';

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
 * @returns The basename of the header photo used
 */
export async function createGallerySocialMediaCardImage(
  headerPhotoPath: string,
  title: string,
  ouputPath: string,
  ui: ConsolaInstance,
): Promise<string> {
  ui.start(`Creating social media card image`);

  const headerBasename = path.basename(headerPhotoPath, path.extname(headerPhotoPath));

  if (fs.existsSync(ouputPath)) {
    ui.success(`Social media card image already exists`);
    return headerBasename;
  }

  // Read and resize the header image to 1200x631 using fit
  const image = await loadImage(headerPhotoPath);
  const resizedImageBuffer = await image.resize(1200, 631, { fit: 'cover' }).jpeg({ quality: 90 }).toBuffer();

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
  return headerBasename;
}

/**
 * Creates optimized header images for different orientations and sizes
 * @param headerPhotoPath - Path to the header photo
 * @param outputFolder - Folder where header images should be saved
 * @param ui - ConsolaInstance for logging
 * @returns Object containing the header basename and array of generated file paths
 */
export async function createOptimizedHeaderImage(
  headerPhotoPath: string,
  outputFolder: string,
  ui: ConsolaInstance,
): Promise<{ headerBasename: string; generatedFiles: string[] }> {
  ui.start(`Creating optimized header images`);

  const image = await loadImage(headerPhotoPath);
  const headerBasename = path.basename(headerPhotoPath, path.extname(headerPhotoPath));
  const generatedFiles: string[] = [];

  // Create landscape header images
  const landscapeYFactor = 3 / 4;
  for (const width of HEADER_IMAGE_LANDSCAPE_WIDTHS) {
    ui.debug(`Creating landscape header image ${width}`);

    const avifFilename = `${headerBasename}_landscape_${width}.avif`;
    const jpgFilename = `${headerBasename}_landscape_${width}.jpg`;

    if (fs.existsSync(path.join(outputFolder, avifFilename))) {
      ui.debug(`Landscape header image ${width} AVIF already exists`);
    } else {
      await cropAndResizeImage(
        image.clone(),
        path.join(outputFolder, avifFilename),
        width,
        width * landscapeYFactor,
        'avif',
      );
    }
    generatedFiles.push(avifFilename);

    if (fs.existsSync(path.join(outputFolder, jpgFilename))) {
      ui.debug(`Landscape header image ${width} JPG already exists`);
    } else {
      await cropAndResizeImage(image.clone(), path.join(outputFolder, jpgFilename), width, width * landscapeYFactor, 'jpg');
    }
    generatedFiles.push(jpgFilename);
  }

  // Create portrait header images
  const portraitYFactor = 4 / 3;
  for (const width of HEADER_IMAGE_PORTRAIT_WIDTHS) {
    ui.debug(`Creating portrait header image ${width}`);

    const avifFilename = `${headerBasename}_portrait_${width}.avif`;
    const jpgFilename = `${headerBasename}_portrait_${width}.jpg`;

    if (fs.existsSync(path.join(outputFolder, avifFilename))) {
      ui.debug(`Portrait header image ${width} AVIF already exists`);
    } else {
      await cropAndResizeImage(image.clone(), path.join(outputFolder, avifFilename), width, width * portraitYFactor, 'avif');
    }
    generatedFiles.push(avifFilename);

    if (fs.existsSync(path.join(outputFolder, jpgFilename))) {
      ui.debug(`Portrait header image ${width} JPG already exists`);
    } else {
      await cropAndResizeImage(image.clone(), path.join(outputFolder, jpgFilename), width, width * portraitYFactor, 'jpg');
    }
    generatedFiles.push(jpgFilename);
  }

  ui.success(`Created optimized header image successfully`);
  return { headerBasename, generatedFiles };
}

/**
 * Checks if there are old header images with a different basename than the current one
 * @param outputFolder - Folder containing the header images
 * @param currentHeaderBasename - Basename of the current header image
 * @returns True if old header images with different basename exist, false otherwise
 */
export function hasOldHeaderImages(outputFolder: string, currentHeaderBasename: string): boolean {
  if (!fs.existsSync(outputFolder)) {
    return false;
  }

  const files = fs.readdirSync(outputFolder);

  for (const file of files) {
    // Check if file is a header image (landscape or portrait) with different basename
    const landscapeMatch = file.match(/^(.+)_landscape_\d+\.(avif|jpg)$/);
    const portraitMatch = file.match(/^(.+)_portrait_\d+\.(avif|jpg)$/);

    if (
      (landscapeMatch && landscapeMatch[1] !== currentHeaderBasename) ||
      (portraitMatch && portraitMatch[1] !== currentHeaderBasename)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Cleans up old header images that don't match the current header image
 * @param outputFolder - Folder containing the header images
 * @param currentHeaderBasename - Basename of the current header image
 * @param ui - ConsolaInstance for logging
 */
export function cleanupOldHeaderImages(outputFolder: string, currentHeaderBasename: string, ui: ConsolaInstance): void {
  ui.start(`Cleaning up old header images`);

  if (!fs.existsSync(outputFolder)) {
    ui.debug(`Output folder ${outputFolder} does not exist, skipping cleanup`);
    return;
  }

  const files = fs.readdirSync(outputFolder);
  let deletedCount = 0;

  for (const file of files) {
    // Check if file is a header image (landscape or portrait) with different basename
    const landscapeMatch = file.match(/^(.+)_landscape_\d+\.(avif|jpg)$/);
    const portraitMatch = file.match(/^(.+)_portrait_\d+\.(avif|jpg)$/);

    if (landscapeMatch && landscapeMatch[1] !== currentHeaderBasename) {
      const filePath = path.join(outputFolder, file);
      ui.debug(`Deleting old landscape header image: ${file}`);
      fs.unlinkSync(filePath);
      deletedCount++;
    } else if (portraitMatch && portraitMatch[1] !== currentHeaderBasename) {
      const filePath = path.join(outputFolder, file);
      ui.debug(`Deleting old portrait header image: ${file}`);
      fs.unlinkSync(filePath);
      deletedCount++;
    }
  }

  if (deletedCount > 0) {
    ui.success(`Deleted ${deletedCount} old header image(s)`);
  } else {
    ui.debug(`No old header images to clean up`);
  }
}
