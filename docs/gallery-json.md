# Gallery Configuration (gallery.json)

The `gallery.json` file controls your gallery's appearance and organization. While `init` creates this automatically, you can edit it for full control.

## Basic Structure

```json
{
  "title": "My Gallery",
  "description": "A collection of my photos",
  "headerImage": "path/to/header.jpg",
  "thumbnailSize": 200,
  "metadata": {
    "ogUrl": "https://example.com/gallery"
  },
  "sections": [...],
  "subGalleries": {...}
}
```

## Top-Level Fields

### title
Gallery name shown in header and browser tab.
```json
"title": "Summer Vacation 2024"
```

### description
Subtitle text shown below the title.
```json
"description": "Two weeks exploring the coast"
```

### headerImage
Hero image at the top of the gallery.
```json
"headerImage": "photos/sunset.jpg"
```

### thumbnailSize
Width/height in pixels for square thumbnails.
```json
"thumbnailSize": 250
```

### metadata.ogUrl
URL for social media sharing previews.
```json
"metadata": {
  "ogUrl": "https://mysite.com/gallery"
}
```

### mediaBaseUrl (optional)
Base URL prepended to all photo paths.
```json
"mediaBaseUrl": "https://cdn.example.com/photos/"
```

### galleryOutputPath (optional)
Where to output the built gallery files.
```json
"galleryOutputPath": "../public/gallery"
```

## Sections

Organize photos into visual groups. Each section can have a title and description.

### Single Section (Default)
```json
"sections": [
  {
    "images": [...]
  }
]
```

### Multiple Sections
```json
"sections": [
  {
    "title": "Day 1 - Arrival",
    "description": "Landing and exploring the city",
    "images": [...]
  },
  {
    "title": "Day 2 - Beach Day",
    "description": "Sun, sand, and surf",
    "images": [...]
  }
]
```

## Image Objects

Each image in a section:

```json
{
  "type": "image",
  "path": "photos/beach.jpg",
  "alt": "Sunset at the beach",
  "width": 4000,
  "height": 3000,
  "thumbnail": {
    "path": "gallery/thumbnails/beach.jpg",
    "pathRetina": "gallery/thumbnails/beach@2x.jpg",
    "width": 200,
    "height": 200
  }
}
```

### Video Objects

Videos work the same way:

```json
{
  "type": "video",
  "path": "videos/waves.mp4",
  "width": 1920,
  "height": 1080,
  "thumbnail": {
    "path": "gallery/thumbnails/waves.jpg",
    "pathRetina": "gallery/thumbnails/waves@2x.jpg",
    "width": 200,
    "height": 200
  }
}
```

## Sub-Galleries

Link to other galleries (useful with `--recursive`):

```json
"subGalleries": {
  "title": "More Albums",
  "galleries": [
    {
      "title": "Japan Trip",
      "headerImage": "japan/temple.jpg",
      "path": "japan/"
    },
    {
      "title": "NYC Weekend",
      "headerImage": "nyc/skyline.jpg", 
      "path": "nyc/"
    }
  ]
}
```

## Common Edits

### Change Photo Order
Move image objects within the `images` array.

### Create Sections
Split your images array into multiple sections with titles.

### Add Photo Captions
Add `"alt": "Description"` to any image object.

### Remove Photos
Delete image objects from the array.

### Change Header Image
Update the `headerImage` path.

## Example: Multi-Section Gallery

```json
{
  "title": "European Adventure",
  "description": "Three weeks across Europe",
  "headerImage": "photos/eiffel-tower.jpg",
  "thumbnailSize": 200,
  "metadata": {
    "ogUrl": "https://example.com/europe-2024"
  },
  "sections": [
    {
      "title": "Paris",
      "description": "City of lights",
      "images": [
        {
          "type": "image",
          "path": "photos/eiffel-tower.jpg",
          "alt": "Eiffel Tower at sunset",
          "width": 4000,
          "height": 3000,
          "thumbnail": {
            "path": "gallery/thumbnails/eiffel-tower.jpg",
            "pathRetina": "gallery/thumbnails/eiffel-tower@2x.jpg",
            "width": 200,
            "height": 200
          }
        }
      ]
    },
    {
      "title": "Rome", 
      "description": "The eternal city",
      "images": [
        {
          "type": "image",
          "path": "photos/colosseum.jpg",
          "alt": "The Colosseum",
          "width": 4000,
          "height": 3000,
          "thumbnail": {
            "path": "gallery/thumbnails/colosseum.jpg",
            "pathRetina": "gallery/thumbnails/colosseum@2x.jpg",
            "width": 200,
            "height": 200
          }
        }
      ]
    }
  ],
  "subGalleries": {
    "title": "Other Trips",
    "galleries": []
  }
}
```

## Tips

1. **Backup first** - Copy gallery.json before editing
2. **Validate JSON** - Use a JSON validator to check syntax
3. **Regenerate thumbnails** - Run `thumbnails` command after changing size
4. **Test locally** - Run `build` to preview changes