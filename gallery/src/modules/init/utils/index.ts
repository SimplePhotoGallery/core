import path from 'node:path';

import { IMAGE_EXTENSIONS, VIDEO_EXTENSIONS } from '../const';

import type { MediaFileType } from '../types';

/**
 * Determines the type of a media file based on its extension.
 *
 * @param fileName - Name of the file to inspect
 * @returns The media file type or null if unsupported
 */
export function getMediaFileType(fileName: string): MediaFileType | null {
  const ext = path.extname(fileName).toLowerCase();
  if (IMAGE_EXTENSIONS.has(ext)) return 'image';
  if (VIDEO_EXTENSIONS.has(ext)) return 'video';
  return null;
}

/**
 * Converts a folder name into a human-friendly title.
 *
 * @param folderName - Folder name to capitalize
 * @returns Capitalized title
 */
export function capitalizeTitle(folderName: string): string {
  return folderName
    .replace('-', ' ')
    .replace('_', ' ')
    .split(' ')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
