import { execSync } from 'node:child_process';
import { existsSync, rmSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { copySync } from 'fs-extra';
import { z } from 'zod';

const testDir = process.cwd();

const tsxPath = path.resolve(testDir, 'node_modules', '.bin', 'tsx');
const cliPath = path.resolve(testDir, 'src', 'index.ts');

const singleFixturePath = path.resolve(testDir, 'tests', 'fixtures', 'single');
const singleTestPath = path.resolve(testDir, 'tests', 'fixtures', 'test', 'single');
const galleryPath = path.resolve(singleTestPath, 'gallery');
const galleryJsonPath = path.resolve(galleryPath, 'gallery.json');
const thumbnailsPath = path.resolve(galleryPath, 'thumbnails');

// Zod schemas for validation
const MediaFileSchema = z.object({
  type: z.enum(['image', 'video']),
  path: z.string(),
  alt: z.string().optional(),
  width: z.number(),
  height: z.number(),
  thumbnail: z
    .object({
      path: z.string(),
      width: z.number(),
      height: z.number(),
    })
    .optional(),
});

const GallerySectionSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  images: z.array(MediaFileSchema),
});

const GalleryDataSchema = z.object({
  title: z.string(),
  description: z.string(),
  headerImage: z.string(),
  metadata: z.object({
    ogUrl: z.string(),
  }),
  sections: z.array(GallerySectionSchema),
  subGalleries: z.object({
    title: z.string(),
    galleries: z.array(z.any()),
  }),
});

const MediaFileWithThumbnailSchema = MediaFileSchema.extend({
  thumbnail: z.object({
    path: z.string(),
    width: z.number(),
    height: z.number(),
  }),
});

describe('CLI commands', () => {
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
      // Run init command
      execSync(`${tsxPath} ${cliPath} init --path ${singleTestPath}`);

      // Check that gallery.json exists
      expect(existsSync(galleryJsonPath)).toBe(true);

      // Read and parse gallery.json
      const galleryContent = readFileSync(galleryJsonPath, 'utf8');
      const galleryData = JSON.parse(galleryContent);

      // Validate entire structure with Zod schema
      expect(() => GalleryDataSchema.parse(galleryData)).not.toThrow();

      // Validate the parsed data matches our schema
      const validatedData = GalleryDataSchema.parse(galleryData);

      // Check sections array contains correct number of images
      expect(validatedData.sections).toHaveLength(1);
      expect(validatedData.sections[0].images).toHaveLength(3);

      // Check that all fixture images are included
      const imagePaths = validatedData.sections[0].images.map((img) => img.path);
      expect(imagePaths).toContain('../img_1.jpg');
      expect(imagePaths).toContain('../img_2.jpg');
      expect(imagePaths).toContain('../img_3.jpg');

      // All images should be of type 'image'
      for (const image of validatedData.sections[0].images) {
        expect(image.type).toBe('image');
      }
    });
  });

  describe('thumbnails command', () => {
    test('should create thumbnails for all images and update gallery.json', () => {
      // Run thumbnails command (init should have been run by previous test)
      execSync(`${tsxPath} ${cliPath} thumbnails --path ${singleTestPath}`);

      // Check that thumbnails directory exists
      expect(existsSync(thumbnailsPath)).toBe(true);

      // Check that thumbnail files exist for all images
      const thumbnailFiles = readdirSync(thumbnailsPath);
      expect(thumbnailFiles).toContain('img_1.jpg');
      expect(thumbnailFiles).toContain('img_2.jpg');
      expect(thumbnailFiles).toContain('img_3.jpg');
      expect(thumbnailFiles).toHaveLength(3);

      // Read updated gallery.json and validate with schema
      const galleryContent = readFileSync(galleryJsonPath, 'utf8');
      const galleryData = JSON.parse(galleryContent);

      // Validate overall structure still matches
      expect(() => GalleryDataSchema.parse(galleryData)).not.toThrow();
      const validatedData = GalleryDataSchema.parse(galleryData);

      // Check that all images now have thumbnail information using schema
      for (const image of validatedData.sections[0].images) {
        expect(() => MediaFileWithThumbnailSchema.parse(image)).not.toThrow();
        const validatedImage = MediaFileWithThumbnailSchema.parse(image);
        expect(validatedImage.thumbnail.path).toMatch(/^thumbnails\/img_\d\.jpg$/);
      }
    });
  });

  describe('build command', () => {
    test('should create static HTML files and gallery assets', () => {
      // Run build command (init and thumbnails should have been run by previous tests)
      execSync(`${tsxPath} ${cliPath} build --path ${singleTestPath}`);

      // Check that index.html exists in the main directory
      const indexPath = path.resolve(singleTestPath, 'index.html');
      expect(existsSync(indexPath)).toBe(true);

      // Check that build created files in gallery directory
      const galleryFiles = readdirSync(galleryPath);

      // The exact files depend on the template build, but we should have at least thumbnails and gallery.json
      expect(galleryFiles).toContain('thumbnails');
      expect(galleryFiles).toContain('gallery.json');

      // Check that thumbnails directory still exists after build
      expect(existsSync(thumbnailsPath)).toBe(true);

      // Check that gallery.json still exists and is valid with schema
      expect(existsSync(galleryJsonPath)).toBe(true);
      const galleryContent = readFileSync(galleryJsonPath, 'utf8');
      const galleryData = JSON.parse(galleryContent);
      expect(() => GalleryDataSchema.parse(galleryData)).not.toThrow();
    });
  });
});
