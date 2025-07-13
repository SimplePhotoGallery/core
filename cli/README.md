# Simple Photo Gallery CLI

A command-line tool for creating beautiful photo galleries from your image and video collections. This CLI helps you scan directories, generate thumbnails, and set up Astro-based gallery websites.

## Features

- 📸 **Media Scanning**: Automatically scan directories for images and videos
- 🖼️ **Thumbnail Generation**: Create optimized thumbnails for fast loading
- 🎥 **Video Support**: Handle video files with ffmpeg integration
- 📱 **Responsive Design**: Generate galleries that work on all devices
- ⚡ **Fast Performance**: Optimized thumbnails and lazy loading
- 🔧 **Astro Integration**: Seamless setup with Astro static site generator

## Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- ffmpeg (for video processing)

### Install ffmpeg

**macOS:**

```bash
brew install ffmpeg
```

**Ubuntu/Debian:**

```bash
sudo apt update
sudo apt install ffmpeg
```

**Windows:**
Download from [ffmpeg.org](https://ffmpeg.org/download.html)

### Install the CLI

```bash
# Clone the repository
git clone <repository-url>
cd simple-photo-gallery-public/cli

# Install dependencies
npm install

# Build the CLI
npm run build

# Link globally (optional)
npm link
```

## Commands

### `gallery scan`

Scan a directory for images and videos to create a `gallery.json` file.

```bash
gallery scan [options]
```

**Options:**

- `-p, --path <path>` - Path to scan for media files (default: current directory)
- `-o, --output <path>` - Output directory for gallery.json
- `-r, --recursive` - Scan subdirectories recursively

**Examples:**

```bash
# Scan current directory
gallery scan

# Scan specific directory
gallery scan --path /path/to/photos

# Scan recursively
gallery scan --path /path/to/photos --recursive

# Specify output directory
gallery scan --path /path/to/photos --output /path/to/output
```

### `gallery thumbnails`

Generate thumbnails for all media files in the gallery.

```bash
gallery thumbnails [options]
```

**Options:**

- `-p, --path <path>` - Path containing .simple-photo-gallery folder (default: current directory)
- `-s, --size <size>` - Thumbnail height in pixels (default: 200)

**Examples:**

```bash
# Generate thumbnails with default size
gallery thumbnails

# Generate thumbnails with custom size
gallery thumbnails --size 300

# Specify gallery path
gallery thumbnails --path /path/to/gallery
```

### `gallery setup-template`

Configure Astro template to work with external image directories.

```bash
gallery setup-template [options]
```

**Options:**

- `-c, --astro-config <path>` - Path to astro.config.ts file (required)
- `-i, --images-path <path>` - Path to images directory (required)
- `-g, --gallery-json <path>` - Path to gallery.json file (required)
- `-m, --mode <mode>` - Mode: dev or prod (default: prod)

**Examples:**

```bash
# Production mode setup
gallery setup-template \
  --images-path ../my-photos \
  --astro-config ./astro.config.ts \
  --gallery-json ./.simple-photo-gallery/gallery.json

# Development mode setup
gallery setup-template \
  --images-path ../my-photos \
  --astro-config ./astro.config.ts \
  --gallery-json ./.simple-photo-gallery/gallery.json \
  --mode dev
```

## Complete Workflow Examples

### Basic Gallery Creation

1. **Prepare your photos directory:**

```bash
mkdir my-photos
# Copy your photos and videos to my-photos/
```

2. **Scan for media files:**

```bash
cd my-photos
gallery scan --recursive
```

3. **Generate thumbnails:**

```bash
gallery thumbnails --size 250
```

4. **Set up Astro template:**

```bash
cd ../template
gallery setup-template \
  --images-path ../my-photos \
  --astro-config ./astro.config.ts \
  --gallery-json ../my-photos/.simple-photo-gallery/gallery.json
```

5. **Build and serve:**

```bash
npm run dev
```

### Advanced Workflow with Multiple Sections

1. **Organize photos in subdirectories:**

```
my-photos/
├── vacation/
│   ├── beach.jpg
│   ├── mountains.jpg
│   └── sunset.mp4
├── family/
│   ├── birthday.jpg
│   └── christmas.jpg
└── events/
    ├── wedding.jpg
    └── graduation.jpg
```

2. **Scan with recursive option:**

```bash
cd my-photos
gallery scan --recursive
```

3. **Edit gallery.json to create sections:**

```json
{
  "title": "My Photo Collection",
  "description": "A collection of my favorite moments",
  "headerImage": "vacation/beach.jpg",
  "metadata": { "ogUrl": "" },
  "sections": [
    {
      "title": "Vacation Memories",
      "description": "Amazing trips and adventures",
      "images": [
        // vacation images will be here
      ]
    },
    {
      "title": "Family Moments",
      "description": "Precious family memories",
      "images": [
        // family images will be here
      ]
    },
    {
      "title": "Special Events",
      "description": "Important life events",
      "images": [
        // events images will be here
      ]
    }
  ]
}
```

4. **Generate thumbnails:**

```bash
gallery thumbnails --size 300
```

5. **Set up and build:**

```bash
cd ../template
gallery setup-template \
  --images-path ../my-photos \
  --astro-config ./astro.config.ts \
  --gallery-json ../my-photos/.simple-photo-gallery/gallery.json

npm run build
npm run preview
```

### Development vs Production Modes

**Development Mode:**

- Uses direct paths to image files
- Faster development workflow
- Images served from original location

```bash
gallery setup-template \
  --images-path ../my-photos \
  --astro-config ./astro.config.ts \
  --gallery-json ../my-photos/.simple-photo-gallery/gallery.json \
  --mode dev
```

**Production Mode:**

- Copies and optimizes gallery.json
- Adjusts paths for production deployment
- Uses public directory structure

```bash
gallery setup-template \
  --images-path ../my-photos \
  --astro-config ./astro.config.ts \
  --gallery-json ../my-photos/.simple-photo-gallery/gallery.json \
  --mode prod
```

## File Structure

After running the CLI, your project will have this structure:

```
my-photos/
├── .simple-photo-gallery/
│   ├── gallery.json          # Gallery metadata and file list
│   └── thumbnails/           # Generated thumbnails
│       ├── image1.jpg
│       ├── image2.jpg
│       └── video1.jpg
├── photo1.jpg
├── photo2.jpg
└── video1.mp4

template/
├── astro.config.ts           # Modified Astro config
├── gallery.json              # Copied gallery data
└── ... (other Astro files)
```

## Supported Media Formats

**Images:**

- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- GIF (.gif)
- TIFF (.tiff, .tif)

**Videos:**

- MP4 (.mp4)
- MOV (.mov)
- AVI (.avi)
- WebM (.webm)
- MKV (.mkv)

_Note: Video processing requires ffmpeg to be installed and available in your PATH._

## Troubleshooting

### Common Issues

**"ffprobe not found" error:**

- Install ffmpeg: `brew install ffmpeg` (macOS) or `sudo apt install ffmpeg` (Ubuntu)
- Ensure ffmpeg is in your PATH

**"Gallery not found" error:**

- Run `gallery scan` first to create the gallery.json file
- Check that the path to .simple-photo-gallery folder is correct

**"Astro config not found" error:**

- Ensure the astro.config.ts file exists at the specified path
- Use absolute paths if needed

**Thumbnail generation fails:**

- Check file permissions
- Ensure sufficient disk space
- Verify media files are not corrupted

### Getting Help

- Check that all required dependencies are installed
- Verify file paths are correct and accessible
- Ensure ffmpeg is properly installed for video processing
- Review the generated gallery.json file for any issues

## Development

### Building from Source

```bash
# Install dependencies
npm install

# Build the CLI
npm run build

# Run in development mode
npm run gallery
```

### Code Quality

```bash
# Check TypeScript
npm run check

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## License

MIT License - see LICENSE file for details.
