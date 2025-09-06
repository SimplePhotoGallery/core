import path from 'node:path';

import { IMAGE_EXTENSIONS, VIDEO_EXTENSIONS } from '../const';

import type { MediaFileType } from '../types';

export function getMediaFileType(fileName: string): MediaFileType | null {
  const ext = path.extname(fileName).toLowerCase();
  if (IMAGE_EXTENSIONS.has(ext)) return 'image';
  if (VIDEO_EXTENSIONS.has(ext)) return 'video';
  return null;
}

export function capitalizeTitle(folderName: string): string {
  return folderName
    .replace('-', ' ')
    .replace('_', ' ')
    .split(' ')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
