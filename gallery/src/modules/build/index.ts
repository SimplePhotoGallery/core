import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';

import { joinUrl, toUrlPath } from '@simple-photo-gallery/common/theme';
import { LogLevels, type ConsolaInstance } from 'consola';

import {
  cleanupOldHeaderImages,
  createGallerySocialMediaCardImage,
  createOptimizedHeaderImage,
  hasOldHeaderImages,
} from './utils';

import { buildCliThumbnailConfig, findGalleries } from '../../utils';
import { parseGalleryJson, writeGalleryJsonAtomic } from '../../utils/gallery';
import { scanDirectory } from '../init';
import { processGalleryThumbnails } from '../thumbnails';

import type { BuildOptions } from './types';
import type { CommandResultSummary } from '../telemetry/types';
import type { GalleryData, MediaFile } from '@simple-photo-gallery/common';
import type { ThumbnailConfig } from '@simple-photo-gallery/common/theme';
import type { Buffer } from 'node:buffer';

interface ScanAndAppendResult {
  galleryData: GalleryData;
  dirty: boolean;
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
      if (galleryData.mediaBasePath) {
        const sourcePath = path.join(galleryData.mediaBasePath, image.filename);
        const destPath = path.join(galleryDir, image.filename);

        ui.debug(`Copying photo to ${destPath}`);
        fs.copyFileSync(sourcePath, destPath);
      }
    }
  }
}

function removeThumbnailFiles(mediaFile: MediaFile, galleryDir: string, ui: ConsolaInstance): void {
  const imagesDir = path.join(galleryDir, 'gallery', 'images');
  const thumbnailPaths = [mediaFile.thumbnail?.path, mediaFile.thumbnail?.pathRetina].filter(
    (thumbnailPath): thumbnailPath is string => typeof thumbnailPath === 'string',
  );

  for (const thumbnailPath of thumbnailPaths) {
    const filePath = path.resolve(imagesDir, thumbnailPath);
    const relativePath = path.relative(path.resolve(imagesDir), filePath);

    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      ui.debug(`Skipping thumbnail outside images directory: ${thumbnailPath}`);
      continue;
    }

    if (fs.existsSync(filePath)) {
      fs.rmSync(filePath, { force: true });
      ui.debug(`Deleted orphaned thumbnail ${filePath}`);
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
  galleryData: GalleryData,
  prune: boolean,
  ui: ConsolaInstance,
): Promise<ScanAndAppendResult> {
  let dirty = false;

  // Determine the directory to scan based on mediaBasePath
  const scanPath = galleryData.mediaBasePath || galleryDir;

  ui.debug(`Scanning ${scanPath} for new media files`);

  // Use the scanDirectory function from init module to get all media files
  let scanResult;
  try {
    scanResult = await scanDirectory(scanPath, ui);
  } catch {
    ui.debug(`Could not scan directory ${scanPath}`);
    return { galleryData, dirty };
  }

  // Get all existing filenames from all sections
  const existingFilenames = new Set<string>(
    galleryData.sections.flatMap((section) => section.images.map((image) => image.filename)),
  );

  // Filter out files that already exist in the gallery
  const newMediaFiles = scanResult.mediaFiles.filter((file) => !existingFilenames.has(file.filename));
  const scannedFilenames = new Set(scanResult.mediaFiles.map((file) => file.filename));
  const missingMediaFiles = galleryData.sections.flatMap((section) =>
    section.images.filter((image) => !image.url && !scannedFilenames.has(image.filename)),
  );

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

    dirty = true;

    ui.success(`Added ${newMediaFiles.length} new ${newMediaFiles.length === 1 ? 'file' : 'files'} to gallery.json`);
  } else {
    ui.debug('No new media files found');
  }

  if (missingMediaFiles.length > 0) {
    if (prune) {
      const missingFilenames = new Set(missingMediaFiles.map((file) => file.filename));

      for (const mediaFile of missingMediaFiles) {
        removeThumbnailFiles(mediaFile, galleryDir, ui);
      }

      for (const section of galleryData.sections) {
        section.images = section.images.filter((image) => !missingFilenames.has(image.filename));
      }

      dirty = true;
      ui.success(
        `Removed ${missingMediaFiles.length} missing ${missingMediaFiles.length === 1 ? 'file' : 'files'} from gallery.json`,
      );
    } else {
      ui.warn(
        `Found ${missingMediaFiles.length} gallery ${
          missingMediaFiles.length === 1 ? 'entry' : 'entries'
        } whose source files are missing. Run build --scan --prune to remove them.`,
      );
    }
  }

  return { galleryData, dirty };
}

function resolveAstroBinary(templateDir: string): string {
  const requireFromTheme = createRequire(path.join(templateDir, 'package.json'));
  const astroPackageJsonPath = requireFromTheme.resolve('astro/package.json');
  const astroPackageJson = JSON.parse(fs.readFileSync(astroPackageJsonPath, 'utf8')) as {
    bin?: string | Record<string, string>;
  };
  const astroBinPath = typeof astroPackageJson.bin === 'string' ? astroPackageJson.bin : astroPackageJson.bin?.astro;

  if (!astroBinPath) {
    throw new Error(`Could not resolve the astro binary from ${astroPackageJsonPath}`);
  }

  return path.join(path.dirname(astroPackageJsonPath), astroBinPath);
}

function getLastBuildOutputLines(...outputs: Array<Buffer | string | null | undefined>): string {
  return outputs
    .filter(Boolean)
    .map((output) => output!.toString())
    .join('\n')
    .split(/\r?\n/)
    .filter(Boolean)
    .slice(-30)
    .join('\n');
}

function runAstroBuild(templateDir: string, galleryJsonPath: string, outputDir: string, ui: ConsolaInstance): void {
  const astroBin = resolveAstroBinary(templateDir);
  const verbose = ui.level === LogLevels.debug;
  const result = spawnSync(process.execPath, [astroBin, 'build'], {
    cwd: templateDir,
    stdio: verbose ? 'inherit' : 'pipe',
    env: {
      ...process.env,
      GALLERY_JSON_PATH: galleryJsonPath,
      GALLERY_OUTPUT_DIR: outputDir,
    },
    encoding: 'utf8',
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    if (!verbose) {
      const buildOutput = getLastBuildOutputLines(result.stdout, result.stderr);
      if (buildOutput) {
        ui.error(`Astro build output:\n${buildOutput}`);
      }
    }

    const status = result.signal ? `signal ${result.signal}` : `exit code ${result.status ?? 'unknown'}`;
    throw new Error(`Astro build failed with ${status}`);
  }
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
 * @param cliThumbnailConfig - Optional CLI overrides for thumbnail configuration
 * @param cliTheme - Optional CLI theme identifier to save to gallery.json
 */
async function buildGallery(
  galleryDir: string,
  templateDir: string,
  scan: boolean,
  prune: boolean,
  shouldCreateThumbnails: boolean,
  ui: ConsolaInstance,
  yes: boolean,
  baseUrl?: string,
  thumbsBaseUrl?: string,
  cliThumbnailConfig?: ThumbnailConfig,
  cliTheme?: string,
): Promise<void> {
  ui.start(`Building gallery ${galleryDir}`);

  // Read the gallery.json file
  const galleryJsonPath = path.join(galleryDir, 'gallery', 'gallery.json');
  let galleryData = parseGalleryJson(galleryJsonPath, ui);
  let dirty = false;

  const markDirty = (): void => {
    dirty = true;
  };

  const saveGalleryData = (): void => {
    writeGalleryJsonAtomic(galleryJsonPath, galleryData);
    dirty = false;
  };

  // Scan for new media files and append them to the gallery.json
  if (scan) {
    const scanResult = await scanAndAppendNewFiles(galleryDir, galleryData, prune, ui);
    galleryData = scanResult.galleryData;
    dirty ||= scanResult.dirty;
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
    if (galleryData.headerImage) {
      await createGallerySocialMediaCardImage(headerImagePath, galleryData.title, socialMediaCardImagePath, ui);

      // Create optimized header image and generate blurhash
      const { blurHash } = await createOptimizedHeaderImage(headerImagePath, imagesFolder, ui);

      // Save the blurhash to gallery.json if it changed
      if (galleryData.headerImageBlurHash !== blurHash) {
        ui.debug('Updating gallery.json with header image blurhash');
        galleryData.headerImageBlurHash = blurHash;
        markDirty();
      }
    } else {
      ui.warn('No header image provided, skipping social media card image creation');
    }
  }

  // Ask the user if the photos should be copied if there is not baseUrl and mediaBasePath is set
  if (!mediaBaseUrl && mediaBasePath) {
    let shouldCopyPhotos = yes;

    if (!shouldCopyPhotos) {
      if (!process.stdout.isTTY) {
        throw new Error('Photos must be copied before build. Use --yes to confirm copying in non-interactive environments.');
      }

      shouldCopyPhotos = await ui.prompt('All photos need to be copied. Are you sure you want to continue?', {
        type: 'confirm',
        default: false,
      });
    }

    if (shouldCopyPhotos) {
      ui.debug('Copying photos');
      copyPhotos(galleryData, galleryDir, ui);
    }
  }

  // If the baseUrl is provided, update the gallery.json file if needed
  if (mediaBaseUrl && galleryData.mediaBaseUrl !== mediaBaseUrl) {
    ui.debug('Updating gallery.json with baseUrl');
    galleryData.mediaBaseUrl = mediaBaseUrl;
    markDirty();
  }

  // If the thumbsBaseUrl is provided, update the gallery.json file if needed
  if (thumbsBaseUrl && galleryData.thumbsBaseUrl !== thumbsBaseUrl) {
    ui.debug('Updating gallery.json with thumbsBaseUrl');
    galleryData.thumbsBaseUrl = thumbsBaseUrl;
    markDirty();
  }

  // If the theme is provided via CLI, update the gallery.json file if needed
  if (cliTheme && galleryData.theme !== cliTheme) {
    ui.debug('Updating gallery.json with theme');
    galleryData.theme = cliTheme;
    markDirty();
  }

  // If thumbnail settings are provided via CLI, update the gallery.json file if needed
  if (cliThumbnailConfig) {
    const currentThumbnails = galleryData.thumbnails ?? {};
    const cliKeys = Object.keys(cliThumbnailConfig) as (keyof typeof cliThumbnailConfig)[];
    const needsUpdate = cliKeys.some((key) => currentThumbnails[key] !== cliThumbnailConfig[key]);

    if (needsUpdate) {
      ui.debug('Updating gallery.json with thumbnail settings');
      galleryData.thumbnails = { ...currentThumbnails, ...cliThumbnailConfig };
      markDirty();
    }
  }

  // Set the social media card URL if changed
  if (!galleryData.metadata.image && galleryData.headerImage) {
    ui.debug('Updating gallery.json with social media card URL');

    const relativeSocialCardPath = toUrlPath(path.relative(galleryDir, socialMediaCardImagePath));
    if (thumbsBaseUrl) {
      galleryData.metadata.image = joinUrl(thumbsBaseUrl, path.basename(socialMediaCardImagePath));
    } else if (galleryData.url) {
      galleryData.metadata.image = joinUrl(galleryData.url, relativeSocialCardPath);
    } else {
      galleryData.metadata.image = `/${relativeSocialCardPath}`;
    }
    markDirty();
  }

  if (dirty) {
    saveGalleryData();
  }

  // Generate the thumbnails if needed
  if (shouldCreateThumbnails) {
    await processGalleryThumbnails(galleryDir, ui, cliThumbnailConfig);
  }

  // Build the template
  ui.debug('Building gallery from template');
  try {
    runAstroBuild(templateDir, galleryJsonPath, path.join(galleryDir, 'gallery'), ui);
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

function resolvePackageJsonPath(packageName: string): string {
  const candidates = [path.join(process.cwd(), 'package.json'), process.argv[1]].filter(Boolean) as string[];

  for (const candidate of candidates) {
    try {
      return createRequire(candidate).resolve(`${packageName}/package.json`);
    } catch {
      // Try the next resolution base.
    }
  }

  throw new Error(`Cannot find package '${packageName}'`);
}

/**
 * Resolves the theme directory from either a local path or npm package name
 * @param theme - Theme identifier (path or package name)
 * @param ui - ConsolaInstance for logging
 * @returns Promise resolving to the theme directory path
 */
export async function resolveThemeDir(theme: string, ui: ConsolaInstance): Promise<string> {
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
    const themePath = resolvePackageJsonPath(theme);
    const themeDir = path.dirname(themePath);
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

    // Create CLI thumbnail config from options (only include values that were provided)
    const cliThumbnailConfig = buildCliThumbnailConfig(options);

    // Process each gallery directory
    let totalGalleries = 0;
    for (const dir of galleryDirs) {
      const galleryJsonPath = path.join(dir, 'gallery', 'gallery.json');
      const galleryData = parseGalleryJson(galleryJsonPath, ui);

      // Theme resolution: CLI option > gallery.json > default
      const themeIdentifier = options.theme || galleryData.theme || '@simple-photo-gallery/theme-modern';

      // Resolve the theme directory (supports both local paths and npm packages)
      const themeDir = await resolveThemeDir(themeIdentifier, ui);

      // Build URLs with forward slashes; path.relative uses backslashes on Windows
      const relativeDirUrl = toUrlPath(path.relative(options.gallery, dir));
      const baseUrl = options.baseUrl ? joinUrl(options.baseUrl, relativeDirUrl) : undefined;
      const thumbsBaseUrl = options.thumbsBaseUrl ? joinUrl(options.thumbsBaseUrl, relativeDirUrl) : undefined;

      await buildGallery(
        path.resolve(dir),
        themeDir,
        options.scan,
        options.prune,
        options.thumbnails,
        ui,
        options.yes,
        baseUrl,
        thumbsBaseUrl,
        cliThumbnailConfig,
        options.theme,
      );

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
        ui.error(`Error building gallery: ${error.message}`);
      }
    } else {
      ui.error(`Error building gallery: ${error}`);
    }

    throw error;
  }
}
