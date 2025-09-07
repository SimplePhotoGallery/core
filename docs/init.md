# Init Command

The `init` command scans a folder for photos and videos to create your gallery configuration.

## Basic Usage

```bash
npx simple-photo-gallery init
```

Scans the current directory for media files and creates a `gallery.json` configuration file.

## Options

### Photos Path (`-p, --photos`)

Specify which folder to scan for photos.

```bash
npx simple-photo-gallery init --photos /path/to/photos
```

**Default**: Current directory

### Gallery Path (`-g, --gallery`)

Set where to create the gallery files.

```bash
npx simple-photo-gallery init --gallery /path/to/output
```

**Default**: Same as photos directory

### Recursive (`-r, --recursive`)

Include photos from subdirectories.

```bash
npx simple-photo-gallery init --recursive
```

Creates a hierarchical gallery with sub-galleries for each subdirectory.

### Default Settings (`-d, --default`)

Skip interactive prompts and use default settings.

```bash
npx simple-photo-gallery init --default
```

Perfect for automation or when you know what you want.

## What It Creates

1. **gallery.json** - Gallery configuration
2. **gallery/thumbnails/** - Thumbnail images (after running)

## Interactive Prompts

Without `--default`, init asks for:
- Gallery title
- Gallery description  
- Header image selection
- Thumbnail size (default: 200px)

## Supported Files

**Images**: JPG, JPEG, PNG, WebP, GIF, BMP, TIFF  
**Videos**: MP4, WebM, MOV, AVI, MKV

## Examples

### Simple gallery
```bash
npx simple-photo-gallery init
```

### Different input/output folders
```bash
npx simple-photo-gallery init -p ~/Pictures/vacation -g ~/Sites/vacation-gallery
```

### Recursive with defaults
```bash
npx simple-photo-gallery init -r -d
```