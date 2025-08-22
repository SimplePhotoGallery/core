import fs from 'node:fs';
import path from 'node:path';

/**
 * Finds all gallery directories that contain a gallery/gallery.json file.
 *
 * @param basePath - The base directory to search from
 * @param recursive - Whether to search subdirectories recursively
 * @returns Array of paths to directories containing gallery/gallery.json files
 */
export const findGalleries = (basePath: string, recursive: boolean): string[] => {
  const galleryDirs: string[] = [];

  // Check basePath itself
  const galleryJsonPath = path.join(basePath, 'gallery', 'gallery.json');
  if (fs.existsSync(galleryJsonPath)) {
    galleryDirs.push(basePath);
  }

  // If recursive, search all subdirectories
  if (recursive) {
    try {
      const entries = fs.readdirSync(basePath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name !== 'gallery') {
          const subPath = path.join(basePath, entry.name);
          const subResults = findGalleries(subPath, recursive);
          galleryDirs.push(...subResults);
        }
      }
    } catch {
      // Silently ignore errors when reading directories
    }
  }

  return galleryDirs;
};
