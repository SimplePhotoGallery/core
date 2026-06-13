import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

import { GalleryDataSchema } from '@simple-photo-gallery/common';
import { copySync } from 'fs-extra';

jest.setTimeout(240_000);

const testDir = process.cwd();
const singleFixturePath = path.resolve(testDir, 'tests', 'fixtures', 'single');
const multiFixturePath = path.resolve(testDir, 'tests', 'fixtures', 'multi');
const modernThemePath = path.resolve(testDir, '..', 'themes', 'modern');
const tsxPath = path.resolve(testDir, '..', 'node_modules', '.bin', 'tsx');
const cliPath = path.resolve(testDir, 'src', 'index.ts');
const distCliPath = path.resolve(testDir, 'dist', 'index.js');
const yarnPath = path.resolve(testDir, '..', '.yarn', 'releases', 'yarn-4.9.3.cjs');
const packageJson = JSON.parse(readFileSync(path.resolve(testDir, 'package.json'), 'utf8')) as { version: string };

type CliEnv = Record<string, string | undefined>;

interface RunCliOptions {
  cwd?: string;
  env?: CliEnv;
  expectedStatus?: number;
  home?: string;
}

interface RunCliResult {
  stdout: string;
  stderr: string;
  status: number;
}

let networkShimDir: string;
let networkShimPath: string;
let tempDirs: string[] = [];

beforeAll(() => {
  networkShimDir = mkdtempSync(path.join(os.tmpdir(), 'spg-cli-network-shim-'));
  networkShimPath = path.join(networkShimDir, 'disable-fetch.mjs');
  writeFileSync(
    networkShimPath,
    'globalThis.fetch = async () => ({ ok: false, json: async () => ({ versions: {} }) });\n',
    'utf8',
  );
});

afterEach(() => {
  for (const tempDir of tempDirs) {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  }
  tempDirs = [];
});

afterAll(() => {
  if (networkShimDir && existsSync(networkShimDir)) {
    rmSync(networkShimDir, { recursive: true, force: true });
  }
});

function makeTempDir(prefix: string): string {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), `spg-cli-e2e-${prefix}-`));
  tempDirs.push(tempDir);
  return tempDir;
}

function isolatedHome(prefix: string): string {
  const home = makeTempDir(`${prefix}-home`);
  return home;
}

function buildEnv(options: RunCliOptions): CliEnv {
  const home = options.home ?? isolatedHome('command');
  const importShim = `--import=${networkShimPath}`;
  const nodeOptions = process.env.NODE_OPTIONS ? `${process.env.NODE_OPTIONS} ${importShim}` : importShim;

  return {
    ...process.env,
    ...options.env,
    APPDATA: path.join(home, 'AppData', 'Roaming'),
    CI: '1',
    HOME: home,
    NODE_OPTIONS: nodeOptions,
    SPG_TELEMETRY: '0',
    SPG_TELEMETRY_PROVIDER: 'none',
    USERPROFILE: home,
    XDG_CONFIG_HOME: path.join(home, '.config'),
  };
}

function runCommand(command: string, args: string[], options: RunCliOptions = {}): RunCliResult {
  const expectedStatus = options.expectedStatus ?? 0;
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? testDir,
    encoding: 'utf8',
    env: buildEnv(options),
    maxBuffer: 10 * 1024 * 1024,
    stdio: 'pipe',
    timeout: 180_000,
  });

  if (result.error) {
    throw result.error;
  }

  const status = result.status ?? 1;
  if (status !== expectedStatus) {
    throw new Error(
      [
        `Expected ${command} ${args.join(' ')} to exit ${expectedStatus}, got ${status}`,
        'stdout:',
        result.stdout,
        'stderr:',
        result.stderr,
      ].join('\n'),
    );
  }

  return { stdout: result.stdout, stderr: result.stderr, status };
}

function runSourceCli(args: string[], options: RunCliOptions = {}): RunCliResult {
  return runCommand(tsxPath, [cliPath, ...args], options);
}

function runDistCli(args: string[], options: RunCliOptions = {}): RunCliResult {
  return runCommand(process.execPath, [distCliPath, ...args], options);
}

function readGalleryData(galleryDir: string) {
  return GalleryDataSchema.parse(JSON.parse(readFileSync(path.join(galleryDir, 'gallery', 'gallery.json'), 'utf8')));
}

function readHtml(galleryDir: string): string {
  return readFileSync(path.join(galleryDir, 'index.html'), 'utf8');
}

function copySingleFixture(targetDir: string): void {
  copySync(singleFixturePath, targetDir);
}

function copyMultiFixture(targetDir: string): void {
  copySync(multiFixturePath, targetDir);
}

describe('CLI e2e user workflows', () => {
  test('supports the documented two-command quick start from the photos directory', () => {
    const galleryDir = makeTempDir('quick-start');
    copySingleFixture(galleryDir);

    runSourceCli(['init', '--default'], { cwd: galleryDir });
    runSourceCli(['build', '--theme', modernThemePath], { cwd: galleryDir });

    const galleryData = readGalleryData(galleryDir);
    expect(galleryData.sections[0].images.map((image) => image.filename)).toEqual(['img_1.jpg', 'img_2.jpg', 'img_3.jpg']);
    expect(galleryData.metadata.image).toBe('/gallery/images/social-media-card.jpg');
    expect(existsSync(path.join(galleryDir, 'gallery', 'images', 'social-media-card.jpg'))).toBe(true);

    for (const image of galleryData.sections[0].images) {
      expect(image.thumbnail?.path).toMatch(/\.avif$/);
      expect(existsSync(path.join(galleryDir, 'gallery', 'images', image.thumbnail!.path))).toBe(true);
      expect(existsSync(path.join(galleryDir, 'gallery', 'images', image.thumbnail!.pathRetina))).toBe(true);
    }

    const html = readHtml(galleryDir);
    expect(html).toContain('<title>My Gallery</title>');
    expect(html).toContain('class="gallery-section__item"');
    expect(html).toContain('data-pswp-type="image"');
    expect(html).toContain('data-pswp-caption');
    expect(html).toContain('srcset="gallery/images/img_1.avif 1x, gallery/images/img_1@2x.avif 2x"');
    expect(html).not.toContain('undefined');
    expect(existsSync(path.join(galleryDir, 'gallery', '_build'))).toBe(false);
  });

  test('uses current working directory defaults and short aliases across init, thumbnails, build, and clean', () => {
    const galleryDir = makeTempDir('cwd-defaults');
    copySingleFixture(galleryDir);

    runSourceCli(['init', '-d'], { cwd: galleryDir });
    runSourceCli(['thumbnails'], { cwd: galleryDir });
    runSourceCli(['build', '--theme', modernThemePath, '--no-scan', '--no-thumbnails'], { cwd: galleryDir });

    expect(existsSync(path.join(galleryDir, 'index.html'))).toBe(true);
    expect(existsSync(path.join(galleryDir, 'gallery', 'images', 'img_1.avif'))).toBe(true);

    runSourceCli(['clean'], { cwd: galleryDir });

    expect(existsSync(path.join(galleryDir, 'index.html'))).toBe(false);
    expect(existsSync(path.join(galleryDir, 'gallery', 'images'))).toBe(false);
    expect(existsSync(path.join(galleryDir, 'gallery', 'gallery.json'))).toBe(true);
  });

  test('renders media and thumbnail CDN URLs in generated HTML', () => {
    const rootDir = makeTempDir('cdn');
    const photosDir = path.join(rootDir, 'photos');
    const outputDir = path.join(rootDir, 'site');
    copySingleFixture(photosDir);

    runSourceCli(['init', '--photos', photosDir, '--gallery', outputDir, '--default']);
    runSourceCli(['thumbnails', '--gallery', outputDir]);
    runSourceCli([
      'build',
      '--gallery',
      outputDir,
      '--theme',
      modernThemePath,
      '--base-url',
      'https://cdn.example/photos',
      '--thumbs-base-url',
      'https://cdn.example/thumbs/',
      '--no-scan',
      '--no-thumbnails',
    ]);

    const galleryData = readGalleryData(outputDir);
    expect(galleryData.mediaBaseUrl).toBe('https://cdn.example/photos');
    expect(galleryData.thumbsBaseUrl).toBe('https://cdn.example/thumbs');
    expect(galleryData.metadata.image).toBe('https://cdn.example/thumbs/social-media-card.jpg');
    expect(existsSync(path.join(outputDir, 'img_1.jpg'))).toBe(false);

    const html = readHtml(outputDir);
    expect(html).toContain('href="https://cdn.example/photos/img_1.jpg"');
    expect(html).toContain('data-pswp-src="https://cdn.example/photos/img_1.jpg"');
    expect(html).toContain('src="https://cdn.example/thumbs/img_1.avif"');
    expect(html).toContain('srcset="https://cdn.example/thumbs/img_1.avif 1x, https://cdn.example/thumbs/img_1@2x.avif 2x"');
    expect(html).not.toContain('https://cdn.example/thumbs//');
  });

  test('renders recursive subgallery navigation and child gallery pages', () => {
    const galleryDir = makeTempDir('recursive');
    copyMultiFixture(galleryDir);

    runSourceCli(['init', '--photos', galleryDir, '--recursive', '--default']);
    runSourceCli(['thumbnails', '--gallery', galleryDir, '--recursive']);
    runSourceCli(['build', '--gallery', galleryDir, '--recursive', '--theme', modernThemePath, '--no-thumbnails']);

    const rootHtml = readHtml(galleryDir);
    expect(rootHtml).toContain('href="first"');
    expect(rootHtml).toContain('href="second"');
    expect(rootHtml).toContain('src="first/gallery/images/img_4.avif"');
    expect(rootHtml).toContain('src="second/gallery/images/img_6.avif"');
    expect(rootHtml).not.toContain('undefined');

    const firstHtml = readHtml(path.join(galleryDir, 'first'));
    expect(firstHtml).toContain('data-image-id="img_4.jpg"');
    expect(firstHtml).toContain('data-image-id="img_5.jpg"');
    expect(firstHtml).not.toContain('data-image-id="img_1.jpg"');
    expect(firstHtml).not.toContain('undefined');

    const secondHtml = readHtml(path.join(galleryDir, 'second'));
    expect(secondHtml).toContain('data-image-id="img_6.jpg"');
    expect(secondHtml).toContain('data-image-id="img_7.jpg"');
    expect(secondHtml).not.toContain('undefined');
  });

  test('build scans new files by default, respects --no-scan, and prunes missing files', () => {
    const galleryDir = makeTempDir('scan-prune');
    copySingleFixture(galleryDir);

    runSourceCli(['init', '--photos', galleryDir, '--default']);
    runSourceCli(['build', '--gallery', galleryDir, '--theme', modernThemePath]);

    copyFileSync(path.join(galleryDir, 'img_3.jpg'), path.join(galleryDir, 'img_10.jpg'));
    runSourceCli(['build', '--gallery', galleryDir]);

    let galleryData = readGalleryData(galleryDir);
    expect(galleryData.sections[0].images.map((image) => image.filename)).toContain('img_10.jpg');
    expect(readHtml(galleryDir)).toContain('data-image-id="img_10.jpg"');

    copyFileSync(path.join(galleryDir, 'img_3.jpg'), path.join(galleryDir, 'img_11.jpg'));
    runSourceCli(['build', '--gallery', galleryDir, '--no-scan', '--no-thumbnails']);

    galleryData = readGalleryData(galleryDir);
    expect(galleryData.sections[0].images.map((image) => image.filename)).not.toContain('img_11.jpg');

    const prunedImage = galleryData.sections[0].images.find((image) => image.filename === 'img_10.jpg');
    expect(prunedImage?.thumbnail?.path).toBeDefined();
    expect(prunedImage?.thumbnail?.pathRetina).toBeDefined();
    rmSync(path.join(galleryDir, 'img_10.jpg'));
    rmSync(path.join(galleryDir, 'img_11.jpg'));

    runSourceCli(['build', '--gallery', galleryDir, '--prune', '--no-thumbnails']);

    galleryData = readGalleryData(galleryDir);
    expect(galleryData.sections[0].images.map((image) => image.filename)).not.toContain('img_10.jpg');
    expect(existsSync(path.join(galleryDir, 'gallery', 'images', prunedImage!.thumbnail!.path))).toBe(false);
    expect(existsSync(path.join(galleryDir, 'gallery', 'images', prunedImage!.thumbnail!.pathRetina))).toBe(false);
  });

  test('persists thumbnail configuration passed through the real CLI', () => {
    const galleryDir = makeTempDir('thumbnail-config');
    copySingleFixture(galleryDir);

    runSourceCli([
      'init',
      '--photos',
      galleryDir,
      '--default',
      '--thumbnail-size',
      '180',
      '--thumbnail-edge',
      'width',
      '--theme',
      modernThemePath,
    ]);
    runSourceCli([
      'build',
      '--gallery',
      galleryDir,
      '--theme',
      modernThemePath,
      '--thumbnail-format',
      'jpeg',
      '--thumbnail-quality',
      '80',
    ]);

    const galleryData = readGalleryData(galleryDir);
    expect(galleryData.theme).toBe(modernThemePath);
    expect(galleryData.thumbnails).toMatchObject({
      edge: 'width',
      format: 'jpeg',
      quality: 80,
      size: 180,
    });
    expect(galleryData.sections[0].images[0].thumbnail?.width).toBe(180);
    expect(existsSync(path.join(galleryDir, 'gallery', 'images', 'img_1.jpg'))).toBe(true);
    expect(existsSync(path.join(galleryDir, 'gallery', 'images', 'img_1@2x.jpg'))).toBe(true);
    expect(readHtml(galleryDir)).toContain('srcset="gallery/images/img_1.jpg 1x, gallery/images/img_1@2x.jpg 2x"');
  });
});

describe('CLI e2e guardrails', () => {
  test('refuses to overwrite an existing gallery in non-interactive mode without --force', () => {
    const galleryDir = makeTempDir('overwrite-guard');
    copySingleFixture(galleryDir);

    runSourceCli(['init', '--photos', galleryDir, '--default']);

    const galleryJsonPath = path.join(galleryDir, 'gallery', 'gallery.json');
    const galleryData = JSON.parse(readFileSync(galleryJsonPath, 'utf8')) as { title: string };
    galleryData.title = 'Curated Title';
    writeFileSync(galleryJsonPath, JSON.stringify(galleryData, null, 2));

    const result = runSourceCli(['--verbose', 'init', '--photos', galleryDir, '--default'], { expectedStatus: 1 });
    expect(`${result.stdout}\n${result.stderr}`).toContain('Use --force');
    expect(JSON.parse(readFileSync(galleryJsonPath, 'utf8')).title).toBe('Curated Title');
  });

  test('refuses to copy separate photos during build in non-interactive mode without --yes', () => {
    const rootDir = makeTempDir('copy-guard');
    const photosDir = path.join(rootDir, 'photos');
    const outputDir = path.join(rootDir, 'site');
    copySingleFixture(photosDir);

    runSourceCli(['init', '--photos', photosDir, '--gallery', outputDir, '--default', '--theme', modernThemePath]);

    const result = runSourceCli(['build', '--gallery', outputDir], { expectedStatus: 1 });
    expect(`${result.stdout}\n${result.stderr}`).toContain('Use --yes');
    expect(existsSync(path.join(outputDir, 'index.html'))).toBe(false);
    expect(existsSync(path.join(outputDir, 'img_1.jpg'))).toBe(false);
  });

  test('preserves gallery.json when clean --all cannot confirm deletion', () => {
    const galleryDir = makeTempDir('clean-guard');
    copySingleFixture(galleryDir);

    runSourceCli(['init', '--photos', galleryDir, '--default']);
    const result = runSourceCli(['clean', '--gallery', galleryDir, '--all']);

    expect(result.status).toBe(0);
    expect(`${result.stdout}\n${result.stderr}`).toContain('Use --force');
    expect(existsSync(path.join(galleryDir, 'gallery', 'gallery.json'))).toBe(true);
  });
});

describe('CLI help, telemetry, and validation', () => {
  test('lists the public command surface in --help output', () => {
    const result = runSourceCli(['--help']);

    for (const command of ['init', 'thumbnails', 'build', 'clean', 'create-theme', 'telemetry']) {
      expect(result.stdout).toContain(command);
    }
  });

  test('lists key command options in command-specific help output', () => {
    const initHelp = runSourceCli(['init', '--help']).stdout;
    expect(initHelp).toContain('--photos');
    expect(initHelp).toContain('--gallery');
    expect(initHelp).toContain('--default');

    const buildHelp = runSourceCli(['build', '--help']).stdout;
    expect(buildHelp).toContain('--base-url');
    expect(buildHelp).toContain('--thumbs-base-url');
    expect(buildHelp).toContain('--no-thumbnails');
    expect(buildHelp).toContain('--no-scan');
    expect(buildHelp).toContain('--prune');
  });

  test('rejects invalid thumbnail and telemetry option values', () => {
    const badThumbnail = runSourceCli(['thumbnails', '--thumbnail-format', 'gif'], { expectedStatus: 1 });
    expect(`${badThumbnail.stdout}\n${badThumbnail.stderr}`).toContain('Thumbnail format must be one of');

    const tempDir = makeTempDir('bad-telemetry-cwd');
    const badTelemetry = runSourceCli(['--telemetry', '2', 'init', '--default'], {
      cwd: tempDir,
      expectedStatus: 1,
    });
    expect(`${badTelemetry.stdout}\n${badTelemetry.stderr}`).toContain('Telemetry option must be either 0 or 1');
    expect(existsSync(path.join(tempDir, 'gallery'))).toBe(false);
  });

  test('persists telemetry preferences through the telemetry command', () => {
    const home = isolatedHome('telemetry');

    expect(runSourceCli(['telemetry', '--state', '0'], { home }).stdout).toContain('Anonymous telemetry disabled');
    expect(runSourceCli(['telemetry'], { home }).stdout).toContain('Telemetry is currently disabled');
    expect(runSourceCli(['telemetry', '--state', '1'], { home }).stdout).toContain('Anonymous telemetry enabled');
    expect(runSourceCli(['telemetry'], { home }).stdout).toContain('Telemetry is currently enabled');
  });
});

describe('packaged CLI e2e smoke', () => {
  beforeAll(() => {
    const buildHome = mkdtempSync(path.join(os.tmpdir(), 'spg-cli-e2e-build-home-'));
    execFileSync(process.execPath, [yarnPath, 'build'], {
      cwd: testDir,
      env: buildEnv({ home: buildHome }),
      stdio: 'pipe',
      timeout: 180_000,
    });
    rmSync(buildHome, { recursive: true, force: true });
  }, 180_000);

  test('runs the built dist CLI version and help commands', () => {
    expect(runDistCli(['--version']).stdout.trim()).toBe(packageJson.version);

    const help = runDistCli(['--help']).stdout;
    expect(help).toContain('Simple Photo Gallery CLI');
    expect(help).toContain('create-theme');
  });

  test('creates a usable theme scaffold from the built dist CLI', () => {
    const tempDir = makeTempDir('dist-create-theme');
    const themeDir = path.join(tempDir, 'user-theme');

    runDistCli(['create-theme', 'user-theme', '--path', themeDir]);

    expect(JSON.parse(readFileSync(path.join(themeDir, 'package.json'), 'utf8')).name).toBe('user-theme');
    expect(readFileSync(path.join(themeDir, 'README.md'), 'utf8')).toContain('User Theme');
    expect(existsSync(path.join(themeDir, 'README_BASE.md'))).toBe(false);
    expect(existsSync(path.join(themeDir, 'src', 'pages', 'index.astro'))).toBe(true);
    expect(readdirSync(themeDir)).not.toContain('node_modules');
  });
});
