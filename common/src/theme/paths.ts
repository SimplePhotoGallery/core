import path from 'node:path';
import process from 'node:process';

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
export function getThumbnailPath(resourcePath: string, thumbsBaseUrl?: string, thumbnailBaseUrl?: string): string {
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
