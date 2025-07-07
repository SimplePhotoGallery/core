import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';

import ffprobe from 'node-ffprobe';
import sharp from 'sharp';

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

    // Calculate width maintaining aspect ratio
    const originalWidth = metadata.width || 0;
    const originalHeight = metadata.height || 0;
    const aspectRatio = originalWidth / originalHeight;
    const width = Math.round(height * aspectRatio);

    await image.resize(width, height, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 80 }).toFile(outputPath);

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
            await sharp(tempFramePath)
              .resize(width, height, { fit: 'inside', withoutEnlargement: true })
              .jpeg({ quality: 80 })
              .toFile(outputPath);

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
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as any).message === 'string' &&
      ((error as any).message.includes('ffmpeg') || (error as any).message.includes('ffprobe'))
    ) {
      throw new Error(
        `Error: ffmpeg is required to process videos. Please install ffmpeg and ensure it is available in your PATH. Failed to process: ${path.basename(inputPath)}`,
      );
    }
    throw new Error(`Failed to create video thumbnail for ${inputPath}: ${error}`);
  }
}