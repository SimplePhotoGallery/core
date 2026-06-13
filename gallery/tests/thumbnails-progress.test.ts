import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

// resolveThemeDir uses import.meta, which ts-jest cannot evaluate; the test galleries set no theme so it
// is never called, but the module is still imported by thumbnails/index.ts, so mock it.
jest.mock('../src/modules/build', () => ({
  resolveThemeDir: jest.fn().mockResolvedValue('/tmp/theme'),
}));

import { processGalleryThumbnails } from '../src/modules/thumbnails';

import type { ConsolaInstance } from 'consola';

const fixtureImages = path.resolve(process.cwd(), 'tests', 'fixtures', 'single');

const createMockUI = (): ConsolaInstance =>
  ({
    info: jest.fn(),
    start: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    box: jest.fn(),
    warn: jest.fn(),
  }) as unknown as ConsolaInstance;

function setupGallery(rootDir: string, filenames: string[]): void {
  mkdirSync(path.join(rootDir, 'gallery'), { recursive: true });

  for (const name of filenames) {
    copyFileSync(path.join(fixtureImages, name), path.join(rootDir, name));
  }

  const galleryData = {
    title: 'Test',
    description: 'Test gallery',
    headerImage: filenames[0],
    metadata: {},
    sections: [{ images: filenames.map((filename) => ({ type: 'image', filename, width: 0, height: 0 })) }],
    subGalleries: { title: 'Sub', galleries: [] },
  };

  writeFileSync(path.join(rootDir, 'gallery', 'gallery.json'), JSON.stringify(galleryData, null, 2));
}

function setupGalleryJson(rootDir: string, filenames: string[]): void {
  mkdirSync(path.join(rootDir, 'gallery'), { recursive: true });

  const galleryData = {
    title: 'Test',
    description: 'Test gallery',
    headerImage: filenames[0],
    metadata: {},
    sections: [{ images: filenames.map((filename) => ({ type: 'image', filename, width: 0, height: 0 })) }],
    subGalleries: { title: 'Sub', galleries: [] },
  };

  writeFileSync(path.join(rootDir, 'gallery', 'gallery.json'), JSON.stringify(galleryData, null, 2));
}

function readGalleryJson(rootDir: string): { sections: { images: Record<string, unknown>[] }[] } {
  return JSON.parse(readFileSync(path.join(rootDir, 'gallery', 'gallery.json'), 'utf8'));
}

describe('processGalleryThumbnails progress persistence', () => {
  let tempDir: string;
  let filenames: string[];

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(os.tmpdir(), 'spg-progress-'));
    filenames = readdirSync(fixtureImages)
      .filter((file) => file.toLowerCase().endsWith('.jpg'))
      .slice(0, 3);
    setupGallery(tempDir, filenames);
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('persists thumbnails and timestamps and leaves no temporary file behind', async () => {
    const count = await processGalleryThumbnails(tempDir, createMockUI());

    expect(count).toBe(filenames.length);

    const data = readGalleryJson(tempDir);
    for (const image of data.sections[0].images) {
      const thumbnail = image.thumbnail as { path: string; blurHash?: string } | undefined;
      expect(thumbnail).toBeDefined();
      expect(thumbnail!.blurHash).toBeDefined();
      expect(image.lastMediaTimestamp).toBeDefined();
      expect(existsSync(path.join(tempDir, 'gallery', 'images', thumbnail!.path))).toBe(true);
    }

    // The atomic write should not leave the temporary file behind
    expect(existsSync(path.join(tempDir, 'gallery', 'gallery.json.tmp'))).toBe(false);
  });

  test('a second run resumes without regenerating existing thumbnails', async () => {
    await processGalleryThumbnails(tempDir, createMockUI());

    const imagesDir = path.join(tempDir, 'gallery', 'images');
    const firstRun = readdirSync(imagesDir).sort();
    const firstTimestamps = readGalleryJson(tempDir).sections[0].images.map((image) => image.lastMediaTimestamp);

    await processGalleryThumbnails(tempDir, createMockUI());

    const secondRun = readdirSync(imagesDir).sort();
    const secondTimestamps = readGalleryJson(tempDir).sections[0].images.map((image) => image.lastMediaTimestamp);

    // Already-processed files are skipped, so the thumbnails and their recorded timestamps are unchanged
    expect(secondRun).toEqual(firstRun);
    expect(secondTimestamps).toEqual(firstTimestamps);
  });

  test('reports failed media files and exits non-zero', async () => {
    rmSync(tempDir, { recursive: true, force: true });
    tempDir = mkdtempSync(path.join(os.tmpdir(), 'spg-progress-'));
    copyFileSync(path.join(fixtureImages, 'img_1.jpg'), path.join(tempDir, 'img_1.jpg'));
    setupGalleryJson(tempDir, ['img_1.jpg', 'missing.jpg']);
    const ui = createMockUI();

    await expect(processGalleryThumbnails(tempDir, ui)).rejects.toThrow('Failed to process 1 media file');

    expect(ui.warn).toHaveBeenCalledWith(expect.stringContaining('missing.jpg'));

    const data = readGalleryJson(tempDir);
    expect(data.sections[0].images[0].thumbnail).toBeDefined();
    expect(data.sections[0].images[1].thumbnail).toBeUndefined();
  });
});
