import fs from 'node:fs';

import type { GalleryData } from '../gallery';

/**
 * Load gallery data from a JSON file.
 *
 * @param galleryJsonPath - Path to the gallery.json file. Defaults to './gallery.json'.
 * @returns The parsed gallery data
 * @throws Error if file cannot be read or parsed
 */
export function loadGalleryData(galleryJsonPath = './gallery.json'): GalleryData {
  const galleryData = JSON.parse(fs.readFileSync(galleryJsonPath, 'utf8'));
  return galleryData as GalleryData;
}
