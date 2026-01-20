import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { marked } from 'marked';

import type {
  GalleryData,
  GalleryMetadata,
  GallerySection,
  HeaderImageVariants,
  MediaFile,
  SubGallery,
} from './gallery';

// ============================================================================
// Types
// ============================================================================

/** Resolved hero data with all paths computed and markdown parsed */
export interface ResolvedHero {
  title: string;
  description?: string;
  parsedDescription: string;
  headerImage?: string;
  headerPhotoPath: string;
  headerImageBlurHash?: string;
  headerImageVariants?: HeaderImageVariants;
  thumbnailBasePath: string;
  imgBasename: string;
  srcsets: {
    portraitAvif: string;
    portraitJpg: string;
    landscapeAvif: string;
    landscapeJpg: string;
  };
}

/** Resolved image with all paths computed */
export interface ResolvedImage {
  type: 'image' | 'video';
  filename: string;
  alt?: string;
  width: number;
  height: number;
  imagePath: string;
  thumbnailPath: string;
  thumbnailSrcSet?: string;
  thumbnailWidth?: number;
  thumbnailHeight?: number;
  blurHash?: string;
}

/** Resolved section with parsed markdown and resolved image paths */
export interface ResolvedSection {
  title?: string;
  description?: string;
  parsedDescription: string;
  images: ResolvedImage[];
}

/** Resolved sub-gallery with computed thumbnail path */
export interface ResolvedSubGallery {
  title: string;
  headerImage: string;
  path: string;
  thumbnailPath: string;
}

/** Fully resolved gallery data ready for rendering */
export interface ResolvedGalleryData {
  title: string;
  url?: string;
  metadata: GalleryMetadata;
  analyticsScript?: string;
  ctaBanner?: boolean;
  hero: ResolvedHero;
  sections: ResolvedSection[];
  subGalleries?: {
    title: string;
    galleries: ResolvedSubGallery[];
  };
  // Pass through base URLs for components that need them
  mediaBaseUrl?: string;
  thumbsBaseUrl?: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Portrait image sizes for responsive hero images */
export const PORTRAIT_SIZES = [360, 480, 720, 1080] as const;

/** Landscape image sizes for responsive hero images */
export const LANDSCAPE_SIZES = [640, 960, 1280, 1920, 2560, 3840] as const;

// ============================================================================
// Markdown Rendering
// ============================================================================

// Configure marked to only allow specific formatting options
const renderer = new marked.Renderer();

// Disable headings by rendering them as paragraphs
renderer.heading = ({ text }: { text: string }) => {
  return '<p>' + text + '</p>\n';
};

// Disable images
renderer.image = () => '';

// Disable HTML
renderer.html = () => '';

// Disable tables
renderer.table = () => '';
renderer.tablerow = () => '';
renderer.tablecell = () => '';

// Configure marked options
marked.use({
  renderer: renderer,
  breaks: true,
  gfm: true,
});

/**
 * Renders markdown with limited formatting options.
 * Supported: paragraphs, bold, italic, lists, code blocks, blockquotes, links
 * Disabled: headings (rendered as paragraphs), images, HTML, tables
 */
export async function renderMarkdown(markdown: string): Promise<string> {
  if (!markdown) return '';
  return await marked.parse(markdown);
}

// ============================================================================
// Path Utilities
// ============================================================================

/**
 * Normalizes resource paths to be relative to the gallery root directory.
 *
 * @param resourcePath - The resource path (file or directory), typically relative to the gallery.json file
 * @returns The normalized path relative to the gallery root directory
 */
export function getRelativePath(resourcePath: string): string {
  const galleryConfigPath = path.resolve(process.env.GALLERY_JSON_PATH || '');
  const galleryConfigDir = path.dirname(galleryConfigPath);

  const absoluteResourcePath = path.resolve(path.join(galleryConfigDir, resourcePath));
  const baseDir = path.dirname(galleryConfigDir);

  return path.relative(baseDir, absoluteResourcePath);
}

/**
 * Get the path to a thumbnail that is relative to the gallery root directory or the thumbnails base URL.
 *
 * @param resourcePath - The resource path (file or directory), typically relative to the gallery.json file
 * @param thumbsBaseUrl - The base URL for the thumbnails (gallery-level)
 * @param thumbnailBaseUrl - Optional thumbnail-specific base URL that overrides thumbsBaseUrl if provided
 * @returns The normalized path relative to the gallery root directory or the thumbnails base URL
 */
export function getThumbnailPath(
  resourcePath: string,
  thumbsBaseUrl?: string,
  thumbnailBaseUrl?: string,
): string {
  // If thumbnail-specific baseUrl is provided, use it and combine with the path
  if (thumbnailBaseUrl) {
    return `${thumbnailBaseUrl}/${resourcePath}`;
  }
  // Otherwise, use the gallery-level thumbsBaseUrl if provided
  return thumbsBaseUrl ? `${thumbsBaseUrl}/${resourcePath}` : `gallery/images/${path.basename(resourcePath)}`;
}

/**
 * Get the path to a photo that is always in the gallery root directory.
 *
 * @param filename - The filename to get the path for
 * @param mediaBaseUrl - The base URL for the media
 * @param url - Optional URL that, if provided, will be used directly regardless of base URL or path
 * @returns The normalized path relative to the gallery root directory, or the provided URL
 */
export function getPhotoPath(filename: string, mediaBaseUrl?: string, url?: string): string {
  // If url is provided, always use it regardless of base URL or path
  if (url) {
    return url;
  }

  return mediaBaseUrl ? `${mediaBaseUrl}/${filename}` : filename;
}

/**
 * Get the path to a subgallery thumbnail that is always in the subgallery directory.
 *
 * @param subgalleryHeaderImagePath - The path to the subgallery header image on the hard disk
 * @returns The normalized path relative to the subgallery directory
 */
export function getSubgalleryThumbnailPath(subgalleryHeaderImagePath: string): string {
  const photoBasename = path.basename(subgalleryHeaderImagePath);
  const subgalleryFolderName = path.basename(path.dirname(subgalleryHeaderImagePath));

  return path.join(subgalleryFolderName, 'gallery', 'thumbnails', photoBasename);
}

/**
 * Build a srcset string for responsive images.
 * Uses custom paths from variants when provided, otherwise generates default paths.
 *
 * @param variants - Optional record mapping sizes to custom URLs
 * @param sizes - Array of image widths to include
 * @param thumbnailBasePath - Base path for generated thumbnails
 * @param imgBasename - Image basename for generated paths
 * @param orientation - 'portrait' or 'landscape'
 * @param format - Image format ('avif' or 'jpg')
 * @param useDefaultPaths - Whether to use generated paths when no custom variant exists
 * @returns Comma-separated srcset string
 */
export function buildHeroSrcset(
  variants: Record<number, string | undefined> | undefined,
  sizes: readonly number[],
  thumbnailBasePath: string,
  imgBasename: string,
  orientation: 'portrait' | 'landscape',
  format: 'avif' | 'jpg',
  useDefaultPaths: boolean,
): string {
  return sizes
    .map((size) => {
      const customPath = variants?.[size];
      if (customPath) {
        return `${customPath} ${size}w`;
      }
      if (useDefaultPaths) {
        return `${thumbnailBasePath}/${imgBasename}_${orientation}_${size}.${format} ${size}w`;
      }
      return null;
    })
    .filter(Boolean)
    .join(', ');
}

// ============================================================================
// Gallery Loading
// ============================================================================

/**
 * Load gallery data from the GALLERY_JSON_PATH environment variable.
 *
 * @returns The parsed gallery data
 * @throws Error if GALLERY_JSON_PATH is not set or file cannot be read
 */
export function loadGalleryData(): GalleryData {
  const galleryJsonPath = process.env.GALLERY_JSON_PATH || './gallery.json';
  const galleryData = JSON.parse(fs.readFileSync(galleryJsonPath, 'utf8'));
  return galleryData as GalleryData;
}

// ============================================================================
// Data Resolution
// ============================================================================

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
 * Resolve a sub-gallery with computed thumbnail path.
 */
function resolveSubGallery(subGallery: SubGallery): ResolvedSubGallery {
  return {
    title: subGallery.title,
    headerImage: subGallery.headerImage,
    path: subGallery.path,
    thumbnailPath: getSubgalleryThumbnailPath(subGallery.headerImage),
  };
}

/**
 * Resolve hero data with all paths computed and srcsets built.
 */
async function resolveHero(gallery: GalleryData): Promise<ResolvedHero> {
  const { title, description, headerImage, headerImageBlurHash, headerImageVariants, mediaBaseUrl, thumbsBaseUrl } =
    gallery;

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
 * Transform raw gallery data into a fully resolved structure with all paths
 * computed and markdown parsed. This is the main API for themes.
 *
 * @param gallery - Raw gallery data from loadGalleryData()
 * @returns Fully resolved gallery data ready for rendering
 */
export async function resolveGalleryData(gallery: GalleryData): Promise<ResolvedGalleryData> {
  const { mediaBaseUrl, thumbsBaseUrl, subGalleries } = gallery;

  const hero = await resolveHero(gallery);
  const sections = await Promise.all(
    gallery.sections.map((section) => resolveSection(section, mediaBaseUrl, thumbsBaseUrl)),
  );

  const resolvedSubGalleries = subGalleries?.galleries?.length
    ? {
        title: subGalleries.title,
        galleries: subGalleries.galleries.map((sg) => resolveSubGallery(sg)),
      }
    : undefined;

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
  };
}

// ============================================================================
// Astro Integration
// ============================================================================

/** Astro integration type (simplified to avoid astro dependency in common) */
interface AstroIntegration {
  name: string;
  hooks: {
    'astro:build:done': (options: { dir: URL }) => void;
  };
}

/**
 * Astro integration to prevent empty content collection files from being generated.
 * Removes empty content-assets.mjs and content-modules.mjs files after build.
 */
export function preventEmptyContentFiles(): AstroIntegration {
  return {
    name: 'prevent-empty-content-files',
    hooks: {
      'astro:build:done': ({ dir }) => {
        const filesToRemove = ['content-assets.mjs', 'content-modules.mjs'];
        for (const fileName of filesToRemove) {
          const filePath = path.join(dir.pathname, fileName);
          if (fs.existsSync(filePath)) {
            try {
              const content = fs.readFileSync(filePath, 'utf8');
              if (content.trim() === 'export default new Map();' || content.trim() === '') {
                fs.unlinkSync(filePath);
              }
            } catch {
              // Silently ignore errors
            }
          }
        }
      },
    },
  };
}
