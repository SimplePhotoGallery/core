import { execSync } from 'node:child_process';
import { existsSync, rmSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { GalleryDataSchema, MediaFileSchema, ThumbnailSchema } from '@simple-photo-gallery/common/src/gallery';
import { copySync } from 'fs-extra';

import { init } from '../src/modules/init';

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

  // For same-folder galleries, mediaBasePath should NOT be set
  expect(validatedData.mediaBasePath).toBeUndefined();

  // Verify all images have filename property and files exist (one folder up from gallery.json)
  const photosPath = path.dirname(galleryPath);
  for (const image of validatedData.sections[0].images) {
    expect(image.filename).toBeDefined();
    const expectedImagePath = path.resolve(photosPath, image.filename);
    expect(existsSync(expectedImagePath)).toBe(true);
  }

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

  // For separate galleries, mediaBasePath should be set to the absolute photos path
  expect(validatedData.mediaBasePath).toBeDefined();
  expect(path.isAbsolute(validatedData.mediaBasePath!)).toBe(true);
  expect(validatedData.mediaBasePath).toBe(photosPath);

  // Verify all images have filename property and files exist
  for (const image of validatedData.sections[0].images) {
    expect(image.filename).toBeDefined();
    const expectedImagePath = path.resolve(validatedData.mediaBasePath!, image.filename);
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

  // Check that mediaBaseUrl is set
  expect(validatedData.mediaBaseUrl).toBe(baseUrl);

  // Check image count
  expect(validatedData.sections).toHaveLength(1);
  expect(validatedData.sections[0].images).toHaveLength(expectedImageCount);

  // Verify photos were NOT copied to gallery directory - only thumbnails should exist
  const galleryDir = path.resolve(galleryPath, 'gallery');
  const galleryFiles = readdirSync(galleryDir);
  expect(galleryFiles).toContain('gallery.json');
  expect(galleryFiles).toContain('images');

  // Check that no image files were copied to gallery directory
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const copiedImages = galleryFiles.filter((file) => imageExtensions.some((ext) => file.toLowerCase().endsWith(ext)));
  expect(copiedImages).toHaveLength(0);

  return validatedData;
}

function validateThumbnails(galleryPath: string, expectedThumbnailCount: number) {
  // Check that thumbnails directory exists
  const thumbnailsPath = path.resolve(galleryPath, 'images');
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
  expect(galleryFiles).toContain('images');
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
  expect(galleryFiles).toContain('images');
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
          .mockResolvedValueOnce('https://www.mygallery.com') // url
          .mockResolvedValueOnce('img_1.jpg'), // headerImage
      };

      // Run init function directly with mock UI
      await init(
        {
          photos: singleTestPath,
          recursive: false,
          default: false,
          force: false,
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

      // Validate thumbnails using helper (expecting 6: 3 regular + 3 retina @2x)
      validateThumbnails(galleryPath, 6);
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
          .mockResolvedValueOnce('') // url
          .mockResolvedValueOnce('img_4.jpg') // headerImage
          // Second subgallery prompts (processed second)
          .mockResolvedValueOnce('Second Sub Gallery') // title
          .mockResolvedValueOnce('Second sub description') // description
          .mockResolvedValueOnce('') // url
          .mockResolvedValueOnce('img_6.jpg') // headerImage
          // Main gallery prompts (processed last)
          .mockResolvedValueOnce('Multi Gallery Main') // title
          .mockResolvedValueOnce('Main gallery description') // description
          .mockResolvedValueOnce('') // url
          .mockResolvedValueOnce('img_1.jpg'), // headerImage
      };

      // Run init function directly with mock UI and recursive option
      await init(
        {
          photos: multiTestPath,
          recursive: true,
          default: false,
          force: false,
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

      // Validate thumbnails for main gallery (expecting 6: 3 regular + 3 retina @2x)
      const mainGalleryPath = path.resolve(multiTestPath, 'gallery');
      validateThumbnails(mainGalleryPath, 6);

      // Validate thumbnails for first subgallery (expecting 4: 2 regular + 2 retina @2x)
      const firstGalleryPath = path.resolve(multiTestPath, 'first', 'gallery');
      validateThumbnails(firstGalleryPath, 4);

      // Validate thumbnails for second subgallery (expecting 4: 2 regular + 2 retina @2x)
      const secondGalleryPath = path.resolve(multiTestPath, 'second', 'gallery');
      validateThumbnails(secondGalleryPath, 4);
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
          .mockResolvedValueOnce('') // url
          .mockResolvedValueOnce('img_2.jpg'), // headerImage
      };

      // Run init function directly with mock UI and separate gallery directory
      await init(
        {
          photos: tempSeparatePhotosPath,
          gallery: tempSeparateGalleryPath,
          recursive: false,
          default: false,
          force: false,
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

      // Validate thumbnails using helper (expecting 6: 3 regular + 3 retina @2x)
      const galleryPath = path.resolve(separateGalleryPath, 'gallery');
      validateThumbnails(galleryPath, 6);
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
      if (!existsSync(path.resolve(galleryPath, 'images'))) {
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

      // Validate thumbnails using helper (expecting 6: 3 regular + 3 retina @2x)
      const galleryPath = path.resolve(baseUrlGalleryPath, 'gallery');
      validateThumbnails(galleryPath, 6);
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

describe('Header image change detection', () => {
  const headerChangeTestPath = path.resolve(testDir, 'tests', 'fixtures', 'test', 'header-change');

  beforeAll(() => {
    // Clean up any existing test directories
    if (existsSync(headerChangeTestPath)) {
      rmSync(headerChangeTestPath, { recursive: true, force: true });
    }

    // Copy single fixture photos to test directory
    copySync(singleFixturePath, headerChangeTestPath);
  });

  afterAll(() => {
    // Clean up test directories
    if (existsSync(headerChangeTestPath)) {
      rmSync(headerChangeTestPath, { recursive: true, force: true });
    }
  });

  test('should generate header images with filename in the name', () => {
    // Initialize gallery with default settings (img_1.jpg as header)
    execSync(`${tsxPath} ${cliPath} init --photos ${headerChangeTestPath} -d`);
    execSync(`${tsxPath} ${cliPath} thumbnails --gallery ${headerChangeTestPath}`);
    execSync(`${tsxPath} ${cliPath} build --gallery ${headerChangeTestPath}`);

    const imagesPath = path.resolve(headerChangeTestPath, 'gallery', 'images');
    const files = readdirSync(imagesPath);

    // Check that header images include the filename (img_1)
    expect(files).toContain('img_1_landscape_640.avif');
    expect(files).toContain('img_1_landscape_640.jpg');
    expect(files).toContain('img_1_portrait_360.avif');
    expect(files).toContain('img_1_portrait_360.jpg');

    // Verify gallery.json has headerImage set
    const galleryJsonPath = path.resolve(headerChangeTestPath, 'gallery', 'gallery.json');
    const galleryData = JSON.parse(readFileSync(galleryJsonPath, 'utf8'));
    expect(galleryData.headerImage).toBe('img_1.jpg');
  });

  test('should detect header image change and regenerate assets', () => {
    const galleryJsonPath = path.resolve(headerChangeTestPath, 'gallery', 'gallery.json');
    const imagesPath = path.resolve(headerChangeTestPath, 'gallery', 'images');

    // Get the list of files before changing header
    const filesBefore = readdirSync(imagesPath);

    // Change header image in gallery.json
    const galleryData = JSON.parse(readFileSync(galleryJsonPath, 'utf8'));
    galleryData.headerImage = 'img_2.jpg';
    writeFileSync(galleryJsonPath, JSON.stringify(galleryData, null, 2));

    // Rebuild gallery
    execSync(`${tsxPath} ${cliPath} build --gallery ${headerChangeTestPath}`);

    // Get the list of files after changing header
    const filesAfter = readdirSync(imagesPath);

    // Old img_1 header images should be deleted
    expect(filesAfter).not.toContain('img_1_landscape_640.avif');
    expect(filesAfter).not.toContain('img_1_landscape_640.jpg');
    expect(filesAfter).not.toContain('img_1_portrait_360.avif');
    expect(filesAfter).not.toContain('img_1_portrait_360.jpg');

    // New img_2 header images should exist
    expect(filesAfter).toContain('img_2_landscape_640.avif');
    expect(filesAfter).toContain('img_2_landscape_640.jpg');
    expect(filesAfter).toContain('img_2_portrait_360.avif');
    expect(filesAfter).toContain('img_2_portrait_360.jpg');

    // Verify gallery.json still has the correct headerImage
    const updatedGalleryData = JSON.parse(readFileSync(galleryJsonPath, 'utf8'));
    expect(updatedGalleryData.headerImage).toBe('img_2.jpg');

    // Social media card should also be regenerated
    expect(filesAfter).toContain('social-media-card.jpg');
  });

  test('should generate all header image sizes', () => {
    const imagesPath = path.resolve(headerChangeTestPath, 'gallery', 'images');
    const files = readdirSync(imagesPath);

    // Check all landscape sizes
    const landscapeSizes = [640, 960, 1280, 1920, 2560, 3840];
    for (const size of landscapeSizes) {
      expect(files).toContain(`img_2_landscape_${size}.avif`);
      expect(files).toContain(`img_2_landscape_${size}.jpg`);
    }

    // Check all portrait sizes
    const portraitSizes = [360, 480, 720, 1080];
    for (const size of portraitSizes) {
      expect(files).toContain(`img_2_portrait_${size}.avif`);
      expect(files).toContain(`img_2_portrait_${size}.jpg`);
    }
  });
});

describe('Clean command', () => {
  const cleanTestPath = path.resolve(testDir, 'tests', 'fixtures', 'test', 'clean');
  const cleanMultiTestPath = path.resolve(testDir, 'tests', 'fixtures', 'test', 'clean-multi');

  beforeAll(() => {
    // Clean up any existing test directories
    if (existsSync(cleanTestPath)) {
      rmSync(cleanTestPath, { recursive: true, force: true });
    }
    if (existsSync(cleanMultiTestPath)) {
      rmSync(cleanMultiTestPath, { recursive: true, force: true });
    }
  });

  afterAll(() => {
    // Clean up test directories
    if (existsSync(cleanTestPath)) {
      rmSync(cleanTestPath, { recursive: true, force: true });
    }
    if (existsSync(cleanMultiTestPath)) {
      rmSync(cleanMultiTestPath, { recursive: true, force: true });
    }
  });

  describe('single gallery clean', () => {
    test('should remove index.html and gallery directory while preserving photos', () => {
      // Copy fixture and initialize gallery
      copySync(singleFixturePath, cleanTestPath);
      execSync(`${tsxPath} ${cliPath} init --photos ${cleanTestPath} -d`);

      // Create an index.html file to simulate build output
      const indexPath = path.resolve(cleanTestPath, 'index.html');
      const galleryPath = path.resolve(cleanTestPath, 'gallery');

      // Verify initial state - photos exist and gallery exists
      const photoCount = readdirSync(cleanTestPath).filter((file) => file.endsWith('.jpg')).length;
      expect(photoCount).toBe(3);
      expect(existsSync(galleryPath)).toBe(true);

      writeFileSync(indexPath, '<html><body>Test Gallery</body></html>');
      expect(existsSync(indexPath)).toBe(true);

      // Run clean command
      execSync(`${tsxPath} ${cliPath} clean --gallery ${cleanTestPath}`);

      // Verify gallery files are removed
      expect(existsSync(indexPath)).toBe(false);
      expect(existsSync(galleryPath)).toBe(false);

      // Verify photos are still there
      const photoFiles = readdirSync(cleanTestPath).filter((file) => file.endsWith('.jpg'));
      expect(photoFiles.length).toBe(3);
    });

    test('should handle cleaning when no gallery files exist', () => {
      // Clean up from previous test and copy fresh fixture
      if (existsSync(cleanTestPath)) {
        rmSync(cleanTestPath, { recursive: true, force: true });
      }
      copySync(singleFixturePath, cleanTestPath);

      // Run clean command without initializing gallery first
      execSync(`${tsxPath} ${cliPath} clean --gallery ${cleanTestPath}`);

      // Should complete without errors and photos should still be there
      const photoFiles = readdirSync(cleanTestPath).filter((file) => file.endsWith('.jpg'));
      expect(photoFiles.length).toBe(3);
    });
  });

  describe('multi-gallery recursive clean', () => {
    test('should clean all galleries recursively when -r flag is used', () => {
      // Copy fixture and initialize galleries
      copySync(multiFixturePath, cleanMultiTestPath);
      execSync(`${tsxPath} ${cliPath} init --photos ${cleanMultiTestPath} -r -d`);

      // Create index.html files in all directories
      writeFileSync(path.resolve(cleanMultiTestPath, 'index.html'), '<html>Main</html>');
      writeFileSync(path.resolve(cleanMultiTestPath, 'first', 'index.html'), '<html>First</html>');
      writeFileSync(path.resolve(cleanMultiTestPath, 'second', 'index.html'), '<html>Second</html>');

      // Verify initial state
      expect(existsSync(path.resolve(cleanMultiTestPath, 'gallery'))).toBe(true);
      expect(existsSync(path.resolve(cleanMultiTestPath, 'first', 'gallery'))).toBe(true);
      expect(existsSync(path.resolve(cleanMultiTestPath, 'second', 'gallery'))).toBe(true);

      // Run recursive clean
      execSync(`${tsxPath} ${cliPath} clean --gallery ${cleanMultiTestPath} -r`);

      // Verify all gallery files and directories are removed
      expect(existsSync(path.resolve(cleanMultiTestPath, 'index.html'))).toBe(false);
      expect(existsSync(path.resolve(cleanMultiTestPath, 'gallery'))).toBe(false);
      expect(existsSync(path.resolve(cleanMultiTestPath, 'first', 'index.html'))).toBe(false);
      expect(existsSync(path.resolve(cleanMultiTestPath, 'first', 'gallery'))).toBe(false);
      expect(existsSync(path.resolve(cleanMultiTestPath, 'second', 'index.html'))).toBe(false);
      expect(existsSync(path.resolve(cleanMultiTestPath, 'second', 'gallery'))).toBe(false);

      // Verify photos are still there
      const rootPhotos = readdirSync(cleanMultiTestPath).filter((file) => file.endsWith('.jpg'));
      const firstPhotos = readdirSync(path.resolve(cleanMultiTestPath, 'first')).filter((file) => file.endsWith('.jpg'));
      const secondPhotos = readdirSync(path.resolve(cleanMultiTestPath, 'second')).filter((file) => file.endsWith('.jpg'));

      expect(rootPhotos.length).toBe(3);
      expect(firstPhotos.length).toBe(2);
      expect(secondPhotos.length).toBe(2);
    });

    test('should clean only root gallery when -r flag is not used', () => {
      // Clean up from previous test and setup fresh
      if (existsSync(cleanMultiTestPath)) {
        rmSync(cleanMultiTestPath, { recursive: true, force: true });
      }
      copySync(multiFixturePath, cleanMultiTestPath);
      execSync(`${tsxPath} ${cliPath} init --photos ${cleanMultiTestPath} -r -d`);

      // Create index.html files in all directories
      writeFileSync(path.resolve(cleanMultiTestPath, 'index.html'), '<html>Main</html>');
      writeFileSync(path.resolve(cleanMultiTestPath, 'first', 'index.html'), '<html>First</html>');
      writeFileSync(path.resolve(cleanMultiTestPath, 'second', 'index.html'), '<html>Second</html>');

      // Run non-recursive clean
      execSync(`${tsxPath} ${cliPath} clean --gallery ${cleanMultiTestPath}`);

      // Verify only root gallery is cleaned
      expect(existsSync(path.resolve(cleanMultiTestPath, 'index.html'))).toBe(false);
      expect(existsSync(path.resolve(cleanMultiTestPath, 'gallery'))).toBe(false);

      // Verify subdirectory galleries remain
      expect(existsSync(path.resolve(cleanMultiTestPath, 'first', 'index.html'))).toBe(true);
      expect(existsSync(path.resolve(cleanMultiTestPath, 'first', 'gallery'))).toBe(true);
      expect(existsSync(path.resolve(cleanMultiTestPath, 'second', 'index.html'))).toBe(true);
      expect(existsSync(path.resolve(cleanMultiTestPath, 'second', 'gallery'))).toBe(true);
    });
  });
});
