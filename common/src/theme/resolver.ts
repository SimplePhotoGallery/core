import path from 'node:path';

import { extractThumbnailConfigFromGallery, mergeThumbnailConfig, type ThumbnailConfig } from './config';
import { LANDSCAPE_SIZES, PORTRAIT_SIZES } from './constants';
import { renderMarkdown } from './markdown';
import { buildHeroSrcset, getPhotoPath, getRelativePath, getSubgalleryThumbnailPath, getThumbnailPath } from './paths';

import type { GalleryData, GallerySection, MediaFile, SubGallery } from '../gallery';
import type { ResolvedGalleryData, ResolvedHero, ResolvedImage, ResolvedSection, ResolvedSubGallery } from './types';

/**
 * Resolve a single image with all paths computed.
 */
function resolveImage(image: MediaFile, mediaBaseUrl?: string, thumbsBaseUrl?: string): ResolvedImage {
  const imagePath = getPhotoPath(image.filename, mediaBaseUrl, image.url);
  const thumbnailPath = image.thumbnail
    ? getThumbnailPath(image.thumbnail.path, thumbsBaseUrl, image.thumbnail.baseUrl)
    : imagePath;

  const thumbnailSrcSet = image.thumbnail
    ? getThumbnailPath(image.thumbnail.path, thumbsBaseUrl, image.thumbnail.baseUrl) +
      ' 1x, ' +
      getThumbnailPath(image.thumbnail.pathRetina, thumbsBaseUrl, image.thumbnail.baseUrl) +
      ' 2x'
    : undefined;

  return {
    type: image.type,
    filename: image.filename,
    alt: image.alt,
    width: image.width,
    height: image.height,
    imagePath,
    thumbnailPath,
    thumbnailSrcSet,
    thumbnailWidth: image.thumbnail?.width,
    thumbnailHeight: image.thumbnail?.height,
    blurHash: image.thumbnail?.blurHash,
  };
}

/**
 * Resolve a section with parsed markdown and resolved image paths.
 */
async function resolveSection(
  section: GallerySection,
  mediaBaseUrl?: string,
  thumbsBaseUrl?: string,
): Promise<ResolvedSection> {
  const parsedDescription = section.description ? await renderMarkdown(section.description) : '';

  return {
    title: section.title,
    description: section.description,
    parsedDescription,
    images: section.images.map((img) => resolveImage(img, mediaBaseUrl, thumbsBaseUrl)),
  };
}

/**
 * Resolve a sub-gallery with computed thumbnail path and optional resolved path.
 */
function resolveSubGallery(subGallery: SubGallery, galleryJsonPath?: string): ResolvedSubGallery {
  return {
    title: subGallery.title,
    headerImage: subGallery.headerImage,
    path: subGallery.path,
    thumbnailPath: getSubgalleryThumbnailPath(subGallery.headerImage),
    resolvedPath: galleryJsonPath ? getRelativePath(subGallery.path, galleryJsonPath) : undefined,
  };
}

/**
 * Resolve hero data with all paths computed and srcsets built.
 */
async function resolveHero(gallery: GalleryData): Promise<ResolvedHero> {
  const { title, description, headerImage, headerImageBlurHash, headerImageVariants, mediaBaseUrl, thumbsBaseUrl } = gallery;

  const parsedDescription = description ? await renderMarkdown(description) : '';
  const imgBasename = headerImage ? path.basename(headerImage, path.extname(headerImage)) : 'header';
  const thumbnailBasePath = thumbsBaseUrl || 'gallery/images';
  const headerPhotoPath = getPhotoPath(headerImage || '', mediaBaseUrl);

  // Determine which sources to show based on headerImageVariants
  // If headerImageVariants is not set, use all generated paths (default behavior)
  const useDefaultPaths = !headerImageVariants;

  const srcsets = {
    portraitAvif: buildHeroSrcset(
      headerImageVariants?.portrait?.avif,
      PORTRAIT_SIZES,
      thumbnailBasePath,
      imgBasename,
      'portrait',
      'avif',
      useDefaultPaths,
    ),
    portraitJpg: buildHeroSrcset(
      headerImageVariants?.portrait?.jpg,
      PORTRAIT_SIZES,
      thumbnailBasePath,
      imgBasename,
      'portrait',
      'jpg',
      useDefaultPaths,
    ),
    landscapeAvif: buildHeroSrcset(
      headerImageVariants?.landscape?.avif,
      LANDSCAPE_SIZES,
      thumbnailBasePath,
      imgBasename,
      'landscape',
      'avif',
      useDefaultPaths,
    ),
    landscapeJpg: buildHeroSrcset(
      headerImageVariants?.landscape?.jpg,
      LANDSCAPE_SIZES,
      thumbnailBasePath,
      imgBasename,
      'landscape',
      'jpg',
      useDefaultPaths,
    ),
  };

  return {
    title,
    description,
    parsedDescription,
    headerImage,
    headerPhotoPath,
    headerImageBlurHash,
    headerImageVariants,
    thumbnailBasePath,
    imgBasename,
    srcsets,
  };
}

/**
 * Options for resolving gallery data.
 */
export interface ResolveGalleryDataOptions {
  /**
   * Path to the gallery.json file. When provided, enables resolution of
   * relative paths for sub-galleries (resolvedPath field).
   */
  galleryJsonPath?: string;
  /**
   * Theme-specific thumbnail configuration from themeConfig.json.
   * Used as fallback when gallery.json doesn't specify thumbnail settings.
   */
  themeConfig?: ThumbnailConfig;
  /**
   * CLI-specified thumbnail configuration (highest priority).
   * Overrides both gallery.json and theme config settings.
   */
  cliConfig?: ThumbnailConfig;
}

/**
 * Transform raw gallery data into a fully resolved structure with all paths
 * computed and markdown parsed. This is the main API for themes.
 *
 * @param gallery - Raw gallery data from loadGalleryData()
 * @param options - Optional configuration for path resolution
 * @returns Fully resolved gallery data ready for rendering
 */
export async function resolveGalleryData(
  gallery: GalleryData,
  options?: ResolveGalleryDataOptions,
): Promise<ResolvedGalleryData> {
  const { mediaBaseUrl, thumbsBaseUrl, subGalleries } = gallery;
  const { galleryJsonPath, themeConfig, cliConfig } = options ?? {};

  const hero = await resolveHero(gallery);
  const sections = await Promise.all(
    gallery.sections.map((section) => resolveSection(section, mediaBaseUrl, thumbsBaseUrl)),
  );

  const resolvedSubGalleries = subGalleries?.galleries?.length
    ? {
        title: subGalleries.title,
        galleries: subGalleries.galleries.map((sg) => resolveSubGallery(sg, galleryJsonPath)),
      }
    : undefined;

  // Merge thumbnail config: CLI > gallery.json > themeConfig > defaults
  const galleryThumbnailConfig = extractThumbnailConfigFromGallery(gallery);
  const thumbnails = mergeThumbnailConfig(cliConfig, galleryThumbnailConfig, themeConfig);

  return {
    title: gallery.title,
    url: gallery.url,
    metadata: gallery.metadata,
    analyticsScript: gallery.analyticsScript,
    ctaBanner: gallery.ctaBanner,
    hero,
    sections,
    subGalleries: resolvedSubGalleries,
    mediaBaseUrl,
    thumbsBaseUrl,
    thumbnails,
  };
}
