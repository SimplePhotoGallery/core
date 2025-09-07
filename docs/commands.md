# Commands

All commands can be run with `npx simple-photo-gallery <command>` or installed globally with `npm install -g simple-photo-gallery`.

## init

Scans a folder for images and videos and creates a `gallery.json` file.

```bash
npx simple-photo-gallery init [options]
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --photos <path>` | Path to folder containing photos | Current directory |
| `-g, --gallery <path>` | Where to create the gallery | Same as photos folder |
| `-r, --recursive` | Create galleries from subdirectories | `false` |
| `-d, --default` | Use default settings (skip prompts) | `false` |

### Examples

```bash
# Create gallery in current folder
npx simple-photo-gallery init

# Scan specific folder
npx simple-photo-gallery init -p /path/to/photos

# Create gallery in different location
npx simple-photo-gallery init -p /photos -g /gallery

# Scan subdirectories and create multiple galleries
npx simple-photo-gallery init -r

# Skip interactive prompts
npx simple-photo-gallery init -d
```

### What it does

1. Scans for supported image/video formats
2. Reads dimensions and metadata
3. Creates `gallery.json` with file information
4. Prompts for gallery title and description (unless `-d` flag used)

## thumbnails

Generates optimized thumbnail images for all media files.

```bash
npx simple-photo-gallery thumbnails [options]
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `-g, --gallery <path>` | Path to gallery directory | Current directory |
| `-r, --recursive` | Process subdirectories | `false` |

### Examples

```bash
# Generate thumbnails in current directory
npx simple-photo-gallery thumbnails

# Process specific gallery
npx simple-photo-gallery thumbnails -g /path/to/gallery

# Process all galleries recursively
npx simple-photo-gallery thumbnails -r
```

### What it does

1. Creates `gallery/thumbnails/` folder
2. Generates 200px height thumbnails (standard and retina)
3. Updates `gallery.json` with thumbnail paths
4. Uses Sharp for images, FFmpeg for video frames

## build

Creates the static HTML gallery website.

```bash
npx simple-photo-gallery build [options]
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `-g, --gallery <path>` | Path to gallery directory | Current directory |
| `-r, --recursive` | Build all galleries | `false` |
| `-b, --base-url <url>` | Base URL for external hosting | None |

### Examples

```bash
# Build gallery in current directory
npx simple-photo-gallery build

# Build specific gallery
npx simple-photo-gallery build -g /path/to/gallery  

# Build all galleries recursively
npx simple-photo-gallery build -r

# Build with external base URL (no photo copying)
npx simple-photo-gallery build -b https://photos.example.com/
```

### What it does

1. Copies/links photos to gallery folder (unless base URL used)
2. Generates `index.html` with gallery viewer
3. Creates responsive, mobile-friendly interface
4. Adds lightbox functionality with PhotoSwipe

## clean

Removes gallery files while preserving original photos.

```bash
npx simple-photo-gallery clean [options]
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `-g, --gallery <path>` | Path to gallery directory | Current directory |
| `-r, --recursive` | Clean all galleries | `false` |

### Examples

```bash
# Clean current directory
npx simple-photo-gallery clean

# Clean specific directory  
npx simple-photo-gallery clean -g /path/to/gallery

# Clean all galleries recursively
npx simple-photo-gallery clean -r
```

### What it does

1. Removes `index.html`
2. Removes `gallery/` folder and contents
3. Preserves `gallery.json` and original photos
4. Safe to run - never deletes source photos

## Global Options

Available for all commands:

| Option | Description |
|--------|-------------|
| `-v, --verbose` | Show detailed output |
| `-q, --quiet` | Only show warnings/errors |
| `-h, --help` | Show command help |

## Troubleshooting

**"Command not found"**
- Install Node.js 20+
- Try `npx simple-photo-gallery@latest init`

**"ffprobe not found"**  
- Install FFmpeg for video support
- Images will work without FFmpeg

**"Gallery not found"**
- Run `init` command first to create `gallery.json`
- Check the path is correct

**Permission errors**
- Check folder write permissions
- Try running with `sudo` on macOS/Linux if needed