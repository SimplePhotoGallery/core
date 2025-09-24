import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';

import ExifReader from 'exifreader';
import ffprobe from 'node-ffprobe';
import sharp from 'sharp';

import type { Dimensions } from '../types';
import type { Buffer } from 'node:buffer';
import type { Metadata, Sharp } from 'sharp';

/**
 * Gets the last modification time of a file
 * @param filePath - Path to the file
 * @returns Promise resolving to the file's modification date
 */
export async function getFileMtime(filePath: string): Promise<Date> {
  const stats = await fs.stat(filePath);
  return stats.mtime;
}

/**
 * Utility function to resize and save thumbnail using Sharp
 * @param image - Sharp image instance
 * @param outputPath - Path where thumbnail should be saved
 * @param width - Target width for thumbnail
 * @param height - Target height for thumbnail
 */
async function resizeAndSaveThumbnail(image: Sharp, outputPath: string, width: number, height: number): Promise<void> {
  await image.resize(width, height, { withoutEnlargement: true }).jpeg({ quality: 90 }).toFile(outputPath);
}

/**
 * Extracts description from image EXIF data
 * @param metadata - Sharp metadata object containing EXIF data
 * @returns Promise resolving to image description or undefined if not found
 */
export async function getImageDescription(imagePath: string): Promise<string | undefined> {
  try {
    const tags = await ExifReader.load(imagePath);

    // Description
    if (tags.description?.description) return tags.description.description;

    // ImageDescription
    if (tags.ImageDescription?.description) return tags.ImageDescription.description;

    // UserComment
    if (
      tags.UserComment &&
      typeof tags.UserComment === 'object' &&
      tags.UserComment !== null &&
      'description' in tags.UserComment
    ) {
      return (tags.UserComment as { description: string }).description;
    }

    // ExtDescrAccessibility
    if (tags.ExtDescrAccessibility?.description) return tags.ExtDescrAccessibility.description;

    // Caption/Abstract
    if (tags['Caption/Abstract']?.description) return tags['Caption/Abstract'].description;

    // XP Title
    if (tags.XPTitle?.description) return tags.XPTitle.description;

    // XP Comment
    if (tags.XPComment?.description) return tags.XPComment.description;
  } catch {
    return undefined;
  }
}

/**
 * Creates regular and retina thumbnails for an image while maintaining aspect ratio
 * @param image - Sharp image instance
 * @param metadata - Image metadata containing dimensions
 * @param outputPath - Path where thumbnail should be saved
 * @param outputPathRetina - Path where retina thumbnail should be saved
 * @param height - Target height for thumbnail
 * @returns Promise resolving to thumbnail dimensions
 */
export async function createImageThumbnails(
  image: Sharp,
  metadata: Metadata,
  outputPath: string,
  outputPathRetina: string,
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

  // Resize the image and create the thumbnails
  await resizeAndSaveThumbnail(image, outputPath, width, height);
  await resizeAndSaveThumbnail(image, outputPathRetina, width * 2, height * 2);

  // Return the dimensions of the thumbnail
  return { width, height };
}

/**
 * Gets video dimensions using ffprobe
 * @param filePath - Path to the video file
 * @returns Promise resolving to video dimensions
 * @throws Error if no video stream found or invalid dimensions
 */
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

/**
 * Creates regular and retina thumbnails for a video by extracting the first frame
 * @param inputPath - Path to the video file
 * @param videoDimensions - Original video dimensions
 * @param outputPath - Path where thumbnail should be saved
 * @param outputPathRetina - Path where retina thumbnail should be saved
 * @param height - Target height for thumbnail
 * @param verbose - Whether to enable verbose ffmpeg output
 * @returns Promise resolving to thumbnail dimensions
 */
export async function createVideoThumbnails(
  inputPath: string,
  videoDimensions: Dimensions,
  outputPath: string,
  outputPathRetina: string,
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
          await resizeAndSaveThumbnail(frameImage, outputPathRetina, width * 2, height * 2);

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
