import { execSync } from 'node:child_process';
import { existsSync, rmSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { copySync } from 'fs-extra';

import { init } from '../src/modules/init';
import { GalleryDataSchema, MediaFileSchema, ThumbnailSchema } from '../src/types';

import type { ConsolaInstance } from 'consola';

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

// Helper functions for separate gallery directory validation
function validateSeparateGalleryStructure(photosPath: string, galleryPath: string, expectedImageCount: number) {
  // Check that gallery.json exists in the gallery directory
  const galleryJsonPath = path.resolve(galleryPath, 'gallery', 'gallery.json');
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

  // Verify all image paths are relative to gallery and point back to photos directory
  for (const image of validatedData.sections[0].images) {
    const absoluteImagePath = path.resolve(path.dirname(galleryJsonPath), image.path);
    const expectedImagePath = path.resolve(photosPath, path.basename(image.path));
    expect(absoluteImagePath).toBe(expectedImagePath);
    expect(existsSync(expectedImagePath)).toBe(true);
  }

  return validatedData;
}

function validateBaseUrlGallery(galleryPath: string, baseUrl: string, expectedImageCount: number) {
  // Check that gallery.json exists
  const galleryJsonPath = path.resolve(galleryPath, 'gallery', 'gallery.json');
  expect(existsSync(galleryJsonPath)).toBe(true);

  // Read and parse gallery.json
  const galleryContent = readFileSync(galleryJsonPath, 'utf8');
  const galleryData = JSON.parse(galleryContent);

  // Validate with schema
  expect(() => GalleryDataSchema.parse(galleryData)).not.toThrow();
  const validatedData = GalleryDataSchema.parse(galleryData);

  // Check that mediaBaseUrl is set (build process adds trailing slash)
  const expectedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  expect(validatedData.mediaBaseUrl).toBe(expectedBaseUrl);

  // Check image count
  expect(validatedData.sections).toHaveLength(1);
  expect(validatedData.sections[0].images).toHaveLength(expectedImageCount);

  // Verify photos were NOT copied to gallery directory - only thumbnails should exist
  const galleryDir = path.resolve(galleryPath, 'gallery');
  const galleryFiles = readdirSync(galleryDir);
  expect(galleryFiles).toContain('gallery.json');
  expect(galleryFiles).toContain('thumbnails');

  // Check that no image files were copied to gallery directory
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const copiedImages = galleryFiles.filter((file) => imageExtensions.some((ext) => file.toLowerCase().endsWith(ext)));
  expect(copiedImages).toHaveLength(0);

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
  // Check that index.html exists - for separate galleries, it's in the gallery's parent directory
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

function validateSeparateBuildOutput(galleryDir: string, galleryPath: string) {
  // For separate galleries, index.html is created in the gallery directory (galleryDir)
  const indexPath = path.resolve(galleryDir, 'index.html');
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

      // Run init command with default settings
      execSync(`${tsxPath} ${cliPath} init --photos ${singleTestPath} -d`);

      // Validate gallery structure
      validateGalleryStructure(galleryPath, 3, 0);
    });

    test('should create gallery.json with custom settings from user input', async () => {
      const galleryPath = path.resolve(singleTestPath, 'gallery');

      // Clean up if gallery already exists from previous test
      if (existsSync(galleryPath)) {
        rmSync(galleryPath, { recursive: true, force: true });
      }

      // Create a mock UI that provides predefined responses
      const mockUI = {
        info: jest.fn(),
        start: jest.fn(),
        success: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        box: jest.fn(),
        prompt: jest
          .fn()
          .mockResolvedValueOnce('My Custom Gallery') // title
          .mockResolvedValueOnce('Custom gallery description') // description
          .mockResolvedValueOnce('img_1.jpg') // headerImage
          .mockResolvedValueOnce('300'), // thumbnailSize
      };

      // Run init function directly with mock UI
      await init(
        {
          photos: singleTestPath,
          recursive: false,
          default: false,
        },
        mockUI as unknown as ConsolaInstance,
      );

      // Validate gallery structure
      const validatedData = validateGalleryStructure(galleryPath, 3, 0);

      // Verify custom settings were applied
      expect(validatedData.title).toBe('My Custom Gallery');
      expect(validatedData.description).toBe('Custom gallery description');
      expect(validatedData.headerImage).toBe('img_1.jpg');
    });
  });

  describe('thumbnails command', () => {
    test('should create thumbnails for all images and update gallery.json', () => {
      const galleryPath = path.resolve(singleTestPath, 'gallery');

      // Run thumbnails command (init should have been run by previous test)
      execSync(`${tsxPath} ${cliPath} thumbnails --gallery ${singleTestPath}`);

      // Validate thumbnails using helper
      validateThumbnails(galleryPath, 3);
    });
  });

  describe('build command', () => {
    test('should create static HTML files and gallery assets', () => {
      const galleryPath = path.resolve(singleTestPath, 'gallery');

      // Run build command (init and thumbnails should have been run by previous tests)
      execSync(`${tsxPath} ${cliPath} build --gallery ${singleTestPath}`);

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
      // Run init command with recursive option and default settings
      execSync(`${tsxPath} ${cliPath} init --photos ${multiTestPath} -r -d`);

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

    test('should create gallery.json files with custom settings in interactive mode', async () => {
      // Clean up any existing galleries
      const mainGalleryPath = path.resolve(multiTestPath, 'gallery');
      const firstGalleryPath = path.resolve(multiTestPath, 'first', 'gallery');
      const secondGalleryPath = path.resolve(multiTestPath, 'second', 'gallery');

      for (const galleryPath of [mainGalleryPath, firstGalleryPath, secondGalleryPath]) {
        if (existsSync(galleryPath)) {
          rmSync(galleryPath, { recursive: true, force: true });
        }
      }

      // Create a mock UI that provides predefined responses for each gallery
      // Main gallery, First subgallery, Second subgallery (4 prompts each)
      const mockUI = {
        info: jest.fn(),
        start: jest.fn(),
        success: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        box: jest.fn(),
        prompt: jest
          .fn()
          // First subgallery prompts (processed first)
          .mockResolvedValueOnce('First Sub Gallery') // title
          .mockResolvedValueOnce('First sub description') // description
          .mockResolvedValueOnce('img_4.jpg') // headerImage
          .mockResolvedValueOnce('250') // thumbnailSize
          // Second subgallery prompts (processed second)
          .mockResolvedValueOnce('Second Sub Gallery') // title
          .mockResolvedValueOnce('Second sub description') // description
          .mockResolvedValueOnce('img_6.jpg') // headerImage
          .mockResolvedValueOnce('250') // thumbnailSize
          // Main gallery prompts (processed last)
          .mockResolvedValueOnce('Multi Gallery Main') // title
          .mockResolvedValueOnce('Main gallery description') // description
          .mockResolvedValueOnce('img_1.jpg') // headerImage
          .mockResolvedValueOnce('250'), // thumbnailSize
      };

      // Run init function directly with mock UI and recursive option
      await init(
        {
          photos: multiTestPath,
          recursive: true,
          default: false,
        },
        mockUI as unknown as ConsolaInstance,
      );

      // Validate main gallery with custom settings
      const mainValidatedData = validateGalleryStructure(mainGalleryPath, 3, 2);
      expect(mainValidatedData.title).toBe('Multi Gallery Main');
      expect(mainValidatedData.description).toBe('Main gallery description');
      expect(mainValidatedData.headerImage).toBe('img_1.jpg');

      // Validate first subgallery with custom settings
      const firstValidatedData = validateGalleryStructure(firstGalleryPath, 2, 0);
      expect(firstValidatedData.title).toBe('First Sub Gallery');
      expect(firstValidatedData.description).toBe('First sub description');
      expect(firstValidatedData.headerImage).toBe('img_4.jpg');

      // Validate second subgallery with custom settings
      const secondValidatedData = validateGalleryStructure(secondGalleryPath, 2, 0);
      expect(secondValidatedData.title).toBe('Second Sub Gallery');
      expect(secondValidatedData.description).toBe('Second sub description');
      expect(secondValidatedData.headerImage).toBe('img_6.jpg');
    });
  });

  describe('thumbnails command with recursive option', () => {
    test('should create thumbnails for all galleries recursively', () => {
      // Run thumbnails command with recursive option
      execSync(`${tsxPath} ${cliPath} thumbnails --gallery ${multiTestPath} -r`);

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
      execSync(`${tsxPath} ${cliPath} build --gallery ${multiTestPath} -r`);

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

describe('Separate gallery directory', () => {
  const separatePhotosPath = path.resolve(testDir, 'tests', 'fixtures', 'test', 'separate-photos');
  const separateGalleryPath = path.resolve(testDir, 'tests', 'fixtures', 'test', 'separate-gallery');

  beforeAll(() => {
    // Clean up any existing test directories
    if (existsSync(separatePhotosPath)) {
      rmSync(separatePhotosPath, { recursive: true, force: true });
    }
    if (existsSync(separateGalleryPath)) {
      rmSync(separateGalleryPath, { recursive: true, force: true });
    }

    // Copy single fixture photos to separate photos directory
    copySync(singleFixturePath, separatePhotosPath);
  });

  afterAll(() => {
    // Clean up test directories
    if (existsSync(separatePhotosPath)) {
      rmSync(separatePhotosPath, { recursive: true, force: true });
    }
    if (existsSync(separateGalleryPath)) {
      rmSync(separateGalleryPath, { recursive: true, force: true });
    }
  });

  describe('init command with separate directories', () => {
    test('should create gallery in different folder with relative paths back to photos', () => {
      // Run init command with separate gallery directory and default settings
      execSync(`${tsxPath} ${cliPath} init --photos ${separatePhotosPath} --gallery ${separateGalleryPath} -d`);

      // Validate gallery structure with separate paths
      validateSeparateGalleryStructure(separatePhotosPath, separateGalleryPath, 3);
    });

    test('should create gallery in separate directory with custom settings from user input', async () => {
      // Clean up existing galleries first
      const tempSeparatePhotosPath = path.resolve(testDir, 'tests', 'fixtures', 'test', 'separate-photos-interactive');
      const tempSeparateGalleryPath = path.resolve(testDir, 'tests', 'fixtures', 'test', 'separate-gallery-interactive');

      for (const tempPath of [tempSeparatePhotosPath, tempSeparateGalleryPath]) {
        if (existsSync(tempPath)) {
          rmSync(tempPath, { recursive: true, force: true });
        }
      }

      // Copy single fixture photos to separate photos directory
      copySync(singleFixturePath, tempSeparatePhotosPath);

      // Create a mock UI that provides predefined responses
      const mockUI = {
        info: jest.fn(),
        start: jest.fn(),
        success: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        box: jest.fn(),
        prompt: jest
          .fn()
          .mockResolvedValueOnce('Separate Gallery Custom') // title
          .mockResolvedValueOnce('Custom separate gallery description') // description
          .mockResolvedValueOnce('img_2.jpg') // headerImage
          .mockResolvedValueOnce('180'), // thumbnailSize
      };

      // Run init function directly with mock UI and separate gallery directory
      await init(
        {
          photos: tempSeparatePhotosPath,
          gallery: tempSeparateGalleryPath,
          recursive: false,
          default: false,
        },
        mockUI as unknown as ConsolaInstance,
      );

      // Validate gallery structure with separate paths
      validateSeparateGalleryStructure(tempSeparatePhotosPath, tempSeparateGalleryPath, 3);

      // Read and validate custom settings
      const galleryJsonPath = path.resolve(tempSeparateGalleryPath, 'gallery', 'gallery.json');
      const galleryContent = readFileSync(galleryJsonPath, 'utf8');
      const galleryData = JSON.parse(galleryContent);

      expect(galleryData.title).toBe('Separate Gallery Custom');
      expect(galleryData.description).toBe('Custom separate gallery description');
      expect(galleryData.headerImage).toBe('img_2.jpg');

      // Clean up temporary directories
      for (const tempPath of [tempSeparatePhotosPath, tempSeparateGalleryPath]) {
        if (existsSync(tempPath)) {
          rmSync(tempPath, { recursive: true, force: true });
        }
      }
    });
  });

  describe('thumbnails command with separate directories', () => {
    test('should create thumbnails in gallery directory for photos in separate directory', () => {
      // Run thumbnails command (init should have been run by previous test)
      execSync(`${tsxPath} ${cliPath} thumbnails --gallery ${separateGalleryPath}`);

      // Validate thumbnails using helper
      const galleryPath = path.resolve(separateGalleryPath, 'gallery');
      validateThumbnails(galleryPath, 3);
    });
  });

  describe('build command with separate directories', () => {
    test('should create static HTML files and gallery assets', () => {
      // Ensure prerequisites are met (init and thumbnails should have been run by previous tests)
      // If running this test in isolation, run the prerequisites
      if (!existsSync(separateGalleryPath)) {
        execSync(`${tsxPath} ${cliPath} init --photos ${separatePhotosPath} --gallery ${separateGalleryPath} -d`);
      }

      const galleryPath = path.resolve(separateGalleryPath, 'gallery');
      if (!existsSync(path.resolve(galleryPath, 'thumbnails'))) {
        execSync(`${tsxPath} ${cliPath} thumbnails --gallery ${separateGalleryPath}`);
      }

      // Run build command (automatically answer 'y' to photo copy confirmation)
      execSync(`echo "y" | ${tsxPath} ${cliPath} build --gallery ${separateGalleryPath}`);

      // Validate build output using separate gallery helper
      validateSeparateBuildOutput(separateGalleryPath, galleryPath);
    });
  });
});

describe('Gallery with base URL (no photo copying)', () => {
  const baseUrlPhotosPath = path.resolve(testDir, 'tests', 'fixtures', 'test', 'baseurl-photos');
  const baseUrlGalleryPath = path.resolve(testDir, 'tests', 'fixtures', 'test', 'baseurl-gallery');
  const testBaseUrl = 'https://example.com/photos';

  beforeAll(() => {
    // Clean up any existing test directories
    if (existsSync(baseUrlPhotosPath)) {
      rmSync(baseUrlPhotosPath, { recursive: true, force: true });
    }
    if (existsSync(baseUrlGalleryPath)) {
      rmSync(baseUrlGalleryPath, { recursive: true, force: true });
    }

    // Copy single fixture photos to base URL photos directory
    copySync(singleFixturePath, baseUrlPhotosPath);
  });

  afterAll(() => {
    // Clean up test directories
    if (existsSync(baseUrlPhotosPath)) {
      rmSync(baseUrlPhotosPath, { recursive: true, force: true });
    }
    if (existsSync(baseUrlGalleryPath)) {
      rmSync(baseUrlGalleryPath, { recursive: true, force: true });
    }
  });

  describe('init command with base URL setup', () => {
    test('should create gallery in separate directory', () => {
      // Run init command with separate gallery directory and default settings (same as separate gallery test)
      execSync(`${tsxPath} ${cliPath} init --photos ${baseUrlPhotosPath} --gallery ${baseUrlGalleryPath} -d`);

      // Validate gallery structure with separate paths
      validateSeparateGalleryStructure(baseUrlPhotosPath, baseUrlGalleryPath, 3);
    });
  });

  describe('thumbnails command with base URL setup', () => {
    test('should create thumbnails in gallery directory', () => {
      // Run thumbnails command (init should have been run by previous test)
      execSync(`${tsxPath} ${cliPath} thumbnails --gallery ${baseUrlGalleryPath}`);

      // Validate thumbnails using helper
      const galleryPath = path.resolve(baseUrlGalleryPath, 'gallery');
      validateThumbnails(galleryPath, 3);
    });
  });

  describe('build command with base URL', () => {
    test('should set mediaBaseUrl and not copy photos to gallery directory', () => {
      // Run build command with base URL
      execSync(`${tsxPath} ${cliPath} build --gallery ${baseUrlGalleryPath} --base-url ${testBaseUrl}`);

      // Validate that mediaBaseUrl is set and photos are not copied
      validateBaseUrlGallery(baseUrlGalleryPath, testBaseUrl, 3);

      // Also validate basic build output structure using separate gallery helper
      const galleryPath = path.resolve(baseUrlGalleryPath, 'gallery');
      validateSeparateBuildOutput(baseUrlGalleryPath, galleryPath);
    });
  });
});
