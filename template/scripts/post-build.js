#!/usr/bin/env node

import { cpSync, existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

// Get the directory of this script
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.resolve(__filename, '..');

// Get the template directory (parent of scripts)
const templateDir = path.resolve(__dirname, '..');

// Read gallery.json to get the output directory
const galleryJsonPath = path.join(templateDir, 'gallery.json');
const galleryJson = JSON.parse(await import('node:fs/promises').then((fs) => fs.readFile(galleryJsonPath, 'utf8')));
const outputDir = galleryJson.outputDir;

if (!outputDir) {
  console.error('outputDir not found in gallery.json');
  process.exit(1);
}

// Get the destination directory from gallery.json
const destinationDir = path.resolve(templateDir, outputDir);

// Get the build output directory (based on astro config: outputDir + '/_build')
const buildOutputDir = path.join(templateDir, outputDir, '_build');

if (!existsSync(buildOutputDir)) {
  console.error(`Build output directory not found: ${buildOutputDir}`);
  process.exit(1);
}

console.log('Moving build output to destination directory...');
console.log(`From: ${buildOutputDir}`);
console.log(`To: ${destinationDir}`);

try {
  // Ensure destination directory exists
  if (!existsSync(destinationDir)) {
    console.log(`Creating destination directory: ${destinationDir}`);
    await import('node:fs/promises').then((fs) => fs.mkdir(destinationDir, { recursive: true }));
  }

  // Copy all files from build output to destination directory
  cpSync(buildOutputDir, destinationDir, { recursive: true, force: true });

  console.log('Cleaning up build directory...');

  // Remove the build directory
  rmSync(buildOutputDir, { recursive: true, force: true });

  console.log('Build completed successfully!');
  console.log(`Files moved to: ${destinationDir}`);
} catch (error) {
  console.error('Failed to move build output:', error);
  process.exit(1);
}
