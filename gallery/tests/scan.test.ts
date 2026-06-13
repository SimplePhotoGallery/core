import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { scanDirectory } from '../src/modules/init';

import type { ConsolaInstance } from 'consola';

// Mock console UI for testing
const createMockUI = (): ConsolaInstance =>
  ({
    info: jest.fn(),
    start: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  }) as unknown as ConsolaInstance;

describe('scanDirectory', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spg-scan-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('should return media files sorted by filename regardless of creation order', async () => {
    for (const filename of ['cherry.mp4', 'banana.jpg', 'apple.jpg']) {
      fs.writeFileSync(path.join(tempDir, filename), 'media');
    }

    const { mediaFiles } = await scanDirectory(tempDir, createMockUI());

    expect(mediaFiles.map((file) => file.filename)).toEqual(['apple.jpg', 'banana.jpg', 'cherry.mp4']);
  });

  test('should sort numbered filenames numerically', async () => {
    for (const filename of ['IMG_10.jpg', 'IMG_1.jpg', 'IMG_2.jpg']) {
      fs.writeFileSync(path.join(tempDir, filename), 'media');
    }

    const { mediaFiles } = await scanDirectory(tempDir, createMockUI());

    expect(mediaFiles.map((file) => file.filename)).toEqual(['IMG_1.jpg', 'IMG_2.jpg', 'IMG_10.jpg']);
  });

  test('should return subdirectories sorted by name', async () => {
    for (const dirName of ['zebra', 'alpha', 'monkey']) {
      fs.mkdirSync(path.join(tempDir, dirName));
    }

    const { subGalleryDirectories } = await scanDirectory(tempDir, createMockUI());

    expect(subGalleryDirectories).toEqual([
      path.join(tempDir, 'alpha'),
      path.join(tempDir, 'monkey'),
      path.join(tempDir, 'zebra'),
    ]);
  });

  test('should ignore files that are not images or videos', async () => {
    fs.writeFileSync(path.join(tempDir, 'photo.jpg'), 'media');
    fs.writeFileSync(path.join(tempDir, 'notes.txt'), 'text');

    const { mediaFiles } = await scanDirectory(tempDir, createMockUI());

    expect(mediaFiles.map((file) => file.filename)).toEqual(['photo.jpg']);
  });
});
