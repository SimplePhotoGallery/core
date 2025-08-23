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
 * Get the path to a photo that is always in the gallery root directory.
 *
 * @param resourcePath - The path to the photo on the hard disk
 * @returns The normalized path relative to the gallery root directory
 */
export const getPhotoPath = (photoPath: string) => {
  const resourceBasename = path.basename(photoPath);

  return path.join('.', resourceBasename);
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
