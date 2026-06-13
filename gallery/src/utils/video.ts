import { spawn, spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import process from 'node:process';

import ffprobe from 'node-ffprobe';
import sharp from 'sharp';

import { resizeImage, type ImageEncodeOptions, type ThumbnailSizeDimension } from './image';

import type { Dimensions } from '../types';
import type { Buffer } from 'node:buffer';

export interface VideoToolchainStatus {
  available: boolean;
  missing: string[];
  installHint: string;
}

/**
 * Checks whether the external ffmpeg tools required for video thumbnails are available.
 * @returns Availability, missing executable names, and a platform-specific install hint
 */
export function checkVideoToolchain(): VideoToolchainStatus {
  const requiredTools = ['ffmpeg', 'ffprobe'];
  const missing = requiredTools.filter((tool) => {
    const result = spawnSync(tool, ['-version'], { stdio: 'ignore' });
    return Boolean(result.error) || result.status !== 0;
  });

  return {
    available: missing.length === 0,
    missing,
    installHint: getFfmpegInstallHint(),
  };
}

function getFfmpegInstallHint(): string {
  switch (process.platform) {
    case 'darwin': {
      return 'Install ffmpeg with: brew install ffmpeg';
    }
    case 'win32': {
      return 'Install ffmpeg with: winget install Gyan.FFmpeg';
    }
    default: {
      return 'Install ffmpeg with your package manager, for example: sudo apt install ffmpeg';
    }
  }
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
 * @param size - Target size for thumbnail
 * @param sizeDimension - How to apply size: 'auto' (longer edge), 'width', or 'height'
 * @param verbose - Whether to enable verbose ffmpeg output
 * @param onStderr - Optional handler for ffmpeg stderr output when verbose
 * @param encodeOptions - Encoding options (format, quality, effort)
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
  onStderr?: (message: string) => void,
  encodeOptions: ImageEncodeOptions = {},
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
      if (verbose) {
        onStderr?.(data.toString());
      }
    });

    ffmpeg.on('close', async (code: number) => {
      if (code === 0) {
        try {
          // Read the extracted frame once and decode both thumbnails from memory instead of re-reading
          // the temporary file from disk for each output
          const frameBuffer = await fs.readFile(tempFramePath);
          const frameImage = sharp(frameBuffer);
          await resizeImage(frameImage, outputPath, width, height, encodeOptions);
          await resizeImage(frameImage, outputPathRetina, width * 2, height * 2, encodeOptions);

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
