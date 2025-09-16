# Simple Photo Gallery

Create beautiful photo galleries that tell a story in 30 seconds. No configuration needed to get started - just run two commands in your photos folder.

## Quick Start

The fastest way to create a gallery is to use `npx` in your photos folder:

```bash
npx simple-photo-gallery init
npx simple-photo-gallery build
```

This will:

1. Ask you about your gallery title, description, and header image
2. Scan your photos and create a `gallery.json` file
3. Generate optimized thumbnails
4. Build a static HTML gallery you can open in your browser and self-host

## Installation Requirements

- **Node.js 20+** - [Download here](https://nodejs.org/)
- **FFmpeg** (for video support) - Install via:
  - macOS: `brew install ffmpeg`
  - Ubuntu/Debian: `sudo apt install ffmpeg`
  - Windows: [Download from ffmpeg.org](https://ffmpeg.org/download.html)

## Detailed Documentation

For advanced usage, customization, and deployment options, see the [docs](./docs/) folder:

- **[Commands](./docs/commands.md)** - Detailed guide for all CLI commands
- **[Gallery Configuration](./docs/gallery-json.md)** - Manual editing of the `gallery.json` file and enabling advanced features like sections
- **[Deployment](./docs/deployment.md)** - Guildelines for hosting your gallery

## Supported Formats

**Images:** JPEG, PNG, WebP, GIF, TIFF  
**Videos:** MP4, MOV, AVI, WebM, MKV

## License

MIT - see [LICENSE](./LICENSE) file.
