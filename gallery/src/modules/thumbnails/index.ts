import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

import {
  extractThumbnailConfigFromGallery,
  getThumbnailExtension,
  mergeThumbnailConfig,
  loadThemeConfig,
} from '@simple-photo-gallery/common/theme';
import { LogLevels, type ConsolaInstance } from 'consola';

import { getFileMtime } from './utils';

import { buildCliThumbnailConfig, findGalleries, handleFileProcessingError } from '../../utils';
import { generateBlurHash } from '../../utils/blurhash';
import { mapWithConcurrency } from '../../utils/concurrency';
import { getImageDescription } from '../../utils/descriptions';
import { parseGalleryJson, writeGalleryJsonAtomic } from '../../utils/gallery';
import {
  createImageThumbnails,
  loadImageWithMetadata,
  type ImageEncodeOptions,
  type ThumbnailSizeDimension,
} from '../../utils/image';
import { checkVideoToolchain, getVideoDimensions, createVideoThumbnails } from '../../utils/video';
import { resolveThemeDir } from '../build';

import type { ThumbnailOptions } from './types';
import type { CommandResultSummary } from '../telemetry/types';
import type { MediaFile } from '@simple-photo-gallery/common';
import type { ResolvedThumbnailConfig, ThumbnailConfig } from '@simple-photo-gallery/common/theme';

type MediaProcessingStatus = 'processed' | 'skipped' | 'failed';

interface ProcessMediaFileResult {
  mediaFile: MediaFile;
  status: MediaProcessingStatus;
}

interface FailedMediaFile {
  filename: string;
}

/**
 * Processes an image file to create thumbnail and extract metadata
 * @param imagePath - Path to the image file
 * @param thumbnailPath - Path where thumbnail should be saved
 * @param thumbnailPathRetina - Path where retina thumbnail should be saved
 * @param thumbnailSize - Target size for thumbnail
 * @param thumbnailSizeDimension - How to apply size: 'auto', 'width', or 'height'
 * @param encodeOptions - Encoding options (format, quality, effort)
 * @param lastMediaTimestamp - Optional timestamp to check if processing can be skipped
 * @returns Promise resolving to updated MediaFile or undefined if skipped
 */
export async function processImage(
  imagePath: string,
  thumbnailPath: string,
  thumbnailPathRetina: string,
  thumbnailSize: number,
  thumbnailSizeDimension: ThumbnailSizeDimension = 'auto',
  encodeOptions: ImageEncodeOptions = {},
  lastMediaTimestamp?: Date,
): Promise<MediaFile | undefined> {
  // Get the last media timestamp
  const fileMtime = await getFileMtime(imagePath);

  // Check if processing of the file can be skipped
  if (lastMediaTimestamp && fileMtime <= lastMediaTimestamp && fs.existsSync(thumbnailPath)) {
    return undefined;
  }

  // Read the original once and reuse the buffer for metadata, thumbnails, blurhash and EXIF so the
  // file (potentially tens of MB) is read from disk a single time instead of once per consumer.
  const inputBuffer = await fs.promises.readFile(imagePath);

  // Load the image and get metadata first to check orientation
  const { image, metadata } = await loadImageWithMetadata(inputBuffer);

  // Get the image dimensions
  const imageDimensions = {
    width: metadata.width || 0,
    height: metadata.height || 0,
  };

  if (imageDimensions.width === 0 || imageDimensions.height === 0) {
    throw new Error('Invalid image dimensions');
  }

  // Get the image description
  const description = await getImageDescription(inputBuffer);

  // Create the thumbnails
  const thumbnailDimensions = await createImageThumbnails(
    image,
    metadata,
    thumbnailPath,
    thumbnailPathRetina,
    thumbnailSize,
    thumbnailSizeDimension,
    encodeOptions,
  );

  // Generate BlurHash from the in-memory original, avoiding a re-read and decode of the written thumbnail
  const blurHash = await generateBlurHash(inputBuffer);

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
 * @param encodeOptions - Encoding options (format, quality, effort)
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
  ui: ConsolaInstance,
  encodeOptions: ImageEncodeOptions = {},
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
    verbose ? (message) => ui.debug(`ffmpeg: ${message.trimEnd()}`) : undefined,
    encodeOptions,
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
 * @param thumbnailConfig - Resolved thumbnail configuration (size, edge, format, quality, effort)
 * @param ui - ConsolaInstance for logging
 * @returns Promise resolving to updated MediaFile
 */
async function processMediaFile(
  mediaFile: MediaFile,
  mediaBasePath: string,
  thumbnailsPath: string,
  thumbnailConfig: ResolvedThumbnailConfig,
  ui: ConsolaInstance,
  canProcessVideos: boolean,
): Promise<ProcessMediaFileResult> {
  if (mediaFile.type === 'video' && !canProcessVideos) {
    return { mediaFile, status: 'skipped' };
  }

  try {
    // Resolve the path relative to the mediaBasePath
    const filePath = path.resolve(path.join(mediaBasePath, mediaFile.filename));

    const fileName = mediaFile.filename;
    const fileNameWithoutExt = path.parse(fileName).name;
    const extension = getThumbnailExtension(thumbnailConfig.format);
    const thumbnailPath = path.join(thumbnailsPath, `${fileNameWithoutExt}.${extension}`);
    const thumbnailPathRetina = path.join(thumbnailsPath, `${fileNameWithoutExt}@2x.${extension}`);

    const encodeOptions: ImageEncodeOptions = {
      format: thumbnailConfig.format,
      quality: thumbnailConfig.quality,
      effort: thumbnailConfig.effort,
    };

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
          encodeOptions,
          lastMediaTimestamp,
        )
      : processVideo(
          filePath,
          thumbnailPath,
          thumbnailPathRetina,
          thumbnailConfig.size,
          thumbnailConfig.edge,
          verbose,
          ui,
          encodeOptions,
          lastMediaTimestamp,
        ));

    if (!updatedMediaFile) {
      ui.debug(`  Skipping ${fileName} because it has already been processed`);

      // Check if we need to generate BlurHash for existing thumbnail
      if (mediaFile.thumbnail && !mediaFile.thumbnail.blurHash && fs.existsSync(thumbnailPath)) {
        try {
          const blurHash = await generateBlurHash(thumbnailPath);
          return {
            mediaFile: {
              ...mediaFile,
              thumbnail: {
                ...mediaFile.thumbnail,
                blurHash,
              },
            },
            status: 'processed',
          };
        } catch (error) {
          ui.debug(`  Failed to generate BlurHash for ${fileName}:`, error);
        }
      }

      return { mediaFile, status: 'skipped' };
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

    return { mediaFile: updatedMediaFile, status: 'processed' };
  } catch (error) {
    handleFileProcessingError(error, mediaFile.filename, ui);

    return { mediaFile: { ...mediaFile, thumbnail: undefined }, status: 'failed' };
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

    ui.debug(
      `Thumbnail config: size=${thumbnailConfig.size}, edge=${thumbnailConfig.edge}, format=${thumbnailConfig.format}` +
        `${thumbnailConfig.quality === undefined ? '' : `, quality=${thumbnailConfig.quality}`}` +
        `${thumbnailConfig.effort === undefined ? '' : `, effort=${thumbnailConfig.effort}`}`,
    );

    // If the mediaBasePath is not set, use the gallery directory
    const mediaBasePath = galleryData.mediaBasePath ?? path.join(galleryDir);

    const writeGalleryData = (): void => writeGalleryJsonAtomic(galleryJsonPath, galleryData);

    // On interruption (e.g. Ctrl-C) flush the progress made so far before exiting. Each completed file
    // records its lastMediaTimestamp, so a subsequent run skips everything already finished instead of
    // starting the whole gallery over.
    const flushAndExit = (exitCode: number) => (): void => {
      writeGalleryData();
      // eslint-disable-next-line unicorn/no-process-exit
      process.exit(exitCode);
    };
    const onSigint = flushAndExit(130);
    const onSigterm = flushAndExit(143);
    process.once('SIGINT', onSigint);
    process.once('SIGTERM', onSigterm);

    // Process media files in parallel. Thumbnailing is IO/CPU bound (Sharp and ffmpeg release the JS
    // thread), so a worker pool sized to the available cores processes a large gallery several times
    // faster than the previous one-at-a-time loop while keeping per-file error isolation.
    const concurrency = Math.max(2, os.cpus().length - 1);
    const videoFiles = galleryData.sections
      .flatMap((section) => section.images)
      .filter((mediaFile) => mediaFile.type === 'video');
    const videoToolchain = videoFiles.length > 0 ? checkVideoToolchain() : { available: true, missing: [], installHint: '' };
    if (!videoToolchain.available) {
      ui.warn(
        `Skipping ${videoFiles.length} video ${videoFiles.length === 1 ? 'file' : 'files'} because ${videoToolchain.missing.join(
          ' and ',
        )} ${videoToolchain.missing.length === 1 ? 'is' : 'are'} not available. ${videoToolchain.installHint}`,
      );
    }

    // Flush progress to disk every PROGRESS_WRITE_INTERVAL files so a long run that is interrupted can
    // resume instead of redoing all the thumbnails already on disk.
    const PROGRESS_WRITE_INTERVAL = 16;
    let processedCount = 0;
    let skippedCount = 0;
    const failedFiles: FailedMediaFile[] = [];
    let processedSinceWrite = 0;

    try {
      for (const section of galleryData.sections) {
        await mapWithConcurrency(section.images, concurrency, async (mediaFile, index) => {
          const result = await processMediaFile(
            mediaFile,
            mediaBasePath,
            thumbnailsPath,
            thumbnailConfig,
            ui,
            videoToolchain.available,
          );
          section.images[index] = result.mediaFile;

          if (result.status === 'processed') {
            processedCount += 1;
          } else if (result.status === 'skipped') {
            skippedCount += 1;
          } else {
            failedFiles.push({ filename: mediaFile.filename });
          }

          processedSinceWrite += 1;
          if (processedSinceWrite >= PROGRESS_WRITE_INTERVAL) {
            processedSinceWrite = 0;
            writeGalleryData();
          }

          return result;
        });
      }
    } finally {
      process.removeListener('SIGINT', onSigint);
      process.removeListener('SIGTERM', onSigterm);
    }

    // Write the final gallery.json with all processed files
    writeGalleryData();

    if (failedFiles.length > 0) {
      ui.warn(
        `${failedFiles.length} media ${failedFiles.length === 1 ? 'file' : 'files'} failed during thumbnail processing: ${failedFiles
          .map((file) => file.filename)
          .join(', ')}`,
      );
      throw new Error(`Failed to process ${failedFiles.length} media ${failedFiles.length === 1 ? 'file' : 'files'}`);
    }

    ui.success(
      `Created thumbnails for ${processedCount} media ${processedCount === 1 ? 'file' : 'files'}${
        skippedCount > 0 ? ` (${skippedCount} skipped)` : ''
      }`,
    );

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
    const cliThumbnailConfig = buildCliThumbnailConfig(options);

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
