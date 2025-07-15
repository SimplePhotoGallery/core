#!/usr/bin/env node

import process from 'node:process';

import { Command } from 'commander';

import { scan } from './modules/scan';
import { setupAstro } from './modules/setup-template';
import { thumbnails } from './modules/thumbnails';

const program = new Command();

program.name('gallery').description('Simple Photo Gallery CLI').version('0.0.1');

program
  .command('init')
  .description('Initialize a new gallery project')
  .action(() => {
    console.log('Hello from gallery init!');
  });

program
  .command('build')
  .description('Build the gallery project')
  .action(() => {
    console.log('Hello from gallery build!');
  });

program
  .command('scan')
  .description('Scan directory for images and videos and create gallery.json')
  .option('-p, --path <path>', 'Path to scan for media files', process.cwd())
  .option('-o, --output <path>', 'Output directory for gallery.json', '')
  .option('-r, --recursive', 'Scan subdirectories recursively', false)
  .action(scan);

program
  .command('setup-template')
  .description('Modify Astro config to point to external images directory')
  .option('-c, --astro-config <path>', 'Path to astro.config.ts file (required)', '')
  .option('-i, --images-path <path>', 'Path to images directory (required)', '')
  .option('-g, --gallery-json <path>', 'Path to gallery.json file (required)', '')
  .option('-m, --mode <mode>', 'Mode: dev or prod (default: prod)', 'prod')
  .action((options: { astroConfig: string; imagesPath: string; galleryJson: string; mode: string }) => {
    const setupAstroOptions = {
      astroConfig: options.astroConfig,
      imagesPath: options.imagesPath,
      galleryJsonPath: options.galleryJson,
      mode: options.mode as 'dev' | 'prod',
    };
    setupAstro(setupAstroOptions);
  });

program
  .command('thumbnails')
  .description('Create thumbnails for all media files in gallery.json')
  .option('-p, --path <path>', 'Path containing .simple-photo-gallery folder', process.cwd())
  .option('-s, --size <size>', 'Thumbnail height in pixels', '200')
  .option('-r, --recursive', 'Scan subdirectories recursively for gallery/gallery.json files', false)
  .action(async (options: { path: string; size: string; recursive: boolean }) => {
    const thumbnailOptions = {
      path: options.path,
      size: Number.parseInt(options.size) || 200,
      recursive: options.recursive,
    };
    await thumbnails(thumbnailOptions);
  });

program.parse();
