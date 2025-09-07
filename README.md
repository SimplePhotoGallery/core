# Simple Photo Gallery

Create beautiful, fast photo galleries from your images and videos. No configuration needed - just run one command in your photos folder.

## Quick Start

The fastest way to create a gallery is to use `npx` in your photos folder:

```bash
cd /path/to/your/photos
npx simple-photo-gallery init
npx simple-photo-gallery thumbnails  
npx simple-photo-gallery build
```

This will:
1. Scan your photos and create a `gallery.json` file
2. Generate optimized thumbnails
3. Build a static HTML gallery you can open in your browser

Open `index.html` in your browser to view your gallery!

## Installation Requirements

- **Node.js 20+** - [Download here](https://nodejs.org/)
- **FFmpeg** (for video support) - Install via:
  - macOS: `brew install ffmpeg`
  - Ubuntu/Debian: `sudo apt install ffmpeg`
  - Windows: [Download from ffmpeg.org](https://ffmpeg.org/download.html)

## Detailed Documentation

For advanced usage, customization, and deployment options, see the [docs](./docs/) folder:

- **[Commands](./docs/commands.md)** - Detailed guide for all CLI commands
- **[Gallery Configuration](./docs/gallery-json.md)** - Manual editing of gallery.json
- **[Deployment](./docs/deployment.md)** - Hosting options including Cloudflare
- **[Examples](./docs/examples.md)** - Copy-paste examples for common setups

## Supported Formats

**Images:** JPEG, PNG, WebP, GIF, TIFF  
**Videos:** MP4, MOV, AVI, WebM, MKV

## License

MIT - see [LICENSE](./LICENSE) file.