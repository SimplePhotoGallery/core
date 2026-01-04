# base Theme

A custom theme for Simple Photo Gallery built with Astro.

## Development

`GALLERY_JSON_PATH` is required. The theme reads your `gallery.json` from this path.

First, create a gallery once (you can reuse this during theme development):

```bash
spg init -p <path-to-photos> -g <path-to-gallery>
```

Then run the theme dev server with the required environment variables:

```bash
# macOS / Linux
export GALLERY_JSON_PATH="<path-to-gallery>/gallery.json"
export GALLERY_OUTPUT_DIR="<path-to-gallery>"
yarn dev
```

```bash
# Windows (PowerShell)
$env:GALLERY_JSON_PATH="C:\path\to\gallery\gallery.json"
$env:GALLERY_OUTPUT_DIR="C:\path\to\gallery"
yarn dev
```

```bash
# Install dependencies
yarn install

# Build for production
yarn build

# Preview production build
yarn preview
```

## Customization

Edit `src/pages/index.astro` to customize your theme. This is the main entry point that receives gallery data and renders your gallery.

## Building Galleries

To use this theme when building a gallery:

```bash
# 1. Initialize a gallery from your images folder
spg init -p <path-to-images-folder> -g <gallery-output-folder>

# 2. Generate thumbnails (optional but recommended)
spg thumbnails -g <gallery-output-folder>

# 3. Build the gallery with your theme
spg build --theme ./themes/base -g <gallery-output-folder>

# Or if published to npm
spg build --theme @your-org/theme-base -g <gallery-output-folder>
```

## Structure

- `src/pages/index.astro` - Main gallery page
- `src/layouts/` - Layout components (MainHead, MainLayout)
- `src/components/` - Reusable components (Hero)
- `src/lib/` - Utility libraries (markdown, photoswipe-video-plugin)
- `src/utils/` - Helper functions for paths and resources
- `public/` - Static assets
