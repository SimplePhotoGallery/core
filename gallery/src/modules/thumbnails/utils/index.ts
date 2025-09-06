import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';

import exifReader from 'exif-reader';
import ffprobe from 'node-ffprobe';
import sharp from 'sharp';

import type { Dimensions } from '../types';
import type { Buffer } from 'node:buffer';
import type { Metadata, Sharp } from 'sharp';

export async function getFileMtime(filePath: string): Promise<Date> {
  const stats = await fs.stat(filePath);
  return stats.mtime;
}

// Utility function to resize and save thumbnail
async function resizeAndSaveThumbnail(image: Sharp, outputPath: string, width: number, height: number): Promise<void> {
  await image.resize(width, height, { withoutEnlargement: true }).jpeg({ quality: 90 }).toFile(outputPath);
}

export async function getImageDescription(metadata: Metadata): Promise<string | undefined> {
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

  return description;
}

export async function createImageThumbnail(
  image: Sharp,
  metadata: Metadata,
  outputPath: string,
  height: number,
): Promise<Dimensions> {
  // Create thumbnail using sharp
  const originalWidth = metadata.width || 0;
  const originalHeight = metadata.height || 0;

  if (originalWidth === 0 || originalHeight === 0) {
    throw new Error('Invalid image dimensions');
  }

  // Calculate width maintaining aspect ratio
  const aspectRatio = originalWidth / originalHeight;
  const width = Math.round(height * aspectRatio);

  // Resize the image
  await resizeAndSaveThumbnail(image, outputPath, width, height);

  // Return the dimensions of the thumbnail
  return { width, height };
}

export async function getVideoDimensions(filePath: string): Promise<Dimensions> {
  const data = await ffprobe(filePath);
  const videoStream = data.streams.find((stream) => stream.codec_type === 'video');

  if (!videoStream) {
    throw new Error('No video stream found');
  }

  const dimensions = {
    width: videoStream.width || 0,
    height: videoStream.height || 0,
  };

  if (dimensions.width === 0 || dimensions.height === 0) {
    throw new Error('Invalid video dimensions');
  }

  return dimensions;
}

export async function createVideoThumbnail(
  inputPath: string,
  videoDimensions: Dimensions,
  outputPath: string,
  height: number,
  verbose: boolean = false,
): Promise<Dimensions> {
  // Calculate width maintaining aspect ratio
  const aspectRatio = videoDimensions.width / videoDimensions.height;
  const width = Math.round(height * aspectRatio);

  // Use ffmpeg to extract first frame as a temporary file, then process with sharp
  const tempFramePath = `${outputPath}.temp.png`;

  return new Promise((resolve, reject) => {
    // Extract first frame using ffmpeg
    const ffmpeg = spawn('ffmpeg', [
      '-i',
      inputPath,
      '-vframes',
      '1',
      '-y',
      '-loglevel',
      verbose ? 'error' : 'quiet',
      tempFramePath,
    ]);

    ffmpeg.stderr.on('data', (data: Buffer) => {
      // FFmpeg writes normal output to stderr, so we don't treat this as an error
      console.log(`ffmpeg: ${data.toString()}`);
    });

    ffmpeg.on('close', async (code: number) => {
      if (code === 0) {
        try {
          // Process the extracted frame with sharp
          const frameImage = sharp(tempFramePath);
          await resizeAndSaveThumbnail(frameImage, outputPath, width, height);

          // Clean up temporary file
          try {
            await fs.unlink(tempFramePath);
          } catch {
            // Ignore cleanup errors
          }

          resolve({ width, height });
        } catch (sharpError) {
          reject(new Error(`Failed to process extracted frame: ${sharpError}`));
        }
      } else {
        reject(new Error(`ffmpeg exited with code ${code}`));
      }
    });

    ffmpeg.on('error', (error: Error) => {
      reject(new Error(`Failed to start ffmpeg: ${error.message}`));
    });
  });
}
