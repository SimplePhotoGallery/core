# base Theme

The base theme template for Simple Photo Gallery built with Astro.

> **⚠️ Important:** This theme is used as the **source template** for `spg create-theme`. This template is bundled with the `simple-photo-gallery` package, so any changes made here will be reflected in all **new themes** created with `spg create-theme` after the package is updated and published. Existing themes created before your changes will not be affected.

## How it works

When you run `spg create-theme <name>`, this template (bundled with the package) is copied to create a new theme. The command:

1. Copies all files from this directory (excluding build artifacts like `node_modules`, `.astro`, `dist`, etc.)
2. Updates `package.json` with the new theme name
3. Updates `README.md` with the new theme name

This means:

- **Modifying files here** → Changes will appear in themes created **after** your modifications
- **Adding new files** → New files will be included in future themes
- **Removing files** → Files won't be included in future themes
- **Existing themes** → Already created themes are not affected by changes here

You can customize this theme to change the default structure, dependencies, or configuration for all new themes created with `spg create-theme`.

## Structure

This theme includes the following structure that will be copied to new themes:

- `package.json` - Package configuration (name will be updated for new themes)
- `astro.config.ts` - Astro build configuration
- `tsconfig.json` - TypeScript configuration
- `eslint.config.mjs` - ESLint configuration
- `.prettierrc.mjs` - Prettier configuration
- `.prettierignore` - Prettier ignore patterns
- `.gitignore` - Git ignore patterns
- `src/pages/index.astro` - Main gallery page entry point
- `src/layouts/` - Layout components (MainHead, MainLayout)
- `src/components/` - Reusable components (Hero)
- `src/lib/` - Utility libraries (markdown, photoswipe-video-plugin)
- `src/utils/` - Helper functions for paths and resources
- `public/` - Static assets directory

All of these files and directories will be included when creating new themes with `spg create-theme`.
