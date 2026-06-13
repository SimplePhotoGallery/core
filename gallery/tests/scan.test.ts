import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { init, scanDirectory } from '../src/modules/init';
import { capitalizeTitle } from '../src/modules/init/utils';

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

  test('should ignore generated, dependency, and dot directories', async () => {
    for (const dirName of ['gallery', 'node_modules', '.cache', '.git', 'album']) {
      fs.mkdirSync(path.join(tempDir, dirName));
    }

    const { subGalleryDirectories } = await scanDirectory(tempDir, createMockUI());

    expect(subGalleryDirectories).toEqual([path.join(tempDir, 'album')]);
  });
});

describe('init', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spg-init-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('should report zero galleries for an empty directory', async () => {
    const ui = {
      ...createMockUI(),
      box: jest.fn(),
    };

    const result = await init(
      {
        photos: tempDir,
        recursive: false,
        default: true,
        force: false,
      },
      ui as unknown as ConsolaInstance,
    );

    expect(result).toEqual({ processedMediaCount: 0, processedGalleryCount: 0 });
    expect(ui.box).toHaveBeenCalledWith('Created 0 galleries with 0 media files');
    expect(fs.existsSync(path.join(tempDir, 'gallery', 'gallery.json'))).toBe(false);
  });
});

describe('capitalizeTitle', () => {
  test('should replace all dashes and underscores', () => {
    expect(capitalizeTitle('my-summer_trip-2026')).toBe('My Summer Trip 2026');
  });
});
