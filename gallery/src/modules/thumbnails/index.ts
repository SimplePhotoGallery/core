import fs from 'node:fs';
import path from 'node:path';

import { LogLevels, type ConsolaInstance } from 'consola';

import { createImageThumbnail, createVideoThumbnail } from './utils';

import { GalleryDataSchema, type MediaFile } from '../../types';
import { findGalleries, handleFileProcessingError } from '../../utils';

import type { ThumbnailOptions } from './types';

async function processMediaFile(
  mediaFile: MediaFile,
  galleryDir: string,
  thumbnailsPath: string,
  thumbnailSize: number,
  ui: ConsolaInstance,
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

    ui.debug(`Processing ${mediaFile.type}: ${fileName}`);

    let thumbnailDimensions: { width: number; height: number } = { width: 0, height: 0 };

    if (mediaFile.type === 'image') {
      thumbnailDimensions = await createImageThumbnail(filePath, thumbnailPath, thumbnailSize);
    } else if (mediaFile.type === 'video') {
      thumbnailDimensions = await createVideoThumbnail(filePath, thumbnailPath, thumbnailSize, ui.level === LogLevels.debug);
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
    handleFileProcessingError(error, path.basename(mediaFile.path), ui);

    return mediaFile;
  }
}

const processGallery = async (galleryDir: string, ui: ConsolaInstance): Promise<number> => {
  const galleryJsonPath = path.join(galleryDir, 'gallery', 'gallery.json');
  const thumbnailsPath = path.join(galleryDir, 'gallery', 'thumbnails');

  ui.start(`Creating thumbnails: ${galleryDir}`);

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
        section.images[index] = await processMediaFile(mediaFile, galleryDir, thumbnailsPath, galleryData.thumbnailSize, ui);
      }

      processedCount += section.images.length;
    }

    // Write updated gallery.json
    fs.writeFileSync(galleryJsonPath, JSON.stringify(galleryData, null, 2));

    ui.success(`Created thumbnails for ${processedCount} media files`);

    return processedCount;
  } catch (error) {
    ui.error(`Error creating thumbnails for ${galleryDir}`);
    throw error;
  }
};

export async function thumbnails(options: ThumbnailOptions, ui: ConsolaInstance): Promise<void> {
  try {
    // Find all gallery directories
    const galleryDirs = findGalleries(options.gallery, options.recursive);
    if (galleryDirs.length === 0) {
      ui.error('No galleries found.');
      return;
    }

    // Process each gallery directory
    let totalGalleries = 0;
    let totalProcessed = 0;
    for (const galleryDir of galleryDirs) {
      const processed = await processGallery(galleryDir, ui);

      if (processed > 0) {
        ++totalGalleries;
        totalProcessed += processed;
      }
    }

    ui.box(
      `Created thumbnails for ${totalGalleries} ${totalGalleries === 1 ? 'gallery' : 'galleries'} with ${totalProcessed} media ${totalProcessed === 1 ? 'file' : 'files'}`,
    );
  } catch (error) {
    ui.error('Error creating thumbnails');
    throw error;
  }
}
