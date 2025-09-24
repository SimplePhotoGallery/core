import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { getImageDescription } from '../src/modules/thumbnails/utils';

const fixturesPath = path.resolve(process.cwd(), 'tests', 'fixtures', 'images');

describe('getImageDescription', () => {
  // Test cases based on filename inference
  const testCases = [
    { filename: 'test_image_description.jpg', expectedField: 'Description' },
    { filename: 'test_image_description.png', expectedField: 'Description' },
    { filename: 'test_image_description.tif', expectedField: 'Description' },
    { filename: 'test_image_description.webp', expectedField: 'Description' },
    { filename: 'test_image_description.avif', expectedField: 'Description' },
    { filename: 'test_image_image_description.jpg', expectedField: 'ImageDescription' },
    { filename: 'test_image_user_comment.jpg', expectedField: 'UserComment' },
    { filename: 'test_image_caption_abstract.jpg', expectedField: 'Caption/Abstract' },
    { filename: 'test_image_extended_description.jpg', expectedField: 'Extended Description' },
    { filename: 'test_image_xptitle.jpg', expectedField: 'XP Title' },
    { filename: 'test_image_xpcomment.jpg', expectedField: 'XP Comment' },
  ];

  for (const { filename, expectedField } of testCases) {
    test(`should handle ${filename} (expected: ${expectedField})`, async () => {
      const imagePath = path.resolve(fixturesPath, filename);

      // Verify file exists
      const fileExists = await fs
        .access(imagePath)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(true);

      // Load image and get description
      const result = await getImageDescription(imagePath);

      expect(result && typeof result === 'string' && result.startsWith('This is')).toBe(true);
    });
  }
});
