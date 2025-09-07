# Thumbnails Command

The `thumbnails` command generates optimized thumbnail images for your gallery.

## Basic Usage

```bash
npx simple-photo-gallery thumbnails
```

Creates thumbnails for all media files in your gallery.

## Options

### Gallery Path (`-g, --gallery`)

Specify the gallery directory.

```bash
npx simple-photo-gallery thumbnails --gallery /path/to/gallery
```

**Default**: Current directory

### Recursive (`-r, --recursive`)

Process thumbnails in subdirectories.

```bash
npx simple-photo-gallery thumbnails --recursive
```

## How It Works

1. Reads `gallery.json` configuration
2. Creates `gallery/thumbnails/` directory
3. Generates thumbnails based on configured size
4. Creates both standard and retina (@2x) versions

## Thumbnail Details

- **Format**: JPEG (optimized for web)
- **Quality**: 80% (good balance of size/quality)
- **Sizes**: Standard + Retina (2x resolution)
- **Naming**: Original filename with .jpg extension

## When to Use

Usually, thumbnails are created automatically during `init`. Run this command when:

- You've manually edited `gallery.json`
- You've changed the thumbnail size
- You've added new images manually
- Thumbnails are missing or corrupted

## Performance

- Uses Sharp for fast image processing
- Processes images in parallel
- Skips existing thumbnails (unless changed)
- Shows progress for large galleries

## Examples

### Regenerate thumbnails
```bash
npx simple-photo-gallery thumbnails
```

### Process entire photo collection
```bash
npx simple-photo-gallery thumbnails -g ~/Pictures -r
```