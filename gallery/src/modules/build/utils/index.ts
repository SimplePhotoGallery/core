import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import path from 'node:path';

import sharp from 'sharp';

import { HEADER_IMAGE_LANDSCAPE_WIDTHS, HEADER_IMAGE_PORTRAIT_WIDTHS } from '../../../config';
import { generateBlurHash } from '../../../utils/blurhash';
import { cropAndResizeImage, loadImage } from '../../../utils/image';

import type { ConsolaInstance } from 'consola';

/**
 * Wraps text into multiple lines based on a maximum character width
 * @param text - The text to wrap
 * @param maxCharsPerLine - Maximum number of characters per line (approximate)
 * @returns Array of text lines
 */
function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;

    // If a single word is longer than max, force it on its own line
    if (word.length > maxCharsPerLine) {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = '';
      }
      lines.push(word);
    } else if (testLine.length > maxCharsPerLine && currentLine) {
      // If the test line is too long and we have words in current line, start new line
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  // Add the last line
  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
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
  ui?: ConsolaInstance,
): Promise<string> {
  ui?.start(`Creating social media card image`);

  const headerBasename = path.basename(headerPhotoPath, path.extname(headerPhotoPath));

  if (fs.existsSync(ouputPath)) {
    ui?.success(`Social media card image already exists`);
    return headerBasename;
  }

  // Read and resize the header image to 1200x631 using fit
  const image = await loadImage(headerPhotoPath);
  const resizedImageBuffer = await image.resize(1200, 631, { fit: 'cover' }).jpeg({ quality: 90 }).toBuffer();

  // Save the resized image as social media card
  const outputPath = ouputPath;
  await sharp(resizedImageBuffer).toFile(outputPath);

  // Configuration for text rendering
  const CANVAS_WIDTH = 1200;
  const CANVAS_HEIGHT = 631;
  const FONT_SIZE = 72;
  const MARGIN = 50; // Margin from edges
  const CHAR_WIDTH_RATIO = 0.6; // Approximate ratio of character width to font size for Arial bold

  // Calculate maximum characters per line based on canvas width and font size
  const usableWidth = CANVAS_WIDTH - 2 * MARGIN;
  const maxCharsPerLine = Math.floor(usableWidth / (FONT_SIZE * CHAR_WIDTH_RATIO));
  const lines = wrapText(title, maxCharsPerLine);

  // Calculate vertical positioning for bottom-left alignment
  const lineHeight = FONT_SIZE * 1.2; // 20% spacing between lines
  const totalTextHeight = FONT_SIZE + (lines.length - 1) * lineHeight; // First line + spacing for additional lines
  const startY = CANVAS_HEIGHT - MARGIN - totalTextHeight + FONT_SIZE; // Bottom aligned with margin

  // Create SVG with title split into multiple lines using tspan elements (left aligned)
  const leftX = MARGIN;
  const tspanElements = lines
    .map((line, index) => {
      const yPosition = startY + index * lineHeight;
      // Escape special XML characters in the line text
      /* eslint-disable unicorn/prefer-string-replace-all */
      const escapedLine = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
      /* eslint-enable unicorn/prefer-string-replace-all */
      return `<tspan x="${leftX}" y="${yPosition}">${escapedLine}</tspan>`;
    })
    .join('\n      ');

  const svgText = `
    <svg width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="darkGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:rgb(0,0,0);stop-opacity:0" />
          <stop offset="100%" style="stop-color:rgb(0,0,0);stop-opacity:0.65" />
        </linearGradient>
        <style>
          .title { font-family: 'Arial, sans-serif'; font-size: ${FONT_SIZE}px; font-weight: bold; fill: white; text-anchor: start; }
        </style>
      </defs>
      <rect x="0" y="0" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" fill="url(#darkGradient)" />
      <text x="${leftX}" class="title">
      ${tspanElements}
      </text>
    </svg>
  `;

  // Composite the text overlay on top of the resized image
  const finalImageBuffer = await sharp(resizedImageBuffer)
    .composite([{ input: Buffer.from(svgText), top: 0, left: 0 }])
    .jpeg({ quality: 90 })
    .toBuffer();

  // Save the final image with text overlay
  await sharp(finalImageBuffer).toFile(outputPath);

  ui?.success(`Created social media card image successfully`);
  return headerBasename;
}

/**
 * Creates optimized header images for different orientations and sizes
 * @param headerPhotoPath - Path to the header photo
 * @param outputFolder - Folder where header images should be saved
 * @param ui - ConsolaInstance for logging
 * @returns Object containing the header basename, array of generated file paths, and blurhash
 */
export async function createOptimizedHeaderImage(
  headerPhotoPath: string,
  outputFolder: string,
  ui?: ConsolaInstance,
): Promise<{ headerBasename: string; generatedFiles: string[]; blurHash: string }> {
  ui?.start(`Creating optimized header images`);

  const image = await loadImage(headerPhotoPath);
  const headerBasename = path.basename(headerPhotoPath, path.extname(headerPhotoPath));
  const generatedFiles: string[] = [];

  // Generate blurhash for the header image
  ui?.debug('Generating blurhash for header image');
  const blurHash = await generateBlurHash(headerPhotoPath);

  // Create landscape header images
  const landscapeYFactor = 3 / 4;
  for (const width of HEADER_IMAGE_LANDSCAPE_WIDTHS) {
    ui?.debug(`Creating landscape header image ${width}`);

    const avifFilename = `${headerBasename}_landscape_${width}.avif`;
    const jpgFilename = `${headerBasename}_landscape_${width}.jpg`;

    if (fs.existsSync(path.join(outputFolder, avifFilename))) {
      ui?.debug(`Landscape header image ${width} AVIF already exists`);
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
      ui?.debug(`Landscape header image ${width} JPG already exists`);
    } else {
      await cropAndResizeImage(image.clone(), path.join(outputFolder, jpgFilename), width, width * landscapeYFactor, 'jpg');
    }
    generatedFiles.push(jpgFilename);
  }

  // Create portrait header images
  const portraitYFactor = 4 / 3;
  for (const width of HEADER_IMAGE_PORTRAIT_WIDTHS) {
    ui?.debug(`Creating portrait header image ${width}`);

    const avifFilename = `${headerBasename}_portrait_${width}.avif`;
    const jpgFilename = `${headerBasename}_portrait_${width}.jpg`;

    if (fs.existsSync(path.join(outputFolder, avifFilename))) {
      ui?.debug(`Portrait header image ${width} AVIF already exists`);
    } else {
      await cropAndResizeImage(image.clone(), path.join(outputFolder, avifFilename), width, width * portraitYFactor, 'avif');
    }
    generatedFiles.push(avifFilename);

    if (fs.existsSync(path.join(outputFolder, jpgFilename))) {
      ui?.debug(`Portrait header image ${width} JPG already exists`);
    } else {
      await cropAndResizeImage(image.clone(), path.join(outputFolder, jpgFilename), width, width * portraitYFactor, 'jpg');
    }
    generatedFiles.push(jpgFilename);
  }

  ui?.success(`Created optimized header image successfully`);
  return { headerBasename, generatedFiles, blurHash };
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
export function cleanupOldHeaderImages(outputFolder: string, currentHeaderBasename: string, ui?: ConsolaInstance): void {
  ui?.start(`Cleaning up old header images`);

  if (!fs.existsSync(outputFolder)) {
    ui?.debug(`Output folder ${outputFolder} does not exist, skipping cleanup`);
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
      ui?.debug(`Deleting old landscape header image: ${file}`);
      fs.unlinkSync(filePath);
      deletedCount++;
    } else if (portraitMatch && portraitMatch[1] !== currentHeaderBasename) {
      const filePath = path.join(outputFolder, file);
      ui?.debug(`Deleting old portrait header image: ${file}`);
      fs.unlinkSync(filePath);
      deletedCount++;
    }
  }

  if (deletedCount > 0) {
    ui?.success(`Deleted ${deletedCount} old header image(s)`);
  } else {
    ui?.debug(`No old header images to clean up`);
  }
}
