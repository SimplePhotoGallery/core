# create-theme

Scaffolds a new custom theme package (Astro-based) that you can use with `spg build --theme`.

```bash
spg create-theme <name> [options]
```

## How it works

The command creates a new theme by copying the base theme template (bundled with the package) and customizing it with your theme name. The generated theme includes:

- `package.json`, `astro.config.ts`, `tsconfig.json`
- `src/pages/index.astro` (main entry point)
- Basic layouts/components and helper utilities
- All configuration files (ESLint, Prettier, etc.)

The command:

1. Copies all files from the bundled base theme template (excluding build artifacts like `node_modules`, `.astro`, `dist`, etc.)
2. Updates `package.json` with your theme name
3. Updates `README.md` with your theme name

By default, the theme is created in `./themes/<name>`. If you run the CLI from inside a monorepo workspace, it will prefer creating themes under the **monorepo root** `./themes/<name>`.

> **Note:** The base theme template is bundled with the `simple-photo-gallery` package, so `spg create-theme` works out of the box after installation. For local development, if `themes/base` exists in your workspace, it will be used instead (allowing you to test template changes).

## Options

| Option              | Description                                                       | Default           |
| ------------------- | ----------------------------------------------------------------- | ----------------- |
| `-p, --path <path>` | Path where the theme should be created (directory must not exist) | `./themes/<name>` |
| `-v, --verbose`     | Show detailed output                                              |                   |
| `-q, --quiet`       | Only show warnings/errors                                         |                   |
| `-h, --help`        | Show command help                                                 |                   |

## Examples

```bash
# Create ./themes/my-theme
spg create-theme my-theme

# Create in a custom directory
spg create-theme my-theme --path ./my-theme

# Build a gallery using the generated theme (local path)
spg build --theme ./themes/my-theme -g /path/to/gallery
```

## Next steps

See the [Custom Themes](../themes.md) guide for:

- Required theme structure
- How the build process passes `GALLERY_JSON_PATH` / `GALLERY_OUTPUT_DIR`
- How to run `astro dev` while developing a theme
