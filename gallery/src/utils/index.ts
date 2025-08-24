import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import readline from 'node:readline';

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

/**
 * Asks the user for confirmation via a yes/no question in the terminal.
 *
 * @param question - The question to ask the user
 * @returns Promise that resolves to true if user answers 'y' or 'yes', false otherwise
 */

export const askUserForConfirmation = async (question: string) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = await new Promise<string>((resolve) => {
    rl.question(question, resolve);
  });

  rl.close();

  return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
};
