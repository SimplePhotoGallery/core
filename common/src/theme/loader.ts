import fs from 'node:fs';
import process from 'node:process';

import type { GalleryData } from '../gallery';

/**
 * Load gallery data from the GALLERY_JSON_PATH environment variable.
 *
 * @returns The parsed gallery data
 * @throws Error if GALLERY_JSON_PATH is not set or file cannot be read
 */
export function loadGalleryData(): GalleryData {
  const galleryJsonPath = process.env.GALLERY_JSON_PATH || './gallery.json';
  const galleryData = JSON.parse(fs.readFileSync(galleryJsonPath, 'utf8'));
  return galleryData as GalleryData;
}
