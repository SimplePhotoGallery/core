# Gallery Configuration

The `gallery.json` file controls your gallery's structure, metadata, and organization. This file is created by the `init` command but can be manually edited for advanced customization.

## Basic Structure

```json
{
  "title": "My Photo Gallery",
  "description": "A collection of my favorite photos",
  "headerImage": "photos/sunset.jpg",
  "thumbnailSize": 200,
  "metadata": {
    "ogUrl": "https://mywebsite.com/gallery"
  },
  "galleryOutputPath": "./gallery-output",
  "mediaBaseUrl": "https://photos.example.com/",
  "sections": [...],
  "subGalleries": {...}
}
```

## Root Properties

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Gallery title shown in header |
| `description` | string | Gallery description/subtitle |
| `headerImage` | string | Path to header background image |
| `sections` | array | Array of gallery sections (see below) |
| `subGalleries` | object | Sub-gallery configuration (see below) |

### Optional Fields

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `thumbnailSize` | number | Thumbnail height in pixels | `200` |
| `metadata.ogUrl` | string | URL for social media sharing | `""` |
| `galleryOutputPath` | string | Where to build the gallery | Same as gallery.json location |
| `mediaBaseUrl` | string | Base URL for external photo hosting | None |

## Sections

Sections let you organize photos into categories with titles and descriptions.

### Single Section (Simple Gallery)

```json
{
  "sections": [
    {
      "images": [
        {
          "type": "image",
          "path": "photos/photo1.jpg", 
          "alt": "Photo description",
          "width": 1920,
          "height": 1080,
          "thumbnail": {
            "path": "gallery/thumbnails/photo1.jpg",
            "pathRetina": "gallery/thumbnails/photo1@2x.jpg", 
            "width": 200,
            "height": 113
          }
        }
      ]
    }
  ]
}
```

### Multiple Sections

```json
{
  "sections": [
    {
      "title": "Vacation Photos",
      "description": "Summer trip to the mountains",
      "images": [
        // vacation photos here
      ]
    },
    {
      "title": "Family Events", 
      "description": "Birthday parties and celebrations",
      "images": [
        // family photos here
      ]
    },
    {
      "title": "Nature Photography",
      "description": "Wildlife and landscape shots",
      "images": [
        // nature photos here  
      ]
    }
  ]
}
```

### Section Properties

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | No | Section heading |
| `description` | string | No | Section description |  
| `images` | array | Yes | Array of media files |

## Media Files

Each photo or video in the `images` array has this structure:

```json
{
  "type": "image",
  "path": "photos/sunset.jpg",
  "alt": "Beautiful sunset over the ocean", 
  "width": 2560,
  "height": 1440,
  "thumbnail": {
    "path": "gallery/thumbnails/sunset.jpg",
    "pathRetina": "gallery/thumbnails/sunset@2x.jpg",
    "width": 200,
    "height": 113
  },
  "lastMediaTimestamp": "2023-07-15T18:30:00Z"
}
```

### Media File Properties

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | `"image"` or `"video"` |
| `path` | string | Yes | Path to original file |
| `alt` | string | No | Alternative text for accessibility |
| `width` | number | Yes | Original width in pixels |
| `height` | number | Yes | Original height in pixels |
| `thumbnail` | object | No | Thumbnail information |
| `lastMediaTimestamp` | string | No | ISO timestamp from EXIF data |

### Thumbnail Object

| Field | Type | Description |
|-------|------|-------------|
| `path` | string | Path to thumbnail image |
| `pathRetina` | string | Path to high-DPI thumbnail |
| `width` | number | Thumbnail width |
| `height` | number | Thumbnail height |

## Sub-Galleries

Sub-galleries create a hierarchical structure for organizing multiple galleries.

```json
{
  "subGalleries": {
    "title": "Photo Collections",
    "galleries": [
      {
        "title": "Vacation 2023",
        "headerImage": "vacation2023/beach.jpg",
        "path": "vacation2023"
      },
      {
        "title": "Wedding Photos", 
        "headerImage": "wedding/ceremony.jpg",
        "path": "wedding"
      }
    ]
  }
}
```

### Sub-Gallery Properties

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Sub-galleries section title |
| `galleries` | array | Array of sub-gallery objects |

Each sub-gallery object:

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Sub-gallery title |
| `headerImage` | string | Path to header image |
| `path` | string | Relative path to sub-gallery folder |

## Deployment Settings

### Same Folder Deployment

For building in the same folder as photos:

```json
{
  "galleryOutputPath": null,
  "mediaBaseUrl": null
}
```

### Separate Folder Deployment  

For building in a different folder with copied photos:

```json
{
  "galleryOutputPath": "/path/to/output/gallery",
  "mediaBaseUrl": null
}
```

### External Hosting Deployment

For hosting photos separately (e.g., CDN):

```json
{
  "galleryOutputPath": "/path/to/output/gallery", 
  "mediaBaseUrl": "https://photos.example.com/gallery/"
}
```

## Manual Editing Tips

1. **Backup first**: Copy your `gallery.json` before editing
2. **Validate JSON**: Use a JSON validator to check syntax
3. **Test locally**: Run `build` command after editing
4. **Relative paths**: Keep paths relative to the gallery.json location
5. **Regenerate thumbnails**: Run `thumbnails` command if you change images

## Common Edits

### Change Gallery Title/Description

```json
{
  "title": "My New Gallery Title",
  "description": "Updated description here"
}
```

### Reorder Photos

Drag items in the `images` array to reorder them in the gallery.

### Remove Photos

Delete items from the `images` array to exclude them from the gallery.

### Add Sections

Split a single section into multiple sections by adding `title` and `description` fields and reorganizing the `images` arrays.

### Change Header Image

```json
{
  "headerImage": "path/to/new/header.jpg"
}
```

The header image should be high resolution and landscape orientation for best results.