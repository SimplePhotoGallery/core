import fs from 'node:fs';
import path from 'node:path';

import { createImageThumbnail, createVideoThumbnail } from './utils';

import { GalleryDataSchema, type MediaFile } from '../../types';
import { findGalleries } from '../../utils';

import type { ThumbnailOptions } from './types';

const processGallery = async (galleryDir: string, size: number): Promise<number> => {
  const galleryJsonPath = path.join(galleryDir, 'gallery', 'gallery.json');
  const thumbnailsPath = path.join(galleryDir, 'gallery', 'thumbnails');

  console.log(`\nProcessing gallery in: ${galleryDir}`);

  try {
    // Ensure thumbnails directory exists
    fs.mkdirSync(thumbnailsPath, { recursive: true });

    // Read gallery.json
    const galleryContent = fs.readFileSync(galleryJsonPath, 'utf8');
    const galleryData = GalleryDataSchema.parse(JSON.parse(galleryContent));

    // Process all sections and their images
    let processedCount = 0;
    for (const section of galleryData.sections) {
      for (const [index, mediaFile] of section.images.entries()) {
        section.images[index] = await processMediaFile(mediaFile, galleryDir, thumbnailsPath, size);
      }

      processedCount += section.images.length;
    }

    // Write updated gallery.json
    fs.writeFileSync(galleryJsonPath, JSON.stringify(galleryData, null, 2));

    return processedCount;
  } catch (error) {
    console.error(`Error creating thumbnails for ${galleryDir}:`, error);
    return 0;
  }
};

async function processMediaFile(
  mediaFile: MediaFile,
  galleryDir: string,
  thumbnailsPath: string,
  size: number,
): Promise<MediaFile> {
  try {
    // Resolve the path relative to the gallery.json file location, not the gallery directory
    const galleryJsonDir = path.join(galleryDir, 'gallery');
    const filePath = path.resolve(path.join(galleryJsonDir, mediaFile.path));

    const fileName = path.basename(filePath);
    const fileNameWithoutExt = path.parse(fileName).name;
    const thumbnailFileName = `${fileNameWithoutExt}.jpg`;
    const thumbnailPath = path.join(thumbnailsPath, thumbnailFileName);
    const relativeThumbnailPath = path.relative(galleryJsonDir, thumbnailPath);

    console.log(`Processing ${mediaFile.type}: ${fileName}`);

    let thumbnailDimensions: { width: number; height: number };

    if (mediaFile.type === 'image') {
      thumbnailDimensions = await createImageThumbnail(filePath, thumbnailPath, size);
    } else if (mediaFile.type === 'video') {
      thumbnailDimensions = await createVideoThumbnail(filePath, thumbnailPath, size);
    } else {
      console.warn(`Unknown media type: ${mediaFile.type}, skipping...`);
      return mediaFile;
    }

    // Update media file with thumbnail information
    const updatedMediaFile: MediaFile = {
      ...mediaFile,
      thumbnail: {
        path: relativeThumbnailPath,
        width: thumbnailDimensions.width,
        height: thumbnailDimensions.height,
      },
    };

    return updatedMediaFile;
  } catch (error) {
    if (error instanceof Error && error.message === 'FFMPEG_NOT_AVAILABLE') {
      console.warn(`⚠ Skipping video thumbnail (ffmpeg not available): ${path.basename(mediaFile.path)}`);
    } else {
      console.error(`Error processing ${mediaFile.path}:`, error);
    }

    return mediaFile;
  }
}

export async function thumbnails(options: ThumbnailOptions): Promise<void> {
  const size = Number.parseInt(options.size);

  // Find all gallery directories
  const galleryDirs = findGalleries(options.gallery, options.recursive);

  // If no galleries are found, exit
  if (galleryDirs.length === 0) {
    console.log('No gallery/gallery.json files found.');
    return;
  }

  // Process each gallery directory
  let totalProcessed = 0;
  for (const galleryDir of galleryDirs) {
    const processed = await processGallery(galleryDir, size);
    totalProcessed += processed;
  }

  // Log processing stats
  if (options.recursive) {
    console.log(`Completed processing ${totalProcessed} total media files across ${galleryDirs.length} galleries.`);
  } else {
    console.log(`Completed processing ${totalProcessed} media files.`);
  }
}
