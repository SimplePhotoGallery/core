import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { ThemeConfigSchema, type ThumbnailConfig } from './config';

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
 * Load theme configuration from themeConfig.json file.
 *
 * Searches for themeConfig.json in the following locations (in priority order):
 * 1. Current working directory (process.cwd()) - checked first
 * 2. Provided themePath parameter - checked second
 *
 * The first valid configuration found is returned. This means a themeConfig.json
 * in the project root will take precedence over the theme's built-in configuration,
 * allowing users to override theme defaults without modifying the theme itself.
 *
 * **Note for theme authors:** Your theme's themeConfig.json provides sensible defaults,
 * but users can override these by placing their own themeConfig.json in their project root.
 *
 * @param themePath - Optional path to the theme directory
 * @returns The thumbnail configuration from the theme, or undefined if not found
 *
 * @example
 * ```typescript
 * // Load from theme directory
 * const themeConfig = loadThemeConfig('/path/to/theme');
 *
 * // Load from current directory
 * const themeConfig = loadThemeConfig();
 * ```
 */
export function loadThemeConfig(themePath?: string): ThumbnailConfig | undefined {
  const themeConfigPaths: string[] = [path.resolve(process.cwd(), 'themeConfig.json')];

  if (themePath) {
    themeConfigPaths.push(path.resolve(themePath, 'themeConfig.json'));
  }

  for (const configPath of themeConfigPaths) {
    if (fs.existsSync(configPath)) {
      try {
        const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const parsed = ThemeConfigSchema.safeParse(configData);
        if (parsed.success) {
          return parsed.data.thumbnails;
        }
        // Log validation errors for debugging
        if (process.env.DEBUG || process.env.VERBOSE) {
          console.warn(`Failed to validate themeConfig at ${configPath}:`, parsed.error.message);
        }
      } catch (error) {
        // Log parse errors for debugging
        if (process.env.DEBUG || process.env.VERBOSE) {
          console.warn(`Failed to parse themeConfig at ${configPath}:`, error);
        }
      }
    }
  }

  return undefined;
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
