import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

import sharp from 'sharp';

import { createGallerySocialMediaCardImage } from '../src/modules/build/utils';

const fixturesPath = path.resolve(process.cwd(), 'tests', 'fixtures', 'images');
const testImagePath = path.join(fixturesPath, 'test_image_description.jpg');

describe('createGallerySocialMediaCardImage', () => {
  let tempDir: string;

  beforeEach(() => {
    // Create a temporary directory for test outputs
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spg-test-'));
  });

  afterEach(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('should create social media card with short title', async () => {
    const outputPath = path.join(tempDir, 'social-media-card-short.jpg');
    const title = 'My Gallery';

    await createGallerySocialMediaCardImage(testImagePath, title, outputPath);

    expect(fs.existsSync(outputPath)).toBe(true);

    // Verify the image dimensions
    const metadata = await sharp(outputPath).metadata();
    expect(metadata.width).toBe(1200);
    expect(metadata.height).toBe(631);
  });

  test('should create social media card with long title that needs wrapping', async () => {
    const outputPath = path.join(tempDir, 'social-media-card-long.jpg');
    const title = 'My Amazing Photo Gallery With A Very Long Title That Should Wrap';

    await createGallerySocialMediaCardImage(testImagePath, title, outputPath);

    expect(fs.existsSync(outputPath)).toBe(true);

    // Verify the image dimensions
    const metadata = await sharp(outputPath).metadata();
    expect(metadata.width).toBe(1200);
    expect(metadata.height).toBe(631);
  });

  test('should create social media card with title containing special XML characters', async () => {
    const outputPath = path.join(tempDir, 'social-media-card-special.jpg');
    const title = 'Gallery & Photos <2024> "Best" \'Shots\'';

    await createGallerySocialMediaCardImage(testImagePath, title, outputPath);

    expect(fs.existsSync(outputPath)).toBe(true);

    // Verify the image dimensions
    const metadata = await sharp(outputPath).metadata();
    expect(metadata.width).toBe(1200);
    expect(metadata.height).toBe(631);
  });

  test('should skip creating card if output already exists', async () => {
    const outputPath = path.join(tempDir, 'social-media-card-existing.jpg');
    const title = 'My Gallery';

    // Create the file first
    await createGallerySocialMediaCardImage(testImagePath, title, outputPath);
    const firstCreationTime = fs.statSync(outputPath).mtime;

    // Wait a bit to ensure timestamp would differ if file was recreated
    await new Promise((resolve) => {
      setTimeout(resolve, 10);
    });

    // Try creating again
    await createGallerySocialMediaCardImage(testImagePath, title, outputPath);
    const secondCreationTime = fs.statSync(outputPath).mtime;

    // File should not have been recreated
    expect(firstCreationTime).toEqual(secondCreationTime);
  });
});
