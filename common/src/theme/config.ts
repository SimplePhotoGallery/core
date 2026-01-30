import { z } from 'zod';

/** Zod schema for thumbnail configuration */
export const ThumbnailConfigSchema = z.object({
  size: z.number().min(50).max(4000).optional(),
  edge: z.enum(['auto', 'width', 'height']).optional(),
});

/** Zod schema for theme configuration file (themeConfig.json) */
export const ThemeConfigSchema = z.object({
  thumbnails: ThumbnailConfigSchema.optional(),
});

/** TypeScript type for thumbnail configuration */
export type ThumbnailConfig = z.infer<typeof ThumbnailConfigSchema>;

/** TypeScript type for theme configuration */
export type ThemeConfig = z.infer<typeof ThemeConfigSchema>;

/** Default thumbnail configuration values */
export const DEFAULT_THUMBNAIL_CONFIG: Required<ThumbnailConfig> = {
  size: 300,
  edge: 'auto',
};

/**
 * Extracts thumbnail config from gallery data.
 * @param gallery - The gallery data object
 * @returns ThumbnailConfig with values from gallery data
 */
export function extractThumbnailConfigFromGallery(gallery: { thumbnails?: ThumbnailConfig }): ThumbnailConfig {
  return {
    size: gallery.thumbnails?.size,
    edge: gallery.thumbnails?.edge,
  };
}

/**
 * Merges thumbnail configurations with hierarchy:
 * 1. CLI flags (highest precedence)
 * 2. gallery.json settings
 * 3. themeConfig.json (theme defaults)
 * 4. Built-in defaults (lowest)
 *
 * @param cliConfig - Config from CLI flags (optional)
 * @param galleryConfig - Config from gallery.json (optional)
 * @param themeConfig - Config from themeConfig.json (optional)
 * @returns Merged thumbnail configuration with all values resolved
 */
export function mergeThumbnailConfig(
  cliConfig?: ThumbnailConfig,
  galleryConfig?: ThumbnailConfig,
  themeConfig?: ThumbnailConfig,
): Required<ThumbnailConfig> {
  return {
    size: cliConfig?.size ?? galleryConfig?.size ?? themeConfig?.size ?? DEFAULT_THUMBNAIL_CONFIG.size,
    edge: cliConfig?.edge ?? galleryConfig?.edge ?? themeConfig?.edge ?? DEFAULT_THUMBNAIL_CONFIG.edge,
  };
}
