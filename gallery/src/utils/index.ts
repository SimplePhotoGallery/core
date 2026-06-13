import fs from 'node:fs';
import path from 'node:path';

import { THUMBNAIL_FORMATS } from '@simple-photo-gallery/common/theme';

import type { ThumbnailConfig, ThumbnailFormat } from '@simple-photo-gallery/common/theme';
import type { ConsolaInstance } from 'consola';

/**
 * Finds all gallery directories that contain a gallery/gallery.json file.
 *
 * @param basePath - The base directory to search from
 * @param recursive - Whether to search subdirectories recursively
 * @returns Array of paths to directories containing gallery/gallery.json files
 */
export function findGalleries(basePath: string, recursive: boolean): string[] {
  const galleryDirs: string[] = [];

  // Check basePath itself
  const galleryJsonPath = path.join(basePath, 'gallery', 'gallery.json');
  if (fs.existsSync(galleryJsonPath)) {
    galleryDirs.push(basePath);
  }

  // If recursive, search all subdirectories
  if (recursive) {
    try {
      const entries = fs.readdirSync(basePath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name !== 'gallery') {
          const subPath = path.join(basePath, entry.name);
          const subResults = findGalleries(subPath, recursive);
          galleryDirs.push(...subResults);
        }
      }
    } catch {
      // Silently ignore errors when reading directories
    }
  }

  return galleryDirs;
}

/**
 * Handles file processing errors with appropriate user-friendly messages
 * @param error - The error that occurred during file processing
 * @param filename - Name of the file that caused the error
 * @param ui - ConsolaInstance for logging messages
 */
export function handleFileProcessingError(error: unknown, filename: string, ui: ConsolaInstance): void {
  if (error instanceof Error && (error.message.includes('ffprobe') || error.message.includes('ffmpeg'))) {
    // Handle ffmpeg error
    ui.warn(
      `Error processing ${filename}: ffprobe (part of ffmpeg) is required to process videos. Please install ffmpeg and ensure it is available in your PATH`,
    );
  } else if (error instanceof Error && error.message.includes('unsupported image format')) {
    // Handle unsupported image format error
    ui.warn(`Error processing ${filename}: unsupported image format`);
  } else {
    // Handle unknown error
    ui.warn(`Error processing ${filename}`);
  }

  ui.debug(error);
}

/**
 * Parses the telemetry option
 * @param value - The value to parse
 * @returns The parsed telemetry option
 */
export function parseTelemetryOption(value: string): '0' | '1' {
  if (value !== '0' && value !== '1') {
    throw new Error('Telemetry option must be either 0 or 1.');
  }

  return value;
}

/**
 * Parses and validates the thumbnail format CLI option
 * @param value - The value to parse
 * @returns The parsed thumbnail format
 */
export function parseThumbnailFormat(value: string): ThumbnailFormat {
  if (!(THUMBNAIL_FORMATS as readonly string[]).includes(value)) {
    throw new Error(`Thumbnail format must be one of: ${THUMBNAIL_FORMATS.join(', ')}.`);
  }

  return value as ThumbnailFormat;
}

/** Subset of CLI options that map to thumbnail configuration overrides */
export interface CliThumbnailOptions {
  thumbnailSize?: number;
  thumbnailEdge?: 'auto' | 'width' | 'height';
  thumbnailFormat?: ThumbnailFormat;
  thumbnailQuality?: number;
  thumbnailEffort?: number;
}

/**
 * Builds a ThumbnailConfig from CLI options, including only the values that were provided.
 * @param options - CLI options carrying thumbnail overrides
 * @returns A ThumbnailConfig with the provided overrides, or undefined when none were given
 */
export function buildCliThumbnailConfig(options: CliThumbnailOptions): ThumbnailConfig | undefined {
  const config: ThumbnailConfig = {};

  if (options.thumbnailSize !== undefined) {
    config.size = options.thumbnailSize;
  }
  if (options.thumbnailEdge !== undefined) {
    config.edge = options.thumbnailEdge;
  }
  if (options.thumbnailFormat !== undefined) {
    config.format = options.thumbnailFormat;
  }
  if (options.thumbnailQuality !== undefined) {
    config.quality = options.thumbnailQuality;
  }
  if (options.thumbnailEffort !== undefined) {
    config.effort = options.thumbnailEffort;
  }

  return Object.keys(config).length > 0 ? config : undefined;
}
