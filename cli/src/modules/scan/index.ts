import { promises as fs } from 'node:fs';
import path from 'node:path';

import { getImageMetadata, getVideoDimensions, isMediaFile } from './utils';

import type { MediaFile, ScanOptions } from './types';

async function scanDirectory(dirPath: string, recursive: boolean = false): Promise<MediaFile[]> {
  const mediaFiles: MediaFile[] = [];

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory() && recursive) {
        const subDirFiles = await scanDirectory(fullPath, recursive);
        mediaFiles.push(...subDirFiles);
      } else if (entry.isFile()) {
        const mediaType = isMediaFile(entry.name);
        if (mediaType) {
          console.log(`Processing ${mediaType}: ${entry.name}`);

          let metadata: { width: number; height: number; description?: string } = { width: 0, height: 0 };

          if (mediaType === 'image') {
            metadata = await getImageMetadata(fullPath);
          } else if (mediaType === 'video') {
            const videoDimensions = await getVideoDimensions(fullPath);
            metadata = { ...videoDimensions };
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

export async function scan(options: ScanOptions): Promise<void> {
  const scanPath = path.resolve(options.path);
  const outputPath = options.output
    ? path.resolve(options.output, '.simple-photo-gallery')
    : path.resolve(scanPath, '.simple-photo-gallery');
  const galleryJsonPath = path.join(outputPath, 'gallery.json');

  console.log(`Scanning directory: ${scanPath}`);
  console.log(`Output directory: ${outputPath}`);
  console.log(`Recursive: ${options.recursive}`);

  try {
    // Ensure scan path exists
    await fs.access(scanPath);

    // Ensure output directory exists
    await fs.mkdir(outputPath, { recursive: true });

    // Scan for media files
    const mediaFiles = await scanDirectory(scanPath, options.recursive);

    console.log(`Found ${mediaFiles.length} media files`);

    // Create gallery.json
    const galleryData = {
      title: 'My Gallery',
      description: 'My gallery with fantastic photos.',
      headerImage: mediaFiles[0].path,
      metadata: { ogUrl: '' },
      sections: [
        {
          images: mediaFiles,
        },
      ],
    };

    await fs.writeFile(galleryJsonPath, JSON.stringify(galleryData, null, 2));

    console.log(`Gallery JSON created at: ${galleryJsonPath}`);
    console.log(`Total files processed: ${mediaFiles.length}`);
  } catch (error) {
    throw new Error(`Error during scan: ${error}`);
  }
}
