# Simple Photo Gallery

Create beautiful photo galleries that tell a story in just 30 seconds. No configuration required to get started—simply run two commands in your photos folder.

## Quick Start

The fastest way to create a gallery is to use `npx` in your photos folder:

```bash
npx simple-photo-gallery init
npx simple-photo-gallery build
```

This will:

1. Prompt you for your gallery title, description, and header image
2. Scan your photos and create a `gallery.json` file
3. Generate optimized thumbnails
4. Build a static HTML gallery that you can open in your browser and self-host

## Installation Requirements

- **Node.js 20+** - [Download here](https://nodejs.org/)
- **FFmpeg** (for video support) - Install via:
  - macOS: `brew install ffmpeg`
  - Ubuntu/Debian: `sudo apt install ffmpeg`
  - Windows: [Download from ffmpeg.org](https://ffmpeg.org/download.html)

## Detailed Documentation

For advanced usage, customization, and deployment options, see the comprehensive [documentation](./docs/README.md):

- **[Commands Reference](./docs/commands/README.md)** - Detailed guide for all CLI commands
  - [`init`](./docs/commands/init.md) - Initialize new galleries
  - [`build`](./docs/commands/build.md) - Generate static HTML galleries
  - [`thumbnails`](./docs/commands/thumbnails.md) - Generate optimized thumbnails
  - [`clean`](./docs/commands/clean.md) - Remove gallery files
- **[Gallery Configuration](./docs/configuration.md)** - Manual editing of `gallery.json` and advanced features like sections
- **[Deployment Guide](./docs/deployment.md)** - Guidelines for hosting your gallery

## Supported Formats

**Images:** JPEG, PNG, WebP, GIF, TIFF  
**Videos:** MP4, MOV, AVI, WebM, MKV

## License

Simple Photo Gallery is licensed under the MIT License - see [LICENSE](./LICENSE) file for details.
