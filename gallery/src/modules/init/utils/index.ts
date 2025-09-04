import { promises as fs } from 'node:fs';
import path from 'node:path';

import exifReader from 'exif-reader';
import ffprobe from 'node-ffprobe';
import sharp from 'sharp';

import { IMAGE_EXTENSIONS, VIDEO_EXTENSIONS } from '../const';

export async function getImageMetadata(filePath: string): Promise<{ width: number; height: number; description?: string }> {
  const metadata = await sharp(filePath).metadata();
  let description: string | undefined;

  // Extract description from EXIF data
  if (metadata.exif) {
    try {
      const exifData = exifReader(metadata.exif);
      if (exifData.Image?.ImageDescription) {
        description = exifData.Image.ImageDescription.toString();
      } else if (exifData.Image?.Description) {
        description = exifData.Image.Description.toString();
      }
    } catch {
      // EXIF parsing failed, but that's OK
    }
  }

  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    description,
  };
}

export async function getVideoDimensions(filePath: string): Promise<{ width: number; height: number }> {
  const data = await ffprobe(filePath);
  const videoStream = data.streams.find((stream) => stream.codec_type === 'video');
  if (videoStream) {
    return {
      width: videoStream.width || 0,
      height: videoStream.height || 0,
    };
  }
  return { width: 0, height: 0 };
}

export function isMediaFile(fileName: string): 'image' | 'video' | null {
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

export async function hasMediaFiles(dirPath: string): Promise<boolean> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    // Check for media files in current directory
    for (const entry of entries) {
      if (entry.isFile() && isMediaFile(entry.name)) {
        return true;
      }
    }

    // Check subdirectories recursively
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name !== 'gallery') {
        const subDirPath = path.join(dirPath, entry.name);
        if (await hasMediaFiles(subDirPath)) {
          return true;
        }
      }
    }
  } catch (error) {
    console.error(`Error checking for media files in ${dirPath}:`, error);
  }

  return false;
}
