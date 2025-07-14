import { promises as fs } from 'node:fs';
import path from 'node:path';

import { getImageMetadata, getVideoDimensions, isMediaFile } from './utils';

import type { ScanOptions } from './types';
import type { MediaFile } from '../../types';

async function scanDirectoryOnly(dirPath: string): Promise<MediaFile[]> {
  const mediaFiles: MediaFile[] = [];

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile()) {
        const fullPath = path.join(dirPath, entry.name);
        const mediaType = isMediaFile(entry.name);
        if (mediaType) {
          console.log(`Processing ${mediaType}: ${entry.name}`);

          let metadata: { width: number; height: number; description?: string } = { width: 0, height: 0 };

          try {
            if (mediaType === 'image') {
              metadata = await getImageMetadata(fullPath);
            } else if (mediaType === 'video') {
              try {
                const videoDimensions = await getVideoDimensions(fullPath);
                metadata = { ...videoDimensions };
              } catch (videoError: unknown) {
                if (
                  typeof videoError === 'object' &&
                  videoError !== null &&
                  'message' in videoError &&
                  typeof (videoError as { message: string }).message === 'string' &&
                  ((videoError as { message: string }).message.includes('ffprobe') ||
                    (videoError as { message: string }).message.includes('ffmpeg'))
                ) {
                  console.error(
                    `Error: ffprobe (part of ffmpeg) is required to process videos. Please install ffmpeg and ensure it is available in your PATH. Skipping video: ${entry.name}`,
                  );
                } else {
                  console.error(`Error processing video ${entry.name}:`, videoError);
                }
                continue; // Skip this file
              }
            }
          } catch (mediaError) {
            console.error(`Error processing file ${entry.name}:`, mediaError);
            continue; // Skip this file
          }

          const mediaFile: MediaFile = {
            type: mediaType,
            path: fullPath,
            width: metadata.width,
            height: metadata.height,
          };

          if (metadata.description) {
            mediaFile.alt = metadata.description;
          }

          mediaFiles.push(mediaFile);
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error);
  }

  return mediaFiles;
}

async function createGalleryJson(mediaFiles: MediaFile[], galleryJsonPath: string): Promise<void> {
  const galleryData = {
    title: 'My Gallery',
    description: 'My gallery with fantastic photos.',
    headerImage: mediaFiles[0]?.path || '',
    metadata: { ogUrl: '' },
    sections: [
      {
        images: mediaFiles,
      },
    ],
  };

  await fs.writeFile(galleryJsonPath, JSON.stringify(galleryData, null, 2));
}

async function scanRecursively(dirPath: string, options: ScanOptions): Promise<number> {
  let totalFiles = 0;

  // Scan current directory for media files
  const mediaFiles = await scanDirectoryOnly(dirPath);

  if (mediaFiles.length > 0) {
    const outputPath = options.output
      ? path.resolve(options.output, path.relative(path.resolve(options.path), dirPath), 'gallery')
      : path.join(dirPath, 'gallery');
    const galleryJsonPath = path.join(outputPath, 'gallery.json');

    // Create output directory
    await fs.mkdir(outputPath, { recursive: true });

    // Create gallery.json for this directory
    await createGalleryJson(mediaFiles, galleryJsonPath);

    console.log(`Gallery JSON created at: ${galleryJsonPath} (${mediaFiles.length} files)`);
    totalFiles += mediaFiles.length;
  }

  // Recursively scan subdirectories
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory() && entry.name !== 'gallery') {
        const subDirPath = path.join(dirPath, entry.name);
        const subDirFiles = await scanRecursively(subDirPath, options);
        totalFiles += subDirFiles;
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }

  return totalFiles;
}

export async function scan(options: ScanOptions): Promise<void> {
  const scanPath = path.resolve(options.path);

  console.log(`Scanning directory: ${scanPath}`);
  console.log(`Recursive: ${options.recursive}`);

  try {
    // Ensure scan path exists
    await fs.access(scanPath);

    if (options.recursive) {
      // In recursive mode, create separate gallery.json for each directory
      const totalFiles = await scanRecursively(scanPath, options);
      console.log(`Total files processed: ${totalFiles}`);
    } else {
      // In non-recursive mode, create single gallery.json
      const outputPath = options.output ? path.resolve(options.output, 'gallery') : path.resolve(scanPath, 'gallery');
      const galleryJsonPath = path.join(outputPath, 'gallery.json');

      console.log(`Output directory: ${outputPath}`);

      // Ensure output directory exists
      await fs.mkdir(outputPath, { recursive: true });

      // Scan for media files (non-recursively)
      const mediaFiles = await scanDirectoryOnly(scanPath);

      console.log(`Found ${mediaFiles.length} media files`);

      if (mediaFiles.length > 0) {
        await createGalleryJson(mediaFiles, galleryJsonPath);
        console.log(`Gallery JSON created at: ${galleryJsonPath}`);
      }

      console.log(`Total files processed: ${mediaFiles.length}`);
    }
  } catch (error) {
    throw new Error(`Error during scan: ${error}`);
  }
}
