import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import ffprobe from 'node-ffprobe';
import sharp from 'sharp';

import type { Buffer } from 'node:buffer';

// Check if ffmpeg is available
async function checkFfmpegAvailability(): Promise<boolean> {
  return new Promise((resolve) => {
    const ffmpeg = spawn('ffmpeg', ['-version']);

    ffmpeg.on('close', (code) => {
      resolve(code === 0);
    });

    ffmpeg.on('error', () => {
      resolve(false);
    });
  });
}

// Utility function to resize and save thumbnail
async function resizeAndSaveThumbnail(image: sharp.Sharp, outputPath: string, width: number, height: number): Promise<void> {
  await image.resize(width, height, { withoutEnlargement: true }).jpeg({ quality: 90 }).toFile(outputPath);
}

export async function createImageThumbnail(
  inputPath: string,
  outputPath: string,
  height: number,
): Promise<{ width: number; height: number }> {
  try {
    // Check if input file exists
    await fs.access(inputPath);

    // Create thumbnail using sharp
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    const originalWidth = metadata.width || 0;
    const originalHeight = metadata.height || 0;

    if (originalWidth === 0 || originalHeight === 0) {
      throw new Error('Invalid image dimensions');
    }

    // Calculate width maintaining aspect ratio
    const aspectRatio = originalWidth / originalHeight;
    const width = Math.round(height * aspectRatio);

    await resizeAndSaveThumbnail(image, outputPath, width, height);

    return { width, height };
  } catch (error) {
    throw new Error(`Failed to create image thumbnail for ${inputPath}: ${error}`);
  }
}

export async function createVideoThumbnail(
  inputPath: string,
  outputPath: string,
  height: number,
): Promise<{ width: number; height: number }> {
  try {
    // Check if input file exists
    await fs.access(inputPath);

    // Check if ffmpeg is available
    const ffmpegAvailable = await checkFfmpegAvailability();
    if (!ffmpegAvailable) {
      console.warn(`Warning: ffmpeg is not available. Skipping thumbnail creation for video: ${path.basename(inputPath)}`);
      throw new Error('FFMPEG_NOT_AVAILABLE');
    }

    // Get video metadata using ffprobe
    const videoData = await ffprobe(inputPath);
    const videoStream = videoData.streams.find((stream) => stream.codec_type === 'video');

    if (!videoStream) {
      throw new Error('No video stream found');
    }

    const originalWidth = videoStream.width || 0;
    const originalHeight = videoStream.height || 0;

    if (originalWidth === 0 || originalHeight === 0) {
      throw new Error('Invalid video dimensions');
    }

    // Calculate width maintaining aspect ratio
    const aspectRatio = originalWidth / originalHeight;
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
        '-y', // Overwrite output file
        tempFramePath,
      ]);

      ffmpeg.stderr.on('data', (data: Buffer) => {
        // FFmpeg writes normal output to stderr, so we don't treat this as an error
        console.debug(`ffmpeg: ${data.toString()}`);
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
  } catch (error) {
    if (error instanceof Error && error.message === 'FFMPEG_NOT_AVAILABLE') {
      // Re-throw the specific error for graceful handling upstream
      throw error;
    }
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message: string }).message === 'string' &&
      ((error as { message: string }).message.includes('ffmpeg') ||
        (error as { message: string }).message.includes('ffprobe'))
    ) {
      throw new Error(
        `Error: ffmpeg is required to process videos. Please install ffmpeg and ensure it is available in your PATH. Failed to process: ${path.basename(inputPath)}`,
      );
    }
    throw new Error(`Failed to create video thumbnail for ${inputPath}: ${error}`);
  }
}
