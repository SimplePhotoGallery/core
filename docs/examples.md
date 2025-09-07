# Quick Examples

Here are copy-paste examples for common gallery setups.

## Basic Gallery (5 minutes)

Create a simple gallery in your photos folder:

```bash
# Navigate to your photos
cd /path/to/your/photos

# Create the gallery (3 commands)
npx simple-photo-gallery init --default
npx simple-photo-gallery thumbnails
npx simple-photo-gallery build

# Open in browser
open index.html
```

## Organized Gallery with Sections

For a gallery with multiple sections (e.g., "Vacation", "Family", "Events"):

```bash
# 1. Create basic gallery
npx simple-photo-gallery init --default

# 2. Edit gallery.json to add sections
cat > gallery.json << 'EOF'
{
  "title": "My Photo Collection",
  "description": "Family photos organized by category", 
  "headerImage": "best-photo.jpg",
  "thumbnailSize": 200,
  "metadata": { "ogUrl": "" },
  "sections": [
    {
      "title": "Vacation Photos",
      "description": "Summer adventures",
      "images": []
    },
    {
      "title": "Family Events", 
      "description": "Birthdays and celebrations",
      "images": []
    }
  ],
  "subGalleries": { "title": "", "galleries": [] }
}
EOF

# 3. Re-run init to populate sections
npx simple-photo-gallery init --default

# 4. Build gallery
npx simple-photo-gallery thumbnails
npx simple-photo-gallery build
```

## Multi-Folder Gallery (Sub-galleries)

If you have photos organized in subfolders:

```
photos/
├── vacation2023/
├── wedding/
└── family-events/
```

```bash
cd photos

# Create galleries for each subfolder
npx simple-photo-gallery init --recursive --default

# Generate thumbnails for all
npx simple-photo-gallery thumbnails --recursive  

# Build all galleries
npx simple-photo-gallery build --recursive
```

## Deploy to Cloudflare Pages

After building your gallery:

1. Go to [pages.cloudflare.com](https://pages.cloudflare.com)
2. Click "Create a project" → "Direct upload"
3. Drag your photos folder (or gallery folder)  
4. Click "Deploy site"
5. Get your URL: `https://your-gallery.pages.dev`

## Professional Setup (External Hosting)

For large galleries or professional use:

```bash
# Create gallery in separate folder
npx simple-photo-gallery init \
  --photos /path/to/photos \
  --gallery /path/to/gallery-output

# Generate thumbnails
npx simple-photo-gallery thumbnails --gallery /path/to/gallery-output

# Build with external URL (no photo copying)
npx simple-photo-gallery build \
  --gallery /path/to/gallery-output \
  --base-url https://your-cdn.com/photos/

# Upload photos manually to your-cdn.com/photos/
# Deploy /path/to/gallery-output to your web host
```

## One-liner for Testing

Test the gallery on sample photos:

```bash
mkdir test-gallery && cd test-gallery && \
curl -o photo1.jpg "https://picsum.photos/800/600" && \
curl -o photo2.jpg "https://picsum.photos/600/800" && \
npx simple-photo-gallery init --default && \
npx simple-photo-gallery thumbnails && \
npx simple-photo-gallery build && \
echo "Gallery ready! Open index.html in your browser"
```