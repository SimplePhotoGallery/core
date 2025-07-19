import { promises as fs } from 'node:fs';
import path from 'node:path';

import { createImageThumbnail, createVideoThumbnail } from './utils';

import type { GalleryData, MediaFile } from '../../types';
import type { ThumbnailOptions } from './types';

async function findGalleryDirectories(basePath: string): Promise<string[]> {
  const galleryDirs: Set<string> = new Set();

  // First, check if the base path itself contains gallery/gallery.json
  const baseGalleryJsonPath = path.join(basePath, 'gallery', 'gallery.json');
  try {
    await fs.access(baseGalleryJsonPath);
    galleryDirs.add(path.resolve(basePath));
  } catch {
    // gallery.json doesn't exist in base path, continue searching subdirectories
  }

  try {
    const entries = await fs.readdir(basePath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(basePath, entry.name);

      if (entry.isDirectory()) {
        // Check if this directory contains gallery/gallery.json
        const galleryJsonPath = path.join(fullPath, 'gallery', 'gallery.json');
        try {
          await fs.access(galleryJsonPath);
          galleryDirs.add(path.resolve(fullPath));
        } catch {
          // gallery.json doesn't exist in this directory, continue searching
        }

        // Recursively search subdirectories
        const subGalleryDirs = await findGalleryDirectories(fullPath);
        for (const dir of subGalleryDirs) {
          galleryDirs.add(dir);
        }
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read directory ${basePath}:`, error);
  }

  return [...galleryDirs];
}

async function processGalleryDirectory(galleryDir: string, size: number): Promise<number> {
  const galleryJsonPath = path.join(galleryDir, 'gallery', 'gallery.json');
  const thumbnailsPath = path.join(galleryDir, 'gallery', 'thumbnails');

  console.log(`\nProcessing gallery in: ${galleryDir}`);

  try {
    // Ensure thumbnails directory exists
    await fs.mkdir(thumbnailsPath, { recursive: true });

    // Read gallery.json
    const galleryContent = await fs.readFile(galleryJsonPath, 'utf8');
    let galleryData: GalleryData = JSON.parse(galleryContent);

    // Handle backward compatibility for old gallery.json format
    if ('files' in galleryData && !('sections' in galleryData)) {
      console.log('Converting old gallery.json format to new format...');
      const oldFormat = galleryData as any;
      galleryData = {
        title: oldFormat.title || 'My Gallery',
        description: oldFormat.description || 'My gallery with fantastic photos.',
        headerImage: oldFormat.headerImage || oldFormat.files?.[0]?.path || '',
        metadata: oldFormat.metadata || { ogUrl: '' },
        sections: [
          {
            images: oldFormat.files || [],
          },
        ],
      };
    }

    console.log(`Found gallery: ${galleryData.title}`);

    const processedCount = await processGalleryData(galleryData, galleryDir, thumbnailsPath, size);

    // Write updated gallery.json
    await fs.writeFile(galleryJsonPath, JSON.stringify(galleryData, null, 2));

    console.log(`✓ Successfully processed ${processedCount} media files in ${galleryDir}`);
    console.log(`✓ Thumbnails saved to: ${thumbnailsPath}`);
    console.log(`✓ Updated gallery.json with thumbnail information`);

    return processedCount;
  } catch (error) {
    console.error(`Error creating thumbnails for ${galleryDir}:`, error);
    return 0;
  }
}

async function processGalleryData(
  galleryData: GalleryData,
  galleryDir: string,
  thumbnailsPath: string,
  size: number,
): Promise<number> {
  let processedCount = 0;

  // Process all sections and their images
  for (let sectionIndex = 0; sectionIndex < galleryData.sections.length; sectionIndex++) {
    const section = galleryData.sections[sectionIndex];
    const updatedImages: MediaFile[] = [];

    for (const mediaFile of section.images) {
      try {
        // Resolve the path relative to the gallery.json file location, not the gallery directory
        const galleryJsonDir = path.join(galleryDir, 'gallery');
        const originalPath = path.isAbsolute(mediaFile.path)
          ? mediaFile.path // If it's an absolute path, use it as is
          : path.resolve(galleryJsonDir, mediaFile.path); // If it's a relative path, resolve it relative to the gallery.json location

        const fileName = path.basename(originalPath);
        const fileNameWithoutExt = path.parse(fileName).name;
        const thumbnailFileName = `${fileNameWithoutExt}.jpg`; // Always save as .jpg
        const thumbnailPath = path.join(thumbnailsPath, thumbnailFileName);
        const relativeThumbnailPath = path.join('thumbnails', thumbnailFileName);

        console.log(`Processing ${mediaFile.type}: ${fileName}`);

        let thumbnailDimensions: { width: number; height: number };

        if (mediaFile.type === 'image') {
          thumbnailDimensions = await createImageThumbnail(originalPath, thumbnailPath, size);
        } else if (mediaFile.type === 'video') {
          thumbnailDimensions = await createVideoThumbnail(originalPath, thumbnailPath, size);
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
    galleryData.sections[sectionIndex] = {
      ...section,
      images: updatedImages,
    };
  }

  return processedCount;
}

export async function thumbnails(options: ThumbnailOptions): Promise<void> {
  console.log(`Thumbnail size (height): ${options.size}px`);

  let galleryDirectories: string[];

  if (options.recursive) {
    // Recursive mode: find all directories containing gallery/gallery.json
    console.log(`Scanning recursively for galleries in: ${options.path}`);
    galleryDirectories = await findGalleryDirectories(options.path);
  } else {
    // Non-recursive mode: check if single directory contains gallery/gallery.json
    console.log(`Processing gallery in: ${options.path}`);
    const galleryJsonPath = path.join(options.path, 'gallery', 'gallery.json');

    try {
      await fs.access(galleryJsonPath);
      galleryDirectories = [options.path];
    } catch (error) {
      if ((error as { code: string }).code === 'ENOENT') {
        throw new Error(
          `Gallery not found at ${galleryJsonPath}. Please ensure the directory contains gallery/gallery.json or use -r for recursive search.`,
        );
      }
      throw new Error(`Error creating thumbnails: ${error}`);
    }
  }

  if (galleryDirectories.length === 0) {
    console.log('No galleries found with gallery/gallery.json files.');
    return;
  }

  if (options.recursive) {
    console.log(`Found ${galleryDirectories.length} galleries:`);
    for (const dir of galleryDirectories) {
      console.log(`  - ${dir}`);
    }
  }

  // Process each gallery directory
  let totalProcessed = 0;
  for (const galleryDir of galleryDirectories) {
    const processed = await processGalleryDirectory(galleryDir, options.size);
    totalProcessed += processed;
  }

  if (options.recursive) {
    console.log(
      `\n✅ Completed processing ${totalProcessed} total media files across ${galleryDirectories.length} galleries.`,
    );
  } else {
    console.log(`\n✅ Completed processing ${totalProcessed} media files.`);
  }
}
