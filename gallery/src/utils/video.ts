import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';

import ffprobe from 'node-ffprobe';
import sharp from 'sharp';

import { resizeImage, type ThumbnailSizeDimension } from './image';

import type { Dimensions } from '../types';
import type { Buffer } from 'node:buffer';

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
 * @param size - Target size for thumbnail
 * @param sizeDimension - How to apply size: 'auto' (longer edge), 'width', or 'height'
 * @param verbose - Whether to enable verbose ffmpeg output
 * @returns Promise resolving to thumbnail dimensions
 */
export async function createVideoThumbnails(
  inputPath: string,
  videoDimensions: Dimensions,
  outputPath: string,
  outputPathRetina: string,
  size: number,
  sizeDimension: ThumbnailSizeDimension = 'auto',
  verbose: boolean = false,
): Promise<Dimensions> {
  // Calculate dimensions maintaining aspect ratio based on sizeDimension
  const aspectRatio = videoDimensions.width / videoDimensions.height;

  let width: number;
  let height: number;

  if (sizeDimension === 'width') {
    // Apply size to width, calculate height from aspect ratio
    width = size;
    height = Math.round(size / aspectRatio);
  } else if (sizeDimension === 'height') {
    // Apply size to height, calculate width from aspect ratio
    width = Math.round(size * aspectRatio);
    height = size;
  } else {
    // 'auto': Apply size to longer edge
    if (videoDimensions.width > videoDimensions.height) {
      width = size;
      height = Math.round(size / aspectRatio);
    } else {
      width = Math.round(size * aspectRatio);
      height = size;
    }
  }

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
          await resizeImage(frameImage, outputPath, width, height);
          await resizeImage(frameImage, outputPathRetina, width * 2, height * 2);

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
