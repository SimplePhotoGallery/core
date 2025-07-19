import { promises as fs } from 'node:fs';
import path from 'node:path';

import { capitalizeTitle, getImageMetadata, getVideoDimensions, isMediaFile } from './utils';

import type { MediaFile } from '../../types';
import type { ScanOptions, SubGallery } from './types';

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

async function createGalleryJson(
  mediaFiles: MediaFile[],
  galleryJsonPath: string,
  subGalleries: SubGallery[] = [],
): Promise<void> {
  const galleryDir = path.dirname(galleryJsonPath);

  // Convert media file paths to be relative to gallery.json
  const relativeMediaFiles = mediaFiles.map((file) => ({
    ...file,
    path: path.relative(galleryDir, file.path),
  }));

  // Convert subGallery header image paths to be relative to gallery.json
  const relativeSubGalleries = subGalleries.map((subGallery) => ({
    ...subGallery,
    headerImage: subGallery.headerImage ? path.relative(galleryDir, subGallery.headerImage) : '',
  }));

  const galleryData = {
    title: 'My Gallery',
    description: 'My gallery with fantastic photos.',
    headerImage: relativeMediaFiles[0]?.path || '',
    metadata: { ogUrl: '' },
    sections: [
      {
        images: relativeMediaFiles,
      },
    ],
    subGalleries: {
      title: 'Sub Galleries',
      galleries: relativeSubGalleries,
    },
  };

  await fs.writeFile(galleryJsonPath, JSON.stringify(galleryData, null, 2));
}

interface ProcessResult {
  totalFiles: number;
  subGallery?: SubGallery;
}

async function processDirectory(dirPath: string, options: ScanOptions): Promise<ProcessResult> {
  let totalFiles = 0;
  const subGalleries: SubGallery[] = [];

  // Scan current directory for media files
  const mediaFiles = await scanDirectoryOnly(dirPath);
  totalFiles += mediaFiles.length;

  // Process subdirectories only if recursive mode is enabled
  if (options.recursive) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory() && entry.name !== 'gallery') {
          const subDirPath = path.join(dirPath, entry.name);
          const result = await processDirectory(subDirPath, options);
          totalFiles += result.totalFiles;

          // If the subdirectory had media files, add it as a subGallery
          if (result.subGallery) {
            subGalleries.push(result.subGallery);
          }
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${dirPath}:`, error);
    }
  }

  // Create gallery.json if there are media files or subGalleries
  if (mediaFiles.length > 0 || subGalleries.length > 0) {
    const outputPath = options.output
      ? path.resolve(options.output, path.relative(path.resolve(options.path), dirPath), 'gallery')
      : path.join(dirPath, 'gallery');
    const galleryJsonPath = path.join(outputPath, 'gallery.json');

    // Create output directory
    await fs.mkdir(outputPath, { recursive: true });

    // Create gallery.json for this directory
    await createGalleryJson(mediaFiles, galleryJsonPath, subGalleries);

    console.log(
      `Gallery JSON created at: ${galleryJsonPath} (${mediaFiles.length} files, ${subGalleries.length} subgalleries)`,
    );
  }

  // Return result with suGgallery info if this directory has media files
  const result: ProcessResult = { totalFiles };

  if (mediaFiles.length > 0 || subGalleries.length > 0) {
    const dirName = path.basename(dirPath);
    result.subGallery = {
      title: capitalizeTitle(dirName),
      headerImage: mediaFiles[0]?.path || '',
      path: `../${dirName}/gallery`,
    };
  }

  return result;
}

export async function scan(options: ScanOptions): Promise<void> {
  const scanPath = path.resolve(options.path);

  console.log(`Scanning directory: ${scanPath}`);
  console.log(`Recursive: ${options.recursive}`);

  try {
    // Ensure scan path exists
    await fs.access(scanPath);

    // Process the directory tree with the specified recursion setting
    const result = await processDirectory(scanPath, options);
    console.log(`Total files processed: ${result.totalFiles}`);
  } catch (error) {
    throw new Error(`Error during scan: ${error}`);
  }
}
