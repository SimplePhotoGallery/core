import path from 'node:path';

/**
 * Normalizes resource paths to be relative to the gallery root directory instead of the gallery.json file.
 *
 * @param resourcePath - The resource path (file or directory), typically relative to the gallery.json file
 * @returns The normalized path relative to the gallery root directory
 */

export const getGalleryPath = (resourcePath: string) => {
  const galleryConfigPath = path.resolve(process.env.GALLERY_JSON_PATH || '');
  const galleryConfigDir = path.dirname(galleryConfigPath);

  const absoluteResourcePath = path.resolve(path.join(galleryConfigDir, resourcePath));
  const baseDir = path.dirname(galleryConfigDir);

  return path.relative(baseDir, absoluteResourcePath);
};
