#!/usr/bin/env node

import process from 'node:process';

import { Command } from 'commander';

import { scan } from './modules/scan';
import { setupTemplate } from './modules/setup-template';
import { thumbnails } from './modules/thumbnails';

const program = new Command();

program.name('gallery').description('Simple Photo Gallery CLI').version('0.0.1');

program
  .command('init')
  .description('Initialize a gallery by scaning a folder for images and videos')
  .option(
    '-p, --path <path>',
    'Path where the gallery should be initialized. Default: current working directory',
    process.cwd(),
  )
  .option('-o, --output <path>', 'Output directory for the gallery.json file', '')
  .option('-r, --recursive', 'Scan subdirectories recursively', false)
  .action(scan);

program
  .command('thumbnails')
  .description('Create thumbnails for all media files in the gallery')
  .option(
    '-p, --path <path>',
    'Path to the folder containing the gallery.json file. Default: current working directory',
    process.cwd(),
  )
  .option('-s, --size <size>', 'Thumbnail height in pixels', '200')
  .option('-r, --recursive', 'Scan subdirectories recursively', false)
  .action(thumbnails);

program
  .command('build')
  .description('Build the HTML gallery in the specified directory')
  .option(
    '-p, --path <path>',
    'Path to the folder containing the gallery.json file. Default: current working directory',
    process.cwd(),
  )
  .option('-r, --recursive', 'Scan subdirectories recursively', false)
  .action(setupTemplate);

program.parse();
