import path from 'node:path';

import { IMAGE_EXTENSIONS, VIDEO_EXTENSIONS } from '../const';

import type { MediaFileType } from '../types';

/**
 * Determines the media file type based on the file extension.
 * @param fileName - The name of the file to check
 * @returns The media file type ('image' or 'video') or null if not a supported media file
 */
export function getMediaFileType(fileName: string): MediaFileType | null {
  const ext = path.extname(fileName).toLowerCase();
  if (IMAGE_EXTENSIONS.has(ext)) return 'image';
  if (VIDEO_EXTENSIONS.has(ext)) return 'video';
  return null;
}

/**
 * Converts a folder name to a properly capitalized title.
 * Replaces dashes and underscores with spaces and capitalizes each word.
 * @param folderName - The folder name to convert
 * @returns A formatted title string
 */
export function capitalizeTitle(folderName: string): string {
  return folderName
    .replace('-', ' ')
    .replace('_', ' ')
    .split(' ')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
