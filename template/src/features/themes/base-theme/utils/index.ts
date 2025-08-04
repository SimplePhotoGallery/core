import path from 'node:path';

/**
 * Normalizes image paths to be relative to the gallery root directory instead of the gallery.json file.
 *
 * @param imagePath - The image path, typically relative to the gallery.json file
 * @returns The normalized path relative to the gallery root directory
 */

export const getImagePath = (imagePath: string) => {
  const galleryConfigPath = path.resolve(process.env.GALLERY_JSON_PATH || '');
  const galleryConfigDir = path.dirname(galleryConfigPath);

  const absoluteImagePath = path.resolve(path.join(galleryConfigDir, imagePath));
  const baseDir = path.dirname(galleryConfigDir);

  return path.relative(baseDir, absoluteImagePath);
};
