import { execSync } from 'node:child_process';
import { existsSync, rmSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { copySync } from 'fs-extra';

import { GalleryDataSchema, MediaFileSchema, ThumbnailSchema } from '../src/types';

const testDir = process.cwd();

const tsxPath = path.resolve(testDir, '..', 'node_modules', '.bin', 'tsx');
const cliPath = path.resolve(testDir, 'src', 'index.ts');

const singleFixturePath = path.resolve(testDir, 'tests', 'fixtures', 'single');
const singleTestPath = path.resolve(testDir, 'tests', 'fixtures', 'test', 'single');

const multiFixturePath = path.resolve(testDir, 'tests', 'fixtures', 'multi');
const multiTestPath = path.resolve(testDir, 'tests', 'fixtures', 'test', 'multi');

const MediaFileWithThumbnailSchema = MediaFileSchema.extend({
  thumbnail: ThumbnailSchema,
});

// Helper functions for gallery validation
function validateGalleryStructure(galleryPath: string, expectedImageCount: number, expectedSubGalleryCount: number = 0) {
  // Check that gallery.json exists
  const galleryJsonPath = path.resolve(galleryPath, 'gallery.json');
  expect(existsSync(galleryJsonPath)).toBe(true);

  // Read and parse gallery.json
  const galleryContent = readFileSync(galleryJsonPath, 'utf8');
  const galleryData = JSON.parse(galleryContent);

  // Validate with schema
  expect(() => GalleryDataSchema.parse(galleryData)).not.toThrow();
  const validatedData = GalleryDataSchema.parse(galleryData);

  // Check image count
  expect(validatedData.sections).toHaveLength(1);
  expect(validatedData.sections[0].images).toHaveLength(expectedImageCount);

  // Check subgallery count
  expect(validatedData.subGalleries.galleries).toHaveLength(expectedSubGalleryCount);

  return validatedData;
}

function validateThumbnails(galleryPath: string, expectedThumbnailCount: number) {
  // Check that thumbnails directory exists
  const thumbnailsPath = path.resolve(galleryPath, 'thumbnails');
  expect(existsSync(thumbnailsPath)).toBe(true);

  // Check thumbnail file count
  const thumbnailFiles = readdirSync(thumbnailsPath);
  expect(thumbnailFiles).toHaveLength(expectedThumbnailCount);

  // Read and validate gallery.json with thumbnails
  const galleryJsonPath = path.resolve(galleryPath, 'gallery.json');
  const galleryContent = readFileSync(galleryJsonPath, 'utf8');
  const galleryData = JSON.parse(galleryContent);
  const validatedData = GalleryDataSchema.parse(galleryData);

  // Validate all images have thumbnails
  for (const image of validatedData.sections[0].images) {
    expect(() => MediaFileWithThumbnailSchema.parse(image)).not.toThrow();
  }

  return validatedData;
}

function validateBuildOutput(testPath: string, galleryPath: string) {
  // Check that index.html exists
  const indexPath = path.resolve(testPath, 'index.html');
  expect(existsSync(indexPath)).toBe(true);

  // Check that gallery files still exist
  const galleryJsonPath = path.resolve(galleryPath, 'gallery.json');
  const galleryFiles = readdirSync(galleryPath);
  expect(galleryFiles).toContain('thumbnails');
  expect(galleryFiles).toContain('gallery.json');

  // Validate gallery.json is still valid
  const galleryContent = readFileSync(galleryJsonPath, 'utf8');
  const galleryData = JSON.parse(galleryContent);
  expect(() => GalleryDataSchema.parse(galleryData)).not.toThrow();
}

describe('Single-folder gallery', () => {
  beforeAll(() => {
    if (existsSync(singleTestPath)) {
      rmSync(singleTestPath, { recursive: true, force: true });
    }
    copySync(singleFixturePath, singleTestPath);
  });

  afterAll(() => {
    if (existsSync(singleTestPath)) {
      rmSync(singleTestPath, { recursive: true, force: true });
    }
  });

  describe('init command', () => {
    test('should create gallery.json with correct structure and content', () => {
      const galleryPath = path.resolve(singleTestPath, 'gallery');

      // Run init command
      execSync(`${tsxPath} ${cliPath} init --path ${singleTestPath}`);

      // Validate gallery structure
      validateGalleryStructure(galleryPath, 3, 0);
    });
  });

  describe('thumbnails command', () => {
    test('should create thumbnails for all images and update gallery.json', () => {
      const galleryPath = path.resolve(singleTestPath, 'gallery');

      // Run thumbnails command (init should have been run by previous test)
      execSync(`${tsxPath} ${cliPath} thumbnails --path ${singleTestPath}`);

      // Validate thumbnails using helper
      validateThumbnails(galleryPath, 3);
    });
  });

  describe('build command', () => {
    test('should create static HTML files and gallery assets', () => {
      const galleryPath = path.resolve(singleTestPath, 'gallery');

      // Run build command (init and thumbnails should have been run by previous tests)
      execSync(`${tsxPath} ${cliPath} build --path ${singleTestPath}`);

      // Validate build output using helper
      validateBuildOutput(singleTestPath, galleryPath);
    });
  });
});

describe('Multi-folder gallery', () => {
  beforeAll(() => {
    if (existsSync(multiTestPath)) {
      rmSync(multiTestPath, { recursive: true, force: true });
    }
    copySync(multiFixturePath, multiTestPath);
  });

  afterAll(() => {
    if (existsSync(multiTestPath)) {
      rmSync(multiTestPath, { recursive: true, force: true });
    }
  });

  describe('init command with recursive option', () => {
    test('should create gallery.json files with subgalleries for multi-folder structure', () => {
      // Run init command with recursive option
      execSync(`${tsxPath} ${cliPath} init --path ${multiTestPath} -r`);

      // Validate main gallery (3 root images + 2 subgalleries)
      const mainGalleryPath = path.resolve(multiTestPath, 'gallery');
      const mainValidatedData = validateGalleryStructure(mainGalleryPath, 3, 2);

      // Check subgalleries metadata
      expect(mainValidatedData.subGalleries.galleries).toHaveLength(2);
      const subGalleryTitles = mainValidatedData.subGalleries.galleries.map((sg) => sg.title);
      expect(subGalleryTitles).toContain('First');
      expect(subGalleryTitles).toContain('Second');

      // Validate first subgallery (2 images)
      const firstGalleryPath = path.resolve(multiTestPath, 'first', 'gallery');
      validateGalleryStructure(firstGalleryPath, 2, 0);

      // Validate second subgallery (2 images)
      const secondGalleryPath = path.resolve(multiTestPath, 'second', 'gallery');
      validateGalleryStructure(secondGalleryPath, 2, 0);
    });
  });

  describe('thumbnails command with recursive option', () => {
    test('should create thumbnails for all galleries recursively', () => {
      // Run thumbnails command with recursive option
      execSync(`${tsxPath} ${cliPath} thumbnails --path ${multiTestPath} -r`);

      // Validate thumbnails for main gallery
      const mainGalleryPath = path.resolve(multiTestPath, 'gallery');
      validateThumbnails(mainGalleryPath, 3);

      // Validate thumbnails for first subgallery
      const firstGalleryPath = path.resolve(multiTestPath, 'first', 'gallery');
      validateThumbnails(firstGalleryPath, 2);

      // Validate thumbnails for second subgallery
      const secondGalleryPath = path.resolve(multiTestPath, 'second', 'gallery');
      validateThumbnails(secondGalleryPath, 2);
    });
  });

  describe('build command with recursive option', () => {
    test('should build static files for all galleries recursively', () => {
      // Run build command with recursive option
      execSync(`${tsxPath} ${cliPath} build --path ${multiTestPath} -r`);

      // Validate build output for main gallery
      const mainGalleryPath = path.resolve(multiTestPath, 'gallery');
      validateBuildOutput(multiTestPath, mainGalleryPath);

      // Validate build output for subgalleries
      const firstGalleryPath = path.resolve(multiTestPath, 'first', 'gallery');
      const firstTestPath = path.resolve(multiTestPath, 'first');
      validateBuildOutput(firstTestPath, firstGalleryPath);

      const secondGalleryPath = path.resolve(multiTestPath, 'second', 'gallery');
      const secondTestPath = path.resolve(multiTestPath, 'second');
      validateBuildOutput(secondTestPath, secondGalleryPath);
    });
  });
});
