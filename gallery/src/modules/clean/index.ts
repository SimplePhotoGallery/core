import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { findGalleries } from '../../utils';

import type { CleanOptions } from './types';
import type { CommandResultSummary } from '../telemetry/types';
import type { ConsolaInstance } from 'consola';

/** Files in the gallery directory that contain user-curated content and are preserved unless --all is passed */
const PRESERVED_FILES = new Set(['gallery.json', 'gallery.json.old']);

/**
 * Clean gallery files from a single directory
 * @param galleryDir - Directory containing a gallery
 * @param removeAll - Whether to also remove gallery.json instead of only generated files
 * @param ui - Consola instance for logging
 */
async function cleanGallery(galleryDir: string, removeAll: boolean, ui?: ConsolaInstance): Promise<CommandResultSummary> {
  let filesRemoved = 0;

  // Remove index.html file from the gallery directory
  const indexHtmlPath = path.join(galleryDir, 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    try {
      fs.rmSync(indexHtmlPath);
      ui?.debug(`Removed: ${indexHtmlPath}`);
      filesRemoved++;
    } catch (error) {
      ui?.warn(`Failed to remove index.html: ${error}`);
    }
  }

  const galleryPath = path.join(galleryDir, 'gallery');
  if (fs.existsSync(galleryPath)) {
    if (removeAll) {
      // Remove the gallery directory and all its contents, including gallery.json
      try {
        fs.rmSync(galleryPath, { recursive: true, force: true });
        ui?.debug(`Removed directory: ${galleryPath}`);
        filesRemoved++;
      } catch (error) {
        ui?.warn(`Failed to remove gallery directory: ${error}`);
      }
    } else {
      // Remove only generated files, preserving gallery.json with the user's titles, descriptions and sections
      for (const entry of fs.readdirSync(galleryPath)) {
        if (PRESERVED_FILES.has(entry)) {
          continue;
        }

        const entryPath = path.join(galleryPath, entry);
        try {
          fs.rmSync(entryPath, { recursive: true, force: true });
          ui?.debug(`Removed: ${entryPath}`);
          filesRemoved++;
        } catch (error) {
          ui?.warn(`Failed to remove ${entryPath}: ${error}`);
        }
      }
    }
  }

  if (filesRemoved > 0) {
    ui?.success(`Cleaned gallery at: ${galleryDir}`);
  } else {
    ui?.info(`No gallery files found at: ${galleryDir}`);
  }

  return { processedGalleryCount: filesRemoved };
}

/**
 * Clean command implementation
 * Removes generated gallery files (index.html, thumbnails, built assets).
 * gallery.json is preserved unless the --all option is passed, since it contains user-curated content.
 */
export async function clean(options: CleanOptions, ui: ConsolaInstance): Promise<CommandResultSummary> {
  try {
    const basePath = path.resolve(options.gallery);

    // Check if the base path exists
    if (!fs.existsSync(basePath)) {
      ui.error(`Directory does not exist: ${basePath}`);
      return { processedGalleryCount: 0 };
    }

    // Find all gallery directories
    const galleryDirs = findGalleries(basePath, options.recursive);

    if (galleryDirs.length === 0) {
      ui.info('No galleries found to clean.');
      return { processedGalleryCount: 0 };
    }

    // Ask for confirmation before deleting gallery.json files, which contain user-curated content
    if (options.all && !options.force) {
      if (!process.stdout.isTTY) {
        ui.error('Refusing to remove gallery.json files without confirmation. Use --force to skip the prompt.');
        return { processedGalleryCount: 0 };
      }

      const confirmed = await ui.prompt(
        'This will also delete gallery.json files, including all titles, descriptions and sections. Continue?',
        { type: 'confirm' },
      );

      if (confirmed !== true) {
        ui.info('Clean cancelled');
        return { processedGalleryCount: 0 };
      }
    }

    // Clean each gallery directory
    for (const dir of galleryDirs) {
      await cleanGallery(dir, options.all, ui);
    }

    ui.box(`Successfully cleaned ${galleryDirs.length} ${galleryDirs.length === 1 ? 'gallery' : 'galleries'}`);

    return { processedGalleryCount: galleryDirs.length };
  } catch (error) {
    ui.error('Error cleaning galleries');
    throw error;
  }
}
