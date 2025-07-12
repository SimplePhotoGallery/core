# Using External Images Without Copying

This template supports using images from external directories without copying them into the template. This is useful when you have a large collection of photos that you don't want to duplicate.

## How It Works

The template uses **symbolic links** to make external images accessible to the web server:

1. **Symbolic Links**: Images from external directories are linked into the template's `public` directory
2. **Web-Accessible Paths**: Images are served from `/images/` and `/thumbnails/` URLs
3. **No Duplication**: Original files remain in their external location
4. **Automatic Setup**: Scripts handle the linking process

## Method 1: Convert and Setup (Recommended)

For existing galleries like the tmp folder:

1. **Convert the gallery format:**

   ```bash
   cd template
   node convert-tmp-gallery.js
   ```

2. **Set up symbolic links:**

   ```bash
   node setup-external-images.js
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

## Method 2: Manual Configuration

1. **Update the gallery.json file** to use web-accessible paths:

```json
{
  "title": "My Photo Gallery",
  "description": "A collection of photos from my camera",
  "externalImagePath": "../tmp",
  "sections": [
    {
      "title": "My Photos",
      "description": "A collection of photos from my camera",
      "images": [
        {
          "path": "/images/usa-127.jpg",
          "alt": "Black Rock camping in Joshua Tree National Park",
          "description": "Photo from my collection",
          "width": 2880,
          "height": 2160,
          "thumbnail": {
            "path": "/thumbnails/usa-127.jpg",
            "width": 267,
            "height": 200
          }
        }
      ]
    }
  ]
}
```

2. **Set up symbolic links:**
   ```bash
   node setup-external-images.js
   ```

## Method 3: Convert Any Gallery (Flexible)

For any gallery format, use the flexible conversion script:

```bash
cd template
node convert-any-gallery.js <gallery-path> <image-path> [output-path]
```

**Examples:**

```bash
# Convert photos-example
node convert-any-gallery.js ../photos-example/gallery.json ../photos-example

# Convert tmp gallery
node convert-any-gallery.js ../tmp/.simple-photo-gallery/gallery.json ../tmp

# Convert with custom output
node convert-any-gallery.js ../my-photos/gallery.json ../my-photos ./my-gallery.json
```

## Directory Structure

```
simple-photo-gallery-public/
├── tmp/
│   ├── usa-127.jpg
│   ├── usa-129.jpg
│   ├── usa-130.jpg
│   └── .simple-photo-gallery/
│       ├── gallery.json (existing format)
│       └── thumbnails/
├── photos-example/
│   ├── photo_1.jpg
│   ├── photo_2.jpg
│   └── gallery.json (CLI output)
└── template/
    ├── gallery.json (template format)
    ├── convert-tmp-gallery.js
    ├── setup-external-images.js
    ├── convert-any-gallery.js
    ├── public/
    │   ├── images/ (symbolic links to external images)
    │   └── thumbnails/ (symbolic links to external thumbnails)
    └── src/
```

## Key Points

- **Web Paths**: Images use `/images/` and `/thumbnails/` paths (not relative paths)
- **Symbolic Links**: Files are linked, not copied
- **External Storage**: Original files stay in external directories
- **Automatic Setup**: Scripts handle the conversion and linking

## Benefits

- ✅ No image duplication
- ✅ Works with large photo collections
- ✅ Maintains original file organization
- ✅ Easy to update when new photos are added
- ✅ Saves disk space
- ✅ Supports multiple gallery formats
- ✅ Web server can serve the images

## Notes

- Symbolic links must be recreated if you move the template directory
- The `setup-external-images.js` script handles creating the links
- Images are served from `/images/` and `/thumbnails/` URLs
- Videos are not supported in the current template format (only images)
