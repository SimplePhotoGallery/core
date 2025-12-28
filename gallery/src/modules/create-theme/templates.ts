/**
 * Template generators for theme files
 */

export function getPackageJson(themeName: string): string {
  return `{
  "name": "${themeName}",
  "version": "1.0.0",
  "description": "Custom theme for Simple Photo Gallery",
  "license": "MIT",
  "type": "module",
  "files": ["public", "src", "astro.config.ts", "tsconfig.json"],
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "lint": "eslint . --ext .astro,.js,.jsx,.ts,.tsx",
    "lint:fix": "eslint . --ext .astro,.js,.jsx,.ts,.tsx --fix",
    "format": "prettier --check './**/*.{js,jsx,ts,tsx,css,scss,md,json,astro}'",
    "format:fix": "prettier --write './**/*.{js,jsx,ts,tsx,css,scss,md,json,astro}'"
  },
  "dependencies": {
    "astro": "^5.11.0",
    "astro-relative-links": "^0.4.2",
    "blurhash": "^2.0.5",
    "marked": "^16.4.0",
    "photoswipe": "^5.4.4"
  },
  "peerDependencies": {
    "@simple-photo-gallery/common": "^1.0.5"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3.3.1",
    "@eslint/js": "^9.30.1",
    "@simple-photo-gallery/common": "^1.0.5",
    "@types/photoswipe": "^4.1.6",
    "@typescript-eslint/eslint-plugin": "^8.35.1",
    "@typescript-eslint/parser": "^8.35.1",
    "eslint": "^9.30.1",
    "eslint-config-prettier": "^10.1.5",
    "eslint-plugin-astro": "^1.3.1",
    "eslint-plugin-import": "^2.31.0",
    "prettier": "^3.4.2",
    "prettier-plugin-astro": "^0.14.1",
    "typescript": "^5.8.3"
  }
}
`;
}

export function getAstroConfig(): string {
  return `import fs from 'node:fs';
import path from 'node:path';

import { defineConfig } from 'astro/config';
import relativeLinks from 'astro-relative-links';

import type { AstroIntegration } from 'astro';

// Dynamically import gallery.json from source path or fallback to local
const sourceGalleryPath = process.env.GALLERY_JSON_PATH;
if (!sourceGalleryPath) throw new Error('GALLERY_JSON_PATH environment variable is not set');

const outputDir = process.env.GALLERY_OUTPUT_DIR || sourceGalleryPath.replace('gallery.json', '');

/**
 * Astro integration to prevent empty content collection files from being generated
 */
function preventEmptyContentFiles(): AstroIntegration {
  return {
    name: 'prevent-empty-content-files',
    hooks: {
      'astro:build:done': ({ dir }) => {
        const filesToRemove = ['content-assets.mjs', 'content-modules.mjs'];
        for (const fileName of filesToRemove) {
          const filePath = path.join(dir.pathname, fileName);
          if (fs.existsSync(filePath)) {
            try {
              const content = fs.readFileSync(filePath, 'utf8');
              if (content.trim() === 'export default new Map();' || content.trim() === '') {
                fs.unlinkSync(filePath);
              }
            } catch {
              // Silently ignore errors
            }
          }
        }
      },
    },
  };
}

export default defineConfig({
  output: 'static',
  outDir: outputDir + '/_build',
  build: {
    assets: 'assets',
    assetsPrefix: 'gallery',
  },
  integrations: [relativeLinks(), preventEmptyContentFiles()],
  publicDir: 'public',
  vite: {
    define: {
      'process.env.GALLERY_JSON_PATH': JSON.stringify(sourceGalleryPath),
    },
    build: {
      cssCodeSplit: false,
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },
  },
});
`;
}

export function getTsConfig(): string {
  return `{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@simple-photo-gallery/common/src/*": ["../../common/src/*"]
    }
  }
}
`;
}

export function getEslintConfig(): string {
  return `import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginAstro from 'eslint-plugin-astro';
import globals from 'globals';
import path from 'node:path';
import tseslint from 'typescript-eslint';

const tseslintConfig = tseslint.config(eslint.configs.recommended, tseslint.configs.recommended);

export default [
  {
    ignores: ['node_modules', '.astro', '**/dist/*', '**/public/*', '**/_build/**'],
  },
  ...tseslintConfig,
  eslintConfigPrettier,
  ...eslintPluginAstro.configs['flat/recommended'],
  {
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx,astro}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      'import/resolver': {
        alias: {
          map: [['@', path.resolve(import.meta.dirname, './src')]],
          extensions: ['.js', '.jsx', '.ts', '.d.ts', '.tsx', '.astro'],
        },
      },
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-explicit-any': ['warn'],
      '@typescript-eslint/consistent-type-imports': 'warn',
    },
  },
];
`;
}

export function getPrettierConfig(): string {
  return `/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
const config = {
  semi: true,
  printWidth: 125,
  tabWidth: 2,
  useTabs: false,
  singleQuote: true,
  endOfLine: 'lf',
  bracketSpacing: true,
  trailingComma: 'all',
  quoteProps: 'as-needed',
  bracketSameLine: true,
  plugins: ['prettier-plugin-astro'],
  overrides: [
    {
      files: '*.astro',
      options: {
        parser: 'astro',
      },
    },
  ],
};

export default config;
`;
}

export function getPrettierIgnore(): string {
  return `**/node_modules/*
**/dist/*
**/.astro/*
**/_build/**
`;
}

export function getGitIgnore(): string {
  return `node_modules/
dist/
.astro/
_build/
*.log
.DS_Store
`;
}

export function getReadme(themeName: string): string {
  return `# ${themeName} Theme

A custom theme for Simple Photo Gallery built with Astro.

## Development

\`\`\`bash
# Install dependencies
yarn install

# Start development server
yarn dev

# Build for production
yarn build

# Preview production build
yarn preview
\`\`\`

## Customization

Edit \`src/pages/index.astro\` to customize your theme. This is the main entry point that receives gallery data and renders your gallery.

## Building Galleries

To use this theme when building a gallery:

\`\`\`bash
# 1. Initialize a gallery from your images folder
spg init -p <path-to-images-folder> -g <gallery-output-folder>

# 2. Generate thumbnails (optional but recommended)
spg thumbnails -g <gallery-output-folder>

# 3. Build the gallery with your theme
spg build --theme ./themes/${themeName} -g <gallery-output-folder>

# Or if published to npm
spg build --theme @your-org/theme-${themeName} -g <gallery-output-folder>
\`\`\`

## Structure

- \`src/pages/index.astro\` - Main gallery page
- \`src/layouts/\` - Layout components (MainHead, MainLayout)
- \`src/components/\` - Reusable components (Hero)
- \`src/lib/\` - Utility libraries (markdown, photoswipe-video-plugin)
- \`src/utils/\` - Helper functions for paths and resources
- \`public/\` - Static assets
`;
}

export function getMainHead(): string {
  return `---
import type { GalleryMetadata } from '@simple-photo-gallery/common/src/gallery';

interface Props {
  title: string;
  description?: string;
  url?: string;
  thumbsBaseUrl?: string;
  metadata?: GalleryMetadata;
  headerImageBasename?: string;
}

const { title, description, url, thumbsBaseUrl, metadata, headerImageBasename } = Astro.props;

// Use headerImageBasename for dynamic image paths, fallback to generic name
const imgBasename = headerImageBasename || 'header';

// Get the base path for the thumbnails
const thumbnailBasePath = thumbsBaseUrl || 'gallery/images';
---

<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title}</title>

  <base href="/" />

  {/* Basic SEO */}
  <meta name="description" content={description} />
  {metadata?.keywords && <meta name="keywords" content={metadata.keywords} />}
  {metadata?.author && <meta name="author" content={metadata.author} />}
  {metadata?.canonicalUrl || (url && <link rel="canonical" href={metadata?.canonicalUrl || url} />)}

  {/* Open Graph */}
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  {metadata?.image && <meta property="og:image" content={metadata.image} />}
  {metadata?.ogUrl || (url && <meta property="og:url" content={metadata?.ogUrl || url} />)}

  {/* Twitter */}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  {metadata?.image && <meta name="twitter:image" content={metadata.image} />}

  {headerImageBasename && (
    <>
      <link
        rel="preload"
        as="image"
        type="image/avif"
        media="(max-aspect-ratio: 3/4)"
        imagesrcset={\`\${thumbnailBasePath}/\${imgBasename}_portrait_360.avif 360w, \${thumbnailBasePath}/\${imgBasename}_portrait_480.avif 480w, \${thumbnailBasePath}/\${imgBasename}_portrait_720.avif 720w, \${thumbnailBasePath}/\${imgBasename}_portrait_1080.avif 1080w\`}
        imagesizes="(max-aspect-ratio: 3/4) 160vw, 100vw"
        fetchpriority="high"
      />
      <link
        rel="preload"
        as="image"
        type="image/avif"
        media="(min-aspect-ratio: 3/4)"
        imagesrcset={\`\${thumbnailBasePath}/\${imgBasename}_landscape_640.avif 640w, \${thumbnailBasePath}/\${imgBasename}_landscape_960.avif 960w, \${thumbnailBasePath}/\${imgBasename}_landscape_1280.avif 1280w, \${thumbnailBasePath}/\${imgBasename}_landscape_1920.avif 1920w, \${thumbnailBasePath}/\${imgBasename}_landscape_2560.avif 2560w, \${thumbnailBasePath}/\${imgBasename}_landscape_3840.avif 3840w\`}
        imagesizes="100vw"
        fetchpriority="high"
      />
    </>
  )}
</head>
`;
}

export function getMainLayout(): string {
  return `---
import path from 'node:path';

import MainHead from '@/layouts/MainHead.astro';

import type { GalleryMetadata } from '@simple-photo-gallery/common/src/gallery';

interface Props {
  title: string;
  description?: string;
  url?: string;
  thumbsBaseUrl?: string;
  metadata?: GalleryMetadata;
  analyticsScript?: string;
  headerImage?: string;
}

const { title, description, metadata, url, thumbsBaseUrl, analyticsScript, headerImage } = Astro.props;

// Extract basename from headerImage filename
const headerImageBasename = headerImage ? path.basename(headerImage, path.extname(headerImage)) : undefined;
---

<!doctype html>
<html lang={metadata?.language || 'en'}>
  <MainHead title={title} description={description} metadata={metadata} url={url} thumbsBaseUrl={thumbsBaseUrl} headerImageBasename={headerImageBasename} />
  <body>
    <slot />

    {analyticsScript && <Fragment set:html={analyticsScript} />}
  </body>
</html>

<style is:global>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #333;
  }

  /* TODO: Add your custom styles here */
</style>
`;
}

export function getHeroComponent(): string {
  return `---
import path from 'node:path';

import { getPhotoPath } from '@/utils';
import { renderMarkdown } from '@/lib/markdown';

interface Props {
  title: string;
  description?: string;
  thumbsBaseUrl?: string;
  headerImage?: string;
  headerImageBlurHash?: string;
  mediaBaseUrl?: string;
}

const { title, description, thumbsBaseUrl, headerImage, headerImageBlurHash, mediaBaseUrl } = Astro.props;

// Parse description as Markdown if it exists
const parsedDescription: string = description ? await renderMarkdown(description) : '';

// Extract basename from headerImage filename, fallback to generic name
const imgBasename = headerImage ? path.basename(headerImage, path.extname(headerImage)) : 'header';

// Get the base path for the thumbnails
const thumbnailBasePath = thumbsBaseUrl || 'gallery/images';

// Original header photo (fallback)
const headerPhotoPath = getPhotoPath(headerImage || '', mediaBaseUrl);

const portraitWidths = [360, 480, 720, 1080] as const;
const landscapeWidths = [640, 960, 1280, 1920, 2560, 3840] as const;

const portraitAvifSrcset = portraitWidths
  .map((w) => thumbnailBasePath + '/' + imgBasename + '_portrait_' + w + '.avif ' + w + 'w')
  .join(', ');
const portraitJpgSrcset = portraitWidths
  .map((w) => thumbnailBasePath + '/' + imgBasename + '_portrait_' + w + '.jpg ' + w + 'w')
  .join(', ');

const landscapeAvifSrcset = landscapeWidths
  .map((w) => thumbnailBasePath + '/' + imgBasename + '_landscape_' + w + '.avif ' + w + 'w')
  .join(', ');
const landscapeJpgSrcset = landscapeWidths
  .map((w) => thumbnailBasePath + '/' + imgBasename + '_landscape_' + w + '.jpg ' + w + 'w')
  .join(', ');
---

{
  headerImage ? (
  <section class="hero">
    <div class="hero__bg-wrapper">
      {headerImageBlurHash && <canvas data-blur-hash={headerImageBlurHash} width={32} height={32} />}
      <picture class="hero__bg" id="hero-bg-picture">
        {/* Portrait */}
        <source
          type="image/avif"
          media="(max-aspect-ratio: 3/4)"
          srcset={portraitAvifSrcset}
          sizes="(max-aspect-ratio: 3/4) 160vw, 100vw"
        />
        <source
          type="image/jpeg"
          media="(max-aspect-ratio: 3/4)"
          srcset={portraitJpgSrcset}
          sizes="(max-aspect-ratio: 3/4) 160vw, 100vw"
        />

        {/* Landscape */}
        <source type="image/avif" srcset={landscapeAvifSrcset} sizes="100vw" />
        <source type="image/jpeg" srcset={landscapeJpgSrcset} sizes="100vw" />

        {/* Fallback */}
        <img src={headerPhotoPath} class="hero__bg-img" alt="" />
      </picture>
    </div>
    <div class="hero__overlay"></div>
    <div class="hero__content">
      <h1 class="hero__title">{title}</h1>
      {parsedDescription && <div class="hero__description markdown-content" set:html={parsedDescription} />}
    </div>
  </section>
  ) : (
  <header class="header">
    <h1>{title}</h1>
    {parsedDescription && <div class="description markdown-content" set:html={parsedDescription} />}
  </header>
  )
}

<script>
  import { decode } from 'blurhash';

  const picture = document.querySelector('#hero-bg-picture');
  const img = picture?.querySelector<HTMLImageElement>('img.hero__bg-img');
  const canvas = document.querySelector<HTMLCanvasElement>('canvas[data-blur-hash]');

  // Decode blurhash (if present)
  if (canvas) {
    const blurHashValue = canvas.dataset.blurHash;
    if (blurHashValue) {
      const pixels = decode(blurHashValue, 32, 32);
      const ctx = canvas.getContext('2d');
      if (pixels && ctx) {
        const imageData = new ImageData(new Uint8ClampedArray(pixels), 32, 32);
        ctx.putImageData(imageData, 0, 0);
      }
    }
  }

  if (!img) {
    // No hero image element found
  } else {
    const fallbackSrc = img.getAttribute('src') || '';
    let didFallback = false;

    const hideBlurhash = () => {
      if (canvas) {
        canvas.style.display = 'none';
      }
    };

    const doFallback = () => {
      if (didFallback) return;
      didFallback = true;

      if (picture) {
        // Remove all <source> elements so the browser does not retry them
        for (const sourceEl of picture.querySelectorAll('source')) {
          sourceEl.remove();
        }
      }

      // Force reload using the <img> src as the final fallback
      const current = img.getAttribute('src') || '';
      img.setAttribute('src', '');
      img.setAttribute('src', fallbackSrc || current);
    };

    // Check if image already loaded or failed before script runs
    if (img.complete) {
      if (img.naturalWidth === 0) {
        doFallback();
      } else {
        hideBlurhash();
      }
    } else {
      img.addEventListener('load', hideBlurhash, { once: true });
    }

    img.addEventListener('error', doFallback, { once: true });
  }
</script>

<style>
  /* Hero/Header Image Styles */
  .hero {
    position: relative;
    min-height: 400px;
    height: 60vh;
    max-height: 600px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .hero__bg-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  .hero__bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  .hero__bg-wrapper canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: block;
    z-index: 1;
    transition: transform 0.5s ease;
  }

  .hero__bg-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }

  .hero__overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.4);
    z-index: 5;
  }

  .hero__content {
    position: relative;
    z-index: 10;
    text-align: center;
    color: white;
    max-width: 64rem;
    padding: 0 1.5rem;
  }

  .hero__title {
    font-size: clamp(2rem, 5vw, 4rem);
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
    margin-bottom: 1rem;
    font-weight: 700;
  }

  .hero__description {
    font-size: clamp(1rem, 2vw, 1.5rem);
    opacity: 0.95;
    line-height: 1.6;
    color: white;
  }

  .hero__description.markdown-content a {
    color: #e5e7eb;
    text-decoration: underline;
  }

  .hero__description.markdown-content a:hover {
    color: #f9fafb;
  }

  /* Simple header (when no header image) */
  .header {
    text-align: center;
    padding: 3rem 2rem;
  }

  .header h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }

  .header .description {
    font-size: 1.1rem;
    color: #666;
    max-width: 800px;
    margin: 0 auto;
  }
</style>
`;
}

export function getIndexPage(): string {
  return `---
import fs from 'node:fs';

import MainLayout from '@/layouts/MainLayout.astro';
import Hero from '@/components/Hero.astro';
import { getPhotoPath, getThumbnailPath } from '@/utils';

import type { GalleryData } from '@simple-photo-gallery/common/src/gallery';

// Read gallery.json from the path provided by the build process
const galleryJsonPath = process.env.GALLERY_JSON_PATH || './gallery.json';
const galleryData = JSON.parse(fs.readFileSync(galleryJsonPath, 'utf8'));
const gallery = galleryData as GalleryData;

const { title, description, sections, mediaBaseUrl, thumbsBaseUrl, headerImage, headerImageBlurHash } = gallery;
---

<MainLayout title={title} description={description} metadata={gallery.metadata} url={gallery.url} thumbsBaseUrl={thumbsBaseUrl} analyticsScript={gallery.analyticsScript} headerImage={headerImage}>
  <Hero
    title={title}
    description={description}
    thumbsBaseUrl={thumbsBaseUrl}
    headerImage={headerImage}
    headerImageBlurHash={headerImageBlurHash}
    mediaBaseUrl={mediaBaseUrl}
  />

  <main>

    {/* Render gallery sections */}
    {sections.map((section) => (
      <section class="gallery-section">
        {section.title && <h2>{section.title}</h2>}
        {section.description && <p>{section.description}</p>}

        <div class="gallery-grid">
          {section.images.map((image) => {
            const imagePath = getPhotoPath(image.filename, mediaBaseUrl, image.url);
            const thumbnailPath = image.thumbnail
              ? getThumbnailPath(image.thumbnail.path, thumbsBaseUrl, image.thumbnail.baseUrl)
              : imagePath;

            const thumbnailSrcSet = image.thumbnail
              ? getThumbnailPath(image.thumbnail.path, thumbsBaseUrl, image.thumbnail.baseUrl) +
                ' 1x, ' +
                getThumbnailPath(image.thumbnail.pathRetina, thumbsBaseUrl, image.thumbnail.baseUrl) +
                ' 2x'
              : undefined;

            return (
              <a
                href={imagePath}
                data-pswp-width={image.width}
                data-pswp-height={image.height}
                data-pswp-type={image.type}
                data-pswp-caption={image.alt || ''}
                class="gallery-item">
                <img
                  src={thumbnailPath}
                  srcset={thumbnailSrcSet}
                  alt={image.alt || ''}
                  loading="lazy"
                  width={image.thumbnail?.width}
                  height={image.thumbnail?.height}
                />
                {image.alt && <span class="caption">{image.alt}</span>}
              </a>
            );
          })}
        </div>
      </section>
    ))}
  </main>
</MainLayout>

<script>
  import PhotoSwipe from 'photoswipe';
  import PhotoSwipeLightbox from 'photoswipe/lightbox';

  import PhotoSwipeVideoPlugin from '@/lib/photoswipe-video-plugin';
  import 'photoswipe/style.css';

  // Initialize PhotoSwipe lightbox
  const lightbox = new PhotoSwipeLightbox({
    gallery: '.gallery-grid',
    children: 'a',
    pswpModule: PhotoSwipe,
    showAnimationDuration: 300,
    hideAnimationDuration: 300,
    wheelToZoom: true,
    loop: false,
    bgOpacity: 1,
  });

  // Add video plugin support
  new PhotoSwipeVideoPlugin(lightbox);

  // Initialize the lightbox
  lightbox.init();
</script>

<style>
  main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  header {
    margin-bottom: 3rem;
    text-align: center;
  }

  h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }

  .description {
    font-size: 1.1rem;
    color: #666;
    max-width: 800px;
    margin: 0 auto;
  }

  .gallery-section {
    margin-bottom: 4rem;
  }

  .gallery-section h2 {
    font-size: 2rem;
    margin-bottom: 1rem;
  }

  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
    margin-top: 2rem;
  }

  .gallery-item {
    position: relative;
    display: block;
    overflow: hidden;
    border-radius: 8px;
    cursor: pointer;
    aspect-ratio: 1;
  }

  .gallery-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  .gallery-item:hover img {
    transform: scale(1.05);
  }

  .caption {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
    color: white;
    padding: 1rem;
    font-size: 0.9rem;
  }

  /* TODO: Customize styles to match your design */
</style>
`;
}

export function getMarkdownLib(): string {
  return `import { marked } from 'marked';

// Configure marked to only allow specific formatting options
const renderer = new marked.Renderer();

// Disable headings by rendering them as paragraphs
renderer.heading = ({ text }: { text: string }) => {
  return '<p>' + text + '</p>\\n';
};

// Disable images
renderer.image = () => '';

// Disable HTML
renderer.html = () => '';

// Disable tables
renderer.table = () => '';
renderer.tablerow = () => '';
renderer.tablecell = () => '';

// Configure marked options
marked.use({
  renderer: renderer,
  breaks: true,
  gfm: true,
});

/**
 * Renders markdown with limited formatting options.
 * Supported: paragraphs, bold, italic, lists, code blocks, blockquotes, links
 * Disabled: headings (rendered as paragraphs), images, HTML, tables
 */
export async function renderMarkdown(markdown: string): Promise<string> {
  if (!markdown) return '';
  return await marked.parse(markdown);
}
`;
}

export function getPhotoswipeVideoPlugin(): string {
  return `import type PhotoSwipe from 'photoswipe';
import type PhotoSwipeLightbox from 'photoswipe/lightbox';

interface Slide {
  content: Content;
  height: number;
  currZoomLevel: number;
  bounds: { center: { y: number } };
  placeholder?: { element: HTMLElement };
  isActive: boolean;
}

interface Content {
  data: SlideData;
  element?: HTMLVideoElement | HTMLImageElement | HTMLDivElement;
  state?: string;
  type?: string;
  isAttached?: boolean;
  onLoaded?: () => void;
  appendImage?: () => void;
  slide?: Slide;
  _videoPosterImg?: HTMLImageElement;
}

interface SlideData {
  type?: string;
  msrc?: string;
  videoSrc?: string;
  videoSources?: Array<{ src: string; type: string }>;
}

interface VideoPluginOptions {
  videoAttributes?: Record<string, string>;
  autoplay?: boolean;
  preventDragOffset?: number;
}

interface EventData {
  content?: Content;
  slide?: Slide;
  width?: number;
  height?: number;
  originalEvent?: PointerEvent;
  preventDefault?: () => void;
}

const defaultOptions: VideoPluginOptions = {
  videoAttributes: { controls: '', playsinline: '', preload: 'auto' },
  autoplay: true,
  preventDragOffset: 40,
};

/**
 * Check if slide has video content
 */
function isVideoContent(content: Content | Slide): boolean {
  return content && 'data' in content && content.data && content.data.type === 'video';
}

class VideoContentSetup {
  private options: VideoPluginOptions;

  constructor(lightbox: PhotoSwipeLightbox, options: VideoPluginOptions) {
    this.options = options;

    this.initLightboxEvents(lightbox);
    lightbox.on('init', () => {
      if (lightbox.pswp) {
        this.initPswpEvents(lightbox.pswp);
      }
    });
  }

  private initLightboxEvents(lightbox: PhotoSwipeLightbox): void {
    lightbox.on('contentLoad', (data: unknown) => this.onContentLoad(data as EventData));
    lightbox.on('contentDestroy', (data: unknown) => this.onContentDestroy(data as { content: Content }));
    lightbox.on('contentActivate', (data: unknown) => this.onContentActivate(data as { content: Content }));
    lightbox.on('contentDeactivate', (data: unknown) => this.onContentDeactivate(data as { content: Content }));
    lightbox.on('contentAppend', (data: unknown) => this.onContentAppend(data as EventData));
    lightbox.on('contentResize', (data: unknown) => this.onContentResize(data as EventData));

    lightbox.addFilter('isKeepingPlaceholder', (value: unknown, ...args: unknown[]) =>
      this.isKeepingPlaceholder(value as boolean, args[0] as Content),
    );
    lightbox.addFilter('isContentZoomable', (value: unknown, ...args: unknown[]) =>
      this.isContentZoomable(value as boolean, args[0] as Content),
    );
    lightbox.addFilter('useContentPlaceholder', (value: unknown, ...args: unknown[]) =>
      this.useContentPlaceholder(value as boolean, args[0] as Content),
    );

    lightbox.addFilter('domItemData', (value: unknown, ...args: unknown[]) => {
      const itemData = value as Record<string, unknown>;
      const linkEl = args[1] as HTMLAnchorElement;

      if (itemData.type === 'video' && linkEl) {
        if (linkEl.dataset.pswpVideoSources) {
          itemData.videoSources = JSON.parse(linkEl.dataset.pswpVideoSources);
        } else if (linkEl.dataset.pswpVideoSrc) {
          itemData.videoSrc = linkEl.dataset.pswpVideoSrc;
        } else {
          itemData.videoSrc = linkEl.href;
        }
      }
      return itemData;
    });
  }

  private initPswpEvents(pswp: PhotoSwipe): void {
    pswp.on('pointerDown', (data: unknown) => {
      const e = data as EventData;
      const slide = pswp.currSlide as Slide | undefined;
      if (slide && isVideoContent(slide) && this.options.preventDragOffset) {
        const origEvent = e.originalEvent;
        if (origEvent && origEvent.type === 'pointerdown') {
          const videoHeight = Math.ceil(slide.height * slide.currZoomLevel);
          const verticalEnding = videoHeight + slide.bounds.center.y;
          const pointerYPos = origEvent.pageY - pswp.offset.y;
          if (pointerYPos > verticalEnding - this.options.preventDragOffset! && pointerYPos < verticalEnding) {
            e.preventDefault?.();
          }
        }
      }
    });

    pswp.on('appendHeavy', (data: unknown) => {
      const e = data as EventData;
      if (e.slide && isVideoContent(e.slide) && !e.slide.isActive) {
        e.preventDefault?.();
      }
    });

    pswp.on('close', () => {
      const slide = pswp.currSlide as Slide | undefined;
      if (slide && isVideoContent(slide.content)) {
        if (!pswp.options.showHideAnimationType || pswp.options.showHideAnimationType === 'zoom') {
          pswp.options.showHideAnimationType = 'fade';
        }
        this.pauseVideo(slide.content);
      }
    });
  }

  private onContentDestroy({ content }: { content: Content }): void {
    if (isVideoContent(content) && content._videoPosterImg) {
      const handleLoad = () => {
        if (content._videoPosterImg) {
          content._videoPosterImg.removeEventListener('error', handleError);
        }
      };
      const handleError = () => {
        // Error handler
      };

      content._videoPosterImg.addEventListener('load', handleLoad);
      content._videoPosterImg.addEventListener('error', handleError);
      content._videoPosterImg = undefined;
    }
  }

  private onContentResize(e: EventData): void {
    if (e.content && isVideoContent(e.content)) {
      e.preventDefault?.();

      const width = e.width!;
      const height = e.height!;
      const content = e.content;

      if (content.element) {
        content.element.style.width = width + 'px';
        content.element.style.height = height + 'px';
      }

      if (content.slide && content.slide.placeholder) {
        const placeholderElStyle = content.slide.placeholder.element.style;
        placeholderElStyle.transform = 'none';
        placeholderElStyle.width = width + 'px';
        placeholderElStyle.height = height + 'px';
      }
    }
  }

  private isKeepingPlaceholder(isZoomable: boolean, content: Content): boolean {
    if (isVideoContent(content)) {
      return false;
    }
    return isZoomable;
  }

  private isContentZoomable(isZoomable: boolean, content: Content): boolean {
    if (isVideoContent(content)) {
      return false;
    }
    return isZoomable;
  }

  private onContentActivate({ content }: { content: Content }): void {
    if (isVideoContent(content) && this.options.autoplay) {
      this.playVideo(content);
    }
  }

  private onContentDeactivate({ content }: { content: Content }): void {
    if (isVideoContent(content)) {
      this.pauseVideo(content);
    }
  }

  private onContentAppend(e: EventData): void {
    if (e.content && isVideoContent(e.content)) {
      e.preventDefault?.();
      e.content.isAttached = true;
      e.content.appendImage?.();
    }
  }

  private onContentLoad(e: EventData): void {
    const content = e.content!;

    if (!isVideoContent(content)) {
      return;
    }

    e.preventDefault?.();

    if (content.element) {
      return;
    }

    content.state = 'loading';
    content.type = 'video';

    content.element = document.createElement('video');

    if (this.options.videoAttributes) {
      for (const key in this.options.videoAttributes) {
        content.element.setAttribute(key, this.options.videoAttributes[key] || '');
      }
    }

    content.element.setAttribute('poster', content.data.msrc || '');

    this.preloadVideoPoster(content, content.data.msrc);

    content.element.style.position = 'absolute';
    content.element.style.left = '0';
    content.element.style.top = '0';

    if (content.data.videoSources) {
      for (const source of content.data.videoSources) {
        const sourceEl = document.createElement('source');
        sourceEl.src = source.src;
        sourceEl.type = source.type;
        content.element.append(sourceEl);
      }
    } else if (content.data.videoSrc) {
      content.element.src = content.data.videoSrc;
    }
  }

  private preloadVideoPoster(content: Content, src?: string): void {
    if (!content._videoPosterImg && src) {
      content._videoPosterImg = new Image();
      content._videoPosterImg.src = src;
      if (content._videoPosterImg.complete) {
        content.onLoaded?.();
      } else {
        content._videoPosterImg.addEventListener('load', () => {
          content.onLoaded?.();
        });
        content._videoPosterImg.addEventListener('error', () => {
          content.onLoaded?.();
        });
      }
    }
  }

  private playVideo(content: Content): void {
    if (content.element) {
      (content.element as HTMLVideoElement).play();
    }
  }

  private pauseVideo(content: Content): void {
    if (content.element) {
      (content.element as HTMLVideoElement).pause();
    }
  }

  private useContentPlaceholder(usePlaceholder: boolean, content: Content): boolean {
    if (isVideoContent(content)) {
      return true;
    }
    return usePlaceholder;
  }
}

class PhotoSwipeVideoPlugin {
  constructor(lightbox: PhotoSwipeLightbox, options: VideoPluginOptions = {}) {
    new VideoContentSetup(lightbox, {
      ...defaultOptions,
      ...options,
    });
  }
}

export default PhotoSwipeVideoPlugin;
export type { VideoPluginOptions };
`;
}

export function getUtilsIndex(): string {
  return `import path from 'node:path';

/**
 * Normalizes resource paths to be relative to the gallery root directory.
 *
 * @param resourcePath - The resource path (file or directory), typically relative to the gallery.json file
 * @returns The normalized path relative to the gallery root directory
 */
export const getRelativePath = (resourcePath: string) => {
  const galleryConfigPath = path.resolve(process.env.GALLERY_JSON_PATH || '');
  const galleryConfigDir = path.dirname(galleryConfigPath);

  const absoluteResourcePath = path.resolve(path.join(galleryConfigDir, resourcePath));
  const baseDir = path.dirname(galleryConfigDir);

  return path.relative(baseDir, absoluteResourcePath);
};

/**
 * Get the path to a thumbnail that is relative to the gallery root directory or the thumbnails base URL.
 *
 * @param resourcePath - The resource path (file or directory), typically relative to the gallery.json file
 * @param thumbsBaseUrl - The base URL for the thumbnails (gallery-level)
 * @param thumbnailBaseUrl - Optional thumbnail-specific base URL that overrides thumbsBaseUrl if provided
 * @returns The normalized path relative to the gallery root directory or the thumbnails base URL
 */
export const getThumbnailPath = (resourcePath: string, thumbsBaseUrl?: string, thumbnailBaseUrl?: string) => {
  // If thumbnail-specific baseUrl is provided, use it and combine with the path
  if (thumbnailBaseUrl) {
    return \`\${thumbnailBaseUrl}/\${resourcePath}\`;
  }
  // Otherwise, use the gallery-level thumbsBaseUrl if provided
  return thumbsBaseUrl ? \`\${thumbsBaseUrl}/\${resourcePath}\` : \`gallery/images/\${path.basename(resourcePath)}\`;
};

/**
 * Get the path to a photo that is always in the gallery root directory.
 *
 * @param filename - The filename to get the path for
 * @param mediaBaseUrl - The base URL for the media
 * @param url - Optional URL that, if provided, will be used directly regardless of base URL or path
 * @returns The normalized path relative to the gallery root directory, or the provided URL
 */
export const getPhotoPath = (filename: string, mediaBaseUrl?: string, url?: string) => {
  // If url is provided, always use it regardless of base URL or path
  if (url) {
    return url;
  }

  return mediaBaseUrl ? \`\${mediaBaseUrl}/\${filename}\` : filename;
};

/**
 * Get the path to a subgallery thumbnail that is always in the subgallery directory.
 *
 * @param subgalleryHeaderImagePath - The path to the subgallery header image on the hard disk
 * @returns The normalized path relative to the subgallery directory
 */
export const getSubgalleryThumbnailPath = (subgalleryHeaderImagePath: string) => {
  const photoBasename = path.basename(subgalleryHeaderImagePath);
  const subgalleryFolderName = path.basename(path.dirname(subgalleryHeaderImagePath));

  return path.join(subgalleryFolderName, 'gallery', 'thumbnails', photoBasename);
};
`;
}
