# {THEME_NAME} Theme

This is the {THEME_NAME_LOWER} theme for Simple Photo Gallery built with Astro.

This theme is a copy of the **modern theme** and includes all the production-ready components:

- **Hero** - Full-screen header with responsive images (AVIF/JPG) and blurhash placeholders
- **Gallery Sections** - Flex-grow masonry layout with hover effects
- **PhotoSwipe Lightbox** - Full-featured image viewer with deep linking support
- **Sub-Galleries** - Navigation grid for nested galleries
- **CTA Banner** - Call-to-action component (optional via `ctaBanner: true` in gallery.json)
- **Footer** - Simple footer component

## Getting Started

1. Install dependencies:

   ```bash
   yarn install
   ```

2. Customize your theme in `src/pages/index.astro` and the components in `src/components/`

3. Initialize a gallery (run from directory with your images):

   ```bash
   spg init -p <images-folder>
   ```

4. Build a gallery with your theme:

   ```bash
   spg build --theme <path-to-this-theme> -g <gallery-folder>
   ```

## Directory Structure

```
src/
├── pages/
│   └── index.astro           # Main entry point
├── layouts/
│   ├── MainLayout.astro      # Root HTML layout with global styles
│   └── MainHead.astro        # Meta tags and image preloading
├── components/
│   ├── container/            # Max-width wrapper
│   ├── cta/                  # Call-to-action banner
│   ├── footer/               # Footer component
│   ├── gallery-section/      # Photo grid components
│   ├── hero/                 # Hero header component
│   ├── lightbox/             # PhotoSwipe integration
│   └── sub-galleries/        # Sub-gallery navigation
└── utils/
    └── queryParams.ts        # URL query parameter customizations
```

## Customization

- **Styles**: Edit the `<style>` blocks in each component
- **Layout**: Modify `MainLayout.astro` for global styles
- **Components**: Add, remove, or modify components as needed
- **Theme Config**: Edit `themeConfig.json` for thumbnail settings
