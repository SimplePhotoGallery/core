import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { clean } from '../src/modules/clean';

import type { ConsolaInstance } from 'consola';

// Mock console UI for testing
const createMockUI = (promptResult?: boolean): ConsolaInstance =>
  ({
    info: jest.fn(),
    start: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    box: jest.fn(),
    prompt: jest.fn().mockResolvedValue(promptResult),
    warn: jest.fn(),
    log: jest.fn(),
  }) as unknown as ConsolaInstance;

// Helper to create a gallery directory structure with generated files
function createTestGallery(rootDir: string): void {
  const galleryPath = path.join(rootDir, 'gallery');
  fs.mkdirSync(path.join(galleryPath, 'images'), { recursive: true });
  fs.writeFileSync(path.join(galleryPath, 'gallery.json'), JSON.stringify({ title: 'Test Gallery' }));
  fs.writeFileSync(path.join(galleryPath, 'images', 'photo.avif'), 'thumbnail');
  fs.writeFileSync(path.join(rootDir, 'index.html'), '<html></html>');
}

describe('clean', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spg-clean-test-'));
    createTestGallery(tempDir);
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('should remove generated files but keep gallery.json by default', async () => {
    const ui = createMockUI();

    await clean({ gallery: tempDir, recursive: false, all: false, force: false }, ui);

    expect(fs.existsSync(path.join(tempDir, 'index.html'))).toBe(false);
    expect(fs.existsSync(path.join(tempDir, 'gallery', 'images'))).toBe(false);
    expect(fs.existsSync(path.join(tempDir, 'gallery', 'gallery.json'))).toBe(true);
  });

  test('should remove the entire gallery directory with --all and --force', async () => {
    const ui = createMockUI();

    await clean({ gallery: tempDir, recursive: false, all: true, force: true }, ui);

    expect(fs.existsSync(path.join(tempDir, 'index.html'))).toBe(false);
    expect(fs.existsSync(path.join(tempDir, 'gallery'))).toBe(false);
  });

  test('should refuse to remove gallery.json with --all when confirmation is not possible', async () => {
    const ui = createMockUI();

    // process.stdout.isTTY is falsy when running under Jest, so the confirmation prompt cannot be shown
    await clean({ gallery: tempDir, recursive: false, all: true, force: false }, ui);

    expect(fs.existsSync(path.join(tempDir, 'gallery', 'gallery.json'))).toBe(true);
    expect(ui.error).toHaveBeenCalledWith(expect.stringContaining('--force'));
  });

  test('should clean galleries in subdirectories with --recursive', async () => {
    const subDir = path.join(tempDir, 'japan');
    fs.mkdirSync(subDir);
    createTestGallery(subDir);

    const ui = createMockUI();

    await clean({ gallery: tempDir, recursive: true, all: false, force: false }, ui);

    expect(fs.existsSync(path.join(subDir, 'index.html'))).toBe(false);
    expect(fs.existsSync(path.join(subDir, 'gallery', 'images'))).toBe(false);
    expect(fs.existsSync(path.join(subDir, 'gallery', 'gallery.json'))).toBe(true);
  });
});
