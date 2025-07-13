# Simple Photo Gallery CLI

A command-line tool for creating and managing photo galleries with external media support.

## Commands

### `gallery scan`

Scans a directory for images and videos and creates a `gallery.json` file.

```bash
gallery scan -p <path> -o <output> -r
```

Options:

- `-p, --path <path>`: Path to scan for media files (default: current directory)
- `-o, --output <path>`: Output directory for gallery.json
- `-r, --recursive`: Scan subdirectories recursively

### `gallery setup-template`

Modifies Astro config to point directly to external images directory and updates internal config to point to gallery.json (no symbolic links needed).

```bash
gallery setup-template --images-path <path> --astro-config <path> --gallery-json <path> --mode <mode>
```

Options:

- `--images-path <path>`: Path to images directory (required)
- `--astro-config <path>`: Path to astro.config.ts file (required)
- `--gallery-json <path>`: Path to gallery.json file (required)
- `--mode <mode>`: Mode: dev or prod (default: prod)

### `gallery thumbnails`

Creates thumbnails for all media files in gallery.json.

```bash
gallery thumbnails -p <path> -s <size>
```

Options:

- `-p, --path <path>`: Path containing .simple-photo-gallery folder (default: current directory)
- `-s, --size <size>`: Thumbnail height in pixels (default: 200)

## Setup Approach

### Direct Astro Config Approach (`gallery setup-template`)

The `gallery setup-template` command modifies the Astro configuration to point the `publicDir` directly to your external media folder. This eliminates the need for symbolic links entirely and provides a cleaner, more straightforward setup.

**Benefits of the Astro config approach:**

- No symbolic links or file copying required
- Works on all platforms without special permissions
- Simpler file structure
- Direct access to original files
- No risk of broken links if files are moved

## Development

To use during development, you can run the tool with `yarn gallery`.

## Examples

### Basic workflow:

```bash
# 1. Scan your photos directory
gallery scan -p ~/Photos -o ./tmp -r

# 2. Create thumbnails
gallery thumbnails -p ./tmp -s 300

# 3. Setup for web gallery using Astro config approach (recommended)
gallery setup-template --images-path ./PATH_TO_THE_IMAGES_DIRECTORY --astro-config ./template/astro.config.ts --gallery-json ./PATH_TO_GENERATED_GALLERY_JSON_FROM_CLI/gallery.json

# 4. Or specify custom paths
gallery setup-template --images-path ../PATH_TO_THE_IMAGES_DIRECTORY --astro-config ./custom-astro.config.ts --gallery-json ./gallery.json
```

### Development mode:

```bash
# Use development mode for local development
gallery setup-template --images-path ./PATH_TO_THE_IMAGES_DIRECTORY --astro-config ./template/astro.config.ts --gallery-json ./PATH_TO_GENERATED_GALLERY_JSON_FROM_CLI/gallery.json --mode dev
```
