import fs from 'node:fs';
import path from 'node:path';

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
