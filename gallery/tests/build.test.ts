import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

jest.mock('node:child_process', () => ({
  spawnSync: jest.fn(),
}));

import { LogLevels } from 'consola';

import { build } from '../src/modules/build';

import type { BuildOptions } from '../src/modules/build/types';
import type { ConsolaInstance } from 'consola';

const spawnSyncMock = spawnSync as jest.MockedFunction<typeof spawnSync>;

function createMockUI(): ConsolaInstance {
  return {
    info: jest.fn(),
    start: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    box: jest.fn(),
    prompt: jest.fn(),
    level: LogLevels.info,
  } as unknown as ConsolaInstance;
}

function createThemeStub(rootDir: string): string {
  const themeDir = path.join(rootDir, 'theme');
  const astroDir = path.join(themeDir, 'node_modules', 'astro');
  mkdirSync(themeDir, { recursive: true });
  mkdirSync(astroDir, { recursive: true });
  writeFileSync(
    path.join(themeDir, 'package.json'),
    JSON.stringify({ name: 'test-theme', version: '1.0.0', type: 'module' }, null, 2),
  );
  writeFileSync(path.join(astroDir, 'package.json'), JSON.stringify({ name: 'astro', bin: { astro: 'astro.js' } }, null, 2));
  writeFileSync(path.join(astroDir, 'astro.js'), '');

  return themeDir;
}

function createGallery(rootDir: string, overrides: Record<string, unknown> = {}): void {
  mkdirSync(path.join(rootDir, 'gallery'), { recursive: true });
  writeFileSync(path.join(rootDir, 'photo.jpg'), 'photo');

  const galleryData = {
    title: 'Test Gallery',
    description: 'A test gallery',
    headerImage: 'photo.jpg',
    metadata: { image: '/gallery/images/existing-card.jpg' },
    sections: [
      {
        images: [
          {
            type: 'image',
            filename: 'photo.jpg',
            width: 100,
            height: 100,
          },
        ],
      },
    ],
    subGalleries: { title: 'Sub Galleries', galleries: [] },
    ...overrides,
  };

  writeFileSync(path.join(rootDir, 'gallery', 'gallery.json'), JSON.stringify(galleryData, null, 2));
}

function buildOptions(rootDir: string, themeDir: string, overrides: Partial<BuildOptions> = {}): BuildOptions {
  return {
    gallery: rootDir,
    recursive: false,
    baseUrl: undefined,
    thumbsBaseUrl: undefined,
    scan: false,
    prune: false,
    thumbnails: false,
    yes: false,
    theme: themeDir,
    ...overrides,
  };
}

function mockSuccessfulAstroBuild(): void {
  spawnSyncMock.mockImplementation((_command, _args, options) => {
    const outputDir = (options as { env?: Record<string, string | undefined> }).env?.GALLERY_OUTPUT_DIR;
    if (!outputDir) {
      throw new Error('Missing GALLERY_OUTPUT_DIR');
    }

    const buildDir = path.join(outputDir, '_build');
    mkdirSync(buildDir, { recursive: true });
    writeFileSync(path.join(buildDir, 'index.html'), '<html><body>built</body></html>');

    return { status: 0, signal: null, stdout: '', stderr: '' } as ReturnType<typeof spawnSync>;
  });
}

describe('build module', () => {
  let tempDir: string;
  let originalIsTTY: boolean | undefined;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(os.tmpdir(), 'spg-build-'));
    originalIsTTY = process.stdout.isTTY;
    spawnSyncMock.mockReset();
    mockSuccessfulAstroBuild();
  });

  afterEach(() => {
    Object.defineProperty(process.stdout, 'isTTY', { value: originalIsTTY, configurable: true });
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('prints the tail of Astro output when the build fails', async () => {
    const themeDir = createThemeStub(tempDir);
    createGallery(tempDir);
    const ui = createMockUI();

    spawnSyncMock.mockReturnValue({
      status: 1,
      signal: null,
      stdout: Array.from({ length: 40 }, (_, index) => `stdout ${index}`).join('\n'),
      stderr: 'template exploded',
    } as ReturnType<typeof spawnSync>);

    await expect(build(buildOptions(tempDir, themeDir), ui)).rejects.toThrow('Astro build failed');

    expect(ui.error).toHaveBeenCalledWith(expect.stringContaining('Astro build output'));
    expect(ui.error).toHaveBeenCalledWith(expect.stringContaining('template exploded'));
    expect(ui.error).toHaveBeenCalledWith(expect.stringContaining(`Build failed for ${tempDir}`));
  });

  test('fails fast instead of prompting to copy photos in non-interactive mode', async () => {
    const themeDir = createThemeStub(tempDir);
    const photosDir = path.join(tempDir, 'photos');
    mkdirSync(photosDir);
    writeFileSync(path.join(photosDir, 'photo.jpg'), 'photo');
    createGallery(tempDir, { mediaBasePath: photosDir });
    const ui = createMockUI();

    Object.defineProperty(process.stdout, 'isTTY', { value: false, configurable: true });

    await expect(build(buildOptions(tempDir, themeDir), ui)).rejects.toThrow('Use --yes');

    expect(ui.prompt).not.toHaveBeenCalled();
    expect(spawnSyncMock).not.toHaveBeenCalled();
  });

  test('prunes missing scanned files and deletes their thumbnails', async () => {
    const themeDir = createThemeStub(tempDir);
    const imagesDir = path.join(tempDir, 'gallery', 'images');
    mkdirSync(imagesDir, { recursive: true });
    writeFileSync(path.join(imagesDir, 'missing.avif'), 'thumb');
    writeFileSync(path.join(imagesDir, 'missing@2x.avif'), 'thumb');
    createGallery(tempDir, {
      sections: [
        {
          images: [
            { type: 'image', filename: 'photo.jpg', width: 100, height: 100 },
            {
              type: 'image',
              filename: 'missing.jpg',
              width: 100,
              height: 100,
              thumbnail: {
                path: 'missing.avif',
                pathRetina: 'missing@2x.avif',
                width: 100,
                height: 100,
              },
            },
          ],
        },
      ],
    });

    await build(buildOptions(tempDir, themeDir, { scan: true, prune: true }), createMockUI());

    const galleryData = JSON.parse(readFileSync(path.join(tempDir, 'gallery', 'gallery.json'), 'utf8'));
    expect(galleryData.sections[0].images.map((image: { filename: string }) => image.filename)).toEqual(['photo.jpg']);
    expect(existsSync(path.join(imagesDir, 'missing.avif'))).toBe(false);
    expect(existsSync(path.join(imagesDir, 'missing@2x.avif'))).toBe(false);
    expect(existsSync(path.join(tempDir, 'index.html'))).toBe(true);
  });
});
