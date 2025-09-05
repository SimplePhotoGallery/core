import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { LogLevels, type ConsolaInstance } from 'consola';

import { type GalleryData, GalleryDataSchema } from '../../types';
import { findGalleries } from '../../utils';

import type { BuildOptions } from './types';

function checkFileIsOneFolderUp(filePath: string) {
  const normalizedPath = path.normalize(filePath);
  const pathParts = normalizedPath.split(path.sep);
  return pathParts.length === 2 && pathParts[0] === '..';
}

function copyPhotos(galleryData: GalleryData, galleryDir: string, ui: ConsolaInstance) {
  for (const section of galleryData.sections) {
    for (const image of section.images) {
      if (!checkFileIsOneFolderUp(image.path)) {
        const sourcePath = path.join(galleryDir, 'gallery', image.path);
        const fileName = path.basename(image.path);
        const destPath = path.join(galleryDir, fileName);

        ui.debug(`Copying photo to ${destPath}`);
        fs.copyFileSync(sourcePath, destPath);
      }
    }
  }
}

async function buildGallery(galleryDir: string, templateDir: string, ui: ConsolaInstance, baseUrl?: string) {
  // Read the gallery.json file
  const galleryJsonPath = path.join(galleryDir, 'gallery', 'gallery.json');
  const galleryContent = fs.readFileSync(galleryJsonPath, 'utf8');
  const galleryData = GalleryDataSchema.parse(JSON.parse(galleryContent));

  // Check if the photos need to be copied. Not needed if the baseUrl is provided.
  if (!baseUrl) {
    const shouldCopyPhotos = galleryData.sections.some((section) =>
      section.images.some((image) => !checkFileIsOneFolderUp(image.path)),
    );

    if (
      shouldCopyPhotos &&
      (await ui.prompt('All photos need to be copied. Are you sure you want to continue?', { type: 'confirm' }))
    )
      copyPhotos(galleryData, galleryDir, ui);
  }

  // If the baseUrl is provided, update the gallery.json file
  if (baseUrl) {
    galleryData.mediaBaseUrl = baseUrl;
    fs.writeFileSync(galleryJsonPath, JSON.stringify(galleryData, null, 2));
  }

  // Build the template
  try {
    // Set the environment variable for the gallery.json path that will be used by the template
    process.env.GALLERY_JSON_PATH = galleryJsonPath;
    process.env.GALLERY_OUTPUT_DIR = path.join(galleryDir, 'gallery');

    ui.debug('Building gallery');
    execSync('npx astro build', { cwd: templateDir, stdio: ui.level === LogLevels.debug ? 'inherit' : 'ignore' });
  } catch (error) {
    ui.error(`Build failed for ${galleryDir}`);
    throw error;
  }

  // Copy the build output to the output directory
  const outputDir = path.join(galleryDir, 'gallery');
  const buildDir = path.join(outputDir, '_build');
  ui.debug(`Copying build output to ${outputDir}`);
  fs.cpSync(buildDir, outputDir, { recursive: true });

  // Move the index.html to the gallery directory
  ui.debug('Moving index.html to gallery directory');
  fs.copyFileSync(path.join(outputDir, 'index.html'), path.join(galleryDir, 'index.html'));
  fs.rmSync(path.join(outputDir, 'index.html'));

  // Clean up the _build directory
  ui.debug('Cleaning up build directory');
  fs.rmSync(buildDir, { recursive: true, force: true });
}

export async function build(options: BuildOptions, ui: ConsolaInstance): Promise<void> {
  try {
    // Find all gallery directories
    const galleryDirs = findGalleries(options.gallery, options.recursive);
    if (galleryDirs.length === 0) {
      ui.error('No galleries found.');
      return;
    }

    // Get the astro theme directory from the default one
    const themePath = await import.meta.resolve('@simple-photo-gallery/theme-modern/package.json');
    const themeDir = path.dirname(new URL(themePath).pathname);

    // Process each gallery
    let totalGalleries = 0;
    for (const dir of galleryDirs) {
      ui.start(`Building gallery ${dir}`);

      const baseUrl = options.baseUrl ? `${options.baseUrl}/${path.relative(options.gallery, dir)}` : undefined;
      await buildGallery(path.resolve(dir), themeDir, ui, baseUrl);

      ui.success(`Gallery built successfully`);

      ++totalGalleries;
    }

    ui.box(`Built ${totalGalleries} ${totalGalleries === 1 ? 'gallery' : 'galleries'} successfully`);
  } catch (error) {
    ui.error('Error building gallery');
    throw error;
  }
}
