import fs from 'node:fs';
import path from 'node:path';

import { findGalleries } from '../../utils';
import { setCommandMetrics } from '../../utils/command-metrics';

import type { CleanOptions } from './types';
import type { ConsolaInstance } from 'consola';

/**
 * Clean gallery files from a single directory
 * @param galleryDir - Directory containing a gallery
 * @param ui - Consola instance for logging
 */
async function cleanGallery(galleryDir: string, ui: ConsolaInstance): Promise<void> {
  let filesRemoved = 0;

  // Remove index.html file from the gallery directory
  const indexHtmlPath = path.join(galleryDir, 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    try {
      fs.rmSync(indexHtmlPath);
      ui.debug(`Removed: ${indexHtmlPath}`);
      filesRemoved++;
    } catch (error) {
      ui.warn(`Failed to remove index.html: ${error}`);
    }
  }

  // Remove gallery directory and all its contents
  const galleryPath = path.join(galleryDir, 'gallery');
  if (fs.existsSync(galleryPath)) {
    try {
      fs.rmSync(galleryPath, { recursive: true, force: true });
      ui.debug(`Removed directory: ${galleryPath}`);
      filesRemoved++;
    } catch (error) {
      ui.warn(`Failed to remove gallery directory: ${error}`);
    }
  }

  if (filesRemoved > 0) {
    ui.success(`Cleaned gallery at: ${galleryDir}`);
  } else {
    ui.info(`No gallery files found at: ${galleryDir}`);
  }
}

/**
 * Clean command implementation
 * Removes all gallery-related files and directories
 */
export async function clean(options: CleanOptions, ui: ConsolaInstance): Promise<void> {
  try {
    const basePath = path.resolve(options.gallery);

    // Check if the base path exists
    if (!fs.existsSync(basePath)) {
      ui.error(`Directory does not exist: ${basePath}`);
      return;
    }

    // Find all gallery directories
    const galleryDirs = findGalleries(basePath, options.recursive);

    if (galleryDirs.length === 0) {
      ui.info('No galleries found to clean.');
      return;
    }

    // Clean each gallery directory
    for (const dir of galleryDirs) {
      await cleanGallery(dir, ui);
    }

    ui.box(`Successfully cleaned ${galleryDirs.length} ${galleryDirs.length === 1 ? 'gallery' : 'galleries'}`);

    // Set metrics for telemetry
    setCommandMetrics({
      itemsProcessed: galleryDirs.length,
      itemType: 'galleries',
    });
  } catch (error) {
    ui.error('Error cleaning galleries');
    throw error;
  }
}
