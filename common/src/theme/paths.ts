import path from 'node:path';

/**
 * Converts a filesystem path to a URL path by replacing backslashes with forward slashes.
 * Paths produced by the path module on Windows use backslashes, which are not valid URL separators.
 *
 * @param fsPath - The filesystem path to convert
 * @returns The path with forward slashes only
 */
export function toUrlPath(fsPath: string): string {
  return fsPath.replaceAll('\\', '/');
}

/**
 * Joins a base URL with additional path segments using forward slashes.
 * Trailing slashes on the base URL and backslashes in segments are normalized, and empty segments are skipped.
 *
 * @param baseUrl - The base URL to join the segments to
 * @param segments - Path segments to append to the base URL
 * @returns The joined URL
 */
export function joinUrl(baseUrl: string, ...segments: string[]): string {
  const trimmedBase = baseUrl.replace(/\/+$/, '');
  const parts = segments.map((segment) => toUrlPath(segment)).filter((segment) => segment.length > 0);

  return [trimmedBase, ...parts].join('/');
}

/**
 * Normalizes resource paths to be relative to the gallery root directory.
 *
 * @param resourcePath - The resource path (file or directory), typically relative to the gallery.json file
 * @param galleryJsonPath - Path to the gallery.json file used to resolve relative paths
 * @returns The normalized path relative to the gallery root directory, using forward slashes
 */
export function getRelativePath(resourcePath: string, galleryJsonPath: string): string {
  const galleryConfigPath = path.resolve(galleryJsonPath);
  const galleryConfigDir = path.dirname(galleryConfigPath);

  const absoluteResourcePath = path.resolve(path.join(galleryConfigDir, resourcePath));
  const baseDir = path.dirname(galleryConfigDir);

  return toUrlPath(path.relative(baseDir, absoluteResourcePath));
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
 * @param headerImageFilename - The filename of the subgallery header image
 * @param resolvedSubgalleryPath - The resolved subgallery path relative to the gallery root
 * @returns The normalized URL path relative to the gallery root directory
 */
export function getSubgalleryThumbnailPath(headerImageFilename: string, resolvedSubgalleryPath?: string): string {
  const basename = path.basename(headerImageFilename, path.extname(headerImageFilename));
  const thumbnailFilename = `${basename}.avif`;
  const subgalleryFolder = resolvedSubgalleryPath || path.basename(path.dirname(headerImageFilename));

  return path.posix.join(toUrlPath(subgalleryFolder), 'gallery', 'images', thumbnailFilename);
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
