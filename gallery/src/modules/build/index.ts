import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { LogLevels, type ConsolaInstance } from 'consola';

import {
  cleanupOldHeaderImages,
  createGallerySocialMediaCardImage,
  createOptimizedHeaderImage,
  hasOldHeaderImages,
} from './utils';

import { findGalleries } from '../../utils';
import { parseGalleryJson } from '../../utils/gallery';
import { scanDirectory } from '../init';
import { processGalleryThumbnails } from '../thumbnails';

import type { BuildOptions } from './types';
import type { CommandResultSummary } from '../telemetry/types';
import type { GalleryData } from '@simple-photo-gallery/common';

/**
 * Copies photos from gallery subdirectory to main directory when needed
 * @param galleryData - Gallery data containing image paths
 * @param galleryDir - Base gallery directory
 * @param ui - ConsolaInstance for logging
 */
function copyPhotos(galleryData: GalleryData, galleryDir: string, ui: ConsolaInstance): void {
  for (const section of galleryData.sections) {
    for (const image of section.images) {
      if (galleryData.mediaBasePath) {
        const sourcePath = path.join(galleryData.mediaBasePath, image.filename);
        const destPath = path.join(galleryDir, image.filename);

        ui.debug(`Copying photo to ${destPath}`);
        fs.copyFileSync(sourcePath, destPath);
      }
    }
  }
}

/**
 * Scans a directory for new media files and appends them to the gallery.json
 * @param galleryDir - Directory containing the gallery
 * @param galleryJsonPath - Path to the gallery.json file
 * @param galleryData - Current gallery data
 * @param ui - ConsolaInstance for logging
 * @returns Updated gallery data with new files appended
 */
async function scanAndAppendNewFiles(
  galleryDir: string,
  galleryJsonPath: string,
  galleryData: GalleryData,
  ui: ConsolaInstance,
): Promise<GalleryData> {
  // Determine the directory to scan based on mediaBasePath
  const scanPath = galleryData.mediaBasePath || galleryDir;

  ui.debug(`Scanning ${scanPath} for new media files`);

  // Use the scanDirectory function from init module to get all media files
  let scanResult;
  try {
    scanResult = await scanDirectory(scanPath, ui);
  } catch {
    ui.debug(`Could not scan directory ${scanPath}`);
    return galleryData;
  }

  // Get all existing filenames from all sections
  const existingFilenames = new Set<string>(
    galleryData.sections.flatMap((section) => section.images.map((image) => image.filename)),
  );

  // Filter out files that already exist in the gallery
  const newMediaFiles = scanResult.mediaFiles.filter((file) => !existingFilenames.has(file.filename));

  // If there are new files, append them to the last section
  if (newMediaFiles.length > 0) {
    ui.info(`Found ${newMediaFiles.length} new media ${newMediaFiles.length === 1 ? 'file' : 'files'}`);

    // Get the last section (or create one if no sections exist)
    if (galleryData.sections.length === 0) {
      galleryData.sections.push({ images: [] });
    }

    const lastSectionIndex = galleryData.sections.length - 1;
    const lastSection = galleryData.sections[lastSectionIndex];

    // Append new files to the last section
    lastSection.images.push(...newMediaFiles);

    // Save the updated gallery.json
    ui.debug('Updating gallery.json with new files');
    fs.writeFileSync(galleryJsonPath, JSON.stringify(galleryData, null, 2));

    ui.success(`Added ${newMediaFiles.length} new ${newMediaFiles.length === 1 ? 'file' : 'files'} to gallery.json`);
  } else {
    ui.debug('No new media files found');
  }

  return galleryData;
}

/**
 * Builds a single gallery by generating thumbnails and creating HTML output
 * @param galleryDir - Directory containing the gallery
 * @param templateDir - Directory containing the Astro template
 * @param scan - Whether to scan for new media files
 * @param shouldCreateThumbnails - Whether to create thumbnails
 * @param ui - ConsolaInstance for logging
 * @param baseUrl - Optional base URL for hosting photos
 * @param thumbsBaseUrl - Optional base URL for hosting thumbnails
 */
async function buildGallery(
  galleryDir: string,
  templateDir: string,
  scan: boolean,
  shouldCreateThumbnails: boolean,
  ui: ConsolaInstance,
  baseUrl?: string,
  thumbsBaseUrl?: string,
): Promise<void> {
  ui.start(`Building gallery ${galleryDir}`);

  // Read the gallery.json file
  const galleryJsonPath = path.join(galleryDir, 'gallery', 'gallery.json');
  let galleryData = parseGalleryJson(galleryJsonPath, ui);

  // Scan for new media files and append them to the gallery.json
  if (scan) {
    galleryData = await scanAndAppendNewFiles(galleryDir, galleryJsonPath, galleryData, ui);
  }

  const socialMediaCardImagePath = path.join(galleryDir, 'gallery', 'images', 'social-media-card.jpg');
  const mediaBasePath = galleryData.mediaBasePath;
  const mediaBaseUrl = baseUrl || galleryData.mediaBaseUrl;
  const headerImagePath = mediaBasePath
    ? path.join(mediaBasePath, galleryData.headerImage)
    : path.resolve(galleryDir, galleryData.headerImage);

  const imagesFolder = path.join(galleryDir, 'gallery', 'images');
  const currentHeaderBasename = path.basename(headerImagePath, path.extname(headerImagePath));

  if (shouldCreateThumbnails) {
    // Create the images folder if it doesn't exist
    if (!fs.existsSync(imagesFolder)) {
      fs.mkdirSync(imagesFolder, { recursive: true });
    }

    // Check if header image has changed by looking for old header images
    const headerImageChanged = hasOldHeaderImages(imagesFolder, currentHeaderBasename);

    if (headerImageChanged) {
      ui.info('Header image changed, cleaning up old assets');

      // Clean up old header images
      cleanupOldHeaderImages(imagesFolder, currentHeaderBasename, ui);

      // Delete old social media card since header image changed
      if (fs.existsSync(socialMediaCardImagePath)) {
        fs.unlinkSync(socialMediaCardImagePath);
        ui.debug('Deleted old social media card');
      }
    }

    // Create the gallery social media card image
    await createGallerySocialMediaCardImage(headerImagePath, galleryData.title, socialMediaCardImagePath, ui);

    // Create optimized header image and generate blurhash
    const { blurHash } = await createOptimizedHeaderImage(headerImagePath, imagesFolder, ui);

    // Save the blurhash to gallery.json if it changed
    if (galleryData.headerImageBlurHash !== blurHash) {
      ui.debug('Updating gallery.json with header image blurhash');
      galleryData.headerImageBlurHash = blurHash;
      fs.writeFileSync(galleryJsonPath, JSON.stringify(galleryData, null, 2));
    }
  }

  // Ask the user if the photos should be copied if there is not baseUrl and mediaBasePath is set
  if (!mediaBaseUrl && mediaBasePath) {
    const shouldCopyPhotos = await ui.prompt('All photos need to be copied. Are you sure you want to continue?', {
      type: 'confirm',
    });

    if (shouldCopyPhotos) {
      ui.debug('Copying photos');
      copyPhotos(galleryData, galleryDir, ui);
    }
  }

  // If the baseUrl is provided, update the gallery.json file if needed
  if (mediaBaseUrl && galleryData.mediaBaseUrl !== mediaBaseUrl) {
    ui.debug('Updating gallery.json with baseUrl');
    galleryData.mediaBaseUrl = mediaBaseUrl;
    fs.writeFileSync(galleryJsonPath, JSON.stringify(galleryData, null, 2));
  }

  // If the thumbsBaseUrl is provided, update the gallery.json file if needed
  if (thumbsBaseUrl && galleryData.thumbsBaseUrl !== thumbsBaseUrl) {
    ui.debug('Updating gallery.json with thumbsBaseUrl');
    galleryData.thumbsBaseUrl = thumbsBaseUrl;
    fs.writeFileSync(galleryJsonPath, JSON.stringify(galleryData, null, 2));
  }

  // Set the social media card URL if changed

  if (!galleryData.metadata.image) {
    ui.debug('Updating gallery.json with social media card URL');

    galleryData.metadata.image = thumbsBaseUrl
      ? `${thumbsBaseUrl}/${path.basename(socialMediaCardImagePath)}`
      : `${galleryData.url || ''}/${path.relative(galleryDir, socialMediaCardImagePath)}`;
    fs.writeFileSync(galleryJsonPath, JSON.stringify(galleryData, null, 2));
  }

  // Generate the thumbnails if needed
  if (shouldCreateThumbnails) {
    await processGalleryThumbnails(galleryDir, ui);
  }

  // Build the template
  ui.debug('Building gallery from template');
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
 * Determines if a theme identifier is a local path or an npm package name
 * @param theme - Theme identifier (path or package name)
 * @returns true if it's a path, false if it's a package name
 */
function isLocalThemePath(theme: string): boolean {
  // Check if it starts with ./ or ../ or / (absolute path)
  // Note: We don't check for path.sep in the middle because scoped npm packages
  // like @scope/package contain / but should be treated as npm packages
  return theme.startsWith('./') || theme.startsWith('../') || theme.startsWith('/');
}

/**
 * Resolves the theme directory from either a local path or npm package name
 * @param theme - Theme identifier (path or package name)
 * @param ui - ConsolaInstance for logging
 * @returns Promise resolving to the theme directory path
 */
async function resolveThemeDir(theme: string, ui: ConsolaInstance): Promise<string> {
  if (isLocalThemePath(theme)) {
    // Resolve local path
    const themeDir = path.resolve(theme);
    const packageJsonPath = path.join(themeDir, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      throw new Error(`Theme directory not found or invalid: ${themeDir}. package.json not found.`);
    }

    ui.debug(`Using local theme: ${themeDir}`);
    return themeDir;
  } else {
    // Resolve npm package
    const themePath = await import.meta.resolve(`${theme}/package.json`);
    const themeDir = path.dirname(new URL(themePath).pathname);
    ui.debug(`Using npm theme package: ${theme} (${themeDir})`);
    return themeDir;
  }
}

export async function build(options: BuildOptions, ui: ConsolaInstance): Promise<CommandResultSummary> {
  try {
    // Find all gallery directories
    const galleryDirs = findGalleries(options.gallery, options.recursive);
    if (galleryDirs.length === 0) {
      ui.error('No galleries found.');
      return { processedGalleryCount: 0 };
    }

    // Get the theme identifier (default to the modern theme)
    const themeIdentifier = options.theme || '@simple-photo-gallery/theme-modern';

    // Resolve the theme directory (supports both local paths and npm packages)
    const themeDir = await resolveThemeDir(themeIdentifier, ui);

    // Process each gallery directory
    let totalGalleries = 0;
    for (const dir of galleryDirs) {
      const baseUrl = options.baseUrl ? `${options.baseUrl}${path.relative(options.gallery, dir)}` : undefined;
      const thumbsBaseUrl = options.thumbsBaseUrl
        ? `${options.thumbsBaseUrl}${path.relative(options.gallery, dir)}`
        : undefined;

      await buildGallery(path.resolve(dir), themeDir, options.scan, options.thumbnails, ui, baseUrl, thumbsBaseUrl);

      ++totalGalleries;
    }

    ui.box(`Built ${totalGalleries} ${totalGalleries === 1 ? 'gallery' : 'galleries'} successfully`);

    return { processedGalleryCount: totalGalleries };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Cannot find package')) {
        ui.error(
          `Theme package not found: ${options.theme || '@simple-photo-gallery/theme-modern'}. Make sure it's installed.`,
        );
      } else if (error.message.includes('Theme directory not found') || error.message.includes('package.json not found')) {
        ui.error(error.message);
      } else {
        ui.error('Error building gallery');
      }
    } else {
      ui.error('Error building gallery');
    }

    throw error;
  }
}
