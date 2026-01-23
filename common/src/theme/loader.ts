import fs from 'node:fs';

import { GalleryDataSchema, type GalleryData } from '../gallery';

export interface LoadGalleryDataOptions {
  /**
   * When true, validates the loaded JSON against the GalleryData schema.
   * Throws a descriptive error if validation fails.
   * @default false
   */
  validate?: boolean;
}

/**
 * Load gallery data from a JSON file.
 *
 * @param galleryJsonPath - Path to the gallery.json file. Defaults to './gallery.json'.
 * @param options - Optional settings for loading behavior.
 * @returns The parsed gallery data
 * @throws Error if file cannot be read, parsed, or fails validation
 *
 * @example
 * ```typescript
 * // Basic usage (no validation)
 * const gallery = loadGalleryData('./gallery.json');
 *
 * // With schema validation
 * const gallery = loadGalleryData('./gallery.json', { validate: true });
 * ```
 */
export function loadGalleryData(galleryJsonPath = './gallery.json', options?: LoadGalleryDataOptions): GalleryData {
  const galleryData = JSON.parse(fs.readFileSync(galleryJsonPath, 'utf8'));

  if (options?.validate) {
    const result = GalleryDataSchema.safeParse(galleryData);
    if (!result.success) {
      throw new Error(`Invalid gallery.json at ${galleryJsonPath}: ${result.error.message}`);
    }
    return result.data;
  }

  return galleryData as GalleryData;
}
