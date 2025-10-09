import { existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { processImage } from '../src/modules/thumbnails';

const fixturesPath = path.resolve(process.cwd(), 'tests', 'fixtures', 'images');

describe('createThumbnail', () => {
  test('should create horizontal and vertical thumbnails for EXIF test images', async () => {
    const tempFolder = path.resolve(fixturesPath, '..', 'test');

    // Create the temp folder if it doesn't exist
    if (!existsSync(tempFolder)) {
      mkdirSync(tempFolder, { recursive: true });
    }

    const horizontalImagePath = path.resolve(fixturesPath, 'test_image_exif_orientation_horizontal.jpg');
    const verticalImagePath = path.resolve(fixturesPath, 'test_image_exif_orientation_vertical.jpg');

    const horizontalThumbPath = path.resolve(tempFolder, 'test_thumb_horizontal.avif');
    const horizontalThumbPathRetina = path.resolve(tempFolder, 'test_thumb_horizontal_retina.avif');

    const verticalThumbPath = path.resolve(tempFolder, 'test_thumb_vertical.avif');
    const verticalThumbPathRetina = path.resolve(tempFolder, 'test_thumb_vertical_retina.avif');

    // Create thumbnails
    const horizontalThumbnail = await processImage(horizontalImagePath, horizontalThumbPath, horizontalThumbPathRetina, 30);
    const verticalThumbnail = await processImage(verticalImagePath, verticalThumbPath, verticalThumbPathRetina, 30);

    // Check that thumbnails were created
    expect(horizontalThumbnail).toBeDefined();
    expect(verticalThumbnail).toBeDefined();

    // Check orientation - horizontal should have width > height
    expect(horizontalThumbnail!.width).toBeGreaterThan(horizontalThumbnail!.height);

    // Check orientation - vertical should have height > width
    expect(verticalThumbnail!.height).toBeGreaterThan(verticalThumbnail!.width);

    // Clean up temporary directory
    if (existsSync(tempFolder)) {
      rmSync(tempFolder, { recursive: true, force: true });
    }
  });
});
