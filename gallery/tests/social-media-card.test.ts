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
    
    // Verify file exists and get its size
    expect(fs.existsSync(outputPath)).toBe(true);
    const firstFileSize = fs.statSync(outputPath).size;

    // Try creating again - should skip
    const result = await createGallerySocialMediaCardImage(testImagePath, title, outputPath);
    
    // File should not have been recreated (same size)
    const secondFileSize = fs.statSync(outputPath).size;
    expect(secondFileSize).toBe(firstFileSize);
    
    // Function should return the header basename
    expect(result).toBe(path.basename(testImagePath, path.extname(testImagePath)));
  });

  test('should handle very long single words that exceed max chars per line', async () => {
    const outputPath = path.join(tempDir, 'social-media-card-long-word.jpg');
    const title = 'SupercalifragilisticexpialidociousGallery';

    await createGallerySocialMediaCardImage(testImagePath, title, outputPath);

    expect(fs.existsSync(outputPath)).toBe(true);

    // Verify the image dimensions
    const metadata = await sharp(outputPath).metadata();
    expect(metadata.width).toBe(1200);
    expect(metadata.height).toBe(631);
  });
});
