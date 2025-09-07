# Simple Photo Gallery

Generate beautiful photo galleries from your images with zero configuration.

## Quick Start

The fastest way to create a gallery is using `npx`:

```bash
npx simple-photo-gallery init
```

Run this command in any folder containing photos. That's it. Your gallery is ready.

## What It Does

1. **Scans** your folder for images and videos
2. **Creates** thumbnails automatically
3. **Builds** a responsive, modern gallery website
4. **Works** offline - no external dependencies

## Basic Usage

### Generate a gallery in your photos folder

```bash
cd /path/to/your/photos
npx simple-photo-gallery init
npx simple-photo-gallery build
```

Your gallery is now available at `index.html`. Open it in any browser.

### Commands

- `init` - Scan for photos and create gallery configuration
- `thumbnails` - Generate thumbnails (done automatically during init)
- `build` - Build the HTML gallery
- `clean` - Remove gallery files

### Options

Every command supports:
- `-v, --verbose` - Show detailed output
- `-q, --quiet` - Show only errors

## Next Steps

- [Module Documentation](docs/) - Detailed options for each command
- [Gallery Configuration](docs/gallery-json.md) - Customize your gallery
- [Deployment Guide](docs/deployment.md) - Host your gallery online

## Requirements

- Node.js 20 or higher
- Photos in common formats (JPG, PNG, WebP, etc.)
- Videos in common formats (MP4, WebM, etc.)

## License

MIT