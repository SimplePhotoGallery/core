import { promises as fs } from 'node:fs';
import path from 'node:path';

import { createImageThumbnail, createVideoThumbnail } from './utils';

import type { GalleryData, MediaFile } from '../../types';
import type { ThumbnailOptions } from './types';

export async function thumbnails(options: ThumbnailOptions): Promise<void> {
  const galleryPath = path.resolve(options.path, '.simple-photo-gallery');
  const galleryJsonPath = path.join(galleryPath, 'gallery.json');
  const thumbnailsPath = path.join(galleryPath, 'thumbnails');

  console.log(`Gallery path: ${galleryPath}`);
  console.log(`Thumbnail size (height): ${options.size}px`);

  try {
    // Check if gallery.json exists
    await fs.access(galleryJsonPath);

    // Ensure thumbnails directory exists
    await fs.mkdir(thumbnailsPath, { recursive: true });

    // Read gallery.json
    const galleryContent = await fs.readFile(galleryJsonPath, 'utf8');
    const galleryData: GalleryData = JSON.parse(galleryContent);

    console.log(`Found gallery: ${galleryData.title}`);

    let processedCount = 0;
    const updatedGalleryData = { ...galleryData };

    // Process all sections and their images
    for (let sectionIndex = 0; sectionIndex < galleryData.sections.length; sectionIndex++) {
      const section = galleryData.sections[sectionIndex];
      const updatedImages: MediaFile[] = [];

      for (const mediaFile of section.images) {
        try {
          const scanDir = path.dirname(galleryPath);
          const originalPath = path.join(scanDir, mediaFile.path);
          const fileName = path.basename(originalPath);
          const fileNameWithoutExt = path.parse(fileName).name;
          const thumbnailFileName = `${fileNameWithoutExt}.jpg`;
          const thumbnailPath = path.join(thumbnailsPath, thumbnailFileName);
          const relativeThumbnailPath = path.join('.simple-photo-gallery', 'thumbnails', thumbnailFileName);

          console.log(`Processing ${mediaFile.type}: ${fileName}`);

          let thumbnailDimensions: { width: number; height: number };

          if (mediaFile.type === 'image') {
            thumbnailDimensions = await createImageThumbnail(originalPath, thumbnailPath, options.size);
          } else if (mediaFile.type === 'video') {
            thumbnailDimensions = await createVideoThumbnail(originalPath, thumbnailPath, options.size);
          } else {
            console.warn(`Unknown media type: ${mediaFile.type}, skipping...`);
            updatedImages.push(mediaFile);
            continue;
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

          updatedImages.push(updatedMediaFile);
          processedCount++;

          console.log(
            `✓ Created thumbnail: ${thumbnailFileName} (${thumbnailDimensions.width}x${thumbnailDimensions.height})`,
          );
        } catch (error) {
          if (error instanceof Error && error.message === 'FFMPEG_NOT_AVAILABLE') {
            console.warn(`⚠ Skipping video thumbnail (ffmpeg not available): ${path.basename(mediaFile.path)}`);
          } else {
            console.error(`Error processing ${mediaFile.path}:`, error);
          }
          // Keep the original media file without thumbnail
          updatedImages.push(mediaFile);
        }
      }

      // Update the section with the updated images
      updatedGalleryData.sections[sectionIndex] = {
        ...section,
        images: updatedImages,
      };
    }

    // Write updated gallery.json
    await fs.writeFile(galleryJsonPath, JSON.stringify(updatedGalleryData, null, 2));

    console.log(`\n✓ Successfully processed ${processedCount} media files`);
    console.log(`✓ Thumbnails saved to: ${thumbnailsPath}`);
    console.log(`✓ Updated gallery.json with thumbnail information`);
  } catch (error) {
    if ((error as { code: string }).code === 'ENOENT') {
      throw new Error(
        `Gallery not found at ${galleryJsonPath}. Please run 'gallery scan' first or specify the correct path with -p option.`,
      );
    }
    throw new Error(`Error creating thumbnails: ${error}`);
  }
}
