# Build Command

The `build` command creates the final HTML gallery from your configuration.

## Basic Usage

```bash
npx simple-photo-gallery build
```

Generates `index.html` and supporting files in your gallery directory.

## Options

### Gallery Path (`-g, --gallery`)

Specify the gallery directory to build.

```bash
npx simple-photo-gallery build --gallery /path/to/gallery
```

**Default**: Current directory

### Recursive (`-r, --recursive`)

Build galleries in subdirectories.

```bash
npx simple-photo-gallery build --recursive
```

### Base URL (`-b, --base-url`)

Set a base URL for hosting photos separately.

```bash
npx simple-photo-gallery build --base-url https://cdn.example.com/photos/
```

Use this when photos will be served from a different location than the HTML.

## What It Creates

```
gallery/
├── index.html          # Main gallery page
├── gallery/           
│   ├── assets/        # CSS, JS, fonts
│   └── thumbnails/    # Thumbnail images
└── gallery.json       # Configuration (existing)
```

## Build Process

1. Reads `gallery.json` configuration
2. Copies theme assets
3. Generates responsive HTML
4. Creates lightbox functionality
5. Optimizes for performance

## Features

The built gallery includes:
- **Responsive grid** layout
- **Lightbox** for full-size viewing
- **Keyboard navigation** (arrows, ESC)
- **Touch gestures** on mobile
- **Video support** with inline playback
- **Fast loading** with lazy loading

## Base URL Usage

Three deployment scenarios:

### 1. Same Directory (Default)
```bash
npx simple-photo-gallery build
```
Photos and HTML in same folder. Perfect for simple hosting.

### 2. Separate Photos Directory
```bash
npx simple-photo-gallery build -g ./website -b ./photos/
```
HTML in `website/`, photos stay in `photos/`.

### 3. CDN/External Hosting
```bash
npx simple-photo-gallery build -b https://cdn.example.com/vacation/
```
Upload photos to CDN, serve HTML from anywhere.

## Examples

### Basic build
```bash
npx simple-photo-gallery build
```

### Build with external photo hosting
```bash
npx simple-photo-gallery build --base-url https://photos.example.com/gallery/
```

### Build all sub-galleries
```bash
npx simple-photo-gallery build -r
```