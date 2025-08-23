import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { askUserForConfirmation, findGalleries } from '../../utils';

import type { BuildOptions } from './types';
import { GalleryData, GalleryDataSchema } from '../../types';

function checkFileIsOneFolderUp(filePath: string) {
  const normalizedPath = path.normalize(filePath);
  const pathParts = normalizedPath.split(path.sep);
  return pathParts.length === 2 && pathParts[0] === '..';
}

function copyPhotos(galleryData: GalleryData, galleryDir: string) {
  galleryData.sections.forEach((section) => {
    section.images.forEach((image) => {
      if (!checkFileIsOneFolderUp(image.path)) {
        const sourcePath = path.join(galleryDir, 'gallery', image.path);
        const fileName = path.basename(image.path);
        const destPath = path.join(galleryDir, fileName);

        fs.copyFileSync(sourcePath, destPath);
      }
    });
  });
}

async function buildGallery(galleryDir: string, templateDir: string) {
  // Make sure the gallery.json file exists
  const galleryJsonPath = path.join(galleryDir, 'gallery', 'gallery.json');
  if (!fs.existsSync(galleryJsonPath)) {
    console.log(`No gallery/gallery.json found in ${galleryDir}`);
    return;
  }

  // Read the gallery.json file
  const galleryContent = fs.readFileSync(galleryJsonPath, 'utf8');
  const galleryData = GalleryDataSchema.parse(JSON.parse(galleryContent));

  // Check if the photos need to be copied
  const shouldCopyPhotos = galleryData.sections.some((section) =>
    section.images.some((image) => !checkFileIsOneFolderUp(image.path)),
  );

  if (
    shouldCopyPhotos &&
    (await askUserForConfirmation('All photos need to be copied. Are you sure you want to continue? (y/N): '))
  )
    copyPhotos(galleryData, galleryDir);

  // Build the template
  const originalEnv = { ...process.env };
  try {
    // Set the environment variable for the gallery.json path that will be used by the template
    process.env.GALLERY_JSON_PATH = galleryJsonPath;
    process.env.GALLERY_OUTPUT_DIR = path.join(galleryDir, 'gallery');

    execSync('npx astro build', { cwd: templateDir, stdio: 'inherit' });
  } catch (error) {
    console.error(error);
    console.error(`Build failed for ${galleryDir}`);
    return;
  } finally {
    // Restore original environment and gallery.json
    process.env = originalEnv;
  }

  // Copy the build output to the output directory
  const outputDir = path.join(galleryDir, 'gallery');
  const buildDir = path.join(outputDir, '_build');
  fs.cpSync(buildDir, outputDir, { recursive: true });

  // Move the index.html to the gallery directory
  fs.copyFileSync(path.join(outputDir, 'index.html'), path.join(galleryDir, 'index.html'));
  fs.rmSync(path.join(outputDir, 'index.html'));

  // Clean up the _build directory
  console.log('Cleaning up build directory...');
  fs.rmSync(buildDir, { recursive: true, force: true });
}

export async function build(options: BuildOptions): Promise<void> {
  // Get the astro theme directory from the default one
  const themePath = await import.meta.resolve('@simple-photo-gallery/theme-modern/package.json');
  const themeDir = path.dirname(new URL(themePath).pathname);

  // Find all gallery directories
  const galleryDirs = findGalleries(options.gallery, options.recursive);

  // If no galleries are found, exit
  if (galleryDirs.length === 0) {
    console.log('No gallery/gallery.json files found.');
    return;
  }

  // Process each gallery
  for (const dir of galleryDirs) {
    buildGallery(path.resolve(dir), themeDir);
  }
}
