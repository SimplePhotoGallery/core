# create-theme

Scaffolds a new custom theme package (Astro-based) that you can use with `spg build --theme`.

```bash
spg create-theme <name> [options]
```

## How it works

The command creates a new theme by copying the base theme (`themes/base`) and customizing it with your theme name. The generated theme includes:

- `package.json`, `astro.config.ts`, `tsconfig.json`
- `src/pages/index.astro` (main entry point)
- Basic layouts/components and helper utilities
- All configuration files (ESLint, Prettier, etc.)

The command:

1. Copies all files from `themes/base` (excluding build artifacts like `node_modules`, `.astro`, `dist`, etc.)
2. Updates `package.json` with your theme name
3. Updates `README.md` with your theme name

By default, the theme is created in `./themes/<name>`. If you run the CLI from inside a monorepo workspace, it will prefer creating themes under the **monorepo root** `./themes/<name>`.

> **Note:** The command requires `themes/base` to exist in your workspace. This is the source template that gets copied for all new themes.

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
