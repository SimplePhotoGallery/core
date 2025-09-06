import path from 'node:path';

import { IMAGE_EXTENSIONS, VIDEO_EXTENSIONS } from '../const';

import type { MediaFileType } from '../types';

/**
 * Determines the media file type based on file extension
 * @param fileName - Name of the file to check
 * @returns Media file type ('image' or 'video') or null if not supported
 */
export function getMediaFileType(fileName: string): MediaFileType | null {
  const ext = path.extname(fileName).toLowerCase();
  if (IMAGE_EXTENSIONS.has(ext)) return 'image';
  if (VIDEO_EXTENSIONS.has(ext)) return 'video';
  return null;
}

/**
 * Converts a folder name into a properly capitalized title
 * @param folderName - The folder name to convert
 * @returns Formatted title with proper capitalization
 */
export function capitalizeTitle(folderName: string): string {
  return folderName
    .replace('-', ' ')
    .replace('_', ' ')
    .split(' ')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
