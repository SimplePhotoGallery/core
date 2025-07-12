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

### `gallery setup`

Converts CLI-generated gallery to template format and creates symbolic links to external media files.

```bash
gallery setup -c <cli-gallery> -o <output> [--copy-fallback] [--public-dir <path>] [--images-dir <path>] [--thumbnails-dir <path>]
```

Options:

- `-c, --cli-gallery <path>`: Path to CLI-generated gallery.json file (required)
- `-o, --output <path>`: Output path for template gallery.json (default: ./gallery.json)
- `--copy-fallback`: Copy files instead of creating symbolic links
- `--public-dir <path>`: Public directory name (default: public)
- `--images-dir <path>`: Directory name for images in public folder (default: images)
- `--thumbnails-dir <path>`: Directory name for thumbnails in public folder (default: thumbnails)

### `gallery thumbnails`

Creates thumbnails for all media files in gallery.json.

```bash
gallery thumbnails -p <path> -s <size>
```

Options:

- `-p, --path <path>`: Path containing .simple-photo-gallery folder (default: current directory)
- `-s, --size <size>`: Thumbnail height in pixels (default: 200)

## Configurable Directory Structure

The `gallery setup` command allows you to customize where your media files are stored in the public directory. By default, files are organized as:

```
template/
├── public/
│   ├── images/          # Original media files
│   └── thumbnails/      # Generated thumbnails
└── gallery.json
```

### Custom Directory Layout

You can customize this structure using the directory options:

```bash
# Custom subdirectories
gallery setup -c gallery.json -o template/gallery.json --images-dir media --thumbnails-dir thumbs

# Custom public directory
gallery setup -c gallery.json -o template/gallery.json --public-dir assets --images-dir photos --thumbnails-dir thumbs
```

This would create:

```
template/
├── assets/              # Custom public directory
│   ├── photos/          # Original media files
│   └── thumbs/          # Generated thumbnails
└── gallery.json
```

### URL Structure

The directory configuration affects the URLs used in the gallery:

- **Default**: `/images/filename.jpg` and `/thumbnails/filename.jpg`
- **Custom**: `/photos/filename.jpg` and `/thumbs/filename.jpg`

## Symbolic Links and Copy Fallback

The `gallery setup` command creates symbolic links to your external media files, allowing the web gallery to serve files from their original locations without duplicating them. This approach saves disk space and keeps your gallery in sync with your media library.

### How Symbolic Links Work

1. **Unix-like systems (macOS, Linux)**: Uses native `fs.symlink()` to create symbolic links
2. **Windows**: Attempts multiple linking strategies:
   - First tries `fs.symlink()` (requires Developer Mode or admin privileges)
   - Falls back to `mklink` command (requires admin privileges)
   - If both fail, can use copy fallback

### Copy Fallback Option

When symbolic links cannot be created (common on Windows), you can use the `--copy-fallback` option to copy files instead:

```bash
gallery setup -c gallery.json -o template/gallery.json --copy-fallback
```

**Platform-specific behavior:**

- **macOS/Linux**: Symbolic links work by default. Copy fallback is available if needed.
- **Windows**: Symbolic links require either:
  - Administrator privileges, OR
  - Developer Mode enabled (Windows Settings > Update & Security > For developers)

  If neither is available, use `--copy-fallback` to copy files instead.

### Benefits of Symbolic Links

- **Space efficient**: No duplicate files
- **Always up-to-date**: Changes to original files are reflected in the gallery
- **Fast setup**: No file copying required

### When to Use Copy Fallback

- Windows systems without admin access or Developer Mode
- When you want a completely self-contained gallery
- When the original media files might be moved or deleted

## Development

To use during development, you can run the tool with `yarn gallery`.

## Examples

### Basic workflow:

```bash
# 1. Scan your photos directory
gallery scan -p ~/Photos -o ./tmp -r

# 2. Create thumbnails
gallery thumbnails -p ./tmp -s 300

# 3. Setup for web gallery (with symbolic links)
gallery setup -c ./tmp/.simple-photo-gallery/gallery.json -o ./template/gallery.json

# 4. Or setup with copy fallback (Windows compatibility)
gallery setup -c ./tmp/.simple-photo-gallery/gallery.json -o ./template/gallery.json --copy-fallback
```

### Custom directory structure:

```bash
# Use custom directory names
gallery setup -c ./tmp/.simple-photo-gallery/gallery.json -o ./template/gallery.json \
  --public-dir assets \
  --images-dir photos \
  --thumbnails-dir thumbs

# This creates: template/assets/photos/ and template/assets/thumbs/
# URLs will be: /photos/filename.jpg and /thumbs/filename.jpg
```
