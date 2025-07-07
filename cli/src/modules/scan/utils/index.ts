import path from 'node:path';

import exifReader from 'exif-reader';
import ffprobe from 'node-ffprobe';
import sharp from 'sharp';

import { IMAGE_EXTENSIONS, VIDEO_EXTENSIONS } from '../const';

export async function getImageMetadata(filePath: string): Promise<{ width: number; height: number; description?: string }> {
  try {
    const metadata = await sharp(filePath).metadata();
    let description: string | undefined;

    // Extract description from EXIF data
    if (metadata.exif) {
      try {
        const exifData = exifReader(metadata.exif);
        if (exifData.Image?.ImageDescription) {
          description = exifData.Image.ImageDescription;
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
  } catch (error) {
    console.warn(`Warning: Could not get metadata for image ${filePath}:`, error);
    return { width: 0, height: 0 };
  }
}

export async function getVideoDimensions(filePath: string): Promise<{ width: number; height: number }> {
  try {
    const data = await ffprobe(filePath);
    const videoStream = data.streams.find((stream) => stream.codec_type === 'video');
    if (videoStream) {
      return {
        width: videoStream.width || 0,
        height: videoStream.height || 0,
      };
    }
    return { width: 0, height: 0 };
  } catch (error) {
    console.warn(`Warning: Could not get dimensions for video ${filePath}:`, error);
    return { width: 0, height: 0 };
  }
}

export function isMediaFile(fileName: string): 'image' | 'video' | null {
  const ext = path.extname(fileName).toLowerCase();
  if (IMAGE_EXTENSIONS.has(ext)) return 'image';
  if (VIDEO_EXTENSIONS.has(ext)) return 'video';
  return null;
}
