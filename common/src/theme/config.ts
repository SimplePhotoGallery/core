import { z } from 'zod';

/** Supported output formats for generated thumbnails */
export const THUMBNAIL_FORMATS = ['avif', 'webp', 'jpeg'] as const;

/** TypeScript type for a thumbnail output format */
export type ThumbnailFormat = (typeof THUMBNAIL_FORMATS)[number];

/** Zod schema for thumbnail configuration */
export const ThumbnailConfigSchema = z.object({
  size: z.number().min(50).max(4000).optional(),
  edge: z.enum(['auto', 'width', 'height']).optional(),
  format: z.enum(THUMBNAIL_FORMATS).optional(),
  quality: z.number().min(1).max(100).optional(),
  effort: z.number().min(0).max(9).optional(),
});

/** Zod schema for theme configuration file (themeConfig.json) */
export const ThemeConfigSchema = z.object({
  thumbnails: ThumbnailConfigSchema.optional(),
});

/** TypeScript type for thumbnail configuration */
export type ThumbnailConfig = z.infer<typeof ThumbnailConfigSchema>;

/** TypeScript type for theme configuration */
export type ThemeConfig = z.infer<typeof ThemeConfigSchema>;

/** Fully resolved thumbnail configuration with size, edge and format always present */
export interface ResolvedThumbnailConfig {
  size: number;
  edge: 'auto' | 'width' | 'height';
  format: ThumbnailFormat;
  quality?: number;
  effort?: number;
}

/** Default thumbnail configuration values */
export const DEFAULT_THUMBNAIL_CONFIG: ResolvedThumbnailConfig = {
  size: 300,
  edge: 'auto',
  format: 'avif',
};

/**
 * Returns the file extension (without a leading dot) used for thumbnails of the given format.
 * @param format - The thumbnail output format
 * @returns The file extension to use for generated thumbnails
 */
export function getThumbnailExtension(format: ThumbnailFormat): string {
  return format === 'jpeg' ? 'jpg' : format;
}

/**
 * Extracts thumbnail config from gallery data.
 * @param gallery - The gallery data object
 * @returns ThumbnailConfig with values from gallery data
 */
export function extractThumbnailConfigFromGallery(gallery: { thumbnails?: ThumbnailConfig }): ThumbnailConfig {
  return {
    size: gallery.thumbnails?.size,
    edge: gallery.thumbnails?.edge,
    format: gallery.thumbnails?.format,
    quality: gallery.thumbnails?.quality,
    effort: gallery.thumbnails?.effort,
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
 * @returns Merged thumbnail configuration with all required values resolved
 */
export function mergeThumbnailConfig(
  cliConfig?: ThumbnailConfig,
  galleryConfig?: ThumbnailConfig,
  themeConfig?: ThumbnailConfig,
): ResolvedThumbnailConfig {
  return {
    size: cliConfig?.size ?? galleryConfig?.size ?? themeConfig?.size ?? DEFAULT_THUMBNAIL_CONFIG.size,
    edge: cliConfig?.edge ?? galleryConfig?.edge ?? themeConfig?.edge ?? DEFAULT_THUMBNAIL_CONFIG.edge,
    format: cliConfig?.format ?? galleryConfig?.format ?? themeConfig?.format ?? DEFAULT_THUMBNAIL_CONFIG.format,
    quality: cliConfig?.quality ?? galleryConfig?.quality ?? themeConfig?.quality,
    effort: cliConfig?.effort ?? galleryConfig?.effort ?? themeConfig?.effort,
  };
}
