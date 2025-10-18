import fs from 'node:fs';

import { GalleryDataDeprecatedSchema, GalleryDataSchema } from '@simple-photo-gallery/common/src/gallery';

import type { GalleryData, GalleryDataDeprecated } from '@simple-photo-gallery/common/src/gallery';
import type { ConsolaInstance } from 'consola';
import path from 'node:path';

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

  let galleryJSON: unknown;
  try {
    galleryJSON = JSON.parse(galleryContent);
  } catch (error) {
    ui.error('Error parsing gallery.json: invalid JSON');
    throw error;
  }

  try {
    return GalleryDataSchema.parse(galleryJSON);
  } catch (error) {
    // Try to parse the JSON using the deprecated schema
    try {
      const deprecatedGalleryData = GalleryDataDeprecatedSchema.parse(galleryJSON);

      // Migrate the gallery data to the new schema
      return migrateGalleryJson(deprecatedGalleryData, galleryJsonPath, ui);
    } catch {
      ui.error('Error parsing gallery.json: invalid gallery data');
      throw error;
    }
  }
}

/**
 * Migrates gallery data from the deprecated schema to the new schema
 *
 * @param deprecatedGalleryData
 * @param galleryJsonPath
 * @param ui
 * @returns
 */
export function migrateGalleryJson(
  deprecatedGalleryData: GalleryDataDeprecated,
  galleryJsonPath: string,
  ui: ConsolaInstance,
): GalleryData {
  ui.start('Old gallery.json format detected. Migrating gallery.json to the new data format.');

  // Check if a mediaBasePath should be used
  let mediaBasePath: string | undefined;

  const imagePath = deprecatedGalleryData.sections[0].images[0].path;
  if (imagePath && imagePath !== path.join('..', path.basename(imagePath))) {
    mediaBasePath = path.resolve(path.join(path.dirname(galleryJsonPath)), path.dirname(imagePath));
  }

  // Transform all images to contain filename instead of path for each section
  const sections = deprecatedGalleryData.sections.map((section) => ({
    ...section,
    images: section.images.map((image) => ({
      ...image,
      path: undefined,
      filename: path.basename(image.path),
    })),
  }));

  const galleryData = {
    ...deprecatedGalleryData,
    sections,
    mediaBasePath,
  };

  // Backup the old gallery.json file
  ui.debug('Backing up old gallery.json file');
  fs.copyFileSync(galleryJsonPath, `${galleryJsonPath}.old`);

  // Write the gallery data to the gallery.json file
  ui.debug('Writing gallery data to gallery.json file');
  fs.writeFileSync(galleryJsonPath, JSON.stringify(galleryData, null, 2));

  ui.success('Gallery data migrated to the new data format successfully.');

  return galleryData;
}
