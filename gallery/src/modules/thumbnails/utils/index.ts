import { promises as fs } from 'node:fs';

/**
 * Gets the last modification time of a file
 * @param filePath - Path to the file
 * @returns Promise resolving to the file's modification date
 */
export async function getFileMtime(filePath: string): Promise<Date> {
  const stats = await fs.stat(filePath);
  return stats.mtime;
}
