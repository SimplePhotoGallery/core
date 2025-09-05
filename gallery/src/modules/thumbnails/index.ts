import fs from 'node:fs';
import path from 'node:path';

import { LogLevels, type ConsolaInstance } from 'consola';
import sharp from 'sharp';

import { createImageThumbnail, createVideoThumbnail, getImageDescription, getFileMtime, getVideoDimensions } from './utils';

import { GalleryDataSchema, type MediaFile } from '../../types';
import { findGalleries, handleFileProcessingError } from '../../utils';

import type { ThumbnailOptions } from './types';

/**
 * Processes an image file to create a thumbnail and extract metadata.
 * @param imagePath - Path to the image file
 * @param thumbnailPath - Path where the thumbnail should be saved
 * @param thumbnailSize - Target size for the thumbnail
 * @param lastMediaTimestamp - Optional timestamp to check if processing can be skipped
 * @returns Promise resolving to updated MediaFile or undefined if processing was skipped
 */
async function processImage(
  imagePath: string,
  thumbnailPath: string,
  thumbnailSize: number,
  lastMediaTimestamp?: Date,
): Promise<MediaFile | undefined> {
  // Get the last media timestamp
  const fileMtime = await getFileMtime(imagePath);

  // Check if processing of the file can be skipped
  if (lastMediaTimestamp && fileMtime <= lastMediaTimestamp && fs.existsSync(thumbnailPath)) {
    return undefined;
  }

  // Load the image
  const image = sharp(imagePath);
  const metadata = await image.metadata();

  // Get the image dimensions
  const imageDimensions = {
    width: metadata.width || 0,
    height: metadata.height || 0,
  };

  if (imageDimensions.width === 0 || imageDimensions.height === 0) {
    throw new Error('Invalid image dimensions');
  }

  // Get the image description
  const description = await getImageDescription(metadata);

  // Create the thumbnail
  const thumbnailDimensions = await createImageThumbnail(image, metadata, thumbnailPath, thumbnailSize);

  // Return the updated media file
  return {
    type: 'image',
    path: imagePath,
    alt: description,
    width: imageDimensions.width,
    height: imageDimensions.height,
    thumbnail: {
      path: thumbnailPath,
      width: thumbnailDimensions.width,
      height: thumbnailDimensions.height,
    },
    lastMediaTimestamp: fileMtime.toISOString(),
  };
}

/**
 * Processes a video file to create a thumbnail and extract metadata.
 * @param videoPath - Path to the video file
 * @param thumbnailPath - Path where the thumbnail should be saved
 * @param thumbnailSize - Target size for the thumbnail
 * @param verbose - Whether to enable verbose output
 * @param lastMediaTimestamp - Optional timestamp to check if processing can be skipped
 * @returns Promise resolving to updated MediaFile or undefined if processing was skipped
 */
async function processVideo(
  videoPath: string,
  thumbnailPath: string,
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
  const thumbnailDimensions = await createVideoThumbnail(videoPath, videoDimensions, thumbnailPath, thumbnailSize, verbose);

  return {
    type: 'video',
    path: videoPath,
    alt: undefined,
    width: videoDimensions.width,
    height: videoDimensions.height,
    thumbnail: {
      path: thumbnailPath,
      width: thumbnailDimensions.width,
      height: thumbnailDimensions.height,
    },
    lastMediaTimestamp: fileMtime.toISOString(),
  };
}

/**
 * Processes a single media file to generate its thumbnail and update metadata.
 * @param mediaFile - The media file to process
 * @param galleryDir - The base gallery directory
 * @param thumbnailsPath - Path to the thumbnails directory
 * @param thumbnailSize - Target size for thumbnails
 * @param ui - The ConsolaInstance for logging messages
 * @returns Promise resolving to the updated MediaFile
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
    const thumbnailFileName = `${fileNameWithoutExt}.jpg`;
    const thumbnailPath = path.join(thumbnailsPath, thumbnailFileName);
    const relativeThumbnailPath = path.relative(galleryJsonDir, thumbnailPath);

    const lastMediaTimestamp = mediaFile.lastMediaTimestamp ? new Date(mediaFile.lastMediaTimestamp) : undefined;
    const verbose = ui.level === LogLevels.debug;

    ui.debug(`  Processing ${mediaFile.type}: ${fileName}`);

    const updatedMediaFile = await (mediaFile.type === 'image'
      ? processImage(filePath, thumbnailPath, thumbnailSize, lastMediaTimestamp)
      : processVideo(filePath, thumbnailPath, thumbnailSize, verbose, lastMediaTimestamp));

    if (!updatedMediaFile) {
      ui.debug(`  Skipping ${fileName} because it has already been processed`);
      return mediaFile;
    }

    updatedMediaFile.path = mediaFile.path;
    if (updatedMediaFile.thumbnail) {
      updatedMediaFile.thumbnail.path = relativeThumbnailPath;
    }

    return updatedMediaFile;
  } catch (error) {
    handleFileProcessingError(error, path.basename(mediaFile.path), ui);

    return mediaFile;
  }
}

/**
 * Processes all media files in a gallery to generate thumbnails.
 * @param galleryDir - Path to the gallery directory
 * @param ui - The ConsolaInstance for logging messages
 * @returns Promise resolving to the number of media files processed
 */
export async function processGalleryThumbnails(galleryDir: string, ui: ConsolaInstance): Promise<number> {
  const galleryJsonPath = path.join(galleryDir, 'gallery', 'gallery.json');
  const thumbnailsPath = path.join(galleryDir, 'gallery', 'thumbnails');

  ui.start(`Creating thumbnails: ${galleryDir}`);

  try {
    // Ensure thumbnails directory exists
    fs.mkdirSync(thumbnailsPath, { recursive: true });

    // Read gallery.json
    const galleryContent = fs.readFileSync(galleryJsonPath, 'utf8');
    const galleryData = GalleryDataSchema.parse(JSON.parse(galleryContent));

    // Process all sections and their images
    let processedCount = 0;
    for (const section of galleryData.sections) {
      for (const [index, mediaFile] of section.images.entries()) {
        section.images[index] = await processMediaFile(mediaFile, galleryDir, thumbnailsPath, galleryData.thumbnailSize, ui);
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
 * Main function for the thumbnails command. Processes all galleries to generate thumbnails.
 * @param options - Configuration options for thumbnail generation
 * @param ui - The ConsolaInstance for logging messages
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
  } catch (error) {
    ui.error('Error creating thumbnails');
    throw error;
  }
}
