import path from 'node:path';

/**
 * Normalizes resource paths to be relative to the gallery root directory.
 *
 * @param resourcePath - The resource path (file or directory), typically relative to the gallery.json file
 * @returns The normalized path relative to the gallery root directory
 */
export const getRelativePath = (resourcePath: string) => {
  const galleryConfigPath = path.resolve(process.env.GALLERY_JSON_PATH || '');
  const galleryConfigDir = path.dirname(galleryConfigPath);

  const absoluteResourcePath = path.resolve(path.join(galleryConfigDir, resourcePath));
  const baseDir = path.dirname(galleryConfigDir);

  return path.relative(baseDir, absoluteResourcePath);
};

/**
 * Get the path to a thumbnail that is relative to the gallery root directory or the thumbnails base URL.
 *
 * @param resourcePath - The resource path (file or directory), typically relative to the gallery.json file
 * @param thumbsBaseUrl - The base URL for the thumbnails (gallery-level)
 * @param thumbnailBaseUrl - Optional thumbnail-specific base URL that overrides thumbsBaseUrl if provided
 * @returns The normalized path relative to the gallery root directory or the thumbnails base URL
 */
export const getThumbnailPath = (resourcePath: string, thumbsBaseUrl?: string, thumbnailBaseUrl?: string) => {
  // If thumbnail-specific baseUrl is provided, use it and combine with the path
  if (thumbnailBaseUrl) {
    return `${thumbnailBaseUrl}/${resourcePath}`;
  }
  // Otherwise, use the gallery-level thumbsBaseUrl if provided
  return thumbsBaseUrl ? `${thumbsBaseUrl}/${resourcePath}` : `gallery/images/${path.basename(resourcePath)}`;
};

/**
 * Get the path to a photo that is always in the gallery root directory.
 *
 * @param filename - The filename to get the path for
 * @param mediaBaseUrl - The base URL for the media
 * @param url - Optional URL that, if provided, will be used directly regardless of base URL or path
 * @returns The normalized path relative to the gallery root directory, or the provided URL
 */
export const getPhotoPath = (filename: string, mediaBaseUrl?: string, url?: string) => {
  // If url is provided, always use it regardless of base URL or path
  if (url) {
    return url;
  }

  return mediaBaseUrl ? `${mediaBaseUrl}/${filename}` : filename;
};

/**
 * Get the path to a subgallery thumbnail that is always in the subgallery directory.
 *
 * @param subgalleryHeaderImagePath - The path to the subgallery header image on the hard disk
 * @returns The normalized path relative to the subgallery directory
 */
export const getSubgalleryThumbnailPath = (subgalleryHeaderImagePath: string) => {
  const photoBasename = path.basename(subgalleryHeaderImagePath);
  const subgalleryFolderName = path.basename(path.dirname(subgalleryHeaderImagePath));

  return path.join(subgalleryFolderName, 'gallery', 'thumbnails', photoBasename);
};
