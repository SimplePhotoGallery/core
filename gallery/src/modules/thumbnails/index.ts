import fs from 'node:fs';
import path from 'node:path';

import { GalleryDataSchema, type MediaFile } from '@simple-photo-gallery/common/src/gallery';
import { LogLevels, type ConsolaInstance } from 'consola';

import { getFileMtime } from './utils';

import { DEFAULT_THUMBNAIL_SIZE } from '../../config';
import { findGalleries, handleFileProcessingError } from '../../utils';
import { generateBlurHash } from '../../utils/blurhash';
import { getImageDescription, createImageThumbnails, loadImageWithMetadata } from '../../utils/image';
import { getVideoDimensions, createVideoThumbnails } from '../../utils/video';
import { setCommandMetrics } from '../../utils/command-metrics';

import type { ThumbnailOptions } from './types';

/**
 * Processes an image file to create thumbnail and extract metadata
 * @param imagePath - Path to the image file
 * @param thumbnailPath - Path where thumbnail should be saved
 * @param thumbnailPathRetina - Path where retina thumbnail should be saved
 * @param thumbnailSize - Target size for thumbnail
 * @param lastMediaTimestamp - Optional timestamp to check if processing can be skipped
 * @returns Promise resolving to updated MediaFile or undefined if skipped
 */
export async function processImage(
  imagePath: string,
  thumbnailPath: string,
  thumbnailPathRetina: string,
  thumbnailSize: number,
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
  );

  // Generate BlurHash from the thumbnail
  const blurHash = await generateBlurHash(thumbnailPath);

  // Return the updated media file
  return {
    type: 'image',
    path: imagePath,
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
 * @param verbose - Whether to enable verbose output
 * @param lastMediaTimestamp - Optional timestamp to check if processing can be skipped
 * @returns Promise resolving to updated MediaFile or undefined if skipped
 */
async function processVideo(
  videoPath: string,
  thumbnailPath: string,
  thumbnailPathRetina: string,
  thumbnailSize: number,
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
    verbose,
  );

  // Generate BlurHash from the thumbnail
  const blurHash = await generateBlurHash(thumbnailPath);

  return {
    type: 'video',
    path: videoPath,
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
 * @param galleryDir - Gallery directory path
 * @param thumbnailsPath - Directory where thumbnails are stored
 * @param thumbnailSize - Target size for thumbnails
 * @param ui - ConsolaInstance for logging
 * @returns Promise resolving to updated MediaFile
 */
async function processMediaFile(
  mediaFile: MediaFile,
  galleryDir: string,
  thumbnailsPath: string,
  thumbnailSize: number,
  ui: ConsolaInstance,
): Promise<MediaFile> {
  try {
    // Resolve the path relative to the gallery.json file location, not the gallery directory
    const galleryJsonDir = path.join(galleryDir, 'gallery');
    const filePath = path.resolve(path.join(galleryJsonDir, mediaFile.path));

    const fileName = path.basename(filePath);
    const fileNameWithoutExt = path.parse(fileName).name;
    const thumbnailFileName = `${fileNameWithoutExt}.avif`;
    const thumbnailPath = path.join(thumbnailsPath, thumbnailFileName);
    const thumbnailPathRetina = thumbnailPath.replace('.avif', '@2x.avif');
    const relativeThumbnailPath = path.relative(galleryJsonDir, thumbnailPath);
    const relativeThumbnailRetinaPath = path.relative(galleryJsonDir, thumbnailPathRetina);

    const lastMediaTimestamp = mediaFile.lastMediaTimestamp ? new Date(mediaFile.lastMediaTimestamp) : undefined;
    const verbose = ui.level === LogLevels.debug;

    ui.debug(`  Processing ${mediaFile.type}: ${fileName}`);

    const updatedMediaFile = await (mediaFile.type === 'image'
      ? processImage(filePath, thumbnailPath, thumbnailPathRetina, thumbnailSize, lastMediaTimestamp)
      : processVideo(filePath, thumbnailPath, thumbnailPathRetina, thumbnailSize, verbose, lastMediaTimestamp));

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

    updatedMediaFile.path = mediaFile.path;
    if (updatedMediaFile.thumbnail) {
      updatedMediaFile.thumbnail.path = relativeThumbnailPath;
      updatedMediaFile.thumbnail.pathRetina = relativeThumbnailRetinaPath;
    }

    return updatedMediaFile;
  } catch (error) {
    handleFileProcessingError(error, path.basename(mediaFile.path), ui);

    return mediaFile;
  }
}

/**
 * Processes all media files in a gallery to generate thumbnails
 * @param galleryDir - Directory containing the gallery
 * @param ui - ConsolaInstance for logging
 * @returns Promise resolving to the number of files processed
 */
export async function processGalleryThumbnails(galleryDir: string, ui: ConsolaInstance): Promise<number> {
  const galleryJsonPath = path.join(galleryDir, 'gallery', 'gallery.json');
  const thumbnailsPath = path.join(galleryDir, 'gallery', 'images');

  ui.start(`Creating thumbnails: ${galleryDir}`);

  try {
    // Ensure thumbnails directory exists
    fs.mkdirSync(thumbnailsPath, { recursive: true });

    // Read gallery.json
    const galleryContent = fs.readFileSync(galleryJsonPath, 'utf8');
    const galleryData = GalleryDataSchema.parse(JSON.parse(galleryContent));

    const thumbnailSize = galleryData.thumbnailSize || DEFAULT_THUMBNAIL_SIZE;

    // Process all sections and their images
    let processedCount = 0;
    for (const section of galleryData.sections) {
      for (const [index, mediaFile] of section.images.entries()) {
        section.images[index] = await processMediaFile(mediaFile, galleryDir, thumbnailsPath, thumbnailSize, ui);
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
export async function thumbnails(options: ThumbnailOptions, ui: ConsolaInstance): Promise<void> {
  try {
    // Find all gallery directories
    const galleryDirs = findGalleries(options.gallery, options.recursive);
    if (galleryDirs.length === 0) {
      ui.error('No galleries found.');
      return;
    }

    // Process each gallery directory
    let totalGalleries = 0;
    let totalProcessed = 0;
    for (const galleryDir of galleryDirs) {
      const processed = await processGalleryThumbnails(galleryDir, ui);

      if (processed > 0) {
        ++totalGalleries;
        totalProcessed += processed;
      }
    }

    ui.box(
      `Created thumbnails for ${totalGalleries} ${totalGalleries === 1 ? 'gallery' : 'galleries'} with ${totalProcessed} media ${totalProcessed === 1 ? 'file' : 'files'}`,
    );

    // Set metrics for telemetry
    setCommandMetrics({
      itemsProcessed: totalProcessed,
      itemType: 'thumbnails',
    });
  } catch (error) {
    ui.error('Error creating thumbnails');
    throw error;
  }
}
