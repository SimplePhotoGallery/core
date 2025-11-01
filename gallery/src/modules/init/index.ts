import { promises as fs } from 'node:fs';
import path from 'node:path';

import { capitalizeTitle, getMediaFileType } from './utils';

import type { GallerySettingsFromUser, ProcessDirectoryResult, ScanDirectoryResult, ScanOptions, SubGallery } from './types';
import type { CommandResultSummary } from '../telemetry/types';
import type { MediaFile } from '@simple-photo-gallery/common';
import type { ConsolaInstance } from 'consola';

/**
 * Scans a directory for media files and subdirectories
 * @param dirPath - Path to the directory to scan
 * @param ui - ConsolaInstance for logging
 * @returns Promise resolving to scan results with media files and subdirectories
 */
export async function scanDirectory(dirPath: string, ui: ConsolaInstance): Promise<ScanDirectoryResult> {
  const mediaFiles: MediaFile[] = [];
  const subGalleryDirectories: string[] = [];

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile()) {
        const mediaType = getMediaFileType(entry.name);

        if (mediaType) {
          const mediaFile: MediaFile = {
            type: mediaType,
            filename: entry.name,
            width: 0,
            height: 0,
          };

          mediaFiles.push(mediaFile);
        }
      } else if (entry.isDirectory() && entry.name !== 'gallery') {
        subGalleryDirectories.push(path.join(dirPath, entry.name));
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('ENOENT')) {
      ui.error(`Directory does not exist: ${dirPath}`);
    } else if (error instanceof Error && error.message.includes('ENOTDIR')) {
      ui.error(`Path is not a directory: ${dirPath}`);
    } else {
      ui.error(`Error scanning directory ${dirPath}:`, error);
    }

    throw error;
  }

  return { mediaFiles, subGalleryDirectories };
}

/**
 * Prompts the user for gallery settings through interactive CLI
 * @param galleryName - Name of the gallery directory
 * @param defaultImage - Default header image path
 * @param ui - ConsolaInstance for prompting and logging
 * @returns Promise resolving to user-provided gallery settings
 */
async function getGallerySettingsFromUser(
  galleryName: string,
  defaultImage: string,
  ui: ConsolaInstance,
): Promise<GallerySettingsFromUser> {
  ui.info(`Enter gallery settings for the gallery in folder "${galleryName}"`);

  const title = await ui.prompt('Enter gallery title', { type: 'text', default: 'My Gallery', placeholder: 'My Gallery' });
  const description = await ui.prompt('Enter gallery description', {
    type: 'text',
    default: 'My gallery with fantastic photos.',
    placeholder: 'My gallery with fantastic photos.',
  });
  const url = await ui.prompt('Enter the URL where the gallery will be hosted (important for social media image)', {
    type: 'text',
    default: '',
    placeholder: '',
  });
  const headerImage = await ui.prompt('Enter the name of the header image', {
    type: 'text',
    default: defaultImage,
    placeholder: defaultImage,
  });

  return { title, description, url, headerImage };
}

/**
 * Creates a gallery.json file with media files and settings
 * @param mediaFiles - Array of media files to include in gallery
 * @param galleryJsonPath - Path where gallery.json should be created
 * @param scanPath - Path to the directory that was scanned
 * @param subGalleries - Array of sub-galleries to include
 * @param useDefaultSettings - Whether to use default settings or prompt user
 * @param ui - ConsolaInstance for prompting and logging
 */
async function createGalleryJson(
  mediaFiles: MediaFile[],
  galleryJsonPath: string,
  scanPath: string,
  subGalleries: SubGallery[] = [],
  useDefaultSettings: boolean,
  ui: ConsolaInstance,
): Promise<void> {
  const galleryDir = path.dirname(galleryJsonPath);

  // If the gallery is stored in the same location as the media files, use a relative base path, otherwise use an absolute path
  const isSameLocation = path.relative(scanPath, path.join(galleryDir, '..')) === '';
  const mediaBasePath = isSameLocation ? undefined : scanPath;

  // Convert subGallery header image paths to be relative to gallery.json
  const relativeSubGalleries = subGalleries.map((subGallery) => ({
    ...subGallery,
    headerImage: subGallery.headerImage ? path.relative(galleryDir, subGallery.headerImage) : '',
  }));

  let galleryData = {
    title: 'My Gallery',
    description: 'My gallery with fantastic photos.',
    headerImage: mediaFiles[0]?.filename || '',
    mediaBasePath: mediaBasePath,
    metadata: {},
    sections: [
      {
        images: mediaFiles,
      },
    ],
    subGalleries: {
      title: 'Sub Galleries',
      galleries: relativeSubGalleries,
    },
  };

  if (!useDefaultSettings) {
    galleryData = {
      ...galleryData,
      ...(await getGallerySettingsFromUser(
        path.basename(path.join(galleryDir, '..')),
        path.basename(mediaFiles[0]?.filename || ''),
        ui,
      )),
    };
  }

  await fs.writeFile(galleryJsonPath, JSON.stringify(galleryData, null, 2));
}

/**
 * Checks if a gallery already exists in the specified directory
 * @param outputPath - Path where gallery would be created
 * @returns Promise resolving to true if gallery exists, false otherwise
 */
async function galleryExists(outputPath: string): Promise<boolean> {
  const galleryPath = path.join(outputPath, 'gallery');
  const galleryJsonPath = path.join(galleryPath, 'gallery.json');

  try {
    await fs.access(galleryJsonPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Processes a directory and its subdirectories to create galleries
 * @param scanPath - Path to scan for media files
 * @param outputPath - Path where gallery should be created
 * @param recursive - Whether to process subdirectories recursively
 * @param useDefaultSettings - Whether to use default settings or prompt user
 * @param force - Whether to force override existing galleries without prompting
 * @param ui - ConsolaInstance for logging
 * @returns Promise resolving to processing results
 */
async function processDirectory(
  scanPath: string,
  outputPath: string,
  recursive: boolean,
  useDefaultSettings: boolean,
  force: boolean,
  ui: ConsolaInstance,
): Promise<ProcessDirectoryResult> {
  ui.start(`Scanning ${scanPath}`);

  let totalFiles = 0;
  let totalGalleries = 1;
  const subGalleries: SubGallery[] = [];

  // Scan current directory for media files
  const { mediaFiles, subGalleryDirectories } = await scanDirectory(scanPath, ui);
  totalFiles += mediaFiles.length;

  // Process subdirectories only if recursive mode is enabled
  if (recursive) {
    for (const subGalleryDir of subGalleryDirectories) {
      const result = await processDirectory(
        subGalleryDir,
        path.join(outputPath, path.basename(subGalleryDir)),
        recursive,
        useDefaultSettings,
        force,
        ui,
      );

      totalFiles += result.totalFiles;
      totalGalleries += result.totalGalleries;

      // If the result contains a valid subGallery, add it to the list
      if (result.subGallery) {
        subGalleries.push(result.subGallery);
      }
    }
  }

  // Create gallery.json if there are media files or subGalleries
  if (mediaFiles.length > 0 || subGalleries.length > 0) {
    const galleryPath = path.join(outputPath, 'gallery');
    const galleryJsonPath = path.join(galleryPath, 'gallery.json');

    // Check if gallery already exists
    const exists = await galleryExists(outputPath);

    if (exists && !force) {
      // Ask user if they want to override
      const shouldOverride = await ui.prompt(`Gallery already exists at ${galleryJsonPath}. Do you want to override it?`, {
        type: 'confirm',
        default: false,
      });

      if (!shouldOverride) {
        ui.info('Skipping gallery creation');
        return { totalFiles: 0, totalGalleries: 0 };
      }
    }

    try {
      // Create output directory
      await fs.mkdir(galleryPath, { recursive: true });

      // Create gallery.json for this directory
      await createGalleryJson(mediaFiles, galleryJsonPath, scanPath, subGalleries, useDefaultSettings, ui);

      ui.success(
        `Create gallery with ${mediaFiles.length} files and ${subGalleries.length} subgalleries at: ${galleryJsonPath}`,
      );
    } catch (error) {
      ui.error(`Error creating gallery.json at ${galleryJsonPath}`);
      throw error;
    }
  }

  // Return result with suGgallery info if this directory has media files
  const result: ProcessDirectoryResult = { totalFiles, totalGalleries };

  // If this directory has media files or subGalleries, create a subGallery in the result
  if (mediaFiles.length > 0 || subGalleries.length > 0) {
    const dirName = path.basename(scanPath);
    result.subGallery = {
      title: capitalizeTitle(dirName),
      headerImage: mediaFiles[0]?.filename || '',
      path: path.join('..', dirName),
    };
  }

  return result;
}

/**
 * Main init command implementation - scans directories and creates gallery.json files
 * @param options - Options specifying paths, recursion, and default settings
 * @param ui - ConsolaInstance for logging and user prompts
 */
export async function init(options: ScanOptions, ui: ConsolaInstance): Promise<CommandResultSummary> {
  try {
    const scanPath = path.resolve(options.photos);
    const outputPath = options.gallery ? path.resolve(options.gallery) : scanPath;

    // Process the directory tree with the specified recursion setting
    const result = await processDirectory(scanPath, outputPath, options.recursive, options.default, options.force, ui);

    ui.box(
      `Created ${result.totalGalleries} ${result.totalGalleries === 1 ? 'gallery' : 'galleries'} with ${result.totalFiles} media ${result.totalFiles === 1 ? 'file' : 'files'}`,
    );

    return {
      processedMediaCount: result.totalFiles,
      processedGalleryCount: result.totalGalleries,
    };
  } catch (error) {
    ui.error('Error initializing gallery');
    throw error;
  }
}
