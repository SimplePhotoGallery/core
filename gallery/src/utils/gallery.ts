import fs from 'node:fs';

import { GalleryDataSchema } from '@simple-photo-gallery/common/src/gallery';

import type { GalleryData } from '@simple-photo-gallery/common/src/gallery';
import type { ConsolaInstance } from 'consola';

/**
 * Parses a gallery.json file and returns the gallery data
 * @param galleryJsonPath - Path to the gallery.json file
 * @returns Gallery data
 */
export function parseGalleryJson(galleryJsonPath: string, ui: ConsolaInstance): GalleryData {
  let galleryContent: string;
  try {
    galleryContent = fs.readFileSync(galleryJsonPath, 'utf8');
  } catch (error) {
    ui.error('Error parsing gallery.json: file not found');
    throw error;
  }

  try {
    return GalleryDataSchema.parse(JSON.parse(galleryContent));
  } catch (error) {
    ui.error('Error parsing gallery.json: invalid format');
    throw error;
  }
}
