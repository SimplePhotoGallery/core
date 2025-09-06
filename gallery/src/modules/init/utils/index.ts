import path from 'node:path';

import { IMAGE_EXTENSIONS, VIDEO_EXTENSIONS } from '../const';

import type { MediaFileType } from '../types';

/**
 * Determine the media file type based on its file extension.
 *
 * @param fileName - Name of the file to inspect.
 * @returns `image`, `video` or `null` if the extension is unsupported.
 */
export function getMediaFileType(fileName: string): MediaFileType | null {
  const ext = path.extname(fileName).toLowerCase();
  if (IMAGE_EXTENSIONS.has(ext)) return 'image';
  if (VIDEO_EXTENSIONS.has(ext)) return 'video';
  return null;
}

/**
 * Convert a folder name into a human‑readable title.
 *
 * @param folderName - Folder name to convert.
 * @returns Capitalized title suitable for display.
 */
export function capitalizeTitle(folderName: string): string {
  return folderName
    .replace('-', ' ')
    .replace('_', ' ')
    .split(' ')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
