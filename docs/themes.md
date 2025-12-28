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

Example:

```astro
---
import fs from 'node:fs';
import type { GalleryData } from '@simple-photo-gallery/common/src/gallery';

// Read gallery.json from the path provided by the build process
const galleryJsonPath = process.env.GALLERY_JSON_PATH || './gallery.json';
const galleryData = JSON.parse(fs.readFileSync(galleryJsonPath, 'utf8'));
const gallery = galleryData as GalleryData;

// Extract gallery properties
const {
  title,
  description,
  metadata,
  sections,
  subGalleries,
  mediaBaseUrl,
  thumbsBaseUrl,
  url,
  analyticsScript,
  headerImage,
  headerImageBlurHash,
  ctaBanner,
} = gallery;
---

<html>
  <head>
    <title>{title}</title>
    <meta name="description" content={description} />
    {analyticsScript && (
      <Fragment set:html={analyticsScript} />
    )}
  </head>
  <body>
    <!-- Your theme implementation here -->
    <h1>{title}</h1>
    <p>{description}</p>

    <!-- Render gallery sections -->
    {sections.map((section) => (
      <section>
        {section.images.map((image) => (
          <img src={image.filename} alt={image.caption || ''} />
        ))}
      </section>
    ))}
  </body>
</html>
```

### Gallery Data Structure

Your theme receives a `GalleryData` object with the following structure:

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

### Best Practices

1. **Use TypeScript**: Import types from `@simple-photo-gallery/common` for type safety
2. **Handle optional fields**: Many fields in `GalleryData` are optional - always check before using
3. **Respect base URLs**: Use `mediaBaseUrl` and `thumbsBaseUrl` when provided for external hosting
4. **Optimize assets**: Use Astro's asset optimization features
5. **Test locally**: Use `astro dev` to preview your theme during development
6. **Follow Astro conventions**: Use Astro components, layouts, and best practices

### Example Theme Package

You can use `@simple-photo-gallery/theme-modern` as a reference implementation. The source code is available in the [themes/modern](../themes/modern) directory of this repository.

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
