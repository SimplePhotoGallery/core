import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { LogLevels, type ConsolaInstance } from 'consola';

import { createGallerySocialMediaCardImage } from './utils';

import { type GalleryData, GalleryDataSchema } from '../../types';
import { findGalleries } from '../../utils';
import { processGalleryThumbnails } from '../thumbnails';

import type { BuildOptions } from './types';

/**
 * Checks if a file path refers to a file one folder up from the current directory
 * @param filePath - The file path to check
 * @returns True if the file is exactly one folder up (../filename)
 */
function checkFileIsOneFolderUp(filePath: string): boolean {
  const normalizedPath = path.normalize(filePath);
  const pathParts = normalizedPath.split(path.sep);
  return pathParts.length === 2 && pathParts[0] === '..';
}

/**
 * Copies photos from gallery subdirectory to main directory when needed
 * @param galleryData - Gallery data containing image paths
 * @param galleryDir - Base gallery directory
 * @param ui - ConsolaInstance for logging
 */
function copyPhotos(galleryData: GalleryData, galleryDir: string, ui: ConsolaInstance): void {
  for (const section of galleryData.sections) {
    for (const image of section.images) {
      if (!checkFileIsOneFolderUp(image.path)) {
        const sourcePath = path.join(galleryDir, 'gallery', image.path);
        const fileName = path.basename(image.path);
        const destPath = path.join(galleryDir, fileName);

        ui.debug(`Copying photo to ${destPath}`);
        fs.copyFileSync(sourcePath, destPath);
      }
    }
  }
}

/**
 * Builds a single gallery by generating thumbnails and creating HTML output
 * @param galleryDir - Directory containing the gallery
 * @param templateDir - Directory containing the Astro template
 * @param ui - ConsolaInstance for logging
 * @param baseUrl - Optional base URL for hosting photos
 */
async function buildGallery(galleryDir: string, templateDir: string, ui: ConsolaInstance, baseUrl?: string): Promise<void> {
  ui.start(`Building gallery ${galleryDir}`);

  // Generate the thumbnails if needed
  await processGalleryThumbnails(galleryDir, ui);

  // Read the gallery.json file
  const galleryJsonPath = path.join(galleryDir, 'gallery', 'gallery.json');
  const galleryContent = fs.readFileSync(galleryJsonPath, 'utf8');
  const galleryData = GalleryDataSchema.parse(JSON.parse(galleryContent));
  const socialMediaCardImagePath = path.join(galleryDir, 'gallery', 'thumbnails', 'social-media-card.jpg');

  // Create the gallery social media card image
  await createGallerySocialMediaCardImage(
    path.resolve(path.join(galleryDir, 'gallery'), galleryData.headerImage),
    galleryData.title,
    socialMediaCardImagePath,
    ui,
  );
  galleryData.metadata.image =
    galleryData.metadata.image || `${galleryData.url || ''}/${path.relative(galleryDir, socialMediaCardImagePath)}`;
  fs.writeFileSync(galleryJsonPath, JSON.stringify(galleryData, null, 2));

  // Check if the photos need to be copied. Not needed if the baseUrl is provided.
  if (!baseUrl) {
    const shouldCopyPhotos = galleryData.sections.some((section) =>
      section.images.some((image) => !checkFileIsOneFolderUp(image.path)),
    );

    if (
      shouldCopyPhotos &&
      (await ui.prompt('All photos need to be copied. Are you sure you want to continue?', { type: 'confirm' }))
    ) {
      ui.debug('Copying photos');
      copyPhotos(galleryData, galleryDir, ui);
    }
  }

  // If the baseUrl is provided, update the gallery.json file
  if (baseUrl) {
    ui.debug('Updating gallery.json with baseUrl');
    galleryData.mediaBaseUrl = baseUrl;
    fs.writeFileSync(galleryJsonPath, JSON.stringify(galleryData, null, 2));
  }

  // Build the template
  ui.debug('Building gallery form template');
  try {
    // Set the environment variable for the gallery.json path that will be used by the template
    process.env.GALLERY_JSON_PATH = galleryJsonPath;
    process.env.GALLERY_OUTPUT_DIR = path.join(galleryDir, 'gallery');

    execSync('npx astro build', { cwd: templateDir, stdio: ui.level === LogLevels.debug ? 'inherit' : 'ignore' });
  } catch (error) {
    ui.error(`Build failed for ${galleryDir}`);
    throw error;
  }

  // Copy the build output to the output directory
  const outputDir = path.join(galleryDir, 'gallery');
  const buildDir = path.join(outputDir, '_build');
  ui.debug(`Copying build output to ${outputDir}`);
  fs.cpSync(buildDir, outputDir, { recursive: true });

  // Move the index.html to the gallery directory
  ui.debug('Moving index.html to gallery directory');
  fs.copyFileSync(path.join(outputDir, 'index.html'), path.join(galleryDir, 'index.html'));
  fs.rmSync(path.join(outputDir, 'index.html'));

  // Clean up the _build directory
  ui.debug('Cleaning up build directory');
  fs.rmSync(buildDir, { recursive: true, force: true });

  ui.success(`Gallery built successfully`);
}

/**
 * Main build command implementation - builds HTML galleries from gallery.json files
 * @param options - Options specifying gallery path, recursion, and base URL
 * @param ui - ConsolaInstance for logging
 */
export async function build(options: BuildOptions, ui: ConsolaInstance): Promise<void> {
  try {
    // Find all gallery directories
    const galleryDirs = findGalleries(options.gallery, options.recursive);
    if (galleryDirs.length === 0) {
      ui.error('No galleries found.');
      return;
    }

    // Get the astro theme directory from the default one
    const themePath = await import.meta.resolve('@simple-photo-gallery/theme-modern/package.json');
    const themeDir = path.dirname(new URL(themePath).pathname);

    // Process each gallery directory
    let totalGalleries = 0;
    for (const dir of galleryDirs) {
      const baseUrl = options.baseUrl ? `${options.baseUrl}/${path.relative(options.gallery, dir)}` : undefined;
      await buildGallery(path.resolve(dir), themeDir, ui, baseUrl);

      ++totalGalleries;
    }

    ui.box(`Built ${totalGalleries} ${totalGalleries === 1 ? 'gallery' : 'galleries'} successfully`);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Cannot find package')) {
      ui.error('Theme package not found: @simple-photo-gallery/theme-modern/package.json');
    } else {
      ui.error('Error building gallery');
    }

    throw error;
  }
}
