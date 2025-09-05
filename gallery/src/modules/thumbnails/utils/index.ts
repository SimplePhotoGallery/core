import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';

import ffprobe from 'node-ffprobe';
import sharp from 'sharp';

import type { Buffer } from 'node:buffer';

// Utility function to resize and save thumbnail
async function resizeAndSaveThumbnail(image: sharp.Sharp, outputPath: string, width: number, height: number): Promise<void> {
  await image.resize(width, height, { withoutEnlargement: true }).jpeg({ quality: 90 }).toFile(outputPath);
}

export async function createImageThumbnail(
  inputPath: string,
  outputPath: string,
  height: number,
): Promise<{ width: number; height: number }> {
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
}

export async function createVideoThumbnail(
  inputPath: string,
  outputPath: string,
  height: number,
  verbose: boolean = false,
): Promise<{ width: number; height: number }> {
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
