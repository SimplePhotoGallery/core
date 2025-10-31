import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { GalleryDataSchema } from '@simple-photo-gallery/common';
import { copySync } from 'fs-extra';

import { parseGalleryJson, migrateGalleryJson } from '../src/utils/gallery';

import type { GalleryDataDeprecated } from '@simple-photo-gallery/common';
import type { ConsolaInstance } from 'consola';

const testDir = process.cwd();
const migrationTestPath = path.resolve(testDir, 'tests', 'fixtures', 'test', 'migration');
const singleFixturePath = path.resolve(testDir, 'tests', 'fixtures', 'single');

// Mock console UI for testing
const createMockUI = (): ConsolaInstance =>
  ({
    info: jest.fn(),
    start: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    box: jest.fn(),
    prompt: jest.fn(),
    warn: jest.fn(),
    log: jest.fn(),
    trace: jest.fn(),
    fatal: jest.fn(),
    ready: jest.fn(),
    fail: jest.fn(),
    level: 3,
    silent: jest.fn(),
    verbose: jest.fn(),
    create: jest.fn(),
    withDefaults: jest.fn(),
    withTag: jest.fn(),
    wrapAll: jest.fn(),
    wrapConsole: jest.fn(),
    restoreAll: jest.fn(),
    restoreConsole: jest.fn(),
    mockTypes: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    _prompt: jest.fn(),
    addReporter: jest.fn(),
    removeReporter: jest.fn(),
    setReporters: jest.fn(),
    options: {},
  }) as unknown as ConsolaInstance;

// Helper to create old-format gallery.json
function createDeprecatedGalleryJson(
  galleryPath: string,
  options: {
    imagePathPrefix?: string;
    imageCount?: number;
    useNestedPath?: boolean;
  } = {},
): void {
  const { imagePathPrefix = '..', imageCount = 3, useNestedPath = false } = options;

  // Build image paths based on options
  const getImagePath = (filename: string) => {
    if (useNestedPath) {
      return path.join('..', 'photos', filename);
    }
    return path.join(imagePathPrefix, filename);
  };

  const deprecatedGalleryData = {
    title: 'Test Gallery',
    description: 'Test gallery description',
    headerImage: getImagePath('img_1.jpg'),
    metadata: {
      image: '/gallery/images/social-media-card.jpg',
    },
    sections: [
      {
        images: Array.from({ length: imageCount }, (_, i) => ({
          type: 'image' as const,
          path: getImagePath(`img_${i + 1}.jpg`),
          alt: `Image ${i + 1}`,
          width: 1920,
          height: 1080,
        })),
      },
    ],
    subGalleries: {
      title: 'Sub Galleries',
      galleries: [],
    },
  };

  // Ensure directory exists
  if (!existsSync(galleryPath)) {
    mkdirSync(galleryPath, { recursive: true });
  }

  // Write deprecated format
  const galleryJsonPath = path.resolve(galleryPath, 'gallery.json');
  writeFileSync(galleryJsonPath, JSON.stringify(deprecatedGalleryData, null, 2));
}

// Helper to validate migration results
function validateMigration(
  galleryJsonPath: string,
  options: {
    expectedImageCount: number;
    shouldHaveMediaBasePath: boolean;
    expectedMediaBasePath?: string;
  },
) {
  // Check that backup was created
  const backupPath = `${galleryJsonPath}.old`;
  expect(existsSync(backupPath)).toBe(true);

  // Read and parse the backup to ensure it's the old format
  const backupContent = readFileSync(backupPath, 'utf8');
  const backupData = JSON.parse(backupContent);
  expect(backupData.sections[0].images[0]).toHaveProperty('path');
  expect(backupData.sections[0].images[0]).not.toHaveProperty('filename');

  // Read and parse the migrated gallery.json
  const galleryContent = readFileSync(galleryJsonPath, 'utf8');
  const galleryData = JSON.parse(galleryContent);

  // Validate with new schema
  expect(() => GalleryDataSchema.parse(galleryData)).not.toThrow();
  const validatedData = GalleryDataSchema.parse(galleryData);

  // Check image count
  expect(validatedData.sections[0].images).toHaveLength(options.expectedImageCount);

  // Check that all images have filename
  for (const image of validatedData.sections[0].images) {
    expect(image).toHaveProperty('filename');
    expect(image.filename).toBeDefined();
    // Filenames should not contain directory separators (only the filename)
    expect(path.basename(image.filename)).toBe(image.filename);
  }

  // Check mediaBasePath
  if (options.shouldHaveMediaBasePath) {
    expect(validatedData.mediaBasePath).toBeDefined();
    if (options.expectedMediaBasePath) {
      expect(validatedData.mediaBasePath).toBe(options.expectedMediaBasePath);
    }
  } else {
    expect(validatedData.mediaBasePath).toBeUndefined();
  }

  return validatedData;
}

describe('Gallery JSON Migration', () => {
  beforeAll(() => {
    if (existsSync(migrationTestPath)) {
      rmSync(migrationTestPath, { recursive: true, force: true });
    }
    mkdirSync(migrationTestPath, { recursive: true });
  });

  afterAll(() => {
    if (existsSync(migrationTestPath)) {
      rmSync(migrationTestPath, { recursive: true, force: true });
    }
  });

  describe('parseGalleryJson', () => {
    test('should parse and migrate gallery.json with deprecated schema (same folder)', () => {
      const testPath = path.resolve(migrationTestPath, 'same-folder');
      const galleryPath = path.resolve(testPath, 'gallery');

      // Create test directory structure and copy photos
      mkdirSync(testPath, { recursive: true });
      copySync(singleFixturePath, testPath);

      // Create deprecated gallery.json
      createDeprecatedGalleryJson(galleryPath, {
        imagePathPrefix: '..',
        imageCount: 3,
      });

      // Parse gallery.json (should trigger migration)
      const mockUI = createMockUI();
      const galleryJsonPath = path.resolve(galleryPath, 'gallery.json');
      const galleryData = parseGalleryJson(galleryJsonPath, mockUI);

      // Validate migration
      validateMigration(galleryJsonPath, {
        expectedImageCount: 3,
        shouldHaveMediaBasePath: false,
      });

      // Verify returned data matches new schema
      expect(galleryData.sections[0].images[0]).toHaveProperty('filename');
      expect(galleryData.sections[0].images[0].filename).toBeDefined();

      // Verify headerImage was also migrated (should be just filename, not path)
      expect(galleryData.headerImage).toBe('img_1.jpg');
      expect(galleryData.headerImage).not.toContain('/');
      expect(galleryData.headerImage).not.toContain(path.sep);

      // Verify UI messages were called
      expect(mockUI.start).toHaveBeenCalledWith(expect.stringContaining('Old gallery.json format detected'));
      expect(mockUI.success).toHaveBeenCalledWith(expect.stringContaining('migrated'));
    });

    test('should parse and migrate gallery.json with nested paths (separate folder)', () => {
      const testPath = path.resolve(migrationTestPath, 'separate-folder');
      const photosPath = path.resolve(testPath, 'photos');
      const galleryPath = path.resolve(testPath, 'gallery-output', 'gallery');

      // Create test directory structure
      mkdirSync(photosPath, { recursive: true });
      mkdirSync(galleryPath, { recursive: true });
      copySync(singleFixturePath, photosPath);

      // Create deprecated gallery.json with nested paths
      createDeprecatedGalleryJson(galleryPath, {
        imageCount: 3,
        useNestedPath: true,
      });

      // Parse gallery.json (should trigger migration)
      const mockUI = createMockUI();
      const galleryJsonPath = path.resolve(galleryPath, 'gallery.json');
      const galleryData = parseGalleryJson(galleryJsonPath, mockUI);

      // The mediaBasePath should be calculated based on the path in the gallery.json
      // which is "../photos/img_1.jpg" relative to the gallery directory
      const expectedMediaBasePath = path.resolve(galleryPath, '..', 'photos');

      // Validate migration with mediaBasePath
      validateMigration(galleryJsonPath, {
        expectedImageCount: 3,
        shouldHaveMediaBasePath: true,
        expectedMediaBasePath: expectedMediaBasePath,
      });

      // Verify mediaBasePath is absolute
      expect(path.isAbsolute(galleryData.mediaBasePath!)).toBe(true);

      // Verify headerImage was also migrated
      expect(galleryData.headerImage).toBe('img_1.jpg');
      expect(path.basename(galleryData.headerImage)).toBe(galleryData.headerImage);
    });

    test('should parse already migrated gallery.json without re-migrating', () => {
      const testPath = path.resolve(migrationTestPath, 'already-migrated');
      const galleryPath = path.resolve(testPath, 'gallery');

      // Create test directory structure and copy photos
      mkdirSync(testPath, { recursive: true });
      copySync(singleFixturePath, testPath);

      // Create new-format gallery.json
      const newFormatData = {
        title: 'Test Gallery',
        description: 'Test description',
        headerImage: 'img_1.jpg',
        metadata: {},
        sections: [
          {
            images: [
              {
                type: 'image',
                filename: 'img_1.jpg',
                width: 1920,
                height: 1080,
              },
            ],
          },
        ],
        subGalleries: {
          title: 'Sub Galleries',
          galleries: [],
        },
      };

      mkdirSync(galleryPath, { recursive: true });
      const galleryJsonPath = path.resolve(galleryPath, 'gallery.json');
      writeFileSync(galleryJsonPath, JSON.stringify(newFormatData, null, 2));

      // Parse gallery.json (should NOT trigger migration)
      const mockUI = createMockUI();
      const galleryData = parseGalleryJson(galleryJsonPath, mockUI);

      // Verify no backup was created
      expect(existsSync(`${galleryJsonPath}.old`)).toBe(false);

      // Verify no migration messages
      expect(mockUI.start).not.toHaveBeenCalledWith(expect.stringContaining('Old gallery.json format detected'));

      // Verify data is valid
      expect(galleryData.sections[0].images[0]).toHaveProperty('filename');
    });

    test('should throw error when gallery.json file not found', () => {
      const mockUI = createMockUI();
      const nonExistentPath = path.resolve(migrationTestPath, 'non-existent', 'gallery.json');

      expect(() => parseGalleryJson(nonExistentPath, mockUI)).toThrow();
      expect(mockUI.error).toHaveBeenCalledWith(expect.stringContaining('file not found'));
    });

    test('should throw error when gallery.json contains invalid JSON', () => {
      const testPath = path.resolve(migrationTestPath, 'invalid-json');
      const galleryPath = path.resolve(testPath, 'gallery');

      mkdirSync(galleryPath, { recursive: true });
      const galleryJsonPath = path.resolve(galleryPath, 'gallery.json');
      writeFileSync(galleryJsonPath, '{ invalid json }');

      const mockUI = createMockUI();

      expect(() => parseGalleryJson(galleryJsonPath, mockUI)).toThrow();
      expect(mockUI.error).toHaveBeenCalledWith(expect.stringContaining('invalid JSON'));
    });

    test('should throw error when gallery.json has invalid schema', () => {
      const testPath = path.resolve(migrationTestPath, 'invalid-schema');
      const galleryPath = path.resolve(testPath, 'gallery');

      mkdirSync(galleryPath, { recursive: true });
      const galleryJsonPath = path.resolve(galleryPath, 'gallery.json');

      // Write invalid data (missing required fields)
      writeFileSync(galleryJsonPath, JSON.stringify({ title: 'Only Title' }, null, 2));

      const mockUI = createMockUI();

      expect(() => parseGalleryJson(galleryJsonPath, mockUI)).toThrow();
      expect(mockUI.error).toHaveBeenCalledWith(expect.stringContaining('invalid gallery data'));
    });
  });

  describe('migrateGalleryJson', () => {
    test('should correctly transform path to filename', () => {
      const testPath = path.resolve(migrationTestPath, 'transform-filename');
      const galleryPath = path.resolve(testPath, 'gallery');

      mkdirSync(galleryPath, { recursive: true });

      const deprecatedData: GalleryDataDeprecated = {
        title: 'Test',
        description: 'Test',
        headerImage: '../test.jpg',
        metadata: {},
        sections: [
          {
            images: [
              {
                type: 'image',
                path: '../image-1.jpg',
                width: 1920,
                height: 1080,
              },
              {
                type: 'image',
                path: '../subfolder/image-2.jpg',
                width: 1920,
                height: 1080,
              },
            ],
          },
        ],
        subGalleries: {
          title: 'Sub Galleries',
          galleries: [],
        },
      };

      const mockUI = createMockUI();
      const galleryJsonPath = path.resolve(galleryPath, 'gallery.json');

      // Write the deprecated data first so the migration can backup it
      writeFileSync(galleryJsonPath, JSON.stringify(deprecatedData, null, 2));

      const migratedData = migrateGalleryJson(deprecatedData, galleryJsonPath, mockUI);

      // Check that filenames are extracted correctly
      expect(migratedData.sections[0].images[0].filename).toBe('image-1.jpg');
      expect(migratedData.sections[0].images[1].filename).toBe('image-2.jpg');

      // Verify backup was created
      expect(existsSync(`${galleryJsonPath}.old`)).toBe(true);
    });

    test('should migrate headerImage path to filename', () => {
      const testPath = path.resolve(migrationTestPath, 'header-image-migration');
      const galleryPath = path.resolve(testPath, 'gallery');

      mkdirSync(galleryPath, { recursive: true });

      const deprecatedData: GalleryDataDeprecated = {
        title: 'Test',
        description: 'Test',
        headerImage: '../header-image.jpg',
        metadata: {},
        sections: [
          {
            images: [
              {
                type: 'image',
                path: '../image-1.jpg',
                width: 1920,
                height: 1080,
              },
            ],
          },
        ],
        subGalleries: {
          title: 'Sub Galleries',
          galleries: [],
        },
      };

      const mockUI = createMockUI();
      const galleryJsonPath = path.resolve(galleryPath, 'gallery.json');

      // Write the deprecated data first so the migration can backup it
      writeFileSync(galleryJsonPath, JSON.stringify(deprecatedData, null, 2));

      const migratedData = migrateGalleryJson(deprecatedData, galleryJsonPath, mockUI);

      // Verify headerImage is transformed to just the filename
      expect(migratedData.headerImage).toBe('header-image.jpg');
      expect(migratedData.headerImage).not.toContain('/');
      expect(migratedData.headerImage).not.toContain(path.sep);
    });

    test('should migrate headerImage with nested path to filename', () => {
      const testPath = path.resolve(migrationTestPath, 'header-nested-path');
      const galleryPath = path.resolve(testPath, 'gallery');

      mkdirSync(galleryPath, { recursive: true });

      const deprecatedData: GalleryDataDeprecated = {
        title: 'Test',
        description: 'Test',
        headerImage: path.join('..', 'photos', 'subfolder', 'header-image.jpg'),
        metadata: {},
        sections: [
          {
            images: [
              {
                type: 'image',
                path: path.join('..', 'photos', 'image-1.jpg'),
                width: 1920,
                height: 1080,
              },
            ],
          },
        ],
        subGalleries: {
          title: 'Sub Galleries',
          galleries: [],
        },
      };

      const mockUI = createMockUI();
      const galleryJsonPath = path.resolve(galleryPath, 'gallery.json');

      // Write the deprecated data first so the migration can backup it
      writeFileSync(galleryJsonPath, JSON.stringify(deprecatedData, null, 2));

      const migratedData = migrateGalleryJson(deprecatedData, galleryJsonPath, mockUI);

      // Verify headerImage is transformed to just the filename (no path components)
      expect(migratedData.headerImage).toBe('header-image.jpg');
      expect(path.basename(migratedData.headerImage)).toBe(migratedData.headerImage);
    });

    test('should set mediaBasePath for nested photo paths', () => {
      const testPath = path.resolve(migrationTestPath, 'nested-paths');
      const photosPath = path.resolve(testPath, 'photos');
      const galleryPath = path.resolve(testPath, 'gallery-dir', 'gallery');

      mkdirSync(photosPath, { recursive: true });
      mkdirSync(galleryPath, { recursive: true });

      const deprecatedData: GalleryDataDeprecated = {
        title: 'Test',
        description: 'Test',
        headerImage: path.join('..', 'photos', 'test.jpg'),
        metadata: {},
        sections: [
          {
            images: [
              {
                type: 'image',
                path: path.join('..', 'photos', 'image.jpg'),
                width: 1920,
                height: 1080,
              },
            ],
          },
        ],
        subGalleries: {
          title: 'Sub Galleries',
          galleries: [],
        },
      };

      const mockUI = createMockUI();
      const galleryJsonPath = path.resolve(galleryPath, 'gallery.json');

      // Write the deprecated data first so the migration can backup it
      writeFileSync(galleryJsonPath, JSON.stringify(deprecatedData, null, 2));

      const migratedData = migrateGalleryJson(deprecatedData, galleryJsonPath, mockUI);

      // Verify mediaBasePath is set
      // The path is resolved from the gallery.json location, which is in galleryPath
      const expectedMediaBasePath = path.resolve(galleryPath, '..', 'photos');
      expect(migratedData.mediaBasePath).toBeDefined();
      expect(migratedData.mediaBasePath).toBe(expectedMediaBasePath);
    });

    test('should not set mediaBasePath for same-folder galleries', () => {
      const testPath = path.resolve(migrationTestPath, 'same-folder-migrate');
      const galleryPath = path.resolve(testPath, 'gallery');

      mkdirSync(galleryPath, { recursive: true });

      const deprecatedData: GalleryDataDeprecated = {
        title: 'Test',
        description: 'Test',
        headerImage: '../test.jpg',
        metadata: {},
        sections: [
          {
            images: [
              {
                type: 'image',
                path: '../image.jpg',
                width: 1920,
                height: 1080,
              },
            ],
          },
        ],
        subGalleries: {
          title: 'Sub Galleries',
          galleries: [],
        },
      };

      const mockUI = createMockUI();
      const galleryJsonPath = path.resolve(galleryPath, 'gallery.json');

      // Write the deprecated data first so the migration can backup it
      writeFileSync(galleryJsonPath, JSON.stringify(deprecatedData, null, 2));

      const migratedData = migrateGalleryJson(deprecatedData, galleryJsonPath, mockUI);

      // Verify mediaBasePath is not set
      expect(migratedData.mediaBasePath).toBeUndefined();
    });

    test('should preserve all other fields during migration', () => {
      const testPath = path.resolve(migrationTestPath, 'preserve-fields');
      const galleryPath = path.resolve(testPath, 'gallery');

      mkdirSync(galleryPath, { recursive: true });

      const deprecatedData: GalleryDataDeprecated = {
        title: 'My Gallery Title',
        description: 'My Gallery Description',
        headerImage: '../header.jpg',
        url: 'https://example.com',
        thumbnailSize: 300,
        analyticsScript: 'analytics.js',
        metadata: {
          image: '/gallery/images/social.jpg',
          ogUrl: 'https://example.com/gallery',
          author: 'Test Author',
        },
        sections: [
          {
            title: 'Section 1',
            description: 'Section Description',
            images: [
              {
                type: 'video',
                path: '../video.mp4',
                alt: 'Test Video',
                width: 1920,
                height: 1080,
              },
            ],
          },
        ],
        subGalleries: {
          title: 'My Sub Galleries',
          galleries: [
            {
              title: 'Sub 1',
              headerImage: 'sub1.jpg',
              path: 'sub1',
            },
          ],
        },
      };

      const mockUI = createMockUI();
      const galleryJsonPath = path.resolve(galleryPath, 'gallery.json');

      // Write the deprecated data first so the migration can backup it
      writeFileSync(galleryJsonPath, JSON.stringify(deprecatedData, null, 2));

      const migratedData = migrateGalleryJson(deprecatedData, galleryJsonPath, mockUI);

      // Verify all fields are preserved
      expect(migratedData.title).toBe('My Gallery Title');
      expect(migratedData.description).toBe('My Gallery Description');
      expect(migratedData.url).toBe('https://example.com');
      expect(migratedData.thumbnailSize).toBe(300);
      expect(migratedData.analyticsScript).toBe('analytics.js');
      expect(migratedData.metadata.image).toBe('/gallery/images/social.jpg');
      expect(migratedData.metadata.ogUrl).toBe('https://example.com/gallery');
      expect(migratedData.metadata.author).toBe('Test Author');
      expect(migratedData.sections[0].title).toBe('Section 1');
      expect(migratedData.sections[0].description).toBe('Section Description');
      expect(migratedData.sections[0].images[0].type).toBe('video');
      expect(migratedData.sections[0].images[0].alt).toBe('Test Video');
      expect(migratedData.subGalleries.title).toBe('My Sub Galleries');
      expect(migratedData.subGalleries.galleries[0].title).toBe('Sub 1');
    });

    test('should handle multiple sections correctly', () => {
      const testPath = path.resolve(migrationTestPath, 'multi-section');
      const galleryPath = path.resolve(testPath, 'gallery');

      mkdirSync(galleryPath, { recursive: true });

      const deprecatedData: GalleryDataDeprecated = {
        title: 'Test',
        description: 'Test',
        headerImage: '../test.jpg',
        metadata: {},
        sections: [
          {
            title: 'Section 1',
            images: [
              {
                type: 'image',
                path: '../img1.jpg',
                width: 1920,
                height: 1080,
              },
            ],
          },
          {
            title: 'Section 2',
            images: [
              {
                type: 'image',
                path: '../img2.jpg',
                width: 1920,
                height: 1080,
              },
              {
                type: 'image',
                path: '../img3.jpg',
                width: 1920,
                height: 1080,
              },
            ],
          },
        ],
        subGalleries: {
          title: 'Sub Galleries',
          galleries: [],
        },
      };

      const mockUI = createMockUI();
      const galleryJsonPath = path.resolve(galleryPath, 'gallery.json');

      // Write the deprecated data first so the migration can backup it
      writeFileSync(galleryJsonPath, JSON.stringify(deprecatedData, null, 2));

      const migratedData = migrateGalleryJson(deprecatedData, galleryJsonPath, mockUI);

      // Verify all sections are migrated
      expect(migratedData.sections).toHaveLength(2);
      expect(migratedData.sections[0].images[0].filename).toBe('img1.jpg');
      expect(migratedData.sections[1].images[0].filename).toBe('img2.jpg');
      expect(migratedData.sections[1].images[1].filename).toBe('img3.jpg');
    });

    test('should write migrated data to gallery.json file', () => {
      const testPath = path.resolve(migrationTestPath, 'write-file');
      const galleryPath = path.resolve(testPath, 'gallery');

      mkdirSync(galleryPath, { recursive: true });

      const deprecatedData: GalleryDataDeprecated = {
        title: 'Test',
        description: 'Test',
        headerImage: '../test.jpg',
        metadata: {},
        sections: [
          {
            images: [
              {
                type: 'image',
                path: '../image.jpg',
                width: 1920,
                height: 1080,
              },
            ],
          },
        ],
        subGalleries: {
          title: 'Sub Galleries',
          galleries: [],
        },
      };

      const mockUI = createMockUI();
      const galleryJsonPath = path.resolve(galleryPath, 'gallery.json');

      // Write the deprecated data first so the migration can backup it
      writeFileSync(galleryJsonPath, JSON.stringify(deprecatedData, null, 2));

      migrateGalleryJson(deprecatedData, galleryJsonPath, mockUI);

      // Verify file was written
      expect(existsSync(galleryJsonPath)).toBe(true);

      // Verify content is valid JSON
      const fileContent = readFileSync(galleryJsonPath, 'utf8');
      expect(() => JSON.parse(fileContent)).not.toThrow();

      // Verify content matches new schema
      const parsedData = JSON.parse(fileContent);
      expect(() => GalleryDataSchema.parse(parsedData)).not.toThrow();
    });
  });
});
