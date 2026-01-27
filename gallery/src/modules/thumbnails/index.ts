import fs from 'node:fs';
import path from 'node:path';

import { extractThumbnailConfigFromGallery, mergeThumbnailConfig, loadThemeConfig } from '@simple-photo-gallery/common/theme';
import { LogLevels, type ConsolaInstance } from 'consola';

import { getFileMtime } from './utils';

import { findGalleries, handleFileProcessingError } from '../../utils';
import { generateBlurHash } from '../../utils/blurhash';
import { getImageDescription } from '../../utils/descriptions';
import { parseGalleryJson } from '../../utils/gallery';
import { createImageThumbnails, loadImageWithMetadata, type ThumbnailSizeDimension } from '../../utils/image';
import { getVideoDimensions, createVideoThumbnails } from '../../utils/video';
import { resolveThemeDir } from '../build';

import type { ThumbnailOptions } from './types';
import type { CommandResultSummary } from '../telemetry/types';
import type { MediaFile } from '@simple-photo-gallery/common';
import type { ThumbnailConfig } from '@simple-photo-gallery/common/theme';

/**
 * Processes an image file to create thumbnail and extract metadata
 * @param imagePath - Path to the image file
 * @param thumbnailPath - Path where thumbnail should be saved
 * @param thumbnailPathRetina - Path where retina thumbnail should be saved
 * @param thumbnailSize - Target size for thumbnail
 * @param thumbnailSizeDimension - How to apply size: 'auto', 'width', or 'height'
 * @param lastMediaTimestamp - Optional timestamp to check if processing can be skipped
 * @returns Promise resolving to updated MediaFile or undefined if skipped
 */
export async function processImage(
  imagePath: string,
  thumbnailPath: string,
  thumbnailPathRetina: string,
  thumbnailSize: number,
  thumbnailSizeDimension: ThumbnailSizeDimension = 'auto',
  lastMediaTimestamp?: Date,
): Promise<MediaFile | undefined> {
  // Get the last media timestamp
  const fileMtime = await getFileMtime(imagePath);

  // Check if processing of the file can be skipped
  if (lastMediaTimestamp && fileMtime <= lastMediaTimestamp && fs.existsSync(thumbnailPath)) {
    return undefined;
  }

  // Load the image and get metadata first to check orientation
  const { image, metadata } = await loadImageWithMetadata(imagePath);

  // Get the image dimensions
  const imageDimensions = {
    width: metadata.width || 0,
    height: metadata.height || 0,
  };

  if (imageDimensions.width === 0 || imageDimensions.height === 0) {
    throw new Error('Invalid image dimensions');
  }

  // Get the image description
  const description = await getImageDescription(imagePath);

  // Create the thumbnails
  const thumbnailDimensions = await createImageThumbnails(
    image,
    metadata,
    thumbnailPath,
    thumbnailPathRetina,
    thumbnailSize,
    thumbnailSizeDimension,
  );

  // Generate BlurHash from the thumbnail
  const blurHash = await generateBlurHash(thumbnailPath);

  // Return the updated media file
  return {
    type: 'image',
    filename: path.basename(imagePath),
    alt: description,
    width: imageDimensions.width,
    height: imageDimensions.height,
    thumbnail: {
      path: thumbnailPath,
      pathRetina: thumbnailPathRetina,
      width: thumbnailDimensions.width,
      height: thumbnailDimensions.height,
      blurHash,
    },
    lastMediaTimestamp: fileMtime.toISOString(),
  };
}

/**
 * Processes a video file to create thumbnail and extract metadata
 * @param videoPath - Path to the video file
 * @param thumbnailPath - Path where thumbnail should be saved
 * @param thumbnailPathRetina - Path where retina thumbnail should be saved
 * @param thumbnailSize - Target size for thumbnail
 * @param thumbnailSizeDimension - How to apply size: 'auto', 'width', or 'height'
 * @param verbose - Whether to enable verbose output
 * @param lastMediaTimestamp - Optional timestamp to check if processing can be skipped
 * @returns Promise resolving to updated MediaFile or undefined if skipped
 */
async function processVideo(
  videoPath: string,
  thumbnailPath: string,
  thumbnailPathRetina: string,
  thumbnailSize: number,
  thumbnailSizeDimension: ThumbnailSizeDimension = 'auto',
  verbose: boolean,
  lastMediaTimestamp?: Date,
): Promise<MediaFile | undefined> {
  // Get the last media timestamp
  const fileMtime = await getFileMtime(videoPath);

  // Check if processing of the file can be skipped
  if (lastMediaTimestamp && fileMtime <= lastMediaTimestamp && fs.existsSync(thumbnailPath)) {
    return undefined;
  }

  // Get the video dimensions
  const videoDimensions = await getVideoDimensions(videoPath);

  // Create the thumbnail
  const thumbnailDimensions = await createVideoThumbnails(
    videoPath,
    videoDimensions,
    thumbnailPath,
    thumbnailPathRetina,
    thumbnailSize,
    thumbnailSizeDimension,
    verbose,
  );

  // Generate BlurHash from the thumbnail
  const blurHash = await generateBlurHash(thumbnailPath);

  return {
    type: 'video',
    filename: path.basename(videoPath),
    alt: undefined,
    width: videoDimensions.width,
    height: videoDimensions.height,
    thumbnail: {
      path: thumbnailPath,
      pathRetina: thumbnailPathRetina,
      width: thumbnailDimensions.width,
      height: thumbnailDimensions.height,
      blurHash,
    },
    lastMediaTimestamp: fileMtime.toISOString(),
  };
}

/**
 * Processes a media file to generate thumbnails and update metadata
 * @param mediaFile - Media file to process
 * @param mediaBasePath - Base path for the media files
 * @param thumbnailsPath - Directory where thumbnails are stored
 * @param thumbnailConfig - Thumbnail configuration (dimension and edge)
 * @param ui - ConsolaInstance for logging
 * @returns Promise resolving to updated MediaFile
 */
async function processMediaFile(
  mediaFile: MediaFile,
  mediaBasePath: string,
  thumbnailsPath: string,
  thumbnailConfig: Required<ThumbnailConfig>,
  ui: ConsolaInstance,
): Promise<MediaFile> {
  try {
    // Resolve the path relative to the mediaBasePath
    const filePath = path.resolve(path.join(mediaBasePath, mediaFile.filename));

    const fileName = mediaFile.filename;
    const fileNameWithoutExt = path.parse(fileName).name;
    const thumbnailFileName = `${fileNameWithoutExt}.avif`;
    const thumbnailPath = path.join(thumbnailsPath, thumbnailFileName);
    const thumbnailPathRetina = thumbnailPath.replace('.avif', '@2x.avif');

    const lastMediaTimestamp = mediaFile.lastMediaTimestamp ? new Date(mediaFile.lastMediaTimestamp) : undefined;
    const verbose = ui.level === LogLevels.debug;

    ui.debug(`  Processing ${mediaFile.type}: ${fileName}`);

    const updatedMediaFile = await (mediaFile.type === 'image'
      ? processImage(
          filePath,
          thumbnailPath,
          thumbnailPathRetina,
          thumbnailConfig.size,
          thumbnailConfig.edge,
          lastMediaTimestamp,
        )
      : processVideo(
          filePath,
          thumbnailPath,
          thumbnailPathRetina,
          thumbnailConfig.size,
          thumbnailConfig.edge,
          verbose,
          lastMediaTimestamp,
        ));

    if (!updatedMediaFile) {
      ui.debug(`  Skipping ${fileName} because it has already been processed`);

      // Check if we need to generate BlurHash for existing thumbnail
      if (mediaFile.thumbnail && !mediaFile.thumbnail.blurHash && fs.existsSync(thumbnailPath)) {
        try {
          const blurHash = await generateBlurHash(thumbnailPath);
          return {
            ...mediaFile,
            thumbnail: {
              ...mediaFile.thumbnail,
              blurHash,
            },
          };
        } catch (error) {
          ui.debug(`  Failed to generate BlurHash for ${fileName}:`, error);
        }
      }

      return mediaFile;
    }

    updatedMediaFile.filename = mediaFile.filename;
    if (updatedMediaFile.thumbnail) {
      updatedMediaFile.thumbnail.path = path.basename(thumbnailPath);
      updatedMediaFile.thumbnail.pathRetina = path.basename(thumbnailPathRetina);
      // Preserve baseUrl from existing thumbnail if it exists
      if (mediaFile.thumbnail?.baseUrl) {
        updatedMediaFile.thumbnail.baseUrl = mediaFile.thumbnail.baseUrl;
      }
    }

    if (mediaFile.url) {
      updatedMediaFile.url = mediaFile.url;
    }

    return updatedMediaFile;
  } catch (error) {
    handleFileProcessingError(error, mediaFile.filename, ui);

    return { ...mediaFile, thumbnail: undefined };
  }
}

/**
 * Processes all media files in a gallery to generate thumbnails
 * @param galleryDir - Directory containing the gallery
 * @param ui - ConsolaInstance for logging
 * @param cliThumbnailConfig - Optional CLI overrides for thumbnail configuration
 * @returns Promise resolving to the number of files processed
 */
export async function processGalleryThumbnails(
  galleryDir: string,
  ui: ConsolaInstance,
  cliThumbnailConfig?: ThumbnailConfig,
): Promise<number> {
  const galleryJsonPath = path.join(galleryDir, 'gallery', 'gallery.json');
  const thumbnailsPath = path.join(galleryDir, 'gallery', 'images');

  ui.start(`Creating thumbnails: ${galleryDir}`);

  try {
    // Ensure thumbnails directory exists
    fs.mkdirSync(thumbnailsPath, { recursive: true });

    // Read gallery.json
    const galleryData = parseGalleryJson(galleryJsonPath, ui);

    // Extract thumbnail config from gallery.json
    const galleryThumbnailConfig = extractThumbnailConfigFromGallery(galleryData);

    // Load theme config if gallery specifies a theme
    let themeConfig: ThumbnailConfig | undefined;
    if (galleryData.theme) {
      try {
        const themeDir = await resolveThemeDir(galleryData.theme, ui);
        themeConfig = loadThemeConfig(themeDir);
      } catch {
        ui.debug(`Could not load theme config from ${galleryData.theme}, using defaults`);
      }
    }

    // Merge with 4-level hierarchy: CLI > gallery.json > theme > defaults
    const thumbnailConfig = mergeThumbnailConfig(cliThumbnailConfig, galleryThumbnailConfig, themeConfig);

    ui.debug(`Thumbnail config: size=${thumbnailConfig.size}, edge=${thumbnailConfig.edge}`);

    // If the mediaBasePath is not set, use the gallery directory
    const mediaBasePath = galleryData.mediaBasePath ?? path.join(galleryDir);

    // Process all sections and their images
    let processedCount = 0;
    for (const section of galleryData.sections) {
      for (const [index, mediaFile] of section.images.entries()) {
        section.images[index] = await processMediaFile(mediaFile, mediaBasePath, thumbnailsPath, thumbnailConfig, ui);
      }

      processedCount += section.images.length;
    }

    // Write updated gallery.json
    fs.writeFileSync(galleryJsonPath, JSON.stringify(galleryData, null, 2));

    ui.success(`Created thumbnails for ${processedCount} media files`);

    return processedCount;
  } catch (error) {
    ui.error(`Error creating thumbnails for ${galleryDir}`);
    throw error;
  }
}

/**
 * Main thumbnails command implementation - generates thumbnails for all galleries
 * @param options - Options specifying gallery path and recursion settings
 * @param ui - ConsolaInstance for logging
 */
export async function thumbnails(options: ThumbnailOptions, ui: ConsolaInstance): Promise<CommandResultSummary> {
  try {
    // Find all gallery directories
    const galleryDirs = findGalleries(options.gallery, options.recursive);
    if (galleryDirs.length === 0) {
      ui.error('No galleries found.');
      return { processedGalleryCount: 0, processedMediaCount: 0 };
    }

    // Create CLI thumbnail config from options (only include values that were provided)
    const cliThumbnailConfig: ThumbnailConfig | undefined =
      options.thumbnailSize !== undefined || options.thumbnailEdge !== undefined
        ? { size: options.thumbnailSize, edge: options.thumbnailEdge }
        : undefined;

    // Process each gallery directory
    let totalGalleries = 0;
    let totalProcessed = 0;
    for (const galleryDir of galleryDirs) {
      const processed = await processGalleryThumbnails(galleryDir, ui, cliThumbnailConfig);

      if (processed > 0) {
        ++totalGalleries;
        totalProcessed += processed;
      }
    }

    ui.box(
      `Created thumbnails for ${totalGalleries} ${totalGalleries === 1 ? 'gallery' : 'galleries'} with ${totalProcessed} media ${totalProcessed === 1 ? 'file' : 'files'}`,
    );

    return { processedGalleryCount: totalGalleries, processedMediaCount: totalProcessed };
  } catch (error) {
    ui.error('Error creating thumbnails');
    throw error;
  }
}
