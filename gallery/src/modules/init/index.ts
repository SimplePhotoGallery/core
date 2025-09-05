import { promises as fs } from 'node:fs';
import path from 'node:path';

import { capitalizeTitle, getMediaFileType } from './utils';

import type { GallerySettingsFromUser, ProcessDirectoryResult, ScanDirectoryResult, ScanOptions, SubGallery } from './types';
import type { MediaFile } from '../../types';
import type { ConsolaInstance } from 'consola';

/**
 * Scans a directory for media files and subdirectories.
 * @param dirPath - The path to the directory to scan
 * @param ui - The ConsolaInstance for logging messages
 * @returns Promise resolving to scan results containing media files and subdirectories
 */
async function scanDirectory(dirPath: string, ui: ConsolaInstance): Promise<ScanDirectoryResult> {
  const mediaFiles: MediaFile[] = [];
  const subGalleryDirectories: string[] = [];

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile()) {
        const fullPath = path.join(dirPath, entry.name);
        const mediaType = getMediaFileType(entry.name);

        if (mediaType) {
          const mediaFile: MediaFile = {
            type: mediaType,
            path: fullPath,
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
 * Prompts the user for gallery settings through interactive CLI prompts.
 * @param galleryName - The name of the gallery folder being configured
 * @param defaultImage - The default header image path to suggest
 * @param ui - The ConsolaInstance for user interaction
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
  const headerImage = await ui.prompt('Enter header image', {
    type: 'text',
    default: defaultImage,
    placeholder: defaultImage,
  });

  let thumbnailSize = 200;
  while (true) {
    const thumbnailSizeString = await ui.prompt('Enter thumbnail size', {
      type: 'text',
      default: '200',
      placeholder: '200',
    });
    thumbnailSize = Number.parseInt(thumbnailSizeString);

    if (Number.isNaN(thumbnailSize)) {
      ui.error('Invalid thumbnail size');
      continue;
    } else if (thumbnailSize < 10 || thumbnailSize > 2000) {
      ui.error('Thumbnail size must be between 10 and 2000');
      continue;
    }

    break;
  }

  return { title, description, headerImage, thumbnailSize };
}

/**
 * Creates a gallery.json file with the specified media files and settings.
 * @param mediaFiles - Array of media files to include in the gallery
 * @param galleryJsonPath - Path where the gallery.json file should be created
 * @param subGalleries - Array of sub-galleries to include (default: empty array)
 * @param useDefaultSettings - Whether to use default settings or prompt the user
 * @param ui - The ConsolaInstance for user interaction
 */
async function createGalleryJson(
  mediaFiles: MediaFile[],
  galleryJsonPath: string,
  subGalleries: SubGallery[] = [],
  useDefaultSettings: boolean,
  ui: ConsolaInstance,
): Promise<void> {
  const galleryDir = path.dirname(galleryJsonPath);

  // Convert media file paths to be relative to gallery.json
  const relativeMediaFiles = mediaFiles.map((file) => ({
    ...file,
    path: path.relative(galleryDir, file.path),
  }));

  // Convert subGallery header image paths to be relative to gallery.json
  const relativeSubGalleries = subGalleries.map((subGallery) => ({
    ...subGallery,
    headerImage: subGallery.headerImage ? path.relative(galleryDir, subGallery.headerImage) : '',
  }));

  let galleryData = {
    title: 'My Gallery',
    description: 'My gallery with fantastic photos.',
    headerImage: relativeMediaFiles[0]?.path,
    thumbnailSize: 200,
    metadata: { ogUrl: '' },
    sections: [
      {
        images: relativeMediaFiles,
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
        relativeMediaFiles[0]?.path || '',
        ui,
      )),
    };
  }

  await fs.writeFile(galleryJsonPath, JSON.stringify(galleryData, null, 2));
}

/**
 * Processes a directory and its subdirectories to create gallery configurations.
 * @param scanPath - The path to scan for media files
 * @param outputPath - The path where gallery files should be created
 * @param recursive - Whether to process subdirectories recursively
 * @param useDefaultSettings - Whether to use default settings or prompt the user
 * @param ui - The ConsolaInstance for logging and user interaction
 * @returns Promise resolving to processing results with statistics
 */
async function processDirectory(
  scanPath: string,
  outputPath: string,
  recursive: boolean,
  useDefaultSettings: boolean,
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

    try {
      // Create output directory
      await fs.mkdir(galleryPath, { recursive: true });

      // Create gallery.json for this directory
      await createGalleryJson(mediaFiles, galleryJsonPath, subGalleries, useDefaultSettings, ui);

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
      headerImage: mediaFiles[0]?.path || '',
      path: path.join('..', dirName),
    };
  }

  return result;
}

/**
 * Main function for the init command. Initializes galleries by scanning directories for media files.
 * @param options - Configuration options for gallery initialization
 * @param ui - The ConsolaInstance for logging and user interaction
 */
export async function init(options: ScanOptions, ui: ConsolaInstance): Promise<void> {
  try {
    const scanPath = path.resolve(options.photos);
    const outputPath = options.gallery ? path.resolve(options.gallery) : scanPath;

    // Process the directory tree with the specified recursion setting
    const result = await processDirectory(scanPath, outputPath, options.recursive, options.default, ui);

    ui.box(
      `Created ${result.totalGalleries} ${result.totalGalleries === 1 ? 'gallery' : 'galleries'} with ${result.totalFiles} media ${result.totalFiles === 1 ? 'file' : 'files'}`,
    );
  } catch (error) {
    ui.error('Error initializing gallery');
    throw error;
  }
}
