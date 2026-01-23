# Custom Themes

Simple Photo Gallery supports custom themes, allowing you to create your own visual design and layout while leveraging the gallery's core functionality.

## Using Custom Themes

You can use custom themes in two ways:

### Using npm Packages

Install the theme as a dependency and use the package name:

```bash
# Install your custom theme package
npm install @your-org/your-private-theme

# Build with the custom theme
spg build --theme @your-org/your-private-theme
```

### Using Local Themes

You can also use a local theme directory without publishing to npm:

```bash
# Build with a local theme (relative path)
spg build --theme ./themes/my-local-theme

# Build with a local theme (absolute path)
spg build --theme /path/to/my-theme
```

The local theme directory must contain a `package.json` file and follow the same structure as an npm theme package.

If you don't specify `--theme`, the default `@simple-photo-gallery/theme-modern` theme will be used.

## Creating a Custom Theme

The fastest way to create a theme is to use the built-in scaffolder:

```bash
# Creates ./themes/my-theme (or in your monorepo root if you run this inside a workspace package)
spg create-theme my-theme
```

If you prefer a custom output directory:

```bash
spg create-theme my-theme --path ./my-theme
```

The `create-theme` command works by copying the base theme template (bundled with the package) and customizing it with your theme name. This means:

- All files from the bundled template are copied (excluding build artifacts)
- The theme name is automatically updated in `package.json` and `README.md`
- You get a complete, working theme ready to customize

After creating your theme:

```bash
cd ./themes/my-theme
yarn install
```

> **Note:** The generated theme requires `GALLERY_JSON_PATH` to be set (it's how the theme reads your `gallery.json`). When you run `spg build`, the CLI sets it automatically. When you run `astro dev` directly, you need to set it yourself (see "Theme Development" below).

> **Tip:** The base theme template is bundled with the `simple-photo-gallery` package. The source is located at `gallery/src/modules/create-theme/templates/base` in the repository. For local development, if you're working on the CLI itself and want to test template changes, you can modify the template files there. Alternatively, you can create `themes/base` in the workspace root as a fallback for testing - it will be used if present.

A theme is an npm package built with [Astro](https://astro.build/) that follows a specific structure and interface.

### Package Structure

Your theme package should have the following structure:

```
your-theme-package/
├── package.json
├── astro.config.ts
├── tsconfig.json
└── src/
    └── pages/
        └── index.astro
```

### Required Files

#### 1. `package.json`

Your theme package must be a valid npm package with:

- A unique package name (e.g., `@your-org/your-theme-name`)
- `"type": "module"` for ES modules support
- Required dependencies (see below)
- Files array that includes all necessary files:

```json
{
  "name": "@your-org/your-theme-name",
  "version": "1.0.0",
  "type": "module",
  "files": ["public", "src", "astro.config.ts", "tsconfig.json"],
  "dependencies": {
    "astro": "^5.11.0",
    "@simple-photo-gallery/common": "^1.0.5"
  }
}
```

#### 2. `astro.config.ts`

Your Astro config must:

- Use `output: 'static'` for static site generation
- Set `outDir` to `${outputDir}/_build` where `outputDir` comes from `process.env.GALLERY_OUTPUT_DIR`
- Define `process.env.GALLERY_JSON_PATH` in Vite's `define` config
- Use the `astro-relative-links` integration (recommended)

Example:

```typescript
import { defineConfig } from "astro/config";
import relativeLinks from "astro-relative-links";

const sourceGalleryPath = process.env.GALLERY_JSON_PATH;
if (!sourceGalleryPath) {
  throw new Error("GALLERY_JSON_PATH environment variable is not set");
}

const outputDir =
  process.env.GALLERY_OUTPUT_DIR ||
  sourceGalleryPath.replace("gallery.json", "");

export default defineConfig({
  output: "static",
  outDir: outputDir + "/_build",
  build: {
    assets: "assets",
    assetsPrefix: "gallery",
  },
  integrations: [relativeLinks()],
  vite: {
    define: {
      "process.env.GALLERY_JSON_PATH": JSON.stringify(sourceGalleryPath),
    },
  },
});
```

#### 3. `src/pages/index.astro`

This is your main theme entry point. It must:

- Read `gallery.json` from the path specified in `process.env.GALLERY_JSON_PATH`
- Parse and use the `GalleryData` structure
- Generate valid HTML output

**Recommended approach** - Use the resolver utilities from `@simple-photo-gallery/common/theme`:

```astro
---
import { loadGalleryData, resolveGalleryData } from '@simple-photo-gallery/common/theme';
import type { ResolvedGalleryData } from '@simple-photo-gallery/common/theme';

// Read gallery.json from the path provided by the build process
const galleryJsonPath = import.meta.env.GALLERY_JSON_PATH || './gallery.json';

// Load and resolve gallery data
const raw = loadGalleryData(galleryJsonPath, { validate: true });
const gallery: ResolvedGalleryData = await resolveGalleryData(raw, { galleryJsonPath });

// Extract resolved gallery properties
const { hero, sections, subGalleries, metadata } = gallery;
---

<html>
  <head>
    <title>{hero.title}</title>
    <meta name="description" content={hero.description} />
    {metadata.analyticsScript && (
      <Fragment set:html={metadata.analyticsScript} />
    )}
  </head>
  <body>
    <!-- Your theme implementation here -->
    <h1>{hero.title}</h1>
    <div set:html={hero.parsedDescription} />

    <!-- Render hero with responsive images -->
    <picture>
      <source srcset={hero.srcsets.landscapeAvif} type="image/avif" media="(orientation: landscape)" />
      <source srcset={hero.srcsets.landscapeJpg} type="image/jpeg" media="(orientation: landscape)" />
      <source srcset={hero.srcsets.portraitAvif} type="image/avif" media="(orientation: portrait)" />
      <source srcset={hero.srcsets.portraitJpg} type="image/jpeg" media="(orientation: portrait)" />
      <img src={hero.src} alt={hero.title} />
    </picture>

    <!-- Render gallery sections -->
    {sections.map((section) => (
      <section>
        <h2>{section.title}</h2>
        <div set:html={section.parsedDescription} />
        {section.images.map((image) => (
          <a href={image.imagePath} data-pswp-width={image.width} data-pswp-height={image.height}>
            <img
              src={image.thumbnailPath}
              srcset={image.thumbnailSrcSet}
              alt={image.alt || image.filename}
              width={image.thumbnailWidth}
              height={image.thumbnailHeight}
            />
          </a>
        ))}
      </section>
    ))}
  </body>
</html>
```

**Alternative - Manual approach** (not recommended for new themes):

```astro
---
import fs from 'node:fs';
import type { GalleryData } from '@simple-photo-gallery/common';

// Read gallery.json from the path provided by the build process
const galleryJsonPath = process.env.GALLERY_JSON_PATH || './gallery.json';
const galleryData = JSON.parse(fs.readFileSync(galleryJsonPath, 'utf8'));
const gallery = galleryData as GalleryData;

// Extract gallery properties - note: paths and markdown NOT pre-computed
const { title, description, sections } = gallery;
---

<html>
  <head>
    <title>{title}</title>
    <meta name="description" content={description} />
  </head>
  <body>
    <h1>{title}</h1>
    <p>{description}</p>

    <!-- Note: Using raw filenames, not resolved paths -->
    {sections.map((section) => (
      <section>
        {section.images.map((image) => (
          <img src={image.filename} alt={image.alt || ''} />
        ))}
      </section>
    ))}
  </body>
</html>
```

> **Note:** The resolver approach is recommended because it provides pre-computed paths, responsive srcsets, and parsed markdown. The modern theme uses this pattern. See the [Common Package API](../common/README.md) for complete documentation.

### Gallery Data Structure

> **Important:** There are two data structures to understand:
> - **`GalleryData`** - Raw structure from `gallery.json` (manual approach)
> - **`ResolvedGalleryData`** - Transformed structure with pre-computed paths (recommended approach)
>
> **Recommendation:** Use `resolveGalleryData()` from `@simple-photo-gallery/common/theme` to get resolved data. This is what the modern theme uses.

#### Raw GalleryData (Manual Approach)

Your theme receives a `GalleryData` object from `gallery.json` with the following structure:

```typescript
interface GalleryData {
  title: string;
  description: string;
  headerImage: string;
  headerImageBlurHash?: string;
  mediaBasePath?: string;
  mediaBaseUrl?: string;
  thumbsBaseUrl?: string;
  url?: string;
  analyticsScript?: string;
  ctaBanner?: boolean;
  thumbnailSize?: number;
  metadata: {
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
  };
  sections: Array<{
    title?: string;
    description?: string;
    images: Array<{
      filename: string;
      width: number;
      height: number;
      caption?: string;
      description?: string;
      blurHash?: string;
      thumbnail?: {
        filename: string;
        width: number;
        height: number;
      };
      // ... other image properties
    }>;
  }>;
  subGalleries?: {
    title: string;
    galleries: Array<{
      title: string;
      headerImage: string;
      path: string;
    }>;
  };
}
```

### Using Common Package Utilities

The `@simple-photo-gallery/common` package provides utilities that make theme development easier and more consistent.

#### Data Loading and Resolution

**`loadGalleryData()`** - Load gallery.json with optional validation:

```typescript
import { loadGalleryData } from '@simple-photo-gallery/common/theme';

const gallery = loadGalleryData('./gallery.json', { validate: true });
```

**`resolveGalleryData()`** - Transform raw data into resolved structure:

```typescript
import { resolveGalleryData } from '@simple-photo-gallery/common/theme';

const resolved = await resolveGalleryData(gallery, { galleryJsonPath: './gallery.json' });

// Access pre-computed data
resolved.hero.src              // Computed hero image path
resolved.hero.srcsets          // Responsive image srcsets
resolved.sections[0].parsedDescription  // HTML from markdown
resolved.sections[0].images[0].imagePath  // Computed image path
```

**Benefits of using the resolver:**
- All image paths pre-computed (no manual path logic)
- Responsive srcsets built automatically
- Markdown descriptions parsed to HTML
- Type-safe with `ResolvedGalleryData` type

#### Client-Side Utilities

The `@simple-photo-gallery/common/client` module provides browser-side utilities:

**PhotoSwipe Lightbox:**
```typescript
import { createGalleryLightbox } from '@simple-photo-gallery/common/client';

const lightbox = createGalleryLightbox({
  gallery: '#gallery',
  children: 'a'
});
lightbox.init();
```

**Blurhash Decoding:**
```typescript
import { decodeAllBlurhashes } from '@simple-photo-gallery/common/client';

// Decodes all canvas elements with data-blurhash attribute
decodeAllBlurhashes();
```

**Hero Image Fallback:**
```typescript
import { initHeroImageFallback } from '@simple-photo-gallery/common/client';

// Smooth transition from blurhash to actual image
initHeroImageFallback();
```

**CSS Utilities:**
```typescript
import { setCSSVar, deriveOpacityColor } from '@simple-photo-gallery/common/client';

// Set CSS custom properties dynamically
setCSSVar('--primary-color', '#007bff');

// Create semi-transparent colors
const bgColor = deriveOpacityColor('#007bff', 0.1);
setCSSVar('--bg-color', bgColor);
```

#### Complete API Reference

For a comprehensive list of all utilities and types, see the [Common Package API documentation](../common/README.md).

---

### Environment Variables

The build process sets these environment variables that your theme can access:

- `GALLERY_JSON_PATH`: Absolute path to the `gallery.json` file
- `GALLERY_OUTPUT_DIR`: Directory where the built gallery should be output

### Build Process

When building, the gallery CLI will:

1. Set `GALLERY_JSON_PATH` and `GALLERY_OUTPUT_DIR` environment variables
2. Run `npx astro build` in your theme package directory
3. Copy the built output from `_build` to the gallery output directory
4. Move `index.html` to the gallery root

Your theme must output an `index.html` file in the build directory.

### Theme Development (running `astro dev`)

When you develop a theme, you’ll usually want to point it at a real `gallery.json` generated by the CLI.

1. Create a gallery (once):

```bash
spg init -p /path/to/photos -g /path/to/gallery
```

2. Run the theme dev server with the required environment variables:

```bash
# macOS / Linux
export GALLERY_JSON_PATH="/path/to/gallery/gallery.json"
export GALLERY_OUTPUT_DIR="/path/to/gallery"
yarn dev
```

```bash
# Windows (PowerShell)
$env:GALLERY_JSON_PATH="C:\path\to\gallery\gallery.json"
$env:GALLERY_OUTPUT_DIR="C:\path\to\gallery"
yarn dev
```

### Best Practices

1. **Use the resolver**: Use `resolveGalleryData()` from `@simple-photo-gallery/common/theme` for path computation and data transformation (recommended)
2. **Use TypeScript**: Import types from `@simple-photo-gallery/common` for type safety
3. **Leverage client utilities**: Import from `@simple-photo-gallery/common/client` for browser-side functionality like PhotoSwipe and blurhash
4. **Handle optional fields**: Many fields in `GalleryData` are optional - always check before using
5. **Use resolved types**: Work with `ResolvedGalleryData`, `ResolvedHero`, `ResolvedSection`, etc. for pre-computed data
6. **Optimize assets**: Use Astro's asset optimization features
7. **Test locally**: Use `astro dev` to preview your theme during development
8. **Follow Astro conventions**: Use Astro components, layouts, and best practices

### Example Theme Packages

- **Base theme template**: Bundled with the `simple-photo-gallery` package and used by `spg create-theme`. This is a minimal, functional theme that serves as the starting point for all new themes. The source is in `gallery/src/modules/create-theme/templates/base` (or `themes/base` in the repository for development).
- **`@simple-photo-gallery/theme-modern`**: A more advanced theme example. The source code is available in the `themes/modern` directory of this repository.

Both themes demonstrate the required structure and can be used as reference implementations.

### Using Your Theme

Once your theme is ready, you can use it in two ways:

**Option 1: Local Development (No Publishing Required)**

```bash
# Use the local theme directly
spg build --theme ./themes/my-theme
```

**Option 2: Publish to npm**

1. Publish it to npm (or your private registry)
2. Install it in your project: `npm install @your-org/your-theme-name`
3. Use it when building: `spg build --theme @your-org/your-theme-name`

Local themes are perfect for development and private projects, while npm packages are ideal for sharing themes with others or using across multiple projects.

### Troubleshooting

**Theme not found**

- For npm packages: Ensure the theme package is installed: `npm install @your-org/your-theme-name`
- For npm packages: Verify the package name matches exactly (including scope)
- For local paths: Verify the path is correct and the directory contains a `package.json` file
- For local paths: Use an absolute path or a path relative to your current working directory

**Build errors**

- Check that `GALLERY_JSON_PATH` is being read correctly
- Verify your `astro.config.ts` matches the required structure
- Ensure all dependencies are installed

**Missing gallery data**

- Verify `gallery.json` exists at the expected path
- Check that the `GalleryData` structure matches the expected format
