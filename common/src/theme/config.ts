import { z } from 'zod';

/** Zod schema for thumbnail configuration */
export const ThumbnailConfigSchema = z.object({
  size: z.number().optional(),
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
 * Merges thumbnail configurations with hierarchy:
 * 1. CLI flags / gallery.json (highest precedence)
 * 2. themeConfig.json (theme defaults)
 * 3. Built-in defaults (lowest)
 *
 * @param galleryConfig - Config from gallery.json or CLI flags
 * @param themeConfig - Config from themeConfig.json (optional)
 * @returns Merged thumbnail configuration with all values resolved
 */
export function mergeThumbnailConfig(
  galleryConfig?: ThumbnailConfig,
  themeConfig?: ThumbnailConfig,
): Required<ThumbnailConfig> {
  return {
    size: galleryConfig?.size ?? themeConfig?.size ?? DEFAULT_THUMBNAIL_CONFIG.size,
    edge: galleryConfig?.edge ?? themeConfig?.edge ?? DEFAULT_THUMBNAIL_CONFIG.edge,
  };
}
