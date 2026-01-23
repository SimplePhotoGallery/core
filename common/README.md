# @simple-photo-gallery/common

Shared utilities and types for Simple Photo Gallery themes and CLI.

## Installation

```bash
npm install @simple-photo-gallery/common
```

## Package Exports

- `.` - Gallery types and Zod validation schemas
- `./theme` - Theme utilities for data loading and resolution
- `./client` - Browser-side utilities (PhotoSwipe, blurhash, CSS)
- `./styles/photoswipe` - PhotoSwipe CSS bundle

---

## Theme Module (`@simple-photo-gallery/common/theme`)

Theme utilities for loading and transforming gallery data.

### Data Loading

#### `loadGalleryData(path, options?)`

Loads and optionally validates gallery.json.

```typescript
function loadGalleryData(
  galleryJsonPath?: string,
  options?: LoadGalleryDataOptions
): GalleryData
```

**Parameters:**
- `galleryJsonPath` (optional): Path to gallery.json file. Defaults to `'./gallery.json'`
- `options` (optional):
  - `validate?: boolean` - Enable Zod schema validation (default: `false`)

**Returns:** Raw `GalleryData` object

**Throws:** Error if file cannot be read, parsed, or fails validation

**Example:**
```typescript
import { loadGalleryData } from '@simple-photo-gallery/common/theme';

// Basic usage (no validation)
const gallery = loadGalleryData('./gallery.json');

// With schema validation
const gallery = loadGalleryData('./gallery.json', { validate: true });
```

---

#### `resolveGalleryData(data, options?)`

Transforms raw data into fully-resolved structure with pre-computed paths and parsed markdown.

```typescript
async function resolveGalleryData(
  data: GalleryData,
  options?: ResolveGalleryDataOptions
): Promise<ResolvedGalleryData>
```

**Parameters:**
- `data`: Raw `GalleryData` object (from `loadGalleryData()`)
- `options` (optional):
  - `galleryJsonPath?: string` - Path to gallery.json, enables relative path resolution for sub-galleries

**Returns:** `ResolvedGalleryData` with:
- Pre-computed image and thumbnail paths
- Built responsive image srcsets for hero
- Parsed markdown descriptions as HTML
- Computed properties for sub-galleries

**Example:**
```typescript
import { loadGalleryData, resolveGalleryData } from '@simple-photo-gallery/common/theme';

const raw = loadGalleryData('./gallery.json', { validate: true });
const gallery = await resolveGalleryData(raw, { galleryJsonPath: './gallery.json' });

// Access resolved data
console.log(gallery.hero.src);           // Pre-computed hero path
console.log(gallery.hero.srcsets);       // Responsive srcsets
console.log(gallery.sections[0].parsedDescription);  // HTML from markdown
```

---

### Path Utilities

#### `getPhotoPath(filename, baseUrl?, url?)`

Resolves media file path with optional base URL.

```typescript
function getPhotoPath(
  filename: string,
  baseUrl?: string,
  url?: string
): string
```

---

#### `getThumbnailPath(path, baseUrl?, thumbBaseUrl?)`

Resolves thumbnail path with optional base URL.

```typescript
function getThumbnailPath(
  path: string,
  baseUrl?: string,
  thumbBaseUrl?: string
): string
```

---

#### `buildHeroSrcset(variants?, sizes, basePath, basename, orientation, format, useDefault?)`

Builds responsive image srcset string for hero images.

```typescript
function buildHeroSrcset(
  variants: string[] | undefined,
  sizes: readonly number[],
  basePath: string,
  basename: string,
  orientation: 'landscape' | 'portrait',
  format: 'avif' | 'jpg',
  useDefaultPaths: boolean
): string
```

---

#### `getRelativePath(to, from)`

Computes relative path between two locations.

```typescript
function getRelativePath(to: string, from: string): string
```

---

#### `getSubgalleryThumbnailPath(headerImage)`

Computes thumbnail path for sub-gallery header images.

```typescript
function getSubgalleryThumbnailPath(headerImage: string): string
```

---

### Utilities

#### `renderMarkdown(markdown)`

Parses markdown to HTML with limited formatting (no headings, images, HTML, or tables).

```typescript
async function renderMarkdown(markdown: string): Promise<string>
```

**Example:**
```typescript
import { renderMarkdown } from '@simple-photo-gallery/common/theme';

const html = await renderMarkdown('**Bold** and *italic* text');
// Returns: '<p><strong>Bold</strong> and <em>italic</em> text</p>'
```

---

#### `preventEmptyContentFiles()`

Astro integration that removes empty content collection files after build.

```typescript
function preventEmptyContentFiles(): AstroIntegration
```

**Example:**
```typescript
// In astro.config.ts
import { preventEmptyContentFiles } from '@simple-photo-gallery/common/theme';

export default defineConfig({
  integrations: [preventEmptyContentFiles()],
});
```

---

### Constants

#### `LANDSCAPE_SIZES`

Responsive image sizes for landscape-oriented hero images.

```typescript
const LANDSCAPE_SIZES: readonly number[] = [400, 800, 1200, 1600, 2400];
```

#### `PORTRAIT_SIZES`

Responsive image sizes for portrait-oriented hero images.

```typescript
const PORTRAIT_SIZES: readonly number[] = [400, 800, 1200];
```

---

### Types

#### `ResolvedGalleryData`

Fully resolved gallery structure ready for rendering.

```typescript
interface ResolvedGalleryData {
  hero: ResolvedHero;
  sections: ResolvedSection[];
  subGalleries?: ResolvedSubGallery[];
  // ... other metadata
}
```

#### `ResolvedHero`

Hero section with pre-computed srcsets and paths.

```typescript
interface ResolvedHero {
  title: string;
  description: string;
  parsedDescription: string;
  src: string;
  blurHash?: string;
  srcsets: {
    portraitAvif: string;
    portraitJpg: string;
    landscapeAvif: string;
    landscapeJpg: string;
  };
  // ... other properties
}
```

#### `ResolvedSection`

Gallery section with resolved image paths and parsed markdown.

```typescript
interface ResolvedSection {
  title?: string;
  description?: string;
  parsedDescription: string;
  images: ResolvedImage[];
}
```

#### `ResolvedImage`

Individual image with computed paths and optional thumbnail srcsets.

```typescript
interface ResolvedImage {
  type: 'image' | 'video';
  filename: string;
  alt?: string;
  width: number;
  height: number;
  imagePath: string;
  thumbnailPath: string;
  thumbnailSrcSet?: string;
  thumbnailWidth?: number;
  thumbnailHeight?: number;
  blurHash?: string;
}
```

#### `ResolvedSubGallery`

Sub-gallery with computed thumbnail paths.

```typescript
interface ResolvedSubGallery {
  title: string;
  headerImage: string;
  path: string;
  thumbnailPath: string;
  resolvedPath?: string;
}
```

#### `LoadGalleryDataOptions`

Options for `loadGalleryData()`.

```typescript
interface LoadGalleryDataOptions {
  validate?: boolean;
}
```

#### `ResolveGalleryDataOptions`

Options for `resolveGalleryData()`.

```typescript
interface ResolveGalleryDataOptions {
  galleryJsonPath?: string;
}
```

---

## Client Module (`@simple-photo-gallery/common/client`)

Browser-side utilities for client-side functionality.

### Blurhash

#### `decodeAllBlurhashes()`

Decodes all blurhash canvases on the page (elements with `data-blurhash` attribute).

```typescript
function decodeAllBlurhashes(): void
```

**Example:**
```typescript
import { decodeAllBlurhashes } from '@simple-photo-gallery/common/client';

// In your client-side script
decodeAllBlurhashes();
```

**HTML:**
```html
<canvas data-blurhash="LGF5]+Yk^6#M..." width="32" height="32"></canvas>
```

---

#### `decodeBlurhashToCanvas(canvas, blurhash)`

Decodes a single blurhash to a canvas element.

```typescript
function decodeBlurhashToCanvas(
  canvas: HTMLCanvasElement,
  blurhash: string
): void
```

---

### PhotoSwipe

#### `createGalleryLightbox(options?)`

Creates a configured PhotoSwipe lightbox instance with video support.

```typescript
function createGalleryLightbox(
  options?: GalleryLightboxOptions
): PhotoSwipeLightbox
```

**Parameters:**
- `options` (optional):
  - `gallery?: string` - Gallery element selector (default: `'#gallery'`)
  - `children?: string` - Child elements selector (default: `'a'`)
  - `pswpModule?: typeof PhotoSwipe` - PhotoSwipe module (default: imported PhotoSwipe)
  - `videoPlugin?: VideoPluginOptions` - Video plugin configuration

**Returns:** Configured PhotoSwipe lightbox instance (call `.init()` to activate)

**Example:**
```typescript
import { createGalleryLightbox } from '@simple-photo-gallery/common/client';

const lightbox = createGalleryLightbox({
  gallery: '#my-gallery',
  children: 'a.gallery-item'
});

lightbox.init();
```

---

#### `PhotoSwipeVideoPlugin`

Plugin class for video support in PhotoSwipe lightbox.

```typescript
class PhotoSwipeVideoPlugin {
  constructor(lightbox: PhotoSwipeLightbox, options?: VideoPluginOptions);
}
```

**Usage:** Automatically included when using `createGalleryLightbox()`.

---

### Hero Utilities

#### `initHeroImageFallback(options?)`

Initializes hero image fallback behavior (transitions from blur hash to actual image).

```typescript
function initHeroImageFallback(
  options?: HeroImageFallbackOptions
): void
```

**Parameters:**
- `options` (optional):
  - `heroSelector?: string` - Hero element selector (default: `'.hero'`)
  - `imageSelector?: string` - Hero image selector (default: `'.hero__image'`)

**Example:**
```typescript
import { initHeroImageFallback } from '@simple-photo-gallery/common/client';

initHeroImageFallback({
  heroSelector: '.my-hero',
  imageSelector: '.my-hero img'
});
```

---

### CSS Utilities

#### `setCSSVar(name, value, element?)`

Sets a CSS custom property value.

```typescript
function setCSSVar(
  name: string,
  value: string,
  element?: HTMLElement
): void
```

**Example:**
```typescript
import { setCSSVar } from '@simple-photo-gallery/common/client';

// Set on document root
setCSSVar('--primary-color', '#007bff');

// Set on specific element
const hero = document.querySelector('.hero');
setCSSVar('--hero-bg', '#000', hero);
```

---

#### `parseColor(color)`

Parses a color string to RGB array.

```typescript
function parseColor(color: string): [number, number, number] | null
```

**Supports:** Hex colors (`#fff`, `#ffffff`) and RGB strings (`rgb(255, 0, 0)`)

---

#### `normalizeHex(hex)`

Normalizes a hex color to 6-character format.

```typescript
function normalizeHex(hex: string): string
```

**Example:**
```typescript
normalizeHex('#fff');      // Returns: '#ffffff'
normalizeHex('#ffffff');   // Returns: '#ffffff'
```

---

#### `deriveOpacityColor(baseColor, opacity)`

Derives an RGBA color from a base color and opacity.

```typescript
function deriveOpacityColor(
  baseColor: string,
  opacity: number
): string
```

**Example:**
```typescript
import { deriveOpacityColor } from '@simple-photo-gallery/common/client';

const semiTransparent = deriveOpacityColor('#007bff', 0.5);
// Returns: 'rgba(0, 123, 255, 0.5)'
```

---

## Gallery Module (`@simple-photo-gallery/common`)

Core gallery types and Zod validation schemas.

### Types

#### `GalleryData`

Raw gallery structure as stored in gallery.json.

```typescript
interface GalleryData {
  title: string;
  description: string;
  headerImage: string;
  headerImageBlurHash?: string;
  headerImageVariants?: HeaderImageVariants;
  mediaBasePath?: string;
  mediaBaseUrl?: string;
  thumbsBaseUrl?: string;
  url?: string;
  analyticsScript?: string;
  ctaBanner?: boolean;
  thumbnailSize?: number;
  metadata: GalleryMetadata;
  sections: GallerySection[];
  subGalleries?: SubGallery[];
}
```

#### `GallerySection`

Gallery section with images.

```typescript
interface GallerySection {
  title?: string;
  description?: string;
  images: MediaFile[];
}
```

#### `MediaFile`

Image or video with metadata.

```typescript
interface MediaFile {
  type: 'image' | 'video';
  filename: string;
  alt?: string;
  width: number;
  height: number;
  url?: string;
  thumbnail?: Thumbnail;
}
```

#### `GalleryMetadata`

SEO and social metadata.

```typescript
interface GalleryMetadata {
  image?: string;
  imageWidth?: number;
  imageHeight?: number;
  ogUrl?: string;
  ogType?: string;
  ogSiteName?: string;
  twitterSite?: string;
  twitterCreator?: string;
  author?: string;
  keywords?: string;
  canonicalUrl?: string;
  robots?: string;
}
```

#### `SubGallery`

Nested gallery reference.

```typescript
interface SubGallery {
  title: string;
  headerImage: string;
  path: string;
}
```

#### `Thumbnail`

Thumbnail metadata with blur hash.

```typescript
interface Thumbnail {
  path: string;
  pathRetina: string;
  width: number;
  height: number;
  blurHash?: string;
  baseUrl?: string;
}
```

#### `HeaderImageVariants`

Responsive image variant definitions for header images.

```typescript
interface HeaderImageVariants {
  landscape?: {
    avif?: string[];
    jpg?: string[];
  };
  portrait?: {
    avif?: string[];
    jpg?: string[];
  };
}
```

---

### Schemas

All types have corresponding Zod validation schemas:

- `GalleryDataSchema` - Validates complete gallery.json structure
- `GallerySectionSchema` - Validates individual sections
- `MediaFileSchema` - Validates image/video entries
- `GalleryMetadataSchema` - Validates metadata object
- `SubGallerySchema` - Validates sub-gallery entries
- `ThumbnailSchema` - Validates thumbnail metadata
- `HeaderImageVariantsSchema` - Validates responsive image variants

**Example:**
```typescript
import { GalleryDataSchema } from '@simple-photo-gallery/common';

const result = GalleryDataSchema.safeParse(data);
if (result.success) {
  console.log('Valid gallery data:', result.data);
} else {
  console.error('Validation errors:', result.error);
}
```

---

## Example Theme Setup

### Basic Astro Page

```typescript
---
// src/pages/index.astro
import { loadGalleryData, resolveGalleryData } from '@simple-photo-gallery/common/theme';

const galleryJsonPath = import.meta.env.GALLERY_JSON_PATH || './gallery.json';
const raw = loadGalleryData(galleryJsonPath, { validate: true });
const gallery = await resolveGalleryData(raw, { galleryJsonPath });

// Access resolved data
const { hero, sections } = gallery;
---

<html>
  <head>
    <title>{hero.title}</title>
  </head>
  <body>
    <div class="hero">
      <picture>
        <source srcset={hero.srcsets.landscapeAvif} type="image/avif" />
        <source srcset={hero.srcsets.landscapeJpg} type="image/jpeg" />
        <img src={hero.src} alt={hero.title} />
      </picture>
      <div set:html={hero.parsedDescription} />
    </div>

    {sections.map((section) => (
      <section>
        <h2>{section.title}</h2>
        <div set:html={section.parsedDescription} />
        {section.images.map((img) => (
          <a href={img.imagePath} data-pswp-width={img.width} data-pswp-height={img.height}>
            <img
              src={img.thumbnailPath}
              srcset={img.thumbnailSrcSet}
              alt={img.alt || img.filename}
              width={img.thumbnailWidth}
              height={img.thumbnailHeight}
            />
          </a>
        ))}
      </section>
    ))}
  </body>
</html>
```

### Client-Side Script

```typescript
// src/scripts/gallery.ts
import { decodeAllBlurhashes, createGalleryLightbox, initHeroImageFallback } from '@simple-photo-gallery/common/client';

// Decode blurhash placeholders
decodeAllBlurhashes();

// Initialize hero image fallback
initHeroImageFallback();

// Setup PhotoSwipe lightbox
const lightbox = createGalleryLightbox({
  gallery: '#gallery',
  children: 'a'
});
lightbox.init();
```

---

## See Also

- [Custom Themes Guide](../docs/themes.md) - Complete theme development guide
- [Architecture](../docs/architecture.md) - System design and implementation details
- [Modern Theme Source](../themes/modern/) - Reference implementation
- [Commands Reference](../docs/commands/README.md) - CLI commands documentation
