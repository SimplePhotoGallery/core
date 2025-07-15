#!/usr/bin/env node

import process from 'node:process';

import { Command } from 'commander';

import { scan } from './modules/scan';
import { setup } from './modules/setup';
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
  .command('setup')
  .description('Convert CLI gallery to template format and create symbolic links')
  .option('-c, --cli-gallery <path>', 'Path to CLI-generated gallery.json file', '')
  .option('-o, --output <path>', 'Output path for template gallery.json', './gallery.json')
  .option('--copy-fallback', 'Copy files instead of creating symbolic links (for Windows compatibility)', false)
  .option('--public-dir <path>', 'Public directory name (default: public)', 'public')
  .option('--images-dir <path>', 'Directory name for images in public folder (default: images)', 'images')
  .option('--thumbnails-dir <path>', 'Directory name for thumbnails in public folder (default: thumbnails)', 'thumbnails')
  .action(setup);

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
