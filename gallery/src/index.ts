#!/usr/bin/env node

import process from 'node:process';

import { Command } from 'commander';

import { build } from './modules/build';
import { init } from './modules/init';
import { thumbnails } from './modules/thumbnails';

const program = new Command();

program.name('gallery').description('Simple Photo Gallery CLI').version('0.0.1');

program
  .command('init')
  .description('Initialize a gallery by scaning a folder for images and videos')
  .option(
    '-p, --photos <path>',
    'Path to the folder where the photos are stored. Default: current working directory',
    process.cwd(),
  )
  .option(
    '-g, --gallery <path>',
    'Path to the directory where the gallery will be initialized. Default: same directory as the photos folder',
  )
  .option('-r, --recursive', 'Recursively create galleries from all photos subdirectories', false)
  .action(init);

program
  .command('thumbnails')
  .description('Create thumbnails for all media files in the gallery')
  .option('-g, --gallery <path>', 'Path to the directory of the gallery. Default: current working directory', process.cwd())
  .option('-s, --size <size>', 'Thumbnail height in pixels', '200')
  .option('-r, --recursive', 'Scan subdirectories recursively', false)
  .action(thumbnails);

program
  .command('build')
  .description('Build the HTML gallery in the specified directory')
  .option('-g, --gallery <path>', 'Path to the directory of the gallery. Default: current working directory', process.cwd())
  .option('-r, --recursive', 'Scan subdirectories recursively', false)
  .option('-b, --base-url <url>', 'Base URL where the photos are hosted')
  .action(build);

program.parse();
