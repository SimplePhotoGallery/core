# Deployment Guide

There are three main ways to deploy your Simple Photo Gallery, depending on where you want to host your photos and how you want to manage them.

## Option 1: Same Folder Deployment (Simplest)

**Best for**: Personal use, local sharing, simple setups

### How it works
- Gallery HTML is created in the same folder as your photos
- Photos stay in their original location
- Everything is self-contained in one folder

### Steps

```bash
cd /path/to/your/photos
npx simple-photo-gallery init
npx simple-photo-gallery thumbnails
npx simple-photo-gallery build
```

### Folder structure after build:
```
my-photos/
├── photo1.jpg              # Original photos
├── photo2.jpg
├── video1.mp4
├── index.html              # Gallery webpage
├── gallery/
│   ├── thumbnails/         # Generated thumbnails
│   ├── assets/            # CSS/JS files
│   └── ...
└── gallery.json           # Gallery configuration
```

### Pros & Cons
✅ Simple and fast  
✅ Everything in one place  
✅ Easy to zip and share  
❌ Large folder size with duplicated assets  
❌ Photos and gallery mixed together  

## Option 2: Separate Folder (Clean Organization)

**Best for**: Better organization, easier deployment, keeping photos separate

### How it works
- Gallery is built in a separate folder
- Photos are copied to the gallery folder
- Original photos remain untouched

### Steps

```bash
# Initialize gallery pointing to photos folder
npx simple-photo-gallery init -p /path/to/photos -g /path/to/gallery

# Generate thumbnails  
npx simple-photo-gallery thumbnails -g /path/to/gallery

# Build the gallery
npx simple-photo-gallery build -g /path/to/gallery
```

### Folder structure after build:
```
/path/to/photos/            # Original photos (unchanged)
├── photo1.jpg
├── photo2.jpg
└── video1.mp4

/path/to/gallery/           # Gallery output
├── photos/                 # Copied photos
│   ├── photo1.jpg
│   ├── photo2.jpg
│   └── video1.mp4
├── gallery/
│   ├── thumbnails/
│   ├── assets/
│   └── ...
├── index.html
└── gallery.json
```

### Pros & Cons
✅ Clean separation of photos and gallery  
✅ Easy to deploy gallery folder  
✅ Originals preserved safely  
❌ Photos are duplicated (uses more disk space)  
❌ Need to rebuild after photo changes  

## Option 3: External Photo Hosting (CDN/Cloud)

**Best for**: Large galleries, fast loading, professional sites, bandwidth optimization

### How it works
- Photos are uploaded to external hosting (CDN, cloud storage, etc.)
- Gallery contains only HTML/CSS/JS (very small)
- Photos load from external URLs

### Steps

```bash
# Initialize with base URL
npx simple-photo-gallery init -p /path/to/photos -g /path/to/gallery

# Generate thumbnails locally
npx simple-photo-gallery thumbnails -g /path/to/gallery

# Build with base URL (no photo copying)
npx simple-photo-gallery build -g /path/to/gallery -b https://photos.example.com/my-gallery/
```

### Upload photos manually to your hosting
- Upload original photos to `https://photos.example.com/my-gallery/`
- Upload thumbnails to `https://photos.example.com/my-gallery/gallery/thumbnails/`

### Folder structure:
```
/path/to/gallery/           # Gallery output (tiny, fast)
├── gallery/
│   ├── assets/             # Only CSS/JS files
│   └── ...
├── index.html              # Points to external photos
└── gallery.json

External hosting:           # Your CDN/cloud storage
└── https://photos.example.com/my-gallery/
    ├── photo1.jpg          # Original photos
    ├── photo2.jpg
    ├── gallery/
    │   └── thumbnails/     # Thumbnails
    └── ...
```

### Pros & Cons
✅ Fastest loading with CDN  
✅ Smallest gallery size  
✅ Professional setup  
✅ Bandwidth optimization  
❌ More complex setup  
❌ Requires external hosting  
❌ Manual photo uploads  

## Hosting on Cloudflare Pages

Cloudflare Pages offers free hosting with CDN benefits. Here's how to deploy each option:

### Option 1 & 2: Upload Gallery Folder

1. **Build your gallery** using Option 1 or 2 above
2. **Create a Cloudflare account** at [pages.cloudflare.com](https://pages.cloudflare.com)
3. **Upload your gallery folder**:
   - Click "Create a project" → "Direct upload"  
   - Drag your gallery folder (or the photos folder for Option 1)
   - Click "Deploy site"
4. **Get your URL**: `https://your-project.pages.dev`

### Option 3: Using Cloudflare R2 for Photos

For Option 3 with external hosting, you can use Cloudflare R2 storage:

1. **Setup R2 bucket**:
   - Go to Cloudflare dashboard → R2 Object Storage
   - Create a new bucket (e.g., `my-photos`)
   - Enable public access

2. **Upload photos to R2**:
   - Upload your original photos and thumbnails
   - Note your public URL: `https://pub-xxxxx.r2.dev/`

3. **Build gallery with R2 URL**:
   ```bash
   npx simple-photo-gallery build -b https://pub-xxxxx.r2.dev/
   ```

4. **Deploy gallery to Pages**:
   - Upload just the gallery folder to Cloudflare Pages
   - Your gallery will load photos from R2

### Benefits of Cloudflare
- **Free tier**: Generous limits for personal use
- **Global CDN**: Fast loading worldwide  
- **HTTPS**: Automatic SSL certificates
- **Custom domains**: Use your own domain name
- **Analytics**: Built-in traffic stats

## Choosing the Right Option

| Use Case | Best Option | Reason |
|----------|-------------|---------|
| Personal/family sharing | Option 1 | Simple, self-contained |
| Photography portfolio | Option 2 or 3 | Professional appearance |
| Large galleries (1000+ photos) | Option 3 | Performance and bandwidth |
| Frequent updates | Option 1 | Easy to rebuild |
| Professional site | Option 3 | Fastest loading, scalable |
| Backup/archival | Option 2 | Clear organization |

## Performance Tips

### For all options:
- Use WebP format for smaller file sizes
- Keep photos under 2MB each for web use
- Optimize photos before building: 
  ```bash
  # Using ImageMagick
  magick photo.jpg -quality 85 -resize 2560x1440> optimized.jpg
  ```

### For Option 3:
- Use a CDN (Cloudflare, AWS CloudFront, etc.)
- Enable gzip compression
- Set proper cache headers
- Consider lazy loading for large galleries

## Troubleshooting Deployment

**Gallery loads but photos don't show (Option 3)**
- Check that base URL is accessible  
- Verify photos are uploaded to correct paths
- Check CORS settings on your hosting

**Large build times**
- Use Option 3 for large galleries
- Optimize photos before building
- Consider breaking into sub-galleries

**Slow loading**
- Enable CDN on your hosting
- Optimize image sizes
- Use Option 3 for better performance

**Build fails**
- Check disk space (Option 1 & 2 duplicate photos)
- Verify all paths in gallery.json are correct
- Check file permissions