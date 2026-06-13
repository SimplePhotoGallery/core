import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

import { GalleryDataSchema, MediaFileSchema, ThumbnailSchema } from '@simple-photo-gallery/common';
import { copySync } from 'fs-extra';

const fixturePath = path.resolve(process.cwd(), 'tests', 'fixtures', 'single');
const modernThemePath = path.resolve(process.cwd(), '..', 'themes', 'modern');
const tsxPath = path.resolve(process.cwd(), '..', 'node_modules', '.bin', 'tsx');
const cliPath = path.resolve(process.cwd(), 'src', 'index.ts');
const MediaFileWithThumbnailSchema = MediaFileSchema.extend({
  thumbnail: ThumbnailSchema,
});

function runCliCommand(args: string[]): void {
  execFileSync(tsxPath, [cliPath, ...args], {
    env: { ...process.env, SPG_TELEMETRY_PROVIDER: 'none' },
    stdio: 'pipe',
  });
}

describe('gallery smoke flow', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(os.tmpdir(), 'spg-smoke-'));
    copySync(fixturePath, tempDir);
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('initializes, thumbnails, builds, and renders expected HTML attributes', () => {
    runCliCommand(['init', '--photos', tempDir, '--default']);
    runCliCommand(['thumbnails', '--gallery', tempDir]);
    runCliCommand(['build', '--gallery', tempDir, '--theme', modernThemePath]);

    const galleryJsonPath = path.join(tempDir, 'gallery', 'gallery.json');
    const galleryData = GalleryDataSchema.parse(JSON.parse(readFileSync(galleryJsonPath, 'utf8')));

    expect(galleryData.sections).toHaveLength(1);
    expect(galleryData.sections[0].images).toHaveLength(3);
    expect(galleryData.metadata.image).toBe('/gallery/images/social-media-card.jpg');

    for (const image of galleryData.sections[0].images) {
      expect(() => MediaFileWithThumbnailSchema.parse(image)).not.toThrow();
      expect(existsSync(path.join(tempDir, 'gallery', 'images', image.thumbnail!.path))).toBe(true);
      expect(existsSync(path.join(tempDir, 'gallery', 'images', image.thumbnail!.pathRetina))).toBe(true);
    }

    expect(existsSync(path.join(tempDir, 'gallery', 'images', 'social-media-card.jpg'))).toBe(true);
    expect(existsSync(path.join(tempDir, 'gallery', '_build'))).toBe(false);

    const htmlPath = path.join(tempDir, 'index.html');
    expect(existsSync(htmlPath)).toBe(true);

    const html = readFileSync(htmlPath, 'utf8');
    expect(html).toContain('<title>My Gallery</title>');
    expect(html).toContain('class="gallery-section__item"');
    expect(html).toContain('data-pswp-type="image"');
    expect(html).toContain('srcset="gallery/images/img_1.avif 1x, gallery/images/img_1@2x.avif 2x"');
    expect(html).not.toContain('undefined');

    for (const image of galleryData.sections[0].images) {
      expect(html).toContain(`data-image-id="${image.filename}"`);
      expect(html).toContain(`href="${image.filename}"`);
      expect(html).toContain(`data-pswp-src="${image.filename}"`);
      expect(html).toContain(`data-pswp-width="${image.width}"`);
      expect(html).toContain(`data-pswp-height="${image.height}"`);
    }
  });
});
