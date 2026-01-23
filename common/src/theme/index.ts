// Types
export type { ResolvedGalleryData, ResolvedHero, ResolvedImage, ResolvedSection, ResolvedSubGallery } from './types';

// Theme config
export type { ThemeConfig, ThumbnailConfig } from './config';
export { DEFAULT_THUMBNAIL_CONFIG, mergeThumbnailConfig, ThemeConfigSchema, ThumbnailConfigSchema } from './config';

// Constants
export { LANDSCAPE_SIZES, PORTRAIT_SIZES } from './constants';

// Markdown
export { renderMarkdown } from './markdown';

// Path utilities
export { buildHeroSrcset, getPhotoPath, getRelativePath, getSubgalleryThumbnailPath, getThumbnailPath } from './paths';

// Gallery loading
export type { LoadGalleryDataOptions } from './loader';
export { loadGalleryData, loadThemeConfig } from './loader';

// Data resolution
export type { ResolveGalleryDataOptions } from './resolver';
export { resolveGalleryData } from './resolver';

// Astro integration
export { preventEmptyContentFiles } from './astro';
